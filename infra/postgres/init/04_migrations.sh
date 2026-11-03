#!/usr/bin/env bash
# Corre só na criação da base de dados (nó de bootstrap), depois do esquema, dos dados e das
# permissões: aplica as migrações de infra/postgres/migrations. Para uma base de dados que já
# existia, ver infra/postgres/migrate.sh.
set -e
bash /scripts/migrate.sh
