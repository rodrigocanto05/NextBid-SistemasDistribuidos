// Wires up the "Criar Leilão" modal — must be loaded AFTER the other novo-leilao modules
window.NB = window.NB || {};
NB.NovoLeilao = NB.NovoLeilao || {};

NB.NovoLeilao.init = function (onSuccess) {
    NB.NovoLeilao.bindModalTriggers();
    NB.NovoLeilao.setDatetimeLimits();
    NB.NovoLeilao.initUpload();
    NB.NovoLeilao.initSubmit(onSuccess);

    NB.loadCategoriesInto('nl-categoria').then(cats => {
        NB.NovoLeilao.initAutoSuggest(cats);
    });
};
