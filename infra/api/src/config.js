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

module.exports = {
    instanceId: process.env.INSTANCE_ID || require('os').hostname(),
    port: Number(process.env.PORT || 3000),

    db: {
        // Todos os nós PostgreSQL, por ordem. A API descobre qual é o principal (ver db/pool.js).
        hosts: list(process.env.DB_HOSTS || 'localhost:5432'),
        name: process.env.DB_NAME || 'nextbid',
        user: process.env.DB_USER || 'nextbid',
        password: process.env.DB_PASSWORD || '',
        timezone: process.env.APP_TZ || 'Europe/Lisbon',
        poolSize: Number(process.env.DB_POOL_SIZE || 10),
    },

    redisUrl: process.env.REDIS_URL || '',

    jwt: {
        secret: process.env.NODE_ENV === 'test' ? 'test-secret' : required('JWT_SECRET'),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    uploadDir: process.env.UPLOAD_DIR || '/data/uploads',

    jobs: {
        // Intervalo do job de fecho de leilões (substitui o executarLazyCron do PHP)
        closeIntervalMs: Number(process.env.JOB_INTERVAL_MS || 5000),
    },
};
