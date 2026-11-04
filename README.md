# NextBid — Plataforma Distribuída de Leilões On-line

Projeto multidisciplinar do 5.º semestre da Licenciatura em Engenharia Informática (2026-2027).
O NextBid é uma plataforma de leilões em tempo real que, nesta fase, passou de uma arquitetura
centralizada para um **sistema distribuído e tolerante a faltas**.

**Equipa:** Rodrigo Canto, Marco Fonseca, Martim Fonseca e Rodrigo Daibert.

A documentação do projeto (memória descritiva, imagens, documentação técnica) está em
[`Projeto_NextBid/`](Projeto_NextBid/).

---

## Arquitetura

Todos os componentes correm em contentores Docker, com redundância em cada camada:

| Camada | Componente | Instâncias | Função |
|---|---|---|---|
| Entrada / cliente | Nginx | 2 (portas 8080 e 8081) | Servem o frontend e repartem os pedidos pelas APIs. Se um cair, o site continua no outro. |
| Frontend | HTML, CSS e JavaScript | servido pelos 2 Nginx | Site de leilões, com lances e chat em tempo real (WebSocket / Socket.IO). |
| Serviços | API Node.js (Express) | 2 (`api1`, `api2`) | Sem estado (login com JWT): qualquer instância atende qualquer pedido. Cada browser fica no mesmo servidor enquanto ele estiver vivo. |
| Processamento assíncrono | Workers Node.js | 2 | Consomem os eventos dos lances (avisos, XP, mensagens no chat). |
| Mensagens | RabbitMQ | 1 | Fila `notifications` (quorum queue) com fila de mensagens falhadas (DLQ). |
| Tempo real | Redis | 1 | Leva os eventos de tempo real de uma API para a outra. |
| Dados | PostgreSQL 17 | 3 (1 principal + 2 réplicas) | Replicação síncrona (`ANY 1`) e **failover automático**. |

Mecanismos principais:

- **Balanceamento com afinidade:** o Nginx escolhe o servidor a partir de um cookie do browser
  (hash consistente). Se o servidor cair, o browser passa para o outro e regressa quando ele volta.
- **Replicação síncrona:** um lance só é confirmado depois de pelo menos uma réplica o ter guardado,
  por isso a falha do principal não perde lances aceites.
- **Failover automático da base de dados:** cada nó PostgreSQL tem um vigia
  ([`infra/postgres/watchdog.sh`](infra/postgres/watchdog.sh)). Se o principal não responder
  durante ~10 s, a réplica mais adiantada é promovida; o principal antigo, quando volta, é
  clonado de novo como réplica (sem dois principais ao mesmo tempo).
- **Transactional outbox:** o evento de cada lance é gravado na mesma transação do lance e
  publicado depois no RabbitMQ; com o RabbitMQ em baixo os lances continuam.
- **Líder único:** só uma API fecha leilões e publica o outbox (lock na base de dados); se ela
  cair, outra assume.

---

## Como pôr a correr

Requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS, Windows ou Linux).

```bash
git clone https://github.com/rodrigocanto05/NextBid-SistemasDistribuidos.git
cd NextBid-SistemasDistribuidos
cp .env.example .env          # passwords de exemplo: servem para testar localmente
docker compose up -d --build  # a primeira vez demora alguns minutos
docker compose ps             # esperar ~1 min: tudo "Up" / "healthy"
```

| Endereço | O quê |
|---|---|
| http://localhost:8080 | Site (Nginx 1) |
| http://localhost:8081 | Site (Nginx 2) |
| http://localhost:8080/estado | Página **Estado da arquitetura**: estado de cada componente em tempo real |
| http://localhost:15672 | Consola do RabbitMQ (utilizador `nextbid`, password do `.env`) |

Contas de teste (todas com a password **`nextbid123`**): `rodrigocanto@hotmail.com`,
`rodrigodaibert@hotmail.com`, `mf2006@gmail.com`, `sandra@hotmail.com`, entre outras.

Parar: `docker compose down` (os dados ficam guardados).
Apagar tudo e recriar a base de dados do zero: `docker compose down -v`.

---

## Demonstração obrigatória (servidores)

Com o site e a página `/estado` abertos lado a lado:

1. O `/estado` mostra a que servidor este browser está ligado (ex.: **Servidor 1 (api1)**).
2. No site, licitar num leilão.
3. Ver o lance no **Histórico de licitações** do leilão.
4. Matar o servidor 1: `docker compose kill api1`
5. Em poucos segundos o `/estado` mostra **Servidor 2 (api2)**.
6. Licitar de novo.
7. O histórico mostra os dois lances.
8. Ligar o servidor 1: `docker compose start api1` → o browser regressa ao **Servidor 1**.

---

## Testes de falha

| Cenário | Provocar | O que acontece | Recuperar |
|---|---|---|---|
| Falha de um servidor da API | `docker compose kill api1` | O Nginx deteta a falha e passa os pedidos para a `api2`; se era a líder, a `api2` assume o fecho de leilões. | `docker compose start api1` |
| Falha de uma réplica da BD | `docker compose kill pg-replica2` | As escritas continuam: a outra réplica confirma cada lance. | `docker compose start pg-replica2` (volta a sincronizar sozinha) |
| Falha do principal da BD | `docker compose kill pg-primary` | Em ~10-20 s uma réplica é promovida a principal (timeline sobe) e as APIs passam a usá-la. Durante esse tempo os lances são recusados (modo só de leitura). | `docker compose start pg-primary` (volta como réplica) |
| Falha de um Nginx | `docker compose kill nginx` | O site deixa de abrir na porta 8080 e continua na 8081 (é preciso iniciar sessão de novo nessa porta). | `docker compose start nginx` |
| Falha dos workers | `docker compose kill worker1 worker2` | Os lances continuam; os eventos ficam na fila `notifications` até os workers voltarem. | `docker compose start worker1 worker2` |
| Falha do RabbitMQ | `docker compose kill rabbitmq` | Os lances continuam; os eventos ficam guardados no outbox (PostgreSQL) e são publicados por ordem quando o broker volta. | `docker compose start rabbitmq` |
| Falha do Redis | `docker compose kill redis` | Os lances continuam; o tempo real entre as duas APIs para até o Redis voltar. | `docker compose start redis` |

Para ver as decisões do failover da base de dados:

```bash
docker compose logs pg-primary pg-replica1 pg-replica2 | grep failover
```

Testes automáticos e de carga (com o sistema a correr):

```bash
docker compose exec -T api1 node scripts/smoke-test.js http://nginx
docker compose exec -T api1 node scripts/stress-bids.js http://nginx 8 300 20
```

---

## Estrutura do repositório

| Pasta | Conteúdo |
|---|---|
| `frontend/` | Site (HTML, CSS, JavaScript), incluindo a página `/estado` |
| `infra/api/` | API e workers em Node.js (Express, Socket.IO, RabbitMQ) |
| `infra/postgres/` | Arranque dos nós, esquema, dados de teste, vigia de failover (`watchdog.sh`) e failover manual (`failover.sh`) |
| `infra/nginx/` | Configuração dos Nginx (balanceamento, afinidade, deteção de falhas) |
| `infra/docker/` | `docker-compose.yml` com todos os serviços |
| `Projeto_NextBid/` | Memória e arquivo documental do projeto |
| `backend/`, `database/` | Versão anterior (PHP + MySQL) do semestre passado; já não é usada |
