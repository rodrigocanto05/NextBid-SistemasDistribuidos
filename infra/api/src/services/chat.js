// Chat de cada leilão. As mensagens de sistema ("licitou", "terminou") são escritas pelo worker
// (consumers/notifications.js) e pelo create() dos leilões, com services/common.js#chatSystem.
//
// Ordem por cht_id (e não por cht_created_at): o frontend pede só as mensagens novas com
// after_id = último id recebido. now() é a hora de INÍCIO da transação, por isso duas mensagens
// escritas em paralelo podiam ficar com created_at numa ordem e ids na outra; ordenar por data e
// continuar a partir do id repetia mensagens no ecrã. O id cresce pela ordem de escrita.

const db = require('../db/pool');
const { fail } = require('../lib/http');
const realtime = require('../realtime/socket');

const SELECT = `select c.cht_id, c.cht_content, c.cht_created_at, c.cht_is_system,
                       u.usr_id as user_id, u.usr_name as user_name, u.usr_photo as user_photo
                  from chat_message c join users u on c.cht_usr_id = u.usr_id`;

async function list(productId, afterId, limit) {
    const { rows } =
        afterId > 0
            ? await db.read(`${SELECT} where c.cht_prd_id = $1 and c.cht_id > $2 order by c.cht_id asc limit $3`, [productId, afterId, limit])
            : await db.read(`${SELECT} where c.cht_prd_id = $1 order by c.cht_id asc limit $2`, [productId, limit]);
    return rows;
}

async function send(userId, productId, content) {
    const { rows } = await db.write(
        `insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system)
         select prd_id, $2, $3, false from product where prd_id = $1
         returning cht_id`,
        [productId, userId, content],
    );
    if (!rows[0]) throw fail('Leilão não encontrado.');
    realtime.toAuction(productId, 'chat:new', { product_id: productId, cht_id: rows[0].cht_id });
    return rows[0].cht_id;
}

module.exports = { list, send };
