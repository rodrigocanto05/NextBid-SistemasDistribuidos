// /api/auth/*  (register.php, login.php, logout.php, logout_all.php)
const express = require('express');
const users = require('../services/users');
const tokens = require('../services/tokens');
const { signToken, requireAuth } = require('../lib/auth');
const { HttpError, fail, str } = require('../lib/http');
const { post } = require('./_util');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

post(router, '/register', async (req, res) => {
    const b = req.body || {};
    const name = str(b.name).trim();
    const email = str(b.email).trim();
    const password = str(b.password);
    const gender = str(b.gender);
    const birthdate = str(b.birthdate);
    const bio = str(b.bio).trim();
    const location = str(b.location).trim();

    if (!name || !EMAIL_RE.test(email) || !password || !gender || !birthdate) {
        throw fail('Todos os campos são obrigatórios.');
    }
    if (name.length < 2 || name.length > 80) throw fail('O nome deve ter entre 2 e 80 caracteres.');
    if (!['M', 'F', 'O'].includes(gender)) throw fail('Género inválido.');

    const birth = new Date(birthdate);
    if (Number.isNaN(birth.getTime())) throw fail('Data de nascimento inválida.');
    if (birth.getTime() > Date.now()) throw fail('Data de nascimento não pode ser no futuro.');
    const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age < 18) throw fail('Tens de ter pelo menos 18 anos para te registares.');
    if (age > 120) throw fail('Data de nascimento inválida.');

    if (password.length < 8) throw fail('A password deve ter no mínimo 8 caracteres.');
    if (Buffer.byteLength(password) > 72) throw fail('A password não pode exceder 72 caracteres.');
    if (bio && (bio.length < 10 || bio.length > 500)) throw fail('A biografia deve ter entre 10 e 500 caracteres.');
    if (location.length > 120) throw fail('Localização demasiado longa (máx 120).');

    const { xp } = await users.register({ name, email, password, gender, birthdate, bio, location });
    res.json({ status: 'success', message: `Bem vindo a NextBid! Ganhaste ${xp} XP de bónus.`, xp });
});

post(router, '/login', async (req, res) => {
    const email = str(req.body && req.body.email).trim();
    const password = str(req.body && req.body.password);
    if (!email || !password) throw fail('Email e password obrigatórios.');

    const u = await users.verifyCredentials(email, password);
    if (!u) throw new HttpError(401, 'Credenciais inválidas. Tente novamente.');

    const { token, expiresAt } = signToken(u);
    res.json({
        status: 'success',
        token,
        expires_at: expiresAt,
        user: {
            id: u.usr_id,
            name: u.usr_name,
            email: u.usr_email,
            role: u.usr_role,
            xp: u.usr_xp,
            photo: u.usr_photo,
            location: u.usr_location,
            wallet: Number(u.usr_balance || 0),
        },
    });
});

// Logout desta sessão: o token fica revogado (PostgreSQL) até à data em que expiraria.
post(router, '/logout', requireAuth, async (req, res) => {
    await tokens.revoke(req.user.jti, req.user.exp);
    res.json({ status: 'success', message: 'Sessão terminada.' });
});

// Logout de todas as sessões: incrementa a versão; todos os tokens antigos deixam de valer.
post(router, '/logout_all', requireAuth, async (req, res) => {
    await tokens.revokeAll(req.user.id);
    res.json({ status: 'success', message: 'Todas as sessões terminadas.' });
});

module.exports = router;
