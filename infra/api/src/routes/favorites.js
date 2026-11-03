// /api/favorites/*  (list, ids, toggle)
const express = require('express');
const favorites = require('../services/favorites');
const { requireAuth } = require('../lib/auth');
const { fail, int } = require('../lib/http');
const { post, get } = require('./_util');

const router = express.Router();

get(router, '/list', requireAuth, async (req, res) => {
    const auctions = await favorites.list(req.user.id);
    res.json({ status: 'success', count: auctions.length, auctions });
});

get(router, '/ids', requireAuth, async (req, res) => {
    res.json({ status: 'success', ids: await favorites.ids(req.user.id) });
});

post(router, '/toggle', requireAuth, async (req, res) => {
    const productId = int(req.body && req.body.product_id);
    if (productId <= 0) throw fail('ID de produto inválido.');
    res.json({ status: 'success', favorited: await favorites.toggle(req.user.id, productId) });
});

module.exports = router;
