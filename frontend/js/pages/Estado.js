// Página "Arquitetura ao vivo" (/estado). Atualiza a cada 1,5 s:
//   * GET /_inst/apiN/health -> estado de cada instância (o Nginx encaminha sem balancear)
//   * GET /api/cluster       -> PostgreSQL, RabbitMQ (filas e ligações), outbox, Redis
//   * Socket.IO (sala "dashboard") -> lances e fechos em tempo real
// Mostra também os comandos dos cenários de falha, com o principal atual da BD.
(function () {
  const APIS = ['api1', 'api2'];
  const WORKERS = ['worker1', 'worker2'];
  const PG = ['pg-primary', 'pg-replica1', 'pg-replica2'];
  const POLL_MS = 1500;
  const OUTBOX_ALERT = 50; // eventos à espera a partir dos quais se regista no feed

  const prev = { api: {}, pg: {}, redis: null, leader: null, rabbit: null, conns: null, outboxHigh: false };
  const misses = {}, lastHealth = {};
  const dist = [];
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const st = (ok, txt) => `<span class="${ok === true ? 'up' : ok === false ? 'down' : 'warn'}">${txt}</span>`;

  // Cookie de afinidade (o mesmo que o site cria em Helpers.js): sem ele, cada pedido desta
  // página iria para um servidor ao acaso.
  if (!/(?:^|; )nb_sticky=/.test(document.cookie)) {
    const id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
    document.cookie = `nb_sticky=${id}; path=/; max-age=31536000; SameSite=Lax`;
  }
  const NOMES = { api1: 'Servidor 1', api2: 'Servidor 2' };
  let browserSrv; // undefined = ainda não verificado

  async function checkBrowserSrv() {
    let inst = null;
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      inst = r.headers.get('x-instance');
    } catch { inst = null; }
    const box = $('#browser-srv');
    box.className = 'srv ' + (inst || 'none');
    box.textContent = inst ? `${NOMES[inst] || inst} (${inst})` : 'Sem servidor disponível';
    if (browserSrv !== undefined && browserSrv !== inst) {
      const de = browserSrv ? (NOMES[browserSrv] || browserSrv) : 'nenhum';
      const para = inst ? (NOMES[inst] || inst) : 'nenhum';
      event(`este browser mudou de ${de} para ${para}`);
      box.classList.add('flash');
      setTimeout(() => box.classList.remove('flash'), 600);
    }
    browserSrv = inst;
  }

  function event(text) {
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString('pt-PT')}  ${text}`;
    $('#feed').prepend(li);
    while ($('#feed').children.length > 100) $('#feed').lastChild.remove();
  }

  function bytes(b) {
    if (b == null) return '—';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  }

  function uptime(s) {
    if (s == null) return '—';
    return s < 3600 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${Math.floor(s / 3600)} h ${Math.floor(s % 3600 / 60)} min`;
  }

  // ── Renderização ─────────────────────────────────────────────────────
  function renderNginx(nginxUp) {
    const count = n => dist.filter(d => d === n).length;
    $('#nginx').innerHTML = `<tr><td>${st(nginxUp, nginxUp ? 'UP' : 'DOWN')}</td>${APIS.map(n => `<td>${count(n)}</td>`).join('')}<td>${dist.length}</td></tr>`;
  }

  function renderApis(health) {
    $('#apis').innerHTML = APIS.map(n => {
      const h = health[n];
      if (!h) return `<tr><td>${n}</td><td>${st(false, 'DOWN')}</td><td colspan="7">—</td></tr>`;
      return `<tr><td>${n}</td><td>${st(true, 'UP')}</td><td>${esc(h.db_primary || '—')}</td><td>${h.db_timeline ?? '—'}</td>
        <td>${st(h.db === 'up' ? true : h.db === 'read-only' ? null : false, h.db)}</td><td>${st(h.redis === 'up', h.redis)}</td>
        <td>${h.rabbitmq ? st(h.rabbitmq === 'up', h.rabbitmq) : '—'}</td><td>${h.job_leader ? 'sim' : ''}</td><td>${uptime(h.uptime_s)}</td></tr>`;
    }).join('');
  }

  function renderPg(cluster) {
    const nodes = {};
    (cluster?.nodes || []).forEach(x => { nodes[x.node] = x; });
    $('#pg').innerHTML = PG.map(n => {
      const x = nodes[n];
      if (!cluster) return `<tr><td>${n}</td><td colspan="7">${st(null, 'sem dados')}</td></tr>`;
      if (!x || !x.up) return `<tr><td>${n}</td><td>${st(false, 'DOWN')}</td><td colspan="6">—</td></tr>`;
      const role = x.role === 'principal' ? st(true, 'PRINCIPAL') : x.role === 'réplica' ? st(true, 'réplica') : st(null, x.role);
      return `<tr><td>${n}</td><td>${role}</td><td>${x.timeline ?? '—'}</td><td>${esc(x.lsn)}</td><td>${esc(x.upstream || '—')}</td>
        <td>${esc(x.receiver || '—')}</td><td>${x.in_recovery ? bytes(x.lag_bytes) : '—'}</td><td>${x.in_recovery ? '—' : esc(x.sync || '0')}</td></tr>`;
    }).join('');
  }

  function renderRabbit(cluster) {
    const r = cluster?.rabbitmq;
    const o = cluster?.outbox;
    if (!cluster) {
      $('#broker').innerHTML = `<tr><td>rabbitmq</td><td>${st(null, 'sem dados')}</td></tr>`;
      $('#queues').innerHTML = '';
      return;
    }
    const conns = new Set(r?.connections || []);
    const conn = n => (conns.has(n) ? st(true, 'ligado') : st(false, 'desligado'));
    const outbox = o == null ? st(null, 'sem dados')
      : o.pending === 0 ? st(true, '0 por publicar')
      : st(o.pending > OUTBOX_ALERT ? false : null, `${o.pending} por publicar (o mais antigo há ${o.oldest_pending_s ?? 0} s)`);
    $('#broker').innerHTML = [
      `<tr><td>Broker</td><td>${r?.up ? st(true, 'UP') : st(false, 'DOWN')} <span class="muted">${esc(r?.up ? `${r.node} · v${r.version}` : r?.reason || '')}</span></td></tr>`,
      `<tr><td>Outbox (PostgreSQL)</td><td>${outbox}</td></tr>`,
      `<tr><td>Ligações das APIs</td><td>${APIS.map(n => `${n} ${conn(n)}`).join(' · ')}</td></tr>`,
      `<tr><td>Workers</td><td>${WORKERS.map(n => `${n} ${conn(n)}`).join(' · ')}</td></tr>`,
    ].join('');
    $('#queues').innerHTML = (r?.queues || []).map(q => {
      const backlog = q.ready > 0 && q.consumers === 0 ? false : q.ready > 0 ? null : true;
      return `<tr><td>${esc(q.name)}</td><td>${esc(q.type)}</td><td class="num">${st(backlog, q.ready)}</td><td class="num">${q.unacked}</td>
        <td class="num">${q.name.endsWith('.dlq') ? q.consumers : st(q.consumers > 0, q.consumers)}</td><td class="num">${q.in_rate}</td><td class="num">${q.out_rate}</td></tr>`;
    }).join('') || `<tr><td colspan="7" class="muted">sem filas (RabbitMQ em baixo?)</td></tr>`;
  }

  function renderRedis(cluster) {
    const r = cluster?.redis;
    $('#redis').innerHTML = `<tr><td>redis</td><td>${r ? st(r === 'up', r === 'up' ? 'UP' : 'DOWN') : st(null, 'sem dados')}</td></tr>`;
  }

  function renderCommands(cluster) {
    const primary = (cluster?.nodes || []).find(x => x.role === 'principal')?.node || 'pg-primary';
    const other = PG.find(n => n !== primary);
    $('#cmds').textContent = [
      '# API',
      'docker compose kill api2',
      'docker compose start api2',
      '# Base de dados (failover)',
      `docker compose kill ${primary}`,
      `docker compose exec -T ${other} bash /scripts/failover.sh`,
      `docker compose start ${primary}`,
      '# Workers em baixo: a fila "notifications" enche; ao voltarem processam tudo',
      'docker compose kill worker1 worker2',
      'docker compose start worker1 worker2',
      '# RabbitMQ em baixo: os lances continuam, o outbox enche; ao voltar é publicado por ordem',
      'docker compose kill rabbitmq',
      'docker compose start rabbitmq',
      '# Redis em baixo: o tempo real entre instâncias para (a página volta ao polling)',
      'docker compose kill redis',
      'docker compose start redis',
      '# Carga',
      'docker compose exec -T api1 node scripts/stress-bids.js http://nginx 8 300 20',
      'docker compose exec -T api1 node scripts/bench-hot-auction.js http://nginx 20 900 40 50',
    ].join('\n');
  }

  function render(health, cluster, nginxUp) {
    renderNginx(nginxUp);
    renderApis(health);
    renderPg(cluster);
    renderRabbit(cluster);
    renderRedis(cluster);
    renderCommands(cluster);
  }

  // ── Mudanças de estado -> feed de eventos ──────────────────────────────
  function diff(health, cluster) {
    for (const n of APIS) {
      const up = !!health[n];
      if (prev.api[n] !== undefined && prev.api[n] !== up) event(`${n}: ${up ? 'UP' : 'DOWN'}`);
      prev.api[n] = up;
    }
    const leader = APIS.find(n => health[n]?.job_leader) || null;
    if (leader && prev.leader && leader !== prev.leader) event(`líder (fecho + relay do outbox): ${prev.leader} -> ${leader}`);
    if (leader) prev.leader = leader;
    if (!cluster) return;
    for (const x of cluster.nodes) {
      const role = x.up ? x.role : 'DOWN';
      if (prev.pg[x.node] !== undefined && prev.pg[x.node] !== role) {
        event(`${x.node}: ${prev.pg[x.node]} -> ${role}${role === 'principal' ? ` (timeline ${x.timeline})` : ''}`);
      }
      prev.pg[x.node] = role;
    }
    if (prev.redis !== null && prev.redis !== cluster.redis) event(`redis: ${cluster.redis === 'up' ? 'UP' : 'DOWN'}`);
    prev.redis = cluster.redis;

    const rabbitUp = !!cluster.rabbitmq?.up;
    if (prev.rabbit !== null && prev.rabbit !== rabbitUp) event(`rabbitmq: ${rabbitUp ? 'UP' : 'DOWN'}`);
    prev.rabbit = rabbitUp;
    if (rabbitUp) {
      const conns = new Set(cluster.rabbitmq.connections || []);
      if (prev.conns) {
        for (const w of WORKERS) {
          if (prev.conns.has(w) !== conns.has(w)) event(`${w}: ${conns.has(w) ? 'ligado ao RabbitMQ' : 'desligado do RabbitMQ'}`);
        }
      }
      prev.conns = conns;
    }
    const pending = cluster.outbox?.pending ?? 0;
    if (!prev.outboxHigh && pending > OUTBOX_ALERT) event(`outbox: ${pending} eventos à espera de publicação`);
    if (prev.outboxHigh && pending === 0) event('outbox: tudo publicado');
    prev.outboxHigh = pending > OUTBOX_ALERT || (prev.outboxHigh && pending > 0);
  }

  // ── Recolha ────────────────────────────────────────────────────────────
  async function getJson(url) {
    const r = await fetch(url, { cache: 'no-store' });
    let j = null;
    try { j = await r.json(); } catch { j = null; }
    return { status: r.status, inst: r.headers.get('x-instance'), j };
  }

  async function poll() {
    const t0 = performance.now();
    const res = await Promise.all([
      ...APIS.map(n => getJson(`/_inst/${n}/health`).catch(() => null)),
      getJson('/api/cluster').catch(() => null),
    ]);
    const health = {};
    APIS.forEach((n, i) => {
      const r = res[i];
      if (r && r.j && r.j.instance === n) { misses[n] = 0; lastHealth[n] = r.j; }
      else misses[n] = (misses[n] || 0) + 1;
      if (misses[n] < 2 && lastHealth[n]) health[n] = lastHealth[n];
    });
    const cl = res[APIS.length];
    const cluster = cl && cl.status === 200 && cl.j && cl.j.nodes ? cl.j : null;
    if (cl && cl.inst) { dist.push(cl.inst); if (dist.length > 60) dist.shift(); }
    diff(health, cluster);
    render(health, cluster, !!cl);
    $('#meta').textContent = `${new Date().toLocaleTimeString('pt-PT')} · ${Math.round(performance.now() - t0)} ms · intervalo ${POLL_MS} ms`;
  }

  $('#btn-traffic').addEventListener('click', async () => {
    const r = await Promise.all(Array.from({ length: 30 }, () =>
      fetch('/api/stats/home', { cache: 'no-store', credentials: 'omit' }).then(x => x.headers.get('x-instance')).catch(() => null)));
    r.forEach(i => { if (i) dist.push(i); });
    while (dist.length > 60) dist.shift();
    event(`30 pedidos: ${APIS.map(a => `${a}=${r.filter(x => x === a).length}`).join(' ')}`);
  });

  // ── Tempo real ─────────────────────────────────────────────────────────
  if (typeof io === 'function') {
    const s = io({ transports: ['websocket'] });
    s.on('connect', () => s.emit('dashboard:join'));
    s.on('hello', h => {
      $('#ws').innerHTML = `<tr><td>Estado</td><td>${st(true, 'ligado')}</td></tr><tr><td>Instância</td><td>${esc(h.instance)}</td></tr>`;
      event(`websocket ligado a ${h.instance}`);
    });
    s.on('disconnect', () => {
      $('#ws').innerHTML = `<tr><td>Estado</td><td>${st(false, 'desligado')}</td></tr>`;
      event('websocket desligado');
    });
    s.on('bid:new', e => event(`lance: leilão #${e.product_id}, ${e.amount} créditos, ${e.bidder_name}, via ${e.instance}`));
    s.on('auction:closed', e => event(`fecho: leilão #${e.product_id} (${e.status}), via ${e.instance}`));
  }

  poll();
  setInterval(poll, POLL_MS);
  checkBrowserSrv();
  setInterval(checkBrowserSrv, POLL_MS);
})();
