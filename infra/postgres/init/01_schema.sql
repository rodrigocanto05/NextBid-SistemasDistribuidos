-- NextBid: esquema PostgreSQL
-- Convertido de database/tabels.sql (MySQL) do repositório NextBid-SistemasDistribuidos.
--
-- Diferenças em relação ao MySQL (ver MIGRACAO.md, secção 5 do guia):
--   * auto_increment              -> generated always as identity
--   * enum(...)                   -> text + check
--   * datetime                    -> timestamptz (fuso: Europe/Lisbon, definido na ligação)
--   * decimal(10,2)               -> numeric(10,2)
--   * índices inline              -> create index à parte
--   * userss                      -> users
--   * auth_tokens                 -> removida (JWT). logout_all usa users.usr_token_version
--   * email único sem distinguir maiúsculas (no MySQL vinha da collation; aqui é um índice em lower())
--   * saldo nunca negativo        -> check (usr_balance >= 0), última barreira contra erros de escrow
--   * bid.bid_request_id          -> deteção de pedidos duplicados (lance repetido pelo cliente)
--   * moeda: créditos da faculdade (sem casas decimais na prática; numeric mantém o contrato da API)
--   * leilões de produtos e de serviços (prd_type / cat_type)
-- A Caça ao Tesouro (gamification, gamification_claim) já tinha sido removida neste repositório.

create table users (
    usr_id            integer generated always as identity primary key,
    usr_name          varchar(80)  not null,
    usr_email         varchar(120) not null,
    usr_password      varchar(200) not null,
    usr_gender        char(1)      not null,
    usr_birthdate     date         not null,
    usr_photo         varchar(255),
    usr_bio           text,
    usr_balance       numeric(10,2) not null default 0.00,
    usr_location      varchar(120),
    usr_xp            integer      not null default 0,
    usr_role          text         not null default 'normaluser',
    usr_token_version integer      not null default 0,
    usr_created_at    timestamptz  not null default now(),
    constraint chk_users_role    check (usr_role in ('admin', 'normaluser')),
    constraint chk_users_balance check (usr_balance >= 0)
);
create unique index uq_users_email on users (lower(usr_email));

create table category (
    cat_id    integer generated always as identity primary key,
    cat_name  varchar(80) not null,
    cat_type  text        not null default 'product',
    constraint uq_category_name unique (cat_name),
    constraint chk_category_type check (cat_type in ('product', 'service'))
);

create table product (
    prd_id             integer generated always as identity primary key,
    prd_name           varchar(120)  not null,
    prd_description    text          not null,
    prd_cat_id         integer       not null references category (cat_id),
    prd_usr_id         integer       not null references users (usr_id),
    prd_winner_usr_id  integer       references users (usr_id) on delete set null,
    prd_type           text          not null default 'product',
    prd_condition      text,
    prd_start_price    numeric(10,2) not null,
    prd_location       varchar(120),
    prd_latitude       numeric(10,7),
    prd_longitude      numeric(10,7),
    prd_status         text          not null default 'active',
    prd_ends_at        timestamptz   not null,
    prd_created_at     timestamptz   not null default now(),
    constraint chk_product_type      check (prd_type in ('product', 'service')),
    constraint chk_product_condition check (prd_condition in ('new', 'like new', 'good', 'used')),
    constraint chk_product_condition_required check (prd_type = 'service' or prd_condition is not null),
    constraint chk_product_status    check (prd_status in ('active', 'ended', 'sold', 'expired'))
);
create index idx_product_usr_id        on product (prd_usr_id);
create index idx_product_cat_id        on product (prd_cat_id);
create index idx_product_winner_usr_id on product (prd_winner_usr_id);
create index idx_product_status        on product (prd_status);
create index idx_product_type          on product (prd_type);
create index idx_product_ends_at       on product (prd_ends_at);

create table product_attribute (
    atr_id      integer generated always as identity primary key,
    atr_prd_id  integer      not null references product (prd_id) on delete cascade,
    atr_name    varchar(80)  not null,
    atr_value   varchar(255) not null
);
create index idx_product_attribute_prd_id on product_attribute (atr_prd_id);

create table product_image (
    img_id          integer generated always as identity primary key,
    img_prd_id      integer      not null references product (prd_id) on delete cascade,
    img_path        varchar(255) not null,
    img_is_primary  boolean      not null default false
);
create index idx_product_image_prd_id on product_image (img_prd_id);

create table transactions (
    tra_id          integer generated always as identity primary key,
    tra_usr_id      integer       not null references users (usr_id) on delete cascade,
    tra_type        text          not null,
    tra_amount      numeric(10,2) not null,
    tra_description varchar(255),
    tra_created_at  timestamptz   not null default now(),
    constraint chk_transactions_type check (tra_type in ('deposit', 'debit'))
);
create index idx_transactions_usr_id on transactions (tra_usr_id);

create table bid (
    bid_id          integer generated always as identity primary key,
    bid_prd_id      integer       not null references product (prd_id) on delete cascade,
    bid_usr_id      integer       not null references users (usr_id),
    bid_amount      numeric(10,2) not null,
    bid_request_id  varchar(64),
    bid_created_at  timestamptz   not null default now(),
    constraint chk_bid_amount check (bid_amount > 0)
);
create index idx_bid_usr_id on bid (bid_usr_id);
-- Lance mais alto de um leilão (usado em cada licitação e no fecho)
create index idx_bid_prd_amount on bid (bid_prd_id, bid_amount desc, bid_id desc);
-- O mesmo pedido de licitação só pode ser gravado uma vez
create unique index uq_bid_request on bid (bid_usr_id, bid_request_id) where bid_request_id is not null;

create table xp_logs (
    xpl_id          integer generated always as identity primary key,
    xpl_usr_id      integer      not null references users (usr_id) on delete cascade,
    xpl_amount      integer      not null,
    xpl_reason      varchar(255) not null,
    xpl_created_at  timestamptz  not null default now()
);
create index idx_xp_logs_usr_id on xp_logs (xpl_usr_id);

create table xp_level (
    lvl_id          integer generated always as identity primary key,
    lvl_number      integer not null,
    lvl_xp_required integer not null,
    constraint uq_xp_level_number unique (lvl_number)
);

create table notifications (
    not_id          integer generated always as identity primary key,
    not_usr_id      integer     not null references users (usr_id) on delete cascade,
    not_type        varchar(50),
    not_message     text        not null,
    not_read        boolean     not null default false,
    not_created_at  timestamptz not null default now()
);
create index idx_notifications_usr_id on notifications (not_usr_id, not_created_at desc);

create table review (
    rev_id               integer generated always as identity primary key,
    rev_usr_id           integer     not null references users (usr_id) on delete cascade,
    rev_reviewed_usr_id  integer     not null references users (usr_id) on delete cascade,
    rev_prd_id           integer     not null references product (prd_id) on delete cascade,
    rev_rating           smallint    not null,
    rev_comment          text,
    rev_created_at       timestamptz not null default now(),
    constraint uq_review_per_product unique (rev_usr_id, rev_prd_id),
    constraint chk_review_rating check (rev_rating between 1 and 5)
);
create index idx_review_reviewed_usr_id on review (rev_reviewed_usr_id);

create table chat_message (
    cht_id          integer generated always as identity primary key,
    cht_prd_id      integer     not null references product (prd_id) on delete cascade,
    cht_usr_id      integer     not null references users (usr_id) on delete cascade,
    cht_content     text        not null,
    cht_is_system   boolean     not null default false,
    cht_created_at  timestamptz not null default now()
);
create index idx_chat_message_usr_id      on chat_message (cht_usr_id);
create index idx_chat_message_prd_created on chat_message (cht_prd_id, cht_created_at);

create table product_favorite (
    fav_id          integer generated always as identity primary key,
    fav_usr_id      integer     not null references users (usr_id) on delete cascade,
    fav_prd_id      integer     not null references product (prd_id) on delete cascade,
    fav_created_at  timestamptz not null default now(),
    constraint uq_favorite_user_product unique (fav_usr_id, fav_prd_id)
);
create index idx_favorite_prd_id on product_favorite (fav_prd_id);
