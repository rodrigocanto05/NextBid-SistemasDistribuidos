// Carteira de créditos (saldo e carregamentos). Débitos e reembolsos dos lances estão em services/bids.js.

const db = require('../db/pool');

async function balance(userId) {
    const { rows } = await db.read('select usr_balance from users where usr_id = $1', [userId]);
    return Number(rows[0] ? rows[0].usr_balance : 0);
}

async function deposit(userId, amount, description) {
    await db.tx(async c => {
        await c.query('update users set usr_balance = usr_balance + $1 where usr_id = $2', [amount, userId]);
        await c.query(`insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description) values ($1, 'deposit', $2, $3)`, [
            userId,
            amount,
            description.slice(0, 255),
        ]);
    });
}

module.exports = { balance, deposit };
