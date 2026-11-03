// Jobs da instância líder. Cada job corre no seu próprio ritmo, nunca em paralelo consigo
// próprio, e só na instância que tem a liderança (jobs/leader.js). Um erro num job é registado
// (no máximo uma vez por minuto) e o job volta a correr na volta seguinte.

const config = require('../config');
const log = require('../lib/log');
const leader = require('./leader');
const closer = require('./closer');
const relay = require('./outbox-relay');
const maintenance = require('./maintenance');

const timers = new Map();
let stopped = false;

// fn pode devolver true ("ainda há trabalho") para voltar a correr logo, sem esperar pelo intervalo
function every(name, intervalMs, fn) {
    let lastError = 0;
    const schedule = ms => {
        if (!stopped) timers.set(name, setTimeout(run, ms).unref());
    };
    async function run() {
        let more = false;
        if (leader.isLeader()) {
            try {
                more = (await fn()) === true;
            } catch (err) {
                if (Date.now() - lastError > 60000) {
                    lastError = Date.now();
                    log.warn(`${name}: ${err.message}`);
                }
            }
        }
        schedule(more ? 0 : intervalMs);
    }
    schedule(intervalMs);
}

function start() {
    leader.start();
    every('fecho de leilões', config.jobs.closeIntervalMs, closer.tick);
    every('relay do outbox', config.jobs.outboxIntervalMs, relay.tick);
    every('limpeza', config.jobs.cleanupIntervalMs, maintenance.tick);
}

async function stop() {
    stopped = true;
    for (const t of timers.values()) clearTimeout(t);
    await leader.stop();
}

module.exports = { start, stop, isLeader: leader.isLeader };
