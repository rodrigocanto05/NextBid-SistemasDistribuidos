-- selecionar utilizadores do género masculino com email hotmail, mostrando também saldo e xp
select usr_name, usr_email, usr_gender, usr_balance, usr_xp
from userss
where usr_gender = 'M'
and usr_email like '%hotmail%';

-- selecionar todos os produtos com o nome da categoria, do vendedor e do vencedor, ordenados dos mais recentes para os mais antigos
select p.prd_name, c.cat_name, u.usr_name as seller_name, w.usr_name as winner_name, p.prd_created_at
from product p
join category c on p.prd_cat_id = c.cat_id
join userss u on p.prd_usr_id = u.usr_id
left join userss w on p.prd_winner_usr_id = w.usr_id
order by p.prd_created_at desc;

-- selecionar todos os produtos ativos, ordenados pelo fim do leilão
select prd_name, prd_start_price, prd_location, prd_ends_at
from product
where prd_status = 'active'
order by prd_ends_at asc;

-- selecionar os produtos com a respetiva imagem principal
select p.prd_name, pi.img_path
from product p
join product_image pi on p.prd_id = pi.img_prd_id
where pi.img_is_primary = true
order by p.prd_name asc;

-- selecionar os produtos que ainda não têm licitações
select p.prd_name, p.prd_start_price, p.prd_status
from product p
where p.prd_id not in (select b.bid_prd_id from bid b)
order by p.prd_name asc;

-- selecionar o número total de licitações por produto, ordenado do maior para o menor
select p.prd_name, count(b.bid_id) as total_licitacoes
from product p
left join bid b on p.prd_id = b.bid_prd_id
group by p.prd_id, p.prd_name
order by total_licitacoes desc, p.prd_name asc;

-- selecionar o lance mais alto de cada produto, ordenado do maior para o menor
select p.prd_name, max(b.bid_amount) as maior_lance
from product p
join bid b on p.prd_id = b.bid_prd_id
group by p.prd_id, p.prd_name
order by maior_lance desc;

-- selecionar os utilizadores que mais licitaram, ordenados do que fez mais lances para o que fez menos
select u.usr_name, count(b.bid_id) as total_lances
from userss u
join bid b on u.usr_id = b.bid_usr_id
group by u.usr_id, u.usr_name
order by total_lances desc, u.usr_name asc;

-- selecionar os utilizadores que criaram mais produtos, ordenados do que criou mais para o que criou menos
select u.usr_name, count(p.prd_id) as total_produtos
from userss u
join product p on u.usr_id = p.prd_usr_id
group by u.usr_id, u.usr_name
order by total_produtos desc, u.usr_name asc;

-- selecionar os utilizadores ordenados por xp, do maior para o menor, mostrando também o saldo
select usr_name, usr_email, usr_xp, usr_balance
from userss
order by usr_xp desc, usr_name asc;

-- selecionar as notificações não lidas de um utilizador, ordenadas da mais recente para a mais antiga
select not_type, not_message, not_created_at
from notifications
where not_usr_id = 8
and not_read = false
order by not_created_at desc;

-- selecionar categorias com mais produtos, ordenadas da que tem mais para a que tem menos
select c.cat_name, count(p.prd_id) as total_produtos
from category c
left join product p on c.cat_id = p.prd_cat_id
group by c.cat_id, c.cat_name
order by total_produtos desc, c.cat_name asc;

-- selecionar os produtos que terminam primeiro, ordenados da data mais próxima para a mais distante, mostrando também o vendedor
select p.prd_name, u.usr_name as seller_name, p.prd_ends_at, p.prd_status
from product p
join userss u on p.prd_usr_id = u.usr_id
where p.prd_status = 'active'
order by p.prd_ends_at asc;
