// Leilões favoritos. Quem tem um leilão nos favoritos recebe avisos de lances novos (worker) e
// de que está a acabar (job de fecho).

const db = require('../db/pool');
const { fail } = require('../lib/http');
const { MAIN_IMAGE, CURRENT_BID, BID_COUNT } = require('./common');

async function list(userId) {
    const { rows } = await db.read(
        `select p.*, c.cat_name, f.fav_created_at,
                ${MAIN_IMAGE} as main_image, ${CURRENT_BID} as current_bid, ${BID_COUNT} as bid_count
           from product_favorite f
           join product p on f.fav_prd_id = p.prd_id
           join category c on p.prd_cat_id = c.cat_id
          where f.fav_usr_id = $1
          order by f.fav_created_at desc`,
        [userId],
    );
    return rows;
}

async function ids(userId) {
    const { rows } = await db.read('select fav_prd_id from product_favorite where fav_usr_id = $1', [userId]);
    return rows.map(r => r.fav_prd_id);
}

// Liga/desliga. Devolve true se ficou nos favoritos.
async function toggle(userId, productId) {
    return db.tx(async c => {
        const exists = await c.query('select 1 from product where prd_id = $1', [productId]);
        if (!exists.rowCount) throw fail('Leilão não encontrado.');
        const del = await c.query('delete from product_favorite where fav_usr_id = $1 and fav_prd_id = $2', [userId, productId]);
        if (del.rowCount) return false;
        await c.query('insert into product_favorite (fav_usr_id, fav_prd_id) values ($1, $2) on conflict do nothing', [userId, productId]);
        return true;
    });
}

module.exports = { list, ids, toggle };
