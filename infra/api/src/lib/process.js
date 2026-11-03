// Comportamento comum aos dois tipos de processo (API e worker): terminar com ordem e não
// morrer por causa de uma promessa rejeitada numa parte não crítica.

const log = require('./log');

// Rede de segurança: uma promessa rejeitada sem tratamento numa parte não crítica (ex.: publicar um
// evento Socket.IO com o Redis em baixo) não pode derrubar a instância. Regista no máximo uma vez
// por minuto e continua.
function ignoreUnhandledRejections() {
    let last = 0;
    process.on('unhandledRejection', err => {
        if (Date.now() - last > 60000) {
            last = Date.now();
            log.warn(`promessa rejeitada sem tratamento (ignorada): ${err && err.message ? err.message : err}`);
        }
    });
}

// `docker stop` envia SIGTERM: corre `stop` (fechar pedidos/consumos em curso e ligações) e sai.
// Se demorar mais de 8 s sai na mesma. `docker kill` (SIGKILL) não passa por aqui: é a falha
// "a sério" do modelo de faltas.
function onShutdown(stop) {
    let stopping = false;
    const handler = async signal => {
        if (stopping) return;
        stopping = true;
        log.info(`${signal} recebido; a terminar`);
        setTimeout(() => process.exit(1), 8000).unref();
        try {
            await stop();
        } catch (err) {
            log.warn(`erro ao terminar: ${err.message}`);
        }
        process.exit(0);
    };
    process.on('SIGTERM', () => handler('SIGTERM'));
    process.on('SIGINT', () => handler('SIGINT'));
}

module.exports = { ignoreUnhandledRejections, onShutdown };
