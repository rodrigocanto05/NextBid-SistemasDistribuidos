const { createClient, PASSWORD, PNG_1X1, localDateTime } = require('./lib/client');

const api = createClient(process.argv[2] || 'http://localhost:8080');
const call = api.call;
const pngBlob = () => new Blob([PNG_1X1], { type: 'image/png' });

let failures = 0;
const ok = (cond, label, extra = '') => {
    if (cond) console.log(`  ok   ${label}`);
    else {
        failures++;
        console.log(`  FAIL ${label} ${extra}`);
    }
};

const notifTypes = async token => {
    const r = await call('GET', '/user/get_all_notifications.php?limit=50', { token });
    return (r.notifications || []).map(n => n.not_type);
};

(async () => {
    console.log(`NextBid smoke test em ${api.API}\n`);
    const stamp = Date.now();
    const emailA = `smoke.a.${stamp}@test.pt`;
    const emailB = `smoke.b.${stamp}@test.pt`;
    const emailC = `smoke.c.${stamp}@test.pt`;

    console.log('auth');
    const regA = await call('POST', '/auth/register.php', {
        body: { name: 'Smoke A', email: emailA, password: PASSWORD, gender: 'M', birthdate: '1999-01-01', location: 'Lisboa' },
    });
    ok(regA.status === 'success', 'register A', JSON.stringify(regA));
    await call('POST', '/auth/register.php', { body: { name: 'Smoke B', email: emailB, password: PASSWORD, gender: 'F', birthdate: '1998-02-02' } });
    await call('POST', '/auth/register.php', { body: { name: 'Smoke C', email: emailC, password: PASSWORD, gender: 'O', birthdate: '1997-03-03' } });
    const dup = await call('POST', '/auth/register.php', {
        body: { name: 'Smoke A', email: emailA.toUpperCase(), password: PASSWORD, gender: 'M', birthdate: '1999-01-01' },
    });
    ok(dup.status === 'error' && /email/i.test(dup.message), 'email duplicado (maiúsculas) recusado');

    const loginA = await call('POST', '/auth/login.php', { body: { email: emailA, password: PASSWORD } });
    const loginB = await call('POST', '/auth/login.php', { body: { email: emailB, password: PASSWORD } });
    const loginC = await call('POST', '/auth/login.php', { body: { email: emailC, password: PASSWORD } });
    ok(loginA.status === 'success' && loginA.token, 'login A');
    const bad = await call('POST', '/auth/login.php', { body: { email: emailA, password: 'errada123' } });
    ok(bad.http === 401, 'login com password errada -> 401');
    const seed = await call('POST', '/auth/login.php', { body: { email: 'rodrigocanto@hotmail.com', password: PASSWORD } });
    ok(seed.status === 'success', 'login de utilizador dos dados de teste');
    const A = loginA.token;
    const B = loginB.token;
    const C = loginC.token;
    const aId = loginA.user.id;

    console.log('carteira');
    ok((await call('POST', '/transactions/deposit.php', { token: A, body: { amount: 500 } })).status === 'success', 'depósito A');
    ok((await call('POST', '/transactions/deposit.php', { token: B, body: { amount: 500 } })).status === 'success', 'depósito B');
    await call('POST', '/transactions/deposit.php', { token: C, body: { amount: 500 } });
    const bal = await call('GET', '/transactions/balance.php', { token: A });
    ok(bal.balance === 500, 'saldo A = 500', JSON.stringify(bal));

    console.log('leilões');
    const cats = await call('GET', '/categories/list.php');
    ok(cats.status === 'success' && cats.categories.length > 0, 'categorias');
    const fd = new FormData();
    fd.append('name', 'Leilão smoke test');
    fd.append('description', 'Criado pelo smoke test');
    fd.append('categoryId', String(cats.categories.find(c => (c.cat_type || 'product') === 'product').cat_id));
    fd.append('condition', 'good');
    fd.append('startPrice', '10');
    fd.append('ends_at', localDateTime(new Date(Date.now() + 3 * 3600 * 1000)));
    for (let i = 0; i < 3; i++) fd.append('images[]', pngBlob(), `foto${i}.png`);
    const created = await call('POST', '/auctions/create.php', { token: A, form: fd });
    ok(created.status === 'success' && created.id > 0, 'criar leilão com 3 imagens', JSON.stringify(created));
    const pid = created.id;

    const active = await call('GET', '/auctions/get_active.php');
    ok(active.status === 'success' && active.auctions.some(a => a.prd_id === pid), 'get_active inclui o leilão novo');
    const near = await call('GET', '/auctions/get_active.php?lat=38.72&lng=-9.14&radius=50');
    ok(near.status === 'success', 'get_active com geolocalização');
    const one = await call('GET', `/auctions/get_by_id.php?product_id=${pid}`);
    ok(one.status === 'success' && one.data.images.length === 3, 'get_by_id com 3 imagens');
    ok((await call('GET', '/auctions/get_by_id.php?product_id=999999')).http === 404, 'get_by_id inexistente -> 404');

    console.log('lances');
    const own = await call('POST', '/bids/place.php', { token: A, body: { product_id: pid, amount: 20 } });
    ok(own.status === 'error', 'não licitar no próprio leilão');
    const low = await call('POST', '/bids/place.php', { token: B, body: { product_id: pid, amount: 5 } });
    ok(low.status === 'error', 'lance abaixo do preço inicial recusado');
    const b1 = await call('POST', '/bids/place.php', { token: B, body: { product_id: pid, amount: 15 } });
    ok(b1.status === 'success' && b1.new_balance === 485, 'lance B 15 créditos (saldo 485)', JSON.stringify(b1));
    const poor = await call('POST', '/bids/place.php', { token: B, body: { product_id: pid, amount: 9999 } });
    ok(poor.code === 'insufficient_funds', 'saldo insuficiente com code');
    const bids = await call('GET', `/bids/get_by_auction.php?product_id=${pid}&limit=50`);
    ok(bids.count === 1, 'get_by_auction');
    const mine = await call('GET', '/bids/my_bids.php?limit=50', { token: B });
    ok(mine.bids[0] && mine.bids[0].is_winning === true, 'my_bids com is_winning');
    ok((await call('POST', `/auctions/cancel.php`, { token: A, body: { product_id: pid } })).status === 'error', 'não cancelar com lances');

    console.log('favoritos, chat, notificações, perfil');
    ok((await call('POST', '/favorites/toggle.php', { token: B, body: { product_id: pid } })).favorited === true, 'favorito on');
    ok((await call('GET', '/favorites/ids.php', { token: B })).ids.includes(pid), 'favorites/ids');
    ok((await call('GET', '/favorites/list.php', { token: B })).count >= 1, 'favorites/list');
    ok((await call('POST', '/chat/send.php', { token: B, body: { product_id: pid, content: 'Olá!' } })).status === 'success', 'chat/send');
    const chat = await api.eventually(async () => (await call('GET', `/chat/get.php?product_id=${pid}`)).count >= 3);
    ok(chat.ok, `chat/get (início + lance + mensagem; ${chat.ms} ms)`);
    const notifsA = await call('GET', '/user/get_all_notifications.php?limit=50', { token: A });
    ok(notifsA.status === 'success', 'get_all_notifications');
    ok((await call('POST', '/user/mark_all_read.php', { token: A })).status === 'success', 'mark_all_read');
    const profA = await call('GET', `/user/profile.php?user_id=${aId}`, { token: A });
    ok(profA.data && profA.data.usr_email === emailA, 'perfil próprio com email');
    const profAbyB = await call('GET', `/user/profile.php?user_id=${aId}`, { token: B });
    ok(profAbyB.data && profAbyB.data.usr_email === undefined, 'perfil alheio sem email/saldo');
    ok((await call('POST', '/user/update_profile.php', { token: A, body: { bio: 'Bio do smoke test.' } })).status === 'success', 'update_profile');
    const pfd = new FormData();
    pfd.append('photo', pngBlob(), 'avatar.png');
    ok((await call('POST', '/user/update_photo.php', { token: A, form: pfd })).status === 'success', 'update_photo');
    ok((await call('POST', '/user/delete_photo.php', { token: A })).status === 'success', 'delete_photo');
    ok((await call('GET', '/stats/home.php')).status === 'success', 'stats/home');
    ok((await call('GET', `/reviews/get_for_seller.php?seller_id=${aId}`)).status === 'success', 'reviews/get_for_seller');
    ok((await call('POST', '/reviews/create.php', { token: B, body: { product_id: pid, rating: 5 } })).status === 'error', 'review antes do fim recusada');
    ok((await call('GET', '/auctions/my_selling.php', { token: A })).count >= 1, 'my_selling');
    ok((await call('GET', '/auctions/my_won.php', { token: B })).status === 'success', 'my_won');

    console.log('eventos assíncronos (outbox -> RabbitMQ -> worker)');
    // C cobre B. B tem o leilão nos favoritos, mas como foi coberto recebe só o aviso "cobriram a
    // tua oferta" (não o aviso de favorito). O vendedor A não recebe nada.
    const c1 = await call('POST', '/bids/place.php', { token: C, body: { product_id: pid, amount: 30 } });
    ok(c1.status === 'success', 'lance C 30 créditos');
    const outbid = await api.eventually(async () => (await notifTypes(B)).includes('bid_outbid'));
    ok(outbid.ok, `B avisado de que foi coberto (${outbid.ms} ms)`);
    const typesB = await notifTypes(B);
    ok(typesB.filter(t => t === 'bid_outbid').length === 1 && !typesB.includes('favorite_bid'), 'B recebeu exatamente 1 aviso', JSON.stringify(typesB));
    const bidMsgs = (await api.allChat(pid)).filter(m => m.cht_is_system && /licitou/.test(m.cht_content));
    ok(bidMsgs.length === 2, '1 mensagem "licitou" por lance (sem repetidas)', `(${bidMsgs.length})`);

    console.log('sessões');
    ok((await call('GET', '/transactions/balance.php')).http === 401, 'sem token -> 401');
    ok((await call('POST', '/auth/logout.php', { token: C })).status === 'success', 'logout');
    ok((await call('GET', '/transactions/balance.php', { token: C })).http === 401, 'token inválido após logout (revogado no PostgreSQL)');
    ok((await call('POST', '/auth/logout_all.php', { token: B })).status === 'success', 'logout_all');
    ok((await call('GET', '/transactions/balance.php', { token: B })).http === 401, 'token antigo inválido após logout_all');
    ok((await call('GET', '/auctions/get_active.php')).instance, 'header X-Instance presente');

    console.log(failures ? `\n${failures} falha(s)` : '\nTudo ok');
    process.exit(failures ? 1 : 0);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
