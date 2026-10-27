window.NB = window.NB || {};

NB.Favorites = (function () {
    const cache = new Set();
    let loaded = false;
    let loadingPromise = null;
    const listeners = new Set();

    function emit() { listeners.forEach(fn => fn(cache)); }

    function load(force = false) {
        if (loaded && !force) return Promise.resolve(cache);
        if (loadingPromise) return loadingPromise;
        const user = NB.getCurrentUser();
        if (!user) { loaded = true; return Promise.resolve(cache); }

        loadingPromise = NB.apiGet('/api/favorites/ids.php')
            .then(res => {
                cache.clear();
                (res?.ids || []).forEach(id => cache.add(Number(id)));
                loaded = true;
                emit();
                return cache;
            })
            .catch(() => cache)
            .finally(() => { loadingPromise = null; });
        return loadingPromise;
    }

    function isFavorited(productId) {
        return cache.has(Number(productId));
    }

    function seed(ids) {
        cache.clear();
        (ids || []).forEach(id => cache.add(Number(id)));
        loaded = true;
    }

    function toggle(productId) {
        const id = Number(productId);
        const optimistic = !cache.has(id);
        if (optimistic) cache.add(id); else cache.delete(id);
        emit();

        return NB.apiPost('/api/favorites/toggle.php', { product_id: id }, { auth: true })
            .then(res => {
                if (res?.status !== 'success') throw new Error(res?.message || 'Erro');
                if (res.favorited) cache.add(id); else cache.delete(id);
                emit();
                return res.favorited;
            })
            .catch(err => {
                if (optimistic) cache.delete(id); else cache.add(id);
                emit();
                throw err;
            });
    }

    function onChange(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    return { load, seed, isFavorited, toggle, onChange, _cache: cache };
})();

NB._favHeartSvg = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`;

NB.createFavoriteButton = function (productId) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fav-btn';
    btn.setAttribute('aria-label', 'Adicionar aos favoritos');
    btn.dataset.productId = String(productId);
    btn.innerHTML = NB._favHeartSvg;

    const sync = () => {
        const on = NB.Favorites.isFavorited(productId);
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', on ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
        btn.setAttribute('title', on ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    };
    sync();

    btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (!NB.getCurrentUser()) {
            window.location.href = NB._authPath('login');
            return;
        }
        btn.disabled = true;
        btn.classList.add('is-pulsing');
        setTimeout(() => btn.classList.remove('is-pulsing'), 450);
        NB.Favorites.toggle(productId)
            .catch(() => {})
            .finally(() => { btn.disabled = false; sync(); });
    });

    const unsubscribe = NB.Favorites.onChange(sync);
    btn.addEventListener('DOMNodeRemovedFromDocument', unsubscribe);

    return btn;
};
