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

NB.logout = function () {
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
