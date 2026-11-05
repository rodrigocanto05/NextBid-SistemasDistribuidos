// Lances. O caminho crítico do sistema: tudo o que corre dentro de placeBidTx segura o lock do
// leilão (`select ... for no key update` no produto), e todos os lances desse leilão esperam por ele.
//
// Por isso, dentro da transação fica só o que tem de ser atómico com o lance:
//   lock do leilão -> validações -> lock dos saldos -> INSERT do lance -> escrow -> evento no outbox.
// Os efeitos secundários (aviso ao licitador coberto, avisos aos favoritos, XP, mensagem no chat)
// são feitos depois pelo worker, a partir do evento `bid.placed` (ver consumers/notifications.js).
// O evento é gravado na mesma transação, por isso nunca se perde nem anuncia um lance que falhou.
//
// Porquê FOR NO KEY UPDATE e não FOR UPDATE (encontrado no teste de stress com o worker a correr):
// cada INSERT numa tabela com chave estrangeira (notificações, chat, xp_logs...) pede um lock
// FOR KEY SHARE na linha referenciada (o utilizador, o leilão). FOR UPDATE choca com esse lock;
// com o worker a escrever avisos e XP em paralelo com os lances, isso dava deadlocks. Só
// alteramos colunas que não são chave (saldo, estado), por isso FOR NO KEY UPDATE chega: os lances
// do mesmo leilão continuam em fila (este modo choca consigo próprio), mas as verificações de FK
// dos outros processos já não esperam por eles.

const db = require('../db/pool');
const { fail, fmtCr } = require('../lib/http');
const realtime = require('../realtime/socket');
const outbox = require('../messaging/outbox');
const events = require('../messaging/events');

async function placeBid(userId, productId, amount, requestId = null) {
    let result;
    try {
        result = await placeBidTx(userId, productId, amount, requestId);
    } catch (err) {
        if (err.code === '23505' && err.constraint === 'uq_bid_request') {
            const { rows } = await db.read('select usr_balance from users where usr_id = $1', [userId]);
            return { status: 'success', message: 'Licitação aceite!', new_balance: Number(rows[0].usr_balance), duplicate: true };
        }
        throw err;
    }

    // Só depois do commit: o evento de tempo real nunca anuncia um lance que acabou em rollback.
    if (result.realtime) realtime.toAuction(productId, 'bid:new', result.realtime);
    return result.response;
}

function placeBidTx(userId, productId, amount, requestId) {
    return db.tx(async c => {
        // 1. Lock do leilão: a partir daqui, os outros lances deste leilão esperam.
        const p = (
            await c.query(
                `select prd_start_price, prd_usr_id, prd_status, prd_name, prd_ends_at < now() as has_ended
                   from product where prd_id = $1 for no key update`,
                [productId],
            )
        ).rows[0];

        // 2. Pedido repetido (Idempotency-Key). Depois do lock: um pedido repetido em paralelo
        //    espera pelo primeiro e vê o lance já gravado.
        if (requestId) {
            const dup = await c.query(
                `select b.bid_id, u.usr_balance from bid b join users u on u.usr_id = b.bid_usr_id
                  where b.bid_usr_id = $1 and b.bid_request_id = $2`,
                [userId, requestId],
            );
            if (dup.rowCount) {
                return {
                    response: { status: 'success', message: 'Licitação aceite!', new_balance: Number(dup.rows[0].usr_balance), duplicate: true },
                };
            }
        }

        // 3. Regras do leilão
        if (!p || p.prd_status !== 'active') throw fail('Este leilão já não está ativo.');
        if (p.has_ended) throw fail('Este leilão já terminou.');
        if (p.prd_usr_id === userId) throw fail('Não podes licitar no teu próprio leilão.');

        // 4. Lance mais alto atual e nº de lances, numa só ida à BD. O lock do passo 1 garante que
        //    ninguém insere um lance neste leilão entretanto, por isso a contagem é exata.
        const prev = (
            await c.query(
                `select bid_usr_id, bid_amount, (select count(*)::int from bid where bid_prd_id = $1) as total
                   from bid where bid_prd_id = $1
                  order by bid_amount desc, bid_id desc limit 1`,
                [productId],
            )
        ).rows[0];

        const minimum = prev ? Number(prev.bid_amount) : Number(p.prd_start_price);
        if (amount <= minimum) throw fail(`A tua licitação deve ser superior a ${fmtCr(minimum)}`);

        // 5. Locks nos saldos, sempre por ordem crescente de id (evita o deadlock do PHP).
        const ids = [...new Set([userId, prev ? prev.bid_usr_id : userId])].sort((a, b) => a - b);
        const balances = (
            await c.query('select usr_id, usr_balance, usr_name from users where usr_id = any($1::int[]) order by usr_id for no key update', [ids])
        ).rows;
        const me = balances.find(r => r.usr_id === userId);

        const selfRefund = prev && prev.bid_usr_id === userId ? Number(prev.bid_amount) : 0;
        const effective = Number(me.usr_balance) + selfRefund;
        if (effective < amount) {
            throw fail(`Saldo insuficiente. Tens ${fmtCr(effective)} disponíveis mas a licitação é de ${fmtCr(amount)}.`, {
                code: 'insufficient_funds',
                balance: effective,
                required: amount,
            });
        }

        // 6. O lance
        const bid = (
            await c.query(
                `insert into bid (bid_amount, bid_usr_id, bid_prd_id, bid_request_id)
                 values ($1, $2, $3, $4) returning bid_id, bid_created_at`,
                [amount, userId, productId, requestId],
            )
        ).rows[0];

        // 7. Escrow: devolve ao anterior, debita ao atual
        if (prev) {
            const prevId = prev.bid_usr_id;
            const prevAmt = Number(prev.bid_amount);
            await c.query('update users set usr_balance = usr_balance + $1 where usr_id = $2', [prevAmt, prevId]);
            await c.query(`insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description) values ($1, 'deposit', $2, $3)`, [
                prevId,
                prevAmt,
                prevId === userId ? `Reembolso da licitação anterior no leilão #${productId}` : `Reembolso por ter sido coberto no leilão #${productId}`,
            ]);
        }
        const newBalance = Number(
            (await c.query('update users set usr_balance = usr_balance - $1 where usr_id = $2 returning usr_balance', [amount, userId])).rows[0]
                .usr_balance,
        );
        await c.query(`insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description) values ($1, 'debit', $2, $3)`, [
            userId,
            amount,
            `Licitação no leilão #${productId}`,
        ]);

        // 8. Evento para o worker (um INSERT em vez de XP + avisos + chat com o lock preso)
        const bidderName = me.usr_name || 'Alguém';
        await outbox.enqueue(
            c,
            events.bidPlaced({
                product_id: productId,
                product_name: p.prd_name,
                bid_id: bid.bid_id,
                amount,
                bidder_id: userId,
                bidder_name: bidderName,
                previous_bidder_id: prev ? prev.bid_usr_id : null,
            }),
        );

        return {
            response: { status: 'success', message: 'Licitação aceite!', new_balance: newBalance },
            realtime: {
                product_id: productId,
                bid_id: bid.bid_id,
                amount,
                bidder_id: userId,
                bidder_name: bidderName,
                bid_count: (prev ? prev.total : 0) + 1,
                created_at: bid.bid_created_at,
            },
        };
    });
}

async function getByProduct(productId, limit = 20) {
    const { rows } = await db.read(
        `select b.bid_id, b.bid_amount, b.bid_created_at,
                u.usr_id as bidder_id, u.usr_name as bidder_name, u.usr_photo as bidder_photo
           from bid b join users u on b.bid_usr_id = u.usr_id
          where b.bid_prd_id = $1
          order by b.bid_amount desc, b.bid_created_at desc
          limit $2`,
        [productId, limit],
    );
    return rows;
}

async function getByUser(userId, limit = 50) {
    const { rows } = await db.read(
        `select b.bid_id, b.bid_amount, b.bid_created_at,
                p.prd_id, p.prd_name, p.prd_status, p.prd_ends_at,
                (select max(bid_amount) from bid where bid_prd_id = p.prd_id) as current_highest,
                (select img_path from product_image where img_prd_id = p.prd_id
                  order by img_is_primary desc, img_id asc limit 1) as main_image
           from bid b join product p on b.bid_prd_id = p.prd_id
          where b.bid_usr_id = $1
          order by b.bid_created_at desc
          limit $2`,
        [userId, limit],
    );
    return rows.map(r => ({ ...r, is_winning: Number(r.bid_amount) >= Number(r.current_highest) }));
}

module.exports = { placeBid, getByProduct, getByUser };
