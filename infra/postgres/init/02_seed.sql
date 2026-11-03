-- Gerado por infra/postgres/tools/gen_seed.py. Não editar à mão: alterar o gerador e voltar a correr.
-- Password de todas as contas de teste: nextbid123. Moeda: créditos da faculdade.

begin;

insert into category (cat_name, cat_type) values ('Eletrónica', 'product');
insert into category (cat_name, cat_type) values ('Moda', 'product');
insert into category (cat_name, cat_type) values ('Casa', 'product');
insert into category (cat_name, cat_type) values ('Desporto', 'product');
insert into category (cat_name, cat_type) values ('Colecionáveis', 'product');
insert into category (cat_name, cat_type) values ('Videojogos', 'product');
insert into category (cat_name, cat_type) values ('Automóveis', 'product');
insert into category (cat_name, cat_type) values ('Livros', 'product');
insert into category (cat_name, cat_type) values ('Arte', 'product');
insert into category (cat_name, cat_type) values ('Música', 'product');
insert into category (cat_name, cat_type) values ('Antiguidades', 'product');
insert into category (cat_name, cat_type) values ('Brinquedos', 'product');
insert into category (cat_name, cat_type) values ('Relógios & Joias', 'product');
insert into category (cat_name, cat_type) values ('Outros', 'product');
insert into category (cat_name, cat_type) values ('Explicações', 'service');
insert into category (cat_name, cat_type) values ('Aulas e workshops', 'service');
insert into category (cat_name, cat_type) values ('Apoio académico', 'service');
insert into category (cat_name, cat_type) values ('Design e multimédia', 'service');
insert into category (cat_name, cat_type) values ('Informática', 'service');

insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Rodrigo Canto', 'rodrigocanto@hotmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'M', '2005-10-20', 'Estudante de Engenharia Informática e fã de tecnologia.', 1954, 'Lisboa', 120, 'admin', (now() - interval '59 days')); -- usr_id = 1
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Rodrigo Daibert', 'rodrigodaibert@hotmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'M', '2005-10-22', 'Gosto de leilões, gaming e sistemas distribuídos.', 1946, 'Amadora', 95, 'admin', (now() - interval '58 days')); -- usr_id = 2
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Marco Fonseca', 'mf2006@gmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'M', '2006-10-24', 'Colecionador e explicador de Matemática.', 2183, 'Cascais', 180, 'admin', (now() - interval '57 days')); -- usr_id = 3
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Luis Quirim', 'luisquirim@gmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'M', '2004-10-28', 'Interesso-me por artigos para casa e carros.', 2000, 'Sintra', 60, 'normaluser', (now() - interval '56 days')); -- usr_id = 4
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Sandra Estrela', 'sandra@hotmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'F', '2003-10-30', 'Adoro moda, decoração e música.', 1901, 'Oeiras', 140, 'normaluser', (now() - interval '55 days')); -- usr_id = 5
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Daniel Paulo', 'dexpaulo@hotmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'M', '2005-11-01', 'Utilizador ativo na plataforma.', 2000, 'Loures', 75, 'admin', (now() - interval '54 days')); -- usr_id = 6
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Jocy Grangeiro', 'jocy12@gmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'F', '2004-11-04', 'Gosto de oportunidades e prémios.', 1248, 'Setúbal', 110, 'normaluser', (now() - interval '53 days')); -- usr_id = 7
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Paulo Alberto', 'pauloencomendas@gmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'M', '2001-11-09', 'Interessa-me eletrónica e desporto.', 629, 'Almada', 90, 'normaluser', (now() - interval '52 days')); -- usr_id = 8
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Patricia Daibert', 'patriciadaibert@hotmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'F', '2002-11-13', 'Revejo relatórios e procuro artigos para casa.', 1890, 'Lisboa', 130, 'normaluser', (now() - interval '51 days')); -- usr_id = 9
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Martim Fonseca', 'mrmartim@hotmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'M', '2006-12-01', 'Designer nas horas vagas, curioso por videojogos.', 1369, 'Braga', 55, 'normaluser', (now() - interval '50 days')); -- usr_id = 10
insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)
values ('Tomas Lebre', 'tomaslebre@gmail.com', '$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay', 'M', '2005-12-02', 'Programador Java e participante frequente em leilões.', 1897, 'Coimbra', 70, 'normaluser', (now() - interval '49 days')); -- usr_id = 11

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('iPhone 13 128 GB', 'iPhone 13 em excelente estado, sempre com capa e película. Bateria a 89 %. Inclui caixa original e cabo USB-C para Lightning.', 1, 1, null, 'product', 'like new', 300, 'Lisboa', 38.7169, -9.1399, 'active', (now() + interval '3 days'), (now() - interval '4 days')); -- prd_id = 1
insert into product_image (img_prd_id, img_path, img_is_primary) values (1, 'uploads/seed/iphone13-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (1, 'uploads/seed/iphone13-2.jpg', false);
insert into product_image (img_prd_id, img_path, img_is_primary) values (1, 'uploads/seed/iphone13-3.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (1, 'Armazenamento', '128 GB');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (1, 'Cor', 'Meia-noite');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (1, 'Bateria', '89 %');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Nike Air Max 90 (tamanho 42)', 'Ténis Nike Air Max 90 usados duas vezes, sem marcas de uso. Vendo porque o tamanho não me serve.', 2, 5, null, 'product', 'like new', 60, 'Oeiras', 38.6979, -9.3017, 'active', (now() + interval '5 days'), (now() - interval '3 days')); -- prd_id = 2
insert into product_image (img_prd_id, img_path, img_is_primary) values (2, 'uploads/seed/nike-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (2, 'uploads/seed/nike-2.jpg', false);
insert into product_image (img_prd_id, img_path, img_is_primary) values (2, 'uploads/seed/nike-3.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (2, 'Tamanho', '42');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (2, 'Marca', 'Nike');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Mesa de jantar em madeira maciça', 'Mesa de jantar em carvalho para 6 pessoas, 180 × 90 cm. Pequenas marcas de uso no tampo. Levantamento em Sintra.', 3, 4, null, 'product', 'good', 80, 'Sintra', 38.8029, -9.3817, 'active', (now() + interval '6 days'), (now() - interval '5 days')); -- prd_id = 3
insert into product_image (img_prd_id, img_path, img_is_primary) values (3, 'uploads/seed/mesa-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (3, 'uploads/seed/mesa-2.jpg', false);
insert into product_image (img_prd_id, img_path, img_is_primary) values (3, 'uploads/seed/mesa-3.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (3, 'Material', 'Carvalho');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (3, 'Lugares', '6');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (3, 'Dimensões', '180 × 90 cm');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Bola de futebol Adidas', 'Bola oficial Adidas, tamanho 5, pouco usada. Ideal para os jogos de futsal do campus.', 4, 8, null, 'product', 'good', 20, 'Almada', 38.6794, -9.1569, 'active', (now() + interval '2 days'), (now() - interval '2 days')); -- prd_id = 4
insert into product_image (img_prd_id, img_path, img_is_primary) values (4, 'uploads/seed/bola-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (4, 'uploads/seed/bola-2.jpg', false);
insert into product_image (img_prd_id, img_path, img_is_primary) values (4, 'uploads/seed/bola-3.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (4, 'Tamanho', '5');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (4, 'Marca', 'Adidas');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Coleção de cartas Pokémon', 'Coleção de 120 cartas Pokémon em capas protetoras, incluindo várias holográficas. Guardadas num álbum.', 5, 3, 7, 'product', 'like new', 120, 'Cascais', 38.697, -9.4215, 'sold', (now() + interval '-1 days'), (now() - interval '8 days')); -- prd_id = 5
insert into product_image (img_prd_id, img_path, img_is_primary) values (5, 'uploads/seed/cartas-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (5, 'uploads/seed/cartas-2.jpg', false);
insert into product_image (img_prd_id, img_path, img_is_primary) values (5, 'uploads/seed/cartas-3.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (5, 'Quantidade', '120 cartas');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (5, 'Estado', 'Em capas protetoras');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('PlayStation 5 Digital Edition', 'PS5 Digital Edition com um comando DualSense. Funciona na perfeição, sem leitor de discos.', 6, 1, null, 'product', 'like new', 350, 'Lisboa', 38.7169, -9.1399, 'active', (now() + interval '4 days'), (now() - interval '3 days')); -- prd_id = 6
insert into product_image (img_prd_id, img_path, img_is_primary) values (6, 'uploads/seed/ps5-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (6, 'uploads/seed/ps5-2.jpg', false);
insert into product_image (img_prd_id, img_path, img_is_primary) values (6, 'uploads/seed/ps5-3.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (6, 'Versão', 'Digital Edition');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (6, 'Armazenamento', '825 GB');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (6, 'Comandos', '1 DualSense');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Peugeot 206 1.4 HDi (2004)', 'Carro económico, ideal para ir para a faculdade. Revisão feita há 3 meses, pneus novos. Inspeção válida até 2027.', 7, 4, null, 'product', 'used', 1200, 'Sintra', 38.8029, -9.3817, 'active', (now() + interval '7 days'), (now() - interval '6 days')); -- prd_id = 7
insert into product_image (img_prd_id, img_path, img_is_primary) values (7, 'uploads/seed/peugeot-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (7, 'uploads/seed/peugeot-2.jpg', false);
insert into product_image (img_prd_id, img_path, img_is_primary) values (7, 'uploads/seed/peugeot-3.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (7, 'Quilómetros', '120 000 km');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (7, 'Combustível', 'Diesel');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (7, 'Ano', '2004');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Harry Potter e a Pedra Filosofal (1.ª edição PT)', 'Primeira edição portuguesa da Editorial Presença, capa mole, bom estado geral.', 8, 9, null, 'product', 'good', 10, 'Lisboa', 38.7169, -9.1399, 'active', (now() + interval '3 days'), (now() - interval '2 days')); -- prd_id = 8
insert into product_image (img_prd_id, img_path, img_is_primary) values (8, 'uploads/seed/livro-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (8, 'uploads/seed/livro-2.jpg', false);
insert into product_image (img_prd_id, img_path, img_is_primary) values (8, 'uploads/seed/livro-3.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (8, 'Editora', 'Editorial Presença');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (8, 'Idioma', 'Português');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Explicações de Cálculo I (4 sessões)', 'Quatro sessões de 1h30 de preparação para o exame de Cálculo I: limites, derivadas, integrais e séries. Inclui fichas de exercícios resolvidas.', 15, 3, null, 'service', null, 40, 'Campus IADE, Lisboa', 38.7071, -9.1525, 'active', (now() + interval '4 days'), (now() - interval '3 days')); -- prd_id = 9
insert into product_image (img_prd_id, img_path, img_is_primary) values (9, 'uploads/seed/calculo-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (9, 'uploads/seed/calculo-2.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (9, 'Duração', '4 × 1h30');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (9, 'Formato', 'Presencial ou online');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Explicações de Programação Java (POO)', 'Apoio em Programação Orientada a Objetos com Java: classes, herança, interfaces, coleções e testes com JUnit. Ajuda nos projetos da cadeira.', 15, 11, null, 'service', null, 50, 'Online', null, null, 'active', (now() + interval '5 days'), (now() - interval '2 days')); -- prd_id = 10
insert into product_image (img_prd_id, img_path, img_is_primary) values (10, 'uploads/seed/java-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (10, 'uploads/seed/java-2.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (10, 'Duração', '3 × 1h');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (10, 'Formato', 'Online');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Revisão de relatório académico (até 30 páginas)', 'Revisão ortográfica e de estrutura de relatórios e trabalhos académicos, com comentários e sugestões. Entrega em 48 horas.', 17, 9, null, 'service', null, 30, 'Online', null, null, 'active', (now() + interval '3 days'), (now() - interval '2 days')); -- prd_id = 11
insert into product_image (img_prd_id, img_path, img_is_primary) values (11, 'uploads/seed/revisao-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (11, 'uploads/seed/revisao-2.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (11, 'Prazo de entrega', '48 horas');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (11, 'Limite', '30 páginas');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Aulas de guitarra para iniciantes (2 aulas)', 'Duas aulas de 1 hora para quem nunca tocou: acordes básicos, ritmo e a primeira música completa. Guitarra disponível se precisares.', 16, 5, null, 'service', null, 25, 'Oeiras', 38.6979, -9.3017, 'active', (now() + interval '6 days'), (now() - interval '4 days')); -- prd_id = 12
insert into product_image (img_prd_id, img_path, img_is_primary) values (12, 'uploads/seed/guitarra-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (12, 'uploads/seed/guitarra-2.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (12, 'Duração', '2 × 1h');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (12, 'Nível', 'Iniciante');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Design de logótipo para projeto ou associação', 'Criação de logótipo com 3 propostas iniciais e 2 rondas de alterações. Entrega em SVG e PNG, com guia de cores.', 18, 10, null, 'service', null, 35, 'Online', null, null, 'active', (now() + interval '5 days'), (now() - interval '3 days')); -- prd_id = 13
insert into product_image (img_prd_id, img_path, img_is_primary) values (13, 'uploads/seed/logo-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (13, 'uploads/seed/logo-2.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (13, 'Propostas', '3');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (13, 'Formatos', 'SVG e PNG');

insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)
values ('Explicações de Sistemas Distribuídos (exame)', 'Preparação para o exame de Sistemas Distribuídos: replicação, consenso (Paxos e Raft), transações distribuídas e tolerância a faltas, com exercícios de exames anteriores.', 15, 2, null, 'service', null, 45, 'Campus IADE, Lisboa', 38.7071, -9.1525, 'active', (now() + interval '2 days'), (now() - interval '2 days')); -- prd_id = 14
insert into product_image (img_prd_id, img_path, img_is_primary) values (14, 'uploads/seed/sd-1.jpg', true);
insert into product_image (img_prd_id, img_path, img_is_primary) values (14, 'uploads/seed/sd-2.jpg', false);
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (14, 'Duração', '3 × 1h30');
insert into product_attribute (atr_prd_id, atr_name, atr_value) values (14, 'Formato', 'Presencial');

insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (5, 7, 131, (now() - interval '11089 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (5, 11, 138, (now() - interval '9649 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (5, 2, 153, (now() - interval '9128 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (5, 11, 167, (now() - interval '8178 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (7, 6, 1273, (now() - interval '7955 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (5, 7, 183, (now() - interval '6711 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (12, 6, 26, (now() - interval '5463 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (12, 9, 29, (now() - interval '4996 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (1, 8, 331, (now() - interval '4905 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (6, 7, 387, (now() - interval '4252 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (6, 10, 416, (now() - interval '4170 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (9, 11, 44, (now() - interval '4121 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (9, 2, 46, (now() - interval '4113 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (6, 2, 460, (now() - interval '4089 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (13, 3, 38, (now() - interval '3900 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (3, 9, 89, (now() - interval '3851 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (2, 7, 63, (now() - interval '3798 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (9, 11, 48, (now() - interval '3592 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (13, 1, 41, (now() - interval '3342 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (7, 8, 1371, (now() - interval '3101 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (6, 11, 480, (now() - interval '3050 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (1, 11, 367, (now() - interval '2927 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (1, 7, 404, (now() - interval '2874 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (10, 9, 52, (now() - interval '2630 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (11, 11, 33, (now() - interval '2613 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (11, 2, 36, (now() - interval '2430 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (10, 7, 57, (now() - interval '2243 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (14, 3, 49, (now() - interval '2175 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (8, 5, 11, (now() - interval '2167 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (2, 10, 67, (now() - interval '2099 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (3, 6, 93, (now() - interval '2068 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (9, 10, 50, (now() - interval '2052 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (8, 10, 12, (now() - interval '1879 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (13, 3, 44, (now() - interval '1767 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (6, 7, 533, (now() - interval '1725 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (4, 6, 21, (now() - interval '1660 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (11, 11, 39, (now() - interval '1628 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (14, 10, 52, (now() - interval '1449 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (4, 2, 22, (now() - interval '1416 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (8, 5, 13, (now() - interval '1412 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (13, 1, 46, (now() - interval '1317 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (1, 8, 434, (now() - interval '1288 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (8, 10, 14, (now() - interval '1236 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (4, 11, 24, (now() - interval '1202 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (4, 2, 26, (now() - interval '1137 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (6, 10, 589, (now() - interval '1084 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (14, 11, 56, (now() - interval '1010 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (14, 3, 61, (now() - interval '992 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (10, 9, 60, (now() - interval '714 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (1, 2, 473, (now() - interval '697 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (3, 5, 99, (now() - interval '658 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (1, 7, 503, (now() - interval '603 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (2, 7, 74, (now() - interval '436 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (4, 10, 28, (now() - interval '346 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (9, 2, 54, (now() - interval '293 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (10, 7, 66, (now() - interval '253 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (14, 11, 64, (now() - interval '92 minutes'));
insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values (2, 9, 81, (now() - interval '69 minutes'));

insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (1, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (4, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (5, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (6, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (8, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (9, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 2000, 'Créditos atribuídos pela faculdade', (now() - interval '43200 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 131, 'Licitação no leilão #5', (now() - interval '11089 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'deposit', 131, 'Reembolso por ter sido coberto no leilão #5', (now() - interval '9649 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 138, 'Licitação no leilão #5', (now() - interval '9649 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 138, 'Reembolso por ter sido coberto no leilão #5', (now() - interval '9128 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'debit', 153, 'Licitação no leilão #5', (now() - interval '9128 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'deposit', 153, 'Reembolso por ter sido coberto no leilão #5', (now() - interval '8178 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 167, 'Licitação no leilão #5', (now() - interval '8178 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (6, 'debit', 1273, 'Licitação no leilão #7', (now() - interval '7955 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 167, 'Reembolso por ter sido coberto no leilão #5', (now() - interval '6711 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 183, 'Licitação no leilão #5', (now() - interval '6711 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (6, 'debit', 26, 'Licitação no leilão #12', (now() - interval '5463 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (6, 'deposit', 26, 'Reembolso por ter sido coberto no leilão #12', (now() - interval '4996 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (9, 'debit', 29, 'Licitação no leilão #12', (now() - interval '4996 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (8, 'debit', 331, 'Licitação no leilão #1', (now() - interval '4905 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 387, 'Licitação no leilão #6', (now() - interval '4252 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'deposit', 387, 'Reembolso por ter sido coberto no leilão #6', (now() - interval '4170 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'debit', 416, 'Licitação no leilão #6', (now() - interval '4170 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 44, 'Licitação no leilão #9', (now() - interval '4121 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 44, 'Reembolso por ter sido coberto no leilão #9', (now() - interval '4113 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'debit', 46, 'Licitação no leilão #9', (now() - interval '4113 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'deposit', 416, 'Reembolso por ter sido coberto no leilão #6', (now() - interval '4089 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'debit', 460, 'Licitação no leilão #6', (now() - interval '4089 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'debit', 38, 'Licitação no leilão #13', (now() - interval '3900 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (9, 'debit', 89, 'Licitação no leilão #3', (now() - interval '3851 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 63, 'Licitação no leilão #2', (now() - interval '3798 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'deposit', 46, 'Reembolso por ter sido coberto no leilão #9', (now() - interval '3592 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 48, 'Licitação no leilão #9', (now() - interval '3592 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'deposit', 38, 'Reembolso por ter sido coberto no leilão #13', (now() - interval '3342 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (1, 'debit', 41, 'Licitação no leilão #13', (now() - interval '3342 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (6, 'deposit', 1273, 'Reembolso por ter sido coberto no leilão #7', (now() - interval '3101 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (8, 'debit', 1371, 'Licitação no leilão #7', (now() - interval '3101 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'deposit', 460, 'Reembolso por ter sido coberto no leilão #6', (now() - interval '3050 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 480, 'Licitação no leilão #6', (now() - interval '3050 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (8, 'deposit', 331, 'Reembolso por ter sido coberto no leilão #1', (now() - interval '2927 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 367, 'Licitação no leilão #1', (now() - interval '2927 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 367, 'Reembolso por ter sido coberto no leilão #1', (now() - interval '2874 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 404, 'Licitação no leilão #1', (now() - interval '2874 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (9, 'debit', 52, 'Licitação no leilão #10', (now() - interval '2630 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 33, 'Licitação no leilão #11', (now() - interval '2613 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 33, 'Reembolso por ter sido coberto no leilão #11', (now() - interval '2430 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'debit', 36, 'Licitação no leilão #11', (now() - interval '2430 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (9, 'deposit', 52, 'Reembolso por ter sido coberto no leilão #10', (now() - interval '2243 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 57, 'Licitação no leilão #10', (now() - interval '2243 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'debit', 49, 'Licitação no leilão #14', (now() - interval '2175 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (5, 'debit', 11, 'Licitação no leilão #8', (now() - interval '2167 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'deposit', 63, 'Reembolso por ter sido coberto no leilão #2', (now() - interval '2099 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'debit', 67, 'Licitação no leilão #2', (now() - interval '2099 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (9, 'deposit', 89, 'Reembolso por ter sido coberto no leilão #3', (now() - interval '2068 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (6, 'debit', 93, 'Licitação no leilão #3', (now() - interval '2068 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 48, 'Reembolso por ter sido coberto no leilão #9', (now() - interval '2052 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'debit', 50, 'Licitação no leilão #9', (now() - interval '2052 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (5, 'deposit', 11, 'Reembolso por ter sido coberto no leilão #8', (now() - interval '1879 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'debit', 12, 'Licitação no leilão #8', (now() - interval '1879 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (1, 'deposit', 41, 'Reembolso por ter sido coberto no leilão #13', (now() - interval '1767 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'debit', 44, 'Licitação no leilão #13', (now() - interval '1767 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 480, 'Reembolso por ter sido coberto no leilão #6', (now() - interval '1725 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 533, 'Licitação no leilão #6', (now() - interval '1725 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (6, 'debit', 21, 'Licitação no leilão #4', (now() - interval '1660 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'deposit', 36, 'Reembolso por ter sido coberto no leilão #11', (now() - interval '1628 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 39, 'Licitação no leilão #11', (now() - interval '1628 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'deposit', 49, 'Reembolso por ter sido coberto no leilão #14', (now() - interval '1449 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'debit', 52, 'Licitação no leilão #14', (now() - interval '1449 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'deposit', 183, 'Venda do leilão #5 - Coleção de cartas Pokémon', (now() - interval '1440 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (6, 'deposit', 21, 'Reembolso por ter sido coberto no leilão #4', (now() - interval '1416 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'debit', 22, 'Licitação no leilão #4', (now() - interval '1416 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'deposit', 12, 'Reembolso por ter sido coberto no leilão #8', (now() - interval '1412 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (5, 'debit', 13, 'Licitação no leilão #8', (now() - interval '1412 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'deposit', 44, 'Reembolso por ter sido coberto no leilão #13', (now() - interval '1317 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (1, 'debit', 46, 'Licitação no leilão #13', (now() - interval '1317 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'deposit', 404, 'Reembolso por ter sido coberto no leilão #1', (now() - interval '1288 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (8, 'debit', 434, 'Licitação no leilão #1', (now() - interval '1288 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (5, 'deposit', 13, 'Reembolso por ter sido coberto no leilão #8', (now() - interval '1236 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'debit', 14, 'Licitação no leilão #8', (now() - interval '1236 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'deposit', 22, 'Reembolso por ter sido coberto no leilão #4', (now() - interval '1202 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 24, 'Licitação no leilão #4', (now() - interval '1202 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 24, 'Reembolso por ter sido coberto no leilão #4', (now() - interval '1137 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'debit', 26, 'Licitação no leilão #4', (now() - interval '1137 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'deposit', 533, 'Reembolso por ter sido coberto no leilão #6', (now() - interval '1084 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'debit', 589, 'Licitação no leilão #6', (now() - interval '1084 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'deposit', 52, 'Reembolso por ter sido coberto no leilão #14', (now() - interval '1010 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 56, 'Licitação no leilão #14', (now() - interval '1010 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'deposit', 56, 'Reembolso por ter sido coberto no leilão #14', (now() - interval '992 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'debit', 61, 'Licitação no leilão #14', (now() - interval '992 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'deposit', 57, 'Reembolso por ter sido coberto no leilão #10', (now() - interval '714 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (9, 'debit', 60, 'Licitação no leilão #10', (now() - interval '714 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (8, 'deposit', 434, 'Reembolso por ter sido coberto no leilão #1', (now() - interval '697 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'debit', 473, 'Licitação no leilão #1', (now() - interval '697 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (6, 'deposit', 93, 'Reembolso por ter sido coberto no leilão #3', (now() - interval '658 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (5, 'debit', 99, 'Licitação no leilão #3', (now() - interval '658 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'deposit', 473, 'Reembolso por ter sido coberto no leilão #1', (now() - interval '603 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 503, 'Licitação no leilão #1', (now() - interval '603 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'deposit', 67, 'Reembolso por ter sido coberto no leilão #2', (now() - interval '436 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 74, 'Licitação no leilão #2', (now() - interval '436 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'deposit', 26, 'Reembolso por ter sido coberto no leilão #4', (now() - interval '346 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'debit', 28, 'Licitação no leilão #4', (now() - interval '346 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (10, 'deposit', 50, 'Reembolso por ter sido coberto no leilão #9', (now() - interval '293 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (2, 'debit', 54, 'Licitação no leilão #9', (now() - interval '293 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (9, 'deposit', 60, 'Reembolso por ter sido coberto no leilão #10', (now() - interval '253 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'debit', 66, 'Licitação no leilão #10', (now() - interval '253 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (3, 'deposit', 61, 'Reembolso por ter sido coberto no leilão #14', (now() - interval '92 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (11, 'debit', 64, 'Licitação no leilão #14', (now() - interval '92 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (7, 'deposit', 74, 'Reembolso por ter sido coberto no leilão #2', (now() - interval '69 minutes'));
insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values (9, 'debit', 81, 'Licitação no leilão #2', (now() - interval '69 minutes'));

insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (7, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Coleção de cartas Pokémon''! Nova licitação de 138 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '9649 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (11, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Coleção de cartas Pokémon''! Nova licitação de 153 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '9128 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (2, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Coleção de cartas Pokémon''! Nova licitação de 167 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '8178 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (11, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Coleção de cartas Pokémon''! Nova licitação de 183 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '6711 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (6, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Aulas de guitarra para iniciantes (2 aulas)''! Nova licitação de 29 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '4996 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (7, 'bid_outbid', 'Alguém cobriu a tua oferta em ''PlayStation 5 Digital Edition''! Nova licitação de 416 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '4170 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (11, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Cálculo I (4 sessões)''! Nova licitação de 46 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '4113 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (10, 'bid_outbid', 'Alguém cobriu a tua oferta em ''PlayStation 5 Digital Edition''! Nova licitação de 460 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '4089 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (2, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Cálculo I (4 sessões)''! Nova licitação de 48 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '3592 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (3, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Design de logótipo para projeto ou associação''! Nova licitação de 41 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '3342 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (6, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Peugeot 206 1.4 HDi (2004)''! Nova licitação de 1371 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '3101 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (2, 'bid_outbid', 'Alguém cobriu a tua oferta em ''PlayStation 5 Digital Edition''! Nova licitação de 480 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '3050 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (8, 'bid_outbid', 'Alguém cobriu a tua oferta em ''iPhone 13 128 GB''! Nova licitação de 367 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '2927 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (11, 'bid_outbid', 'Alguém cobriu a tua oferta em ''iPhone 13 128 GB''! Nova licitação de 404 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '2874 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (11, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Revisão de relatório académico (até 30 páginas)''! Nova licitação de 36 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '2430 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (9, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Programação Java (POO)''! Nova licitação de 57 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '2243 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (7, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Nike Air Max 90 (tamanho 42)''! Nova licitação de 67 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '2099 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (9, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Mesa de jantar em madeira maciça''! Nova licitação de 93 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '2068 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (11, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Cálculo I (4 sessões)''! Nova licitação de 50 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '2052 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (5, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Harry Potter e a Pedra Filosofal (1.ª edição PT)''! Nova licitação de 12 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1879 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (1, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Design de logótipo para projeto ou associação''! Nova licitação de 44 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1767 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (11, 'bid_outbid', 'Alguém cobriu a tua oferta em ''PlayStation 5 Digital Edition''! Nova licitação de 533 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1725 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (2, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Revisão de relatório académico (até 30 páginas)''! Nova licitação de 39 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1628 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (3, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Sistemas Distribuídos (exame)''! Nova licitação de 52 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1449 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (7, 'auction_won', 'Parabéns! Ganhaste o leilão de Coleção de cartas Pokémon por 183 créditos!', true, (now() - interval '1440 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (3, 'auction_sold', 'O teu leilão de Coleção de cartas Pokémon foi vendido por 183 créditos!', true, (now() - interval '1440 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (6, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Bola de futebol Adidas''! Nova licitação de 22 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1416 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (10, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Harry Potter e a Pedra Filosofal (1.ª edição PT)''! Nova licitação de 13 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1412 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (3, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Design de logótipo para projeto ou associação''! Nova licitação de 46 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1317 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (7, 'bid_outbid', 'Alguém cobriu a tua oferta em ''iPhone 13 128 GB''! Nova licitação de 434 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1288 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (5, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Harry Potter e a Pedra Filosofal (1.ª edição PT)''! Nova licitação de 14 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1236 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (2, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Bola de futebol Adidas''! Nova licitação de 24 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1202 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (11, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Bola de futebol Adidas''! Nova licitação de 26 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1137 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (7, 'bid_outbid', 'Alguém cobriu a tua oferta em ''PlayStation 5 Digital Edition''! Nova licitação de 589 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1084 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (10, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Sistemas Distribuídos (exame)''! Nova licitação de 56 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '1010 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (11, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Sistemas Distribuídos (exame)''! Nova licitação de 61 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '992 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (7, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Programação Java (POO)''! Nova licitação de 60 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '714 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (8, 'bid_outbid', 'Alguém cobriu a tua oferta em ''iPhone 13 128 GB''! Nova licitação de 473 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '697 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (6, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Mesa de jantar em madeira maciça''! Nova licitação de 99 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '658 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (2, 'bid_outbid', 'Alguém cobriu a tua oferta em ''iPhone 13 128 GB''! Nova licitação de 503 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '603 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (10, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Nike Air Max 90 (tamanho 42)''! Nova licitação de 74 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '436 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (2, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Bola de futebol Adidas''! Nova licitação de 28 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '346 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (10, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Cálculo I (4 sessões)''! Nova licitação de 54 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '293 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (9, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Programação Java (POO)''! Nova licitação de 66 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '253 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (3, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Explicações de Sistemas Distribuídos (exame)''! Nova licitação de 64 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '92 minutes'));
insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values (7, 'bid_outbid', 'Alguém cobriu a tua oferta em ''Nike Air Max 90 (tamanho 42)''! Nova licitação de 81 créditos. Os teus créditos foram devolvidos.', false, (now() - interval '69 minutes'));

insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (5, 3, '🎬 O leilão começou! Preço inicial: 120 créditos', true, (now() - interval '11520 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (5, 3, '💰 Jocy Grangeiro licitou 131 créditos', true, (now() - interval '11089 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (5, 3, '💰 Tomas Lebre licitou 138 créditos', true, (now() - interval '9649 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (5, 3, '💰 Rodrigo Daibert licitou 153 créditos', true, (now() - interval '9128 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (7, 4, '🎬 O leilão começou! Preço inicial: 1200 créditos', true, (now() - interval '8640 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (5, 3, '💰 Tomas Lebre licitou 167 créditos', true, (now() - interval '8178 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (7, 4, '💰 Daniel Paulo licitou 1273 créditos', true, (now() - interval '7955 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (3, 4, '🎬 O leilão começou! Preço inicial: 80 créditos', true, (now() - interval '7200 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (5, 3, '💰 Jocy Grangeiro licitou 183 créditos', true, (now() - interval '6711 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (1, 1, '🎬 O leilão começou! Preço inicial: 300 créditos', true, (now() - interval '5760 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (12, 5, '🎬 O leilão começou! Preço inicial: 25 créditos', true, (now() - interval '5760 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (12, 5, '💰 Daniel Paulo licitou 26 créditos', true, (now() - interval '5463 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (12, 5, '💰 Patricia Daibert licitou 29 créditos', true, (now() - interval '4996 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (1, 1, '💰 Paulo Alberto licitou 331 créditos', true, (now() - interval '4905 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (2, 5, '🎬 O leilão começou! Preço inicial: 60 créditos', true, (now() - interval '4320 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (6, 1, '🎬 O leilão começou! Preço inicial: 350 créditos', true, (now() - interval '4320 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (9, 3, '🎬 O leilão começou! Preço inicial: 40 créditos', true, (now() - interval '4320 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (13, 10, '🎬 O leilão começou! Preço inicial: 35 créditos', true, (now() - interval '4320 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (6, 1, '💰 Jocy Grangeiro licitou 387 créditos', true, (now() - interval '4252 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (6, 1, '💰 Martim Fonseca licitou 416 créditos', true, (now() - interval '4170 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (9, 10, 'As sessões podem ser à noite?', false, (now() - interval '4140 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (6, 2, 'Tem garantia?', false, (now() - interval '4140 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (9, 3, '💰 Tomas Lebre licitou 44 créditos', true, (now() - interval '4121 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (9, 3, 'Sim, a partir das 19h dá-me jeito.', false, (now() - interval '4115 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (6, 1, 'Ainda tem 6 meses de garantia da loja.', false, (now() - interval '4115 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (9, 3, '💰 Rodrigo Daibert licitou 46 créditos', true, (now() - interval '4113 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (6, 1, '💰 Rodrigo Daibert licitou 460 créditos', true, (now() - interval '4089 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (13, 10, '💰 Marco Fonseca licitou 38 créditos', true, (now() - interval '3900 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (3, 4, '💰 Patricia Daibert licitou 89 créditos', true, (now() - interval '3851 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (2, 5, '💰 Jocy Grangeiro licitou 63 créditos', true, (now() - interval '3798 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (9, 3, '💰 Tomas Lebre licitou 48 créditos', true, (now() - interval '3592 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (13, 10, '💰 Rodrigo Canto licitou 41 créditos', true, (now() - interval '3342 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (7, 4, '💰 Paulo Alberto licitou 1371 créditos', true, (now() - interval '3101 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (6, 1, '💰 Tomas Lebre licitou 480 créditos', true, (now() - interval '3050 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (1, 1, '💰 Tomas Lebre licitou 367 créditos', true, (now() - interval '2927 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (4, 8, '🎬 O leilão começou! Preço inicial: 20 créditos', true, (now() - interval '2880 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (8, 9, '🎬 O leilão começou! Preço inicial: 10 créditos', true, (now() - interval '2880 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (10, 11, '🎬 O leilão começou! Preço inicial: 50 créditos', true, (now() - interval '2880 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (11, 9, '🎬 O leilão começou! Preço inicial: 30 créditos', true, (now() - interval '2880 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (14, 2, '🎬 O leilão começou! Preço inicial: 45 créditos', true, (now() - interval '2880 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (1, 1, '💰 Jocy Grangeiro licitou 404 créditos', true, (now() - interval '2874 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (10, 7, 'Também ajudas com Spring?', false, (now() - interval '2700 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (14, 11, 'Dá para focar em Raft?', false, (now() - interval '2700 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (10, 11, 'Posso ajudar com o básico, sim.', false, (now() - interval '2675 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (14, 2, 'Claro, uma das sessões é só sobre consenso.', false, (now() - interval '2675 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (10, 11, '💰 Patricia Daibert licitou 52 créditos', true, (now() - interval '2630 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (11, 9, '💰 Tomas Lebre licitou 33 créditos', true, (now() - interval '2613 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (11, 9, '💰 Rodrigo Daibert licitou 36 créditos', true, (now() - interval '2430 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (10, 11, '💰 Jocy Grangeiro licitou 57 créditos', true, (now() - interval '2243 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (14, 2, '💰 Marco Fonseca licitou 49 créditos', true, (now() - interval '2175 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (8, 9, '💰 Sandra Estrela licitou 11 créditos', true, (now() - interval '2167 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (2, 5, '💰 Martim Fonseca licitou 67 créditos', true, (now() - interval '2099 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (3, 4, '💰 Daniel Paulo licitou 93 créditos', true, (now() - interval '2068 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (9, 3, '💰 Martim Fonseca licitou 50 créditos', true, (now() - interval '2052 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (8, 9, '💰 Martim Fonseca licitou 12 créditos', true, (now() - interval '1879 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (13, 10, '💰 Marco Fonseca licitou 44 créditos', true, (now() - interval '1767 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (6, 1, '💰 Jocy Grangeiro licitou 533 créditos', true, (now() - interval '1725 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (4, 8, '💰 Daniel Paulo licitou 21 créditos', true, (now() - interval '1660 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (11, 9, '💰 Tomas Lebre licitou 39 créditos', true, (now() - interval '1628 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (14, 2, '💰 Martim Fonseca licitou 52 créditos', true, (now() - interval '1449 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (5, 3, '🏁 Leilão terminado! Vencedor: Jocy Grangeiro por 183 créditos', true, (now() - interval '1440 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (4, 8, '💰 Rodrigo Daibert licitou 22 créditos', true, (now() - interval '1416 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (8, 9, '💰 Sandra Estrela licitou 13 créditos', true, (now() - interval '1412 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (13, 10, '💰 Rodrigo Canto licitou 46 créditos', true, (now() - interval '1317 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (1, 1, '💰 Paulo Alberto licitou 434 créditos', true, (now() - interval '1288 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (8, 9, '💰 Martim Fonseca licitou 14 créditos', true, (now() - interval '1236 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (4, 8, '💰 Tomas Lebre licitou 24 créditos', true, (now() - interval '1202 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (4, 8, '💰 Rodrigo Daibert licitou 26 créditos', true, (now() - interval '1137 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (6, 1, '💰 Martim Fonseca licitou 589 créditos', true, (now() - interval '1084 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (14, 2, '💰 Tomas Lebre licitou 56 créditos', true, (now() - interval '1010 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (14, 2, '💰 Marco Fonseca licitou 61 créditos', true, (now() - interval '992 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (10, 11, '💰 Patricia Daibert licitou 60 créditos', true, (now() - interval '714 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (1, 1, '💰 Rodrigo Daibert licitou 473 créditos', true, (now() - interval '697 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (3, 4, '💰 Sandra Estrela licitou 99 créditos', true, (now() - interval '658 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (1, 1, '💰 Jocy Grangeiro licitou 503 créditos', true, (now() - interval '603 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (2, 5, '💰 Jocy Grangeiro licitou 74 créditos', true, (now() - interval '436 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (4, 8, '💰 Martim Fonseca licitou 28 créditos', true, (now() - interval '346 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (9, 3, '💰 Rodrigo Daibert licitou 54 créditos', true, (now() - interval '293 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (10, 11, '💰 Jocy Grangeiro licitou 66 créditos', true, (now() - interval '253 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (14, 2, '💰 Tomas Lebre licitou 64 créditos', true, (now() - interval '92 minutes'));
insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values (2, 5, '💰 Patricia Daibert licitou 81 créditos', true, (now() - interval '69 minutes'));

insert into product_favorite (fav_usr_id, fav_prd_id) values (2, 6);
insert into product_favorite (fav_usr_id, fav_prd_id) values (7, 1);
insert into product_favorite (fav_usr_id, fav_prd_id) values (10, 9);
insert into product_favorite (fav_usr_id, fav_prd_id) values (9, 3);
insert into product_favorite (fav_usr_id, fav_prd_id) values (11, 14);
insert into product_favorite (fav_usr_id, fav_prd_id) values (5, 8);
insert into product_favorite (fav_usr_id, fav_prd_id) values (3, 13);

insert into review (rev_usr_id, rev_reviewed_usr_id, rev_prd_id, rev_rating, rev_comment, rev_created_at) values (7, 3, 5, 5, 'Cartas exatamente como descritas e bem embaladas. Recomendo!', (now() - interval '12 hours'));

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

commit;
