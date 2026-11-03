// Sessões (JWT). Os tokens não têm estado no servidor: as 3 APIs validam-nos com o mesmo segredo.
// Terminar sessões antes de o token expirar precisa, por isso, de estado partilhado:
//
//   * logout de UMA sessão -> o `jti` do token vai para revoked_token até à data em que expiraria.
//     Antes estava no Redis, sem persistência e com "falha aberta": um reinício do Redis, ou o Redis
//     em baixo, voltava a aceitar tokens terminados. No PostgreSQL sobrevive a reinícios e failovers
//     (replicação síncrona) e é verificado na mesma consulta que lib/auth.js já fazia a `users`.
//   * logout de TODAS as sessões -> incrementa users.usr_token_version; tokens com a versão antiga
//     deixam de valer.

const db = require('../db/pool');

async function revoke(jti, expiresAtUnix) {
    await db.write(
        'insert into revoked_token (rvk_jti, rvk_expires_at) values ($1, to_timestamp($2)) on conflict (rvk_jti) do nothing',
        [jti, expiresAtUnix],
    );
}

async function revokeAll(userId) {
    await db.write('update users set usr_token_version = usr_token_version + 1 where usr_id = $1', [userId]);
}

module.exports = { revoke, revokeAll };
