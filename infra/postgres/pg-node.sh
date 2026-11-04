#!/usr/bin/env bash
# Entrypoint dos 3 nós PostgreSQL (pg-primary, pg-replica1, pg-replica2).
#
# O papel de cada nó (principal ou réplica) não está fixo no docker-compose: é decidido no
# arranque, perguntando aos outros nós quem é o principal (descoberta por nomes, slides cap. 10).
#
#   Volume vazio
#     -> já existe um principal noutro nó?  pg_basebackup a partir dele e arranca como réplica.
#     -> não existe e PG_BOOTSTRAP=true?     inicializa como principal (initdb + scripts de init).
#     -> não existe e não é bootstrap?       espera até haver principal.
#
#   Volume com dados de principal (não há standby.signal)
#     -> outro nó já é principal?            ESTE NÓ FOI SUBSTITUÍDO num failover enquanto esteve
#                                            em baixo. Arrancar como principal criaria dois principais
#                                            (split brain). Em vez disso apaga os dados antigos e
#                                            volta a clonar como réplica. É a "reposição da
#                                            redundância após recuperação" pedida no enunciado.
#     -> não?                                arranca como principal.
#
#   Volume com dados de réplica (há standby.signal)
#     -> aponta primary_conninfo para o principal atual (pode ter mudado enquanto esteve em baixo).
#
# Variáveis: NODE_NAME, PG_NODES (lista host[:porta] separada por vírgulas), PG_BOOTSTRAP,
#            POSTGRES_USER/POSTGRES_PASSWORD, REPLICATION_USER/REPLICATION_PASSWORD.
set -Eeuo pipefail

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
NODE_NAME="${NODE_NAME:?NODE_NAME em falta}"
PG_NODES="${PG_NODES:?PG_NODES em falta}"
WAIT_PRIMARY_S="${WAIT_PRIMARY_S:-120}"

log() { echo "[pg-node ${NODE_NAME}] $*" >&2; }

host_of() { echo "${1%%:*}"; }
port_of() { local p="${1#*:}"; [ "$p" = "$1" ] && p=5432; echo "$p"; }

as_postgres() {
    if [ "$(id -u)" != "0" ]; then "$@"
    elif command -v su-exec >/dev/null; then su-exec postgres "$@"
    elif command -v gosu >/dev/null; then gosu postgres "$@"
    else su postgres -s /bin/bash -c "$(printf '%q ' "$@")"
    fi
}

# Escreve "<nó> <timeline>" do principal com a timeline mais alta (excluindo este nó), ou nada.
find_primary() {
    local best="" best_tli=-1 node out rec tli
    for node in ${PG_NODES//,/ }; do
        [ "$node" = "$NODE_NAME" ] && continue
        out=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -X -tA -F' ' \
            "host=$(host_of "$node") port=$(port_of "$node") user=$POSTGRES_USER dbname=postgres connect_timeout=2" \
            -c "select pg_is_in_recovery(),
                       case when pg_is_in_recovery() then 0
                            else ('x' || substr(pg_walfile_name(pg_current_wal_lsn()), 1, 8))::bit(32)::int end" \
            2>/dev/null) || continue
        rec="${out%% *}"
        tli="${out##* }"
        if [ "$rec" = "f" ] && [ "$tli" -gt "$best_tli" ]; then
            best="$node"
            best_tli="$tli"
        fi
    done
    [ -n "$best" ] && echo "$best $best_tli"
    return 0
}

# Escreve os nós (excluindo este) que respondem, seja como principal ou réplica.
alive_nodes() {
    local node
    for node in ${PG_NODES//,/ }; do
        [ "$node" = "$NODE_NAME" ] && continue
        PGPASSWORD="$POSTGRES_PASSWORD" psql -X -tA \
            "host=$(host_of "$node") port=$(port_of "$node") user=$POSTGRES_USER dbname=postgres connect_timeout=2" \
            -c "select 1" >/dev/null 2>&1 && echo "$node"
    done
    return 0
}

conninfo() {
    echo "host=$(host_of "$1") port=$(port_of "$1") user=${REPLICATION_USER} password=${REPLICATION_PASSWORD} application_name=${NODE_NAME//[^a-zA-Z0-9_]/_}"
}

set_primary_conninfo() {
    local conf="$PGDATA/postgresql.auto.conf"
    sed -i '/^primary_conninfo/d' "$conf"
    echo "primary_conninfo = '$(conninfo "$1")'" >> "$conf"
}

wipe_pgdata() {
    # PGDATA é a raiz do volume: apaga-se o conteúdo, não a pasta
    find "$PGDATA" -mindepth 1 -delete 2>/dev/null || rm -rf "${PGDATA:?}"/* "${PGDATA:?}"/.[!.]* 2>/dev/null || true
}

clone_from() {
    local src="$1"
    log "a clonar dados de ${src} (pg_basebackup)"
    wipe_pgdata
    mkdir -p "$PGDATA"
    chown postgres:postgres "$PGDATA" 2>/dev/null || true
    chmod 700 "$PGDATA"
    as_postgres pg_basebackup -d "$(conninfo "$src")" -D "$PGDATA" -X stream -R -c fast
    set_primary_conninfo "$src"
    log "clone concluído; a arrancar como réplica de ${src}"
}

if [ -s "$PGDATA/PG_VERSION" ]; then
    found="$(find_primary)"
    primary="${found%% *}"
    if [ ! -f "$PGDATA/standby.signal" ]; then
        if [ -n "$primary" ]; then
            log "ATENÇÃO: ${primary} já é principal (timeline ${found##* }). Este nó foi substituído num failover."
            log "Para evitar dois principais (split brain), os dados antigos são descartados e o nó volta como réplica."
            clone_from "$primary"
        else
            log "a arrancar como principal"
        fi
    else
        if [ -n "$primary" ]; then
            set_primary_conninfo "$primary"
            log "a arrancar como réplica de ${primary}"
        else
            log "a arrancar como réplica (principal ainda desconhecido)"
        fi
    fi
else
    waited=0
    while :; do
        found="$(find_primary)"
        primary="${found%% *}"
        if [ -n "$primary" ]; then
            clone_from "$primary"
            break
        fi
        if [ "${PG_BOOTSTRAP:-false}" = "true" ]; then
            others="$(alive_nodes)"
            if [ -z "$others" ]; then
                log "nenhum principal encontrado: a inicializar este nó como principal"
                break
            fi
            # Há réplicas com dados mas nenhum principal: criar aqui uma BD vazia seria perder
            # tudo. O caminho certo é promover uma réplica (failover.sh) e este nó clona-a.
            log "há réplicas vivas ($(echo $others)) mas nenhum principal."
            log "não vou criar uma BD vazia. Promove uma réplica: docker compose exec pg-replica1 bash /scripts/failover.sh"
        fi
        if [ "$waited" -ge "$WAIT_PRIMARY_S" ]; then
            log "nenhum principal ao fim de ${WAIT_PRIMARY_S}s; a sair (o Docker volta a tentar)"
            exit 1
        fi
        log "à espera de um principal..."
        sleep 3
        waited=$((waited + 3))
    done
fi

# Scripts de inicialização (só o nó de bootstrap os usa, e só com o volume vazio).
# São copiados para dentro do contentor em vez de montados diretamente: no Docker Desktop
# (macOS/Windows) os ficheiros montados podem não ter permissão de execução
# ("bad interpreter: Permission denied"). A cópia também remove CRLF do Windows.
if [ "${PG_BOOTSTRAP:-false}" = "true" ] && [ -d /scripts/init ]; then
    mkdir -p /docker-entrypoint-initdb.d
    for f in /scripts/init/*; do
        [ -f "$f" ] || continue
        tr -d '\r' < "$f" > "/docker-entrypoint-initdb.d/$(basename "$f")"
    done
    chmod 755 /docker-entrypoint-initdb.d/* 2>/dev/null || true
fi

# Vigia de failover automático (watchdog.sh): corre em segundo plano neste contentor e deteta
# a falha do principal, promove a réplica mais adiantada e desliga um principal antigo que
# reapareça. Copiado para /tmp pelo mesmo motivo dos scripts de init (permissões e CRLF).
WATCHDOG_SRC="${PG_WATCHDOG_SCRIPT:-/scripts/watchdog.sh}"
if [ "${PG_WATCHDOG:-true}" = "true" ] && [ -f "$WATCHDOG_SRC" ]; then
    tr -d '\r' < "$WATCHDOG_SRC" > /tmp/pg-watchdog.sh
    bash /tmp/pg-watchdog.sh &
fi

exec "${PG_START_CMD:-docker-entrypoint.sh}" "$@"
