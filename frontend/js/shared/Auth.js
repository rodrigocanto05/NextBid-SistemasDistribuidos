// Auth helpers
window.NB = window.NB || {};

NB.getCurrentUser = function () {
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) return null;
        const token = localStorage.getItem('token');
        if (token) user.token = token;
        return user;
    } catch (e) {
        return null;
    }
};

// Termina a sessão também no servidor: o token fica revogado (lista no PostgreSQL) e deixa de
// ser aceite, mesmo que alguém o tenha copiado. keepalive: o pedido continua depois de a página
// mudar. Se falhar (sem rede), o token expira sozinho; a sessão local termina na mesma.
NB.logout = function () {
    const token = localStorage.getItem('token');
    if (token && NB.BASE_URL) {
        try {
            fetch(`${NB.BASE_URL}/api/auth/logout.php`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                keepalive: true,
            }).catch(() => {});
        } catch (_) { /* fetch indisponível: segue para o logout local */ }
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = NB._path('index.html');
};

NB.requireAuth = function (redirectUrl) {
    const user = NB.getCurrentUser();
    if (!user) {
        if (redirectUrl) window.location.href = redirectUrl;
        return null;
    }
    return user;
};

NB.defaultAvatarUrl = function () {
    const match = location.pathname.match(/\/html\/(.*)$/);
    const depth = match ? match[1].split('/').length - 1 : 0;
    return '../'.repeat(depth + 1) + 'img/avatar-placeholder.png';
};

// Builds an avatar URL from a DB-relative path (e.g. "uploads/avatars/x.jpg").
// Returns the placeholder when the path is empty.
NB.avatarSrc = function (path) {
    if (!path) return NB.defaultAvatarUrl();
    const s = String(path).trim();
    if (!s) return NB.defaultAvatarUrl();
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith('../') || s.startsWith('/')) return s;
    return `${NB.BASE_URL}/${s.replace(/^\/+/, '')}`;
};

// Resolves the avatar for a localStorage user object. Accepts either
// `user.avatar` (already-built absolute URL) or `user.photo` (DB path).
NB.avatarUrl = function (user) {
    if (user?.avatar) return user.avatar;
    if (user?.photo)  return NB.avatarSrc(user.photo);
    return NB.defaultAvatarUrl();
};

// Inline onerror handler that swaps a broken avatar img to the placeholder.
// Use in HTML strings: <img src="…" ${NB.avatarFallbackAttr()} />
NB.avatarFallbackAttr = function () {
    const ph = NB.defaultAvatarUrl().replace(/'/g, "\\'");
    return `onerror="this.onerror=null;this.src='${ph}'"`;
};
