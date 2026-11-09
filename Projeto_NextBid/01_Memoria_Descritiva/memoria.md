# Memória Descritiva – NextBid

## 1. Identificação
* **Nome do projeto:** NextBid – Plataforma Distribuída de Leilões On-line
* **Ano letivo:** 2026-2027
* **Semestre:** 5.º semestre
* **Unidades curriculares:** Projeto de Desenvolvimento de Software, Engenharia de Software, Segurança Informática, Sistemas Distribuídos e Inteligência Artificial
* **Docentes:** Rui Pascoal, Miguel Boavida, Rui Ramos, Sérgio Nunes, Pedro Brandão, Pedro Rosa e Samuel Gomes

## 2. Resumo
O NextBid é uma plataforma web de leilões on-line. Os utilizadores publicam artigos ou serviços, licitam em tempo real, conversam no chat de cada leilão e recebem avisos quando alguém cobre a sua oferta. A primeira versão foi desenvolvida no semestre anterior, com um único servidor PHP e uma única base de dados MySQL. Essa arquitetura funcionava, mas tinha um problema sério: se o servidor ou a base de dados falhassem, o site inteiro parava, e num leilão isso pode acontecer exatamente nos últimos segundos, quando chegam mais lances.

Neste semestre o objetivo foi transformar o NextBid num sistema distribuído e tolerante a faltas. O backend foi reescrito em Node.js com Express e passou a correr em duas instâncias iguais. À frente delas estão dois Nginx, que servem o site e repartem os pedidos. Cada browser fica ligado sempre ao mesmo servidor enquanto este estiver vivo; se o servidor cair, o Nginx passa os pedidos para o outro e, quando o primeiro volta, o browser regressa a ele. Como as sessões usam tokens JWT, o utilizador não perde a sessão quando muda de servidor.

Os dados ficam numa base de dados PostgreSQL com três nós: um principal, que recebe as escritas, e duas réplicas síncronas. Um lance só é aceite depois de pelo menos uma réplica o ter guardado, por isso a falha do principal não faz perder lances confirmados. Cada nó tem um pequeno processo de vigilância que deteta a falha do principal e promove a réplica mais atualizada, sem intervenção manual. Quando o antigo principal volta, entra como réplica do novo, o que evita ter dois principais ao mesmo tempo.

O lance é processado de forma síncrona e atómica: a linha do leilão é bloqueada, o valor é validado e o lance é gravado. Tudo o que pode ser feito depois (avisar quem foi ultrapassado, atribuir pontos de experiência e escrever a mensagem no chat) é enviado como evento para o RabbitMQ e tratado por dois workers. O evento é gravado na mesma transação do lance, por isso mesmo que o RabbitMQ esteja em baixo nenhum evento se perde. O Redis leva os eventos de tempo real de um servidor para o outro, para que todos os browsers vejam os lances no momento.

Todos os componentes correm em contentores Docker. Testámos a falha de um servidor, de uma réplica, do principal da base de dados e de um Nginx, e em todos os casos o site continuou disponível e nenhum lance se perdeu. A componente de Inteligência Artificial, a autenticação de dois fatores e o HTTPS ficam para a 3.ª entrega.

## 3. Contexto
* **Problema abordado:** a versão anterior do NextBid tinha um único servidor e uma única base de dados. Qualquer falha num deles deixava o site indisponível, e não havia forma de aguentar picos de lances no fim dos leilões.
* **Motivação:** num site de leilões, a disponibilidade e a integridade dos dados são essenciais. Um lance aceite não pode desaparecer, e o site não pode parar nos minutos finais de um leilão.
* **Objetivos:** eliminar os pontos únicos de falha com redundância em todas as camadas (entrada, servidores e base de dados), detetar falhas e recuperar delas automaticamente sempre que possível, e demonstrar na prática que o sistema cumpre estas garantias.

## 4. Processo
* **Metodologia utilizada:** desenvolvimento ágil, com iterações curtas. Em cada iteração acrescentámos uma camada de redundância e testámos a falha correspondente antes de passar à seguinte.
* **Ferramentas utilizadas:** Git e GitHub (versões e trabalho em equipa), Docker e Docker Compose, VS Code, Figma (mockups e design system) e Draw.io (diagramas).
* **Tecnologias utilizadas:** HTML, CSS e JavaScript com Socket.IO (frontend); Node.js com Express (API e workers); PostgreSQL 17 com replicação síncrona; RabbitMQ; Redis; Nginx; bcrypt e JWT para as palavras-passe e as sessões.
* **Estrutura da equipa:** Rodrigo Canto, Marco Fonseca, Martim Fonseca e Rodrigo Daibert. O trabalho foi dividido entre a infraestrutura (Docker, Nginx e base de dados), o backend em Node.js, o frontend e os testes de falha, e a documentação.

## 5. Resultados
* **Descrição da solução desenvolvida:** uma plataforma de leilões distribuída, com dois pontos de entrada (Nginx), dois servidores de aplicação, uma base de dados PostgreSQL replicada com failover automático, processamento assíncrono com RabbitMQ e workers, e tempo real com Socket.IO e Redis.
* **Funcionalidades principais:**
  * registo, início de sessão e gestão do perfil e do saldo;
  * publicação de leilões e licitação em tempo real, com chat e notificações;
  * balanceamento de carga com afinidade: cada browser fica no mesmo servidor e muda de servidor se este falhar;
  * replicação síncrona da base de dados e failover automático do principal;
  * processamento assíncrono dos efeitos de cada lance, sem perda de eventos;
  * página de estado do sistema, que mostra cada componente em tempo real e é usada nas demonstrações de falhas.
* **Contributos relevantes:** os testes de falha mostram que o sistema continua disponível quando falha um servidor (a mudança demora cerca de um segundo), uma réplica ou um Nginx. Quando falha o principal da base de dados, os lances ficam suspensos entre 10 e 20 segundos e depois voltam a ser aceites, sem perda de dados.

## 6. Reflexão
* **Lições aprendidas:** ter várias cópias de um componente não chega. É preciso decidir como se deteta a falha, quem assume o lugar e como se evita que dois componentes façam o mesmo trabalho ao mesmo tempo, como dois principais na base de dados ou dois servidores a fechar o mesmo leilão. Aprendemos também que nem tudo deve passar por uma fila: o lance precisa de resposta imediata e consistente, enquanto as notificações podem chegar um pouco depois.
* **Limitações:** todos os contentores correm na mesma máquina, por isso a falha da própria máquina não é tolerada. O RabbitMQ e o Redis têm um único nó: se o RabbitMQ falhar, os lances continuam, mas as notificações ficam à espera; se o Redis falhar, o tempo real entre os dois servidores para até ele voltar. Ao mudar de Nginx (de uma porta para a outra) o utilizador tem de iniciar sessão outra vez.
* **Trabalho futuro (3.ª entrega):** componente de Inteligência Artificial em Python para detetar licitações anómalas; autenticação de dois fatores e HTTPS; cluster de três nós no RabbitMQ; e a demonstração completa de todos os cenários de falha.
