// Avaliações: o vencedor de um leilão concluído avalia o vendedor (uma vez por leilão).

const db = require('../db/pool');
const { fail } = require('../lib/http');

async function create(userId, { productId, rating, comment }) {
    const { rows } = await db.read('select prd_usr_id, prd_winner_usr_id, prd_status from product where prd_id = $1', [productId]);
    const p = rows[0];
    if (!p) throw fail('Leilão inexistente.');
    if (!['sold', 'ended'].includes(p.prd_status)) throw fail('Só podes avaliar leilões concluídos.');
    if (p.prd_winner_usr_id !== userId) throw fail('Só o vencedor pode avaliar o vendedor.');

    try {
        await db.write(
            `insert into review (rev_usr_id, rev_reviewed_usr_id, rev_prd_id, rev_rating, rev_comment)
             values ($1, $2, $3, $4, $5)`,
            [userId, p.prd_usr_id, productId, rating, comment || null],
        );
    } catch (err) {
        if (err.code === '23505') throw fail('Já avaliaste este vendedor para este leilão.');
        throw err;
    }
}

async function forSeller(sellerId) {
    const [list, agg] = await Promise.all([
        db.read(
            `select r.rev_id, r.rev_rating, r.rev_comment, r.rev_created_at,
                    u.usr_id as reviewer_id, u.usr_name as reviewer_name, u.usr_photo as reviewer_photo,
                    p.prd_id as product_id, p.prd_name as product_name
               from review r
               join users u on r.rev_usr_id = u.usr_id
               join product p on r.rev_prd_id = p.prd_id
              where r.rev_reviewed_usr_id = $1
              order by r.rev_created_at desc`,
            [sellerId],
        ),
        db.read('select avg(rev_rating) as avg_rating, count(*)::int as total from review where rev_reviewed_usr_id = $1', [sellerId]),
    ]);
    const a = agg.rows[0];
    return {
        avg_rating: a.avg_rating ? Math.round(Number(a.avg_rating) * 100) / 100 : 0,
        total: a.total,
        reviews: list.rows,
    };
}

module.exports = { create, forSeller };
