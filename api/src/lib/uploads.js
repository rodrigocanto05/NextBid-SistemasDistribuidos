// Uploads de imagens.
//
// Com 3 instâncias, uma imagem gravada no disco da api1 não existiria na api2. Por isso
// UPLOAD_DIR é um volume Docker partilhado pelas 3 APIs e servido diretamente pelo Nginx em
// /backend/uploads/. O caminho guardado na BD continua igual ao do PHP: "uploads/products/<ficheiro>".

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config');

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

for (const sub of ['products', 'avatars']) {
    fs.mkdirSync(path.join(config.uploadDir, sub), { recursive: true });
}

const sanitize = name => path.basename(String(name || '')).replace(/[^a-zA-Z0-9._-]/g, '');

function storage(sub, nameFn) {
    return multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(config.uploadDir, sub)),
        filename: (req, file, cb) => {
            req._uploadIdx = (req._uploadIdx || 0) + 1;
            cb(null, nameFn(req, file, req._uploadIdx - 1));
        },
    });
}

const epoch = () => Math.floor(Date.now() / 1000);

// Leilão: até 15 fotos de 5 MB (como o create.php)
const auctionImages = multer({
    storage: storage('products', (req, file, i) => `${epoch()}_${i}_${sanitize(file.originalname)}`),
    limits: { fileSize: 5 * 1024 * 1024, files: 15 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED.has(file.mimetype)) return cb(null, true);
        const err = new Error('invalid type');
        err.code = 'INVALID_TYPE';
        err.index = req._uploadIdx || 0;
        cb(err);
    },
}).array('images[]', 15);

// Avatar: 1 foto de 3 MB (como o update_photo.php)
const avatar = multer({
    storage: storage('avatars', (req, file) => `user${req.user.id}_${epoch()}_${sanitize(file.originalname)}`),
    limits: { fileSize: 3 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED.has(file.mimetype)) return cb(null, true);
        const err = new Error('invalid type');
        err.code = 'INVALID_TYPE';
        cb(err);
    },
}).single('photo');

// Corre o middleware do multer como promessa e devolve o erro (se houver) em vez de o lançar.
const run = (mw, req, res) => new Promise(resolve => mw(req, res, err => resolve(err || null)));

// "uploads/products/x.jpg" -> caminho em disco (só dentro de UPLOAD_DIR)
function diskPath(dbPath) {
    const rel = String(dbPath || '').replace(/^uploads\//, '');
    const full = path.resolve(config.uploadDir, rel);
    if (!full.startsWith(path.resolve(config.uploadDir) + path.sep)) return null;
    return full;
}

function removeFiles(files = []) {
    for (const f of files) fs.unlink(f.path, () => {});
}

function removeDbPath(dbPath) {
    const p = diskPath(dbPath);
    if (p) fs.unlink(p, () => {});
}

module.exports = { auctionImages, avatar, run, removeFiles, removeDbPath };
