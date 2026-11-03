// Notificações de um utilizador (sino e página de notificações).
// São criadas pelo worker a partir dos eventos (consumers/notifications.js) e pelo job de favoritos.

const db = require('../db/pool');
const { HttpError, fail } = require('../lib/http');

async function list(userId, limit) {
    const { rows } = await db.read(
        `select not_id, not_type, not_message, not_read, not_created_at
           from notifications where not_usr_id = $1
          order by not_created_at desc limit $2`,
        [userId, limit],
    );
    return rows;
}

async function markRead(userId, notificationId) {
    const { rowCount } = await db.write('update notifications set not_read = true where not_id = $1 and not_usr_id = $2', [
        notificationId,
        userId,
    ]);
    if (!rowCount) throw new HttpError(403, 'Sem permissão.');
}

async function markAllRead(userId) {
    const { rowCount } = await db.write('update notifications set not_read = true where not_usr_id = $1 and not_read = false', [userId]);
    return rowCount;
}

async function remove(userId, notificationId) {
    const owner = await db.read('select not_usr_id from notifications where not_id = $1', [notificationId]);
    if (!owner.rowCount) throw fail('Notificação não encontrada.');
    if (owner.rows[0].not_usr_id !== userId) throw new HttpError(403, 'Sem permissão.');
    await db.write('delete from notifications where not_id = $1 and not_usr_id = $2', [notificationId, userId]);
}

module.exports = { list, markRead, markAllRead, remove };
