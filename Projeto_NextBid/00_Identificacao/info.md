# NextBid

## 1. Título do projeto
NextBid – Plataforma Distribuída de Leilões On-line

## 2. Ano letivo
2026-2027

## 3. Semestre
5.º semestre

## 4. Curso(s) envolvidos
Licenciatura em Engenharia Informática (Universidade Europeia / IADE)

## 5. Unidades curriculares
* Projeto de Desenvolvimento de Software
* Engenharia de Software
* Segurança Informática
* Sistemas Distribuídos
* Inteligência Artificial

## 6. Docentes
* **Projeto de Desenvolvimento de Software:** Rui Pascoal e Miguel Boavida
* **Engenharia de Software:** Rui Ramos
* **Segurança Informática:** Sérgio Nunes e Pedro Brandão
* **Sistemas Distribuídos:** Pedro Rosa
* **Inteligência Artificial:** Samuel Gomes

## 7. Estudantes participantes

| Nome completo | N.º de estudante | Curso | Ano curricular | Contacto institucional |
|---|---|---|---|---|
| Rodrigo Alexandre Lebre do Canto | 20241084 | Licenciatura em Engenharia Informática | 3.º ano | 20241084@iade.pt |
| Marco Estrela Fonseca | 20241582 | Licenciatura em Engenharia Informática | 3.º ano | 20241582@iade.pt |
| Martim de Oliveira Alves Fonseca | 20241218 | Licenciatura em Engenharia Informática | 3.º ano | 20241218@iade.pt |
| Rodrigo Toscano Daibert | 20241750 | Licenciatura em Engenharia Informática | 3.º ano | 20241750@iade.pt |

## 8. Palavras-chave
Sistemas distribuídos, tolerância a faltas, leilões on-line, alta disponibilidade, replicação de dados, failover, concorrência, mensagens assíncronas, Docker.

## 9. Tecnologias utilizadas
* **Frontend:** HTML, CSS e JavaScript, com atualização em tempo real por WebSocket (Socket.IO).
* **Backend:** Node.js com Express. Duas instâncias da API (servidor 1 e servidor 2) e dois workers para o processamento assíncrono.
* **Base de dados:** PostgreSQL 17 com um nó principal e duas réplicas síncronas, e failover automático.
* **Distribuição:** Docker Compose, dois Nginx (balanceamento de carga e afinidade por cookie), RabbitMQ (fila de eventos) e Redis (tempo real entre servidores).
* **Segurança:** palavras-passe guardadas com hash (bcrypt) e sessões com tokens JWT. A autenticação de dois fatores e o HTTPS ficam para a 3.ª entrega.
* **Inteligência Artificial:** Python (previsto para a 3.ª entrega).
* **Ferramentas:** Git e GitHub, VS Code, Figma e Draw.io.

## 10. Resumo curto
O NextBid é uma plataforma web de leilões on-line, criada no semestre anterior com uma arquitetura centralizada. Nesta fase transformámo-la num sistema distribuído e tolerante a faltas. O site é servido por dois Nginx, que repartem os pedidos por dois servidores Node.js. Os dados ficam numa base de dados PostgreSQL com um nó principal e duas réplicas síncronas, e quando o principal falha uma réplica é promovida automaticamente. Os efeitos de cada lance, como as notificações e as mensagens no chat, são tratados à parte através do RabbitMQ e de workers. Todos os componentes correm em contentores Docker, e a falha de um componente de cada vez não deixa o site em baixo nem faz perder lances. A componente de Inteligência Artificial e o reforço da segurança são o foco da próxima entrega.
