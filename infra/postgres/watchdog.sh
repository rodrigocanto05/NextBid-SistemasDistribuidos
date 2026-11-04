#!/usr/bin/env bash
# Vigia de failover AUTOMÁTICO da base de dados. Corre em segundo plano dentro de cada um dos
# 3 contentores PostgreSQL (lançado pelo pg-node.sh), por isso não há um "gestor" central que
# possa ele próprio falhar.
#
# A cada FAILOVER_CHECK_S segundos, cada nó vê o seu próprio papel e o dos outros:
#
#   Réplica e há um principal vivo
#     -> confirma que está a seguir esse principal; se não estiver (o principal mudou num
#        failover), aponta-se para ele (primary_conninfo + reload, sem reiniciar).
#
#   Réplica e NÃO há principal vivo durante FAILOVER_AFTER verificações seguidas (~10 s)
#     -> deteção de falha do principal. Todas as réplicas vivas fazem a mesma escolha:
#        a que recebeu mais WAL (em empate, a primeira da lista PG_NODES). Com replicação
#        síncrona 'ANY 1', pelo menos uma réplica tem todos os commits confirmados, por isso
#        promover a mais adiantada garante que nenhum lance aceite se perde.
#        Só a escolhida se promove (pg_promote); as outras passam a segui-la na volta seguinte.
#
#   Principal, mas outro nó é principal com timeline mais alta
#     -> este nó foi substituído num failover enquanto estava isolado. Para não haver dois
#        principais (split brain) desliga-se; o Docker reinicia o contentor e o pg-node.sh
#        volta a cloná-lo como réplica do principal atual.
#        Enquanto esteve isolado não pode ter confirmado escritas: com replicação síncrona,
#        um principal sem réplicas fica à espera e nenhum COMMIT é confirmado ao cliente.
#
# Variáveis: NODE_NAME, PG_NODES, POSTGRES_USER/POSTGRES_PASSWORD, REPLICATION_USER/PASSWORD,
#            FAILOVER_CHECK_S (2), FAILOVER_AFTER (5), FAILOVER_GRACE_S (30),
#            PG_FENCE_CMD (comando para desligar este nó; por omissão "kill -INT 1",
#            que pede ao PostgreSQL, processo 1 do contentor, um shutdown rápido).

NODE_NAME="${NODE_NAME:?NODE_NAME em falta}"
PG_NODES="${PG_NODES:?PG_NODES em falta}"
CHECK_S="${FAILOVER_CHECK_S:-2}"
AFTER="${FAILOVER_AFTER:-5}"
GRACE_S="${FAILOVER_GRACE_S:-30}"
FENCE_CMD="${PG_FENCE_CMD:-kill -INT 1}"

log() { echo "[failover ${NODE_NAME}] $*" >&2; }

host_of() { echo "${1%%:*}"; }
port_of() { local p="${1#*:}"; [ "$p" = "$1" ] && p=5432; echo "$p"; }
addr_of() { echo "$(host_of "$1"):$(port_of "$1")"; }

# Consulta um nó. Sem saída (e código != 0) se o nó não responder.
q() {
    PGPASSWORD="$POSTGRES_PASSWORD" psql -X -q -tA -F' ' \
        "host=$(host_of "$1") port=$(port_of "$1") user=$POSTGRES_USER dbname=postgres connect_timeout=2" \
        -c "$2" 2>/dev/null
}

TLI_SQL="('x' || substr(pg_walfile_name(pg_current_wal_lsn()), 1, 8))::bit(32)::int"
RECEIVED_SQL="select pg_wal_lsn_diff(coalesce(greatest(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn()), '0/0'), '0/0')::bigint"

# "<nó> <timeline>" do principal com a timeline mais alta, excluindo este nó (ou nada).
find_other_primary() {
    local best="" best_tli=-1 node out rec tli
    for node in ${PG_NODES//,/ }; do
        [ "$node" = "$NODE_NAME" ] && continue
        out=$(q "$node" "select pg_is_in_recovery(), case when pg_is_in_recovery() then 0 else $TLI_SQL end") || continue
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

# Réplica viva que recebeu mais WAL (em empate, a primeira de PG_NODES). Inclui este nó.
choose_candidate() {
    local best="" best_lsn=-1 node rec lsn
    for node in ${PG_NODES//,/ }; do
        rec=$(q "$node" "select pg_is_in_recovery()") || continue
        [ "$rec" = "t" ] || continue
        lsn=$(q "$node" "$RECEIVED_SQL") || continue
        [ -n "$lsn" ] || continue
        if [ "$lsn" -gt "$best_lsn" ]; then
            best="$node"
            best_lsn="$lsn"
        fi
    done
    echo "$best"
}

follow() {
    local primary="$1"
    local conn="host=$(host_of "$primary") port=$(port_of "$primary") user=${REPLICATION_USER} password=${REPLICATION_PASSWORD} application_name=${NODE_NAME//[^a-zA-Z0-9_]/_}"
    conn="${conn//\'/\'\'}"
    if q "$NODE_NAME" "alter system set primary_conninfo = '$conn'" >/dev/null \
        && q "$NODE_NAME" "select pg_reload_conf()" >/dev/null; then
        log "passa a seguir o principal ${primary}"
    else
        log "não consegui apontar para ${primary}; tento de novo"
    fi
}

current_upstream() {
    local ci
    ci=$(q "$NODE_NAME" "select setting from pg_settings where name = 'primary_conninfo'") || return 0
    local h p
    h=$(echo "$ci" | sed -n 's/.*host=\([^ ]*\).*/\1/p')
    p=$(echo "$ci" | sed -n 's/.*port=\([^ ]*\).*/\1/p')
    [ -n "$h" ] && echo "${h}:${p:-5432}"
}

started=$(date +%s)
misses=0
waiting_for=""
log "vigia ativo (verifica a cada ${CHECK_S}s; failover após ${AFTER} falhas seguidas)"

while sleep "$CHECK_S"; do
    rec=$(q "$NODE_NAME" "select pg_is_in_recovery()") || continue   # este nó ainda não está pronto
    [ -n "$rec" ] || continue

    found=$(find_other_primary)
    primary="${found%% *}"
    ptli="${found##* }"

    # ── Este nó é principal ────────────────────────────────────────────────────────────
    if [ "$rec" = "f" ]; then
        misses=0
        [ -n "$primary" ] || continue
        mytli=$(q "$NODE_NAME" "select $TLI_SQL") || continue
        if [ -n "$mytli" ] && [ "$ptli" -gt "$mytli" ]; then
            log "ATENÇÃO: ${primary} é o principal atual (timeline ${ptli}); este nó (timeline ${mytli}) foi substituído."
            log "a desligar este nó para evitar dois principais; ao reiniciar volta como réplica de ${primary}"
            $FENCE_CMD
            exit 0
        fi
        continue
    fi

    # ── Este nó é réplica e há principal ───────────────────────────────────────────────
    if [ -n "$primary" ]; then
        [ "$misses" -ge 1 ] && log "principal ${primary} disponível"
        misses=0
        waiting_for=""
        up=$(current_upstream)
        [ "$up" = "$(addr_of "$primary")" ] || follow "$primary"
        continue
    fi

    # ── Este nó é réplica e não há principal ──────────────────────────────────────────
    misses=$((misses + 1))
    [ "$misses" -eq 1 ] && log "o principal não responde (falha 1 de ${AFTER})"
    [ "$misses" -ge "$AFTER" ] || continue
    if [ $(( $(date +%s) - started )) -lt "$GRACE_S" ]; then
        continue   # arranque recente: dar tempo ao principal para arrancar também
    fi

    cand=$(choose_candidate)
    if [ -z "$cand" ]; then
        continue
    elif [ "$cand" = "$NODE_NAME" ]; then
        log "principal em baixo há ${misses} verificações: este nó é a réplica mais adiantada; a promover"
        if q "$NODE_NAME" "select pg_promote(true, 60)" >/dev/null; then
            q "$NODE_NAME" "checkpoint" >/dev/null
            tli=$(q "$NODE_NAME" "select $TLI_SQL")
            log "PROMOVIDO: este nó é agora o principal (timeline ${tli})"
        else
            log "a promoção falhou; tento de novo"
        fi
        misses=0
    elif [ "$waiting_for" != "$cand" ]; then
        log "principal em baixo: a réplica escolhida para principal é ${cand}; a aguardar a promoção"
        waiting_for="$cand"
    fi
done
