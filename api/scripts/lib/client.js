// Cliente HTTP mínimo da API do NextBid, partilhado pelos scripts de teste
// (smoke-test.js, stress-bids.js, bench-hot-auction.js).
//
// Usa os caminhos antigos (/backend/api/...php), tal como o frontend atual, por isso também
// prova que o Nginx e a API continuam a aceitá-los.

const PASSWORD = 'nextbid123';

// PNG 1x1 válido (os leilões precisam de pelo menos 3 imagens)
const PNG_1X1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

// "2026-11-03T14:05" na hora local, o formato do <input type="datetime-local"> do frontend
function localDateTime(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function createClient(baseUrl) {
    const API = `${String(baseUrl || 'http://localhost:8080').replace(/\/$/, '')}/backend/api`;

    // Devolve sempre um objeto: { http, instance, ...json }. http = 0 se a rede falhou.
    // Um 429 (limite de pedidos do Nginx em /api/auth) é repetido com espera: os scripts criam
    // muitas contas seguidas e o limite existe para travar ataques de força bruta, não testes.
    async function call(method, path, { token, body, form, headers: extra = {} } = {}) {
        for (let attempt = 0; ; attempt++) {
            const headers = { ...extra };
            if (token) headers.Authorization = `Bearer ${token}`;
            let payload;
            if (form) payload = form;
            else if (body !== undefined) {
                headers['Content-Type'] = 'application/json';
                payload = JSON.stringify(body);
            }
            let res;
            try {
                res = await fetch(`${API}${path}`, { method, headers, body: payload });
            } catch (err) {
                return { http: 0, status: 'network', message: err.message };
            }
            if (res.status === 429 && attempt < 40) {
                await res.arrayBuffer().catch(() => {});
                await sleep(250);
                continue;
            }
            const json = await res.json().catch(() => ({}));
            return { http: res.status, instance: res.headers.get('x-instance'), ...json };
        }
    }

    // Repete fn até não lançar (útil durante cenários de falha: uma instância pode cair a meio).
    async function retry(fn, tries = 5) {
        for (let i = 1; ; i++) {
            try {
                return await fn();
            } catch (err) {
                if (i >= tries) throw err;
                await sleep(500);
            }
        }
    }

    // Espera até check() devolver um valor "verdadeiro" (consistência eventual: o que é feito
    // pelos workers a partir do RabbitMQ aparece uns milissegundos depois da resposta da API).
    async function eventually(check, { timeoutMs = 10000, intervalMs = 100 } = {}) {
        const t0 = Date.now();
        let last;
        for (;;) {
            last = await check();
            if (last) return { ok: true, value: last, ms: Date.now() - t0 };
            if (Date.now() - t0 > timeoutMs) return { ok: false, value: last, ms: Date.now() - t0 };
            await sleep(intervalMs);
        }
    }

    // Regista, faz login e (opcionalmente) carrega créditos. Devolve { id, token, email }.
    async function newUser(tag, { deposit = 0 } = {}) {
        return retry(async () => {
            const email = `${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@test.pt`;
            await call('POST', '/auth/register.php', {
                body: { name: `Teste ${tag}`.slice(0, 80), email, password: PASSWORD, gender: 'O', birthdate: '1990-01-01' },
            });
            const login = await call('POST', '/auth/login.php', { body: { email, password: PASSWORD } });
            if (login.status !== 'success') throw new Error(`login falhou: ${JSON.stringify(login)}`);
            if (deposit > 0) {
                const dep = await call('POST', '/transactions/deposit.php', { token: login.token, body: { amount: deposit } });
                if (dep.status !== 'success') throw new Error(`depósito falhou: ${JSON.stringify(dep)}`);
            }
            return { id: login.user.id, token: login.token, email };
        });
    }

    async function categories() {
        const r = await call('GET', '/categories/list.php');
        if (r.status !== 'success') throw new Error(`categorias: ${JSON.stringify(r)}`);
        return r.categories;
    }

    // Leilão de produto com 3 imagens que termina daqui a `hours` horas.
    async function newAuction(seller, { name = 'Leilão de teste', startPrice = 1, hours = 2, categoryId } = {}) {
        return retry(async () => {
            const catId = categoryId || (await categories()).find(c => (c.cat_type || 'product') === 'product').cat_id;
            const fd = new FormData();
            fd.append('name', name);
            fd.append('description', 'Criado por um script de teste');
            fd.append('categoryId', String(catId));
            fd.append('condition', 'good');
            fd.append('startPrice', String(startPrice));
            fd.append('ends_at', localDateTime(new Date(Date.now() + hours * 3600 * 1000)));
            for (let i = 0; i < 3; i++) fd.append('images[]', new Blob([PNG_1X1], { type: 'image/png' }), `f${i}.png`);
            const r = await call('POST', '/auctions/create.php', { token: seller.token, form: fd });
            if (r.status !== 'success') throw new Error(`criar leilão falhou: ${JSON.stringify(r)}`);
            return r.id;
        });
    }

    // Todas as mensagens do chat de um leilão. Pagina com after_id, como o frontend (o endpoint
    // devolve no máximo 500 de cada vez), e elimina repetidas pelo id.
    async function allChat(productId) {
        const byId = new Map();
        let after = 0;
        for (;;) {
            const r = await call('GET', `/chat/get.php?product_id=${productId}&after_id=${after}&limit=500`);
            if (r.status !== 'success') throw new Error(`chat/get: ${JSON.stringify(r)}`);
            for (const m of r.messages) byId.set(m.cht_id, m);
            if (r.messages.length < 500 || r.last_id === after) return [...byId.values()];
            after = r.last_id;
        }
    }

    return { API, call, retry, eventually, newUser, newAuction, categories, allChat };
}

module.exports = { createClient, PASSWORD, PNG_1X1, sleep, localDateTime };
