// /api/bids/*  (place, get_by_auction, my_bids)
const express = require('express');
const bids = require('../services/bids');
const { requireAuth } = require('../lib/auth');
const { fail, int, num, str } = require('../lib/http');
const { post, get } = require('./_util');

const router = express.Router();

// Lance. Header opcional `Idempotency-Key` (ou body.request_id): repetir o mesmo pedido não
// cria um segundo lance. O frontend atual não o envia; o React deve enviar.
post(router, '/place', requireAuth, async (req, res) => {
    const b = req.body || {};
    const productId = int(b.product_id);
    const amount = num(b.amount);
    if (productId <= 0 || amount <= 0) throw fail('Dados de licitação inválidos.');
    if (!Number.isInteger(amount)) throw fail('O lance tem de ser um número inteiro de créditos.');
    if (amount > 99999999) throw fail('Valor demasiado alto.');

    const key = str(req.get('Idempotency-Key') || b.request_id).trim().slice(0, 64) || null;
    res.json(await bids.placeBid(req.user.id, productId, amount, key));
});

get(router, '/get_by_auction', async (req, res) => {
    const productId = int(req.query.product_id);
    const limit = Math.min(Math.max(int(req.query.limit, 20), 1), 500);
    if (productId <= 0) throw fail('ID inválido.');
    const list = await bids.getByProduct(productId, limit);
    res.json({ status: 'success', count: list.length, bids: list });
});

get(router, '/my_bids', requireAuth, async (req, res) => {
    const limit = Math.min(Math.max(int(req.query.limit, 50), 1), 500);
    const list = await bids.getByUser(req.user.id, limit);
    res.json({ status: 'success', count: list.length, bids: list });
});

module.exports = router;
