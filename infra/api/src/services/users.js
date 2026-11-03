// Contas de utilizador: registo, credenciais, perfil e fotografia.

const bcrypt = require('bcryptjs');
const db = require('../db/pool');
const { HttpError } = require('../lib/http');

const BCRYPT_ROUNDS = 10;
const emailInUse = () => new HttpError(400, 'Este email já está em uso.');

async function register({ name, email, password, gender, birthdate, bio, location }) {
    const xp = 10 + Math.floor(Math.random() * 41); // bónus de boas-vindas, como no PHP
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    try {
        await db.write(
            `insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_location, usr_xp, usr_role)
             values ($1, $2, $3, $4, $5, $6, $7, $8, 'normaluser')`,
            [name, email, hash, gender, birthdate, bio, location, xp],
        );
    } catch (err) {
        if (err.code === '23505') throw emailInUse();
        throw err;
    }
    return { xp };
}

// Utilizador com estas credenciais, ou null. O email não distingue maiúsculas (índice em lower()).
async function verifyCredentials(email, password) {
    const { rows } = await db.read('select * from users where lower(usr_email) = lower($1)', [email]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password, u.usr_password))) return null;
    return u;
}

async function getProfile(userId) {
    const { rows } = await db.read(
        `select u.usr_id, u.usr_name, u.usr_email, u.usr_xp, u.usr_photo, u.usr_bio, u.usr_birthdate,
                u.usr_balance, u.usr_location, u.usr_role, u.usr_created_at,
                (select count(*)::int from product where prd_usr_id = u.usr_id and prd_status = 'active') as active_auctions,
                (select count(*)::int from product where prd_usr_id = u.usr_id) as total_published,
                (select count(*)::int from bid where bid_usr_id = u.usr_id) as total_bids,
                (select count(*)::int from product where prd_usr_id = u.usr_id and prd_status = 'sold') as total_sold,
                (select count(*)::int from product where prd_winner_usr_id = u.usr_id) as total_won,
                (select count(distinct bid_prd_id)::int from bid where bid_usr_id = u.usr_id) as total_participated,
                (select round(avg(rev_rating)::numeric, 2)::float from review where rev_reviewed_usr_id = u.usr_id) as avg_rating,
                (select count(*)::int from review where rev_reviewed_usr_id = u.usr_id) as total_reviews
           from users u where u.usr_id = $1`,
        [userId],
    );
    return rows[0] || null;
}

// Só os campos presentes são alterados. Mudar a password termina as outras sessões.
async function updateProfile(userId, { name, email, password, bio, location }) {
    const sets = [];
    const params = [];
    const add = (col, val) => {
        params.push(val);
        sets.push(`${col} = $${params.length}`);
    };
    if (name) add('usr_name', name);
    if (email) add('usr_email', email);
    if (password) {
        add('usr_password', await bcrypt.hash(password, BCRYPT_ROUNDS));
        sets.push('usr_token_version = usr_token_version + 1');
    }
    if (bio) add('usr_bio', bio);
    if (location) add('usr_location', location);
    params.push(userId);

    try {
        await db.write(`update users set ${sets.join(', ')} where usr_id = $${params.length}`, params);
    } catch (err) {
        if (err.code === '23505') throw emailInUse();
        throw err;
    }
}

// Troca a fotografia e devolve o caminho da antiga (para apagar o ficheiro depois do commit).
async function replacePhoto(userId, dbPath) {
    return db.tx(async c => {
        const r = await c.query('select usr_photo from users where usr_id = $1 for no key update', [userId]);
        await c.query('update users set usr_photo = $1 where usr_id = $2', [dbPath, userId]);
        return r.rows[0] ? r.rows[0].usr_photo : null;
    });
}

module.exports = { register, verifyCredentials, getProfile, updateProfile, replacePhoto };
