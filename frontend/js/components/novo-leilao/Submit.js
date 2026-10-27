// Submit handler for new auction form
window.NB = window.NB || {};
NB.NovoLeilao = NB.NovoLeilao || {};

NB.NovoLeilao.initSubmit = function (onSuccess) {
    const form = document.getElementById('form-novo-leilao');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const user = NB.requireAuth();
        if (!user?.token) {
            alert('Sessão expirada. Faz login novamente.');
            window.location.href = NB._authPath('login');
            return;
        }

        const files = NB.NovoLeilao.getFiles();
        if (files.length < 3) {
            alert('Adiciona pelo menos 3 fotos.');
            return;
        }

        const fd = new FormData(form);
        files.forEach(f => fd.append('images[]', f));

        const submit = document.getElementById('nl-submit');
        const orig   = submit?.textContent;
        if (submit) { submit.disabled = true; submit.textContent = 'A publicar…'; }

        try {
            const data = await NB.apiPost('/api/auctions/create.php', fd, { auth: true });
            if (data.status === 'success') {
                form.reset();
                NB.NovoLeilao.resetFiles();
                NB.NovoLeilao.setDatetimeLimits();
                NB.NovoLeilao.closeModal();
                if (typeof onSuccess === 'function') onSuccess(data);
            } else {
                alert(data.message || 'Erro ao criar leilão.');
            }
        } catch (err) {
            alert('Erro de rede. Tenta novamente.');
        } finally {
            if (submit) { submit.disabled = false; submit.textContent = orig; }
        }
    });
};
