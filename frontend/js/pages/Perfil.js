// Two modes driven by ?user_id query param:
//   own profile (default): full edit/wallet/logout panel
//   viewing another user (?user_id=N): read-only, stats-only view
(function () {
    let viewMode = 'own'; // 'own' | 'view'
    let viewedId = 0;

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        NB.renderNavbar();

        const user = NB.requireAuth('../auth/Login.html');
        if (!user) return;

        const urlId = parseInt(new URLSearchParams(location.search).get('user_id') || '0', 10);
        if (urlId > 0 && urlId !== Number(user.id)) {
            viewMode = 'view';
            viewedId = urlId;
            applyViewModeChrome();
            loadProfile(urlId);
            return;
        }

        viewedId = Number(user.id);
        loadProfile(viewedId);
        loadBids();
        initAvatarUploader();
        initTabs();
        initUpdateForm(user);
        initLogout();
        initWallet();
        initEditTrigger();

        if (NB.NovoLeilao && typeof NB.NovoLeilao.init === 'function') {
            NB.NovoLeilao.init(() => loadProfile(viewedId));
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  View-mode chrome (hide everything that doesn't belong to a
    //  stranger looking at someone else's public profile)
    // ─────────────────────────────────────────────────────────────

    function applyViewModeChrome() {
        document.title = 'NextBid — Perfil';

        hide('pf-avatar-file');
        hide('pf-avatar-remove');
        hide('pf-edit-trigger');
        hide('pf-avatar-msg');

        const photoLabel = document.querySelector('label[for="pf-avatar-file"]');
        if (photoLabel) photoLabel.style.display = 'none';

        // Wallet + tabs + settings panel + bids list + FAB — none of that
        // is visible for other users. Only the hero + stats grid remain.
        hideSelector('.pf-wallet');
        hideSelector('.pf-tabs');
        hideSelector('#pf-panel-bids');
        hideSelector('#pf-panel-settings');
        hideSelector('.fab-stack');
        hideSelector('#modal-novo-leilao');

        // Add a "back" hint at the top of the wrapper
        const wrapper = document.querySelector('.pf-wrapper');
        if (wrapper && !document.getElementById('pf-back-link')) {
            const back = document.createElement('a');
            back.id = 'pf-back-link';
            back.className = 'la-back';
            back.href = 'javascript:history.back()';
            back.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Voltar`;
            wrapper.insertBefore(back, wrapper.firstChild);
        }
    }

    function hide(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }
    function hideSelector(sel) {
        document.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; });
    }

    // ─────────────────────────────────────────────────────────────
    //  Profile data
    // ─────────────────────────────────────────────────────────────

    async function loadProfile(userId) {
        try {
            const data = await NB.apiGet(`/api/user/profile.php?user_id=${userId}`);
            if (data.status !== 'success') return;
            const profileData = data.data;
            renderProfile(profileData);
            if (viewMode === 'own') prefillForm(profileData);
        } catch (err) {
            console.error('Erro ao carregar perfil:', err);
        }
    }

    function renderProfile(p) {
        setText('pf-name',         p.usr_name);
        setText('pf-location',     p.usr_location  || '—');
        setText('pf-created',      fmtDate(p.usr_created_at));
        setText('pf-bio',          p.usr_bio        || '');
        setText('pf-published',    p.total_published   ?? 0);
        setText('pf-licitacoes',   p.total_bids        ?? 0);
        setText('pf-won',          p.total_won         ?? 0);
        setText('pf-participated', p.total_participated ?? 0);

        const ratingNum   = p.avg_rating != null ? Number(p.avg_rating).toFixed(1) : '—';
        const ratingCount = Number(p.total_reviews || 0);
        setText('pf-rating-num',   ratingNum);
        setText('pf-rating-count', ratingCount ? `(${ratingCount})` : '');
        setText('pf-rating',       p.avg_rating != null ? Number(p.avg_rating).toFixed(1) + ' / 5' : '—');

        const bal = Number(p.usr_balance ?? 0);
        setText('pf-balance', bal.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

        // Only sync localStorage when looking at *our own* profile.
        if (viewMode === 'own') {
            const stored = NB.getCurrentUser();
            if (stored && Number(stored.wallet ?? -1) !== bal) {
                stored.wallet = bal;
                delete stored.token;
                localStorage.setItem('user', JSON.stringify(stored));
                NB.renderNavbar();
            }
        }

        renderXP(p.usr_xp ?? 0);
        renderAvatar(p.usr_photo);
        loadReviews(p.usr_id);
    }

    async function loadReviews(userId) {
        const list    = document.getElementById('pf-reviews-list');
        const loading = document.getElementById('pf-reviews-loading');
        const empty   = document.getElementById('pf-reviews-empty');
        const meta    = document.getElementById('pf-reviews-meta');
        if (!list) return;

        try {
            const res = await NB.apiGet(`/api/reviews/get_for_seller.php?seller_id=${userId}`);
            if (loading) loading.hidden = true;

            const reviews = (res && res.status === 'success') ? (res.reviews || []) : [];
            const avg     = res?.avg_rating ?? 0;
            const total   = res?.total ?? reviews.length;

            if (meta) meta.textContent = total ? ` · ${Number(avg).toFixed(1)} ★ (${total})` : '';

            if (!reviews.length) {
                if (empty) empty.hidden = false;
                list.innerHTML = '';
                return;
            }

            list.innerHTML = reviews.map(r => {
                const rating  = Math.max(0, Math.min(5, Number(r.rev_rating) || 0));
                const stars   = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                const when    = fmtDate(r.rev_created_at);
                const comment = r.rev_comment
                    ? `<p class="pf-review__comment">${NB.escHtml(r.rev_comment)}</p>`
                    : '';
                const product = r.product_name
                    ? `<a class="pf-review__product" href="leiloes/DetalheLeilao.html?id=${Number(r.product_id)}">${NB.escHtml(r.product_name)}</a>`
                    : '';
                const reviewerLink = r.reviewer_id
                    ? `<a class="pf-review__name" href="Perfil.html?user_id=${Number(r.reviewer_id)}">${NB.escHtml(r.reviewer_name)}</a>`
                    : `<span class="pf-review__name">${NB.escHtml(r.reviewer_name)}</span>`;
                return `
                    <li class="pf-review">
                        <div class="pf-review__head">
                            ${reviewerLink}
                            <span class="pf-review__stars">${stars}</span>
                        </div>
                        <div class="pf-review__meta">
                            <span class="pf-review__date">${when}</span>
                            ${product ? `<span class="pf-review__sep">·</span>${product}` : ''}
                        </div>
                        ${comment}
                    </li>`;
            }).join('');
        } catch {
            if (loading) loading.hidden = true;
            if (empty)   empty.hidden   = false;
            list.innerHTML = '';
        }
    }

    function renderXP(xp) {
        // Simple level formula: level = floor(sqrt(xp/100)) + 1
        const level    = Math.floor(Math.sqrt((xp || 0) / 100)) + 1;
        const xpForCur = Math.pow(level - 1, 2) * 100;
        const xpForNxt = Math.pow(level, 2) * 100;
        const progress = xpForNxt > xpForCur
            ? ((xp - xpForCur) / (xpForNxt - xpForCur)) * 100
            : 100;

        setText('pf-xp',    xp);
        setText('pf-level', level);
        setText('pf-xp-next', `${xp} / ${xpForNxt} XP`);

        const fill = document.getElementById('pf-xp-fill');
        if (fill) fill.style.width = Math.min(100, progress).toFixed(1) + '%';
    }

    // ─────────────────────────────────────────────────────────────
    //  Avatar
    // ─────────────────────────────────────────────────────────────

    function renderAvatar(photoPath) {
        const img = document.getElementById('pf-avatar-img');
        if (!img) return;

        // Always fall back to the static placeholder if the URL fails.
        const placeholder = NB.defaultAvatarUrl();
        img.onerror = () => {
            img.onerror = null;
            img.src = placeholder;
        };

        if (photoPath) {
            const clean = String(photoPath).replace(/^\/+/, '');
            img.src = clean.startsWith('http') ? clean : `${NB.BASE_URL}/${clean}`;
            return;
        }

        // No photo for this user. When we're viewing *another* user we MUST
        // show the placeholder — never the logged-in user's avatar.
        if (viewMode === 'view') {
            img.src = placeholder;
            return;
        }

        const u = NB.getCurrentUser();
        img.src = NB.avatarUrl(u);
    }

    function initAvatarUploader() {
        const fileEl  = document.getElementById('pf-avatar-file');
        const rmBtn   = document.getElementById('pf-avatar-remove');
        const msgEl   = document.getElementById('pf-avatar-msg');
        const user    = NB.getCurrentUser();

        if (!fileEl || !user) return;

        fileEl.addEventListener('change', async () => {
            const file = fileEl.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                setMsg(msgEl, 'Imagem demasiado grande (máx 2 MB).', 'var(--danger)');
                fileEl.value = '';
                return;
            }

            const fd = new FormData();
            fd.append('photo', file);

            try {
                const res = await NB.apiPost('/api/user/update_photo.php', fd, { auth: true });
                if (res.status === 'success') {
                    setMsg(msgEl, 'Foto atualizada!', 'var(--success)');
                    const stored = NB.getCurrentUser();
                    // The API returns the saved path under `photo` (older code
                    // expected `photo_url`, which silently dropped the update).
                    const newPath = res.photo || res.photo_url;
                    if (stored && newPath) {
                        stored.avatar = `${NB.BASE_URL}/${String(newPath).replace(/^\/+/, '')}`;
                        localStorage.setItem('user', JSON.stringify(stored));
                    }
                    NB.renderNavbar();
                    loadProfile(user.id);
                } else {
                    setMsg(msgEl, res.message || 'Erro ao atualizar foto.', 'var(--danger)');
                }
            } catch {
                setMsg(msgEl, 'Erro de rede.', 'var(--danger)');
            }
            fileEl.value = '';
        });

        rmBtn?.addEventListener('click', async () => {
            setMsg(msgEl, 'A remover…', 'var(--text-muted)');
            try {
                const res = await NB.apiPost('/api/user/delete_photo.php', {}, { auth: true });
                if (res.status !== 'success') {
                    setMsg(msgEl, res.message || 'Erro ao remover foto.', 'var(--danger)');
                    return;
                }
                const stored = NB.getCurrentUser();
                if (stored) {
                    delete stored.avatar;
                    delete stored.photo;
                    localStorage.setItem('user', JSON.stringify(stored));
                }
                NB.renderNavbar();
                renderAvatar(null);
                setMsg(msgEl, 'Foto removida.', 'var(--success)');
            } catch {
                setMsg(msgEl, 'Erro de rede.', 'var(--danger)');
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Bids
    // ─────────────────────────────────────────────────────────────

    async function loadBids() {
        const loadingEl = document.getElementById('pf-bids-loading');
        const emptyEl   = document.getElementById('pf-bids-empty');
        const errorEl   = document.getElementById('pf-bids-error');
        const listEl    = document.getElementById('pf-bids-list');

        try {
            const data = await NB.apiGet('/api/bids/my_bids.php?limit=50');

            if (loadingEl) loadingEl.hidden = true;

            if (data.status !== 'success') {
                if (errorEl) { errorEl.textContent = data.message || 'Erro ao carregar licitações.'; errorEl.hidden = false; }
                return;
            }

            const bids = data.bids || [];
            if (!bids.length) { if (emptyEl) emptyEl.hidden = false; return; }

            listEl.innerHTML = '';
            bids.forEach(b => {
                const li      = document.createElement('li');
                li.className  = 'pf-bid-item';
                const winning = !!b.is_winning;
                const amount  = Number(b.bid_amount  || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 });
                const highest = Number(b.current_highest || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 });
                const prdId   = parseInt(b.prd_id, 10) || 0;
                const badgeCls = winning ? 'pf-bid-badge pf-bid-badge--winning' : 'pf-bid-badge pf-bid-badge--covered';
                const badgeTxt = winning ? 'A vencer' : 'Coberto';

                li.innerHTML = `
                    <div class="pf-bid-item__info">
                        <p class="pf-bid-item__name">${NB.escHtml(b.prd_name || 'Leilão')}</p>
                        <p class="pf-bid-item__detail">
                            A minha oferta: <strong>${amount}€</strong> ·
                            Atual: ${highest}€ ·
                            <small>${NB.escHtml(b.prd_status || '')}</small>
                        </p>
                        <p class="pf-bid-item__date">${fmtDateTime(b.bid_created_at)}</p>
                    </div>
                    <div class="pf-bid-item__right">
                        <span class="${badgeCls}">${badgeTxt}</span>
                        ${prdId ? `<a class="btn btn--ghost btn--sm" href="leiloes/DetalheLeilao.html?id=${prdId}">Ver leilão</a>` : ''}
                    </div>`;
                listEl.appendChild(li);
            });
        } catch (err) {
            if (loadingEl) loadingEl.hidden = true;
            if (errorEl)   { errorEl.textContent = 'Erro de rede.'; errorEl.hidden = false; }
            console.error(err);
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Update form
    // ─────────────────────────────────────────────────────────────

    function prefillForm(p) {
        setVal('pf-edit-name',     p.usr_name     || '');
        setVal('pf-edit-email',    p.usr_email    || '');
        setVal('pf-edit-location', p.usr_location || '');
        setVal('pf-edit-bio',      p.usr_bio      || '');
    }

    function initUpdateForm(user) {
        const form  = document.getElementById('pf-form-update');
        const msgEl = document.getElementById('pf-update-msg');
        if (!form) return;

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const payload = { user_id: user.id };
            const name     = getVal('pf-edit-name');
            const email    = getVal('pf-edit-email');
            const password = getVal('pf-edit-password');
            const location = getVal('pf-edit-location');
            const bio      = getVal('pf-edit-bio');

            if (name)     payload.name     = name;
            if (email)    payload.email    = email;
            if (password) payload.password = password;
            if (location) payload.location = location;
            if (bio)      payload.bio      = bio;

            setMsg(msgEl, 'A guardar…', 'var(--text-muted)');

            try {
                const res = await NB.apiPost('/api/user/update_profile.php', payload, { auth: true });
                if (res.status === 'success') {
                    setMsg(msgEl, 'Perfil atualizado!', 'var(--success)');
                    setVal('pf-edit-password', '');
                    const stored = NB.getCurrentUser();
                    if (stored) {
                        if (name)  stored.name  = name;
                        if (email) stored.email = email;
                        localStorage.setItem('user', JSON.stringify(stored));
                    }
                    loadProfile(user.id);
                } else {
                    setMsg(msgEl, res.message || 'Erro ao atualizar.', 'var(--danger)');
                }
            } catch {
                setMsg(msgEl, 'Erro de rede.', 'var(--danger)');
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Tabs
    // ─────────────────────────────────────────────────────────────

    function initTabs() {
        const tabs = document.querySelectorAll('.pf-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('pf-tab--active'));
                tab.classList.add('pf-tab--active');

                const target = tab.dataset.tab;
                document.querySelectorAll('.pf-panel').forEach(p => { p.hidden = true; });
                const panel = document.getElementById(`pf-panel-${target}`);
                if (panel) panel.hidden = false;
            });
        });
    }

    function initEditTrigger() {
        document.getElementById('pf-edit-trigger')?.addEventListener('click', () => {
            document.querySelectorAll('.pf-tab').forEach(t => {
                const active = t.dataset.tab === 'settings';
                t.classList.toggle('pf-tab--active', active);
            });
            document.querySelectorAll('.pf-panel').forEach(p => { p.hidden = true; });
            const panel = document.getElementById('pf-panel-settings');
            if (panel) { panel.hidden = false; panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Wallet + logout
    // ─────────────────────────────────────────────────────────────

    function initWallet() {
        document.getElementById('pf-add-funds')?.addEventListener('click', () => {
            if (typeof NB.openWalletModal === 'function') NB.openWalletModal();
        });
    }

    function initLogout() {
        document.getElementById('pf-logout-btn')?.addEventListener('click', () => {
            NB.confirmLogout();
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Utilities
    // ─────────────────────────────────────────────────────────────

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? '—';
    }
    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    }
    function getVal(id) {
        return (document.getElementById(id)?.value || '').trim();
    }
    function setMsg(el, text, color) {
        if (!el) return;
        el.textContent = text;
        el.style.color = color || '';
    }
    function fmtDate(dt) {
        if (!dt) return '—';
        const d = new Date(String(dt).replace(' ', 'T'));
        return isNaN(d) ? dt : d.toLocaleDateString('pt-PT');
    }
    function fmtDateTime(dt) {
        if (!dt) return '—';
        const d = new Date(String(dt).replace(' ', 'T'));
        return isNaN(d) ? dt : d.toLocaleString('pt-PT');
    }
})();
