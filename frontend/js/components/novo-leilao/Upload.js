window.NB = window.NB || {};
NB.NovoLeilao = NB.NovoLeilao || {};

NB.NovoLeilao._files = [];

NB.NovoLeilao.initUpload = function () {
    document.getElementById('nl-fotos-galeria')?.addEventListener('change', e => {
        addFiles(Array.from(e.target.files));
        e.target.value = '';
    });
    document.getElementById('nl-fotos-camera')?.addEventListener('change', e => {
        addFiles(Array.from(e.target.files));
        e.target.value = '';
    });

    // Expose remove function globally for onclick
    window.nlRemovePhoto = removeAt;
};

NB.NovoLeilao.getFiles = () => NB.NovoLeilao._files.slice();
NB.NovoLeilao.resetFiles = () => { NB.NovoLeilao._files = []; render(); };

function addFiles(files) {
    const room = 15 - NB.NovoLeilao._files.length;
    files.slice(0, room).forEach(f => {
        if (!['image/jpeg','image/png','image/webp'].includes(f.type)) return;
        if (f.size > 5 * 1024 * 1024) return;
        NB.NovoLeilao._files.push(f);
    });
    render();
}

function removeAt(index) {
    NB.NovoLeilao._files.splice(index, 1);
    render();
}

function render() {
    const grid     = document.getElementById('nl-photo-grid');
    const counter  = document.getElementById('nl-photo-counter');
    const submit   = document.getElementById('nl-submit');
    const n        = NB.NovoLeilao._files.length;

    if (grid) {
        grid.innerHTML = NB.NovoLeilao._files.map((f, i) => `
            <div class="photo-thumb${i === 0 ? ' photo-thumb--primary' : ''}">
                <img src="${URL.createObjectURL(f)}" alt="Foto ${i+1}" />
                <button type="button" class="photo-thumb__remove" onclick="nlRemovePhoto(${i})" aria-label="Remover">✕</button>
                ${i === 0 ? '<span class="photo-thumb__label">Principal</span>' : ''}
            </div>`).join('');
    }
    if (counter) {
        counter.textContent = `${n} / 15 fotos selecionadas${n < 3 ? ' (mínimo 3)' : ''}`;
        counter.className   = `photo-counter ${n < 3 ? 'error' : 'ok'}`;
    }
    if (submit) submit.disabled = n < 3;
}
