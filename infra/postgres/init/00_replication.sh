#!/usr/bin/env bash
# Corre só no primeiro arranque do nó de bootstrap (pg-primary), antes do esquema.
#
# 1. Utilizador de replicação + linha no pg_hba.conf. O pg_hba.conf fica dentro de PGDATA,
#    por isso as réplicas herdam-no no pg_basebackup: qualquer nó que venha a ser promovido
#    já aceita réplicas.
# 2. Utilizador da aplicação, sem privilégios de superutilizador (a API não precisa deles).
#    As permissões nas tabelas são dadas no 03_grants.sh, depois de o esquema existir.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
    create role "${REPLICATION_USER}" with replication login password '${REPLICATION_PASSWORD}';
    create role "${APP_DB_USER}" with login password '${APP_DB_PASSWORD}';
    alter database "${POSTGRES_DB}" set timezone to 'Europe/Lisbon';
SQL

echo "host replication ${REPLICATION_USER} all scram-sha-256" >> "$PGDATA/pg_hba.conf"
