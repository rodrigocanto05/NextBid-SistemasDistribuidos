// Estado do RabbitMQ para a página /estado, lido da API de gestão (porta 15672, rede interna).
// Nunca lança: com o broker em baixo devolve { up: false } e a página pinta-o de vermelho.

const config = require('../config');

const AUTH = 'Basic ' + Buffer.from(`${config.rabbitmq.user}:${config.rabbitmq.password}`).toString('base64');

async function mgmt(path) {
    const res = await fetch(`${config.rabbitmq.managementUrl}${path}`, {
        headers: { Authorization: AUTH },
        signal: AbortSignal.timeout(1000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

const rate = (stats, key) => (stats && stats[key] ? Math.round(stats[key].rate * 10) / 10 : 0);

async function brokerStatus() {
    if (!config.rabbitmq.enabled) return { up: false, reason: 'RABBITMQ_HOST vazio' };
    try {
        const [overview, queues, connections] = await Promise.all([
            mgmt('/api/overview?columns=rabbitmq_version,node'),
            mgmt('/api/queues/%2F?columns=name,type,messages_ready,messages_unacknowledged,consumers,message_stats'),
            mgmt('/api/connections?columns=name,client_properties,state'),
        ]);
        return {
            up: true,
            version: overview.rabbitmq_version,
            node: overview.node,
            queues: queues
                .map(q => ({
                    name: q.name,
                    type: q.type,
                    ready: q.messages_ready || 0,
                    unacked: q.messages_unacknowledged || 0,
                    consumers: q.consumers || 0,
                    in_rate: rate(q.message_stats, 'publish_details'),
                    out_rate: rate(q.message_stats, 'ack_details'),
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            // Nomes dados por cada processo à sua ligação (api1..3, worker1..2)
            connections: connections
                .map(c => (c.client_properties && c.client_properties.connection_name) || c.name)
                .sort(),
        };
    } catch (err) {
        return { up: false, reason: err.message };
    }
}

module.exports = { brokerStatus };
