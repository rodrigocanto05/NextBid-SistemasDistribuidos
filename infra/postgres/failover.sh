#!/usr/bin/env bash
# Failover manual da base de dados: promove a réplica mais adiantada a principal.
#
# Uso (corre dentro de qualquer contentor PostgreSQL que esteja vivo; funciona em PowerShell):
#   docker compose exec pg-replica1 failover.sh            # só promove se o principal estiver em baixo
#   docker compose exec pg-replica1 failover.sh --force    # troca planeada, com o principal vivo
#
# Passos:
#   1. Confirma que o principal está mesmo em baixo (deteção de falha).
#   2. Escolhe, entre as réplicas vivas, a que recebeu mais WAL. Com replicação síncrona
#      'ANY 1', pelo menos uma réplica tem todos os commits confirmados; promover a mais
#      adiantada garante que nenhum lance aceite se perde.
#   3. Promove-a (pg_promote). A timeline sobe: é assim que a API distingue o principal novo
#      de um principal antigo que volte a aparecer.
#   4. Aponta as outras réplicas para o novo principal. Sem isto, a nova principal ficava sem
#      réplicas e, com replicação síncrona, as escritas bloqueavam.
#   5. O antigo principal, quando voltar (docker compose start pg-primary), é detetado pelo
#      pg-node.sh e volta como réplica. Não é preciso fazer nada.
set -Eeuo pipefail

PG_NODES="${PG_NODES:?PG_NODES em falta}"
FORCE="${1:-}"

host_of() { echo "${1%%:*}"; }
port_of() { local p="${1#*:}"; [ "$p" = "$1" ] && p=5432; echo "$p"; }
q() {
    PGPASSWORD="$POSTGRES_PASSWORD" psql -X -tA -F' ' \
        "host=$(host_of "$1") port=$(port_of "$1") user=$POSTGRES_USER dbname=postgres connect_timeout=2" -c "$2"
}

echo "== Estado dos nós"
primaries=()
replicas=()
for node in ${PG_NODES//,/ }; do
    if out=$(q "$node" "select pg_is_in_recovery(),
                               case when pg_is_in_recovery()
                                    then greatest(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn())::text
                                    else pg_current_wal_lsn()::text end" 2>/dev/null); then
        rec="${out%% *}"
        lsn="${out##* }"
        if [ "$rec" = "f" ]; then
            echo "  $node: PRINCIPAL (lsn $lsn)"
            primaries+=("$node")
        else
            echo "  $node: réplica (recebido até $lsn)"
            replicas+=("$node $lsn")
        fi
    else
        echo "  $node: EM BAIXO"
    fi
done

if [ "${#primaries[@]}" -gt 0 ] && [ "$FORCE" != "--force" ]; then
    echo
    echo "O principal (${primaries[*]}) está vivo. Não há nada a fazer."
    echo "Para uma troca planeada usa: failover.sh --force"
    exit 1
fi

if [ "${#replicas[@]}" -eq 0 ]; then
    echo "Nenhuma réplica viva para promover."
    exit 1
fi

# Réplica com o LSN mais alto (compara-se no próprio PostgreSQL, que sabe ordenar pg_lsn)
best=""
best_lsn="0/0"
for r in "${replicas[@]}"; do
    node="${r%% *}"
    lsn="${r##* }"
    first=$(q "$node" "select case when '$lsn'::pg_lsn >= '$best_lsn'::pg_lsn then 't' else 'f' end")
    if [ -z "$best" ] || [ "$first" = "t" ]; then
        best="$node"
        best_lsn="$lsn"
    fi
done

if [ "$FORCE" = "--force" ] && [ "${#primaries[@]}" -gt 0 ]; then
    echo
    echo "== Troca planeada: a parar escritas no principal antigo (${primaries[*]})"
    for p in "${primaries[@]}"; do
        q "$p" "alter system set default_transaction_read_only = on" >/dev/null || true
        q "$p" "select pg_reload_conf()" >/dev/null || true
    done
    sleep 2
fi

echo
echo "== A promover $best (lsn $best_lsn)"
q "$best" "select pg_promote(true, 60)" >/dev/null
q "$best" "checkpoint" >/dev/null
tli=$(q "$best" "select ('x' || substr(pg_walfile_name(pg_current_wal_lsn()), 1, 8))::bit(32)::int")
echo "  $best é agora o principal (timeline $tli)"

echo
echo "== A apontar as outras réplicas para $best"
for r in "${replicas[@]}"; do
    node="${r%% *}"
    [ "$node" = "$best" ] && continue
    app="${node//[^a-zA-Z0-9_]/_}"
    conn="host=$(host_of "$best") port=$(port_of "$best") user=${REPLICATION_USER} password=${REPLICATION_PASSWORD} application_name=${app}"
    if q "$node" "alter system set primary_conninfo = '$conn'" >/dev/null && q "$node" "select pg_reload_conf()" >/dev/null; then
        echo "  $node segue agora $best"
    else
        echo "  $node: não foi possível atualizar (recria-o com: docker compose rm -sf <serviço> e apaga o volume)"
    fi
done

if [ "$FORCE" = "--force" ] && [ "${#primaries[@]}" -gt 0 ]; then
    echo
    echo "O principal antigo (${primaries[*]}) ficou só de leitura."
    echo "Reinicia-o para voltar como réplica:  docker compose restart <serviço do principal antigo>"
fi

echo
echo "Feito. As APIs detetam o novo principal em poucos segundos (ver /api/health)."
