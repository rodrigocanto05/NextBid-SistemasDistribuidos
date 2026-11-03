// Consumo de uma fila com as garantias de que o resto do sistema depende:
//
//   * ack manual, só depois do COMMIT do handler: se o worker morrer a meio, o RabbitMQ volta a
//     entregar a mensagem a outro worker. Nada se perde.
//   * idempotência: o handler corre numa transação que começa por registar (consumidor, evt_id) em
//     processed_event. Uma entrega repetida encontra o registo e não faz nada. Entrega "pelo menos
//     uma vez" + efeito idempotente = efeito "exatamente uma vez".
//   * falhas transitórias (BD em baixo, failover em curso): tenta de novo dentro do worker, com
//     espera crescente, sem devolver a mensagem ao broker. Não gasta o limite de entregas nem manda
//     para a DLQ uma mensagem válida só porque a BD estava a mudar de principal.
//   * falha definitiva (mensagem inválida, erro de programação): nack sem requeue -> DLQ, para análise.
//
// A ordem entre mensagens não é garantida (2 workers x prefetch em paralelo). Os efeitos atuais
// (notificações, XP, chat) não dependem dela.

const db = require('../db/pool');
const log = require('../lib/log');
const { isEnvelope } = require('./events');

const TRANSIENT_CODES = new Set(['40P01', '40001', '53300', '57014']); // deadlock, serialização, ligações a mais, cancelado
const isTransient = err => !!err && (err.status === 503 || db.isConnectionError(err) || TRANSIENT_CODES.has(err.code));

const sleep = ms => new Promise(r => setTimeout(r, ms));
const safely = fn => {
    try {
        fn();
    } catch {
        /* canal já fechado: a mensagem volta a ser entregue e a idempotência trata do resto */
    }
};

/**
 * @param {object} opts
 * @param {string} opts.name         nome do consumidor (chave em processed_event)
 * @param {string} opts.queue        fila a consumir
 * @param {number} opts.prefetch     mensagens em processamento ao mesmo tempo
 * @param {Record<string, (c: import('pg').PoolClient, data: object, env: object) => Promise<any>>} opts.handlers
 * @param {(result: any, env: object) => void} [opts.afterCommit]  ex.: avisar os browsers (Socket.IO)
 */
function createConsumer({ name, queue, prefetch, handlers, afterCommit }) {
    const stats = { processed: 0, duplicates: 0, dead_lettered: 0, retries: 0, in_flight: 0, last_event_id: null, last_at: null };
    const inFlight = new Set();
    const unknownTypes = new Set();
    let current = null; // { ch, tag }
    let stopping = false;

    function processOnce(env) {
        return db.tx(async c => {
            const fresh = await c.query(
                'insert into processed_event (pev_consumer, pev_evt_id) values ($1, $2) on conflict do nothing',
                [name, env.id],
            );
            if (!fresh.rowCount) return { duplicate: true };
            const handler = handlers[env.type];
            if (!handler) {
                if (!unknownTypes.has(env.type)) log.warn(`${name}: tipo de evento sem handler (${env.type}); ignorado`);
                unknownTypes.add(env.type);
                return { duplicate: false, result: null };
            }
            return { duplicate: false, result: await handler(c, env.data, env) };
        });
    }

    async function onMessage(ch, msg) {
        let env = null;
        try {
            env = JSON.parse(msg.content.toString('utf8'));
        } catch {
            /* fica null */
        }
        if (!isEnvelope(env)) {
            stats.dead_lettered++;
            log.error(`${name}: mensagem inválida (${msg.properties.messageId || 'sem id'}); enviada para a DLQ`);
            safely(() => ch.nack(msg, false, false));
            return;
        }
        for (let attempt = 1; ; attempt++) {
            try {
                const out = await processOnce(env);
                safely(() => ch.ack(msg));
                stats.last_event_id = env.id;
                stats.last_at = new Date().toISOString();
                if (out.duplicate) stats.duplicates++;
                else {
                    stats.processed++;
                    if (afterCommit && out.result) afterCommit(out.result, env);
                }
                return;
            } catch (err) {
                if (isTransient(err)) {
                    if (stopping) {
                        safely(() => ch.nack(msg, false, true)); // a terminar: outro worker trata dela
                        return;
                    }
                    stats.retries++;
                    if (attempt === 1 || attempt % 20 === 0) {
                        log.warn(`${name}: evento ${env.id} à espera da BD (${err.message}); tentativa ${attempt}`);
                    }
                    await sleep(Math.min(5000, 250 * 2 ** Math.min(attempt - 1, 5)));
                    continue;
                }
                stats.dead_lettered++;
                log.error(`${name}: evento ${env.id} (${env.type}) falhou e foi para a DLQ: ${err.message}`);
                safely(() => ch.nack(msg, false, false));
                return;
            }
        }
    }

    function track(promise) {
        stats.in_flight++;
        inFlight.add(promise);
        promise
            .catch(err => log.error(`${name}: erro inesperado: ${err.stack || err}`))
            .finally(() => {
                inFlight.delete(promise);
                stats.in_flight--;
            });
    }

    // Corre a cada (re)ligação ao RabbitMQ (ver messaging/rabbit.js)
    async function setup(ch) {
        await ch.prefetch(prefetch);
        const { consumerTag } = await ch.consume(
            queue,
            msg => {
                if (msg === null) {
                    // O broker cancelou a subscrição (ex.: fila apagada). Fechar o canal força a
                    // religação, que volta a declarar a fila e a subscrever.
                    log.warn(`${name}: subscrição de ${queue} cancelada pelo broker`);
                    ch.close().catch(() => {});
                    return;
                }
                track(onMessage(ch, msg));
            },
            { noAck: false },
        );
        current = { ch, tag: consumerTag };
        log.info(`${name}: a consumir a fila ${queue} (prefetch ${prefetch})`);
    }

    // Deixa de receber mensagens novas e espera pelas que estão a meio (docker stop)
    async function stop() {
        stopping = true;
        if (current) await current.ch.cancel(current.tag).catch(() => {});
        await Promise.allSettled([...inFlight]);
    }

    return { setup, stop, stats: () => ({ ...stats }) };
}

module.exports = { createConsumer, isTransient };
