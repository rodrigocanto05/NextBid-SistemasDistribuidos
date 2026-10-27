// Keyword-based category auto-suggest
window.NB = window.NB || {};
NB.NovoLeilao = NB.NovoLeilao || {};

NB.NovoLeilao.KEYWORD_MAP = {
    'Eletrónica':      ['iphone','samsung','tablet','computador','pc','laptop','telemóvel','câmara','camera','tv','monitor','teclado','rato','headphones','playstation','xbox','nintendo','drone','gopro','smartwatch'],
    'Moda':            ['camisa','camisola','vestido','saia','calças','jeans','sapato','ténis','tenis','sapatilha','bota','roupa','casaco','jacket','bolsa','mala','carteira','cinto','chapéu'],
    'Automóveis':      ['carro','moto','motociclo','peugeot','ford','bmw','mercedes','audi','honda','toyota','volkswagen','renault','opel','seat','fiat','bicicleta','trotinete','scooter'],
    'Arte':            ['quadro','pintura','escultura','fotografia','litografia','gravura','obra','arte','canvas','tela','aquarela','óleo'],
    'Joalharia':       ['anel','colar','pulseira','brincos','relógio','bracelete','ouro','prata','diamante','joia','bijuteria'],
    'Colecionismo':    ['coleção','moeda','nota','selo','card','carta','vintage','retro','antigo','raridade','signed','autografado'],
    'Desporto':        ['bola','raquete','equipamento','desporto','gym','fitness','running','ciclismo','surf','ski','snowboard'],
    'Casa & Jardim':   ['sofa','sofá','mesa','cadeira','cama','armário','estante','tapete','espelho','candeeiro','jardim','ferramenta'],
    'Livros & Música': ['livro','livros','música','cd','vinil','disco','guitarra','piano','violino','instrumento'],
    'Brinquedos':      ['brinquedo','lego','playmobil','boneca','carrinho','puzzle','jogo','peluche'],
    'Informática':     ['servidor','switch','router','disco','ssd','ram','processador','gpu','placa','impressora','scanner'],
    'Viagens':         ['viagem','hotel','resort','pacote','voucher','cruzeiro','voo'],
    'Gastronomia':     ['vinho','champanhe','whisky','azeite','queijo','presunto','gourmet']
};

NB.NovoLeilao.initAutoSuggest = function (categories) {
    const sel    = document.getElementById('nl-categoria');
    const hintEl = document.getElementById('nl-categoria-hint');
    if (!sel) return;

    ['nl-nome','nl-descricao'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', suggest);
    });

    sel.addEventListener('change', () => {
        sel.dataset.userPicked = 'true';
        if (hintEl) hintEl.style.display = 'none';
    });

    function suggest() {
        if (sel.dataset.userPicked === 'true') return;
        const text = (document.getElementById('nl-nome').value + ' ' + document.getElementById('nl-descricao').value).toLowerCase();
        let best = null, bestScore = 0;
        for (const [cat, kws] of Object.entries(NB.NovoLeilao.KEYWORD_MAP)) {
            const score = kws.reduce((n, kw) => n + (text.includes(kw) ? 1 : 0), 0);
            if (score > bestScore) { best = cat; bestScore = score; }
        }
        if (best && bestScore > 0) {
            const match = categories.find(c => c.cat_name.toLowerCase() === best.toLowerCase());
            if (match) {
                sel.value = match.cat_id;
                if (hintEl) hintEl.style.display = '';
            }
        }
    }
};
