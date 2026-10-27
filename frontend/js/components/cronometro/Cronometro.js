// On `.la-countdown` element renders segmented tiles; everywhere else falls back to compact text.
window.NB = window.NB || {};

const DAYS_PER_YEAR = 365;

function _breakdown(diffMs) {
    const totalDays = Math.floor(diffMs / 86400000);
    const y = Math.floor(totalDays / DAYS_PER_YEAR);
    const d = totalDays - y * DAYS_PER_YEAR;
    const h = Math.floor((diffMs % 86400000) / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    return { y, d, h, m, s };
}

function _compactText({ y, d, h, m, s }) {
    if (y > 0) return `${y}a ${d}d`;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

function _pad(n) { return String(n).padStart(2, '0'); }

NB.iniciarCronometro = function (endsAt, element) {
    if (!endsAt || !element) return;
    const endTime = new Date(endsAt.replace(' ', 'T')).getTime();
    const segmented = element.classList.contains('la-countdown');

    return segmented
        ? _startSegmented(endTime, element)
        : _startCompact(endTime, element);
};

// ─── Compact text mode (auction cards) ───────────────────────────
function _startCompact(endTime, element) {
    function tick() {
        const diff = endTime - Date.now();
        if (diff <= 0) {
            element.textContent = 'Terminado';
            return;
        }
        element.textContent = _compactText(_breakdown(diff));
        requestAnimationFrame(() => setTimeout(tick, 1000));
    }
    tick();
}

// ─── Segmented mode (auction detail panel) ───────────────────────
function _startSegmented(endTime, element) {
    element.classList.add('la-countdown--segments');
    element.innerHTML = `
        <div class="la-countdown__unit" data-unit="y">
            <span class="la-countdown__num">--</span>
            <span class="la-countdown__label">Anos</span>
        </div>
        <span class="la-countdown__sep" data-after="y" aria-hidden="true"></span>
        <div class="la-countdown__unit" data-unit="d">
            <span class="la-countdown__num">--</span>
            <span class="la-countdown__label">Dias</span>
        </div>
        <span class="la-countdown__sep" data-after="d" aria-hidden="true"></span>
        <div class="la-countdown__unit" data-unit="h">
            <span class="la-countdown__num">--</span>
            <span class="la-countdown__label">Horas</span>
        </div>
        <span class="la-countdown__sep" aria-hidden="true"></span>
        <div class="la-countdown__unit" data-unit="m">
            <span class="la-countdown__num">--</span>
            <span class="la-countdown__label">Min</span>
        </div>
        <span class="la-countdown__sep" aria-hidden="true"></span>
        <div class="la-countdown__unit" data-unit="s">
            <span class="la-countdown__num">--</span>
            <span class="la-countdown__label">Seg</span>
        </div>
    `;

    const refs = {
        y:    element.querySelector('[data-unit="y"]'),
        d:    element.querySelector('[data-unit="d"]'),
        h:    element.querySelector('[data-unit="h"]'),
        m:    element.querySelector('[data-unit="m"]'),
        s:    element.querySelector('[data-unit="s"]'),
        sepY: element.querySelector('[data-after="y"]'),
        sepD: element.querySelector('[data-after="d"]'),
    };
    const nums = {
        y: refs.y.querySelector('.la-countdown__num'),
        d: refs.d.querySelector('.la-countdown__num'),
        h: refs.h.querySelector('.la-countdown__num'),
        m: refs.m.querySelector('.la-countdown__num'),
        s: refs.s.querySelector('.la-countdown__num'),
    };
    const prev = { y: -1, d: -1, h: -1, m: -1, s: -1 };

    function setUnit(unitEl, valueEl, val, changed) {
        if (valueEl.textContent !== val) valueEl.textContent = val;
        if (changed) {
            unitEl.classList.remove('is-tick');
            void unitEl.offsetWidth;
            unitEl.classList.add('is-tick');
        }
    }

    function tick() {
        const diff = endTime - Date.now();
        if (diff <= 0) {
            element.classList.add('la-countdown--ended');
            element.classList.remove('la-countdown--segments', 'la-countdown--urgent');
            element.textContent = 'Terminado';
            return;
        }

        const { y, d, h, m, s } = _breakdown(diff);

        // Hide Anos tile + its separator when 0 years
        const showYears = y > 0;
        refs.y.classList.toggle('is-hidden', !showYears);
        refs.sepY.classList.toggle('is-hidden', !showYears);

        // Hide Dias tile + its separator when 0 days AND 0 years
        const showDays = showYears || d > 0;
        refs.d.classList.toggle('is-hidden', !showDays);
        refs.sepD.classList.toggle('is-hidden', !showDays);

        // Urgent state: under 1 hour
        const urgent = !showYears && d === 0 && h === 0;
        element.classList.toggle('la-countdown--urgent', urgent);

        // Years can grow large; pad days/hours/min/sec to 2 digits
        setUnit(refs.y, nums.y, String(y),    prev.y !== y);
        setUnit(refs.d, nums.d, _pad(d),      prev.d !== d);
        setUnit(refs.h, nums.h, _pad(h),      prev.h !== h);
        setUnit(refs.m, nums.m, _pad(m),      prev.m !== m);
        setUnit(refs.s, nums.s, _pad(s),      prev.s !== s);

        prev.y = y; prev.d = d; prev.h = h; prev.m = m; prev.s = s;

        requestAnimationFrame(() => setTimeout(tick, 1000));
    }

    tick();
}
