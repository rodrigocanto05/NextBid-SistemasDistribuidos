# Modelo de Faltas – NextBid (2.ª entrega)

## 1. Componentes que podem falhar

| Componente | Instâncias | Redundância |
|---|---|---|
| Nginx (entrada e frontend) | 2 | Sim: o site está disponível nas portas 8080 e 8081 |
| API Node.js (servidores) | 2 | Sim: o Nginx usa o servidor que estiver vivo |
| Workers | 2 | Sim: consomem a mesma fila |
| PostgreSQL | 3 (1 principal + 2 réplicas) | Sim: replicação síncrona e failover automático |
| RabbitMQ | 1 | Não, mas os eventos ficam guardados no outbox da base de dados |
| Redis | 1 | Não, mas só afeta o tempo real entre servidores |
| Rede entre componentes | — | Tratada como a falha do componente que deixa de responder |

## 2. Tipos de falha considerados
* **Falha por paragem:** um contentor termina ou deixa de responder (por exemplo, `docker compose kill`). É o tipo de falha que demonstramos.
* **Falha de comunicação:** um componente deixa de conseguir falar com outro. Para o sistema, tem o mesmo efeito que a paragem desse componente, e é detetada pelos mesmos tempos-limite.

Não consideramos falhas bizantinas (um componente que responde com dados errados) nem a falha da máquina inteira, porque nesta fase todos os contentores correm no mesmo computador.

## 3. Quantas falhas simultâneas o sistema suporta
Uma falha em cada grupo redundante ao mesmo tempo: um Nginx, um servidor, um worker e um nó da base de dados podem falhar em simultâneo sem perda de serviço nem de dados.

Se falharem dois nós da base de dados, o nó que resta não aceita escritas, porque não há nenhuma réplica para confirmar os lances. Preferimos parar as escritas a aceitar lances que se poderiam perder (damos prioridade à consistência).

## 4. Funcionalidades que se mantêm após uma falha

| Falha | O que continua a funcionar | O que fica afetado |
|---|---|---|
| Um servidor | Tudo | O pedido que estava a meio pode falhar e o utilizador repete-o |
| Uma réplica da BD | Tudo | Nada visível para o utilizador |
| Principal da BD | Consultar leilões, perfil, chat (leituras) | Lances e outras escritas suspensos durante 10 a 20 s, até a réplica ser promovida |
| Um Nginx | Tudo, pelo outro Nginx | O utilizador tem de abrir a outra porta e iniciar sessão de novo |
| Workers | Lances | Notificações e mensagens automáticas no chat ficam em fila até os workers voltarem |
| RabbitMQ | Lances | Notificações atrasadas; os eventos ficam no outbox |
| Redis | Lances | O tempo real entre os dois servidores para até o Redis voltar |

## 5. Como é detetada uma falha
* **Servidor:** o Nginx deteta o erro de ligação (tempo-limite de 2 s). O servidor fica fora durante 10 s, e o pedido é reencaminhado para o outro.
* **Base de dados:** cada nó tem um vigia (`infra/postgres/watchdog.sh`) que verifica os outros a cada 2 s. Ao fim de 5 verificações falhadas seguidas (cerca de 10 s), considera que o principal falhou.
* **Servidor líder:** o líder mantém um bloqueio (lock) na base de dados. Se o líder falhar, a ligação fecha, o bloqueio é libertado e o outro servidor obtém-no.
* **Workers e RabbitMQ:** o RabbitMQ deteta a perda de ligação de um worker; as APIs detetam a perda de ligação ao RabbitMQ.
* **Docker:** cada contentor tem uma verificação de saúde (healthcheck). A página `/estado` mostra o estado de todos os componentes em tempo real.

## 6. Como é feita a recuperação
* **Servidor, Nginx, worker, RabbitMQ e Redis:** voltam a funcionar quando o contentor é reiniciado. O Docker reinicia automaticamente os contentores que terminam por erro; nos testes reiniciamo-los com `docker compose start`. Ao voltar, o servidor recebe outra vez os seus browsers.
* **Principal da base de dados:** a réplica mais atualizada é promovida a principal (a timeline sobe de 1 para 2), a outra réplica passa a segui-la e as APIs descobrem o novo principal sozinhas.
* **Antigo principal:** quando volta, deteta que já existe um principal com uma timeline mais alta, apaga os dados antigos e copia os dados do novo principal, voltando como réplica. Assim nunca há dois principais.
* **Eventos:** quando o RabbitMQ volta, o servidor líder publica os eventos que ficaram no outbox, pela ordem em que foram criados.

## 7. Informação que pode ser perdida
* **Lances confirmados:** nenhum. Um lance só é confirmado depois de ser guardado no principal e em pelo menos uma réplica.
* **Pedido em curso:** se um servidor falhar a meio de um pedido, esse pedido pode falhar e o utilizador tem de o repetir. Um lance repetido com o mesmo valor é recusado, porque tem de ser superior ao lance atual, por isso não há lances duplicados.
* **Sessão:** ao mudar de servidor a sessão mantém-se (token JWT). Ao mudar de Nginx (de porta) é preciso iniciar sessão de novo, porque o browser guarda a sessão por endereço.
* **Eventos e notificações:** nenhum. Os eventos ficam no outbox ou na fila até serem tratados.

## 8. Consistência entre réplicas
* **Replicação síncrona (`ANY 1`):** cada escrita só é confirmada quando pelo menos uma das réplicas a guardou. Por isso, a réplica promovida no failover tem sempre todos os lances confirmados.
* **Uma única fonte de escritas:** só o principal aceita escritas, e os lances do mesmo leilão são serializados com um bloqueio na linha do leilão.
* **Sem dois principais:** o principal antigo é reconhecido pela timeline mais baixa e volta como réplica. Um principal isolado não consegue confirmar escritas, porque não tem réplicas.
* **Eventos sem duplicados:** cada worker regista os eventos já tratados (`processed_event`), por isso um evento entregue duas vezes só tem efeito uma vez.

---

## 9. Cenários de falha testados

Capturas de cada teste em `../06_Dados_Investigacao/testes_de_falha/`.

### Cenário 01 – Falha de um servidor (API)
1. **Componente que falha:** o servidor 1 (`api1`), com `docker compose kill api1`.
2. **Deteção:** o Nginx deteta o erro de ligação no pedido seguinte.
3. **Mecanismo que mantém o serviço:** o Nginx encaminha os pedidos para o servidor 2; o servidor 2 assume o papel de líder.
4. **Impacto nos utilizadores:** a mudança demorou cerca de 1 segundo. O utilizador continuou com a sessão iniciada e conseguiu licitar.
5. **Perda de dados:** nenhuma. O lance de 1372 feito no servidor 1 e o de 1373 feito no servidor 2 aparecem os dois no histórico do leilão.
6. **Recuperação:** `docker compose start api1`.
7. **Reposição da redundância:** o servidor 1 volta a receber pedidos, e o browser regressa a ele.

### Cenário 02 – Falha de uma réplica da base de dados
1. **Componente que falha:** `pg-replica2`.
2. **Deteção:** o principal deixa de ver a réplica (a página `/estado` mostra só uma réplica ligada).
3. **Mecanismo que mantém o serviço:** a outra réplica continua a confirmar cada escrita (regra `ANY 1`).
4. **Impacto nos utilizadores:** nenhum. O lance feito durante a falha foi aceite normalmente.
5. **Perda de dados:** nenhuma.
6. **Recuperação:** `docker compose start pg-replica2`.
7. **Reposição da redundância:** a réplica liga-se ao principal e recebe tudo o que foi escrito enquanto esteve em baixo (atraso 0 B). O principal volta a ter duas réplicas.

### Cenário 03 – Falha do principal da base de dados
1. **Componente que falha:** `pg-primary`.
2. **Deteção:** os vigias das réplicas deixam de obter resposta do principal; ao fim de 5 verificações (cerca de 10 s) consideram-no em baixo.
3. **Mecanismo que mantém o serviço:** a réplica mais atualizada (`pg-replica1`) promove-se a principal (timeline 2); `pg-replica2` passa a segui-la; as APIs mudam para o novo principal sozinhas.
4. **Impacto nos utilizadores:** durante 10 a 20 segundos o site mostrou os dados, mas não aceitou lances (modo só de leitura). Depois do failover, os lances voltaram a ser aceites.
5. **Perda de dados:** nenhuma. Todos os nós ficaram no mesmo ponto de replicação.
6. **Recuperação:** `docker compose start pg-primary`. O nó deteta que foi substituído e volta como réplica de `pg-replica1`.
7. **Reposição da redundância:** o novo principal volta a ter duas réplicas síncronas. As decisões dos vigias ficam registadas nos logs (`docker compose logs … | grep failover`).

### Cenário 04 – Falha de um Nginx
1. **Componente que falha:** o Nginx da porta 8080 (`nginx`).
2. **Deteção:** o browser deixa de conseguir abrir a porta 8080; a página `/estado` (aberta na porta 8081) mostra o `nginx` em baixo.
3. **Mecanismo que mantém o serviço:** o segundo Nginx (porta 8081) tem a mesma configuração e continua a servir o site e a encaminhar os pedidos.
4. **Impacto nos utilizadores:** quem estava na porta 8080 tem de abrir a porta 8081 e iniciar sessão de novo. O lance feito na porta 8081 foi aceite.
5. **Perda de dados:** nenhuma.
6. **Recuperação:** `docker compose start nginx`.
7. **Reposição da redundância:** as duas portas voltam a estar disponíveis.

### Cenários previstos para a 3.ª entrega
Falha dos workers, falha do RabbitMQ, falha do Redis e interrupção da comunicação entre componentes. Os comandos para os provocar estão no `README.md` do repositório e na página `/estado`.
