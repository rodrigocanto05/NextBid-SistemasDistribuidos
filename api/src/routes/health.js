// /api/health e /api/cluster: healthcheck do Docker e página "Arquitetura ao vivo" (/estado).
const express = require('express');
const db = require('../db/pool');
const redis = require('../lib/redis');
const jobs = require('../jobs');
const publisher = require('../messaging/publisher');
const outbox = require('../messaging/outbox');
const { brokerStatus } = require('../messaging/status');
const config = require('../config');

const router = express.Router();

// Estado DESTA instância. 200 se consegue ler da BD (principal ou réplica), 503 se não.
// Redis e RabbitMQ não contam para o código HTTP: não são críticos para os lances.
// db: 'up' (principal), 'read-only' (sem principal, leituras numa réplica) ou 'down'.
router.get('/health', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    let dbState = 'down';
    try {
        await db.read('select 1', [], { primaryOnly: true });
        dbState = 'up';
    } catch {
        try {
            await db.readFromReplica('select 1', []);
            dbState = 'read-only';
        } catch {
            dbState = 'down';
        }
    }
    const dbOk = dbState !== 'down';
    const primary = db.status();
    res.status(dbOk ? 200 : 503).json({
        status: dbOk ? 'success' : 'error',
        instance: config.instanceId,
        role: 'api',
        db: dbState,
        db_primary: primary ? `${primary.host}:${primary.port}` : null,
        db_timeline: primary ? primary.timeline : null,
        redis: redis.isReady() ? 'up' : 'down',
        rabbitmq: publisher.isReady() ? 'up' : 'down',
        job_leader: jobs.isLeader(),
        uptime_s: Math.round(process.uptime()),
    });
});

// Visão do sistema a partir desta instância: os 3 nós PostgreSQL, o RabbitMQ (filas, ligações)
// e o outbox. A página /estado pede isto a cada 1,5 s.
router.get('/cluster', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const [nodes, broker, pending] = await Promise.all([db.cluster(), brokerStatus(), outbox.stats().catch(() => null)]);
    res.json({
        status: 'success',
        instance: config.instanceId,
        api_primary: db.status(),
        redis: redis.isReady() ? 'up' : 'down',
        nodes,
        rabbitmq: broker,
        outbox: pending,
    });
});

module.exports = router;
