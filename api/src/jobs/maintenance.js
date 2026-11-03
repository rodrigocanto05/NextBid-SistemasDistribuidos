// Limpeza periódica (corre só na instância líder): as tabelas de controlo só precisam de guardar
// o suficiente para detetar repetições e para diagnóstico.

const db = require('../db/pool');
const config = require('../config');
const log = require('../lib/log');

async function tick() {
    const days = config.jobs.retentionDays;
    const a = await db.write('delete from outbox where evt_published_at < now() - make_interval(days => $1)', [days]);
    const b = await db.write('delete from processed_event where pev_processed_at < now() - make_interval(days => $1)', [days]);
    const c = await db.write('delete from revoked_token where rvk_expires_at < now()');
    const n = a.rowCount + b.rowCount + c.rowCount;
    if (n) log.info(`limpeza: ${a.rowCount} eventos publicados, ${b.rowCount} registos de processamento, ${c.rowCount} tokens expirados`);
}

module.exports = { tick };
