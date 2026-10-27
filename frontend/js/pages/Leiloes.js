// Todos os Leilões page wire-up
(function () {
    let allAuctions = [];
    let getFilters;

    document.addEventListener('DOMContentLoaded', () => {
        NB.renderNavbar();
        NB.initTicker();
        NB.loadCategoriesInto('filter-category');
        getFilters = NB.initFilterBar(apply);
        NB.NovoLeilao.init(loadAuctions);
        NB.Favorites?.load();

        loadAuctions();
        maybeAutoOpenNovo();
    });

    // Auto-open "Criar Leilão" modal when arriving from the homepage discover tile.
    // Triple-redundant detection: sessionStorage flag, ?action=novo query, or #novo hash.
    function maybeAutoOpenNovo() {
        let shouldOpen = false;
        try {
            if (sessionStorage.getItem('nb_open_novo') === '1') {
                sessionStorage.removeItem('nb_open_novo');
                shouldOpen = true;
            }
        } catch (_) {}

        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'novo') shouldOpen = true;
        if (window.location.hash === '#novo') shouldOpen = true;

        if (!shouldOpen) return;

        // Defer one tick so all NB.NovoLeilao.* methods are guaranteed bound.
        setTimeout(() => {
            if (typeof NB.NovoLeilao?.openModal === 'function') {
                NB.NovoLeilao.openModal();
            }
            // Clean up the URL so a refresh won't re-open the modal
            history.replaceState(null, '', window.location.pathname);
        }, 0);
    }

    function loadAuctions() {
        NB.apiGet('/api/auctions/get_active.php')
            .then(data => {
                allAuctions = data.auctions || [];
                apply();
            })
            .catch(() => {
                const el = document.getElementById('cards-loading');
                if (el) el.innerHTML = '<p>Erro ao carregar leilões.</p>';
            });
    }

    function apply() {
        const filtered = NB.filterAuctions(allAuctions, getFilters());
        NB.renderGrid('leiloes-container', filtered, { favoritable: true });
    }

})();
