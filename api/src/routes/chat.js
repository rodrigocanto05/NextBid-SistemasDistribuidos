// /api/chat/*  (get, send)
// O modo ?debug=1 do PHP (enviar como qualquer utilizador a partir de "localhost") não foi portado:
// atrás do Nginx todos os pedidos vêm da mesma rede interna e isso abria um buraco de segurança.
const express = require('express');
const chat = require('../services/chat');
const { requireAuth } = require('../lib/auth');
const { fail, int, str } = require('../lib/http');
const { post, get } = require('./_util');

const router = express.Router();

get(router, '/get', async (req, res) => {
    const productId = int(req.query.product_id);
    const afterId = int(req.query.after_id);
    const limit = Math.min(Math.max(int(req.query.limit, 100), 1), 500);
    if (productId <= 0) throw fail('ID inválido.');
    const messages = await chat.list(productId, afterId, limit);
    const lastId = messages.length ? messages[messages.length - 1].cht_id : afterId;
    res.json({ status: 'success', count: messages.length, last_id: lastId, messages });
});

post(router, '/send', requireAuth, async (req, res) => {
    const productId = int(req.body && req.body.product_id);
    const content = str(req.body && req.body.content).trim();
    if (productId <= 0) throw fail('ID inválido.');
    if (!content) throw fail('Mensagem vazia.');
    if ([...content].length > 500) throw fail('Mensagem demasiado longa (máx. 500).');

    const chtId = await chat.send(req.user.id, productId, content);
    res.json({ status: 'success', message: 'Mensagem enviada.', cht_id: chtId });
});

module.exports = router;
