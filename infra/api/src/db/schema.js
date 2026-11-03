// Verificação do esquema no arranque. As tabelas novas chegam por migrações
// (infra/postgres/migrations): numa base de dados criada antes delas, a API arrancava e os lances
// falhavam com "relation outbox does not exist". Assim o problema aparece logo nos logs, com o
// comando que o resolve.

const db = require('./pool');
const log = require('../lib/log');

const REQUIRED = ['outbox', 'processed_event', 'revoked_token'];

async function check() {
    for (let attempt = 0; attempt < 30; attempt++) {
        try {
            const { rows } = await db.read(
                'select t as name from unnest($1::text[]) t where to_regclass(t) is null',
                [REQUIRED],
            );
            if (rows.length) {
                log.error(
                    `faltam tabelas na base de dados (${rows.map(r => r.name).join(', ')}). ` +
                        'Aplica as migrações no nó principal: docker compose exec -T pg-primary bash /scripts/migrate.sh',
                );
            }
            return rows.length === 0;
        } catch {
            await new Promise(r => setTimeout(r, 2000)); // BD ainda a arrancar
        }
    }
    return false;
}

module.exports = { check };
