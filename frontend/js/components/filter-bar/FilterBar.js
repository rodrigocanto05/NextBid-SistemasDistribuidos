// Search + category filter wired to a list of auctions
window.NB = window.NB || {};

NB.initFilterBar = function (onFilter) {
    const search = document.getElementById('search-input');
    const cat    = document.getElementById('filter-category');

    if (search) search.addEventListener('input', () => onFilter(getFilters()));
    if (cat)    cat.addEventListener('change', () => onFilter(getFilters()));

    function getFilters() {
        return {
            q:   (search?.value || '').toLowerCase().trim(),
            cat: cat?.value || ''
        };
    }

    return getFilters;
};

NB.filterAuctions = function (list, filters) {
    return list.filter(a => {
        const matchQ   = !filters.q || (a.prd_name || '').toLowerCase().includes(filters.q);
        const matchCat = !filters.cat || String(a.prd_cat_id) === String(filters.cat);
        return matchQ && matchCat;
    });
};

NB.renderGrid = function (containerId, list, opts = {}) {
    const el = document.getElementById(containerId);
    const count = document.getElementById('results-count');
    if (!el) return;

    el.querySelectorAll('.auction-card, .cards-empty, .cards-loading').forEach(n => n.remove());

    if (count) {
        count.textContent = list.length === 1
            ? '1 leilão encontrado'
            : `${list.length} leilões encontrados`;
    }

    if (!list.length) {
        const empty = document.createElement('div');
        empty.className = 'cards-empty';
        empty.textContent = opts.emptyText || 'Nenhum leilão encontrado.';
        el.appendChild(empty);
        return;
    }

    list.forEach(a => el.appendChild(NB.createCard(a, opts)));
};
