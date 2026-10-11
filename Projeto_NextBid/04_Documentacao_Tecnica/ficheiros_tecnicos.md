Descrição da Solução Desenvolvida (NextBid)

Para o projeto deste semestre, decidimos pegar na plataforma de leilões que desenvolvemos anteriormente e evoluí-la para um sistema robusto e preparado para cenários reais. O grande problema de um site de leilões acontece nos últimos segundos (o famoso sniping), quando dezenas de utilizadores tentam licitar exatamente ao mesmo tempo. Como sabíamos que um servidor tradicional não ia aguentar esse pico de concorrência e podia falhar deitando tudo a perder, optámos por reestruturar o NextBid numa arquitetura distribuída e baseada em microsserviços.   

Como organizámos a arquitetura e a tolerância a falhas:
Em vez de termos tudo a correr na mesma máquina, agora o tráfego dos utilizadores entra através de um Load Balancer (Nginx). O Nginx distribui os acessos de forma equilibrada por três instâncias independentes do nosso backend (desenvolvido em Java Spring Boot), que estão a correr dentro de contentores Docker. Se uma destas instâncias for abaixo por algum erro inesperado, o sistema não cai: o Nginx percebe a falha e reencaminha os utilizadores para os servidores que continuam ativos.   

Na base de dados, aplicámos o mesmo princípio. Usamos MySQL com replicação Primary-Replica (Master/Slave). Basicamente, tudo o que é escrito na base de dados principal é copiado em tempo real para a réplica. Se o servidor de dados principal falhar a meio de um leilão, a réplica assume imediatamente o lugar, garantindo que não perdemos o histórico de lances de ninguém.   

Lidar com lances em tempo real:
Para resolver as colisões de lances simultâneos (race conditions), usamos WebSockets para manter a ligação em tempo real com o frontend. Quando as licitações entram, são enviadas diretamente para o RabbitMQ (um message broker). O RabbitMQ cria uma fila de mensagens e processa um lance de cada vez, por ordem de chegada, garantindo consistência total e sem bloquear o servidor.

Inteligência Artificial:
Para cumprir a componente de IA, criámos um microsserviço à parte feito em Python (FastAPI). Aqui implementámos duas grandes funcionalidades:   

- Bots de Licitação (Procura com Adversários): Usámos o algoritmo Minimax com poda Alpha-Beta para criar agentes autónomos. Estes "bots snipers" conseguem participar nos leilões e calcular a melhor estratégia para licitar contra jogadores humanos.

- Previsão de Preços (Machine Learning): Treinámos um modelo preditivo que olha para o histórico de leilões antigos e tenta prever o valor final de fecho de um artigo. Este modelo também nos ajuda a sinalizar anomalias (por exemplo, se detetar padrões de licitação demasiado rápidos que indiquem fraude).

Segurança Informática:
Finalmente, a segurança era um ponto crítico. Todas as comunicações estão protegidas por HTTPS e WSS (WebSockets Secure), e os logins são geridos através de tokens JWT. Além disso, como num leilão é obrigatório saber exatamente quem licitou e a que horas, implementámos um sistema de logs imutáveis. Isto garante o princípio de não-repúdio, ou seja, nenhum utilizador pode negar que fez um determinado lance, e ninguém consegue falsificar o histórico do leilão.   
