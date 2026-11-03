// /api/auctions/*  (get_active, get_by_id, create, cancel, my_selling, my_won)
const express = require('express');
const auctions = require('../services/auctions');
const { requireAuth } = require('../lib/auth');
const { HttpError, fail, int, num, str } = require('../lib/http');
const uploads = require('../lib/uploads');
const { post, get } = require('./_util');

const router = express.Router();

get(router, '/get_active', async (req, res) => {
    const lat = req.query.lat !== undefined ? num(req.query.lat) : null;
    const lng = req.query.lng !== undefined ? num(req.query.lng) : null;
    const radius = req.query.radius !== undefined ? int(req.query.radius, 50) : 50;
    const type = ['product', 'service'].includes(req.query.type) ? req.query.type : null;
    const list = await auctions.getActive(lat, lng, radius, type);
    res.json({ status: 'success', count: list.length, auctions: list });
});

get(router, '/get_by_id', async (req, res) => {
    const id = int(req.query.product_id);
    if (id <= 0) throw fail('ID inválido.');
    const product = await auctions.getById(id);
    if (!product) throw new HttpError(404, 'Leilão não encontrado.');
    res.json({ status: 'success', data: product });
});

get(router, '/my_selling', requireAuth, async (req, res) => {
    const status = req.query.status !== undefined ? str(req.query.status) : null;
    if (status !== null && !['active', 'sold', 'ended', 'expired'].includes(status)) throw fail('Estado inválido.');
    const list = await auctions.getBySeller(req.user.id, status);
    res.json({ status: 'success', count: list.length, auctions: list });
});

get(router, '/my_won', requireAuth, async (req, res) => {
    const list = await auctions.getByWinner(req.user.id);
    res.json({ status: 'success', count: list.length, auctions: list });
});

post(router, '/cancel', requireAuth, async (req, res) => {
    const id = int(req.body && req.body.product_id);
    if (id <= 0) throw fail('ID inválido.');
    res.json(await auctions.cancel(id, req.user.id));
});

post(router, '/create', requireAuth, async (req, res) => {
    const err = await uploads.run(uploads.auctionImages, req, res);
    const files = req.files || [];
    const bail = message => {
        uploads.removeFiles(files);
        throw fail(message);
    };

    if (err) {
        uploads.removeFiles(files);
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
            throw fail('Máximo de 15 fotos permitido.');
        }
        if (err.code === 'LIMIT_FILE_SIZE') throw fail(`Foto ${files.length + 1} é demasiado grande (máx 5 MB).`);
        if (err.code === 'INVALID_TYPE') throw fail(`Foto ${err.index}: formato inválido. Usa JPG, PNG ou WebP.`);
        throw fail('Erro ao carregar as imagens.');
    }

    const b = req.body || {};
    const type = b.type === 'service' ? 'service' : 'product';
    // Produtos: 3 a 15 fotos. Serviços (ex.: explicações): basta 1.
    const minFiles = type === 'service' ? 1 : 3;
    if (files.length === 0) bail(type === 'service' ? 'Adiciona pelo menos 1 imagem ao serviço.' : 'Mínimo 3 imagens obrigatórias.');
    if (files.length < minFiles) bail('Adiciona pelo menos 3 fotos ao leilão.');

    const data = {
        userId: req.user.id,
        type,
        name: str(b.name).trim(),
        description: str(b.description).trim(),
        condition: type === 'service' ? null : b.condition ? str(b.condition) : 'used',
        price: num(b.startPrice),
        location: str(b.location).trim(),
        lat: num(b.latitude),
        lng: num(b.longitude),
        categoryId: int(b.categoryId),
        endsAt: str(b.ends_at),
        imagePaths: files.map(f => `uploads/products/${f.filename}`),
    };

    if (!data.name || !data.description || data.categoryId <= 0 || !data.endsAt) {
        bail('Preenche todos os campos obrigatórios.');
    }
    if (type === 'product' && !['new', 'like new', 'good', 'used'].includes(data.condition)) bail('Condição inválida.');
    if (!Number.isInteger(data.price)) bail('O preço inicial tem de ser um número inteiro de créditos.');
    if (data.price < 1) bail('O preço inicial tem de ser no mínimo 1 crédito.');
    if (data.price > 1000000) bail('O preço inicial não pode exceder 1 000 000 créditos.');

    let id;
    try {
        id = await auctions.create(data);
    } catch (e) {
        uploads.removeFiles(files);
        if (e.code === '23503') throw fail('Categoria inválida.');
        throw e;
    }
    res.json({ status: 'success', message: 'Leilão criado com sucesso!', id, images: files.length });
});

module.exports = router;
