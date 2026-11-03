#!/usr/bin/env bash
# Aplica as migrações em falta (infra/postgres/migrations/*.sql) no nó PRINCIPAL.
#
#   * Base de dados criada antes de uma migração (ex.: volumes de uma versão anterior):
#       docker compose exec -T pg-primary bash /scripts/migrate.sh
#     (trocar pg-primary pelo nó que for o principal atual; ver a página /estado)
#   * Base de dados nova: o init/04_migrations.sh chama este script, não é preciso fazer nada.
#
# Cada migração corre numa transação, junto com o registo em schema_migration: ou fica aplicada
# e registada, ou nada muda. As réplicas recebem as alterações pela replicação.
set -Eeuo pipefail

DIR="${MIGRATIONS_DIR:-/scripts/migrations}"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 --username "${POSTGRES_USER:-postgres}" --dbname "${POSTGRES_DB:-nextbid}")

if [ "$("${PSQL[@]}" -tAc 'select pg_is_in_recovery()')" = "t" ]; then
    echo "este nó é uma réplica: corre o script no nó principal" >&2
    exit 1
fi

"${PSQL[@]}" -c "set client_min_messages = warning" -c "create table if not exists schema_migration (
                     version    text primary key,
                     applied_at timestamptz not null default now())"

applied=0
for f in $(ls "$DIR"/*.sql | sort); do
    v="$(basename "$f" .sql)"
    if [ -n "$("${PSQL[@]}" -tAc "select 1 from schema_migration where version = '$v'")" ]; then
        continue
    fi
    echo "migração $v"
    tr -d '\r' < "$f" > /tmp/migration.sql   # protege contra fins de linha CRLF (clone no Windows)
    "${PSQL[@]}" -v app_user="${APP_DB_USER:-nextbid}" --single-transaction \
        -f /tmp/migration.sql \
        -c "insert into schema_migration (version) values ('$v')"
    applied=$((applied + 1))
done
echo "migrações aplicadas: $applied"
