// Transactional outbox: garante que "lance gravado" e "evento publicado" nunca divergem.
//
// Problema que resolve (dual write): gravar na BD e publicar no RabbitMQ são duas operações em
// dois sistemas. Se a API publicar e depois a transação fizer rollback, o worker avisa de um lance
// que não existe; se fizer commit e morrer antes de publicar, o aviso perde-se.
//
//   1. enqueue(c, evento)  -> INSERT na tabela outbox DENTRO da transação do negócio (o mesmo `c`).
//                             Commit = lance e evento gravados; rollback = nenhum dos dois.
//   2. publishPending(...) -> o relay (jobs/outbox-relay.js, só na instância líder) lê os eventos por
//                             publicar por ordem, publica-os, espera pelas confirmações do broker e
//                             só então os marca como publicados.
//
// Se a API morrer entre publicar e marcar, o evento sai outra vez: a entrega é "pelo menos uma vez"
// e os consumidores eliminam repetidos pelo id (tabela processed_event, messaging/consumer.js).
// Se o RabbitMQ estiver em baixo, os eventos esperam aqui; nada se perde e os lances continuam.

const db = require('../db/pool');
const { EXCHANGE } = require('./topology');
const { envelope } = require('./events');

async function enqueue(c, event) {
    const { rows } = await c.query(
        'insert into outbox (evt_type, evt_aggregate_id, evt_payload) values ($1, $2, $3) returning evt_id',
        [event.type, event.aggregateId, event.data],
    );
    return Number(rows[0].evt_id);
}

function toMessage(row) {
    const env = envelope(row);
    return {
        routingKey: env.type,
        content: Buffer.from(JSON.stringify(env)),
        options: {
            persistent: true, // gravada em disco pelo broker (as quorum queues gravam sempre)
            contentType: 'application/json',
            messageId: String(env.id),
            type: env.type,
            timestamp: Math.floor(new Date(row.evt_created_at).getTime() / 1000),
            appId: 'nextbid-api',
        },
    };
}

// Devolve quantos eventos publicou. `for update skip locked`: se por um instante houver duas
// instâncias a fazer de relay (troca de líder), cada evento só é apanhado por uma delas.
async function publishPending(publisher, batchSize) {
    return db.tx(async c => {
        const { rows } = await c.query(
            `select evt_id, evt_type, evt_payload, evt_created_at
               from outbox
              where evt_published_at is null
              order by evt_id
              limit $1
                for update skip locked`,
            [batchSize],
        );
        if (!rows.length) return 0;
        await publisher.publishAll(EXCHANGE, rows.map(toMessage));
        await c.query('update outbox set evt_published_at = now() where evt_id = any($1::bigint[])', [rows.map(r => r.evt_id)]);
        return rows.length;
    });
}

// Para a página /estado: eventos à espera de publicação e idade do mais antigo.
async function stats() {
    const { rows } = await db.read(
        `select count(*)::int as pending,
                extract(epoch from now() - min(evt_created_at))::int as oldest_s
           from outbox where evt_published_at is null`,
    );
    return { pending: rows[0].pending, oldest_pending_s: rows[0].oldest_s };
}

module.exports = { enqueue, publishPending, stats };
