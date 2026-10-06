# Memória Descritiva - NextBid

## 1. Identificação
* **Nome do projeto:** NextBid - Plataforma Distribuída de Leilões On-line
* **Ano letivo:** 2026-2027
* **Semestre:** 5º Semestre
* **Unidades curriculares:** Projeto de Desenvolvimento de Software, Engenharia de Software, Segurança Informática, Sistemas Distribuídos, Inteligência Artificial
* **Docentes:** Miguel Boavida, Rui Ramos, Sérgio Nunes, Pedro Rosa, Samuel Gomes

## 2. Resumo
O projeto NextBid consiste no desenvolvimento de uma plataforma avançada de leilões on-line, concebida para responder aos rigorosos desafios técnicos associados ao comércio eletrónico em tempo real e de alta concorrência. No semestre anterior, a plataforma foi desenvolvida sob uma arquitetura de software monolítica e centralizada. Contudo, essa abordagem apresentava vulnerabilidades críticas, nomeadamente a existência de um ponto único de falha e limitações severas na escalabilidade durante os picos de tráfego, fenómenos habituais nos instantes finais dos leilões, vulgarmente conhecidos como "sniping".

Para colmatar estas falhas estruturais, o presente projeto foca-se na total reformulação arquitetural do NextBid, transitando para um sistema distribuído, tolerante a faltas e altamente disponível. A nova infraestrutura abandona o modelo de servidor único e adota uma abordagem baseada em microsserviços. O backend, agora desenvolvido em Java utilizando a framework Spring Boot, é encapsulado em contentores Docker, permitindo a execução simultânea de múltiplas instâncias. O tráfego de rede é gerido e distribuído equitativamente por um balanceador de carga em configuração ativo-passivo, garantindo que a falha de um nó de aplicação seja imediatamente compensada pelas restantes instâncias ativas, sem qualquer disrupção para o utilizador final.

No que concerne à persistência e integridade da informação, o sistema substitui a base de dados centralizada por uma topologia relacional MySQL com replicação síncrona no modelo Master-Slave. Para suportar o elevado volume de licitações concorrentes e evitar o bloqueio da base de dados, a arquitetura integra o RabbitMQ como sistema de mensageria. As licitações submetidas são colocadas numa fila de processamento assíncrona, assegurando o cumprimento estrito da ordem cronológica dos lances e a ausência de perda de dados.

Adicionalmente, o NextBid eleva os seus padrões de segurança informática e monitorização através da implementação de JSON Web Tokens (JWT) para uma gestão de sessões stateless e da exigência de autenticação de dois fatores (2FA) baseada em Time-based One-Time Password (TOTP) para a submissão de lances. A plataforma inova ainda ao incorporar um módulo de Inteligência Artificial, desenvolvido em Python recorrendo à biblioteca Scikit-Learn. Este componente analítico consome o histórico de transações para alimentar algoritmos de Machine Learning capazes de detetar anomalias comportamentais e identificar potenciais licitações fraudulentas em tempo real, bem como estimar o valor final de fecho dos artigos. O resultado é um ecossistema de leilões distribuído, escalável, seguro e inteligente, perfeitamente alinhado com as exigências de tolerância a faltas de uma solução de engenharia de software moderna.

## 3. Contexto
* **Problema abordado:** A arquitetura centralizada herdada da Fase III criava um Ponto Único de Falha (SPOF) e não suportava picos de concorrência elevados, resultando em bloqueios transacionais nos instantes finais dos leilões.
* **Motivação:** Garantir a disponibilidade contínua do serviço comercial e a integridade matemática, cronológica e financeira das licitações submetidas simultaneamente por centenas de utilizadores.
* **Objetivos:** Desenvolver uma solução em microsserviços suportada por replicação de bases de dados e filas de mensagens, garantindo proteção contra perda de dados, segurança avançada de acessos e monitorização inteligente de fraudes através de algoritmos preditivos.

## 4. Processo
* **Metodologia utilizada:** Metodologia de desenvolvimento ágil com iterações incrementais e planeamento semanal para acomodar a complexidade arquitetural.
* **Ferramentas utilizadas:** Git/GitHub para versionamento colaborativo obrigatório, Docker para orquestração local, VS Code e Draw.io/Figma para desenho e modelação do sistema.
* **Tecnologias utilizadas:** HTML/CSS/JS (Frontend), Java Spring Boot (Backend), MySQL com replicação (Base de Dados), RabbitMQ (Mensageria), Python (Inteligência Artificial) e JWT/TOTP (Segurança Informática).
* **Estrutura da equipa:** Martim Fonseca, Marco Fonseca, Rodrigo Canto e Rodrigo Daibert. A equipa divide responsabilidades equitativas entre o planeamento da arquitetura de rede, implementação do backend Java, modelação preditiva e reforço dos vetores de cibersegurança.

## 5. Resultados (Projetados)
* **Descrição da solução desenvolvida:** Uma plataforma de comércio eletrónico altamente resiliente assente em processamento assíncrono, onde múltiplos nós de backend comunicam perfeitamente com um cluster de bases de dados replicado.
* **Funcionalidades principais:** Licitações em tempo real asseguradas por RabbitMQ, failover automático de servidores através do balanceador de carga, deteção automática de lances anómalos via Machine Learning e autenticação em dois passos (2FA).
* **Contributos relevantes:** A prova de conceito prática de como a introdução de camadas de infraestrutura distribuída e filas de mensagens consegue resolver gargalos de desempenho críticos e concorrenciais no e-commerce moderno.

## 6. Reflexão
* **Lições aprendidas:** A transição de um ecossistema monolítico para uma arquitetura de microsserviços (Java Spring Boot) demonstrou a elevada complexidade subjacente à manutenção da consistência de dados distribuídos e à conversão de sessões nativas para ambientes totalmente *stateless* baseados em JWT.
* **Limitações:** A pulverização dos serviços por múltiplos contentores Docker aumenta substancialmente a complexidade do *debugging* e da orquestração de redes locais, exigindo um controlo rigoroso sobre os ficheiros de configuração de *routing* interno entre os microsserviços.
* **Trabalho futuro:** Otimização dos tempos de resposta da comunicação assíncrona entre o broker de mensagens (RabbitMQ) e a base de dados principal, bem como o aprimoramento progressivo do modelo de treino da Inteligência Artificial para refinar a taxa de falsos positivos na deteção de fraudes nas licitações.

