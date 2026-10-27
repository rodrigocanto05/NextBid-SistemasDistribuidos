# categories

insert into category (cat_name) values ('Eletrónica');          # 1
insert into category (cat_name) values ('Moda');                # 2
insert into category (cat_name) values ('Casa');                # 3
insert into category (cat_name) values ('Desporto');            # 4
insert into category (cat_name) values ('Colecionáveis');       # 5
insert into category (cat_name) values ('Videojogos');          # 6
insert into category (cat_name) values ('Automóveis');          # 7
insert into category (cat_name) values ('Livros');              # 8
insert into category (cat_name) values ('Arte');                # 9
insert into category (cat_name) values ('Música');              # 10
insert into category (cat_name) values ('Antiguidades');        # 11
insert into category (cat_name) values ('Brinquedos');          # 12
insert into category (cat_name) values ('Relógios & Joias');    # 13
insert into category (cat_name) values ('Outros');              # 14

#users

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Rodrigo Canto', 'rodrigocanto@hotmail.com', 'canto', 'M', str_to_date('2005.10.20','%Y.%m.%d'), 'rodrigo_canto.jpg', 'Estudante e fã de tecnologia.', 150.00, 'Lisboa', 120, 'admin', str_to_date('2024.10.20','%Y.%m.%d'));        # usr_id = 1

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Rodrigo Daibert', 'rodrigodaibert@hotmail.com', '1234', 'M', str_to_date('2005.10.22','%Y.%m.%d'), 'rodrigo_daibert.jpg', 'Gosto de leilões e gaming.', 90.00, 'Amadora', 95, 'admin', str_to_date('2024.10.22','%Y.%m.%d'));       # usr_id = 2

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Marco Fonseca', 'mf2006@gmail.com', 'hash1', 'M', str_to_date('2006.10.24','%Y.%m.%d'), 'marco_fonseca.jpg', 'Colecionador e vendedor ocasional.', 200.00, 'Cascais', 180, 'admin', str_to_date('2024.10.24','%Y.%m.%d'));            # usr_id = 3

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Luis Quirim', 'luisquirim@gmail.com', 'hash1', 'M', str_to_date('2004.10.28','%Y.%m.%d'), 'luis_quirim.jpg', 'Interesso-me por artigos para casa e carros.', 60.00, 'Sintra', 60, 'normaluser', str_to_date('2024.10.28','%Y.%m.%d'));    # usr_id = 4

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Sandra Estrela', 'sandra@hotmail.com', 'hash1', 'F', str_to_date('2003.10.30','%Y.%m.%d'), 'sandra_estrela.jpg', 'Adoro moda e decoração.', 120.00, 'Oeiras', 140, 'normaluser', str_to_date('2024.10.30','%Y.%m.%d'));                 # usr_id = 5

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Daniel Paulo', 'dexpaulo@hotmail.com', 'hash1', 'M', str_to_date('2005.11.01','%Y.%m.%d'), 'daniel_paulo.jpg', 'Utilizador ativo na plataforma.', 80.00, 'Loures', 75, 'admin', str_to_date('2024.11.01','%Y.%m.%d'));                # usr_id = 6

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Jocy Grangeiro', 'jocy12@gmail.com', 'hash1', 'F', str_to_date('2004.11.04','%Y.%m.%d'), 'jocy_grangeiro.jpg', 'Gosto de oportunidades e prémios.', 110.00, 'Setúbal', 110, 'normaluser', str_to_date('2024.11.04','%Y.%m.%d'));            # usr_id = 7

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Paulo Alberto', 'pauloencomendas@gmail.com', 'hash1', 'M', str_to_date('2001.11.09','%Y.%m.%d'), 'paulo_alberto.jpg', 'Interessa-me eletrónica e desporto.', 95.00, 'Almada', 90, 'normaluser', str_to_date('2024.11.09','%Y.%m.%d'));     # usr_id = 8

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Patricia Daibert', 'patriciadaibert@hotmail.com', 'hash1', 'F', str_to_date('2002.11.13','%Y.%m.%d'), 'patricia_daibert.jpg', 'Procuro artigos de moda e casa.', 130.00, 'Lisboa', 130, 'normaluser', str_to_date('2024.11.13','%Y.%m.%d')); # usr_id = 9

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Martim Fonseca', 'mrmartim@hotmail.com', 'hash1', 'M', str_to_date('2006.12.01','%Y.%m.%d'), 'martim_fonseca.jpg', 'Curioso por videojogos e gadgets.', 50.00, 'Braga', 55, 'normaluser', str_to_date('2024.12.01','%Y.%m.%d'));          # usr_id = 10

insert into userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_photo, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Tomas Lebre', 'tomaslebre@gmail.com', 'hash1', 'M', str_to_date('2005.12.02','%Y.%m.%d'), 'tomas_lebre.jpg', 'Participante frequente em leilões.', 70.00, 'Coimbra', 70, 'normaluser', str_to_date('2024.12.02','%Y.%m.%d'));           # usr_id = 11
  
#products

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('iPhone 13', 'iPhone 13 usado em excelente estado.', 1, 1, null, 'like new', 400.00, 'Lisboa', 38.7169, -9.1399, 'active', date_add(now(), interval 3 day), now());     # prd_id = 1

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Nike Air Max', 'Ténis praticamente novos.', 2, 5, null, 'like new', 60.00, 'Oeiras', 38.6979, -9.3017, 'active', date_add(now(), interval 5 day), now());     # prd_id = 2

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Mesa de Madeira', 'Mesa sólida para sala de jantar.', 3, 4, null, 'good', 80.00, 'Sintra', 38.8029, -9.3817, 'active', date_add(now(), interval 7 day), now());     # prd_id = 3

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Bola Futebol Adidas', 'Bola oficial pouco usada.', 4, 8, null, 'good', 25.00, 'Almada', 38.6794, -9.1569, 'active', date_add(now(), interval 2 day), now());     # prd_id = 4

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Cartas Pokémon', 'Coleção rara de cartas.', 5, 3, 7, 'like new', 150.00, 'Cascais', 38.6970, -9.4215, 'sold', date_sub(now(), interval 1 day), date_sub(now(), interval 7 day));     # prd_id = 5

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('PlayStation 5', 'Consola PS5 com comando.', 6, 1, null, 'like new', 450.00, 'Lisboa', 38.7169, -9.1399, 'active', date_add(now(), interval 4 day), now());     # prd_id = 6

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Peugeot 206', 'Carro usado em bom estado.', 7, 4, null, 'used', 1200.00, 'Sintra', 38.8029, -9.3817, 'active', date_add(now(), interval 7 day), now());     # prd_id = 7

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Livro Harry Potter', 'Livro em bom estado.', 8, 9, null, 'good', 10.00, 'Lisboa', 38.7169, -9.1399, 'active', date_add(now(), interval 3 day), now());     # prd_id = 8
#product_attribute

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (1, 'Storage', '128GB');                     # atr_id = 1

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (1, 'Color', 'Black');                       # atr_id = 2

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (2, 'Size', '42');                           # atr_id = 3

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (2, 'Brand', 'Nike');                        # atr_id = 4

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (3, 'Material', 'Wood');                     # atr_id = 5

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (3, 'Seats', '6');                           # atr_id = 6

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (6, 'Version', 'Digital Edition');           # atr_id = 7

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (6, 'Storage', '825GB');                     # atr_id = 8

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (7, 'Kilometers', '120000');                 # atr_id = 9

insert into product_attribute (atr_prd_id, atr_name, atr_value)
values (7, 'Fuel', 'Diesel');                       # atr_id = 10

#product_image

insert into product_image (img_prd_id, img_path, img_is_primary)
values (1, 'iphone13_1.jpg', true);                 # img_id = 1

insert into product_image (img_prd_id, img_path, img_is_primary)
values (1, 'iphone13_2.jpg', false);                # img_id = 2

insert into product_image (img_prd_id, img_path, img_is_primary)
values (2, 'nike_airmax.jpg', true);                # img_id = 3

insert into product_image (img_prd_id, img_path, img_is_primary)
values (3, 'mesa_madeira.jpg', true);               # img_id = 4

insert into product_image (img_prd_id, img_path, img_is_primary)
values (4, 'bola_adidas.jpg', true);                # img_id = 5

insert into product_image (img_prd_id, img_path, img_is_primary)
values (5, 'pokemon_cards.jpg', true);              # img_id = 6

insert into product_image (img_prd_id, img_path, img_is_primary)
values (6, 'ps5.jpg', true);                        # img_id = 7

insert into product_image (img_prd_id, img_path, img_is_primary)
values (7, 'peugeot206.jpg', true);                 # img_id = 8

insert into product_image (img_prd_id, img_path, img_is_primary)
values (8, 'harry_potter_book.jpg', true);          # img_id = 9

#transactions

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (1, 'deposit', 150.00, 'Initial balance', str_to_date('2024.10.20','%Y.%m.%d'));           # tra_id = 1

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (2, 'deposit', 90.00, 'Initial balance', str_to_date('2024.10.22','%Y.%m.%d'));            # tra_id = 2

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (3, 'deposit', 200.00, 'Initial balance', str_to_date('2024.10.24','%Y.%m.%d'));           # tra_id = 3

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (4, 'deposit', 60.00, 'Initial balance', str_to_date('2024.10.28','%Y.%m.%d'));            # tra_id = 4

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (5, 'deposit', 120.00, 'Initial balance', str_to_date('2024.10.30','%Y.%m.%d'));           # tra_id = 5

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (6, 'deposit', 80.00, 'Initial balance', str_to_date('2024.11.01','%Y.%m.%d'));            # tra_id = 6

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (7, 'deposit', 110.00, 'Initial balance', str_to_date('2024.11.04','%Y.%m.%d'));           # tra_id = 7

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (8, 'deposit', 95.00, 'Initial balance', str_to_date('2024.11.09','%Y.%m.%d'));            # tra_id = 8

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (9, 'deposit', 130.00, 'Initial balance', str_to_date('2024.11.13','%Y.%m.%d'));           # tra_id = 9

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (10, 'deposit', 50.00, 'Initial balance', str_to_date('2024.12.01','%Y.%m.%d'));           # tra_id = 10

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (11, 'deposit', 70.00, 'Initial balance', str_to_date('2024.12.02','%Y.%m.%d'));           # tra_id = 11

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at)
values (7, 'debit', 180.00, 'Auction win - Pokemon Cards', str_to_date('2025.01.10','%Y.%m.%d')); # tra_id = 12
  
#bid

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (1, 2, 420.00, str_to_date('2025.01.05','%Y.%m.%d'));     # bid_id = 1

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (1, 5, 450.00, str_to_date('2025.01.06','%Y.%m.%d'));     # bid_id = 2

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (1, 7, 480.00, str_to_date('2025.01.07','%Y.%m.%d'));     # bid_id = 3

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (2, 4, 65.00, str_to_date('2025.01.08','%Y.%m.%d'));      # bid_id = 4

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (2, 8, 70.00, str_to_date('2025.01.09','%Y.%m.%d'));      # bid_id = 5

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (5, 2, 160.00, str_to_date('2025.01.07','%Y.%m.%d'));     # bid_id = 6

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (5, 5, 170.00, str_to_date('2025.01.08','%Y.%m.%d'));     # bid_id = 7

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (5, 7, 180.00, str_to_date('2025.01.09','%Y.%m.%d'));     # bid_id = 8

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (6, 3, 470.00, str_to_date('2025.01.10','%Y.%m.%d'));     # bid_id = 9

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (6, 1, 500.00, str_to_date('2025.01.11','%Y.%m.%d'));     # bid_id = 10

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (7, 4, 1300.00, str_to_date('2025.01.12','%Y.%m.%d'));    # bid_id = 11

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at)
values (7, 8, 1400.00, str_to_date('2025.01.13','%Y.%m.%d'));    # bid_id = 12

#xp_level

insert into xp_level (lvl_number, lvl_xp_required) values (1, 0);
insert into xp_level (lvl_number, lvl_xp_required) values (2, 50);
insert into xp_level (lvl_number, lvl_xp_required) values (3, 100);
insert into xp_level (lvl_number, lvl_xp_required) values (4, 150);
insert into xp_level (lvl_number, lvl_xp_required) values (5, 200);
insert into xp_level (lvl_number, lvl_xp_required) values (6, 250);
insert into xp_level (lvl_number, lvl_xp_required) values (7, 300);
insert into xp_level (lvl_number, lvl_xp_required) values (8, 350);
insert into xp_level (lvl_number, lvl_xp_required) values (9, 400);
insert into xp_level (lvl_number, lvl_xp_required) values (10, 450);

#xp_logs

insert into xp_logs (xpl_usr_id, xpl_amount, xpl_reason, xpl_created_at)
values (2, 10, 'Placed a bid on iPhone 13', str_to_date('2025.01.05','%Y.%m.%d'));  # xpl_id = 1

insert into xp_logs (xpl_usr_id, xpl_amount, xpl_reason, xpl_created_at)
values (7, 50, 'Won auction', str_to_date('2025.01.10','%Y.%m.%d'));                # xpl_id = 2

insert into xp_logs (xpl_usr_id, xpl_amount, xpl_reason, xpl_created_at)
values (4, 10, 'Placed a bid', str_to_date('2025.01.12','%Y.%m.%d'));               # xpl_id = 3

insert into xp_logs (xpl_usr_id, xpl_amount, xpl_reason, xpl_created_at)
values (8, 10, 'Placed a bid', str_to_date('2025.01.13','%Y.%m.%d'));               # xpl_id = 4

#notifications

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at)
values (2, 'bid', 'Your bid on iPhone 13 was placed.', false, str_to_date('2025.01.05','%Y.%m.%d'));       # not_id = 1

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at)
values (2, 'outbid', 'You have been outbid on iPhone 13.', false, str_to_date('2025.01.06','%Y.%m.%d'));   # not_id = 2

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at)
values (5, 'bid', 'Your bid on iPhone 13 was placed.', false, str_to_date('2025.01.06','%Y.%m.%d'));       # not_id = 3

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at)
values (5, 'outbid', 'You have been outbid on iPhone 13.', false, str_to_date('2025.01.07','%Y.%m.%d'));   # not_id = 4

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at)
values (7, 'bid', 'Your bid on Pokemon Cards was placed.', false, str_to_date('2025.01.09','%Y.%m.%d'));   # not_id = 5

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at)
values (7, 'win', 'You won the auction for Pokemon Cards.', false, str_to_date('2025.01.10','%Y.%m.%d'));  # not_id = 6

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at)
values (3, 'bid', 'Your bid on PlayStation 5 was placed.', false, str_to_date('2025.01.10','%Y.%m.%d'));   # not_id = 7

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at)
values (3, 'outbid', 'You have been outbid on PlayStation 5.', false, str_to_date('2025.01.11','%Y.%m.%d')); # not_id = 8

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at)
values (1, 'bid', 'Your bid on PlayStation 5 was placed.', false, str_to_date('2025.01.11','%Y.%m.%d'));   # not_id = 9

#review

insert into review (rev_usr_id, rev_reviewed_usr_id, rev_prd_id, rev_rating, rev_created_at)
values (7, 3, 5, 5, str_to_date('2025.01.11','%Y.%m.%d'));   # rev_id = 1

insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_created_at) 
values (1, 1, 'Teste de mensagem do chat - Sistema funcionando!', now());

