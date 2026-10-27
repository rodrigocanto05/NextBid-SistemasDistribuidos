window.NB = window.NB || {};

NB.Notifications = (function () {
    const POLL_MS = 30000;
    let state = { unread: 0, items: [], loadedAt: 0 };
    let pollTimer = null;
    const listeners = new Set();

    function emit() { listeners.forEach(fn => fn(state)); }

    function fetchAll() {
        const user = NB.getCurrentUser();
        if (!user) return Promise.resolve(state);
        return NB.apiGet('/api/user/get_all_notifications.php?limit=50')
            .then(res => {
                if (res?.status !== 'success') return state;
                state = {
                    unread:   Number(res.unread_count || 0),
                    items:    res.notifications || [],
                    loadedAt: Date.now()
                };
                emit();
                return state;
            })
            .catch(() => state);
    }

    function markRead(id) {
        return NB.apiPost('/api/user/mark_notif_read.php', { notificationId: id }, { auth: true })
            .then(res => {
                if (res?.status === 'success') {
                    state.items = state.items.map(n =>
                        Number(n.not_id) === Number(id) ? { ...n, not_read: 1 } : n
                    );
                    state.unread = Math.max(0, state.unread - 1);
                    emit();
                }
                return res;
            });
    }

    function markAllRead() {
        return NB.apiPost('/api/user/mark_all_read.php', {}, { auth: true })
            .then(res => {
                if (res?.status === 'success') {
                    state.items = state.items.map(n => ({ ...n, not_read: 1 }));
                    state.unread = 0;
                    emit();
                }
                return res;
            });
    }

    function remove(id) {
        return NB.apiPost('/api/user/delete_notification.php', { notificationId: id }, { auth: true })
            .then(res => {
                if (res?.status === 'success') {
                    const target = state.items.find(n => Number(n.not_id) === Number(id));
                    state.items = state.items.filter(n => Number(n.not_id) !== Number(id));
                    if (target && !Number(target.not_read)) {
                        state.unread = Math.max(0, state.unread - 1);
                    }
                    emit();
                }
                return res;
            });
    }

    function onChange(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    function startPolling() {
        if (pollTimer) return;
        fetchAll();
        pollTimer = setInterval(fetchAll, POLL_MS);
    }

    function stopPolling() {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    return {
        fetchAll, markRead, markAllRead, remove, onChange,
        startPolling, stopPolling,
        getState: () => state
    };
})();

NB.mountNotificationBell = function () {
    const slot = document.getElementById('nb-bell-slot');
    if (!slot) return;

    slot.innerHTML = `
        <div class="dropdown-wrap" id="nb-bell-wrap">
            <button class="notif-bell" id="nb-bell" aria-label="Notificações" title="Notificações">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                <span class="notif-bell__badge" id="nb-bell-badge">0</span>
            </button>
            <div class="notif-popover" id="nb-bell-popover" role="dialog" aria-label="Notificações recentes">
                <div class="notif-popover__head">
                    <span class="notif-popover__title">Notificações</span>
                    <button class="notif-popover__mark" id="nb-bell-mark" disabled>Marcar todas</button>
                </div>
                <div class="notif-popover__list" id="nb-bell-list">
                    <div class="notif-popover__empty">A carregar…</div>
                </div>
                <div class="notif-popover__foot">
                    <a href="${NB._path('Notificacoes.html')}" class="notif-popover__see-all">Ver todas →</a>
                </div>
            </div>
        </div>`;

    const bell      = document.getElementById('nb-bell');
    const popover   = document.getElementById('nb-bell-popover');
    const badge     = document.getElementById('nb-bell-badge');
    const list      = document.getElementById('nb-bell-list');
    const markAllBtn = document.getElementById('nb-bell-mark');

    bell.addEventListener('click', e => {
        e.stopPropagation();
        const willOpen = !popover.classList.contains('open');
        popover.classList.toggle('open', willOpen);
        if (willOpen) {
            document.dispatchEvent(new CustomEvent('nb:popover-open', { detail: 'notifications' }));
        }
    });
    document.addEventListener('click', e => {
        if (!popover.contains(e.target) && !bell.contains(e.target)) {
            popover.classList.remove('open');
        }
    });
    document.addEventListener('nb:popover-open', e => {
        if (e.detail !== 'notifications') popover.classList.remove('open');
    });

    markAllBtn.addEventListener('click', () => {
        markAllBtn.disabled = true;
        NB.Notifications.markAllRead().finally(() => render());
    });

    NB.Notifications.onChange(render);
    NB.Notifications.startPolling();
    render();

    function render() {
        const { unread, items } = NB.Notifications.getState();
        badge.textContent = unread > 9 ? '9+' : String(unread);
        badge.classList.toggle('is-visible', unread > 0);
        markAllBtn.disabled = unread === 0;

        if (!items.length) {
            list.innerHTML = `<div class="notif-popover__empty">Sem notificações ainda.</div>`;
            return;
        }
        const preview = items.slice(0, 5);
        list.innerHTML = preview.map(n => {
            const unreadCls = Number(n.not_read) ? 'is-read' : 'is-unread';
            return `
                <div class="notif-item ${unreadCls}" data-id="${Number(n.not_id)}">
                    <span class="notif-item__icon">${NB.iconForNotifType(n.not_type)}</span>
                    <div class="notif-item__body">
                        <p class="notif-item__text">${NB.escHtml(n.not_message)}</p>
                        <span class="notif-item__time">${NB.escHtml(NB.formatRelativeTime(n.not_created_at))}</span>
                    </div>
                </div>`;
        }).join('');

        list.querySelectorAll('.notif-item.is-unread').forEach(el => {
            el.addEventListener('click', () => {
                NB.Notifications.markRead(Number(el.dataset.id));
            });
        });
    }
};
