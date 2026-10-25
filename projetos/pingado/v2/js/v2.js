// Pingado v2 — a mesma página do projeto, remontada com as técnicas de scroll do neutomni.com.
// Conteúdo: JSON em #estado (pares {pt, en}). Motor: Lenis + GSAP/ScrollTrigger/SplitText.
// Sem GSAP (CDN fora do ar), movimento reduzido ou ?estatico: a página aparece inteira, sem animação.

const estado = JSON.parse(document.getElementById('estado').textContent);
const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
const animar = !reduz && !params.has('estatico') && window.gsap && window.ScrollTrigger && window.SplitText;

let lang = params.get('lang') || lerPref() || estado.lang;
function lerPref() { try { return localStorage.getItem('pingado-lang'); } catch { return null; } }
function gravarPref(v) { try { localStorage.setItem('pingado-lang', v); } catch { /* sem storage, segue */ } }
const t = (p) => (typeof p === 'string' ? p : p[lang]);
const L = (pt, en) => (lang === 'en' ? en : pt);

// as duas últimas palavras viram serifa itálica (o "as much as we do" do original)
const acento = (txt) => {
  const w = txt.replace(/&#8209;/g, '-').split(' ');
  if (w.length < 3) return txt;
  return `${w.slice(0, -2).join(' ')} <em class="it">${w.slice(-2).join(' ')}</em>`;
};

// ---------- horário da loja (America/Sao_Paulo) ----------
// seg–sex 7h–0h · sáb 8h–1h · dom 9h–18h
function statusLoja() {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  const dia = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }[p.weekday];
  const min = (+p.hour % 24) * 60 + +p.minute;
  const faixas = { 0: [540, 1080], 6: [480, 1500] };
  const [ini, fim] = faixas[dia] || [420, 1440];
  // madrugada do dia seguinte: sexta→sábado até 0h, sábado→domingo até 1h
  const madrugadaSab = dia === 0 && min < 60;
  const aberto = madrugadaSab || (min >= ini && min < fim);
  return { hora: `${p.hour}:${p.minute}:${p.second}`, aberto };
}

// ---------- montagem ----------
function desenhar() {
  const e = estado;
  document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
  document.title = L('Pingado — café de rua', 'Pingado — street coffee');
  const sel = `${L('aberto até meia-noite', 'open till midnight')} • ${L('café de rua', 'street coffee')} • `.toUpperCase();
  const marq = ['PINGADO', L('CAFÉ DE RUA', 'STREET COFFEE'), L('PELA JANELA', 'THROUGH THE WINDOW'), 'VILA MADALENA'];
  const faixa = marq.map((m) => `<span>${m}</span>`).join('');

  app.innerHTML = `
  <header class="topo">
    <a class="marca" href="#topo" aria-label="Pingado"><img src="../img/pingado-wordmark-branco.svg" alt=""></a>
    <nav id="nav">${e.nav.map((n) => `<a href="#${n.id}">${t(n)}</a>`).join('')}</nav>
    <div class="idioma" role="group" aria-label="${L('Idioma', 'Language')}">
      <button data-lang="pt" aria-pressed="${lang === 'pt'}"><span>PT</span></button>
      <button data-lang="en" aria-pressed="${lang === 'en'}"><span>EN</span></button>
    </div>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav" aria-label="${L('Abrir navegação', 'Open navigation')}"><span></span><span></span></button>
  </header>

  <main>
    <section class="hero" id="topo" data-nav="escuro">
      <div class="hero-foto"><img src="../img/janela-noite.webp" alt="${L('A janela do Pingado à noite, com gente tomando café na calçada', 'The Pingado window at night, with people drinking coffee on the sidewalk')}"></div>
      <div class="selo-giro" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="100" fill="#FF4FA3"/>
          <defs><path id="anel" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"/></defs>
          <text><textPath href="#anel" textLength="436" lengthAdjust="spacing">${sel}</textPath></text>
        </svg>
      </div>
      <div class="hero-meio">
        <h1 data-hero>${acento(t(e.hero.linha))}</h1>
        <div class="relogio" data-hero>
          <b class="hora">--:--:--</b>
          <span class="rotulo status">…</span>
        </div>
      </div>
      <h2 class="wordmark" aria-label="pingado"></h2>
    </section>

    <div class="marquee" aria-hidden="true"><div class="marquee-trilho">${faixa}${faixa}${faixa}${faixa}</div></div>

    <section class="como" data-nav="escuro">
      <div class="como-pin">
        <div class="como-titulo">
          <h2 data-reveal>${acento(t(e.como.titulo))}</h2>
          <p class="dica rotulo">${L('role para a roda aprender o caminho', 'scroll and let the wheel learn the road')}</p>
        </div>
        <canvas id="roda" aria-hidden="true"></canvas>
        <div class="passos">${e.como.passos.map((p, i) => `<div class="passo"><b>0${i + 1}</b>${t(p)}</div>`).join('')}</div>
      </div>
    </section>

    <section class="fila claro" data-nav="claro">
      <div class="envolve">
        <div class="moldura"><img src="../img/fila-dia.webp" alt="${L('Fila na janela no fim de tarde', 'People queuing at the window in the late afternoon')}" loading="lazy"></div>
        <div>
          <p data-reveal>${acento(t(e.calcada.titulo))}</p>
          <small>${t(e.como.foto)}</small>
        </div>
      </div>
    </section>

    <section class="parede" id="cardapio" data-nav="escuro">
      <div class="envolve">
        <div class="cartaz">
          <h2 data-reveal>${t(e.cardapio.titulo)}</h2>
          <div class="grupos">
            ${e.cardapio.grupos.map((g) => `
              <div>
                <h3>${t(g.nome)}</h3>
                ${g.itens.map((i) => `<div class="item" data-item><b>${t(i.nome)}</b><span class="preco">${i.preco}</span><span>${t(i.desc)}</span></div>`).join('')}
              </div>`).join('')}
          </div>
          <p class="nota">${t(e.cardapio.nota)}</p>
        </div>
      </div>
    </section>

    <section class="fala" data-nav="claro">
      <div class="fala-bg"></div>
      <img src="../img/amigos-noite.webp" alt="${L('Amigos rindo com copos de café na calçada, à noite', 'Friends laughing with coffee cups on the sidewalk at night')}" loading="lazy">
      <div>
        <h2 data-reveal>${acento(L('Sem mesa e sem pressa. Só café e conversa.', 'No tables, no rush. Just coffee and talk.'))}</h2>
        <p data-reveal>${t(e.calcada.texto)}</p>
      </div>
    </section>

    <section class="graos claro" id="graos" data-nav="claro">
      <div class="envolve">
        <div class="fotos">
          <div class="moldura"><img src="../img/saco-cafe.webp" alt="${L('Pacote de café Pingado sobre um skate', 'A bag of Pingado coffee on a skateboard')}" loading="lazy"></div>
          <div class="moldura"><img src="../img/espresso.webp" alt="${L('Espresso caindo no copo', 'Espresso pouring into a glass')}" loading="lazy"></div>
        </div>
        <div>
          <h2 data-reveal>${t(e.graos.titulo)}</h2>
          <p class="nome">${e.graos.nome}</p>
          <p class="notas" data-reveal>${t(e.graos.notas)}</p>
          <p class="texto" data-reveal>${t(e.graos.texto)}</p>
          <dl class="ficha">${e.graos.ficha.map((f) => `<div data-item><dt>${t(f.k)}</dt><dd>${t(f.v)}</dd></div>`).join('')}</dl>
          <a class="botao escuro" href="#onde">${t(e.graos.cta)}</a>
        </div>
      </div>
    </section>

    <section class="merch" id="merch" data-nav="escuro">
      <div class="merch-pin">
        <div>
          <h2 data-reveal>${acento(t(e.merch.titulo))}</h2>
          <ol class="merch-lista">${e.merch.itens.map((m) => `<li><b>${t(m.nome)}</b><span>${t(m.preco)}</span></li>`).join('')}</ol>
        </div>
        <div class="merch-palco">
          <img class="adesivo" src="../img/pingado-selo-acido.svg" alt="">
          ${e.merch.itens.map((m) => `<div class="slide_mask"><img src="../img/${m.img}.webp" alt="${t(m.nome)}" loading="lazy"></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="onde" id="onde" data-nav="claro">
      <div class="envolve">
        <div>
          <h2 data-reveal>${e.onde.titulo}</h2>
          <p class="sub">${t(e.onde.sub)}</p>
          <a class="botao escuro" href="https://www.google.com/maps/search/Rua+Harmonia+Vila+Madalena+São+Paulo" target="_blank" rel="noopener">${t(e.onde.cta)}</a>
          <span class="insta">${e.onde.insta}</span>
        </div>
        <dl class="horarios">${e.onde.horarios.map((h) => `<div data-item><dt>${t(h.d)}</dt><dd>${t(h.h)}</dd></div>`).join('')}</dl>
      </div>
    </section>
  </main>

  <footer class="rodape">
    <img class="grande" src="../img/pingado-wordmark-preto.svg" alt="">
    <div class="linha">
      <p>${t(e.rodape)}</p>
      <img src="../img/pingado-selo-chiclete.svg" alt="">
    </div>
  </footer>`;

  carregarWordmark().then(() => { if (animar && tocarEntrada) entradaHero(); });
  ligarUI();
  relogio();
}

// wordmark inline: path[0] = letras, path[1] = gota (cai separada, pousa no "ı")
let svgWordmark = null;
async function carregarWordmark() {
  const alvo = app.querySelector('.wordmark');
  try {
    if (!svgWordmark) {
      const r = await fetch('../img/pingado-wordmark-branco.svg');
      if (!r.ok) throw new Error(r.status);
      svgWordmark = await r.text();
    }
    alvo.innerHTML = svgWordmark;
    const svg = alvo.querySelector('svg');
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('aria-hidden', 'true');
    const [letras, gota] = svg.querySelectorAll('path');
    // a gota já tem transform próprio (translate + scale 2.357); animar o path direto sobrescreveria
    // essa escala e a gota encolheria. Um <g> em volta recebe a animação sem tocar no transform dela.
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'gota');
    gota.replaceWith(g);
    g.appendChild(gota);
    letras.classList.add('letras');
  } catch {
    alvo.innerHTML = '<img src="../img/pingado-wordmark-branco.svg" alt="">';
  }
}

// ---------- UI (idioma, menu, relógio) ----------
let timerRelogio = null;
function relogio() {
  clearInterval(timerRelogio);
  const tick = () => {
    const h = app.querySelector('.hora'); const s = app.querySelector('.status');
    if (!h) return;
    const st = statusLoja();
    h.textContent = st.hora;
    s.textContent = `${st.aberto ? L('aberto agora', 'open now') : L('fechado agora', 'closed now')} · BRT`;
    s.classList.toggle('fechado', !st.aberto);
  };
  tick();
  timerRelogio = setInterval(tick, 1000);
}

function ligarUI() {
  const nav = app.querySelector('#nav'); const menu = app.querySelector('.menu-btn');
  app.querySelectorAll('.idioma button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang; gravarPref(lang);
    const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
    const y = scrollY;
    recomecar(false);
    scrollTo(0, y);
  }));
  menu.addEventListener('click', () => {
    const aberto = nav.classList.toggle('aberto');
    menu.setAttribute('aria-expanded', aberto);
    if (lenis) aberto ? lenis.stop() : lenis.start();
  });
  nav.addEventListener('click', (ev) => {
    if (ev.target.closest('a')) { nav.classList.remove('aberto'); menu.setAttribute('aria-expanded', 'false'); lenis?.start(); }
  });
}

// ---------- rolagem suave (Lenis amarrado ao ticker do GSAP) ----------
let lenis = null;
if (animar && window.Lenis) {
  lenis = new Lenis({ lerp: matchMedia('(max-width: 768px)').matches ? 0.3 : 0.08 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((tempo) => lenis.raf(tempo * 1000));
  gsap.ticker.lagSmoothing(0);
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href^="#"]');
    const alvo = a && document.querySelector(a.getAttribute('href'));
    if (!alvo) return;
    ev.preventDefault();
    lenis.scrollTo(alvo, { offset: a.getAttribute('href') === '#topo' ? 0 : -60, duration: 1.4 });
  });
}

// ---------- animações ----------
let ctx = null;
const limpezas = [];
let tocarEntrada = false;
const HIDDEN = 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)';
const FULL = 'polygon(0% 0%, 100% 0%, 100% 101%, 0% 101%)';

function iniciarAnimacoes() {
  if (!animar) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ctx = gsap.context(() => {
    revelarTextos();
    itensEmCascata();
    navPorSecao();
    parallax();
    roda();
    vitrine();
  }, app);
  ScrollTrigger.refresh();
}

// texto que entra por linha: blur 10px + 15px de queda (o [data-reveal="blur"] do original)
function revelarTextos() {
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(self.lines, { opacity: 0, filter: 'blur(10px)', y: 15 },
          { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.5, ease: 'power1.out', stagger: 0.12,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      },
    });
  });
}

function itensEmCascata() {
  const grupos = new Map();
  gsap.utils.toArray('[data-item]').forEach((el) => {
    const pai = el.parentElement;
    if (!grupos.has(pai)) grupos.set(pai, []);
    grupos.get(pai).push(el);
  });
  grupos.forEach((els, pai) => {
    gsap.from(els, { opacity: 0, y: 18, duration: 0.5, ease: 'power2.out', stagger: 0.07,
      scrollTrigger: { trigger: pai, start: 'top 85%', once: true } });
  });
}

// o topo ganha a barra de fundo depois de sair do hero
function navPorSecao() {
  const topo = app.querySelector('.topo');
  ScrollTrigger.create({ trigger: document.body, start: 'top -40px', end: 'max', toggleClass: { targets: topo, className: 'rolou' } });
}

function parallax() {
  gsap.to('.hero-foto', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.fromTo('.fila .moldura img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.fila', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.fala-bg', { rotate: -6, scale: 1 }, { rotate: 8, scale: 1.2, ease: 'none', scrollTrigger: { trigger: '.fala', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.cartaz', { rotate: -4 }, { rotate: -1.2, ease: 'none', scrollTrigger: { trigger: '.parede', start: 'top bottom', end: 'center center', scrub: true } });
}

// ----- a roda: polígono de 4 lados que vira círculo conforme rola ao longo da linha -----
function roda() {
  const secao = app.querySelector('.como');
  const canvas = app.querySelector('#roda');
  const passos = gsap.utils.toArray('.passo');
  const c = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, alvo = 0, prog = 0;
  // o selo vem em duas camadas: miolo (disco + copo + gota) sempre visível; anel + texto só entram
  // quando o polígono chega a 10 lados, com blur. Sem fetch (file://) cai no selo inteiro.
  const logo = new Image();       // miolo
  const anel = new Image();       // anel + texto
  let anelPronto = false;
  const dataUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  fetch('../img/pingado-selo-acido.svg').then((r) => r.text()).then((svg) => {
    const aro = svg.match(/<circle[^>]*r="111"[^>]*\/>/);
    const texto = svg.match(/<g fill="#111111">[\s\S]*?<\/g>/);
    if (!aro || !texto) throw new Error('selo sem as camadas esperadas');
    const cab = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">';
    logo.onload = () => desenhar();
    anel.onload = () => { anelPronto = true; desenhar(); };
    logo.src = dataUrl(svg.replace(aro[0], '').replace(texto[0], ''));
    anel.src = dataUrl(cab + aro[0] + texto[0] + '</svg>');
  }).catch(() => {
    logo.onload = () => desenhar();
    logo.src = '../img/pingado-selo-acido.svg';
  });

  const medir = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  // raio de um k-gono regular na direção a (a em relação ao primeiro vértice)
  const raioK = (k, a, R) => {
    const s = (Math.PI * 2) / k;
    const m = (((a % s) + s) % s) - s / 2;
    return (R * Math.cos(Math.PI / k)) / Math.cos(m);
  };
  const desenhar = () => {
    c.clearRect(0, 0, W, H);
    const mobile = W < 760;
    const R = Math.min(mobile ? 58 : 96, H * 0.16);
    const chao = H * (mobile ? 0.52 : 0.6);
    const x0 = R + 24, x1 = W - R - 24;
    const x = x0 + (x1 - x0) * prog;
    // quantidade de lados: 4 → 48 (mistura dois inteiros vizinhos para não dar salto)
    const kf = 4 + 44 * Math.pow(prog, 1.4);
    const kA = Math.floor(kf), fr = kf - kA;
    // a roda termina com o selo em pé: o giro total é arredondado para voltas inteiras
    const voltas = Math.max(1, Math.round((x1 - x0) / R / (Math.PI * 2)));
    const rot = prog * voltas * Math.PI * 2;
    const N = 160;
    const pts = [];
    let maxY = -Infinity;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const r = raioK(kA, a, R) * (1 - fr) + raioK(kA + 1, a, R) * fr;
      const px = Math.cos(a + rot) * r, py = Math.sin(a + rot) * r;
      pts.push([px, py]); if (py > maxY) maxY = py;
    }
    const cy = chao - maxY; // o ponto mais baixo sempre encosta no chão: a roda "quica" nos vértices
    // linha do chão (cheia até a roda, tracejada depois)
    c.lineWidth = 2; c.strokeStyle = '#F2F0EA';
    c.beginPath(); c.moveTo(0, chao); c.lineTo(x, chao); c.stroke();
    c.setLineDash([3, 7]); c.beginPath(); c.moveTo(x, chao); c.lineTo(W, chao); c.stroke(); c.setLineDash([]);
    // roda: o selo circular da marca, recortado pelo polígono e girando com ele
    c.save(); c.translate(x, cy);
    c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath();
    if (logo.complete && logo.naturalWidth) {
      c.clip();
      c.rotate(rot);
      c.drawImage(logo, -R, -R, R * 2, R * 2);
      if (anelPronto) {
        // 10 lados = aparece; até ~15 lados o blur some e o texto fica nítido
        const u = Math.min(1, Math.max(0, (kf - 10) / 5));
        const e = u * u * (3 - 2 * u);
        if (e > 0) {
          c.globalAlpha = e;
          if ('filter' in c) c.filter = `blur(${((1 - e) * 12 * (R / 96)).toFixed(2)}px)`;
          c.drawImage(anel, -R, -R, R * 2, R * 2);
          c.filter = 'none'; c.globalAlpha = 1;
        }
      }
    } else {
      c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = '#C6F432'; c.stroke();
    }
    c.restore();
  };
  let raf = 0;
  const loop = () => {
    prog += (alvo - prog) * 0.14;
    desenhar();
    if (Math.abs(alvo - prog) > 0.0005) raf = requestAnimationFrame(loop); else { prog = alvo; desenhar(); raf = 0; }
  };
  const pedir = () => { if (!raf) raf = requestAnimationFrame(loop); };

  medir(); desenhar();
  const ro = new ResizeObserver(() => { medir(); desenhar(); });
  ro.observe(canvas);
  limpezas.push(() => { ro.disconnect(); cancelAnimationFrame(raf); });

  gsap.set(passos, { opacity: 0, y: 24, filter: 'blur(8px)' });
  ScrollTrigger.create({
    trigger: secao, start: 'top top', end: 'bottom bottom',
    onUpdate(self) {
      alvo = self.progress; pedir();
      passos.forEach((p, i) => {
        const on = self.progress > 0.12 + i * 0.26;
        if (p._on !== on) {
          p._on = on;
          gsap.to(p, { opacity: on ? 1 : 0, y: on ? 0 : 24, filter: on ? 'blur(0px)' : 'blur(8px)', duration: 0.5, ease: 'power2.out', overwrite: true });
        }
      });
    },
  });
}

// ----- vitrine do merch: uma foto por gesto, revelada por clip-path (só desktop) -----
function vitrine() {
  gsap.matchMedia().add('(min-width: 992px)', () => {
    const pin = app.querySelector('.merch-pin');
    const masks = gsap.utils.toArray('.merch .slide_mask');
    const imgs = masks.map((m) => m.querySelector('img'));
    const itens = gsap.utils.toArray('.merch-lista li');
    if (!pin || !masks.length) return;
    gsap.set(masks, { clipPath: HIDDEN });
    gsap.set(imgs, { scale: 1.12 });
    gsap.set(itens, { opacity: 0.28 });
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut', duration: 0.9 },
      scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${innerHeight * masks.length * 0.9}`, pin: true, scrub: true, anticipatePin: 1 },
    });
    masks.forEach((m, i) => {
      tl.to(m, { clipPath: FULL }, i)
        .to(imgs[i], { scale: 1, ease: 'none' }, i)
        .to(itens[i], { opacity: 1, duration: 0.3, ease: 'none' }, i);
      if (i > 0) tl.to(itens[i - 1], { opacity: 0.28, duration: 0.3, ease: 'none' }, i);
      tl.to({}, { duration: 0.2 }, i + 0.9); // pausa: a foto descansa antes da próxima
    });
  });
}

// ----- abertura: contador → cortina sobe → gota cai no ı -----
let primeiraVez = true;
let heroPronto = null;
function entradaHero() {
  // chamado quando o wordmark inline existe; espera a cortina do loader terminar
  const rodar = () => {
    const letras = app.querySelector('.wordmark .letras');
    const gota = app.querySelector('.wordmark .gota');
    const tl = gsap.timeline();
    tl.fromTo('.wordmark', { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0);
    if (letras) tl.fromTo(letras, { y: 260 }, { y: 0, duration: 0.9, ease: 'power3.out' }, 0);
    if (gota) {
      gsap.set(gota, { transformOrigin: '50% 100%' });
      tl.fromTo(gota, { y: -700, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.in' }, 0.5)
        .to(gota, { scaleX: 1.2, scaleY: 0.76, duration: 0.09, ease: 'power1.out' })
        .to(gota, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'elastic.out(1,.4)' });
    }
    tl.fromTo('.hero-foto img', { scale: 1.15 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, 0);
    tl.fromTo('[data-hero]', { opacity: 0, filter: 'blur(10px)', y: 15 },
      { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.6, ease: 'power1.out', stagger: 0.15 }, 0.3);
    tl.fromTo('.selo-giro', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.8)' }, 0.9);
  };
  if (heroPronto) heroPronto.then(rodar); else rodar();
}

function loader() {
  const el = document.createElement('div');
  el.className = 'loader';
  el.innerHTML = `<span class="rotulo">pingado · ${L('café de rua', 'street coffee')}</span>
    <div><div class="num">000</div></div>
    <div class="legenda rotulo"><span>${L('esquentando a máquina', 'warming up the machine')}</span><span>Vila Madalena, SP</span></div>`;
  document.body.appendChild(el);
  lenis?.stop();
  let pronto; heroPronto = new Promise((r) => { pronto = r; });
  const num = el.querySelector('.num');
  const p = { v: 0 };
  gsap.timeline()
    .to(p, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: () => { num.textContent = String(Math.round(p.v)).padStart(3, '0'); } })
    .to(el, { yPercent: -100, duration: 0.8, ease: 'power3.inOut', onStart: () => pronto() })
    .add(() => { el.remove(); lenis?.start(); });
}

// ---------- ciclo de vida ----------
function recomecar(comLoader) {
  tocarEntrada = comLoader;
  limpezas.splice(0).forEach((f) => f());
  ctx?.revert();
  ScrollTrigger?.getAll?.().forEach((s) => s.kill());
  desenhar();
  if (animar) {
    if (comLoader) { loader(); }
    // um respiro para o layout assentar (fontes, imagens) antes de medir os gatilhos
    setTimeout(iniciarAnimacoes, 60);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }
}
recomecar(primeiraVez && animar);
primeiraVez = false;
