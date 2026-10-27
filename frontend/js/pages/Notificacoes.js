(function () {
    document.addEventListener('DOMContentLoaded', () => {
        NB.renderNavbar();
        NB.initTicker();

        const user = NB.getCurrentUser();
        if (!user) { showLoginPrompt(); return; }

        bindTabs();
        wireMarkAll();

        NB.Notifications.onChange(renderNotifications);
        NB.Notifications.fetchAll();
        NB.Favorites.onChange(() => { renderFavoritesTabLabel(); renderFavoritesGrid(); });
        NB.Favorites.load().then(renderFavoritesTabLabel).then(renderFavoritesGrid);

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
        document.getElementById('notif-toolbar').style.display =
            target === 'todas' ? '' : 'none';
    }

    function activateTabFromHash() {
        const hash = (window.location.hash || '').replace('#', '');
        if (hash && document.getElementById(`tab-${hash}`)) activateTab(hash);
    }

    function wireMarkAll() {
        document.getElementById('btn-mark-all').addEventListener('click', () => {
            NB.Notifications.markAllRead();
        });
    }

    function renderNotifications() {
        const { items, unread } = NB.Notifications.getState();
        const list = document.getElementById('notif-list');

        document.getElementById('tab-todas').textContent = `Todas (${items.length})`;
        document.getElementById('btn-mark-all').disabled = unread === 0;

        if (!items.length) {
            list.innerHTML = `
                <div class="notif-empty">
                    <div class="notif-empty__icon">🔔</div>
                    <p class="notif-empty__title">Sem notificações</p>
                    <p>Aqui aparecerão alertas sobre os teus leilões.</p>
                </div>`;
            return;
        }

        list.innerHTML = items.map(n => {
            const id = Number(n.not_id);
            const cls = Number(n.not_read) ? 'is-read' : 'is-unread';
            return `
                <article class="notif-row ${cls}" data-id="${id}">
                    <span class="notif-row__dot"></span>
                    <span class="notif-row__icon">${NB.iconForNotifType(n.not_type)}</span>
                    <div class="notif-row__body">
                        <p class="notif-row__text">${NB.escHtml(n.not_message)}</p>
                        <span class="notif-row__time">${NB.escHtml(NB.formatRelativeTime(n.not_created_at))}</span>
                    </div>
                    <div class="notif-row__actions">
                        ${Number(n.not_read) ? '' : `
                            <button class="notif-row__action" data-act="read" title="Marcar como lida" aria-label="Marcar como lida">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>`}
                        <button class="notif-row__action is-danger" data-act="delete" title="Apagar" aria-label="Apagar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                    </div>
                </article>`;
        }).join('');

        list.querySelectorAll('.notif-row').forEach(row => {
            const id = Number(row.dataset.id);
            row.querySelector('[data-act="read"]')?.addEventListener('click', e => {
                e.stopPropagation();
                NB.Notifications.markRead(id);
            });
            row.querySelector('[data-act="delete"]')?.addEventListener('click', e => {
                e.stopPropagation();
                NB.Notifications.remove(id);
            });
        });
    }

    function renderFavoritesTabLabel() {
        const count = NB.Favorites._cache.size;
        document.getElementById('tab-favoritos').textContent = `Favoritos (${count})`;
    }

    function renderFavoritesGrid() {
        const grid = document.getElementById('grid-favoritos');
        return NB.apiGet('/api/favorites/list.php').then(res => {
            const list = res?.auctions || [];
            NB.Favorites?.seed(list.map(a => a.prd_id));
            grid.innerHTML = '';
            if (!list.length) {
                grid.innerHTML = `<div class="cards-empty">Ainda não tens favoritos. Adiciona alguns na página de Leilões.</div>`;
                return;
            }
            list.forEach(a => grid.appendChild(NB.createCard(a, { favoritable: true })));
        }).catch(() => {
            grid.innerHTML = `<div class="cards-empty">Erro a carregar favoritos.</div>`;
        });
    }

    function showLoginPrompt() {
        document.getElementById('auth-content').style.display = 'none';
        document.getElementById('login-prompt').style.display = '';
    }
})();
