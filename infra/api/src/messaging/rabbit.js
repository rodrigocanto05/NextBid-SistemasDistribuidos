// Ligação ao RabbitMQ com religação automática.
//
// O amqplib não volta a ligar sozinho quando a ligação cai. Este cliente:
//   * liga com espera crescente (0,5 s, 1 s, 2 s ... até 5 s) até conseguir;
//   * a cada (re)ligação cria um canal, declara a topologia (`topology`) e corre `setup` (no worker:
//     prefetch e subscrição das filas). Nada fica a depender do estado da ligação anterior;
//   * se só o canal fechar (erro de protocolo), fecha a ligação para recomeçar do zero;
//   * isReady() deixa quem publica decidir logo, sem ficar pendurado à espera do broker. O relay
//     do outbox tenta mais tarde: os eventos continuam guardados no PostgreSQL.
//
// Um processo = uma ligação = um canal. Chega para este volume e simplifica a recuperação.

const amqp = require('amqplib');
const log = require('../lib/log');

const withTimeout = (promise, ms, what) =>
    Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${what}: sem resposta em ${ms} ms`)), ms).unref()),
    ]);

class RabbitClient {
    /**
     * @param {object} opts
     * @param {string} opts.url              amqp://utilizador:password@host:5672
     * @param {string} opts.name             aparece na consola do RabbitMQ (ligações) e na página /estado
     * @param {boolean} [opts.confirm]       canal com confirmações do broker (quem publica)
     * @param {(ch: import('amqplib').Channel) => Promise<void>} opts.topology  declara exchanges/filas
     * @param {(ch: import('amqplib').Channel) => Promise<void>} [opts.setup]   ex.: prefetch + consume
     */
    constructor({ url, name, confirm = false, topology, setup = async () => {} }) {
        this.url = url;
        this.name = name;
        this.confirm = confirm;
        this.topology = topology;
        this.setup = setup;
        this.conn = null;
        this.channel = null;
        this.ready = false;
        this.blocked = false;
        this.stopping = false;
        this.attempt = 0;
        this.timer = null;
        this.downSince = null;
    }

    start() {
        if (!this.url) {
            log.warn('RABBITMQ_HOST vazio: eventos ficam no outbox até haver RabbitMQ');
            return this;
        }
        this.connect();
        return this;
    }

    async connect() {
        if (this.stopping) return;
        let conn;
        try {
            conn = await amqp.connect(this.url, { clientProperties: { connection_name: this.name } });
        } catch (err) {
            this.markDown(err.message);
            this.schedule();
            return;
        }
        this.conn = conn;
        conn.on('error', err => log.warn(`RabbitMQ: ${err.message}`)); // o 'close' vem a seguir
        conn.on('close', () => {
            const wasUp = this.ready;
            this.conn = null;
            this.channel = null;
            this.ready = false;
            if (this.stopping) return;
            if (wasUp) this.markDown('ligação perdida');
            this.schedule();
        });
        // Alarme de memória/disco no broker: publicar ficaria pendurado; o relay espera.
        conn.on('blocked', reason => {
            this.blocked = true;
            log.warn(`RabbitMQ bloqueou as publicações: ${reason}`);
        });
        conn.on('unblocked', () => {
            this.blocked = false;
            log.info('RabbitMQ voltou a aceitar publicações');
        });

        try {
            const ch = this.confirm ? await conn.createConfirmChannel() : await conn.createChannel();
            ch.on('error', err => log.warn(`RabbitMQ (canal): ${err.message}`));
            ch.on('close', () => {
                // Canal fechado com a ligação aberta = erro de protocolo: recomeça do zero
                if (this.channel === ch && this.conn === conn && !this.stopping) conn.close().catch(() => {});
            });
            await this.topology(ch);
            await this.setup(ch);
            this.channel = ch;
            this.ready = true;
            this.attempt = 0;
            const after = this.downSince ? ` (esteve em baixo ${Math.round((Date.now() - this.downSince) / 1000)} s)` : '';
            this.downSince = null;
            log.info(`RabbitMQ ligado (${this.name})${after}`);
        } catch (err) {
            log.warn(`RabbitMQ: preparação do canal falhou: ${err.message}`);
            conn.close().catch(() => {}); // o 'close' agenda nova tentativa
        }
    }

    markDown(reason) {
        if (!this.downSince) {
            this.downSince = Date.now();
            log.warn(`RabbitMQ indisponível (${reason}); a tentar de novo em segundo plano`);
        }
    }

    schedule() {
        if (this.timer || this.stopping) return;
        const delay = Math.min(5000, 500 * 2 ** this.attempt++);
        this.timer = setTimeout(() => {
            this.timer = null;
            this.connect();
        }, delay);
        this.timer.unref();
    }

    isReady() {
        return this.ready && !this.blocked && !!this.channel;
    }

    // Publica um lote e espera que o broker confirme TODAS as mensagens (publisher confirms).
    // Só depois disso é que o relay marca os eventos como publicados no outbox.
    // `mandatory`: uma mensagem sem fila de destino volta para trás em vez de desaparecer.
    async publishAll(exchange, messages, timeoutMs = 5000) {
        const ch = this.channel;
        if (!this.confirm || !ch || !this.isReady()) throw new Error('RabbitMQ indisponível');
        const returned = [];
        const onReturn = msg => returned.push(msg.properties.messageId);
        ch.on('return', onReturn);
        try {
            for (const m of messages) {
                const ok = ch.publish(exchange, m.routingKey, m.content, { ...m.options, mandatory: true });
                if (!ok) await withTimeout(new Promise(resolve => ch.once('drain', resolve)), timeoutMs, 'buffer do canal');
            }
            await withTimeout(ch.waitForConfirms(), timeoutMs, 'confirmação do RabbitMQ');
        } finally {
            ch.removeListener('return', onReturn);
        }
        if (returned.length) {
            // Alguém apagou a fila? Volta a declarar a topologia e falha o lote (será repetido).
            await this.topology(ch).catch(() => {});
            throw new Error(`${returned.length} mensagem(ns) sem fila de destino (ex.: evento ${returned[0]})`);
        }
    }

    async close() {
        this.stopping = true;
        clearTimeout(this.timer);
        if (this.conn) await this.conn.close().catch(() => {});
    }
}

module.exports = { RabbitClient, withTimeout };
