#!/usr/bin/env bash
# Permissões do utilizador da aplicação: só leitura/escrita de dados, sem DDL nem superutilizador.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
    grant usage on schema public to "${APP_DB_USER}";
    grant select, insert, update, delete on all tables in schema public to "${APP_DB_USER}";
    grant usage, select on all sequences in schema public to "${APP_DB_USER}";
    -- só leitura de estatísticas (estado da replicação na página /estado)
    grant pg_monitor to "${APP_DB_USER}";
SQL
