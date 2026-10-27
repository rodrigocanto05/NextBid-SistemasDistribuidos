
create table userss (
    usr_id         int not null auto_increment,
    usr_name       varchar(80) not null,
    usr_email      varchar(120) not null,
    usr_password   varchar(200) not null,
    usr_gender     char(1) not null,
    usr_birthdate  date not null,
    usr_photo      varchar(255),
    usr_bio        text,
    usr_balance    decimal(10,2) not null default 0.00,
    usr_location   varchar(120),
    usr_xp         int not null default 0,
    usr_role       enum('admin','normaluser') not null default 'normaluser',
    usr_created_at datetime not null default current_timestamp,
    primary key (usr_id),
    unique key uq_userss_email (usr_email)
);

create table auth_tokens (
    tok_id         int not null auto_increment,
    tok_usr_id     int not null,
    tok_token      varchar(64) not null,
    tok_created_at datetime not null default current_timestamp,
    tok_expires_at datetime not null,
    primary key (tok_id),
    unique key uq_token (tok_token),
    index idx_tok_usr_id (tok_usr_id)
);

create table category (
    cat_id      int not null auto_increment,
    cat_name    varchar(80) not null,
    primary key (cat_id),
    unique key uq_category_name (cat_name)
);

create table product (
    prd_id             int not null auto_increment,
    prd_name           varchar(120) not null,
    prd_description    text not null,
    prd_cat_id         int not null,
    prd_usr_id         int not null,
    prd_winner_usr_id  int,
    prd_condition      enum('new','like new','good','used') not null,
    prd_start_price    decimal(10,2) not null,
    prd_location       varchar(120),
    prd_latitude       decimal(10,7),
    prd_longitude      decimal(10,7),
    prd_status         enum('active','ended','sold','expired') not null default 'active',
    prd_ends_at        datetime not null,
    prd_created_at     datetime not null default current_timestamp,
    primary key (prd_id)
);

create table product_attribute (
    atr_id      int not null auto_increment,
    atr_prd_id  int not null,
    atr_name    varchar(80) not null,
    atr_value   varchar(255) not null,
    primary key (atr_id),
    index idx_product_attribute_prd_id (atr_prd_id)
);

create table product_image (
    img_id          int not null auto_increment,
    img_prd_id      int not null,
    img_path        varchar(255) not null,
    img_is_primary  boolean not null default false,
    primary key (img_id)
);

create table transactions (
    tra_id          int not null auto_increment,
    tra_usr_id      int not null,
    tra_type        enum('deposit','debit') not null,
    tra_amount      decimal(10,2) not null,
    tra_description varchar(255),
    tra_created_at  datetime not null default current_timestamp,
    primary key (tra_id),
    index idx_transactions_usr_id (tra_usr_id)
);

create table bid (
    bid_id          int not null auto_increment,
    bid_prd_id      int not null,
    bid_usr_id      int not null,
    bid_amount      decimal(10,2) not null,
    bid_created_at  datetime not null default current_timestamp,
    primary key (bid_id),
    index idx_bids_prd_id (bid_prd_id),
    index idx_bid_usr_id (bid_usr_id)
);

create table xp_logs (
    xpl_id          int not null auto_increment,
    xpl_usr_id      int not null,
    xpl_amount      int not null,
    xpl_reason      varchar(255) not null,
    xpl_created_at  datetime not null default current_timestamp,
    primary key (xpl_id),
    index idx_xp_logs_usr_id (xpl_usr_id)
);

create table xp_level (
    lvl_id          int not null auto_increment,
    lvl_number      int not null,
    lvl_xp_required int not null,
    primary key (lvl_id),
    unique key uq_xp_level_number (lvl_number)
);

create table notifications (
    not_id           int not null auto_increment,
    not_usr_id       int not null,
    not_type         varchar(50),
    not_message      text not null,
    not_read         boolean not null default false,
    not_created_at   datetime not null default current_timestamp,
    primary key (not_id),
    index idx_notifications_usr_id (not_usr_id)
);

create table review (
    rev_id               int not null auto_increment,
    rev_usr_id           int not null,
    rev_reviewed_usr_id  int not null,
    rev_prd_id           int not null,
    rev_rating           tinyint not null,
    rev_comment          text,
    rev_created_at       datetime not null default current_timestamp,
    primary key (rev_id),
    unique key uq_review_per_product (rev_usr_id, rev_prd_id),
    index idx_review_reviewed_usr_id (rev_reviewed_usr_id),
    constraint chk_review_rating check (rev_rating between 1 and 5)
);

create table chat_message (
    cht_id          int not null auto_increment,
    cht_prd_id      int not null,
    cht_usr_id      int not null,
    cht_content     text not null,
    cht_is_system   tinyint(1) not null default 0,
    cht_created_at  datetime not null default current_timestamp,
    primary key (cht_id),
    index idx_chat_message_prd_id (cht_prd_id),
    index idx_chat_message_usr_id (cht_usr_id),
    index idx_chat_message_prd_created (cht_prd_id, cht_created_at)
);

create table product_favorite (
    fav_id          int not null auto_increment,
    fav_usr_id      int not null,
    fav_prd_id      int not null,
    fav_created_at  datetime not null default current_timestamp,
    primary key (fav_id),
    unique key uq_favorite_user_product (fav_usr_id, fav_prd_id),
    index idx_favorite_usr_id (fav_usr_id),
    index idx_favorite_prd_id (fav_prd_id)
);

create index idx_product_usr_id on product(prd_usr_id);
create index idx_product_cat_id on product(prd_cat_id);
create index idx_product_winner_usr_id on product(prd_winner_usr_id);
create index idx_product_status on product(prd_status);
create index idx_product_ends_at on product(prd_ends_at);

alter table auth_tokens
add constraint auth_tokens_fk_user
foreign key (tok_usr_id) references userss(usr_id)
on delete cascade;

alter table product
add constraint product_fk_user
foreign key (prd_usr_id) references userss(usr_id);

alter table product
add constraint product_fk_category
foreign key (prd_cat_id) references category(cat_id);

alter table product
add constraint product_fk_winner
foreign key (prd_winner_usr_id) references userss(usr_id)
on delete set null;

alter table product_attribute
add constraint product_attribute_fk_product
foreign key (atr_prd_id) references product(prd_id)
on delete cascade;

alter table product_image
add constraint product_image_fk_product
foreign key (img_prd_id) references product(prd_id)
on delete cascade;

alter table transactions
add constraint transactions_fk_user
foreign key (tra_usr_id) references userss(usr_id)
on delete cascade;

alter table bid
add constraint bid_fk_product
foreign key (bid_prd_id) references product(prd_id)
on delete cascade;

alter table bid
add constraint bid_fk_user
foreign key (bid_usr_id) references userss(usr_id);

alter table xp_logs
add constraint xp_logs_fk_user
foreign key (xpl_usr_id) references userss(usr_id)
on delete cascade;

alter table review
add constraint review_fk_user
foreign key (rev_usr_id) references userss(usr_id)
on delete cascade;

alter table review
add constraint review_fk_reviewed_user
foreign key (rev_reviewed_usr_id) references userss(usr_id)
on delete cascade;

alter table review
add constraint review_fk_product
foreign key (rev_prd_id) references product(prd_id)
on delete cascade;

alter table notifications
add constraint notifications_fk_user
foreign key (not_usr_id) references userss(usr_id)
on delete cascade;

alter table chat_message
add constraint chat_message_fk_product
foreign key (cht_prd_id) references product(prd_id)
on delete cascade;

alter table chat_message
add constraint chat_message_fk_user
foreign key (cht_usr_id) references userss(usr_id)
on delete cascade;

alter table product_favorite
add constraint favorite_fk_user
foreign key (fav_usr_id) references userss(usr_id)
on delete cascade;

alter table product_favorite
add constraint favorite_fk_product
foreign key (fav_prd_id) references product(prd_id)
on delete cascade;
