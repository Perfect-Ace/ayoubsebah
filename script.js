const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Split hero name into letters ---------- */
$$('.hero h1 .w').forEach(word => {
  const text = word.textContent;
  word.innerHTML = '';
  [...text].forEach((ch, i) => {
    const clip = document.createElement('span');
    clip.className = 'clip';
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = ch;
    s.style.transitionDelay = `${0.15 + i * 0.06 + (word.tagName === 'I' ? 0.3 : 0)}s`;
    clip.appendChild(s);
    word.appendChild(clip);
  });
});

/* ---------- Loader ---------- */
const loader = $('#loader');
let started = false;
function start() {
  if (started) return;
  started = true;
  loader.classList.add('done');
  document.body.classList.remove('loading');
  setTimeout(() => document.body.classList.add('ready'), 350);
  setTimeout(() => loader.remove(), 1600);
}
if (reduced) start();
else {
  const minTime = new Promise(r => setTimeout(r, 1700));
  const loaded = new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r)));
  Promise.all([minTime, loaded]).then(start);
  setTimeout(start, 4000); // safety net on slow connections
}

/* ---------- Nav: background, hide on scroll down ---------- */
const nav = $('#nav');
const progress = $('#progress');
let lastY = 0;
function onScroll() {
  const y = scrollY;
  nav.classList.toggle('scrolled', y > 40);
  nav.classList.toggle('hide', y > lastY && y > 500 && !$('#navLinks').classList.contains('open'));
  lastY = y;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  drawLines();
  parallax();
}
// Run scroll work at most once per frame
let scrollQueued = false;
addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => { scrollQueued = false; onScroll(); });
}, { passive: true });

// Pause looping animations in sections that are off-screen
const pauseIO = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('paused', !e.isIntersecting)), { rootMargin: '100px' });
$$('.hero, .band, .world-map, .mock, .contact, .zellige-strip').forEach(el => pauseIO.observe(el));

/* ---------- Mobile menu ---------- */
const burger = $('#burger');
const links = $('#navLinks');
burger.addEventListener('click', () => { burger.classList.toggle('open'); links.classList.toggle('open'); });
$$('a', links).forEach(a => a.addEventListener('click', () => { burger.classList.remove('open'); links.classList.remove('open'); }));

/* ---------- Scroll reveal ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
$$('.reveal').forEach(el => {
  const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
  el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 0.09}s`;
  io.observe(el);
});

/* ---------- Count-up numbers ---------- */
function countUp(el) {
  const to = +el.dataset.to, suffix = el.dataset.suffix || '';
  const t0 = performance.now(), dur = 1600;
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const countIO = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { setTimeout(() => countUp(e.target), 1200); countIO.unobserve(e.target); }
}));
$$('.count').forEach(el => reduced ? (el.textContent = el.dataset.to + (el.dataset.suffix || '')) : countIO.observe(el));

/* ---------- Lines that draw while scrolling ---------- */
const steps = $('#steps');
const timeline = $('#timeline');
const tlFill = $('#tlFill');
function scrollRatio(el, startAt = 0.85, endAt = 0.35) {
  const r = el.getBoundingClientRect();
  const start = innerHeight * startAt, end = innerHeight * endAt;
  return Math.max(0, Math.min(1, (start - r.top) / (r.height + start - end)));
}
let lastSteps = -1, lastTl = -1;
function drawLines() {
  const s = scrollRatio(steps, 0.8, 0.5).toFixed(3);
  const t = scrollRatio(timeline, 0.7, 0.3).toFixed(3);
  if (s !== lastSteps) { steps.style.setProperty('--p', s); lastSteps = s; }
  if (t !== lastTl) { tlFill.style.setProperty('--p', t); lastTl = t; }
}

/* ---------- Photo parallax ---------- */
const archImg = $('#arch img');
function parallax() {
  if (reduced || scrollY > innerHeight * 1.2) return;
  archImg.style.setProperty('--py', `${scrollY * 0.08}px`);
}

/* ---------- Custom cursor + magnetic buttons ---------- */
if (finePointer && !reduced) {
  const cursor = $('#cursor'), dot = $('#cursorDot');
  let mx = -100, my = -100, cx = -100, cy = -100, running = false;
  // Only animate the ring while it is catching up with the mouse
  function loop() {
    cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    if (Math.abs(mx - cx) > 0.3 || Math.abs(my - cy) > 0.3) requestAnimationFrame(loop);
    else running = false;
  }
  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    document.body.classList.add('has-cursor');
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));
  $$('a, button, .project').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });

  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener('mouseleave', () => (el.style.transform = ''));
  });

  /* 3D tilt + spotlight on project cards */
  $$('.project').forEach(card => {
    card.addEventListener('mouseenter', () => card.classList.add('tilting'));
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      card.style.transform = `perspective(1100px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.classList.remove('tilting'); card.style.transform = ''; });
  });
}

/* ---------- Project filters ---------- */
$$('.filter').forEach(btn => btn.addEventListener('click', () => {
  $$('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const f = btn.dataset.filter;
  $$('.project').forEach(p => {
    const show = f === 'all' || p.dataset.cat.split(' ').includes(f);
    p.classList.toggle('hide', !show);
    p.classList.remove('pop');
    if (show) { p.classList.add('in'); void p.offsetWidth; p.classList.add('pop'); }
  });
}));

$('#year').textContent = new Date().getFullYear();
onScroll();

/* Block image dragging */
$$('img').forEach(img => { img.draggable = false; img.addEventListener('dragstart', e => e.preventDefault()); });
