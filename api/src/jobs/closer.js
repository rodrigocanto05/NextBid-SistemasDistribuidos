// Fecho de leilões (corre só na instância líder, ver jobs/leader.js). Substitui o
// executarLazyCron() do PHP, que fechava leilões "à boleia" de pedidos: com 3 instâncias seriam
// 3 processos a tentar fechar o mesmo leilão ao mesmo tempo.
//
// Mesmo que por um instante haja duas líderes, closeOne() usa `for no key update skip locked` e só fecha
// leilões com estado 'active': nenhum leilão é pago duas vezes.

const auctions = require('../services/auctions');
const log = require('../lib/log');

async function tick() {
    const closed = await auctions.closeExpired();
    if (closed) log.info(`fechei ${closed} leilão(ões)`);
    await auctions.notifyFavoritesEnding();
}

module.exports = { tick };
