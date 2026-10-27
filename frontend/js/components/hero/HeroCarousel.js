// Hero background carousel
window.NB = window.NB || {};

NB.HERO_IMAGES = [
    'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1600&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&q=80',
    'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=1600&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80',
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=80'
];

NB.initHeroCarousel = function () {
    const bg   = document.getElementById('hero-bg');
    const dots = document.getElementById('hero-dots');
    const prev = document.getElementById('hero-prev');
    const next = document.getElementById('hero-next');
    if (!bg) return;

    let index = 0;
    let timer = null;

    if (dots) {
        dots.innerHTML = NB.HERO_IMAGES.map((_, i) =>
            `<button class="hero__dot${i === 0 ? ' hero__dot--active' : ''}" data-index="${i}" aria-label="Slide ${i+1}"></button>`
        ).join('');
        dots.addEventListener('click', e => {
            const btn = e.target.closest('[data-index]');
            if (btn) { goTo(parseInt(btn.dataset.index)); restartAuto(); }
        });
    }

    if (prev) prev.addEventListener('click', () => { step(-1); restartAuto(); });
    if (next) next.addEventListener('click', () => { step(+1); restartAuto(); });

    function step(delta) {
        const n = NB.HERO_IMAGES.length;
        goTo((index + delta + n) % n);
    }

    function goTo(i) {
        index = i;
        bg.style.backgroundImage = `url('${NB.HERO_IMAGES[i]}')`;
        document.querySelectorAll('.hero__dot').forEach((d, j) =>
            d.classList.toggle('hero__dot--active', j === i));
    }

    function restartAuto() {
        if (timer) clearInterval(timer);
        timer = setInterval(() => step(+1), 5000);
    }

    goTo(0);
    restartAuto();
};
