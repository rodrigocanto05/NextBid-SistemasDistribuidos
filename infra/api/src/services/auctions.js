// Leilões. Equivalente a AuctionManager.php + a parte de leilões do functions.php (lazy cron).

const db = require('../db/pool');
const { fail, fmtCr } = require('../lib/http');
const { notifyOnce, chatSystem, MAIN_IMAGE, CURRENT_BID, BID_COUNT } = require('./common');
const realtime = require('../realtime/socket');
const outbox = require('../messaging/outbox');
const events = require('../messaging/events');
const log = require('../lib/log');

async function getActive(lat = null, lng = null, radius = 50, type = null) {
    const geo = lat !== null && lng !== null;
    const distance = geo
        ? `, (6371 * acos(least(1, greatest(-1,
                cos(radians($1)) * cos(radians(p.prd_latitude)) * cos(radians(p.prd_longitude) - radians($2))
              + sin(radians($1)) * sin(radians(p.prd_latitude)))))) as distance`
        : '';
    const sql = `
        select * from (
            select p.*, c.cat_name,
                   ${MAIN_IMAGE} as main_image,
                   ${CURRENT_BID} as current_bid,
                   ${BID_COUNT} as bid_count
                   ${distance}
              from product p join category c on p.prd_cat_id = c.cat_id
             where p.prd_status = 'active'
        ) t
        where true
        ${geo ? 'and t.distance <= $3' : ''}
        ${type ? `and t.prd_type = $${geo ? 4 : 1}` : ''}
        order by t.prd_id desc`;
    const params = geo ? [lat, lng, radius] : [];
    if (type) params.push(type);
    const { rows } = await db.read(sql, params);
    return rows;
}

async function getById(productId) {
    const { rows } = await db.read(
        `select p.*, c.cat_name,
                u.usr_name as seller_name, u.usr_photo as seller_photo, u.usr_id as seller_id,
                (select avg(rev_rating) from review where rev_reviewed_usr_id = u.usr_id) as seller_rating,
                (select count(*)::int from review where rev_reviewed_usr_id = u.usr_id) as seller_reviews,
                ${CURRENT_BID} as current_bid,
                ${BID_COUNT} as bid_count
           from product p
           join category c on p.prd_cat_id = c.cat_id
           join users u on p.prd_usr_id = u.usr_id
          where p.prd_id = $1`,
        [productId],
    );
    if (!rows[0]) return null;
    const product = rows[0];
    const [images, attributes] = await Promise.all([
        db.read(
            `select img_id, img_path, img_is_primary from product_image
              where img_prd_id = $1 order by img_is_primary desc, img_id asc`,
            [productId],
        ),
        db.read(
            'select atr_id, atr_name, atr_value from product_attribute where atr_prd_id = $1 order by atr_name',
            [productId],
        ),
    ]);
    product.images = images.rows;
    product.attributes = attributes.rows;
    return product;
}

async function getBySeller(sellerId, status = null) {
    const params = [sellerId];
    let sql = `select p.*, c.cat_name, ${MAIN_IMAGE} as main_image, ${CURRENT_BID} as current_bid
                 from product p join category c on p.prd_cat_id = c.cat_id
                where p.prd_usr_id = $1`;
    if (status !== null) {
        sql += ' and p.prd_status = $2';
        params.push(status);
    }
    sql += ' order by p.prd_created_at desc';
    return (await db.read(sql, params)).rows;
}

async function getByWinner(winnerId) {
    const { rows } = await db.read(
        `select p.*, c.cat_name, u.usr_name as seller_name,
                ${MAIN_IMAGE} as main_image, ${CURRENT_BID} as final_price
           from product p
           join category c on p.prd_cat_id = c.cat_id
           join users u on p.prd_usr_id = u.usr_id
          where p.prd_winner_usr_id = $1
          order by p.prd_ends_at desc`,
        [winnerId],
    );
    return rows;
}

// Cria leilão + imagens + atributo de moeda + mensagem inicial no chat, numa só transação.
async function create(data) {
    return db.tx(async c => {
        let location = data.location;
        if (!location) {
            const r = await c.query('select usr_location from users where usr_id = $1', [data.userId]);
            location = (r.rows[0] && r.rows[0].usr_location ? r.rows[0].usr_location : '').trim();
        }

        let ends;
        try {
            ends = (
                await c.query(
                    `select $1::timestamptz as ends_at, $1::timestamptz < now() + interval '58 minutes' as too_soon`,
                    [data.endsAt],
                )
            ).rows[0];
        } catch {
            throw fail('Data de fim inválida.');
        }
        if (ends.too_soon) throw fail('O leilão tem de durar pelo menos 1 hora.');

        const cat = (await c.query('select cat_type from category where cat_id = $1', [data.categoryId])).rows[0];
        if (!cat) throw fail('Categoria inválida.');
        if (cat.cat_type !== data.type) {
            throw fail(data.type === 'service' ? 'Escolhe uma categoria de serviços.' : 'Escolhe uma categoria de produtos.');
        }

        const productId = (
            await c.query(
                `insert into product (prd_name, prd_description, prd_cat_id, prd_type, prd_condition, prd_start_price,
                                      prd_location, prd_latitude, prd_longitude, prd_ends_at, prd_usr_id)
                 values ($1, $2, $3, $11, $4, $5, $6, $7, $8, $9, $10) returning prd_id`,
                [
                    data.name,
                    data.description,
                    data.categoryId,
                    data.condition,
                    data.price,
                    location,
                    data.lat,
                    data.lng,
                    ends.ends_at,
                    data.userId,
                    data.type,
                ],
            )
        ).rows[0].prd_id;

        for (const [idx, path] of data.imagePaths.entries()) {
            await c.query('insert into product_image (img_path, img_prd_id, img_is_primary) values ($1, $2, $3)', [
                path,
                productId,
                idx === 0,
            ]);
        }

        await chatSystem(c, productId, `🎬 O leilão começou! Preço inicial: ${fmtCr(data.price)}`);
        return productId;
    });
}

// Cancelar. No PHP havia uma corrida: contava os lances e só depois cancelava, sem lock, por isso
// um lance podia entrar entre as duas operações. Aqui o `for no key update` no produto bloqueia os
// lances concorrentes (que pedem o mesmo lock) até o cancelamento terminar.
async function cancel(productId, userId) {
    return db.tx(async c => {
        const p = (await c.query('select prd_usr_id, prd_status from product where prd_id = $1 for no key update', [productId]))
            .rows[0];
        if (!p) throw fail('Leilão não encontrado.');
        if (p.prd_usr_id !== userId) throw fail('Sem permissão.');
        if (p.prd_status !== 'active') throw fail('Leilão não está ativo.');

        const n = (await c.query('select count(*)::int as n from bid where bid_prd_id = $1', [productId])).rows[0].n;
        if (n > 0) throw fail('Não podes cancelar com licitações.');

        await c.query(`update product set prd_status = 'expired' where prd_id = $1`, [productId]);
        return { status: 'success', message: 'Leilão cancelado.' };
    });
}

// ── Fecho de leilões ───────────────────────────────────────────────────────
//
// No PHP: o estado 'sold' era gravado num commit e o pagamento ao vendedor noutro (deposit()
// abria a sua própria transação). Uma falha entre os dois deixava o leilão vendido e o vendedor
// sem dinheiro. Aqui é tudo uma transação por leilão: estado + pagamento + evento `auction.closed`.
// Os avisos ao vencedor e ao vendedor, o XP e a mensagem no chat são feitos pelo worker a partir
// do evento (consumers/notifications.js), como nos lances.
//
// `for no key update skip locked` + `prd_status = 'active'`: se por algum motivo houver dois processos
// a fechar ao mesmo tempo (por exemplo, durante um failover), cada leilão é fechado uma única vez.

async function closeExpired() {
    const due = (
        await db.read(
            `select prd_id from product where prd_status = 'active' and prd_ends_at < now() order by prd_ends_at limit 50`,
        )
    ).rows;

    let closed = 0;
    for (const { prd_id: id } of due) {
        try {
            const ev = await closeOne(id);
            if (ev) {
                closed++;
                realtime.toAuction(id, 'auction:closed', ev);
            }
        } catch (err) {
            log.error(`erro ao fechar leilão ${id}: ${err.message}`);
        }
    }
    return closed;
}

function closeOne(id) {
    return db.tx(async c => {
        const p = (
            await c.query(
                `select prd_id, prd_name, prd_usr_id from product
                  where prd_id = $1 and prd_status = 'active' and prd_ends_at < now()
                  for no key update skip locked`,
                [id],
            )
        ).rows[0];
        if (!p) return null; // já fechado, ou a ser fechado por outro processo

        const winner = (
            await c.query(
                `select b.bid_usr_id, b.bid_amount, u.usr_name from bid b join users u on u.usr_id = b.bid_usr_id
                  where b.bid_prd_id = $1 order by b.bid_amount desc, b.bid_id desc limit 1`,
                [id],
            )
        ).rows[0];

        const closed = {
            product_id: id,
            product_name: p.prd_name,
            seller_id: p.prd_usr_id,
            status: winner ? 'sold' : 'expired',
            winner_id: winner ? winner.bid_usr_id : null,
            winner_name: winner ? winner.usr_name : null,
            amount: winner ? Number(winner.bid_amount) : null,
        };

        if (!winner) {
            await c.query(`update product set prd_status = 'expired' where prd_id = $1`, [id]);
        } else {
            await c.query(`update product set prd_status = 'sold', prd_winner_usr_id = $1 where prd_id = $2`, [closed.winner_id, id]);
            // O valor do vencedor já estava retido (escrow) desde o lance; só se credita o vendedor.
            await c.query('update users set usr_balance = usr_balance + $1 where usr_id = $2', [closed.amount, p.prd_usr_id]);
            await c.query(`insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description) values ($1, 'deposit', $2, $3)`, [
                p.prd_usr_id,
                closed.amount,
                `Venda do leilão #${id} - ${p.prd_name}`,
            ]);
        }
        await outbox.enqueue(c, events.auctionClosed(closed));

        // Evento de tempo real (emitido depois do commit, em closeExpired)
        return { product_id: id, status: closed.status, winner_id: closed.winner_id, amount: closed.amount };
    });
}

// executarLazyCronFavoritosTerminam: avisa quem tem o leilão nos favoritos na última hora.
async function notifyFavoritesEnding() {
    const rows = (
        await db.read(
            `select f.fav_usr_id, p.prd_id, p.prd_name
               from product_favorite f join product p on f.fav_prd_id = p.prd_id
              where p.prd_status = 'active' and p.prd_ends_at between now() and now() + interval '1 hour'`,
        )
    ).rows;
    if (!rows.length) return 0;
    let sent = 0;
    await db.tx(async c => {
        for (const r of rows) {
            // No PHP a chave de deduplicação era "leilão #<id>", que não aparece na mensagem, por isso
            // a deduplicação nunca funcionava e o aviso repetia-se a cada pedido. Aqui a chave é a
            // própria mensagem.
            const msg = `O leilão favorito '${r.prd_name}' termina em menos de 1 hora!`;
            const ok = await notifyOnce(c, r.fav_usr_id, msg, 'favorite_ending', msg);
            if (ok) sent++;
        }
    });
    return sent;
}

module.exports = { getActive, getById, getBySeller, getByWinner, create, cancel, closeExpired, notifyFavoritesEnding };
