// Todas as rotas da API num só sítio: é aqui que se vê a superfície da API.
//
// Convenção: routes/ trata de HTTP (ler e validar a entrada, códigos de resposta, forma do JSON);
// services/ tem as regras de negócio e o SQL. Uma rota nunca fala com a base de dados diretamente.
// Os caminhos antigos do frontend (/backend/api/x/y.php) chegam aqui já reescritos (ver app.js).

const express = require('express');

function routes() {
    const api = express.Router();
    api.use('/', require('./health')); //            /api/health, /api/cluster
    api.use('/auth', require('./auth')); //          registo, login, logout
    api.use('/auctions', require('./auctions')); //  leilões
    api.use('/bids', require('./bids')); //          lances
    api.use('/user', require('./users')); //         perfil, fotografia, notificações
    api.use('/transactions', require('./transactions')); // carteira
    api.use('/categories', require('./categories'));
    api.use('/stats', require('./stats'));
    api.use('/favorites', require('./favorites'));
    api.use('/reviews', require('./reviews'));
    api.use('/chat', require('./chat'));
    api.use('/admin', require('./admin'));
    api.use((req, res) => res.status(404).json({ status: 'error', message: 'Endpoint não encontrado.' }));
    return api;
}

module.exports = routes;
