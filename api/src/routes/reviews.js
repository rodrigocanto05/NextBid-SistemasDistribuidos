// /api/reviews/*  (create, get_for_seller)
const express = require('express');
const reviews = require('../services/reviews');
const { requireAuth } = require('../lib/auth');
const { fail, int, str } = require('../lib/http');
const { post, get } = require('./_util');

const router = express.Router();

post(router, '/create', requireAuth, async (req, res) => {
    const b = req.body || {};
    const productId = int(b.product_id);
    const rating = int(b.rating);
    const comment = str(b.comment).trim();
    if (productId <= 0 || rating <= 0) throw fail('Dados inválidos.');
    if (rating < 1 || rating > 5) throw fail('A avaliação tem de ser entre 1 e 5 estrelas.');
    if (comment.length > 1000) throw fail('Comentário demasiado longo (máx 1000 caracteres).');

    await reviews.create(req.user.id, { productId, rating, comment });
    res.json({ status: 'success', message: 'Avaliação registada.' });
});

get(router, '/get_for_seller', async (req, res) => {
    const sellerId = int(req.query.seller_id);
    if (sellerId <= 0) throw fail('ID inválido.');
    res.json({ status: 'success', seller_id: sellerId, ...(await reviews.forSeller(sellerId)) });
});

module.exports = router;
