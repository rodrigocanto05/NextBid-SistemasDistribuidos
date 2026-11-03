#!/usr/bin/env python3
"""Converte database/inserts.sql (MySQL) para infra/postgres/init/02_seed.sql (PostgreSQL).

Uso (na raiz do repositório):
    python infra/postgres/tools/convert_seed.py database/inserts.sql infra/postgres/init/02_seed.sql

O que muda:
  * comentários '#'                         -> '--'
  * userss                                  -> users
  * str_to_date('2025.01.05','%Y.%m.%d')    -> '2025-01-05'
  * date_add(now(), interval 3 day)         -> (now() + interval '3 day')
  * date_sub(now(), interval 1 day)         -> (now() - interval '1 day')
  * passwords em texto simples              -> hash bcrypt da password de demonstração
    (no MySQL ninguém conseguia fazer login com estes utilizadores: password_verify()
    falha contra texto simples)
"""
import re
import sys

# bcrypt de "nextbid123" (custo 10). Gerado com bcryptjs; compatível com o $2y$ do PHP.
DEMO_HASH = "$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay"


def convert(text: str) -> str:
    text = text.lstrip("﻿").replace("\r\n", "\n")

    # comentários
    text = re.sub(r"^#", "--", text, flags=re.M)
    text = re.sub(r";[ \t]*#", "; --", text)

    text = re.sub(r"\buserss\b", "users", text)

    text = re.sub(
        r"str_to_date\('(\d{4})\.(\d{2})\.(\d{2})',\s*'%Y\.%m\.%d'\)",
        r"'\1-\2-\3'",
        text,
    )
    text = re.sub(
        r"date_add\(now\(\),\s*interval\s+(\d+)\s+(\w+)\)",
        r"(now() + interval '\1 \2')",
        text,
        flags=re.I,
    )
    text = re.sub(
        r"date_sub\(now\(\),\s*interval\s+(\d+)\s+(\w+)\)",
        r"(now() - interval '\1 \2')",
        text,
        flags=re.I,
    )

    # 3.º valor do insert em users = usr_password
    def fix_password(m):
        return f"{m.group(1)}'{DEMO_HASH}'"

    text = re.sub(
        r"(insert into users \([^)]*\)\s*values \('[^']*',\s*'[^']*',\s*)'[^']*'",
        fix_password,
        text,
        flags=re.I,
    )

    header = (
        "-- Gerado por infra/postgres/tools/convert_seed.py a partir de database/inserts.sql\n"
        "-- Password de todos os utilizadores de teste: nextbid123\n\n"
        "begin;\n\n"
    )
    return header + text.strip() + "\n\ncommit;\n"


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    with open(sys.argv[1], encoding="utf-8") as f:
        src = f.read()
    with open(sys.argv[2], "w", encoding="utf-8", newline="\n") as f:
        f.write(convert(src))
