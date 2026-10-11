# 1. Título do projeto
## NextBid

# 2. Ano letivo
## 2026-2027

# 3. Semestre
## 5º Semestre

# 4. Curso(s) envolvidos
## Licenciatura em Engenharia Informática

# 5. Unidades curriculares e 6. Docentes
* **Projeto de Desenvolvimento de Software:** Miguel Boavida
* **Engenharia de Software:** Rui Ramos
* **Segurança Informática:** Sérgio Nunes 
* **Sistemas Distribuídos:** Pedro Rosa
* **Inteligência Artificial:** Samuel Gomes

# 7. Estudantes participantes
* **Rodrigo Alexandre Lebre do Canto** | Número: 20241084 | Contacto: 20241084@iade.pt
* **Marco Estrela Fonseca** | Número: 20241582 | Contacto: 20241582@iade.pt
* **Martim de Oliveira Alves Fonseca** | Número: 20241218 | Contacto: 20241218@iade.pt
* **Rodrigo Toscano Daibert** | Número: 20241750 | Contacto: 20241750@iade.pt

# 8. Palavras-chave
Sistemas Distribuídos, Tolerância a Faltas, Leilões On-line, Alta Disponibilidade, Replicação de Dados, Concorrência, Inteligência Artificial, Segurança Informática, Microsserviços.

# 9. Tecnologias utilizadas
* **Frontend:** HTML, CSS e JavaScript (desenvolvido em VS Code).
* **Backend:** Java (Spring Boot).
* **Base de Dados:** MySQL.
* **Infraestrutura e Distribuição:** Docker.
* **Inteligência Artificial:** Python.
* **Segurança Informática:** JWT (JSON Web Tokens) e mecanismos de proteção adicionais a implementar.


# 10. Resumo curto
O NextBid é uma plataforma web de leilões on-line que desenvolvemos num semestre anterior, com uma arquitetura centralizada e monolítica. Nesta fase, o objetivo é passá-la para um sistema distribuído.

Num leilão chegam muitos lances ao mesmo tempo, por isso as principais preocupações são a alta disponibilidade dos serviços, a consistência estrita dos dados em tempo real e a tolerância a faltas. Para eliminar os pontos únicos de falha da versão anterior, os serviços em Java Spring Boot e a base de dados MySQL vão ser replicados em contentores Docker.

O projeto vai ainda integrar componentes de Inteligência Artificial em Python para deteção de anomalias e reforçar a segurança com JWT e outras validações.
