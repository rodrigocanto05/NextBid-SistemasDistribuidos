// Aplicação Express: middlewares e rotas. Não abre portas nem ligações; quem a arranca é o
// server.js. Separado para se perceber num relance o que acontece a um pedido HTTP, por ordem.

const express = require('express');
const config = require('./config');
const log = require('./lib/log');
const { errorHandler } = require('./lib/http');
const routes = require('./routes');

function createApp() {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', true);

    // 1. Compatibilidade com o frontend atual: /backend/api/auth/login.php -> /api/auth/login
    //    (o Nginx também faz este encaminhamento; aqui garante que funciona sem ele).
    app.use((req, res, next) => {
        const m = /^\/backend(\/api\/[^?]*?)\.php(\?.*)?$/.exec(req.url);
        if (m) req.url = m[1] + (m[2] || '');
        next();
    });

    // 2. Identifica a instância em cada resposta (útil no DevTools durante a demonstração)
    app.use((req, res, next) => {
        res.set('X-Instance', config.instanceId);
        next();
    });

    // 3. CORS (igual ao cors.php). Útil quando o React corre no servidor de desenvolvimento do Vite.
    app.use((req, res, next) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
        res.set('Access-Control-Max-Age', '86400');
        if (req.method === 'OPTIONS') return res.sendStatus(204);
        next();
    });

    // 4. Corpo dos pedidos
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: false, limit: '1mb' }));

    // 5. Rotas (routes/index.js) e tratamento de erros no formato { status: 'error', message }
    app.use('/api', routes());
    app.use(errorHandler(log));
    return app;
}

module.exports = { createApp };
