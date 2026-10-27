// Auction detail page — chat via polling
(function () {
    const BIDS_REFRESH_MS = 8000;
    const CHAT_POLL_MS    = 2500;

    let productId   = 0;
    let auction     = null;
    let currentUser = null;
    let bidsTimer   = null;
    let chatTimer   = null;
    let lastChatId  = 0;
    let chatMsgCount = 0;

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        NB.renderNavbar();
        currentUser = NB.getCurrentUser();

        productId = parseInt(new URLSearchParams(location.search).get('id') || '0', 10);
        if (!productId) { showError('ID de leilão em falta na URL.'); return; }

        loadAuction();
        loadBids();
        startChatPolling();

        bidsTimer = setInterval(loadBids, BIDS_REFRESH_MS);

        wireBidForm();
        wireChatForm();
        wireDelete();
        wireAddFunds();
        wireChatTextarea();
        wireRateModal();
        renderChatUI();
    }

    // ─────────────────────────────────────────────────────────────
    //  Auction
    // ─────────────────────────────────────────────────────────────

    async function loadAuction() {
        try {
            const data = await NB.apiGet(`/api/auctions/get_by_id.php?product_id=${productId}`);
            if (data.status !== 'success' || !data.data) {
                showError(data.message || 'Leilão não encontrado.');
                return;
            }
            auction = data.data;
            renderAuction();
        } catch {
            showError('Erro de rede ao carregar o leilão.');
        }
    }

    function renderAuction() {
        document.getElementById('la-loading').hidden = true;
        document.getElementById('la-content').hidden = false;

        document.title = `NextBid — ${auction.prd_name}`;

        setText('la-title',       auction.prd_name);
        setText('la-category',    auction.cat_name);
        setText('la-condition',   auction.prd_condition);
        setText('la-location',    auction.prd_location || '—');
        setText('la-description', auction.prd_description);
        setText('la-start-price', NB.formatCurrency(auction.prd_start_price));
        setText('la-ends-at',     'Termina: ' + formatDate(auction.prd_ends_at));

        const currentBid = auction.current_bid || auction.prd_start_price;
        setText('la-current-bid', NB.formatCurrency(currentBid));
        setText('la-bid-count',   auction.bid_count || 0);

        renderStatusBadge(auction.prd_status);
        renderImages(auction.images || []);
        renderAttributes(auction.attributes || []);
        renderSeller();
        startCountdown();
        configureBidSection(currentBid);
        configureOwnerSection();
        updateBalanceDisplay();
        mountFavoriteButton();
    }

    function mountFavoriteButton() {
        const host = document.querySelector('.la-gallery__main');
        if (!host || !NB.getCurrentUser() || typeof NB.createFavoriteButton !== 'function') return;
        host.querySelector('.fav-btn')?.remove();
        NB.Favorites.load().then(() => {
            host.appendChild(NB.createFavoriteButton(auction.prd_id));
        });
    }

    function renderStatusBadge(status) {
        const el = document.getElementById('la-status-badge');
        if (!el) return;
        const map = {
            active:    ['la-badge--active',  'Ativo'],
            ended:     ['la-badge--ended',   'Terminado'],
            cancelled: ['la-badge--ended',   'Cancelado'],
            pending:   ['la-badge--pending', 'Pendente'],
        };
        const [cls, label] = map[status] || ['la-badge--pending', status];
        el.className = `la-badge ${cls}`;
        el.textContent = label;
    }

    function renderImages(images) {
        const main   = document.getElementById('la-main-image');
        const thumbs = document.getElementById('la-thumbs');
        thumbs.innerHTML = '';

        if (!images.length) {
            main.src = '';
            main.alt = 'Sem imagem';
            return;
        }

        const primary = images.find(i => i.img_is_primary) || images[0];
        main.src = buildImgUrl(primary.img_path);
        main.alt = auction.prd_name;

        images.forEach((img, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'la-gallery__thumb' + (idx === 0 ? ' la-gallery__thumb--active' : '');
            const t = document.createElement('img');
            t.src = buildImgUrl(img.img_path);
            t.alt = `Imagem ${idx + 1}`;
            t.loading = 'lazy';
            wrap.appendChild(t);
            wrap.addEventListener('click', () => {
                main.src = t.src;
                thumbs.querySelectorAll('.la-gallery__thumb').forEach(w => w.classList.remove('la-gallery__thumb--active'));
                wrap.classList.add('la-gallery__thumb--active');
            });
            thumbs.appendChild(wrap);
        });
    }

    function renderAttributes(attrs) {
        const section = document.getElementById('la-attributes-section');
        const tbody   = document.getElementById('la-attributes');
        tbody.innerHTML = '';
        if (!attrs.length) { section.hidden = true; return; }
        section.hidden = false;
        attrs.forEach(a => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${NB.escHtml(a.atr_name)}</td><td>${NB.escHtml(a.atr_value)}</td>`;
            tbody.appendChild(tr);
        });
    }

    function renderSeller() {
        const photo = document.getElementById('la-seller-photo');
        photo.onerror = () => { photo.onerror = null; photo.src = NB.defaultAvatarUrl(); };
        photo.src = NB.avatarSrc(auction.seller_photo);
        setText('la-seller-name', auction.seller_name || '—');
        const rating = auction.seller_rating ? Number(auction.seller_rating).toFixed(1) : '—';
        setText('la-seller-rating',  rating);
        setText('la-seller-reviews', auction.seller_reviews || 0);

        // Link the whole card to the seller's public profile (read-only view).
        const link = document.getElementById('la-seller-link');
        if (link && auction.seller_id) {
            link.href = `../Perfil.html?user_id=${encodeURIComponent(auction.seller_id)}`;
        }
    }

    function startCountdown() {
        const el = document.getElementById('la-countdown');
        if (auction.prd_status !== 'active') {
            el.textContent = auction.prd_status === 'ended' ? 'Terminado' : 'Não ativo';
            return;
        }
        NB.iniciarCronometro(auction.prd_ends_at, el);
    }

    // ─────────────────────────────────────────────────────────────
    //  Bid form
    // ─────────────────────────────────────────────────────────────

    function configureBidSection(currentBid) {
        const form     = document.getElementById('la-bid-form');
        const authMsg  = document.getElementById('la-bid-required-auth');
        const ownerMsg = document.getElementById('la-bid-owner-msg');
        const endedMsg = document.getElementById('la-bid-ended-msg');

        form.hidden = authMsg.hidden = ownerMsg.hidden = endedMsg.hidden = true;

        if (auction.prd_status !== 'active') { endedMsg.hidden = false; return; }
        if (!currentUser)                     { authMsg.hidden  = false; return; }
        if (Number(auction.seller_id) === Number(currentUser.id)) {
            ownerMsg.hidden = false;
            return;
        }

        form.hidden = false;
        const minBid = Number(currentBid) + 1;
        setText('la-min-bid', NB.formatCurrency(minBid));
        const input = document.getElementById('la-bid-amount');
        input.min   = minBid;
        input.value = minBid;
        input.dataset.base = String(currentBid);
    }

    function updateBalanceDisplay() {
        const u   = NB.getCurrentUser();
        const bal = Number(u?.wallet ?? u?.usr_balance ?? 0);
        const fmt = NB.formatCurrency(bal);
        setText('la-user-balance',      fmt);
        setText('la-user-balance-stat', fmt);
    }

    function wireBidForm() {
        document.getElementById('la-bid-form').addEventListener('submit', handleBidSubmit);
        document.querySelectorAll('.la-bid-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('la-bid-amount');
                const base  = Number(input.dataset.base || 0);
                input.value = base + Number(btn.dataset.delta || 0);
            });
        });
    }

    async function handleBidSubmit(e) {
        e.preventDefault();
        const msgEl  = document.getElementById('la-bid-msg');
        const amount = Number(document.getElementById('la-bid-amount').value);

        msgEl.innerHTML = '';
        setFeedback(msgEl, 'A enviar licitação…', 'var(--text-muted)');

        if (!amount || amount <= 0) { setFeedback(msgEl, 'Valor inválido.', 'var(--danger)'); return; }

        const cachedBalance = Number(NB.getCurrentUser()?.wallet ?? 0);
        if (cachedBalance < amount) {
            renderInsufficientFunds(msgEl, cachedBalance, amount);
            return;
        }

        try {
            const res = await NB.apiPost('/api/bids/place.php', { product_id: productId, amount }, { auth: true });
            if (res.status === 'success') {
                setFeedback(msgEl, res.message || 'Licitação aceite!', 'var(--success)');

                if (typeof res.new_balance === 'number') {
                    syncBalance(res.new_balance);
                }

                await loadAuction();
                await loadBids();
                pollChat();
            } else if (res.code === 'insufficient_funds') {
                renderInsufficientFunds(msgEl, Number(res.balance ?? 0), Number(res.required ?? amount));
            } else {
                setFeedback(msgEl, res.message || 'Licitação rejeitada.', 'var(--danger)');
            }
        } catch {
            setFeedback(msgEl, 'Erro de rede.', 'var(--danger)');
        }
    }

    function syncBalance(newBal) {
        const u = NB.getCurrentUser();
        if (u) {
            u.wallet = newBal;
            delete u.token;
            localStorage.setItem('user', JSON.stringify(u));
        }
        const fmt = NB.formatCurrency(newBal);
        setText('la-user-balance',      fmt);
        setText('la-user-balance-stat', fmt);
        const navBal = document.querySelector('.user-card__balance');
        if (navBal) navBal.textContent = `💳 ${newBal.toLocaleString('pt-PT')}€`;
    }

    function renderInsufficientFunds(msgEl, balance, required) {
        const missing = Math.max(0, required - balance);
        msgEl.innerHTML = `
            <span style="color:var(--danger);display:block;margin-bottom:6px;">
                Saldo insuficiente — tens <strong>${NB.formatCurrency(balance)}</strong>
                e precisas de <strong>${NB.formatCurrency(required)}</strong>
                (faltam ${NB.formatCurrency(missing)}).
            </span>
            <a href="#" class="btn btn--primary btn--sm" id="la-bid-add-funds">+ Adicionar Fundos</a>`;
        document.getElementById('la-bid-add-funds')?.addEventListener('click', e => {
            e.preventDefault();
            if (typeof NB.openWalletModal === 'function') {
                NB.openWalletModal();
            }
        });
    }

    function wireAddFunds() {
        document.getElementById('la-add-funds').addEventListener('click', () => {
            if (typeof NB.openWalletModal === 'function') {
                NB.openWalletModal();
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Bids history (polled)
    // ─────────────────────────────────────────────────────────────

    async function loadBids() {
        try {
            const data = await NB.apiGet(`/api/bids/get_by_auction.php?product_id=${productId}&limit=50`);
            if (data.status !== 'success') return;
            renderBids(data.bids || []);
        } catch {}
    }

    function renderBids(bids) {
        const list  = document.getElementById('la-bids-list');
        const empty = document.getElementById('la-bids-empty');
        setText('la-bids-count', bids.length);

        list.innerHTML = '';

        if (!bids.length) {
            empty.className = 'la-bids-empty';
            list.appendChild(empty);
            return;
        }

        bids.forEach((b, idx) => {
            const li = document.createElement('li');
            li.className = 'la-bid-item';

            const rankEl = document.createElement('span');
            rankEl.className = 'la-bid-item__rank' + (idx === 0 ? ' la-bid-item__rank--gold' : '');
            rankEl.textContent = idx === 0 ? '🥇' : `#${idx + 1}`;

            const infoEl = document.createElement('div');
            infoEl.className = 'la-bid-item__info';
            infoEl.innerHTML =
                `<p class="la-bid-item__name">${NB.escHtml(b.bidder_name)}</p>` +
                `<p class="la-bid-item__date">${formatDate(b.bid_created_at)}</p>`;

            const amtEl = document.createElement('span');
            amtEl.className = 'la-bid-item__amount';
            amtEl.textContent = NB.formatCurrency(b.bid_amount);

            li.appendChild(rankEl);
            li.appendChild(infoEl);
            li.appendChild(amtEl);
            list.appendChild(li);
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Chat — polling
    // ─────────────────────────────────────────────────────────────

    function startChatPolling() {
        pollChat();
        chatTimer = setInterval(pollChat, CHAT_POLL_MS);
    }

    async function pollChat() {
        try {
            const url = `/api/chat/get.php?product_id=${productId}&after_id=${lastChatId}`;
            const data = await NB.apiGet(url);
            if (data.status !== 'success') return;
            const msgs = data.messages || [];
            if (msgs.length) {
                const append = lastChatId > 0;
                renderChatMessages(msgs, append);
                lastChatId = Number(data.last_id || lastChatId);
            } else if (lastChatId === 0) {
                // First poll, no messages at all → ensure empty state
                renderChatUI();
            }
        } catch { /* network blip — next tick will retry */ }
    }

    function renderChatMessages(msgs, append) {
        const box   = document.getElementById('la-chat-messages');
        const empty = document.getElementById('la-chat-empty');

        if (!append) {
            box.innerHTML = '';
            chatMsgCount = 0;
        }

        if (empty && box.contains(empty)) box.removeChild(empty);

        const wasAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;

        msgs.forEach(m => {
            box.appendChild(buildMessageEl(m));
            chatMsgCount++;
        });

        setText('la-chat-count', `${chatMsgCount} msg${chatMsgCount !== 1 ? 's' : ''}`);

        if (!append || wasAtBottom) {
            box.scrollTop = box.scrollHeight;
        }

        renderChatUI();
    }

    function buildMessageEl(m) {
        const isSystem = Number(m.cht_is_system) === 1;

        if (isSystem) {
            const div = document.createElement('div');
            div.className = 'la-msg la-msg--system';
            div.innerHTML = `
                <div class="la-msg__system-bubble">
                    <span class="la-msg__system-text">${NB.escHtml(m.cht_content)}</span>
                    <span class="la-msg__time">${formatTime(m.cht_created_at)}</span>
                </div>`;
            return div;
        }

        const isOwn = currentUser && Number(m.user_id) === Number(currentUser.id);
        const div = document.createElement('div');
        div.className = 'la-msg' + (isOwn ? ' la-msg--own' : '');

        const avatarSrc = NB.avatarSrc(m.user_photo);
        div.innerHTML = `
            <div class="la-msg__avatar">
                <img src="${NB.escHtml(avatarSrc)}" alt="${NB.escHtml(m.user_name)}" loading="lazy" ${NB.avatarFallbackAttr()} />
            </div>
            <div class="la-msg__content">
                <p class="la-msg__name">${NB.escHtml(m.user_name)}</p>
                <div class="la-msg__bubble">
                    <p class="la-msg__text">${NB.escHtml(m.cht_content)}</p>
                </div>
                <span class="la-msg__time">${formatTime(m.cht_created_at)}</span>
            </div>`;
        return div;
    }

    function renderChatUI() {
        const form    = document.getElementById('la-chat-form');
        const authMsg = document.getElementById('la-chat-auth-msg');

        form.hidden    = !currentUser;
        authMsg.hidden = !!currentUser;
    }

    function wireChatForm() {
        document.getElementById('la-chat-form').addEventListener('submit', handleChatSubmit);
    }

    function wireChatTextarea() {
        const ta = document.getElementById('la-chat-input');
        if (!ta) return;
        ta.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('la-chat-form').dispatchEvent(new Event('submit', { cancelable: true }));
            }
        });
        ta.addEventListener('input', () => {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
        });
    }

    async function handleChatSubmit(e) {
        e.preventDefault();
        const input   = document.getElementById('la-chat-input');
        const msgEl   = document.getElementById('la-chat-send-msg');
        const content = input.value.trim();

        if (!content) return;

        msgEl.textContent = '';

        try {
            const res = await NB.apiPost(
                '/api/chat/send.php',
                { product_id: productId, content },
                { auth: true }
            );
            if (res.status === 'success') {
                input.value = '';
                input.style.height = 'auto';
                pollChat(); // immediate refresh
            } else {
                msgEl.style.color = 'var(--danger)';
                msgEl.textContent = res.message || 'Erro ao enviar.';
            }
        } catch {
            msgEl.style.color = 'var(--danger)';
            msgEl.textContent = 'Erro de rede.';
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Owner: delete
    // ─────────────────────────────────────────────────────────────

    function configureOwnerSection() {
        const section = document.getElementById('la-owner-actions');
        const isOwner = currentUser && Number(auction.seller_id) === Number(currentUser.id);
        section.hidden = !isOwner;

        configureRateSection();
    }

    async function configureRateSection() {
        const section = document.getElementById('la-rate-section');
        if (!section || !currentUser) return;

        const isWinner   = Number(auction.prd_winner_usr_id) === Number(currentUser.id);
        const isFinished = ['sold', 'ended'].includes(auction.prd_status);
        if (!isWinner || !isFinished) { section.hidden = true; return; }

        section.hidden = false;

        // Check if already reviewed (look in seller's reviews for one from this user)
        try {
            const res = await NB.apiGet(`/api/reviews/get_for_seller.php?seller_id=${auction.seller_id}`);
            const reviews = (res?.reviews) || [];
            const mine = reviews.find(r =>
                Number(r.reviewer_id) === Number(currentUser.id) &&
                Number(r.product_id)  === Number(auction.prd_id)
            );
            const openBtn = document.getElementById('la-rate-open');
            const status  = document.getElementById('la-rate-status');
            if (mine) {
                if (openBtn) openBtn.disabled = true;
                if (status) {
                    const stars = '★'.repeat(mine.rev_rating) + '☆'.repeat(5 - mine.rev_rating);
                    status.innerHTML = `Já avaliaste: <strong>${stars}</strong>`;
                }
            }
        } catch { /* ignore — let user attempt and backend rejects */ }
    }

    function wireRateModal() {
        const openBtn   = document.getElementById('la-rate-open');
        const modal     = document.getElementById('la-rate-modal');
        const closeBtn  = document.getElementById('la-rate-close');
        const cancelBtn = document.getElementById('la-rate-cancel');
        const submitBtn = document.getElementById('la-rate-submit');
        const stars     = document.querySelectorAll('.la-rate-star');
        const commentEl = document.getElementById('la-rate-comment');
        const msgEl     = document.getElementById('la-rate-msg');
        if (!modal) return;

        let chosen = 0;

        const close = () => {
            modal.classList.remove('open');
            chosen = 0;
            stars.forEach(s => s.classList.remove('is-on'));
            if (commentEl) commentEl.value = '';
            if (msgEl) msgEl.textContent = '';
            if (submitBtn) submitBtn.disabled = true;
        };

        openBtn?.addEventListener('click', () => modal.classList.add('open'));
        closeBtn?.addEventListener('click', close);
        cancelBtn?.addEventListener('click', close);
        modal.addEventListener('click', e => { if (e.target === modal) close(); });

        stars.forEach(s => {
            s.addEventListener('click', () => {
                chosen = Number(s.dataset.star);
                stars.forEach(x => x.classList.toggle('is-on', Number(x.dataset.star) <= chosen));
                if (submitBtn) submitBtn.disabled = chosen < 1;
            });
        });

        submitBtn?.addEventListener('click', async () => {
            if (chosen < 1 || chosen > 5) return;
            submitBtn.disabled = true;
            setFeedback(msgEl, 'A enviar…', 'var(--text-muted)');
            try {
                const res = await NB.apiPost('/api/reviews/create.php', {
                    product_id: productId,
                    rating: chosen,
                    comment: (commentEl?.value || '').trim()
                }, { auth: true });

                if (res.status === 'success') {
                    setFeedback(msgEl, 'Avaliação registada.', 'var(--success)');
                    setTimeout(() => { close(); configureRateSection(); }, 900);
                } else {
                    setFeedback(msgEl, res.message || 'Erro ao enviar.', 'var(--danger)');
                    submitBtn.disabled = false;
                }
            } catch {
                setFeedback(msgEl, 'Erro de rede.', 'var(--danger)');
                submitBtn.disabled = false;
            }
        });
    }

    function wireDelete() {
        document.getElementById('la-delete-btn').addEventListener('click', handleDelete);
    }

    async function handleDelete() {
        const msgEl = document.getElementById('la-delete-msg');
        if (!confirm('Tens a certeza que queres eliminar este leilão? Esta ação não pode ser revertida.')) return;

        setFeedback(msgEl, 'A eliminar…', 'var(--text-muted)');

        try {
            const res = await NB.apiPost('/api/auctions/cancel.php', { product_id: productId }, { auth: true });
            if (res.status === 'success') {
                setFeedback(msgEl, 'Leilão eliminado. A redirecionar…', 'var(--success)');
                clearInterval(bidsTimer);
                clearInterval(chatTimer);
                setTimeout(() => { location.href = 'LeiloesAtivos.html'; }, 1200);
            } else {
                setFeedback(msgEl, res.message || 'Não foi possível eliminar.', 'var(--danger)');
            }
        } catch {
            setFeedback(msgEl, 'Erro de rede.', 'var(--danger)');
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Utilities
    // ─────────────────────────────────────────────────────────────

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? '';
    }

    function setFeedback(el, text, color) {
        if (!el) return;
        el.textContent = text;
        el.style.color = color || '';
    }

    function showError(text) {
        document.getElementById('la-loading').hidden = true;
        const err = document.getElementById('la-error');
        err.textContent = text;
        err.hidden = false;
    }

    function buildImgUrl(path) {
        if (!path) return '';
        const clean = String(path).replace(/^\/+/, '');
        if (clean.startsWith('http')) return clean;
        return `${NB.BASE_URL}/${clean}`;
    }

    function formatDate(dt) {
        if (!dt) return '—';
        const d = new Date(String(dt).replace(' ', 'T'));
        return isNaN(d) ? dt : d.toLocaleString('pt-PT');
    }

    function formatTime(dt) {
        if (!dt) return '';
        const d = new Date(String(dt).replace(' ', 'T'));
        if (isNaN(d)) return '';
        const now = new Date();
        const diffMs = now - d;
        if (diffMs < 60000) return 'agora mesmo';
        if (diffMs < 3600000) return `há ${Math.floor(diffMs / 60000)} min`;
        return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    }
})();
