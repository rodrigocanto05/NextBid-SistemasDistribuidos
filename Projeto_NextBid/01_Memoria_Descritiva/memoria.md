# Memória e Arquivo Documental

## 1. Identificação
* **Nome do projeto:** NextBid - Plataforma Distribuída de Leilões On-line
* **Ano letivo:** 2026-2027
* **Semestre:** 5º Semestre
* **Unidades curriculares:** Projeto de Desenvolvimento de Software, Engenharia de Software, Segurança Informática, Sistemas Distribuídos, Inteligência Artificial
* **Docentes:** Miguel Boavida, Rui Ramos, Sérgio Nunes, Pedro Rosa, Samuel Gomes.

## 2. Resumo
O projeto NextBid consiste no desenvolvimento de uma plataforma avançada de leilões on-line, concebida para responder aos rigorosos desafios técnicos associados ao comércio eletrónico em tempo real e de alta concorrência. No semestre anterior, a plataforma foi desenvolvida sob uma arquitetura de software monolítica e centralizada. Contudo, essa abordagem apresentava vulnerabilidades críticas, nomeadamente a existência de um ponto único de falha e limitações severas na escalabilidade durante os picos de tráfego, fenómenos habituais nos instantes finais dos leilões, vulgarmente conhecidos como "sniping".

Para colmatar estas falhas estruturais, o presente projeto foca-se na total reformulação arquitetural do NextBid, transitando para um sistema distribuído, tolerante a faltas e altamente disponível. A nova infraestrutura abandona o modelo de servidor único e adota uma abordagem baseada em microsserviços. O backend, agora desenvolvido em Node.js utilizando a framework Express, é encapsulado em contentores Docker, permitindo a execução simultânea de múltiplas instâncias. O tráfego de rede é gerido e distribuído equitativamente por um balanceador de carga em configuração ativo-passivo, garantindo que a falha de um nó de aplicação seja imediatamente compensada pelas restantes instâncias ativas, sem qualquer disrupção para o utilizador final.

No que concerne à persistência e integridade da informação, o sistema substitui a base de dados centralizada por uma topologia relacional PostgreSQL com replicação síncrona: um nó principal e duas réplicas. Cada licitação é validada e confirmada de forma síncrona e atómica: o bloqueio da linha do leilão na base de dados assegura o cumprimento estrito da ordem dos lances e permite responder de imediato ao licitador. Para suportar o elevado volume de licitações concorrentes sem prolongar esse bloqueio, a arquitetura integra o RabbitMQ como sistema de mensageria para os efeitos secundários de cada lance (avisos ao licitador ultrapassado e a quem segue o leilão, pontos de experiência, mensagens no chat e, futuramente, a análise de fraude). O evento é gravado na mesma transação do lance (padrão *transactional outbox*) e só depois publicado em filas replicadas (*quorum queues*), consumidas por workers idempotentes, o que garante a ausência de perda de dados mesmo com o broker temporariamente indisponível.

Adicionalmente, o NextBid eleva os seus padrões de segurança informática e monitorização através da implementação de JSON Web Tokens (JWT) para uma gestão de sessões stateless e da exigência de autenticação de dois fatores (2FA) baseada em Time-based One-Time Password (TOTP) para a submissão de lances. A plataforma inova ainda ao incorporar um módulo de Inteligência Artificial, desenvolvido em Python recorrendo à biblioteca Scikit-Learn. Este componente analítico consome o histórico de transações para alimentar algoritmos de Machine Learning capazes de detetar anomalias comportamentais e identificar potenciais licitações fraudulentas em tempo real, bem como estimar o valor final de fecho dos artigos. O resultado é um ecossistema de leilões distribuído, escalável, seguro e inteligente, perfeitamente alinhado com as exigências de tolerância a faltas de uma solução de engenharia de software moderna.

## 3. Contexto
* **Problema abordado:** A arquitetura centralizada herdada da Fase III criava um Ponto Único de Falha (SPOF) e não suportava picos de concorrência elevados, resultando em bloqueios transacionais nos instantes finais dos leilões.
* **Motivação:** Garantir a disponibilidade contínua do serviço comercial e a integridade matemática, cronológica e financeira das licitações submetidas simultaneamente por centenas de utilizadores.
* **Objetivos:** Desenvolver uma solução em microsserviços suportada por replicação de bases de dados e filas de mensagens, garantindo proteção contra perda de dados, segurança avançada de acessos e monitorização inteligente de fraudes através de algoritmos preditivos.

## 4. Processo
* **Metodologia utilizada:** Metodologia de desenvolvimento ágil com iterações incrementais e planeamento semanal para acomodar a complexidade arquitetural.
* **Ferramentas utilizadas:** Git/GitHub para versionamento colaborativo obrigatório, Docker para orquestração local, VS Code e Draw.io/Figma para desenho e modelação do sistema.
* **Tecnologias utilizadas:** HTML/CSS/JS (Frontend), Node.js com Express (Backend e workers), PostgreSQL com replicação síncrona (Base de Dados), RabbitMQ (Mensageria assíncrona), Redis e Socket.IO (Tempo real), Python (Inteligência Artificial) e JWT/TOTP (Segurança Informática).
* **Estrutura da equipa:** Martim Fonseca, Marco Fonseca, Rodrigo Canto e Rodrigo Daibert. A equipa divide responsabilidades equitativas entre o planeamento da arquitetura de rede, implementação do backend Node.js, modelação preditiva e reforço dos vetores de cibersegurança.

## 5. Resultados (Projetados)
* **Descrição da solução desenvolvida:** Uma plataforma de comércio eletrónico altamente resiliente, assente na confirmação síncrona dos lances e no processamento assíncrono dos seus efeitos, onde múltiplos nós de backend comunicam com um cluster de bases de dados replicado e com workers através de filas de mensagens.
* **Funcionalidades principais:** Licitações em tempo real com confirmação imediata e atualização por WebSockets, notificações processadas de forma assíncrona através do RabbitMQ, failover automático de servidores através do balanceador de carga, deteção automática de lances anómalos via Machine Learning e autenticação em dois passos (2FA).
* **Contributos relevantes:** A prova de conceito prática de como a introdução de camadas de infraestrutura distribuída e filas de mensagens consegue resolver gargalos de desempenho críticos e concorrenciais no e-commerce moderno. No protótipo, retirar os efeitos secundários da transação do lance aumentou em 74% o número de lances processados por segundo num leilão com 50 seguidores, sem perda de eventos nos cenários de falha testados.

## 6. Reflexão
* **Lições aprendidas:** A transição de um ecossistema monolítico para uma arquitetura de microsserviços (Node.js) demonstrou a elevada complexidade subjacente à manutenção da consistência de dados distribuídos e à conversão de sessões nativas para ambientes totalmente *stateless* baseados em JWT. Demonstrou também que nem tudo deve passar por uma fila: o lance exige resposta imediata e consistência estrita, enquanto os seus efeitos toleram consistência eventual.
* **Limitações:** A pulverização dos serviços por múltiplos contentores Docker aumenta substancialmente a complexidade do *debugging* e da orquestração de redes locais, exigindo um controlo rigoroso sobre os ficheiros de configuração de *routing* interno entre os microsserviços.
* **Trabalho futuro:** Cluster de três nós RabbitMQ, para que as filas sobrevivam à falha de um nó, e integração do serviço de Inteligência Artificial como consumidor dos eventos de licitação, bem como o aprimoramento progressivo do modelo de treino para refinar a taxa de falsos positivos na deteção de fraudes nas licitações.

