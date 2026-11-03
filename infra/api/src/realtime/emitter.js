// Emitir eventos Socket.IO a partir de um processo que NÃO tem servidor Socket.IO (o worker).
//
// Publica no mesmo canal Redis que o adaptador das 3 APIs ouve (realtime/socket.js); cada API
// entrega o evento aos browsers ligados a ela. É assim que o worker avisa a página do leilão de
// que há uma mensagem nova no chat sem passar pela API.

const { Emitter } = require('@socket.io/redis-emitter');
const config = require('../config');
const log = require('../lib/log');
const { makeClient } = require('../lib/redis');

let emitter;

function get() {
    if (emitter === undefined) {
        const client = makeClient('socket-emitter');
        emitter = client ? new Emitter(client) : null;
        if (!emitter) log.warn('REDIS_URL vazio: o worker não avisa os browsers (ficam com o polling)');
    }
    return emitter;
}

// Mesmas salas que realtime/socket.js: a página do leilão e o painel /estado
function toAuction(productId, event, payload) {
    const e = get();
    if (!e) return;
    try {
        e.to([`auction:${productId}`, 'dashboard']).emit(event, { ...payload, instance: config.instanceId });
    } catch (err) {
        log.warn(`falha a emitir ${event}: ${err.message}`);
    }
}

module.exports = { toAuction, init: get };
