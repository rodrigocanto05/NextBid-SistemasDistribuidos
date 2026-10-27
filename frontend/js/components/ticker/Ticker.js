// Live auctions ticker bar
window.NB = window.NB || {};

NB.initTicker = function () {
    const track = document.getElementById('ticker-track');
    if (!track) return;

    NB.apiGet('/api/auctions/get_active.php')
        .then(data => {
            const list = (data.auctions || []).slice(0, 8);
            if (!list.length) {
                track.innerHTML = `<span class="ticker__item ticker__item--static">
                    <span class="ticker__dot"></span>
                    <span class="ticker__live">NextBid</span>
                    <span class="ticker__name">Sem leilões ativos no momento</span>
                </span>`;
                return;
            }
            const items = list.map(a => {
                const href = NB._path(`leiloes/DetalheLeilao.html?id=${encodeURIComponent(a.prd_id)}`);
                return `
                <a class="ticker__item" href="${href}" aria-label="Ver leilão ${NB.escHtml(a.prd_name)}">
                    <span class="ticker__dot"></span>
                    <span class="ticker__live">AO VIVO</span>
                    <span class="ticker__name">${NB.escHtml(a.prd_name)}</span>
                    <span class="ticker__sep">•</span>
                    <span class="ticker__amount">${NB.formatCurrency(a.current_bid || a.prd_start_price)}</span>
                </a>`;
            }).join('');

            // Repeat items until the track is at least 2× the viewport wide so
            // the -50% scroll loop never exposes empty space at any zoom level.
            track.innerHTML = items + items;
            NB._padTickerToFit(track, items);
        })
        .catch(() => {
            track.innerHTML = `<span class="ticker__item ticker__item--static">
                <span class="ticker__dot"></span>
                <span class="ticker__live">Offline</span>
            </span>`;
        });
};

NB._padTickerToFit = function (track, oneSetHtml) {
    // Inserts copies *in pairs* so the total stays even — the -50% scroll
    // animation only loops seamlessly when the two halves of the track match.
    const target = () => Math.max(window.innerWidth * 2, 1200);
    const grow = () => {
        let safety = 12;
        while (track.scrollWidth < target() && safety-- > 0) {
            track.insertAdjacentHTML('beforeend', oneSetHtml + oneSetHtml);
        }
    };
    grow();
    if (!NB._tickerResizeBound) {
        NB._tickerResizeBound = true;
        let t = null;
        window.addEventListener('resize', () => {
            clearTimeout(t);
            t = setTimeout(grow, 150);
        });
    }
};
