// Tempo real com Socket.IO.
//
// Problema com 3 instâncias: um browser ligado à api2 não recebe um evento emitido na api1.
// O adaptador Redis resolve isto: cada emit é publicado num canal Redis e as 3 instâncias
// entregam-no aos seus clientes (comunicação em grupo / multicast, slides de Sis-Dis, cap. 2).
//
// Salas: `auction:<id>`. O browser entra na sala do leilão que está a ver.
// Eventos emitidos:
//   bid:new         { product_id, bid_id, amount, bidder_id, bidder_name, bid_count, created_at, instance }
//   auction:closed  { product_id, status, winner_id, amount }
//   chat:new        { product_id, cht_id }
//
// O cliente deve usar `transports: ['websocket']`: o modo polling precisa de sticky sessions,
// e o Nginx reparte os pedidos pelas 3 instâncias.

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const config = require('../config');
const log = require('../lib/log');
const { makeClient } = require('../lib/redis');

let io = null;

function init(httpServer) {
    io = new Server(httpServer, {
        cors: { origin: '*' },
        transports: ['websocket', 'polling'],
    });

    const pub = makeClient('socket-pub');
    const sub = makeClient('socket-sub', { subscriber: true });
    if (pub && sub) {
        io.adapter(createAdapter(pub, sub));
        log.info('Socket.IO com adaptador Redis');
    } else {
        log.warn('REDIS_URL vazio: Socket.IO só entrega eventos aos clientes desta instância');
    }

    io.on('connection', socket => {
        socket.emit('hello', { instance: config.instanceId });

        socket.on('auction:join', id => {
            const pid = Number.parseInt(id, 10);
            if (pid > 0) socket.join(`auction:${pid}`);
        });
        socket.on('auction:leave', id => {
            const pid = Number.parseInt(id, 10);
            if (pid > 0) socket.leave(`auction:${pid}`);
        });
        // Página "Arquitetura ao vivo" (/estado): recebe os eventos de todos os leilões
        socket.on('dashboard:join', () => socket.join('dashboard'));
    });

    return io;
}

function toAuction(productId, event, payload) {
    if (!io) return;
    try {
        // .to() com duas salas: cada cliente recebe o evento uma só vez
        io.to([`auction:${productId}`, 'dashboard']).emit(event, { ...payload, instance: config.instanceId });
    } catch (err) {
        log.warn(`falha a emitir ${event}: ${err.message}`);
    }
}

async function close() {
    if (io) await new Promise(resolve => io.close(() => resolve()));
}

module.exports = { init, toAuction, close };
