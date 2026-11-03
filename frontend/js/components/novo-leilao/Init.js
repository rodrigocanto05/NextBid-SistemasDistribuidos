// Wires up the "Criar Leilão" modal — must be loaded AFTER the other novo-leilao modules
window.NB = window.NB || {};
NB.NovoLeilao = NB.NovoLeilao || {};

NB.NovoLeilao.init = function (onSuccess) {
    NB.NovoLeilao.bindModalTriggers();
    NB.NovoLeilao.setDatetimeLimits();
    NB.NovoLeilao.initUpload();
    NB.NovoLeilao.initSubmit(onSuccess);

    NB.loadCategoriesInto('nl-categoria').then(cats => {
        NB.NovoLeilao.initType(cats);
        NB.NovoLeilao.initAutoSuggest(cats);
    });
};

// Produto: 3 a 15 fotos, condição obrigatória. Serviço: 1 a 15 fotos, sem condição.
NB.NovoLeilao.minPhotos = function () {
    return document.getElementById('nl-tipo')?.value === 'service' ? 1 : 3;
};

NB.NovoLeilao.initType = function (cats) {
    const tipo      = document.getElementById('nl-tipo');
    const sel       = document.getElementById('nl-categoria');
    const hint      = document.getElementById('nl-categoria-hint');
    const condGroup = document.getElementById('nl-condicao-group');
    const cond      = document.getElementById('nl-condicao');
    const fotos     = document.getElementById('nl-fotos-label');
    const nome      = document.getElementById('nl-nome');
    const desc      = document.getElementById('nl-descricao');
    if (!tipo || !sel) return;

    const apply = () => {
        const service = tipo.value === 'service';
        sel.innerHTML = '<option value="">Selecionar categoria…</option>';
        NB.fillCategorySelect(sel, cats, service ? 'service' : 'product');
        delete sel.dataset.userPicked;
        if (hint) hint.style.display = 'none';
        if (condGroup) condGroup.style.display = service ? 'none' : '';
        if (cond) cond.disabled = service;
        if (fotos) fotos.textContent = service ? 'Fotos (1 a 15)' : 'Fotos (3 a 15)';
        if (nome) nome.placeholder = service ? 'Ex: Explicações de Cálculo I' : 'Ex: iPhone 14 Pro Max 256GB';
        if (desc) desc.placeholder = service
            ? 'Descreve o serviço: conteúdos, duração, formato (presencial/online)…'
            : 'Descreve o produto em detalhe…';
        NB.NovoLeilao.refreshPhotos?.();
    };
    tipo.addEventListener('change', apply);
    apply();
};
