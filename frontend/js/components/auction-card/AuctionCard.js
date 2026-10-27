// Auction card builder (reusable for Home / Leiloes / MeusLeiloes)
window.NB = window.NB || {};

NB._brokenWheel = `
    <div class="broken-wheel">
        <span class="broken-wheel__icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <circle cx="9" cy="9" r="1.5"/>
                <path d="m20 14-5-5-6 6-3-3-2 2"/>
                <line x1="3" y1="3" x2="21" y2="21"/>
            </svg>
        </span>
    </div>`;

NB.createCard = function (leilao, opts = {}) {
    // img_path in DB already contains 'uploads/products/xxx' — do not double it
    const imgUrl = leilao.main_image
        ? `${NB.BASE_URL}/${String(leilao.main_image).replace(/^\/+/, '')}`
        : '';

    const detailLink = NB._path(`leiloes/DetalheLeilao.html?id=${leilao.prd_id}`);
    const card = document.createElement('article');
    card.className = 'auction-card';

    const resultBadge = opts.resultBadge ? `
        <span class="auction-card__result-badge result-badge result-badge--${opts.resultBadge}">
            ${opts.resultBadge === 'sold' ? '✓ Vendido' : '✕ Não vendido'}
        </span>` : '';

    const liveBadge = !opts.past ? `<span class="auction-card__live-badge">AO VIVO</span>` : '';

    const bottom = opts.past ? `
        <div class="auction-card__label">${opts.resultBadge === 'sold' ? 'Valor final' : 'Lance mais alto'}</div>
        <div class="auction-card__price">${NB.formatCurrency(leilao.current_bid || leilao.prd_start_price)}</div>
    ` : `
        <div class="auction-card__bid-row">
            <div>
                <span class="auction-card__label">Licitação atual</span>
                <span class="auction-card__price">${NB.formatCurrency(leilao.current_bid || leilao.prd_start_price)}</span>
            </div>
            <div class="auction-card__timer">
                <span class="auction-card__label">Termina em</span>
                <span class="timer-value" data-ends="${NB.escHtml(leilao.prd_ends_at || '')}">–</span>
            </div>
        </div>`;

    const imgWrapInner = imgUrl
        ? `<div class="img-skeleton"><span class="img-spinner"></span></div>
           <img class="auction-card__img is-loading" alt="${NB.escHtml(leilao.prd_name)}" loading="lazy" />`
        : NB._brokenWheel;

    const wrapCls = imgUrl ? 'auction-card__img-wrap' : 'auction-card__img-wrap auction-card__img-wrap--empty';

    const locationStr = leilao.prd_location ? `
        <p class="auction-card__location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
            </svg>
            ${NB.escHtml(leilao.prd_location)}
        </p>` : '';

    const catBadgeCls = opts.favoritable ? 'auction-card__cat-badge auction-card__cat-badge--shifted' : 'auction-card__cat-badge';
    card.innerHTML = `
        <div class="${wrapCls}">
            ${imgWrapInner}
            ${liveBadge}
            <span class="${catBadgeCls}">${NB.escHtml(leilao.cat_name || '')}</span>
            ${resultBadge}
        </div>
        <div class="auction-card__body">
            <h3 class="auction-card__title">${NB.escHtml(leilao.prd_name)}</h3>
            ${locationStr}
            ${bottom}
        </div>
        <div class="auction-card__footer">
            <a href="${detailLink}" class="btn btn--primary btn--full">${opts.past ? 'Ver Detalhes' : 'Licitar'}</a>
        </div>`;

    if (opts.favoritable && typeof NB.createFavoriteButton === 'function') {
        const wrap = card.querySelector('.auction-card__img-wrap');
        wrap.appendChild(NB.createFavoriteButton(leilao.prd_id));
    }

    if (imgUrl) {
        const wrap = card.querySelector('.auction-card__img-wrap');
        const imgEl = wrap.querySelector('.auction-card__img');
        const skel  = wrap.querySelector('.img-skeleton');
        imgEl.addEventListener('load', () => {
            imgEl.classList.remove('is-loading');
            skel?.classList.add('is-hidden');
        });
        imgEl.addEventListener('error', () => {
            wrap.classList.add('auction-card__img-wrap--empty');
            skel?.remove();
            imgEl.remove();
            wrap.insertAdjacentHTML('afterbegin', NB._brokenWheel);
        });
        imgEl.src = imgUrl;
    }

    const timerEl = card.querySelector('.timer-value');
    if (!opts.past && leilao.prd_ends_at && timerEl && typeof NB.iniciarCronometro === 'function') {
        NB.iniciarCronometro(leilao.prd_ends_at, timerEl);
    }

    return card;
};
