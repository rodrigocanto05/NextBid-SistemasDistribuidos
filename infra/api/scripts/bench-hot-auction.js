#!/usr/bin/env node
// Benchmark do "leilão quente": muitos lances ao mesmo tempo no MESMO leilão (o cenário de
// sniping dos últimos segundos). Todos esses lances disputam o mesmo lock (`select ... for update`
// no produto), por isso o débito máximo depende de quanto tempo cada lance segura esse lock.
//
// Mede, com os mesmos parâmetros, antes e depois de uma alteração:
//   * lances processados por segundo (aceites + recusados por valor) e aceites por segundo;
//   * latência por pedido (p50 / p95 / p99);
//   * quanto tempo depois do último lance os efeitos assíncronos ficam todos visíveis
//     (mensagens "licitou" no chat e avisos aos favoritos);
// e verifica as invariantes:
//   * lances estritamente crescentes por ordem de bid_id;
//   * dinheiro conservado (saldos + valor retido = depósitos);
//   * cada lance aceite gerou exatamente UMA mensagem no chat e UM aviso por favorito
//     (nenhum evento perdido nem duplicado).
//
// Uso:
//   node api/scripts/bench-hot-auction.js <url> [licitadores] [lances] [em_paralelo] [favoritos]
//   docker compose exec api1 node scripts/bench-hot-auction.js http://nginx 20 1500 40 50
//   Acrescentar --json para uma linha JSON no fim (comparar resultados).

const { createClient, sleep } = require('./lib/client');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const JSON_OUT = process.argv.includes('--json');
const BASE = args[0] || 'http://localhost:8080';
const BIDDERS = Number(args[1] || 20);
const BIDS = Number(args[2] || 1500);
const PARALLEL = Number(args[3] || 40);
const WATCHERS = Number(args[4] || 50);
const DEPOSIT = 100000;
const WARMUP = 20;

const api = createClient(BASE);

const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0);

async function inBatches(n, size, fn) {
    const out = [];
    for (let i = 0; i < n; i += size) {
        out.push(...(await Promise.all(Array.from({ length: Math.min(size, n - i) }, (_, k) => fn(i + k)))));
    }
    return out;
}

(async () => {
    console.log(`Leilão quente: ${BIDDERS} licitadores, ${BIDS} lances, ${PARALLEL} em paralelo, ${WATCHERS} favoritos (${api.API})`);

    // ── Preparação ──────────────────────────────────────────────────────
    const seller = await api.newUser('bench-seller');
    const bidders = await inBatches(BIDDERS, 5, i => api.newUser(`bench-b${i}`, { deposit: DEPOSIT }));
    const pid = await api.newAuction(seller, { name: 'Leilão quente (benchmark)' });
    const watchers = await inBatches(WATCHERS, 5, i => api.newUser(`bench-w${i}`));
    for (const w of watchers) {
        const r = await api.call('POST', '/favorites/toggle.php', { token: w.token, body: { product_id: pid } });
        if (r.favorited !== true) throw new Error(`favorito falhou: ${JSON.stringify(r)}`);
    }

    let amount = 1;
    const bid = async u => {
        const value = ++amount; // crescente por ordem de ENVIO; a ordem de chegada ao lock decide
        const t0 = performance.now();
        const r = await api.call('POST', '/bids/place.php', { token: u.token, body: { product_id: pid, amount: value } });
        return { ...r, ms: performance.now() - t0 };
    };

    // Aquecimento (ligações, JIT, caches): não conta para as medições
    for (let i = 0; i < WARMUP; i++) await bid(bidders[i % BIDDERS]);
    console.log(`  preparação concluída (leilão #${pid}); a disparar lances`);

    // ── Medição ─────────────────────────────────────────────────────────
    const results = new Array(BIDS);
    let next = 0;
    const t0 = performance.now();
    await Promise.all(
        Array.from({ length: PARALLEL }, async () => {
            while (next < BIDS) {
                const i = next++;
                results[i] = await bid(bidders[i % BIDDERS]);
            }
        }),
    );
    const elapsedS = (performance.now() - t0) / 1000;
    const tEnd = Date.now();

    const accepted = results.filter(r => r.status === 'success');
    const rejected = results.filter(r => r.status === 'error' && r.http === 200);
    const errors = results.filter(r => r.http >= 500 || r.http === 0);
    const lat = results.map(r => r.ms).sort((a, b) => a - b);
    const latOk = accepted.map(r => r.ms).sort((a, b) => a - b);

    const summary = {
        bidders: BIDDERS,
        bids: BIDS,
        parallel: PARALLEL,
        watchers: WATCHERS,
        seconds: Number(elapsedS.toFixed(2)),
        processed_per_s: Math.round((accepted.length + rejected.length) / elapsedS),
        accepted_per_s: Math.round(accepted.length / elapsedS),
        accepted: accepted.length,
        rejected: rejected.length,
        errors: errors.length,
        p50_ms: Math.round(pct(lat, 50)),
        p95_ms: Math.round(pct(lat, 95)),
        p99_ms: Math.round(pct(lat, 99)),
        accepted_p50_ms: Math.round(pct(latOk, 50)),
        accepted_p95_ms: Math.round(pct(latOk, 95)),
    };
    console.log(`  ${BIDS} pedidos em ${summary.seconds} s: ${accepted.length} aceites, ${rejected.length} recusados por valor, ${errors.length} erros`);
    console.log(`  débito: ${summary.processed_per_s} lances processados/s, ${summary.accepted_per_s} aceites/s`);
    console.log(`  latência: p50 ${summary.p50_ms} ms, p95 ${summary.p95_ms} ms, p99 ${summary.p99_ms} ms (aceites: p50 ${summary.accepted_p50_ms} ms, p95 ${summary.accepted_p95_ms} ms)`);
    if (errors.length) console.log(`  exemplo de erro: ${JSON.stringify(errors[0])}`);

    // ── Efeitos assíncronos: quando ficam todos visíveis? ─────────────────
    const totalAccepted = accepted.length + WARMUP; // o aquecimento também gerou lances aceites
    const hist = (await api.call('GET', `/bids/get_by_auction.php?product_id=${pid}&limit=500`)).bids || [];
    const bidCount = (await api.call('GET', `/auctions/get_by_id.php?product_id=${pid}`)).data.bid_count;
    const isBidMsg = m => m.cht_is_system && /licitou/.test(m.cht_content);
    const chatDone = await api.eventually(
        async () => (await api.allChat(pid)).filter(isBidMsg).length >= bidCount,
        { timeoutMs: 120000, intervalMs: 200 },
    );
    const chatBids = (await api.allChat(pid)).filter(isBidMsg).length;
    summary.events_visible_after_ms = Date.now() - tEnd;

    // Avisos aos favoritos: cada lance aceite gera um por favorito (nenhum favorito licita).
    // O endpoint devolve no máximo 500 notificações; acima disso só se verifica que há 500.
    let notifOk = true;
    if (WATCHERS > 0) {
        const expected = Math.min(bidCount, 500);
        const sample = watchers.slice(0, 5);
        for (const w of sample) {
            const done = await api.eventually(
                async () => {
                    const n = await api.call('GET', '/user/get_all_notifications.php?limit=500', { token: w.token });
                    return (n.notifications || []).filter(x => x.not_type === 'favorite_bid').length >= expected;
                },
                { timeoutMs: 60000, intervalMs: 250 },
            );
            const n = await api.call('GET', '/user/get_all_notifications.php?limit=500', { token: w.token });
            const got = (n.notifications || []).filter(x => x.not_type === 'favorite_bid').length;
            if (!done.ok || got !== expected) {
                notifOk = false;
                console.log(`  FAIL favorito ${w.id}: ${got} avisos, esperado ${expected}`);
            }
        }
        summary.events_visible_after_ms = Date.now() - tEnd;
    }

    // ── Invariantes ──────────────────────────────────────────────────────
    let ok = true;
    const byId = [...hist].sort((x, y) => x.bid_id - y.bid_id);
    for (let i = 1; i < byId.length; i++) {
        if (Number(byId[i].bid_amount) <= Number(byId[i - 1].bid_amount)) {
            ok = false;
            console.log(`  FAIL lance ${byId[i].bid_id} (${byId[i].bid_amount}) <= anterior`);
        }
    }
    if (bidCount !== totalAccepted) {
        ok = false;
        console.log(`  FAIL ${bidCount} lances na BD, ${totalAccepted} respostas "aceite"`);
    }
    if (!chatDone.ok || chatBids !== bidCount) {
        ok = false;
        console.log(`  FAIL ${chatBids} mensagens "licitou" no chat para ${bidCount} lances`);
    }
    if (!notifOk) ok = false;

    let sum = 0;
    for (const b of bidders) {
        const r = await api.call('GET', '/transactions/balance.php', { token: b.token });
        if (r.balance < 0) ok = false;
        sum += Number(r.balance);
    }
    const held = Number((await api.call('GET', `/auctions/get_by_id.php?product_id=${pid}`)).data.current_bid || 0);
    const money = sum + held === DEPOSIT * BIDDERS;
    if (!money) ok = false;

    console.log(`  efeitos assíncronos todos visíveis ${summary.events_visible_after_ms} ms depois do último lance`);
    console.log(`  chat: ${chatBids} mensagens "licitou" para ${bidCount} lances; dinheiro ${money ? 'conservado' : 'NÃO conservado'}`);
    console.log(ok ? '  OK: invariantes cumpridas' : '  FALHOU');
    summary.ok = ok;
    if (JSON_OUT) console.log(JSON.stringify(summary));
    await sleep(10);
    process.exit(ok ? 0 : 1);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
