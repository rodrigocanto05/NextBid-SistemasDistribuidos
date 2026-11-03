// Dados públicos de catálogo: categorias e números da página inicial.

const db = require('../db/pool');

async function categories() {
    const { rows } = await db.read(
        `select c.cat_id, c.cat_name, c.cat_type,
                (select count(*)::int from product where prd_cat_id = c.cat_id and prd_status = 'active') as active_count
           from category c order by c.cat_type asc, c.cat_name asc`,
    );
    return rows;
}

async function homeStats() {
    const { rows } = await db.read(
        `select (select count(*)::int from product where prd_status = 'active') as active_auctions,
                (select count(*)::int from bid) as total_bids,
                (select count(*)::int from product where prd_status = 'sold') as sold_auctions,
                (select count(*)::int from users where usr_role = 'normaluser') as total_users`,
    );
    return rows[0];
}

module.exports = { categories, homeStats };
