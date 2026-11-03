// Operações pequenas reutilizadas por vários serviços.
// Recebem sempre o `client` da transação em curso, para fazerem parte do mesmo "tudo ou nada".

async function notify(c, userId, message, type = null) {
    await c.query('insert into notifications (not_usr_id, not_message, not_type) values ($1, $2, $3)', [
        userId,
        message,
        type,
    ]);
}

// Equivalente a NotificationManager::createOnce: não repete a mesma notificação em 24 h.
async function notifyOnce(c, userId, message, type, dedupeKey, ttlSeconds = 86400) {
    const { rowCount } = await c.query(
        `select 1 from notifications
          where not_usr_id = $1 and not_type = $2 and not_message like $3
            and not_created_at >= now() - make_interval(secs => $4)
          limit 1`,
        [userId, type, `%${dedupeKey}%`, ttlSeconds],
    );
    if (rowCount) return false;
    await notify(c, userId, message, type);
    return true;
}

// Mensagem de sistema no chat do leilão (ChatManager::sendSystem).
// cht_usr_id fica com o vendedor para a FK ser válida; cht_is_system diz ao frontend
// para a mostrar como evento.
async function chatSystem(c, productId, content) {
    const text = String(content || '').trim();
    if (!text || text.length > 500) return null;
    const { rows } = await c.query(
        `insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system)
         select prd_id, prd_usr_id, $2, true from product where prd_id = $1
         returning cht_id`,
        [productId, text],
    );
    return rows[0] ? rows[0].cht_id : null;
}

// atribuirXPAleatorio do PHP: 5 a 15 XP.
async function giveRandomXp(c, userId, reason = 'Atividade no NextBid') {
    const xp = 5 + Math.floor(Math.random() * 11);
    await c.query('update users set usr_xp = usr_xp + $1 where usr_id = $2', [xp, userId]);
    await c.query('insert into xp_logs (xpl_usr_id, xpl_amount, xpl_reason) values ($1, $2, $3)', [
        userId,
        xp,
        reason,
    ]);
}

// Subconsultas usadas em várias listagens de leilões (iguais às do PHP).
const MAIN_IMAGE = `(select img_path from product_image
                      where img_prd_id = p.prd_id
                      order by img_is_primary desc, img_id asc limit 1)`;
const CURRENT_BID = '(select max(bid_amount) from bid where bid_prd_id = p.prd_id)';
const BID_COUNT = '(select count(*)::int from bid where bid_prd_id = p.prd_id)';

module.exports = { notify, notifyOnce, chatSystem, giveRandomXp, MAIN_IMAGE, CURRENT_BID, BID_COUNT };
