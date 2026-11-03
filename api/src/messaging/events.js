// Contrato dos eventos de domínio: o que vai para a tabela outbox e depois para o RabbitMQ.
//
// Um evento descreve algo que JÁ aconteceu e ficou gravado (o lance foi aceite, o leilão fechou).
// Quem o consome (o worker de notificações, mais tarde o serviço de IA) decide o que fazer com ele;
// quem o produz não sabe quem o consome. Mudar um payload é mudar um contrato: acrescentar campos
// é seguro, remover ou mudar o significado obriga a subir a versão (V).

const V = 1;

const EventType = Object.freeze({
    BID_PLACED: 'bid.placed',
    AUCTION_CLOSED: 'auction.closed',
});

/**
 * Lance aceite (services/bids.js, dentro da transação do lance).
 * @param {object} d
 * @param {number} d.product_id
 * @param {string} d.product_name
 * @param {number} d.bid_id
 * @param {number} d.amount
 * @param {number} d.bidder_id
 * @param {string} d.bidder_name
 * @param {number|null} d.previous_bidder_id  quem tinha o lance mais alto antes (ou null)
 */
function bidPlaced(d) {
    return { type: EventType.BID_PLACED, aggregateId: d.product_id, data: d };
}

/**
 * Leilão fechado (services/auctions.js, dentro da transação do fecho).
 * @param {object} d
 * @param {number} d.product_id
 * @param {string} d.product_name
 * @param {number} d.seller_id
 * @param {'sold'|'expired'} d.status
 * @param {number|null} d.winner_id
 * @param {string|null} d.winner_name
 * @param {number|null} d.amount
 */
function auctionClosed(d) {
    return { type: EventType.AUCTION_CLOSED, aggregateId: d.product_id, data: d };
}

// Mensagem que segue no RabbitMQ. `id` é o evt_id do outbox: é com ele que os consumidores
// detetam repetições (a entrega é "pelo menos uma vez").
function envelope(row) {
    return {
        id: Number(row.evt_id),
        v: V,
        type: row.evt_type,
        occurred_at: row.evt_created_at,
        data: row.evt_payload,
    };
}

function isEnvelope(e) {
    return !!e && Number.isInteger(e.id) && e.id > 0 && typeof e.type === 'string' && e.data && typeof e.data === 'object';
}

module.exports = { V, EventType, bidPlaced, auctionClosed, envelope, isEnvelope };
