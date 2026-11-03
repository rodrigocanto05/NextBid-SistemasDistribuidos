// Topologia no RabbitMQ (exchanges, filas e ligações entre eles). Declarada por quem publica e
// por quem consome, sempre com os mesmos argumentos: as declarações são idempotentes, por isso
// a ordem de arranque não importa e um RabbitMQ novo (volume vazio) fica configurado sozinho.
//
//   API (relay do outbox) ──publica──► nextbid.events (topic)
//                                          │ bid.placed, auction.closed
//                                          ▼
//                                    notifications (quorum) ──► worker1, worker2 (competem)
//                                          │ falha definitiva / demasiadas entregas
//                                          ▼
//                                    nextbid.events.dlx ──► notifications.dlq (para análise)
//
// Quorum queues: a fila é replicada com Raft pelos nós do cluster (com 1 nó funciona igual, sem
// réplicas). É o tipo recomendado para filas que não podem perder mensagens.

const EXCHANGE = 'nextbid.events';
const DEAD_LETTER_EXCHANGE = 'nextbid.events.dlx';

// Cada consumidor tem a sua fila: o mesmo evento chega a todas as filas ligadas a ele
// (o serviço de IA terá a sua, ligada a bid.placed, sem mexer nesta).
const QUEUES = {
    notifications: {
        name: 'notifications',
        bindings: ['bid.placed', 'auction.closed'],
        deadLetter: 'notifications.dlq',
        // Mensagem entregue mais vezes do que isto (worker a rebentar sempre na mesma) -> DLQ
        deliveryLimit: 10,
    },
};

async function assertTopology(ch) {
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    await ch.assertExchange(DEAD_LETTER_EXCHANGE, 'direct', { durable: true });
    for (const q of Object.values(QUEUES)) {
        await ch.assertQueue(q.deadLetter, { durable: true, arguments: { 'x-queue-type': 'quorum' } });
        await ch.bindQueue(q.deadLetter, DEAD_LETTER_EXCHANGE, q.name);
        await ch.assertQueue(q.name, {
            durable: true,
            arguments: {
                'x-queue-type': 'quorum',
                'x-dead-letter-exchange': DEAD_LETTER_EXCHANGE,
                'x-dead-letter-routing-key': q.name,
                'x-delivery-limit': q.deliveryLimit,
            },
        });
        for (const key of q.bindings) await ch.bindQueue(q.name, EXCHANGE, key);
    }
}

module.exports = { EXCHANGE, DEAD_LETTER_EXCHANGE, QUEUES, assertTopology };
