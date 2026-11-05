// Utilitários HTTP partilhados pelas rotas.
// O contrato de resposta é o mesmo do PHP: { status: 'success' | 'error', message?, ... }

class HttpError extends Error {
    constructor(status, message, extra = {}) {
        super(message);
        this.status = status;
        this.extra = extra;
    }
}

// Erro de negócio que o PHP devolvia com HTTP 200 e status 'error'.
// Mantemos o mesmo comportamento para o frontend atual não mudar.
function fail(message, extra = {}) {
    return new HttpError(200, message, extra);
}

const asyncH = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function errorHandler(log) {
    // eslint-disable-next-line no-unused-vars
    return (err, req, res, next) => {
        if (err instanceof HttpError) {
            return res.status(err.status).json({ status: 'error', message: err.message, ...err.extra });
        }
        if (err && err.type === 'entity.parse.failed') {
            return res.status(400).json({ status: 'error', message: 'JSON inválido.' });
        }
        log.error(`${req.method} ${req.originalUrl}: ${err && err.stack ? err.stack : err}`);
        res.status(500).json({ status: 'error', message: 'Erro interno.' });
    };
}

const int = (v, def = 0) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
};

const num = (v, def = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
};

const str = v => (v === undefined || v === null ? '' : String(v));

// Moeda da plataforma: euros (valores inteiros). 1200 -> "1200 €"
const fmtCr = n => `${Math.round(Number(n) || 0)} €`;

module.exports = { HttpError, fail, asyncH, errorHandler, int, num, str, fmtCr };
