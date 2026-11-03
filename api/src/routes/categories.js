// /api/categories/*  (list)
const express = require('express');
const catalog = require('../services/catalog');
const { get } = require('./_util');

const router = express.Router();

get(router, '/list', async (req, res) => {
    const categories = await catalog.categories();
    res.json({ status: 'success', count: categories.length, categories });
});

module.exports = router;
