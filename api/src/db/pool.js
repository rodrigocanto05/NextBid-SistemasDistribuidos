// Acesso à base de dados com descoberta do nó principal.
//
// Há 3 nós PostgreSQL (DB_HOSTS). Só um aceita escritas (o principal); os outros são réplicas
// em modo de leitura. Depois de um failover o principal muda de nó, e o driver `pg` do Node
// não suporta vários hosts. Por isso:
//
//   1. discover() pergunta a cada nó `pg_is_in_recovery()`. Os que respondem `false` são principais.
//   2. Se houver mais do que um principal (o antigo voltou sem saber que foi substituído),
//      fica o da timeline mais alta: cada promoção incrementa a timeline, por isso o nó
//      promovido mais recentemente ganha sempre.
//   3. Um erro de ligação, ou um "read-only transaction" (falámos com uma réplica), invalida
//      o principal atual e força nova descoberta.
//   4. A cada DISCOVERY_INTERVAL_MS a descoberta corre em segundo plano, para apanhar
//      failovers mesmo sem pedidos a falhar.
//
// Modo só de leitura: sem principal (caiu e ainda não houve failover), as leituras passam para
// uma réplica. Com replicação síncrona ANY 1 há sempre uma réplica com tudo o que foi confirmado,
// por isso o site continua a mostrar leilões, imagens e descrições; só as escritas falham (503).
//
// Repetições (slides de Sis-Dis, protocolo request-reply):
//   * Leituras (db.read) repetem-se uma vez depois de nova descoberta: são idempotentes.
//   * Transações (db.tx) só se repetem se a falha foi ao obter a ligação (nada foi enviado)
//     ou por deadlock/serialização (o PostgreSQL já fez rollback). Uma ligação que cai a
//     meio de um COMMIT não se repete: não sabemos se o commit aconteceu, e repetir podia
//     duplicar um lance. Devolve-se 503 e o cliente decide.

const { Pool, Client } = require('pg');
const config = require('../config');
const log = require('../lib/log');
const { HttpError } = require('../lib/http');

const DISCOVERY_INTERVAL_MS = Number(process.env.DB_DISCOVERY_INTERVAL_MS || 5000);
const CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 2000);

const CONNECTION_ERROR_CODES = new Set([
    'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'EHOSTUNREACH', 'EPIPE',
    '57P01', // admin_shutdown
    '57P02', // crash_shutdown
    '57P03', // cannot_connect_now (a arrancar ou em recovery)
    '08000', '08001', '08003', '08004', '08006', // connection_exception
    '25006', // read_only_sql_transaction: estamos a falar com uma réplica
]);
const RETRYABLE_TX_CODES = new Set(['40P01', '40001']); // deadlock, serialization_failure

function isConnectionError(err) {
    if (!err) return false;
    if (CONNECTION_ERROR_CODES.has(err.code)) return true;
    const msg = String(err.message || '');
    return (
        msg.includes('Connection terminated') ||
        msg.includes('timeout exceeded when trying to connect') ||
        msg.includes('Client has encountered a connection error') ||
        msg.includes('No primary')
    );
}

const unavailable = () =>
    new HttpError(503, 'Serviço temporariamente indisponível. Tenta novamente dentro de instantes.');

function parseHost(h) {
    const [host, port] = h.split(':');
    return { host, port: Number(port || 5432) };
}

class Database {
    constructor(cfg) {
        this.cfg = cfg;
        this.pool = null;
        this.primary = null; // { host, port, timeline }
        this.discovering = null;
        this.timer = null;
        this.replicaPools = new Map(); // "host:port" -> Pool pequeno, só para o modo só de leitura
        this.readOnlyFrom = null;      // réplica usada na última leitura sem principal
        this.readOnlyAt = 0;
        this.noPrimarySince = null;    // instante da última descoberta sem principal
        this.lastProbe = [];           // resultado da última descoberta (nós em baixo / réplicas)
    }

    connOptions(node) {
        return {
            host: node.host,
            port: node.port,
            database: this.cfg.name,
            user: this.cfg.user,
            password: this.cfg.password,
            application_name: `nextbid-${config.instanceId}`,
            connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
            options: `-c TimeZone=${this.cfg.timezone}`,
            keepAlive: true,
        };
    }

    async probe(node) {
        const client = new Client(this.connOptions(node));
        client.on('error', () => {});
        try {
            await client.connect();
            const { rows } = await client.query(`
                select pg_is_in_recovery() as in_recovery,
                       case when pg_is_in_recovery() then null
                            else ('x' || substr(pg_walfile_name(pg_current_wal_lsn()), 1, 8))::bit(32)::int
                       end as timeline`);
            return { ...node, inRecovery: rows[0].in_recovery, timeline: rows[0].timeline };
        } catch (err) {
            return { ...node, down: true, error: err.code || err.message };
        } finally {
            client.end().catch(() => {});
        }
    }

    discover() {
        if (!this.discovering) {
            this.discovering = this._discover().finally(() => {
                this.discovering = null;
            });
        }
        return this.discovering;
    }

    async _discover() {
        const nodes = this.cfg.hosts.map(parseHost);
        const results = await Promise.all(nodes.map(n => this.probe(n)));
        this.lastProbe = results;
        const primaries = results.filter(r => !r.down && !r.inRecovery);

        if (primaries.length === 0) {
            if (!this.noPrimarySince) this.noPrimarySince = Date.now();
            if (this.primary) {
                log.warn(`nenhum nó PostgreSQL aceita escritas (${results.map(fmtNode).join(', ')})`);
            }
            this.setPrimary(null);
            throw new Error('No primary database available');
        }

        // Mais do que um principal: fica o da timeline mais alta (o promovido mais recentemente).
        primaries.sort((a, b) => b.timeline - a.timeline);
        if (primaries.length > 1) {
            log.warn(`vários nós dizem ser principal: ${primaries.map(fmtNode).join(', ')}; uso ${fmtNode(primaries[0])}`);
        }
        this.setPrimary(primaries[0]);
        return this.primary;
    }

    setPrimary(node) {
        const same =
            node && this.primary && node.host === this.primary.host && node.port === this.primary.port;
        if (same) {
            this.primary.timeline = node.timeline;
            return;
        }
        const old = this.pool;
        this.pool = null;
        this.primary = null;
        if (old) old.end().catch(() => {});
        if (!node) return;

        this.noPrimarySince = null;
        this.primary = { host: node.host, port: node.port, timeline: node.timeline };
        this.pool = new Pool({ ...this.connOptions(node), max: this.cfg.poolSize, idleTimeoutMillis: 30000 });
        this.pool.on('error', err => {
            log.warn(`erro numa ligação inativa ao PostgreSQL: ${err.message}`);
            if (isConnectionError(err)) this.invalidate();
        });
        log.info(`BD principal: ${node.host}:${node.port} (timeline ${node.timeline})`);
    }

    invalidate() {
        if (this.primary) log.warn(`ligação ao principal ${this.primary.host} perdida; a procurar novo principal`);
        this.setPrimary(null);
    }

    // wait=false: se a última descoberta já não encontrou principal, falha logo em vez de
    // esperar por outra (que demora o timeout de ligação ao nó em baixo).
    async getPool({ wait = true } = {}) {
        if (this.pool) return this.pool;
        if (!wait && this.noPrimarySince) throw unavailable();
        try {
            await this.discover();
        } catch {
            throw unavailable();
        }
        if (!this.pool) throw unavailable();
        return this.pool;
    }

    start() {
        this.discover().catch(() => log.warn('sem BD principal no arranque; nova tentativa em segundo plano'));
        this.timer = setInterval(() => this.discover().catch(() => {}), DISCOVERY_INTERVAL_MS);
        this.timer.unref();
    }

    async stop() {
        clearInterval(this.timer);
        if (this.pool) await this.pool.end().catch(() => {});
        for (const p of this.replicaPools.values()) await p.end().catch(() => {});
    }

    // Leitura idempotente: repete uma vez noutro principal se a ligação falhar; sem principal,
    // lê de uma réplica (opts.primaryOnly desliga isto).
    async read(text, params = [], opts = {}) {
        for (let attempt = 0; ; attempt++) {
            try {
                const pool = await this.getPool({ wait: false });
                return await pool.query(text, params);
            } catch (err) {
                const noPrimary = err instanceof HttpError;
                if (!noPrimary && !isConnectionError(err)) throw err;
                if (!noPrimary) this.invalidate();
                if (noPrimary || attempt >= 1) {
                    if (opts.primaryOnly) throw unavailable();
                    return this.readFromReplica(text, params);
                }
            }
        }
    }

    replicaPool(node) {
        const key = `${node.host}:${node.port}`;
        let pool = this.replicaPools.get(key);
        if (!pool) {
            pool = new Pool({ ...this.connOptions(node), max: 3, idleTimeoutMillis: 10000 });
            pool.on('error', () => {});
            this.replicaPools.set(key, pool);
        }
        return pool;
    }

    async readFromReplica(text, params) {
        // Ordem: a réplica que respondeu da última vez, depois os nós que estavam vivos na última
        // descoberta, e só no fim os que estavam em baixo (cada tentativa a um nó morto custa o timeout).
        const down = new Set(this.lastProbe.filter(r => r.down).map(r => r.host));
        const rank = n => (n.host === this.readOnlyFrom ? 0 : down.has(n.host) ? 2 : 1);
        const nodes = this.cfg.hosts.map(parseHost).sort((a, b) => rank(a) - rank(b));
        for (const node of nodes) {
            try {
                const result = await this.replicaPool(node).query(text, params);
                if (this.readOnlyFrom !== node.host || Date.now() - this.readOnlyAt > 30000) {
                    log.warn(`sem BD principal: leituras servidas por ${node.host} (modo só de leitura)`);
                }
                this.readOnlyFrom = node.host;
                this.readOnlyAt = Date.now();
                return result;
            } catch (err) {
                if (!isConnectionError(err)) throw err;
            }
        }
        throw unavailable();
    }

    // true se a última leitura (nos últimos 10 s) foi servida por uma réplica
    readOnly() {
        return !this.primary && Date.now() - this.readOnlyAt < 10000 ? this.readOnlyFrom : null;
    }

    // Escrita isolada (um único statement): não se repete.
    async write(text, params = []) {
        const pool = await this.getPool();
        try {
            return await pool.query(text, params);
        } catch (err) {
            if (isConnectionError(err)) {
                this.invalidate();
                throw unavailable();
            }
            throw err;
        }
    }

    // Transação: tudo ou nada (slides 7 e 8).
    async tx(fn) {
        for (let attempt = 0; ; attempt++) {
            let client;
            try {
                client = await (await this.getPool()).connect();
            } catch (err) {
                if (err instanceof HttpError) throw err;
                if (isConnectionError(err) && attempt === 0) {
                    this.invalidate(); // nada foi enviado: é seguro tentar no novo principal
                    continue;
                }
                this.invalidate();
                throw unavailable();
            }

            let broken = false;
            try {
                await client.query('begin');
                const result = await fn(client);
                await client.query('commit');
                return result;
            } catch (err) {
                broken = isConnectionError(err);
                if (!broken) await client.query('rollback').catch(() => {});
                if (broken) {
                    this.invalidate();
                    throw unavailable();
                }
                if (RETRYABLE_TX_CODES.has(err.code) && attempt < 2) {
                    log.warn(`transação abortada (${err.code}); nova tentativa ${attempt + 1}`);
                    continue;
                }
                throw err;
            } finally {
                client.release(broken ? true : undefined);
            }
        }
    }

    // Estado de cada nó PostgreSQL, para a página "Arquitetura ao vivo" (/estado).
    // Para as réplicas, o atraso é a diferença (em bytes de WAL) entre o que o principal já
    // escreveu e o que a réplica já aplicou. As colunas de pg_stat_wal_receiver precisam do
    // papel pg_monitor (dado ao utilizador da aplicação no 03_grants.sh).
    async cluster() {
        const nodes = this.cfg.hosts.map(parseHost);
        const results = await Promise.all(
            nodes.map(async node => {
                const client = new Client({ ...this.connOptions(node), connectionTimeoutMillis: 1500 });
                client.on('error', () => {});
                try {
                    await client.connect();
                    const { rows } = await client.query(`
                        select pg_is_in_recovery() as in_recovery,
                               case when pg_is_in_recovery() then null
                                    else ('x' || substr(pg_walfile_name(pg_current_wal_lsn()), 1, 8))::bit(32)::int
                               end as timeline,
                               (case when pg_is_in_recovery() then pg_last_wal_replay_lsn()
                                     else pg_current_wal_lsn() end)::text as lsn,
                               (select sender_host from pg_stat_wal_receiver limit 1) as upstream,
                               (select status from pg_stat_wal_receiver limit 1) as receiver,
                               (select count(*)::int from pg_stat_replication) as replicas,
                               (select string_agg(application_name || ':' || coalesce(sync_state, '?'), ',')
                                  from pg_stat_replication) as sync`);
                    return { node: node.host, up: true, ...rows[0] };
                } catch (err) {
                    return { node: node.host, up: false, error: err.code || err.message };
                } finally {
                    client.end().catch(() => {});
                }
            }),
        );
        const toBig = lsn => {
            if (!lsn) return null;
            const [hi, lo] = lsn.split('/');
            return (BigInt('0x' + hi) << 32n) + BigInt('0x' + lo);
        };
        const primaries = results.filter(r => r.up && !r.in_recovery).sort((a, b) => b.timeline - a.timeline);
        const primary = primaries[0];
        for (const r of results) {
            r.role = !r.up ? 'em baixo' : r.in_recovery ? 'réplica' : r === primary ? 'principal' : 'principal antigo';
            if (r.up && r.in_recovery && primary) {
                const d = toBig(primary.lsn) - toBig(r.lsn);
                r.lag_bytes = Number(d > 0n ? d : 0n);
            }
        }
        return results;
    }

    status() {
        return this.primary ? { ...this.primary } : null;
    }
}

function fmtNode(n) {
    const id = `${n.host}:${n.port}`;
    if (n.down) return `${id}=em baixo`;
    return `${id}=${n.inRecovery ? 'réplica' : `principal(tl ${n.timeline})`}`;
}

module.exports = new Database(config.db);
module.exports.isConnectionError = isConnectionError;
