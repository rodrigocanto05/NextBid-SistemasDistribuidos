// /api/stats/*  (home)
const express = require('express');
const catalog = require('../services/catalog');
const { get } = require('./_util');

const router = express.Router();

get(router, '/home', async (req, res) => {
    res.json({ status: 'success', data: await catalog.homeStats() });
});

module.exports = router;
