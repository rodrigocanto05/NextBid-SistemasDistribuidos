// /api/transactions/*  (balance, deposit)
const express = require('express');
const wallet = require('../services/wallet');
const { requireAuth } = require('../lib/auth');
const { fail, num, str } = require('../lib/http');
const { post, get } = require('./_util');

const router = express.Router();

get(router, '/balance', requireAuth, async (req, res) => {
    res.json({ status: 'success', user_id: req.user.id, balance: await wallet.balance(req.user.id) });
});

post(router, '/deposit', requireAuth, async (req, res) => {
    const amount = num(req.body && req.body.amount);
    const description = str(req.body && req.body.description).trim() || 'Carregamento de saldo';
    if (amount <= 0 || !Number.isInteger(amount)) throw fail('Indica um valor inteiro em euros.');
    if (amount > 100000) throw fail('Máximo por carregamento: 100 000 €.');
    await wallet.deposit(req.user.id, amount, description);
    res.json({ status: 'success', message: 'Saldo carregado.', amount });
});

module.exports = router;
