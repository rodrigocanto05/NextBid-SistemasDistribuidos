// Autenticação com JWT (substitui a tabela auth_tokens do PHP).
//
// Porque é que isto funciona com 3 instâncias: todas assinam e validam com o mesmo JWT_SECRET,
// por isso um token emitido pela api1 é aceite pela api2 sem estado partilhado em memória.
//
// Mesmo assim cada pedido autenticado faz UMA leitura à BD (como o PHP fazia a auth_tokens):
//   * confirma que o utilizador ainda existe;
//   * compara usr_token_version com o `tv` do token -> é assim que o logout_all invalida
//     todas as sessões de uma vez;
//   * verifica se este token foi terminado com logout (revoked_token, ver services/tokens.js);
//   * lê o papel atual (se um admin perder o papel, perde-o já, não daqui a 7 dias).

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/pool');
const { HttpError } = require('./http');

function signToken(user) {
    const jti = crypto.randomBytes(16).toString('hex');
    const token = jwt.sign(
        { sub: String(user.usr_id), role: user.usr_role, tv: user.usr_token_version, jti },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn },
    );
    const { exp } = jwt.decode(token);
    return { token, expiresAt: new Date(exp * 1000) };
}

function bearer(req) {
    const h = req.headers.authorization || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    return m ? m[1].trim() : null;
}

async function authenticate(req) {
    const token = bearer(req);
    if (!token) throw new HttpError(401, 'Token em falta.');

    let payload;
    try {
        payload = jwt.verify(token, config.jwt.secret);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new HttpError(401, 'Sessão expirada. Inicia sessão novamente.');
        }
        throw new HttpError(401, 'Token inválido.');
    }

    const { rows } = await db.read(
        `select u.usr_id, u.usr_name, u.usr_email, u.usr_role, u.usr_token_version,
                exists (select 1 from revoked_token r where r.rvk_jti = $2) as revoked
           from users u where u.usr_id = $1`,
        [Number(payload.sub), String(payload.jti || '')],
    );
    const u = rows[0];
    if (!u || u.revoked || u.usr_token_version !== payload.tv) throw new HttpError(401, 'Token inválido.');

    return { id: u.usr_id, name: u.usr_name, email: u.usr_email, role: u.usr_role, jti: payload.jti, exp: payload.exp };
}

// Middleware: req.user fica preenchido ou responde 401.
const requireAuth = (req, res, next) =>
    authenticate(req)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(next);

module.exports = { signToken, requireAuth, authenticate };
