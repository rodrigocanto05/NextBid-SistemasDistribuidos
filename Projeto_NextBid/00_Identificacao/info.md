# Informação Geral do Projeto

* **Título do projeto:** NextBid
* **Ano letivo:** 2026-2027
* **Semestre:** 5º Semestre
* **Curso:** Licenciatura em Engenharia Informática

## Servidores / Infraestrutura
* **Servidor 1 (Nó Principal):** Nginx (Balanceador de Carga), Instância API 1, Worker 1, PostgreSQL (Nó Principal), RabbitMQ e Redis.
* **Servidor 2 (Nó Secundário / Tolerância a Faltas):** Instância API 2, Instância API 3, Worker 2 e PostgreSQL (Duas Réplicas Síncronas).
*(Nota: Sugestão de distribuição pelos 2 servidores exigidos, utilizando a infraestrutura Docker Compose descrita).*

## Identificação dos Alunos
* **Rodrigo Alexandre Lebre do Canto**
  * **Número:** 20241084 | **Contacto:** 20241084@iade.pt
  * **Ano:** 3.º Ano
* **Marco Estrela Fonseca**
  * **Número:** 20241582 | **Contacto:** 20241582@iade.pt
  * **Ano:** 3.º Ano
* **Martim de Oliveira Alves Fonseca**
  * **Número:** 20241218 | **Contacto:** 20241218@iade.pt
  * **Ano:** 3.º Ano
* **Rodrigo Toscano Daibert**
  * **Número:** 20241750 | **Contacto:** 20241750@iade.pt
  * **Ano:** 3.º Ano

## Unidades Curriculares e Docentes
* **Projeto de Desenvolvimento de Software:** Miguel Boavida
* **Engenharia de Software:** Rui Ramos
* **Segurança Informática:** Sérgio Nunes
* **Sistemas Distribuídos:** Pedro Rosa
* **Inteligência Artificial:** Samuel Gomes

## Palavras-chave
Sistemas Distribuídos, Tolerância a Faltas, Leilões On-line, Alta Disponibilidade, Replicação de Dados, Concorrência, Inteligência Artificial, Segurança Informática, Microsserviços.

## Tecnologias Utilizadas
* **Frontend:** HTML, CSS e JavaScript (via VS Code) com WebSockets (Socket.IO). Migração prevista para React.
* **Backend:** Node.js (Express) – 3 instâncias da API e 2 workers para processamento de eventos assíncronos.
* **Base de Dados:** PostgreSQL – 1 nó principal e 2 réplicas síncronas.
* **Infraestrutura e Distribuição:** Docker Compose, Nginx (balanceador de carga), RabbitMQ (eventos assíncronos com *quorum queues*) e Redis (tempo real entre instâncias).
* **Inteligência Artificial:** Python.
* **Segurança Informática:** JWT (JSON Web Tokens) e validações adicionais.

## Resumo Curto
O NextBid é uma plataforma web de leilões on-line que transita de uma arquitetura centralizada e monolítica para um sistema distribuído. Para dar resposta a um elevado volume de lances simultâneos, a solução foca-se na alta disponibilidade, consistência estrita dos dados em tempo real e tolerância a faltas. Os serviços Node.js e a base de dados PostgreSQL são replicados em contentores Docker para eliminar pontos únicos de falha. O projeto integra ainda Inteligência Artificial em Python para deteção de anomalias e mecanismos de segurança reforçados através de JWT.
