// Processo API (api1, api2, api3): HTTP + Socket.IO + jobs da instância líder.
//
//   pedido HTTP -> app.js (middlewares) -> routes/ -> services/ -> db/pool.js (principal atual)
//   lance aceite -> outbox (mesma transação) -> relay da líder -> RabbitMQ -> worker.js
//
// O worker (src/worker.js) é outro processo, com a mesma imagem Docker.

const http = require('http');
const config = require('./config');
const log = require('./lib/log');
const db = require('./db/pool');
const schema = require('./db/schema');
const redis = require('./lib/redis');
const realtime = require('./realtime/socket');
const publisher = require('./messaging/publisher');
const jobs = require('./jobs');
const { createApp } = require('./app');
const { ignoreUnhandledRejections, onShutdown } = require('./lib/process');

ignoreUnhandledRejections();

const server = http.createServer(createApp());
realtime.init(server); // Socket.IO + adaptador Redis (eventos entre as 3 APIs)

db.start(); //            descoberta do principal PostgreSQL
schema.check(); //        avisa nos logs se faltar aplicar migrações
publisher.start(); //     ligação ao RabbitMQ (não bloqueia: sem broker, os eventos esperam no outbox)
jobs.start(); //          eleição de líder + fecho de leilões + relay do outbox + limpeza

server.listen(config.port, () => log.info(`API a ouvir na porta ${config.port}`));

onShutdown(async () => {
    await jobs.stop(); // liberta a liderança já, em vez de esperar que a ligação caia
    await realtime.close();
    await new Promise(resolve => server.close(resolve));
    await publisher.close();
    await redis.closeAll();
    await db.stop();
});
