# Definições comuns do proxy para a API (incluído pelo nextbid.conf).

proxy_pass http://nextbid_api;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Authorization $http_authorization;

proxy_connect_timeout 2s;
proxy_read_timeout 30s;

# Se uma instância falhar, o pedido passa para a seguinte.
# IMPORTANTE: por omissão o Nginx NÃO repete pedidos POST (não idempotentes) noutra instância.
# É de propósito: se a instância caiu a meio de um lance, não sabemos se o lance foi gravado,
# e repeti-lo podia duplicá-lo. O cliente recebe 502 e decide (o React envia Idempotency-Key).
#
# O 503 da API NÃO está na lista: significa "a base de dados está em baixo", e as 3 instâncias
# usam a mesma BD, por isso tentar noutra não ajuda. Pior: contava como falha da instância e,
# durante um failover da BD, o Nginx marcava as 3 como mortas e respondia 502 em HTML.
# (Encontrado no primeiro teste real com Docker.)
proxy_next_upstream error timeout http_502;
proxy_next_upstream_tries 3;

# Mostra no DevTools (separador Network) que instância respondeu
add_header X-Servido-Por $upstream_addr always;
# (os add_header de cima anulam os do bloco server, por isso repetem-se aqui)
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options SAMEORIGIN always;
