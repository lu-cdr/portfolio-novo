/* Camada de motion: efeitos da biblioteca Kinetics (kinetics.colorion.co) adaptados aos tokens do
   portfólio. O CSS faz quase tudo (css/style.css, bloco "motion"); aqui só o que precisa de estado:

   - Tab Pill Glide: a pílula do menu mede o link da seção visível e desliza até ele; com o mouse
     em cima de outro link, segue o mouse e volta quando ele sai;
   - Stagger Entrance: habilidades e dados do Sobre sobem em sequência quando entram na tela;
   - Choice Chips: o chip "pula" (escala com mola) ao ligar e desligar;
   - Submit States: o botão de enviar mostra pontinhos, depois um check, e volta;
   - (o Copy Button do pop-up da mensagem pronta fica no js/comum.js, junto do pop-up).

   Os cards dos trabalhos (Stagger + Clip Wipe + Number Counter), a frase do hero (Text Split
   Reveal), Hover Lift, Shine Sweep e Underline Draw são só CSS, ligados pela classe .ativo que o
   js/trabalhos.js põe. Este arquivo carrega antes do js/comum.js e se liga a cada 'portfolio:montado'
   (a troca de idioma refaz a página). Com movimento reduzido, nada daqui roda. */
(function () {
  'use strict';
  const ICONE_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  let desligar = [];

  document.addEventListener('portfolio:montado', (e) => {
    desligar.forEach((f) => f());
    desligar = [];
    if (e.detail && e.detail.reduzido) return;
    pilulaDoMenu();
    entradas();
    chips();
    enviar();
  });

  /* ---------- Tab Pill Glide no menu (só no computador: no celular o menu é um painel) */
  function pilulaDoMenu() {
    const nav = document.querySelector('.topo .nav');
    if (!nav || !matchMedia('(min-width: 900px)').matches) return;
    const links = [...nav.querySelectorAll('.nav-painel > a:not(.cta)')];
    if (!links.length) return;
    const pil = document.createElement('span');
    pil.className = 'nav-pilula';
    pil.setAttribute('aria-hidden', 'true');
    nav.prepend(pil);
    // a página atual (marcada pelo js/comum.js) é o lugar de descanso da pílula; âncoras desta
    // página (Sobre, no Início) passam na frente enquanto a seção delas está à vista
    const daPagina = links.find((a) => a.classList.contains('atual')) || null;
    let ativo = null, sobre = null;
    // sem nada marcado (Início no topo), sair de um link esconde a pílula só depois de um instante:
    // passando de um link para o vizinho ela desliza até ele em vez de sumir e reaparecer no lugar
    let escondida = true, sumir = null;
    const ir = (a) => {
      clearTimeout(sumir);
      if (!a) { sumir = setTimeout(() => { pil.classList.remove('visivel'); escondida = true; }, 220); return; }
      const base = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
      // primeira aparição: nasce já no lugar (sem deslizar da esquerda), depois desliza
      if (escondida) { pil.style.transition = 'opacity .25s'; requestAnimationFrame(() => requestAnimationFrame(() => { pil.style.transition = ''; })); }
      escondida = false;
      pil.style.width = r.width + 'px';
      pil.style.transform = `translateX(${r.left - base.left}px)`;
      pil.classList.add('visivel');
    };
    const atualizar = () => ir(sobre || ativo || daPagina);
    for (const a of links) {
      a.addEventListener('pointerenter', () => { sobre = a; atualizar(); });
      a.addEventListener('pointerleave', () => { sobre = null; atualizar(); });
    }
    // seção visível: a que cruza a faixa do meio da janela
    const alvos = links.filter((a) => a.getAttribute('href').startsWith('#'))
      .map((a) => [a, document.querySelector(a.getAttribute('href'))]).filter(([, s]) => s);
    const io = new IntersectionObserver((itens) => {
      for (const it of itens) {
        const par = alvos.find(([, s]) => s === it.target);
        if (it.isIntersecting) ativo = par[0];
        else if (ativo === par[0]) ativo = null;
      }
      links.forEach((a) => { if (a !== daPagina) a.classList.toggle('atual', a === ativo); });
      atualizar();
    }, { rootMargin: '-45% 0px -45% 0px' });
    alvos.forEach(([, s]) => io.observe(s));
    // sem âncoras à vista (Trabalhos, Orçamento) a pílula já nasce na página atual
    requestAnimationFrame(atualizar);
    const redimensionar = () => atualizar();
    addEventListener('resize', redimensionar);
    desligar.push(() => { io.disconnect(); removeEventListener('resize', redimensionar); });
  }

  /* ---------- Stagger Entrance: listas do Sobre sobem em sequência ao entrar na tela */
  function entradas() {
    const grupos = document.querySelectorAll('.habilidades ol, .sobre-dados, .sobre-texto');
    const io = new IntersectionObserver((itens) => {
      for (const it of itens) {
        if (!it.isIntersecting) continue;
        it.target.classList.add('entrou');
        io.unobserve(it.target);
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    grupos.forEach((g) => {
      g.classList.add('escalonado');
      [...g.children].forEach((c, i) => c.style.setProperty('--i', i));
      io.observe(g);
    });
    desligar.push(() => io.disconnect());
  }

  /* ---------- Choice Chips: pulo de mola ao ligar/desligar */
  function chips() {
    const form = document.querySelector('.contato .form');
    if (!form) return;
    form.addEventListener('click', (e) => {
      const b = e.target.closest('.pilula');
      if (!b) return;
      b.classList.remove('pulo');
      void b.offsetWidth;   // reinicia a animação se o clique vier no meio da anterior
      b.classList.add('pulo');
      b.addEventListener('animationend', () => b.classList.remove('pulo'), { once: true });
    });
  }

  /* ---------- Submit States no enviar */
  function enviar() {
    const form = document.querySelector('.contato .form');
    const botao = form && form.querySelector('.enviar');
    if (!botao) return;
    botao.innerHTML = `<span class="rotulo">${botao.textContent}</span><span class="pontos" aria-hidden="true"><i></i><i></i><i></i></span><span class="feito" aria-hidden="true">${ICONE_CHECK}</span>`;
    let t1, t2;
    // o js/comum.js abre o pop-up da mensagem pronta no mesmo submit (só se o formulário estiver
    // completo; senão ele para o evento antes daqui): aqui só o estado do botão
    form.addEventListener('submit', () => {
      clearTimeout(t1); clearTimeout(t2);
      botao.classList.remove('feito-on');
      botao.classList.add('enviando');
      t1 = setTimeout(() => { botao.classList.remove('enviando'); botao.classList.add('feito-on'); }, 650);
      t2 = setTimeout(() => botao.classList.remove('feito-on'), 2400);
    });
  }
})();
