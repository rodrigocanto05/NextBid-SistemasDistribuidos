// Clientes Redis. O Redis só serve o tempo real: leva os eventos Socket.IO de uma instância para
// as outras (realtime/socket.js nas APIs, realtime/emitter.js no worker). Não guarda dados: se
// cair, os lances continuam e as páginas voltam ao polling.
//
// Nota: começámos com o cliente `redis` (node-redis 4). Num teste de falha (Redis desligado e
// religado com a API a correr) o cliente de subscrição rebentava com um erro interno e derrubava
// a instância. O ioredis volta a ligar e a subscrever os canais sozinho, por isso ficou este.

const Redis = require('ioredis');
const config = require('../config');
const log = require('./log');

const clients = [];

// subscriber: true -> cliente de subscrição do Socket.IO. Os comandos esperam pela religação
// (as subscrições têm de ser refeitas quando o Redis voltar).
// Os outros clientes falham logo quando o Redis está em baixo: um evento de tempo real perdido
// não tem importância, e nada fica pendurado à espera do Redis.
function makeClient(name, { subscriber = false } = {}) {
    if (!config.redisUrl) return null;
    const client = new Redis(config.redisUrl, {
        connectTimeout: 2000,
        maxRetriesPerRequest: subscriber ? null : 1,
        enableOfflineQueue: subscriber,
        retryStrategy: times => Math.min(times * 200, 3000),
    });
    let up = false;
    client.on('ready', () => {
        up = true;
        log.info(`Redis (${name}) ligado`);
    });
    client.on('error', err => {
        if (up) log.warn(`Redis (${name}): ${err.message}`);
        up = false;
    });
    clients.push(client);
    return client;
}

// 'up' se todos os clientes criados por este processo estão ligados
const isReady = () => clients.length > 0 && clients.every(c => c.status === 'ready');

async function closeAll() {
    await Promise.all(clients.map(c => c.quit().catch(() => c.disconnect())));
}

module.exports = { makeClient, isReady, closeAll };
