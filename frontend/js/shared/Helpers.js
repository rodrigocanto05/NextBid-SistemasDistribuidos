// Shared helpers (API, formatting, escaping)
window.NB = window.NB || {};
NB.BASE_URL = (function () {
    const { protocol, host, pathname } = window.location;
    const idx = pathname.indexOf('/frontend/');
    const root = idx >= 0 ? pathname.substring(0, idx) : '';
    return `${protocol}//${host}${root}/backend`;
})();

// Moeda: créditos de faculdade (inteiros).
NB.formatCurrency = function (amount) {
    const n = Math.round(Number(amount) || 0);
    return `${n.toLocaleString('pt-PT')} ${n === 1 ? 'crédito' : 'créditos'}`;
};

NB.typeLabel = function (type) {
    return type === 'service' ? 'Serviço' : 'Produto';
};

NB.conditionLabel = function (condition) {
    return { 'new': 'Novo', 'like new': 'Como novo', 'good': 'Bom estado', 'used': 'Usado' }[condition] || condition || '—';
};

NB.escHtml = function (str) {
    return String(str || '').replace(/[&<>"']/g, c => (
        { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
    ));
};

NB.apiGet = async function (path) {
    const headers = {};
    const token = (NB.getCurrentUser && NB.getCurrentUser()?.token);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${NB.BASE_URL}${path}`, { headers });
    return res.json();
};

// GET com cópia local: guarda a última resposta boa e, se a API ou a BD não responderem
// (erro de rede ou 5xx), devolve essa cópia e mostra um aviso. Erros 4xx não usam a cópia.
NB.apiGetCached = async function (path) {
    const key = `nb_cache:${path}`;
    const headers = {};
    const token = (NB.getCurrentUser && NB.getCurrentUser()?.token);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
        const res = await fetch(`${NB.BASE_URL}${path}`, { headers });
        if (res.status < 500) {
            const data = await res.json();
            if (data && data.status === 'success') {
                try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), data })); } catch (_) {}
            }
            return data;
        }
    } catch (_) { /* sem rede ou resposta inválida */ }
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
    if (cached && cached.data) {
        NB.showCachedNotice(cached.t);
        return cached.data;
    }
    throw new Error('Serviço indisponível');
};

NB.showCachedNotice = function (ts) {
    if (document.getElementById('nb-cached-notice')) return;
    const el = document.createElement('div');
    el.id = 'nb-cached-notice';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:3000;background:#7a5b00;'
        + 'color:#fff;text-align:center;padding:8px 12px;font-size:.85rem';
    const hora = new Date(ts).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    el.textContent = `Sem ligação ao servidor. A mostrar os dados guardados às ${hora}.`;
    document.body.prepend(el);
};

NB.apiPost = async function (path, body, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (opts.auth && NB.getCurrentUser()?.token) {
        headers['Authorization'] = `Bearer ${NB.getCurrentUser().token}`;
    }
    const isFormData = body instanceof FormData;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${NB.BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: isFormData ? body : JSON.stringify(body)
    });
    return res.json();
};

// type 'product' | 'service' filtra; sem type agrupa em Produtos / Serviços.
NB.loadCategoriesInto = function (selectId, type) {
    const sel = document.getElementById(selectId);
    if (!sel) return Promise.resolve([]);
    return NB.apiGet('/api/categories/list.php').then(data => {
        const cats = data.categories || [];
        NB.fillCategorySelect(sel, cats, type);
        return cats;
    });
};

NB.fillCategorySelect = function (sel, cats, type) {
    const groups = type ? [[type, null]] : [['product', 'Produtos'], ['service', 'Serviços']];
    groups.forEach(([t, label]) => {
        const list = cats.filter(c => (c.cat_type || 'product') === t);
        if (!list.length) return;
        let parent = sel;
        if (label) {
            parent = document.createElement('optgroup');
            parent.label = label;
            sel.appendChild(parent);
        }
        list.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.cat_id;
            opt.textContent = c.cat_name;
            parent.appendChild(opt);
        });
    });
};

NB.iconForNotifType = function (type) {
    switch (type) {
        case 'bid_outbid':              return '⚠';
        case 'auction_won':             return '🏆';
        case 'auction_sold':            return '💰';
        case 'auction_payment_failed':  return '✕';
        case 'favorite_bid':            return '🔔';
        case 'favorite_ending':         return '⏰';
        default:                        return '✦';
    }
};

NB.formatRelativeTime = function (isoLike) {
    if (!isoLike) return '';
    const t = new Date(String(isoLike).replace(' ', 'T')).getTime();
    if (Number.isNaN(t)) return '';
    const diff = Math.max(0, Date.now() - t);
    const min  = Math.floor(diff / 60000);
    if (min < 1)    return 'agora mesmo';
    if (min < 60)   return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)     return `há ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7)      return `há ${d}d`;
    return new Date(t).toLocaleDateString('pt-PT');
};
