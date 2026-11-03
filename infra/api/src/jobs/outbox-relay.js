// Relay do outbox (corre só na instância líder): publica no RabbitMQ os eventos gravados pelas
// transações de negócio (ver messaging/outbox.js). Com o RabbitMQ em baixo não faz nada; os
// eventos esperam no PostgreSQL e saem por ordem quando ele voltar.

const config = require('../config');
const outbox = require('../messaging/outbox');
const publisher = require('../messaging/publisher');

// Devolve true se ainda há trabalho (lote cheio): o agendador volta a chamar logo.
async function tick() {
    if (!publisher.isReady()) return false;
    const sent = await outbox.publishPending(publisher, config.jobs.outboxBatchSize);
    return sent >= config.jobs.outboxBatchSize;
}

module.exports = { tick };
