(function () {
    const REFRESH_MS = 15000;

    document.addEventListener('DOMContentLoaded', () => {
        NB.renderNavbar();
        NB.showWelcomeIfPending();
        NB.initHeroCarousel();
        NB.initTicker();
        NB.Favorites?.load();
        loadFeatured();
        loadStats();
        setInterval(loadFeatured, REFRESH_MS);
        setInterval(loadStats, REFRESH_MS);

        // Mark intent to open "Criar Leilão" modal on the destination page
        document.getElementById('discover-create-link')?.addEventListener('click', () => {
            try { sessionStorage.setItem('nb_open_novo', '1'); } catch (_) {}
        });
    });

    function loadStats() {
        NB.apiGet('/api/stats/home.php').then(res => {
            if (res.status !== 'success') return;
            const d = res.data;
            setStat('stat-active-auctions', d.active_auctions);
            setStat('stat-total-bids',      d.total_bids);
            setStat('stat-sold-auctions',   d.sold_auctions);
            setStat('stat-total-users',     d.total_users);
        }).catch(() => {});
    }

    function setStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = Number(value).toLocaleString('pt-PT');
    }

    function loadFeatured() {
        NB.apiGet('/api/auctions/get_active.php')
            .then(data => {
                const list = (data.auctions || []).slice(0, 8);
                NB.renderGrid('leiloes-container', list, { favoritable: true });
                appendMoreCard();
            })
            .catch(() => {
                const el = document.getElementById('cards-loading');
                if (el) el.innerHTML = '<p>Erro ao carregar leilões.</p>';
            });
    }

    function appendMoreCard() {
        const grid = document.getElementById('leiloes-container');
        if (!grid || grid.querySelector('.auction-card--more')) return;

        const a = document.createElement('a');
        a.className = 'auction-card auction-card--more';
        a.href = 'leiloes/LeiloesAtivos.html';
        a.setAttribute('aria-label', 'Ver todos os leilões');
        a.innerHTML = `
            <div class="auction-card--more__inner">
                <span class="auction-card--more__plus" aria-hidden="true">+</span>
                <span class="auction-card--more__label">Ver todos os leilões</span>
                <span class="auction-card--more__hint">Explora a lista completa</span>
            </div>`;
        grid.appendChild(a);
    }
})();
