// Open/close logic for the "Criar Leilão" modal
window.NB = window.NB || {};
NB.NovoLeilao = NB.NovoLeilao || {};

NB.NovoLeilao.openModal = function () {
    if (!NB.requireAuth()) {
        alert('Precisas de iniciar sessão para criar um leilão.');
        window.location.href = NB._authPath('login');
        return;
    }
    const overlay = document.getElementById('modal-novo-leilao');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
};

NB.NovoLeilao.closeModal = function () {
    document.getElementById('modal-novo-leilao')?.classList.remove('open');
    document.body.style.overflow = '';
};

NB.NovoLeilao.bindModalTriggers = function () {
    document.getElementById('btn-novo-leilao')?.addEventListener('click', NB.NovoLeilao.openModal);
    document.getElementById('modal-close')?.addEventListener('click', NB.NovoLeilao.closeModal);

    document.getElementById('modal-novo-leilao')?.addEventListener('click', e => {
        if (e.target.id === 'modal-novo-leilao') NB.NovoLeilao.closeModal();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') NB.NovoLeilao.closeModal();
    });
};

NB.NovoLeilao.setDatetimeLimits = function () {
    const dateEl = document.getElementById('nl-fim-date');
    const timeEl = document.getElementById('nl-fim-time');
    const hidden = document.getElementById('nl-fim');
    const chips  = document.querySelectorAll('#nl-quick-dur .quick-dur__chip');
    if (!dateEl || !timeEl || !hidden) return;

    const pad = n => String(n).padStart(2, '0');
    const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const fmtTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const now = new Date();
    const min = new Date(now.getTime() + 60 * 60 * 1000);

    dateEl.min = fmtDate(min);
    dateEl.removeAttribute('max');

    const syncHidden = () => {
        if (dateEl.value && timeEl.value) hidden.value = `${dateEl.value}T${timeEl.value}`;
        refreshActiveChip();
    };

    const refreshActiveChip = () => {
        if (!dateEl.value || !timeEl.value) return;
        const picked = new Date(`${dateEl.value}T${timeEl.value}`);
        const diffHours = Math.round((picked.getTime() - Date.now()) / 3600000);
        chips.forEach(chip => {
            const h = Number(chip.dataset.hours);
            chip.classList.toggle('is-active', h === diffHours);
        });
    };

    const applyHours = h => {
        const target = new Date(Date.now() + h * 3600000);
        dateEl.value = fmtDate(target);
        timeEl.value = fmtTime(target);
        syncHidden();
    };

    // default: 24h from now
    applyHours(24);

    dateEl.addEventListener('change', syncHidden);
    timeEl.addEventListener('change', syncHidden);

    chips.forEach(chip => {
        chip.addEventListener('click', () => applyHours(Number(chip.dataset.hours)));
    });
};
