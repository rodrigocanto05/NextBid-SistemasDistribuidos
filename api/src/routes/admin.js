// /api/admin/seed-image: grava uma imagem dos dados de demonstração em infra/seed-uploads/.
// Só para administradores e só quando SEED_DIR está definido (docker-compose.yml).
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../lib/auth');
const { HttpError, str } = require('../lib/http');
const { post } = require('./_util');

const router = express.Router();
const SEED_DIR = process.env.SEED_DIR || '';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } }).single('image');

post(router, '/seed-image', requireAuth, async (req, res) => {
    if (!SEED_DIR) throw new HttpError(404, 'Endpoint não encontrado.');
    if (req.user.role !== 'admin') throw new HttpError(403, 'Apenas administradores.');

    await new Promise((resolve, reject) => upload(req, res, err => (err ? reject(new HttpError(400, err.message)) : resolve())));
    const name = str(req.body && req.body.name);
    if (!/^[a-z0-9-]+\.(jpg|png|webp)$/.test(name)) throw new HttpError(400, 'Nome inválido.');
    if (!req.file || !/^image\/(jpeg|png|webp)$/.test(req.file.mimetype)) throw new HttpError(400, 'Imagem inválida.');

    fs.mkdirSync(SEED_DIR, { recursive: true });
    fs.writeFileSync(path.join(SEED_DIR, name), req.file.buffer);
    res.json({ status: 'success', path: `uploads/seed/${name}`, bytes: req.file.size });
});

module.exports = router;
