# Memória e Arquivo Documental

## 1. Identificação
* **Nome do projeto:** NextBid - Plataforma Distribuída de Leilões On-line
* **Ano letivo:** 2026-2027
* **Semestre:** 5º Semestre
* **Unidades curriculares:** Projeto de Desenvolvimento de Software, Engenharia de Software, Segurança Informática, Sistemas Distribuídos, Inteligência Artificial
* **Docentes:** Miguel Boavida, Rui Ramos, Sérgio Nunes, Pedro Rosa, Samuel Gomes.

## 2. Resumo
O projeto NextBid consiste no desenvolvimento de uma plataforma avançada de leilões on-line, concebida para responder aos rigorosos desafios técnicos associados ao comércio eletrónico em tempo real e de alta concorrência. No semestre anterior, a plataforma foi desenvolvida sob uma arquitetura de software monolítica e centralizada. Contudo, essa abordagem apresentava vulnerabilidades críticas, nomeadamente a existência de um ponto único de falha e limitações severas na escalabilidade durante os picos de tráfego, fenómenos habituais nos instantes finais dos leilões, vulgarmente conhecidos como "sniping".

Para colmatar estas falhas estruturais, a presente fase do projeto (2ª Entrega) focou-se na total reformulação arquitetural do NextBid, transitando para um sistema distribuído, tolerante a faltas e altamente disponível. A nova infraestrutura abandona o modelo de servidor único e adota uma abordagem baseada em microsserviços. O backend, agora desenvolvido em Node.js utilizando a framework Express, é encapsulado em contentores Docker, permitindo a execução simultânea de múltiplas instâncias. O tráfego de rede é gerido e distribuído equitativamente por um balanceador de carga (Nginx), garantindo que a falha de um nó de aplicação seja imediatamente compensada pelas restantes instâncias ativas, sem disrupção para o utilizador final.

No que concerne à persistência e integridade da informação, o sistema substitui a base de dados centralizada por uma topologia relacional PostgreSQL com replicação síncrona: um nó principal e duas réplicas. Cada licitação é validada e confirmada de forma síncrona e atómica. Para suportar o elevado volume de licitações concorrentes sem prolongar o bloqueio da base de dados, a arquitetura integra o RabbitMQ como sistema de mensageria para os efeitos secundários de cada lance. O evento é publicado em filas replicadas (*quorum queues*) e consumido por *workers* assíncronos. 

De forma a garantir uma consolidação sólida desta nova infraestrutura distribuída, as componentes de **Inteligência Artificial** (análise preditiva e deteção de fraudes em Python) e de **Segurança Informática** (gestão de sessões *stateless* com JWT e autenticação 2FA) foram estrategicamente agendadas para a 3ª entrega. O resultado final será um ecossistema de leilões distribuído, escalável, seguro e inteligente.

## 3. Contexto
* **Problema abordado:** A arquitetura centralizada herdada da fase anterior criava um Ponto Único de Falha (SPOF) e não suportava picos de concorrência elevados, resultando em bloqueios transacionais e quebras de serviço.
* **Motivação:** Garantir a disponibilidade contínua do serviço e a integridade rigorosa das licitações submetidas simultaneamente por múltiplos utilizadores, preparando o terreno para análises e validações avançadas.
* **Objetivos da Fase Atual:** Desenvolver a solução baseada em microsserviços suportada por replicação de bases de dados e filas de mensagens, provando a tolerância a faltas perante a queda de nós da aplicação ou da base de dados.

## 4. Processo
* **Metodologia utilizada:** Desenvolvimento ágil com iterações incrementais, com foco inicial exclusivo na orquestração de rede, distribuição de tráfego e consistência de dados.
* **Ferramentas utilizadas:** Git/GitHub para versionamento, Docker e Docker Compose para orquestração da infraestrutura, VS Code, Draw.io para diagramação técnica.
* **Tecnologias utilizadas (2ª Entrega):** HTML/CSS/JS (Frontend), Node.js com Express (Backend API e Workers), PostgreSQL com replicação síncrona, RabbitMQ (Mensageria assíncrona), Redis e Socket.IO (Tempo real).
* **Tecnologias a integrar (3ª Entrega):** Python/Scikit-Learn (IA) e JWT/TOTP (Segurança).
* **Estrutura da equipa:** Martim Fonseca, Marco Fonseca, Rodrigo Canto e Rodrigo Daibert. A equipa dividiu esforços na configuração dos contentores, planeamento da arquitetura de rede, implementação do backend Node.js e orquestração do RabbitMQ.

## 5. Resultados da 2ª Entrega
* **Descrição da solução desenvolvida:** Uma infraestrutura de comércio eletrónico resiliente, assente na confirmação síncrona dos lances e no processamento assíncrono dos seus efeitos, onde múltiplos nós de backend comunicam com um cluster de bases de dados replicado.
* **Funcionalidades principais implementadas:** 
  * Distribuição de carga com *failover* automático.
  * Replicação síncrona do PostgreSQL.
  * Licitações em tempo real com atualização via WebSockets.
  * Processamento assíncrono de eventos através de filas do RabbitMQ, garantindo ausência de perda de dados.
* **Contributos relevantes:** A prova de conceito prática de que retirar os efeitos secundários da transação do lance para processamento assíncrono (em *workers* dedicados) aumenta significativamente a capacidade do sistema em processar lances por segundo, sem comprometer a integridade dos dados durante falhas simuladas de componentes.

## 6. Reflexão
* **Lições aprendidas:** A transição de um ecossistema monolítico para uma arquitetura distribuída evidenciou a elevada complexidade subjacente à manutenção da consistência de dados. Demonstrou também que nem tudo deve passar por uma fila: o lance exige resposta imediata e consistência estrita na base de dados, enquanto os seus efeitos (notificações, histórico) toleram perfeitamente a consistência eventual proporcionada pelo RabbitMQ.
* **Limitações Atuais:** A pulverização dos serviços por múltiplos contentores Docker aumentou substancialmente a complexidade do *debugging* e exige um controlo rigoroso sobre as rotas internas. Além disso, a plataforma carece ainda de mecanismos avançados de segurança de autenticação, dependendo atualmente de validações básicas.
* **Trabalho futuro (3ª Entrega):** 
  1. **Segurança Informática:** Conversão completa do sistema de autenticação para JWT (*stateless*) e implementação de 2FA.
  2. **Inteligência Artificial:** Integração do módulo em Python como consumidor dos eventos de licitação, treinando algoritmos de *Machine Learning* para detetar anomalias comportamentais e lances fraudulentos.
  3. **Infraestrutura:** Consolidação do cluster RabbitMQ para evitar que as filas fiquem vulneráveis à queda de um único *broker*.
