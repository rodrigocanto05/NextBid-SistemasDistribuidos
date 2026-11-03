// Consumidor "notifications" (corre no worker): os efeitos secundários de um lance aceite e de um
// leilão fechado, que antes eram feitos com o lock do leilão preso.
//
// Cada handler recebe o `c` da transação aberta por messaging/consumer.js, que já registou o
// evento em processed_event: tudo o que se faz aqui conta uma única vez, mesmo que o RabbitMQ
// entregue a mensagem duas vezes. O valor devolvido é usado depois do commit (afterCommit) para
// avisar os browsers de que há mensagens novas no chat.
//
// Ordem dos passos: primeiro os INSERT (só pedem locks FOR KEY SHARE, que não chocam com os
// FOR NO KEY UPDATE dos lances), e o UPDATE do XP no fim. Assim a linha do utilizador fica
// bloqueada o mínimo de tempo e um lance desse utilizador quase nunca espera pelo worker.

const { fmtCr } = require('../lib/http');
const { notify, chatSystem, giveRandomXp } = require('../services/common');
const { EventType } = require('../messaging/events');
const { QUEUES } = require('../messaging/topology');
const realtime = require('../realtime/emitter');

/** @param {import('pg').PoolClient} c @param {object} d payload de events.bidPlaced */
async function onBidPlaced(c, d) {
    const outbid = d.previous_bidder_id && d.previous_bidder_id !== d.bidder_id ? d.previous_bidder_id : null;
    if (outbid) {
        await notify(
            c,
            outbid,
            `Alguém cobriu a tua oferta em '${d.product_name}'! Nova licitação de ${fmtCr(d.amount)}. Os teus créditos foram devolvidos.`,
            'bid_outbid',
        );
    }

    // Todos os favoritos num só INSERT (antes: um INSERT por favorito, com o leilão bloqueado).
    // Quem licitou e quem foi coberto já têm o seu próprio aviso.
    await c.query(
        `insert into notifications (not_usr_id, not_message, not_type)
         select fav_usr_id, $2, 'favorite_bid' from product_favorite
          where fav_prd_id = $1 and fav_usr_id <> all($3::int[])`,
        [d.product_id, `Novo lance em '${d.product_name}' — agora em ${fmtCr(d.amount)}.`, [d.bidder_id, outbid || d.bidder_id]],
    );

    const chtId = await chatSystem(c, d.product_id, `💰 ${d.bidder_name} licitou ${fmtCr(d.amount)}`);
    await giveRandomXp(c, d.bidder_id, `Licitação no produto #${d.product_id}`);
    return { product_id: d.product_id, cht_id: chtId };
}

/** @param {import('pg').PoolClient} c @param {object} d payload de events.auctionClosed */
async function onAuctionClosed(c, d) {
    let text = '🏁 Leilão terminado sem licitações.';
    if (d.status === 'sold') {
        await notify(c, d.winner_id, `Parabéns! Ganhaste o leilão de ${d.product_name} por ${fmtCr(d.amount)}!`, 'auction_won');
        await notify(c, d.seller_id, `O teu leilão de ${d.product_name} foi vendido por ${fmtCr(d.amount)}!`, 'auction_sold');
        text = `🏁 Leilão terminado! Vencedor: ${d.winner_name || 'Vencedor'} por ${fmtCr(d.amount)}`;
    }
    const chtId = await chatSystem(c, d.product_id, text);
    if (d.status === 'sold') await giveRandomXp(c, d.winner_id, `Vitória no leilão #${d.product_id}`);
    return { product_id: d.product_id, cht_id: chtId };
}

// Depois do commit: a página do leilão vai buscar a mensagem nova ao chat logo, sem esperar pelo polling
function afterCommit(result) {
    if (result && result.cht_id) realtime.toAuction(result.product_id, 'chat:new', result);
}

module.exports = {
    name: 'notifications',
    queue: QUEUES.notifications.name,
    handlers: {
        [EventType.BID_PLACED]: onBidPlaced,
        [EventType.AUCTION_CLOSED]: onAuctionClosed,
    },
    afterCommit,
};
