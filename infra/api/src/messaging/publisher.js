// Ligação de publicação ao RabbitMQ, uma por instância da API. Todas as APIs ficam ligadas (para
// mostrarem o estado no /estado e para a troca de líder não esperar por uma ligação nova), mas só
// a líder publica: é ela que corre o relay do outbox (jobs/outbox-relay.js).

const config = require('../config');
const { RabbitClient } = require('./rabbit');
const { assertTopology } = require('./topology');

module.exports = new RabbitClient({
    url: config.rabbitmq.url,
    name: config.instanceId,
    confirm: true,
    topology: assertTopology,
});
