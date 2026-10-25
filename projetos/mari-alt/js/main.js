/* MARI — contatos: preencha aqui e o site liga sozinho os botões (WhatsApp só com DDI+DDD+número, sem símbolos). */
const CONTACT = { whatsapp: '', instagram: '' };

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
if (!hasGsap) root.classList.remove('js');

/* ---------- menu ---------- */
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
const closeMenu = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; };
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Fechar' : 'Menu';
  nav.classList.toggle('open', open);
});
nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); }
});

/* ---------- barra: sólida depois do topo, some ao descer, volta ao subir ---------- */
const bar = document.querySelector('.topbar');
const brandImg = bar.querySelector('.brand img');
brandImg.src = 'assets/logos/simbolo-simplificado-branca-1000-transparente.png';
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  const solid = y > 60;
  bar.classList.toggle('solid', solid);
  const menuOpen = nav.classList.contains('open');
  bar.classList.toggle('hide', y > 500 && y > lastY + 4 && !menuOpen);
  if (y < lastY - 4) bar.classList.remove('hide');
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* pétalas do hero: resposta curta e suave ao cursor */
if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.petal-field').forEach(field => {
    let pointerFrame = 0;
    field.parentElement.addEventListener('pointermove', e => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        const rect = field.parentElement.getBoundingClientRect();
        field.style.setProperty('--petal-x', ((e.clientX - rect.left) / rect.width - .5).toFixed(3));
        field.style.setProperty('--petal-y', ((e.clientY - rect.top) / rect.height - .5).toFixed(3));
        pointerFrame = 0;
      });
    });
    field.parentElement.addEventListener('pointerleave', () => {
      field.style.setProperty('--petal-x', 0);
      field.style.setProperty('--petal-y', 0);
    });
  });
}

/* ---------- montador de mandala (funciona mesmo sem GSAP) ---------- */
const COLORS = [
  ['mostarda', '#F0B631'], ['rosa', '#D6336C'], ['laranja', '#EE7B22'], ['cru', '#DCCBA6'],
  ['azul', '#1F7FA6'], ['marinho', '#1B2B5E'], ['verde', '#3C8D5A'], ['vermelho', '#B3282D']
];
const pick = { rings: [0, 1, 3, 6], customColors: ['#D6336C', '#D6336C', '#D6336C', '#D6336C'], petals: 12, hoop: 'light', hoopColor: '#D6336C' };
const svg = document.getElementById('mandala');
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const rot = (i, n) => (i * 360) / n;

document.querySelectorAll('.controls fieldset[data-ring]').forEach(fs => {
  const ring = +fs.dataset.ring;
  COLORS.forEach(([name, hex], ci) => {
    const label = document.createElement('label');
    label.className = 'sw';
    label.innerHTML = `<input type="radio" name="ring${ring}" value="${ci}" ${pick.rings[ring] === ci ? 'checked' : ''}><span style="--c:${hex}"></span>`;
    label.querySelector('input').setAttribute('aria-label', name);
    fs.appendChild(label);
  });
  const customLabel = document.createElement('label');
  customLabel.className = 'sw custom-swatch';
  customLabel.innerHTML = `<input type="radio" name="ring${ring}" value="custom"><span style="--c:${pick.customColors[ring]}"></span>`;
  customLabel.querySelector('input').setAttribute('aria-label', 'Cor personalizada');
  fs.appendChild(customLabel);
  const colorPicker = document.createElement('input');
  colorPicker.className = 'ring-color-picker';
  colorPicker.type = 'color';
  colorPicker.value = pick.customColors[ring];
  colorPicker.setAttribute('aria-label', `Escolher cor personalizada para ${fs.querySelector('legend').textContent}`);
  fs.appendChild(colorPicker);
  colorPicker.addEventListener('input', e => {
    pick.customColors[ring] = e.target.value;
    customLabel.querySelector('span').style.setProperty('--c', e.target.value);
    customLabel.querySelector('input').checked = true;
    pick.rings[ring] = 'custom';
    draw(ring);
  });
  fs.addEventListener('change', e => {
    if (!e.target.matches('input[type="radio"]')) return;
    pick.rings[ring] = e.target.value === 'custom' ? 'custom' : +e.target.value;
    draw(ring);
  });
});
document.querySelectorAll('input[name="petals"]').forEach(r =>
  r.addEventListener('change', e => { pick.petals = +e.target.value; draw(-1); }));
document.querySelectorAll('input[name="hoop"]').forEach(r => r.addEventListener('change', e => { pick.hoop = e.target.value; draw(-1); }));
const hoopYarnPicker = document.getElementById('hoop-yarn-color');
hoopYarnPicker.addEventListener('input', e => {
  pick.hoopColor = e.target.value;
  document.querySelector('.yarn-swatch').style.setProperty('--c', e.target.value);
  document.querySelector('input[name="hoop"][value="yarn"]').checked = true;
  pick.hoop = 'yarn';
  draw(-1);
});

const groups = [];
function draw(changed) {
  const n = pick.petals;
  const c = pick.rings.map((i, ring) => i === 'custom' ? pick.customColors[ring] : COLORS[i][1]);
  if (changed === -1 || !groups.length) {
    svg.innerHTML = '';
    groups.length = 0;
    const hoop = el('g', {}, svg);
    el('circle', { r: 95, fill: 'none', 'data-hoop-wood': '', 'stroke-width': 5 }, hoop);
    el('circle', { r: 91.5, fill: 'none', 'data-hoop-inner': '', 'stroke-width': 1 }, hoop);
    el('circle', { r: 94, fill: 'none', 'data-hoop-yarn': '', 'stroke-width': 8, 'stroke-linecap': 'round' }, hoop);
    const mk = (cls) => { const outer = el('g', {}, svg); const inner = el('g', { class: 'spin ' + cls }, outer); groups.push(outer); return inner; };
    /* borda: pontas + fios até o aro */
    const g3 = mk('s3');
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n, b = a + Math.PI / n;
      const R = 86, r = 64, m = (a + b) / 2;
      el('path', { d: `M${Math.sin(a) * r},${-Math.cos(a) * r} L${Math.sin(m) * R},${-Math.cos(m) * R} L${Math.sin(b) * r},${-Math.cos(b) * r}Z`, 'data-f': 3 }, g3);
    }
    for (let i = 0; i < n * 2; i++) {
      const a = ((i + .5) * Math.PI) / n;
      el('line', { x1: Math.sin(a) * 86, y1: -Math.cos(a) * 86, x2: Math.sin(a) * 92, y2: -Math.cos(a) * 92, 'data-s': 3, 'stroke-width': 1.4 }, g3);
    }
    /* renda: argolas */
    const g2 = mk('s2');
    el('circle', { r: 52, fill: 'none', 'data-s': 2, 'stroke-width': 2.2 }, g2);
    for (let i = 0; i < n; i++) {
      const a = (i * 2 * Math.PI) / n;
      el('circle', { cx: Math.sin(a) * 52, cy: -Math.cos(a) * 52, r: 62 / n * 2.1 + 3.5, fill: 'none', 'data-s': 2, 'stroke-width': 3.4 }, g2);
    }
    /* miolo: pétalas */
    const g1 = mk('s1');
    const w = 130 / n;
    for (let i = 0; i < n; i++) {
      el('path', { d: `M0,-14 C${w},-22 ${w},-36 0,-44 C${-w},-36 ${-w},-22 0,-14Z`, transform: `rotate(${rot(i, n)})`, 'data-f': 1 }, g1);
    }
    /* centro */
    const g0 = mk('s0');
    el('circle', { r: 15, 'data-f': 0 }, g0);
    el('circle', { r: 8, fill: 'none', stroke: 'rgba(255,255,255,.55)', 'stroke-width': 2 }, g0);
  }
  svg.querySelectorAll('[data-f]').forEach(p => p.setAttribute('fill', c[+p.dataset.f]));
  svg.querySelectorAll('[data-s]').forEach(p => p.setAttribute('stroke', c[+p.dataset.s]));
  const wood = { light: ['#C79A5E', '#A97B43', 'carvalho claro'], honey: ['#A97B43', '#754A2D', 'madeira mel'], dark: ['#754A2D', '#4B2D1B', 'nogueira escura'] };
  const [woodColor, innerWood] = wood[pick.hoop] || wood.light;
  svg.querySelector('[data-hoop-wood]').setAttribute('stroke', woodColor);
  svg.querySelector('[data-hoop-inner]').setAttribute('stroke', innerWood);
  svg.querySelector('[data-hoop-yarn]').setAttribute('stroke', pick.hoopColor);
  svg.querySelector('[data-hoop-yarn]').setAttribute('opacity', pick.hoop === 'yarn' ? '1' : '0');
  const names = pick.rings.map((i, ring) => i === 'custom' ? 'personalizada' : COLORS[i][0]);
  const hoopName = pick.hoop === 'yarn' ? 'coberto de linha' : (wood[pick.hoop] || wood.light)[2];
  const phrase = `centro ${names[0]}, miolo ${names[1]}, renda ${names[2]} e borda ${names[3]}, aro ${hoopName}, com ${n} pétalas`;
  document.getElementById('pick-text').textContent = `Mandala com ${phrase}.`;
  setCta(`Oi, Mari! Quero uma mandala com ${phrase}.`);
  if (hasGsap && !reduced) {
    if (changed === -1) {
      groups.forEach((g, i) => gsap.fromTo(g, { scale: 0, rotation: -50, opacity: 0, svgOrigin: '0 0' }, { scale: 1, rotation: 0, opacity: 1, svgOrigin: '0 0', duration: .9, delay: (3 - i) * .12, ease: 'back.out(1.5)' }));
    } else if (changed >= 0) {
      gsap.fromTo(groups[3 - changed], { scale: .9, svgOrigin: '0 0' }, { scale: 1, svgOrigin: '0 0', duration: .7, ease: 'elastic.out(1,.45)' });
    }
  }
}

/* ---------- contato ---------- */
const ctaBtn = document.getElementById('pick-cta');
const ctaWord = document.getElementById('cta-word');
const status = document.getElementById('contact-status');
let lastMsg = 'Oi, Mari! Vim pelo site e queria conversar.';
const waHref = msg => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;
function setCta(msg) {
  lastMsg = msg;
  if (CONTACT.whatsapp) { ctaBtn.href = waHref(msg); ctaBtn.target = '_blank'; ctaBtn.rel = 'noopener'; ctaBtn.textContent = 'Pedir no WhatsApp'; }
}
if (CONTACT.whatsapp || CONTACT.instagram) {
  const a = document.createElement('a');
  a.className = 'cta-word';
  a.id = 'cta-word';
  a.textContent = ctaWord.textContent;
  a.href = CONTACT.whatsapp ? waHref('Oi, Mari! Vim pelo site e queria conversar.') : `https://instagram.com/${CONTACT.instagram}`;
  a.target = '_blank'; a.rel = 'noopener';
  ctaWord.replaceWith(a);
  const links = document.createElement('div');
  links.className = 'contact-links';
  if (CONTACT.whatsapp) links.insertAdjacentHTML('beforeend', `<a class="btn btn-light" target="_blank" rel="noopener" href="${waHref('Oi, Mari! Vim pelo site e queria conversar.')}">WhatsApp</a>`);
  if (CONTACT.instagram) links.insertAdjacentHTML('beforeend', `<a class="btn btn-light" target="_blank" rel="noopener" href="https://instagram.com/${CONTACT.instagram}">Instagram</a>`);
  status.replaceWith(links);
}
draw(-1);

/* galeria: expansão tem controle próprio; destinos ficam em links separados */
const accItems = [...document.querySelectorAll('.acc li')];
const openAcc = li => accItems.forEach(x => {
  const active = x === li;
  x.classList.toggle('is-on', active);
  x.querySelector('.acc-trigger').setAttribute('aria-expanded', String(active));
  const v = x.querySelector('video');
  if (v) { if (active && !reduced) v.play().catch(() => {}); else v.pause(); }
});
/* vídeos do processo: tocam juntos só enquanto a seção está à vista */
const processVideos = [...document.querySelectorAll('.process video')];
if (processVideos.length && 'IntersectionObserver' in window) {
  processVideos.forEach(v => { v.preload = 'metadata'; });
  new IntersectionObserver(([e]) => {
    processVideos.forEach(v => {
      if (e.isIntersecting && !reduced) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
    });
  }, { threshold: .15 }).observe(document.querySelector('.process'));
}
/* vídeos da galeria: começam a baixar quando a galeria se aproxima, para tocar na hora do hover */
const accVideos = document.querySelectorAll('.acc video');
if (accVideos.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    io.disconnect();
    accVideos.forEach(v => { v.preload = 'auto'; v.load(); });
  }, { rootMargin: '600px 0px' });
  io.observe(document.querySelector('.acc'));
}
accItems.forEach(li => {
  li.addEventListener('mouseenter', () => { if (window.matchMedia('(hover: hover)').matches) openAcc(li); });
  li.querySelector('.acc-trigger').addEventListener('click', () => openAcc(li));
});

/* ---------- movimento ---------- */
if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);

  /* rolagem suave */
  let lenis = null;
  if (!reduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.4 }); else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* meu processo: profundidade leve nos vídeos */
  if (!reduced) {
    document.querySelectorAll('.process-media figure').forEach(f => {
      gsap.fromTo(f, { y: () => f.dataset.speed * 4 }, { y: () => f.dataset.speed * -4, ease: 'none', scrollTrigger: { trigger: '.process', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }


  if (!reduced) {
    /* primeira tela */
    const h1 = document.querySelector('[data-split]');
    const text = h1.textContent.trim();
    h1.setAttribute('aria-label', text);
    h1.innerHTML = text.split(' ').map(w => `<span class="word"><span>${w}</span></span>`).join(' ');
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: .15 });
    tl.to('.hero .word > span', { y: 0, yPercent: 0, duration: 1.1, stagger: .09 })
      .to('[data-hero]', { opacity: 1, y: 0, duration: .9, stagger: .12 }, '-=.7')
      .from('.hero-disc', { scale: .7, rotation: -14, duration: 1.3, ease: 'back.out(1.2)' }, '-=1.2');
    gsap.to('.disc-photo img', { yPercent: -3, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-disc', { y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* faixa do lema acelera com a rolagem */
    const track = document.querySelector('.band-track');
    ScrollTrigger.create({
      trigger: '.band', start: 'top bottom', end: 'bottom top',
      onUpdate: self => gsap.to(track, { skewX: gsap.utils.clamp(-8, 8, self.getVelocity() / -320), duration: .4, overwrite: 'auto' }),
      onLeave: () => gsap.to(track, { skewX: 0, duration: .5 }), onLeaveBack: () => gsap.to(track, { skewX: 0, duration: .5 })
    });

    /* entradas */
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: .12, ease: 'power3.out', overwrite: true })
    });
    gsap.from('.acc li', { y: 70, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.acc', start: 'top 85%', once: true } });
    gsap.from('.workshop-photo', { scale: .75, opacity: 0, duration: 1.3, ease: 'power4.out', scrollTrigger: { trigger: '.workshop-photo', start: 'top 85%', once: true } });
    gsap.from('.about-photo img', { yPercent: 10, scale: 1.2, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.cta-word', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: '.contact', start: 'top 70%', once: true } });
    gsap.from('.foot-name', { yPercent: 35, duration: 1.4, ease: 'power4.out', scrollTrigger: { trigger: 'footer', start: 'top 85%', once: true } });
    gsap.from('.build-art svg', { opacity: 0, scale: .88, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.build', start: 'top 70%', once: true } });

    /* botões magnéticos */
    if (window.matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.btn').forEach(b => {
        const qx = gsap.quickTo(b, 'x', { duration: .4, ease: 'power3' });
        const qy = gsap.quickTo(b, 'y', { duration: .4, ease: 'power3' });
        b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .22); qy((e.clientY - r.top - r.height / 2) * .35); });
        b.addEventListener('mouseleave', () => { qx(0); qy(0); });
      });
    }
  }
}
