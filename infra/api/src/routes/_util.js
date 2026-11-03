// Registo de rotas com o mesmo comportamento do PHP para métodos errados (405).
const { asyncH } = require('../lib/http');

function post(router, path, ...handlers) {
    const last = handlers.pop();
    router.post(path, ...handlers, asyncH(last));
    router.all(path, (req, res) => res.status(405).json({ status: 'error', message: 'Use POST.' }));
}

function get(router, path, ...handlers) {
    const last = handlers.pop();
    router.get(path, ...handlers, asyncH(last));
}

module.exports = { post, get };
