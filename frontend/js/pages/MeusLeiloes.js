(function () {
    document.addEventListener('DOMContentLoaded', () => {
        NB.renderNavbar();
        NB.initTicker();

        const user = NB.getCurrentUser();
        if (!user) { showLoginPrompt(); return; }

        NB.NovoLeilao.init(() => { loadAll(); });
        bindTabs();
        NB.Favorites?.onChange(renderFavoritesIfLoaded);
        loadAll();
        activateTabFromHash();
        window.addEventListener('hashchange', activateTabFromHash);
    });

    function bindTabs() {
        document.querySelectorAll('.tab').forEach(btn => {
            btn.addEventListener('click', () => activateTab(btn.dataset.tab));
        });
    }

    function activateTab(target) {
        document.querySelectorAll('.tab').forEach(t =>
            t.classList.toggle('tab--active', t.dataset.tab === target));
        document.querySelectorAll('.tab-panel').forEach(p =>
            p.classList.toggle('active', p.id === `panel-${target}`));
    }

    function activateTabFromHash() {
        const hash = (window.location.hash || '').replace('#', '');
        if (hash && document.getElementById(`tab-${hash}`)) activateTab(hash);
    }

    function loadAll() {
        Promise.all([
            NB.apiGet('/api/auctions/my_selling.php').catch(() => ({ auctions: [] })),
            NB.apiGet('/api/auctions/my_won.php').catch(() => ({ auctions: [] })),
            NB.apiGet('/api/favorites/list.php').catch(() => ({ auctions: [] }))
        ]).then(([sellingRes, wonRes, favRes]) => {
            const selling   = sellingRes.auctions || [];
            const past      = wonRes.auctions || [];
            const favorites = favRes.auctions || [];

            NB.Favorites?.seed(favorites.map(a => a.prd_id));

            const active = selling.filter(a => (a.prd_status || '').toLowerCase() === 'active');
            const sold   = selling.filter(a => (a.prd_status || '').toLowerCase() === 'sold');
            const total  = sold.reduce((s, a) =>
                s + Number(a.prd_current_price ?? a.prd_start_price ?? 0), 0);

            setText('stat-active', active.length);
            setText('stat-sold',   sold.length);
            setText('stat-total',  NB.formatCurrency(total));

            setText('tab-ativo',     `Leilões Ativos (${active.length})`);
            setText('tab-passado',   `Histórico (${past.length})`);
            setText('tab-favoritos', `Favoritos (${favorites.length})`);

            renderGrid('grid-ativo', active, 'Ainda não tens leilões ativos.');
            renderPast('grid-passado', past);
            renderFavorites(favorites);
        });
    }

    function renderFavorites(list) {
        const grid = document.getElementById('grid-favoritos');
        if (!grid) return;
        grid.innerHTML = '';
        if (!list.length) {
            grid.innerHTML = '<div class="cards-empty">Ainda não tens favoritos. Adiciona alguns na página de Leilões.</div>';
            return;
        }
        list.forEach(a => grid.appendChild(NB.createCard(a, { favoritable: true })));
    }

    function renderFavoritesIfLoaded() {
        NB.apiGet('/api/favorites/list.php').then(res => {
            const list = res?.auctions || [];
            NB.Favorites?.seed(list.map(a => a.prd_id));
            setText('tab-favoritos', `Favoritos (${list.length})`);
            renderFavorites(list);
        });
    }

    function renderGrid(id, list, emptyText) {
        const grid = document.getElementById(id);
        if (!grid) return;
        grid.innerHTML = '';
        if (!list.length) { grid.innerHTML = `<div class="cards-empty">${emptyText}</div>`; return; }
        list.forEach(a => grid.appendChild(NB.createCard(a)));
    }

    function renderPast(id, list) {
        const grid = document.getElementById(id);
        if (!grid) return;
        grid.innerHTML = '';
        if (!list.length) {
            grid.innerHTML = '<div class="cards-empty">Ainda não tens leilões passados.</div>';
            return;
        }
        const me = NB.getCurrentUser()?.id;
        list.forEach(a => {
            const result = a.prd_winner_usr_id && Number(a.prd_winner_usr_id) === Number(me) ? 'sold' : 'unsold';
            grid.appendChild(NB.createCard(a, { past: true, resultBadge: result }));
        });
    }

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function showLoginPrompt() {
        document.getElementById('auth-content').style.display = 'none';
        document.getElementById('login-prompt').style.display = '';
    }
})();
