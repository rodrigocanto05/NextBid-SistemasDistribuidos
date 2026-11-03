// Tempo real com Socket.IO.
// Liga-se à API através do Nginx (/socket.io/) e entra na sala do leilão aberto.
// Um lance feito noutra janela, mesmo que tratado por outra instância da API, chega aqui logo:
// as 3 instâncias partilham os eventos através do Redis.
// Se o Socket.IO não estiver disponível (ex.: página aberta sem o Nginx), não faz nada e
// a página continua a funcionar só com o polling que já existia.
window.NB = window.NB || {};

NB.Realtime = (function () {
    let socket = null;

    function connect() {
        if (socket) return socket;
        if (typeof window.io !== 'function') return null;
        // Só WebSocket: o modo "polling" do Socket.IO precisaria de sticky sessions no Nginx.
        socket = window.io({ transports: ['websocket'] });
        socket.on('hello', h => console.debug('[NextBid] tempo real ligado à instância', h.instance));
        socket.on('connect_error', () => console.debug('[NextBid] tempo real indisponível; a tentar de novo'));
        return socket;
    }

    function watchAuction(productId, handlers = {}) {
        const s = connect();
        if (!s) return;
        const id = Number(productId);
        const join = () => s.emit('auction:join', id);
        // Ao reconectar (ex.: a instância a que estava ligado caiu) volta a entrar na sala
        s.on('connect', join);
        if (s.connected) join();

        s.on('bid:new', e => { if (Number(e.product_id) === id) handlers.onBid?.(e); });
        s.on('chat:new', e => { if (Number(e.product_id) === id) handlers.onChat?.(e); });
        s.on('auction:closed', e => { if (Number(e.product_id) === id) handlers.onClosed?.(e); });
    }

    return { watchAuction };
})();
