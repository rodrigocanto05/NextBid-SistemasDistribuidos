// /api/user/*  (perfil, fotografia, notificações)
const express = require('express');
const users = require('../services/users');
const notifications = require('../services/notifications');
const { requireAuth } = require('../lib/auth');
const { HttpError, fail, int, str } = require('../lib/http');
const uploads = require('../lib/uploads');
const { post, get } = require('./_util');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const stripTags = s => s.replace(/<[^>]*>/g, '');

// ── Perfil ───────────────────────────────────────────────────────────────
// No PHP qualquer utilizador autenticado via o email, o saldo e a data de nascimento de
// qualquer outro. Agora esses campos só vão para o próprio (ou para um admin).
get(router, '/profile', requireAuth, async (req, res) => {
    const userId = int(req.query.user_id);
    if (userId <= 0) throw fail('ID de utilizador inválido.');

    const profile = await users.getProfile(userId);
    if (!profile) throw new HttpError(404, 'Utilizador não encontrado.');
    if (req.user.id !== userId && req.user.role !== 'admin') {
        delete profile.usr_email;
        delete profile.usr_balance;
        delete profile.usr_birthdate;
    }
    res.json({ status: 'success', data: profile });
});

post(router, '/update_profile', requireAuth, async (req, res) => {
    const b = req.body || {};
    const email = b.email !== undefined && EMAIL_RE.test(str(b.email).trim()) ? str(b.email).trim() : '';
    const password = str(b.password);
    const bio = stripTags(str(b.bio)).trim();
    const location = stripTags(str(b.location)).trim();
    const name = stripTags(str(b.name)).trim();

    if (!email && !password && !bio && !location && !name) throw fail('Indica pelo menos um campo para atualizar.');
    if (password && password.length < 8) throw fail('A password deve ter no mínimo 8 caracteres.');
    if (name && (name.length < 2 || name.length > 80)) throw fail('Nome deve ter entre 2 e 80 caracteres.');
    if (bio && (bio.length < 10 || bio.length > 500)) throw fail('Bio deve ter entre 10 e 500 caracteres.');
    if (location && location.length > 120) throw fail('Localização demasiado longa.');

    await users.updateProfile(req.user.id, { name, email, password, bio, location });
    res.json({ status: 'success', message: 'Dados atualizados com sucesso!' });
});

// ── Fotografia ───────────────────────────────────────────────────────────
post(router, '/update_photo', requireAuth, async (req, res) => {
    const err = await uploads.run(uploads.avatar, req, res);
    if (err) {
        if (req.file) uploads.removeFiles([req.file]);
        if (err.code === 'LIMIT_FILE_SIZE') throw fail('Imagem demasiado grande (máx 3 MB).');
        if (err.code === 'INVALID_TYPE') throw fail('Formato inválido. Usa JPG, PNG ou WebP.');
        throw fail('Erro ao carregar foto.');
    }
    if (!req.file) throw fail('Foto obrigatória.');

    const dbPath = `uploads/avatars/${req.file.filename}`;
    let old;
    try {
        old = await users.replacePhoto(req.user.id, dbPath);
    } catch (e) {
        uploads.removeFiles([req.file]);
        throw e;
    }
    if (old) uploads.removeDbPath(old); // só depois do commit
    res.json({ status: 'success', message: 'Foto atualizada.', photo: dbPath });
});

post(router, '/delete_photo', requireAuth, async (req, res) => {
    const old = await users.replacePhoto(req.user.id, null);
    if (old) uploads.removeDbPath(old);
    res.json({ status: 'success', message: 'Foto removida.' });
});

// ── Notificações ─────────────────────────────────────────────────────────
get(router, '/get_all_notifications', requireAuth, async (req, res) => {
    const limit = Math.min(Math.max(int(req.query.limit, 50), 1), 500);
    const rows = await notifications.list(req.user.id, limit);
    res.json({ status: 'success', count: rows.length, unread_count: rows.filter(n => !n.not_read).length, notifications: rows });
});

post(router, '/mark_notif_read', requireAuth, async (req, res) => {
    const id = int(req.body && req.body.notificationId);
    if (id <= 0) throw fail('ID de notificação inválido.');
    await notifications.markRead(req.user.id, id);
    res.json({ status: 'success', message: 'Notificação lida.' });
});

post(router, '/mark_all_read', requireAuth, async (req, res) => {
    const updated = await notifications.markAllRead(req.user.id);
    res.json({ status: 'success', message: `${updated} notificações marcadas como lidas.`, updated });
});

post(router, '/delete_notification', requireAuth, async (req, res) => {
    const id = int(req.body && req.body.notificationId);
    if (id <= 0) throw fail('ID inválido.');
    await notifications.remove(req.user.id, id);
    res.json({ status: 'success', message: 'Notificação apagada.' });
});

module.exports = router;
