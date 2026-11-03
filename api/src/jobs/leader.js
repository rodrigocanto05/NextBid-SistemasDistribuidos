// Eleição de líder entre as 3 APIs (slides de Sis-Dis, cap. 5).
//
// Há trabalho que deve correr numa só instância: fechar leilões, publicar o outbox, limpezas.
// A liderança é um advisory lock do PostgreSQL guardado numa ligação dedicada:
//   * a instância que obtém pg_try_advisory_lock(LOCK_ID) é a líder enquanto a ligação viver;
//   * se a líder morrer (docker stop/kill), a ligação fecha, o PostgreSQL liberta o lock e outra
//     instância obtém-no na verificação seguinte (LEADER_CHECK_MS, 1 s);
//   * depois de um failover da BD, o lock antigo desaparece com o nó antigo e a eleição repete-se
//     no novo principal.
// Por um instante pode haver duas líderes (ex.: partição de rede). Os jobs aguentam isso:
// o fecho e o relay usam `skip locked`, e os consumidores eliminam eventos repetidos.

const { Client } = require('pg');
const db = require('../db/pool');
const config = require('../config');
const log = require('../lib/log');

const LOCK_ID = 4242; // identificador arbitrário, igual em todas as instâncias

let client = null; // ligação que segura o lock
let lockedOn = null; // "host:porta" do principal onde o lock foi obtido
let timer = null;
let checking = false;

async function drop(reason) {
    if (!client) return;
    log.warn(`deixei de ser a líder (${reason})`);
    const c = client;
    client = null;
    lockedOn = null;
    await c.end().catch(() => {});
}

async function check() {
    if (checking) return;
    checking = true;
    try {
        const primary = db.status();
        if (!primary) return void (await drop('sem BD principal'));
        const where = `${primary.host}:${primary.port}`;

        if (client) {
            if (lockedOn !== where) return void (await drop('o principal mudou'));
            try {
                await client.query('select 1');
                return;
            } catch {
                return void (await drop('ligação perdida'));
            }
        }

        const c = new Client(db.connOptions(primary));
        c.on('error', () => {});
        try {
            await c.connect();
            const { rows } = await c.query('select pg_try_advisory_lock($1) as ok', [LOCK_ID]);
            if (rows[0].ok) {
                client = c;
                lockedOn = where;
                log.info(`sou a líder (lock em ${primary.host}): fecho de leilões e relay do outbox`);
                return;
            }
        } catch {
            // BD indisponível: tenta na próxima verificação
        }
        await c.end().catch(() => {});
    } finally {
        checking = false;
    }
}

module.exports = {
    start() {
        timer = setInterval(check, config.jobs.leaderCheckMs);
        timer.unref();
        setTimeout(check, 500).unref();
    },
    async stop() {
        clearInterval(timer);
        await drop('a terminar');
    },
    isLeader: () => !!client,
};
