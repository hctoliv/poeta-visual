(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- intro: a cartela do filme, uma vez por sessão ---------- */
  const intro = $('#intro');
  const params = new URLSearchParams(location.search);
  let seen = false;
  try { seen = sessionStorage.getItem('pv-intro') === '1'; } catch (e) {}
  if (params.has('intro') || (!seen && !reduce)) {
    document.documentElement.classList.add('intro-on');
    const t = [];
    const end = () => {
      t.forEach(clearTimeout);
      intro.classList.add('out');
      document.documentElement.classList.remove('intro-on');
      try { sessionStorage.setItem('pv-intro', '1'); } catch (e) {}
      setTimeout(() => intro.remove(), 800);
    };
    t.push(setTimeout(() => intro.classList.add('s1'), 250));
    t.push(setTimeout(() => intro.classList.add('s2'), 900));
    t.push(setTimeout(() => intro.classList.add('s3'), 1500));
    t.push(setTimeout(end, 3300));
    intro.addEventListener('click', end);
    addEventListener('keydown', end, { once: true });
  } else {
    intro.remove();
  }

  /* ---------- menu ---------- */
  const hd = $('#hd'), nav = $('#nav'), menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    hd.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'fechar' : 'menu';
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); hd.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', false); menuBtn.textContent = 'menu';
  }));

  /* ---------- timecode e legendas do hero ---------- */
  const tc = $('#tc'), t0 = performance.now();
  const pad = n => String(n).padStart(2, '0');
  setInterval(() => {
    const f = Math.floor((performance.now() - t0) / (1000 / 24));
    tc.textContent = `${pad(Math.floor(f / 86400))}:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;
  }, 1000 / 24);

  const sub = $('#sub');
  const lines = [
    'não é só a história do Abebe',
    'é uma história que também fala sobre mim',
    'castelos & ruínas · 10 anos',
    'um filme sobre o passado, uma projeção de futuro',
    'ouro · young director award · cannes',
    'indicado · latin grammy 2026',
  ];
  let li = 0;
  setInterval(() => {
    sub.classList.add('fade');
    setTimeout(() => { li = (li + 1) % lines.length; sub.textContent = lines[li]; sub.classList.remove('fade'); }, 450);
  }, 3600);

  /* ---------- castelo / ruína ---------- */
  const split = $('#split'), bar = $('.split__bar', split);
  let dragging = false;
  const setX = clientX => {
    const r = split.getBoundingClientRect();
    const v = Math.min(96, Math.max(4, (clientX - r.left) / r.width * 100));
    split.style.setProperty('--x', v + '%');
    bar.setAttribute('aria-valuenow', Math.round(v));
  };
  split.addEventListener('pointerdown', e => { dragging = true; split.setPointerCapture(e.pointerId); setX(e.clientX); });
  split.addEventListener('pointermove', e => { if (dragging || e.pointerType === 'mouse') setX(e.clientX); });
  split.addEventListener('pointerup', () => { dragging = false; });
  split.addEventListener('pointercancel', () => { dragging = false; });
  bar.addEventListener('keydown', e => {
    const cur = parseFloat(split.style.getPropertyValue('--x')) || 50;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const v = Math.min(96, Math.max(4, cur + (e.key === 'ArrowLeft' ? -5 : 5)));
      split.style.setProperty('--x', v + '%');
      bar.setAttribute('aria-valuenow', v);
    }
  });

  /* ---------- vídeos: só tocam perto da tela ---------- */
  $$('video[data-lazy]').forEach(v => { v.preload = 'none'; });
  const vio = new IntersectionObserver(entries => entries.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) { v.play().catch(() => {}); } else { v.pause(); }
  }), { rootMargin: '200px 0px' });
  $$('video[data-lazy], .hero__vid').forEach(v => vio.observe(v));

  /* ---------- o filme ---------- */
  const screen = $('#screen'), film = $('#filmVid'), playBtn = $('#playBtn'), prog = $('#filmProg');
  playBtn.addEventListener('click', () => {
    film.muted = false;
    film.play();
  });
  film.addEventListener('click', () => { film.paused ? film.play() : film.pause(); });
  film.addEventListener('play', () => { screen.classList.add('playing'); screen.classList.remove('paused'); });
  film.addEventListener('pause', () => { screen.classList.add('paused'); });
  film.addEventListener('ended', () => { screen.classList.remove('playing', 'paused'); });
  film.addEventListener('timeupdate', () => { prog.style.width = (film.currentTime / film.duration * 100 || 0) + '%'; });
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && !film.paused) film.pause(); }, { threshold: .15 }).observe(screen);

  /* ---------- louros: clona a coroa pra poder desenhar as folhas ---------- */
  const wreath = $('#wreath');
  $$('.laurel__wreath use').forEach(u => u.replaceWith(wreath.cloneNode(true)));
  wreath.closest('svg').remove();

  /* ---------- reveals ---------- */
  $$('.eyebrow, .h2, .lead, .credits__list div, .quote, .stills figure, .laurel, .contact__big, .slate').forEach(el => el.classList.add('rv'));
  const rio = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('.rv').forEach(el => rio.observe(el));

  /* ---------- monumental: faixa de filme horizontal ---------- */
  const mono = $('#monumental'), strip = $('#strip');
  let monoMax = 0;
  const sizeMono = () => {
    monoMax = Math.max(0, strip.scrollWidth - innerWidth);
    mono.style.setProperty('--mh', (innerHeight + monoMax) + 'px');
  };
  sizeMono();
  addEventListener('resize', sizeMono);
  addEventListener('load', sizeMono);
  $$('img, video', strip).forEach(m => m.addEventListener(m.tagName === 'IMG' ? 'load' : 'loadedmetadata', sizeMono));

  /* ---------- um só loop de scroll ---------- */
  const hero = $('.hero'), zones = $$('[data-hd]');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    if (!nav.classList.contains('open')) hd.classList.toggle('hide', y > lastY && y > 200);
    lastY = y;

    const hp = Math.min(1, y / hero.offsetHeight);
    hero.style.setProperty('--p', hp.toFixed(3));

    const mr = mono.getBoundingClientRect();
    const mp = Math.min(1, Math.max(0, -mr.top / (mr.height - innerHeight || 1)));
    strip.style.setProperty('--sx', (mp * monoMax).toFixed(1));

    const probe = 30;
    const z = zones.find(el => { const r = el.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    hd.classList.toggle('light', !!z && z.dataset.hd === 'light');
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- claquete → e-mail ---------- */
  $('#slate').addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(e.target);
    const subject = `${d.get('formato')} · ${d.get('nome')}${d.get('projeto') ? ' / ' + d.get('projeto') : ''}`;
    const body = `Oi, Poeta!\n\nNome: ${d.get('nome')}\nArtista / marca: ${d.get('projeto') || '-'}\nFormato: ${d.get('formato')}\n\nA ideia:\n${d.get('ideia')}\n`;
    location.href = `mailto:poetavisual@11mm.ag?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
