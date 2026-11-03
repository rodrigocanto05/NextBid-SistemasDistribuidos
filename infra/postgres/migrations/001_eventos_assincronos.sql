-- 001: eventos assíncronos (RabbitMQ) e logout seguro.
-- Ver docs/adr/0001-rabbitmq-eventos-pos-commit.md.
--
-- Idempotente (if not exists): pode correr mais do que uma vez sem erro.
-- Corre como superutilizador, pelo infra/postgres/migrate.sh, que define a variável app_user.

-- Transactional outbox: eventos gravados na MESMA transação do lance/fecho e publicados no
-- RabbitMQ depois do commit pelo relay da API líder (api/src/messaging/outbox.js).
create table if not exists outbox (
    evt_id            bigint      generated always as identity primary key,
    evt_type          text        not null,               -- 'bid.placed', 'auction.closed'
    evt_aggregate_id  integer,                            -- id do leilão (diagnóstico e ordem)
    evt_payload       jsonb       not null,
    evt_created_at    timestamptz not null default now(),
    evt_published_at  timestamptz                         -- null = ainda por publicar
);
-- Índice parcial: o relay só procura os por publicar, que são poucos
create index if not exists idx_outbox_pending on outbox (evt_id) where evt_published_at is null;
create index if not exists idx_outbox_published_at on outbox (evt_published_at) where evt_published_at is not null;

-- Idempotência dos consumidores: (consumidor, evento) processado uma única vez.
-- O RabbitMQ entrega "pelo menos uma vez"; este registo, na mesma transação dos efeitos,
-- transforma isso em efeito "exatamente uma vez" (api/src/messaging/consumer.js).
create table if not exists processed_event (
    pev_consumer      text        not null,
    pev_evt_id        bigint      not null,
    pev_processed_at  timestamptz not null default now(),
    primary key (pev_consumer, pev_evt_id)
);
create index if not exists idx_processed_event_at on processed_event (pev_processed_at);

-- Tokens terminados com logout, até à data em que expirariam (antes estavam no Redis, sem
-- persistência). Verificado em cada pedido autenticado (api/src/lib/auth.js).
create table if not exists revoked_token (
    rvk_jti         text        primary key,
    rvk_expires_at  timestamptz not null
);
create index if not exists idx_revoked_token_expires on revoked_token (rvk_expires_at);

-- O chat passa a ser lido por ordem de id (api/src/services/chat.js)
create index if not exists idx_chat_message_prd_id on chat_message (cht_prd_id, cht_id);

grant select, insert, update, delete on outbox, processed_event, revoked_token to :"app_user";
grant usage, select on all sequences in schema public to :"app_user";
