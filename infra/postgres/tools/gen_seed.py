#!/usr/bin/env python3
"""Gera infra/postgres/init/02_seed.sql: dados de demonstração do NextBid.

  * moeda: créditos da faculdade (cada conta começa com 2000 créditos)
  * 8 produtos + 6 serviços, com descrição, atributos e imagens (infra/seed-uploads/)
  * lances de várias contas, com o escrow coerente: o lance mais alto de cada leilão está
    retido no saldo de quem o fez, e os licitadores cobertos foram reembolsados
  * 1 leilão já vendido (cartas), com pagamento ao vendedor e avaliação

Uso, na raiz do repositório:
    python infra/postgres/tools/gen_seed.py > infra/postgres/init/02_seed.sql

Password de todas as contas: nextbid123
"""
import random

random.seed(2026)

PASSWORD_HASH = "$2a$10$Br9bDCKxh9JoSYY2GV7XJeVWaVlLQxIzvkdlMiUaQ4l956KSbfcay"
INITIAL_CREDITS = 2000

USERS = [  # nome, email, género, nascimento, bio, local, xp, papel
    ("Rodrigo Canto", "rodrigocanto@hotmail.com", "M", "2005-10-20", "Estudante de Engenharia Informática e fã de tecnologia.", "Lisboa", 120, "admin"),
    ("Rodrigo Daibert", "rodrigodaibert@hotmail.com", "M", "2005-10-22", "Gosto de leilões, gaming e sistemas distribuídos.", "Amadora", 95, "admin"),
    ("Marco Fonseca", "mf2006@gmail.com", "M", "2006-10-24", "Colecionador e explicador de Matemática.", "Cascais", 180, "admin"),
    ("Luis Quirim", "luisquirim@gmail.com", "M", "2004-10-28", "Interesso-me por artigos para casa e carros.", "Sintra", 60, "normaluser"),
    ("Sandra Estrela", "sandra@hotmail.com", "F", "2003-10-30", "Adoro moda, decoração e música.", "Oeiras", 140, "normaluser"),
    ("Daniel Paulo", "dexpaulo@hotmail.com", "M", "2005-11-01", "Utilizador ativo na plataforma.", "Loures", 75, "admin"),
    ("Jocy Grangeiro", "jocy12@gmail.com", "F", "2004-11-04", "Gosto de oportunidades e prémios.", "Setúbal", 110, "normaluser"),
    ("Paulo Alberto", "pauloencomendas@gmail.com", "M", "2001-11-09", "Interessa-me eletrónica e desporto.", "Almada", 90, "normaluser"),
    ("Patricia Daibert", "patriciadaibert@hotmail.com", "F", "2002-11-13", "Revejo relatórios e procuro artigos para casa.", "Lisboa", 130, "normaluser"),
    ("Martim Fonseca", "mrmartim@hotmail.com", "M", "2006-12-01", "Designer nas horas vagas, curioso por videojogos.", "Braga", 55, "normaluser"),
    ("Tomas Lebre", "tomaslebre@gmail.com", "M", "2005-12-02", "Programador Java e participante frequente em leilões.", "Coimbra", 70, "normaluser"),
]

CATEGORIES = [  # nome, tipo
    ("Eletrónica", "product"), ("Moda", "product"), ("Casa", "product"), ("Desporto", "product"),
    ("Colecionáveis", "product"), ("Videojogos", "product"), ("Automóveis", "product"), ("Livros", "product"),
    ("Arte", "product"), ("Música", "product"), ("Antiguidades", "product"), ("Brinquedos", "product"),
    ("Relógios & Joias", "product"), ("Outros", "product"),
    ("Explicações", "service"), ("Aulas e workshops", "service"), ("Apoio académico", "service"),
    ("Design e multimédia", "service"), ("Informática", "service"),
]
CAT = {name: i + 1 for i, (name, _) in enumerate(CATEGORIES)}

# slug, nome, descrição, categoria, vendedor, tipo, condição, preço inicial, local, lat, lng,
# dias desde a criação, dias até ao fim (negativo = já terminou), nº de imagens, atributos, licitadores
ITEMS = [
    ("iphone13", "iPhone 13 128 GB", "iPhone 13 em excelente estado, sempre com capa e película. Bateria a 89 %. Inclui caixa original e cabo USB-C para Lightning.",
     "Eletrónica", 1, "product", "like new", 300, "Lisboa", 38.7169, -9.1399, 4, 3, 3,
     [("Armazenamento", "128 GB"), ("Cor", "Meia-noite"), ("Bateria", "89 %")], [2, 7, 11, 8], 6),
    ("nike", "Nike Air Max 90 (tamanho 42)", "Ténis Nike Air Max 90 usados duas vezes, sem marcas de uso. Vendo porque o tamanho não me serve.",
     "Moda", 5, "product", "like new", 60, "Oeiras", 38.6979, -9.3017, 3, 5, 3,
     [("Tamanho", "42"), ("Marca", "Nike")], [9, 7, 10], 4),
    ("mesa", "Mesa de jantar em madeira maciça", "Mesa de jantar em carvalho para 6 pessoas, 180 × 90 cm. Pequenas marcas de uso no tampo. Levantamento em Sintra.",
     "Casa", 4, "product", "good", 80, "Sintra", 38.8029, -9.3817, 5, 6, 3,
     [("Material", "Carvalho"), ("Lugares", "6"), ("Dimensões", "180 × 90 cm")], [9, 5, 6], 3),
    ("bola", "Bola de futebol Adidas", "Bola oficial Adidas, tamanho 5, pouco usada. Ideal para os jogos de futsal do campus.",
     "Desporto", 8, "product", "good", 20, "Almada", 38.6794, -9.1569, 2, 2, 3,
     [("Tamanho", "5"), ("Marca", "Adidas")], [10, 11, 2, 6], 5),
    ("cartas", "Coleção de cartas Pokémon", "Coleção de 120 cartas Pokémon em capas protetoras, incluindo várias holográficas. Guardadas num álbum.",
     "Colecionáveis", 3, "product", "like new", 120, "Cascais", 38.6970, -9.4215, 8, -1, 3,
     [("Quantidade", "120 cartas"), ("Estado", "Em capas protetoras")], [2, 11, 7], 5),
    ("ps5", "PlayStation 5 Digital Edition", "PS5 Digital Edition com um comando DualSense. Funciona na perfeição, sem leitor de discos.",
     "Videojogos", 1, "product", "like new", 350, "Lisboa", 38.7169, -9.1399, 3, 4, 3,
     [("Versão", "Digital Edition"), ("Armazenamento", "825 GB"), ("Comandos", "1 DualSense")], [11, 10, 2, 7], 6),
    ("peugeot", "Peugeot 206 1.4 HDi (2004)", "Carro económico, ideal para ir para a faculdade. Revisão feita há 3 meses, pneus novos. Inspeção válida até 2027.",
     "Automóveis", 4, "product", "used", 1200, "Sintra", 38.8029, -9.3817, 6, 7, 3,
     [("Quilómetros", "120 000 km"), ("Combustível", "Diesel"), ("Ano", "2004")], [6, 8], 2),
    ("livro", "Harry Potter e a Pedra Filosofal (1.ª edição PT)", "Primeira edição portuguesa da Editorial Presença, capa mole, bom estado geral.",
     "Livros", 9, "product", "good", 10, "Lisboa", 38.7169, -9.1399, 2, 3, 3,
     [("Editora", "Editorial Presença"), ("Idioma", "Português")], [5, 7, 10], 4),
    # serviços
    ("calculo", "Explicações de Cálculo I (4 sessões)", "Quatro sessões de 1h30 de preparação para o exame de Cálculo I: limites, derivadas, integrais e séries. Inclui fichas de exercícios resolvidas.",
     "Explicações", 3, "service", None, 40, "Campus IADE, Lisboa", 38.7071, -9.1525, 3, 4, 2,
     [("Duração", "4 × 1h30"), ("Formato", "Presencial ou online")], [10, 11, 2], 5),
    ("java", "Explicações de Programação Java (POO)", "Apoio em Programação Orientada a Objetos com Java: classes, herança, interfaces, coleções e testes com JUnit. Ajuda nos projetos da cadeira.",
     "Explicações", 11, "service", None, 50, "Online", None, None, 2, 5, 2,
     [("Duração", "3 × 1h"), ("Formato", "Online")], [10, 7, 9], 4),
    ("revisao", "Revisão de relatório académico (até 30 páginas)", "Revisão ortográfica e de estrutura de relatórios e trabalhos académicos, com comentários e sugestões. Entrega em 48 horas.",
     "Apoio académico", 9, "service", None, 30, "Online", None, None, 2, 3, 2,
     [("Prazo de entrega", "48 horas"), ("Limite", "30 páginas")], [2, 3, 11], 3),
    ("guitarra", "Aulas de guitarra para iniciantes (2 aulas)", "Duas aulas de 1 hora para quem nunca tocou: acordes básicos, ritmo e a primeira música completa. Guitarra disponível se precisares.",
     "Aulas e workshops", 5, "service", None, 25, "Oeiras", 38.6979, -9.3017, 4, 6, 2,
     [("Duração", "2 × 1h"), ("Nível", "Iniciante")], [9, 6], 2),
    ("logo", "Design de logótipo para projeto ou associação", "Criação de logótipo com 3 propostas iniciais e 2 rondas de alterações. Entrega em SVG e PNG, com guia de cores.",
     "Design e multimédia", 10, "service", None, 35, "Online", None, None, 3, 5, 2,
     [("Propostas", "3"), ("Formatos", "SVG e PNG")], [3, 1, 5], 4),
    ("sd", "Explicações de Sistemas Distribuídos (exame)", "Preparação para o exame de Sistemas Distribuídos: replicação, consenso (Paxos e Raft), transações distribuídas e tolerância a faltas, com exercícios de exames anteriores.",
     "Explicações", 2, "service", None, 45, "Campus IADE, Lisboa", 38.7071, -9.1525, 2, 2, 2,
     [("Duração", "3 × 1h30"), ("Formato", "Presencial")], [11, 10, 3, 9], 5),
]

CHAT_EXTRA = {
    "calculo": [(10, "As sessões podem ser à noite?"), (3, "Sim, a partir das 19h dá-me jeito.")],
    "java": [(7, "Também ajudas com Spring?"), (11, "Posso ajudar com o básico, sim.")],
    "ps5": [(2, "Tem garantia?"), (1, "Ainda tem 6 meses de garantia da loja.")],
    "sd": [(11, "Dá para focar em Raft?"), (2, "Claro, uma das sessões é só sobre consenso.")],
}
FAVORITES = [(2, "ps5"), (7, "iphone13"), (10, "calculo"), (9, "mesa"), (11, "sd"), (5, "livro"), (3, "logo")]


def q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"


def ago(minutes):
    minutes = int(round(minutes))
    if minutes >= 0:
        return f"(now() - interval '{minutes} minutes')"
    return f"(now() + interval '{-minutes} minutes')"


def credits(n):
    return f"{n} créditos"


out = []
w = out.append
w("-- Gerado por infra/postgres/tools/gen_seed.py. Não editar à mão: alterar o gerador e voltar a correr.")
w("-- Password de todas as contas de teste: nextbid123. Moeda: créditos da faculdade.")
w("")
w("begin;")
w("")
for name, ctype in CATEGORIES:
    w(f"insert into category (cat_name, cat_type) values ({q(name)}, {q(ctype)});")
w("")

balance = {i + 1: INITIAL_CREDITS for i in range(len(USERS))}
tx = []        # (usr, tipo, valor, descrição, minutos atrás)
notifs = []    # (usr, tipo, mensagem, minutos atrás, lida)
chats = []     # (item, usr, conteúdo, sistema, minutos atrás)
bids = []      # (item, usr, valor, minutos atrás)
winners = {}

for uid in balance:
    tx.append((uid, "deposit", INITIAL_CREDITS, "Créditos atribuídos pela faculdade", 60 * 24 * 30))

events = []  # (minutos atrás, item, bidder, amount) - ordenado depois por tempo
for idx, it in enumerate(ITEMS, start=1):
    slug, name, _, _, seller, _, _, start, *_rest = it
    created_d, ends_d = it[11], it[12]
    bidders, nbids = it[15], it[16]
    created_min = created_d * 24 * 60
    end_min = -ends_d * 24 * 60            # minutos atrás do fim (negativo se no futuro)
    last_min = max(end_min + 60, 20)        # último lance pelo menos 20 min antes de agora / 1 h antes do fim
    chats.append((idx, seller, f"🎬 O leilão começou! Preço inicial: {credits(start)}", True, created_min))
    amount = start
    times = sorted((random.uniform(last_min, created_min - 60) for _ in range(nbids)), reverse=True)
    prev_bidder = None
    for t in times:
        choices = [b for b in bidders if b != prev_bidder]
        bidder = random.choice(choices)
        step = max(1, round(amount * random.uniform(0.04, 0.12)))
        amount += step
        events.append((t, idx, bidder, amount))
        prev_bidder = bidder

events.sort(key=lambda e: -e[0])
leader = {}
for t, idx, bidder, amount in events:
    name = ITEMS[idx - 1][1]
    seller = ITEMS[idx - 1][4]
    prev = leader.get(idx)
    if prev:
        p_user, p_amount = prev
        balance[p_user] += p_amount
        tx.append((p_user, "deposit", p_amount,
                   f"Reembolso da licitação anterior no leilão #{idx}" if p_user == bidder
                   else f"Reembolso por ter sido coberto no leilão #{idx}", t))
        if p_user != bidder:
            notifs.append((p_user, "bid_outbid",
                           f"Alguém cobriu a tua oferta em '{name}'! Nova licitação de {credits(amount)}. Os teus créditos foram devolvidos.", t, False))
    balance[bidder] -= amount
    assert balance[bidder] >= 0, (bidder, balance[bidder])
    tx.append((bidder, "debit", amount, f"Licitação no leilão #{idx}", t))
    bids.append((idx, bidder, amount, t))
    chats.append((idx, seller, f"💰 {USERS[bidder - 1][0]} licitou {credits(amount)}", True, t))
    leader[idx] = (bidder, amount)

# Leilões que já terminaram: vendidos ao lance mais alto
for idx, it in enumerate(ITEMS, start=1):
    if it[12] < 0 and idx in leader:
        w_user, w_amount = leader[idx]
        seller = it[4]
        end_min = -it[12] * 24 * 60
        winners[idx] = w_user
        balance[seller] += w_amount
        tx.append((seller, "deposit", w_amount, f"Venda do leilão #{idx} - {it[1]}", end_min))
        notifs.append((w_user, "auction_won", f"Parabéns! Ganhaste o leilão de {it[1]} por {credits(w_amount)}!", end_min, True))
        notifs.append((seller, "auction_sold", f"O teu leilão de {it[1]} foi vendido por {credits(w_amount)}!", end_min, True))
        chats.append((idx, seller, f"🏁 Leilão terminado! Vencedor: {USERS[w_user - 1][0]} por {credits(w_amount)}", True, end_min))

for slug, msgs in CHAT_EXTRA.items():
    idx = next(i for i, it in enumerate(ITEMS, start=1) if it[0] == slug)
    base = ITEMS[idx - 1][11] * 24 * 60 - 180
    for n, (uid, text) in enumerate(msgs):
        chats.append((idx, uid, text, False, base - n * 25))

# Utilizadores
for i, (name, email, g, birth, bio, loc, xp, role) in enumerate(USERS, start=1):
    w("insert into users (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_balance, usr_location, usr_xp, usr_role, usr_created_at)")
    w(f"values ({q(name)}, {q(email)}, {q(PASSWORD_HASH)}, {q(g)}, {q(birth)}, {q(bio)}, {balance[i]}, {q(loc)}, {xp}, {q(role)}, (now() - interval '{60 - i} days')); -- usr_id = {i}")
w("")

# Produtos e serviços
for idx, it in enumerate(ITEMS, start=1):
    slug, name, desc, cat, seller, ptype, cond, start, loc, lat, lng, created_d, ends_d, nimg, attrs, _, _ = it
    status = "sold" if idx in winners else ("expired" if ends_d < 0 else "active")
    winner = winners.get(idx)
    w("insert into product (prd_name, prd_description, prd_cat_id, prd_usr_id, prd_winner_usr_id, prd_type, prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude, prd_status, prd_ends_at, prd_created_at)")
    w(f"values ({q(name)}, {q(desc)}, {CAT[cat]}, {seller}, {winner if winner else 'null'}, {q(ptype)}, {q(cond)}, {start}, {q(loc)}, "
      f"{lat if lat is not None else 'null'}, {lng if lng is not None else 'null'}, {q(status)}, "
      f"(now() + interval '{ends_d} days'), (now() - interval '{created_d} days')); -- prd_id = {idx}")
    for n in range(1, nimg + 1):
        w(f"insert into product_image (img_prd_id, img_path, img_is_primary) values ({idx}, 'uploads/seed/{slug}-{n}.jpg', {'true' if n == 1 else 'false'});")
    for a, v in attrs:
        w(f"insert into product_attribute (atr_prd_id, atr_name, atr_value) values ({idx}, {q(a)}, {q(v)});")
    w("")

for idx, uid, amount, t in bids:
    w(f"insert into bid (bid_prd_id, bid_usr_id, bid_amount, bid_created_at) values ({idx}, {uid}, {amount}, {ago(t)});")
w("")
for uid, typ, amount, desc, t in sorted(tx, key=lambda r: -r[4]):
    w(f"insert into transactions (tra_usr_id, tra_type, tra_amount, tra_description, tra_created_at) values ({uid}, {q(typ)}, {amount}, {q(desc)}, {ago(t)});")
w("")
for uid, typ, msg, t, read in sorted(notifs, key=lambda r: -r[3]):
    w(f"insert into notifications (not_usr_id, not_type, not_message, not_read, not_created_at) values ({uid}, {q(typ)}, {q(msg)}, {'true' if read else 'false'}, {ago(t)});")
w("")
for idx, uid, text, system, t in sorted(chats, key=lambda r: -r[4]):
    w(f"insert into chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system, cht_created_at) values ({idx}, {uid}, {q(text)}, {'true' if system else 'false'}, {ago(t)});")
w("")
for uid, slug in FAVORITES:
    idx = next(i for i, it in enumerate(ITEMS, start=1) if it[0] == slug)
    w(f"insert into product_favorite (fav_usr_id, fav_prd_id) values ({uid}, {idx});")
w("")
for idx, w_user in winners.items():
    seller = ITEMS[idx - 1][4]
    w(f"insert into review (rev_usr_id, rev_reviewed_usr_id, rev_prd_id, rev_rating, rev_comment, rev_created_at) values "
      f"({w_user}, {seller}, {idx}, 5, 'Cartas exatamente como descritas e bem embaladas. Recomendo!', (now() - interval '12 hours'));")
w("")
for n, xp in enumerate([0, 50, 100, 150, 200, 250, 300, 350, 400, 450], start=1):
    w(f"insert into xp_level (lvl_number, lvl_xp_required) values ({n}, {xp});")
w("")
w("commit;")

# verificação: dinheiro conservado
held = sum(a for i, (u, a) in leader.items() if i not in winners)
assert sum(balance.values()) + held == INITIAL_CREDITS * len(USERS)

print("\n".join(out))
