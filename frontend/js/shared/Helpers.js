// Shared helpers (API, formatting, escaping)
window.NB = window.NB || {};
NB.BASE_URL = (function () {
    const { protocol, host, pathname } = window.location;
    const idx = pathname.indexOf('/frontend/');
    const root = idx >= 0 ? pathname.substring(0, idx) : '';
    return `${protocol}//${host}${root}/backend`;
})();

NB.formatCurrency = function (amount) {
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
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

NB.loadCategoriesInto = function (selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return Promise.resolve([]);
    return NB.apiGet('/api/categories/list.php').then(data => {
        (data.categories || []).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.cat_id;
            opt.textContent = c.cat_name;
            sel.appendChild(opt);
        });
        return data.categories || [];
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
