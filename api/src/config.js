// Configuração lida do ambiente (docker-compose.yml + .env).
// Todas as instâncias (api1..3, worker1..2) recebem os mesmos valores, exceto INSTANCE_ID.

function required(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Variável de ambiente em falta: ${name}`);
    return v;
}

function list(value) {
    return String(value || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

const num = (name, def) => Number(process.env[name] || def);

const rabbitHost = process.env.RABBITMQ_HOST || '';
const rabbitUser = process.env.RABBITMQ_USER || 'nextbid';
const rabbitPass = process.env.RABBITMQ_PASSWORD || '';
const enc = encodeURIComponent;

module.exports = {
    instanceId: process.env.INSTANCE_ID || require('os').hostname(),
    port: num('PORT', 3000),

    db: {
        // Todos os nós PostgreSQL, por ordem. A API descobre qual é o principal (ver db/pool.js).
        hosts: list(process.env.DB_HOSTS || 'localhost:5432'),
        name: process.env.DB_NAME || 'nextbid',
        user: process.env.DB_USER || 'nextbid',
        password: process.env.DB_PASSWORD || '',
        timezone: process.env.APP_TZ || 'Europe/Lisbon',
        poolSize: num('DB_POOL_SIZE', 10),
    },

    // Redis: só tempo real (Socket.IO entre instâncias). Vazio = cada instância só fala com os seus browsers.
    redisUrl: process.env.REDIS_URL || '',

    // RabbitMQ: eventos assíncronos (ver docs/adr/0001-rabbitmq-eventos-pos-commit.md).
    // Vazio = os eventos ficam no outbox do PostgreSQL até haver broker.
    rabbitmq: {
        enabled: !!rabbitHost,
        // A password vai dentro de um URL: encodeURIComponent protege caracteres como @ ou /
        url: rabbitHost ? `amqp://${enc(rabbitUser)}:${enc(rabbitPass)}@${rabbitHost}:${num('RABBITMQ_PORT', 5672)}?heartbeat=10` : '',
        // API de gestão (estado das filas na página /estado)
        managementUrl: rabbitHost ? `http://${rabbitHost}:${num('RABBITMQ_MGMT_PORT', 15672)}` : '',
        user: rabbitUser,
        password: rabbitPass,
        // Mensagens entregues a cada worker antes de confirmar (= transações em paralelo por worker)
        prefetch: num('RABBITMQ_PREFETCH', 10),
    },

    jwt: {
        secret: process.env.NODE_ENV === 'test' ? 'test-secret' : required('JWT_SECRET'),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    uploadDir: process.env.UPLOAD_DIR || '/data/uploads',

    jobs: {
        // Verificação da liderança (advisory lock) entre as 3 APIs
        leaderCheckMs: num('LEADER_CHECK_MS', 1000),
        // Fecho de leilões (substitui o executarLazyCron do PHP)
        closeIntervalMs: num('JOB_INTERVAL_MS', 5000),
        // Relay do outbox: de quanto em quanto tempo procura eventos por publicar
        outboxIntervalMs: num('OUTBOX_INTERVAL_MS', 200),
        outboxBatchSize: num('OUTBOX_BATCH_SIZE', 200),
        // Limpeza do outbox publicado, eventos processados e tokens revogados expirados
        cleanupIntervalMs: num('CLEANUP_INTERVAL_MS', 10 * 60 * 1000),
        retentionDays: num('EVENT_RETENTION_DAYS', 3),
    },
};
