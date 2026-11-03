const { createClient } = require('./lib/client');

const BASE = process.argv[2] || 'http://localhost:8080';
const USERS = Number(process.argv[3] || 8);
const BIDS = Number(process.argv[4] || 200);
const PARALLEL = Number(process.argv[5] || 50); // pedidos em simultâneo
const DEPOSIT = 100000;

const api = createClient(BASE);
const { call, retry } = api;
const API = api.API;
const newUser = tag => api.newUser(`stress.${tag}`, { deposit: DEPOSIT });
const newAuction = seller => api.newAuction(seller, { name: 'Leilão de stress' });

(async () => {
    console.log(`Stress de lances: ${USERS} licitadores, ${BIDS} lances, via ${API}`);
    const seller = await newUser('seller');
    const bidders = [];
    for (let i = 0; i < USERS; i++) bidders.push(await newUser(`b${i}`));
    const auctions = [await retry(() => newAuction(seller)), await retry(() => newAuction(seller))];
    console.log('  preparação concluída; a disparar lances');

    // Valores crescentes mas com colisões propositadas (vários pedidos com o mesmo valor)
    const jobs = [];
    for (let i = 0; i < BIDS; i++) {
        const u = bidders[i % USERS];
        const pid = auctions[i % 2];
        const amount = 2 + Math.floor(i / 3);
        jobs.push(() => call('POST', '/bids/place.php', { token: u.token, body: { product_id: pid, amount } }));
    }

    const t0 = Date.now();
    const results = new Array(jobs.length);
    let next = 0;
    await Promise.all(
        Array.from({ length: PARALLEL }, async () => {
            while (next < jobs.length) {
                const i = next++;
                results[i] = await jobs[i]();
            }
        }),
    );
    const ms = Date.now() - t0;

    const accepted = results.filter(r => r.status === 'success').length;
    const rejected = results.filter(r => r.status === 'error' && r.http === 200).length;
    const errors = results.filter(r => r.http >= 500 || r.http === 0);
    const byInstance = results.reduce((acc, r) => ((acc[r.instance] = (acc[r.instance] || 0) + 1), acc), {});

    console.log(`  ${BIDS} pedidos em ${ms} ms: ${accepted} aceites, ${rejected} recusados por regra, ${errors.length} erros 5xx`);
    console.log(`  por instância: ${JSON.stringify(byInstance)}`);
    if (errors.length) console.log(`  exemplo de erro: ${JSON.stringify(errors[0])}`);

    // Invariantes
    let ok = true;
    let sumBalances = 0;
    for (const b of bidders) {
        const r = await call('GET', '/transactions/balance.php', { token: b.token });
        if (r.balance < 0) {
            ok = false;
            console.log(`  FAIL saldo negativo: utilizador ${b.id} = ${r.balance}`);
        }
        sumBalances += r.balance;
    }
    let held = 0;
    for (const pid of auctions) {
        const a = await call('GET', `/auctions/get_by_id.php?product_id=${pid}`);
        held += Number(a.data.current_bid || 0);
        const hist = (await call('GET', `/bids/get_by_auction.php?product_id=${pid}&limit=500`)).bids;
        const byId = [...hist].sort((x, y) => x.bid_id - y.bid_id);
        for (let i = 1; i < byId.length; i++) {
            if (Number(byId[i].bid_amount) <= Number(byId[i - 1].bid_amount)) {
                ok = false;
                console.log(`  FAIL leilão ${pid}: lance ${byId[i].bid_id} (${byId[i].bid_amount}) <= anterior`);
            }
        }
    }
    const expected = DEPOSIT * USERS;
    const total = Math.round((sumBalances + held) * 100) / 100;
    console.log(`  saldos ${sumBalances.toFixed(2)} + retido ${held.toFixed(2)} = ${total.toFixed(2)} (esperado ${expected.toFixed(2)})`);
    if (total !== expected) ok = false;

    console.log(ok ? '  OK: invariantes cumpridas' : '  FALHOU');
    process.exit(ok ? 0 : 1);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
