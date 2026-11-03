// Processo worker (worker1, worker2): consome eventos do RabbitMQ e faz os efeitos secundários
// (notificações, XP, mensagens de sistema no chat) fora do caminho crítico do lance.
//
//   RabbitMQ (fila notifications) -> messaging/consumer.js (ack, idempotência, DLQ)
//                                 -> consumers/notifications.js (o que fazer com cada evento)
//
// Os dois workers competem pela mesma fila (competing consumers): cada mensagem vai para um só.
// Se um morrer, as mensagens que tinha por confirmar voltam para a fila e o outro trata delas.
// Mesma imagem Docker da API; no docker-compose muda só o comando (node src/worker.js).
//
// Expõe GET /api/health na mesma porta da API, para o HEALTHCHECK do Dockerfile servir aos dois.

const http = require('http');
const config = require('./config');
const log = require('./lib/log');
const db = require('./db/pool');
const schema = require('./db/schema');
const redis = require('./lib/redis');
const emitter = require('./realtime/emitter');
const { RabbitClient } = require('./messaging/rabbit');
const { assertTopology } = require('./messaging/topology');
const { createConsumer } = require('./messaging/consumer');
const notifications = require('./consumers/notifications');
const { ignoreUnhandledRejections, onShutdown } = require('./lib/process');

ignoreUnhandledRejections();

const consumer = createConsumer({ ...notifications, prefetch: config.rabbitmq.prefetch });

const rabbit = new RabbitClient({
    url: config.rabbitmq.url,
    name: config.instanceId,
    topology: assertTopology,
    setup: consumer.setup, // a cada (re)ligação: prefetch + subscrever a fila
});

const health = http.createServer((req, res) => {
    if (req.url !== '/api/health') {
        res.writeHead(404).end();
        return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(
        JSON.stringify({
            status: 'success',
            instance: config.instanceId,
            role: 'worker',
            queue: notifications.queue,
            rabbitmq: rabbit.isReady() ? 'up' : 'down',
            db_primary: db.status() ? `${db.status().host}:${db.status().port}` : null,
            redis: redis.isReady() ? 'up' : 'down',
            ...consumer.stats(),
            uptime_s: Math.round(process.uptime()),
        }),
    );
});

db.start();
schema.check();
emitter.init();
rabbit.start();
health.listen(config.port, () => log.info(`worker pronto (health na porta ${config.port})`));

onShutdown(async () => {
    await consumer.stop(); // deixa de receber e espera pelas mensagens a meio
    await rabbit.close();
    health.close();
    await redis.closeAll();
    await db.stop();
});
