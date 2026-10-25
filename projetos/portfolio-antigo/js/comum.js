/* Partes comuns às três páginas (Início, Trabalhos, Orçamento): idioma, tema, topo com o menu,
   contato, galeria, fundo e a rolagem suave (Lenis). Cada página tem o seu script
   (js/inicio.js, js/trabalhos.js, js/orcamento.js), que se registra com LG.pagina({...}):
     montar(E)  devolve as seções da página (entre o topo e o contato); roda de novo a cada troca
                de idioma
     depois()   opcional, roda depois de cada montagem
   O conteúdo vem de js/estado.js (window.ESTADO). O palco (js/palco.js) lê window.portfolio. */
(function () {
  'use strict';

  const BASE = window.ESTADO;
  const raiz = document.documentElement;
  const PAGINA = document.body.dataset.pagina || 'inicio';
  // preferências do visitante: localStorage pode não existir (aba anônima, prévia), então tudo
  // passa por try/catch e a página funciona sem ele
  const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const salvar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* segue sem lembrar */ } };

  /* ---------- idioma: o estado é em português e BASE.en traz só o que muda em inglês.
     mesclar() aplica um sobre o outro (listas casam pela posição). Vale para as três páginas. */
  function mesclar(a, b) {
    if (b === undefined || b === null) return a;
    if (Array.isArray(a)) return a.map((x, i) => mesclar(x, b[i]));
    if (a && typeof a === 'object') {
      const o = { ...a };
      for (const k of Object.keys(b)) o[k] = mesclar(a[k], b[k]);
      return o;
    }
    return b;
  }
  let lingua = ler('lg-lingua') || ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'pt');
  // projetos ocultos (painel: "visível no site" desligado) saem depois de mesclar o inglês, que casa
  // pela posição; frases do hero ligadas a um projeto oculto saem junto
  function visiveis(o) {
    const projetos = (o.projetos || []).filter((p) => !p.oculto);
    const ids = new Set(projetos.map((p) => p.id));
    const frases = ((o.hero || {}).frases || []).filter((f) => !f.projeto || ids.has(f.projeto));
    return { ...o, projetos, hero: { ...o.hero, frases: frases.length ? frases : (o.hero || {}).frases } };
  }
  const textos = () => visiveis(lingua === 'en' && BASE.en ? mesclar(BASE, BASE.en) : BASE);
  let E = textos();
  raiz.lang = lingua === 'en' ? 'en' : 'pt-BR';

  /* ---------- tema: sem escolha, segue o sistema; o botão grava em data-theme (o mesmo
     atributo do visualizador do claude.ai, que também pode trocá-lo por fora) */
  const mqEscuro = matchMedia('(prefers-color-scheme: dark)');
  const temaFixo = { claro: 'light', escuro: 'dark' }[(BASE.cena || {}).tema];
  if (temaFixo) raiz.dataset.theme = temaFixo;
  const temaSalvo = ler('lg-tema');
  if (temaSalvo && !raiz.dataset.theme) raiz.dataset.theme = temaSalvo;
  const escuro = () => (raiz.dataset.theme ? raiz.dataset.theme === 'dark' : mqEscuro.matches);
  const estatico = new URLSearchParams(location.search).has('estatico');
  const reduzido = estatico || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RITMO = Object.assign({ slide: 1.05, frase: 3.8, troca: .65, intro: 2.2, agua: 1 }, (BASE.cena || {}).ritmo);

  // filtro do vidro do topo: separa o vermelho para a esquerda e o azul para a direita do que
  // está atrás (aberração cromática). Só Chromium aplica filtro SVG em backdrop-filter, então a
  // classe .cromatico liga o efeito só nele; nos outros o vidro fica com blur simples
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <filter id="aberracao" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
      <feConvolveMatrix in="r" order="7 1" kernelMatrix="0 0 0 0 0 0 1" divisor="1" preserveAlpha="true" edgeMode="duplicate" result="r2"/>
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
      <feConvolveMatrix in="b" order="7 1" kernelMatrix="1 0 0 0 0 0 0" divisor="1" preserveAlpha="true" edgeMode="duplicate" result="b2"/>
      <feBlend in="r2" in2="g" mode="screen" result="rg"/>
      <feBlend in="rg" in2="b2" mode="screen"/>
    </filter></svg>`);
  const chromium = (navigator.userAgentData?.brands || []).some((b) => /Chromium/.test(b.brand)) || /Chrome\//.test(navigator.userAgent);
  const telaComMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (chromium && telaComMouse && !reduzido) raiz.classList.add('cromatico');

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  // fundo: a água em vídeo com a onda do cursor por cima; quem monta é o js/fundo.js. O pôster
  // (o primeiro quadro, parado) é pedido já aqui: o fundo aparece junto com o texto
  document.body.insertAdjacentHTML('afterbegin', '<div class="fundo" aria-hidden="true"></div>');
  // passagem: ao trocar de página o js/fundo.js guarda o quadro e o ponto do loop em que a água
  // estava; a página nova abre com esse quadro (em vez do primeiro) e o vídeo continua dali
  let passagem = null;
  try {
    const j = JSON.parse(sessionStorage.getItem('lg-fundo') || 'null');
    if (j && Date.now() - j.quando < 20000 && j.tema === (escuro() ? 'escuro' : 'claro')) passagem = j;
  } catch (e) {}
  document.querySelector('.fundo').style.backgroundImage = passagem ? `url(${passagem.quadro})` : `url(media/fundo/agua-${escuro() ? 'escuro' : 'claro'}.webp)`;

  // a ponte com o palco (js/palco.js): ele lê isto a cada quadro. As páginas com aparelho
  // (Início e Trabalhos) atualizam alvo, tela e pose
  const P = window.portfolio = {
    estatico, reduzido, pagina: PAGINA,
    ritmo: RITMO, fundo: (BASE.cena || {}).fundo || {},
    projetos: E.projetos,
    tela: (E.hero.frases[0] || {}).projeto,
    pose: 'h',
    chegada: 'abrir',   // 'abrir': o notebook abre na chegada; 'entrada': o aparelho entra girando
    alvo: { x: .5, y: .42, w: .56, h: .5, giro: 0, tampa: 0 },
    pronta: false,
    passagem,
    get escuro() { return escuro(); },
  };

  const ICONE_LUA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
  const ICONE_SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';

  const app = document.getElementById('app');
  let topo, cont, gal, botaoTema, pagina = null, porId = {};

  function atualizarBotaoTema() {
    if (!botaoTema) return;
    const e = escuro();
    botaoTema.innerHTML = e ? ICONE_SOL : ICONE_LUA;
    botaoTema.setAttribute('aria-label', e ? E.ui.temaClaro : E.ui.temaEscuro);
    botaoTema.title = botaoTema.getAttribute('aria-label');
  }
  // toda troca de tema (botão, sistema ou claude.ai): as cores deslizam por ~0,6 s com a classe
  // .tema-trocando; no botão, isso acontece por baixo do véu do entardecer/amanhecer
  let fimTroca = 0;
  function suavizarTema() {
    atualizarBotaoTema();
    if (reduzido) return;
    raiz.classList.add('tema-trocando');
    clearTimeout(fimTroca);
    fimTroca = setTimeout(() => raiz.classList.remove('tema-trocando'), 700);
  }
  new MutationObserver(suavizarTema).observe(raiz, { attributes: true, attributeFilter: ['data-theme'] });
  if (mqEscuro.addEventListener) mqEscuro.addEventListener('change', () => { if (!raiz.dataset.theme) suavizarTema(); });

  /* ---------- rolagem suave (Lenis), criada antes da primeira montagem (o menu do celular a usa) */
  let lenis = null;
  if (!reduzido && window.Lenis) {
    lenis = new window.Lenis({ lerp: .085, wheelMultiplier: .9 });
    const passo = (t) => { lenis.raf(t); requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }
  // o topo é fixo: uma seção alvo para logo abaixo dele (senão o título dela fica escondido atrás do
  // topo, como o do contato em telas baixas, ex. tablet deitado)
  const folgaTopo = () => { const t = document.querySelector('.topo'); return t ? t.getBoundingClientRect().bottom + 14 : 0; };
  const yDe = (alvo) => Math.max(0, alvo.getBoundingClientRect().top + scrollY - folgaTopo());
  function rolarAte(alvo, duracao = 1.4) {
    const y = alvo === 0 ? 0 : yDe(alvo);
    if (lenis) lenis.scrollTo(y, { duration: duracao });
    else scrollTo({ top: y, behavior: reduzido ? 'auto' : 'smooth' });
  }
  // links para âncoras desta página rolam suave; links para outras páginas navegam normalmente
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const alvo = a.getAttribute('href') === '#' ? 0 : document.querySelector(a.getAttribute('href'));
    if (alvo === null) return;
    e.preventDefault();
    rolarAte(alvo);
  });

  /* ---------- véu do entardecer e do amanhecer (referência: luz de janela ao longo do dia)
     Entardecer: o creme esfria (cinza-azulado), esquenta em âmbar, vira laranja, depois ferrugem e
     some no azul da noite. Amanhecer: o azul da noite ganha um terracota baixo, passa por um
     cinza-azulado frio, clareia e termina no creme quente. O véu tinge só o fundo (fica dentro de
     .fundo, atrás do conteúdo), multiplicando as cores no entardecer; o tema troca no ponto mais
     denso da cor */
  const CEU = {
    anoitecer: {
      duracao: 1710, troca: .5, mistura: 'multiply',
      quadros: [
        { offset: 0, backgroundColor: 'rgba(233, 237, 242, 0)' },
        { offset: .16, backgroundColor: 'rgba(176, 188, 204, .55)' },
        { offset: .34, backgroundColor: 'rgba(236, 184, 112, .7)' },
        { offset: .52, backgroundColor: 'rgba(214, 122, 52, .82)' },
        { offset: .72, backgroundColor: 'rgba(120, 58, 38, .6)' },
        { offset: .88, backgroundColor: 'rgba(52, 34, 46, .35)' },
        { offset: 1, backgroundColor: 'rgba(16, 22, 38, 0)' },
      ],
    },
    amanhecer: {
      duracao: 1440, troca: .44, mistura: 'normal',
      quadros: [
        { offset: 0, backgroundColor: 'rgba(14, 18, 30, 0)' },
        { offset: .2, backgroundColor: 'rgba(92, 62, 42, .5)' },
        { offset: .44, backgroundColor: 'rgba(138, 152, 164, .78)' },
        { offset: .66, backgroundColor: 'rgba(206, 212, 214, .5)' },
        { offset: .84, backgroundColor: 'rgba(246, 228, 196, .3)' },
        { offset: 1, backgroundColor: 'rgba(250, 240, 220, 0)' },
      ],
    },
  };
  // a troca em andamento (enquanto existe, o botão de tema fica travado)
  let ceuAtual = null;
  function travarBotaoTema(sim) {
    if (!botaoTema) return;
    botaoTema.classList.toggle('ocupado', sim);
    if (sim) botaoTema.setAttribute('aria-disabled', 'true'); else botaoTema.removeAttribute('aria-disabled');
  }
  function passarCeu(paraNoite, trocar) {
    const c = CEU[paraNoite ? 'anoitecer' : 'amanhecer'];
    // avisa o fundo já no clique: ele começa a carregar o vídeo da água do tema novo enquanto o véu
    // ainda está chegando, para a água trocar escondida no meio do véu (e não depois dele)
    dispatchEvent(new CustomEvent('portfolio:tema-previsto', { detail: { escuro: paraNoite } }));
    // o véu mora dentro do fundo (a água): só o fundo muda de cor; textos, cards e aparelhos
    // ficam por cima dele e só deslizam para as cores do tema novo
    const camada = document.querySelector('.fundo') || document.body;
    const veu = camada.querySelector('.ceu') || camada.appendChild(Object.assign(document.createElement('div'), { className: 'ceu' }));
    veu.setAttribute('aria-hidden', 'true');
    veu.style.mixBlendMode = c.mistura;
    let trocou = false;
    const aplicar = () => { if (!trocou) { trocou = true; trocar(); } };
    const anim = veu.animate(c.quadros, { duration: c.duracao, easing: 'linear', fill: 'both' });
    const t = setTimeout(aplicar, c.duracao * c.troca);
    const atual = {};
    ceuAtual = atual;
    travarBotaoTema(true);
    anim.onfinish = () => {
      clearTimeout(t); aplicar();
      if (ceuAtual === atual) { ceuAtual = null; veu.remove(); travarBotaoTema(false); }
    };
  }

  /* ---------- topo: marca, menu (página atual marcada) e ajustes de idioma e tema */
  function montarTopo() {
    // um item do menu que aponta para esta página com âncora vira só a âncora (rola em vez de recarregar)
    const hrefDe = (m) => {
      if (m.pagina === PAGINA && m.href.includes('#')) return '#' + m.href.split('#')[1];
      return m.href;
    };
    const atual = (m) => m.pagina === PAGINA && !m.href.includes('#');
    topo = h(`<header class="topo vidro">
      <a class="marca" href="${PAGINA === 'inicio' ? '#' : 'index.html'}"><b>${esc(E.nome)}</b><span>${esc(E.oficio)}</span></a>
      <nav class="nav" id="menu-principal"><div class="nav-painel">${E.menu.map((m, i) => `<a href="${esc(hrefDe(m))}"${i === E.menu.length - 1 ? ' class="cta"' : atual(m) ? ' class="atual" aria-current="page"' : ''} style="--i:${i}">${esc(m.rotulo)}</a>`).join('')}
        <p class="nav-rodape"><a href="mailto:${esc(E.contato.email)}">${esc(E.contato.email)}</a><span>${esc(E.oficio)}</span></p></div></nav>
      <div class="ajustes">
        <button class="ajuste lingua" type="button" aria-label="${esc(E.ui.outraLinguaNome)}" title="${esc(E.ui.outraLinguaNome)}">${esc(E.ui.outraLingua)}</button>
        ${temaFixo ? '' : '<button class="ajuste tema" type="button"></button>'}
      </div>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu-principal"><span class="menu-icone" aria-hidden="true"><i></i><i></i></span><span class="menu-rotulo">${esc(E.ui.menu)}</span></button>
    </header>`);
    botaoTema = topo.querySelector('.tema');
    atualizarBotaoTema();
    travarBotaoTema(!!ceuAtual);
    if (botaoTema) botaoTema.addEventListener('click', () => {
      // durante a troca o botão não responde: a próxima só depois que o véu terminar
      if (ceuAtual) return;
      const novo = escuro() ? 'light' : 'dark';
      salvar('lg-tema', novo);
      // entardecer ou amanhecer: um véu de cor passa pela tela inteira (como a luz do dia mudando) e
      // o tema troca por baixo dele, no meio do caminho, com as cores deslizando (.tema-trocando)
      if (reduzido || !document.body.animate) { raiz.dataset.theme = novo; return; }
      passarCeu(novo === 'dark', () => { raiz.dataset.theme = novo; });
    });
    topo.querySelector('.lingua').addEventListener('click', () => {
      lingua = lingua === 'en' ? 'pt' : 'en';
      salvar('lg-lingua', lingua);
      raiz.lang = lingua === 'en' ? 'en' : 'pt-BR';
      E = textos();
      montar();
    });
    const nav = topo.querySelector('.nav');
    const menuBtn = topo.querySelector('.menu-btn');
    // menu do celular: um painel de vidro que desce do topo; com ele aberto a página não rola, e
    // um toque fora do painel, um link ou Esc fecham
    function abrirMenu(abre) {
      nav.classList.toggle('aberta', abre);
      menuBtn.setAttribute('aria-expanded', abre);
      menuBtn.querySelector('.menu-rotulo').textContent = abre ? E.ui.fechar : E.ui.menu;
      if (lenis) abre ? lenis.stop() : lenis.start();
    }
    menuBtn.addEventListener('click', () => abrirMenu(!nav.classList.contains('aberta')));
    nav.addEventListener('click', (e) => {
      if (!nav.classList.contains('aberta')) return;
      if (e.target.closest('a') || !e.target.closest('.nav-painel')) abrirMenu(false);
    });
    topo.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('aberta')) { abrirMenu(false); menuBtn.focus(); } });
  }

  /* ---------- contato: monta o e-mail pronto; se o app de e-mail não abrir, dá para copiar */
  function montarContato() {
    const C = E.contato, V = C.validacao;
    const obrig = '<span class="obrig" aria-hidden="true">*</span>';
    cont = h(`<section class="contato vidro" id="contato">
      <div class="contato-grade">
        <div>
          <h2>${esc(C.titulo)}</h2>
          <p class="sub">${esc(C.sub)}</p>
          <p class="direto">${esc(C.direto)}<br><a href="mailto:${esc(C.email)}">${esc(C.email)}</a></p>
        </div>
        <form class="form" novalidate>
          <div class="campo" data-campo="nome"><label for="f-nome">${esc(C.campos.nome)}${obrig}</label>
            <input id="f-nome" name="nome" autocomplete="name" required aria-describedby="f-nome-erro">
            <span class="erro" id="f-nome-erro"></span></div>
          <div class="campo" data-campo="email"><label for="f-email">${esc(C.campos.email)}${obrig}</label>
            <input id="f-email" name="email" type="email" autocomplete="email" required aria-describedby="f-email-erro">
            <span class="erro" id="f-email-erro"></span></div>
          <div class="campo largo" data-campo="precisa"><span id="f-precisa">${esc(C.campos.precisa)}${obrig}</span>
            <div class="pilulas" role="group" aria-labelledby="f-precisa" aria-describedby="f-precisa-erro">${C.opcoes.map((o, i) => `<button type="button" class="pilula" data-i="${i}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>
            <span class="erro" id="f-precisa-erro"></span></div>
          <div class="campo largo" data-campo="projeto"><label for="f-projeto">${esc(C.campos.projeto)} <small class="opcional">${esc(V.opcional)}</small></label>
            <textarea id="f-projeto" name="projeto" data-lenis-prevent maxlength="${V.limite}" aria-describedby="f-projeto-conta"></textarea>
            <span class="contador" id="f-projeto-conta"></span></div>
          <button class="enviar" type="submit">${esc(C.enviar)}</button>
        </form>
      </div>
      <footer class="rodape"><b>${esc(E.nome)}</b><span>© ${new Date().getFullYear()} · ${esc(E.oficio)}</span></footer>
    </section>`);
    const form = cont.querySelector('form');
    /* validação: nome, e-mail e pelo menos uma pílula são obrigatórios; o texto do projeto é
       opcional, com até V.limite caracteres e um contador ao vivo. O erro aparece embaixo do
       campo e some assim que a pessoa corrige */
    const fmtN = (n) => n.toLocaleString(lingua === 'en' ? 'en-US' : 'pt-BR');
    const erro = (campo, msg) => {
      const caixa = form.querySelector(`[data-campo="${campo}"]`);
      caixa.classList.toggle('invalido', !!msg);
      caixa.querySelector('.erro').textContent = msg || '';
      const alvo = caixa.querySelector('input, textarea');
      if (alvo) alvo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    function validar() {
      const nome = form.nome.value.trim(), email = form.email.value.trim();
      const r = {
        nome: nome ? '' : V.nome,
        email: !email ? V.emailVazio : emailOk(email) ? '' : V.email,
        precisa: form.querySelector('.pilula[aria-pressed="true"]') ? '' : V.precisa,
      };
      Object.entries(r).forEach(([k, m]) => erro(k, m));
      return Object.keys(r).filter((k) => r[k]);
    }
    const contador = form.querySelector('.contador'), texto = form.querySelector('#f-projeto');
    const contar = () => {
      const n = texto.value.length;
      contador.textContent = (n >= V.limite ? V.limiteAtingido : V.contador).replace('{n}', fmtN(n)).replace('{max}', fmtN(V.limite));
      contador.classList.toggle('perto', n >= V.limite * .9);
      contador.classList.toggle('cheio', n >= V.limite);
    };
    contar();
    texto.addEventListener('input', contar);
    // corrige ao vivo: depois do primeiro envio, os campos se revalidam enquanto a pessoa mexe
    let tentou = false;
    form.addEventListener('input', (e) => { if (tentou && e.target.name !== 'projeto') validar(); });
    form.addEventListener('click', (e) => {
      const b = e.target.closest('.pilula');
      if (!b) return;
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
      if (tentou) validar();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      tentou = true;
      const faltando = validar();
      if (faltando.length) {
        // não segue para a mensagem pronta nem para a animação de enviado (js/motion.js)
        e.stopImmediatePropagation();
        const primeiro = form.querySelector(`[data-campo="${faltando[0]}"]`);
        const foco = primeiro.querySelector('input, textarea, .pilula');
        try { foco.focus({ preventScroll: true }); } catch (err) { foco.focus(); }
        const r = primeiro.getBoundingClientRect();
        if (r.top < 90 || r.bottom > innerHeight) rolarAte(primeiro, .8);
        // Shake on Error (Kinetics): o botão balança
        const bt = form.querySelector('.enviar');
        bt.classList.remove('balanca'); void bt.offsetWidth; bt.classList.add('balanca');
        return;
      }
      const f = new FormData(form);
      const escolhas = [...form.querySelectorAll('.pilula[aria-pressed="true"]')].map((b) => b.textContent);
      const corpo = [
        `${C.campos.nome}: ${f.get('nome') || ''}`,
        `${C.campos.email}: ${f.get('email') || ''}`,
        `${C.campos.precisa} ${escolhas.join(', ')}`,
        '', String(f.get('projeto') || ''),
      ].join('\n');
      // não abre o app de e-mail sozinho (dentro do claude.ai o mailto costuma não funcionar): a
      // mensagem aparece num pop-up para copiar, com o endereço à vista e o link só como atalho.
      // Num pop-up, e não embaixo do formulário, a seção não muda de tamanho
      mensagemPronta(corpo, form.querySelector('.enviar'));
    });
  }
  const ICONE_COPIAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9"/></svg>';
  const ICONE_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  /* pop-up da mensagem pronta: copiar (Copy Button da Kinetics: o ícone vira check) ou abrir no
     app de e-mail; fecha no X, no Esc ou com um clique fora da caixa */
  function mensagemPronta(corpo, voltarPara) {
    const C = E.contato;
    const link = `mailto:${C.email}?subject=${encodeURIComponent(C.assunto)}&body=${encodeURIComponent(corpo)}`;
    const dlg = h(`<dialog class="dialogo dialogo-contato" aria-labelledby="dlg-contato-t">
      <div class="dialogo-caixa vidro">
        <button type="button" class="dialogo-x" data-acao="fechar" aria-label="${esc(C.fecharDialogo)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        <span class="dialogo-icone" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg></span>
        <h2 id="dlg-contato-t">${esc(C.prontoTitulo)}</h2>
        <p>${esc(C.pronto)} <b class="selecionavel">${esc(C.email)}</b></p>
        <pre class="dialogo-mensagem" tabindex="0" data-lenis-prevent></pre>
        <div class="dialogo-acoes">
          <a class="botao vazado" href="${esc(link)}">${esc(C.abrirEmail)}</a>
          <button type="button" class="botao cheio dialogo-copiar" data-acao="copiar"><span class="icones" aria-hidden="true"><span class="ic-copiar">${ICONE_COPIAR}</span><span class="ic-check">${ICONE_OK}</span></span><span class="rotulo">${esc(C.copiar)}</span></button>
        </div>
      </div>
    </dialog>`);
    const pre = dlg.querySelector('pre');
    pre.textContent = corpo;
    document.body.append(dlg);
    if (lenis) lenis.stop();
    const fechar = () => {
      if (dlg.classList.contains('saindo')) return;
      dlg.classList.add('saindo');
      setTimeout(() => { dlg.close(); dlg.remove(); if (lenis) lenis.start(); if (voltarPara) voltarPara.focus(); }, reduzido ? 0 : 220);
    };
    let volta;
    const copiar = (b) => {
      const selecionar = () => { const r = document.createRange(); r.selectNodeContents(pre); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); };
      const feito = () => {
        b.querySelector('.rotulo').textContent = C.copiado;
        b.classList.add('copiado');
        clearTimeout(volta);
        volta = setTimeout(() => { b.classList.remove('copiado'); b.querySelector('.rotulo').textContent = C.copiar; }, 1800);
      };
      try { navigator.clipboard.writeText(corpo).then(feito, selecionar); } catch (err) { selecionar(); }
    };
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); fechar(); });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) { fechar(); return; }   // clique fora da caixa
      const b = e.target.closest('[data-acao]');
      if (!b) return;
      if (b.dataset.acao === 'fechar') fechar();
      else if (b.dataset.acao === 'copiar') copiar(b);
    });
    dlg.showModal();
    dlg.querySelector('[data-acao="copiar"]').focus();
  }
  // outras páginas (o Orçamento) preenchem o contato: texto no campo do projeto e as pílulas
  // pelo texto delas (no idioma da página)
  function preencherContato({ texto = '', opcoes = [] } = {}) {
    if (!cont) return;
    const campo = cont.querySelector('#f-projeto');
    campo.value = texto.slice(0, E.contato.validacao.limite);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    cont.querySelectorAll('.pilula').forEach((b) => b.setAttribute('aria-pressed', opcoes.includes(b.textContent) ? 'true' : 'false'));
    rolarAte(cont);
    setTimeout(() => { try { campo.focus({ preventScroll: true }); } catch (e) { /* segue */ } }, 900);
  }

  /* ---------- galeria (as telas de um projeto, em tela cheia) */
  function montarGaleria() {
    gal = h(`<div class="galeria" hidden role="dialog" aria-modal="true">
      <header><h4></h4><button class="fechar">${esc(E.ui.fechar)}</button></header><div class="faixa"></div></div>`);
    gal.querySelector('.fechar').addEventListener('click', fecharGaleria);
  }
  function abrirGaleria(id) {
    const p = porId[id];
    if (!p) return;
    gal.querySelector('h4').textContent = p.titulo;
    gal.querySelector('.faixa').innerHTML = p.galeria.map((s) => /\.mp4$/.test(s)
      ? `<video src="${esc(s)}" controls playsinline muted loop autoplay></video>`
      : `<img src="${esc(s)}" alt="" loading="lazy">`).join('');
    gal.hidden = false;
    requestAnimationFrame(() => gal.classList.add('aberta'));
    gal.querySelector('.fechar').focus();
  }
  function fecharGaleria() {
    gal.classList.remove('aberta');
    setTimeout(() => { gal.hidden = true; gal.querySelector('.faixa').innerHTML = ''; }, 350);
  }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && gal && !gal.hidden) fecharGaleria(); });
  document.addEventListener('click', (e) => { const b = e.target.closest('.ver-telas'); if (b) abrirGaleria(b.dataset.id); });

  /* ---------- montagem: topo + seções da página + contato + galeria */
  function montar() {
    porId = Object.fromEntries(E.projetos.map((p) => [p.id, p]));
    P.projetos = E.projetos;
    // título e descrição desta página (aba, busca e compartilhamento)
    const M = (E.paginas || {})[PAGINA] || E.meta;
    if (M) {
      document.title = M.titulo;
      const metas = { description: M.descricao, 'og:title': M.titulo, 'og:description': M.descricao };
      for (const [nome, valor] of Object.entries(metas)) {
        const m = document.head.querySelector(`meta[name="${nome}"],meta[property="${nome}"]`);
        if (m) m.setAttribute('content', valor);
      }
    }
    montarTopo();
    montarContato();
    montarGaleria();
    const secoes = pagina ? pagina.montar(E) : [];
    app.replaceChildren(topo, ...secoes, cont, gal);
    // o topo fica claro sobre o card escuro do contato
    vigiarContato();
    if (pagina && pagina.depois) pagina.depois(E);
    // a camada de motion (js/motion.js) se liga de novo a cada montagem
    document.dispatchEvent(new CustomEvent('portfolio:montado', { detail: { reduzido, pagina: PAGINA } }));
  }
  // na rolagem, no máximo uma leitura por quadro: o topo do contato passou por baixo do topo da página?
  let vigiando = false, pedido = false;
  function vigiarContato() {
    const checar = () => {
      pedido = false;
      const r = cont.getBoundingClientRect();
      topo.classList.toggle('no-escuro', r.top < 40 && r.bottom > 40);
    };
    checar();
    if (vigiando) return;
    vigiando = true;
    addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(checar); } }, { passive: true });
  }

  // chegada numa página: sempre no topo, ou na âncora do endereço (#sobre, #contato). O navegador
  // não acha a âncora sozinho (as seções nascem depois, pelo script), e dentro do Artifact a troca
  // de página pode herdar a rolagem da página anterior: sem isto o Orçamento abria já no contato.
  // A página Trabalhos cuida da própria âncora (o projeto), então lá só a falta de âncora conta.
  // Voltando ou avançando pelo navegador, a página reabre onde a pessoa estava (a posição fica
  // guardada na sessão ao sair, porque com o conteúdo montado por script o navegador não acerta).
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const chaveRolagem = 'lg-rolagem:' + location.pathname + location.hash;
  addEventListener('pagehide', () => { try { sessionStorage.setItem(chaveRolagem, String(Math.round(scrollY))); } catch (e) {} });
  function chegada() {
    const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    let salvo = null;
    if (nav && nav.type === 'back_forward') {
      try { const v = sessionStorage.getItem(chaveRolagem); if (v !== null) salvo = +v; } catch (e) {}
    }
    const id = decodeURIComponent((location.hash || '').slice(1));
    if (salvo === null && id && PAGINA === 'trabalhos') return;
    const alvo = salvo === null && id ? document.getElementById(id) : null;
    const ir = () => {
      const y = salvo !== null ? salvo : alvo ? yDe(alvo) : 0;
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      scrollTo(0, y);
    };
    ir();
    requestAnimationFrame(ir);   // de novo depois do primeiro desenho (fontes e imagens mudam a altura)
    // a posição guardada pode estar abaixo do fim enquanto a página ainda cresce: insiste por até 1,5 s
    if (salvo !== null) {
      const ate = performance.now() + 1500;
      const insistir = () => { if (Math.abs(scrollY - salvo) > 2 && performance.now() < ate) { ir(); setTimeout(insistir, 100); } };
      setTimeout(insistir, 100);
    }
  }

  // utilidades para os scripts das páginas
  const lim = (v) => Math.min(1, Math.max(0, v));
  window.LG = {
    get E() { return E; }, get lingua() { return lingua; }, get lenis() { return lenis; },
    get contato() { return cont; }, get topo() { return topo; },
    P, PAGINA, RITMO, reduzido, esc, h, mesclar, rolarAte, preencherContato, abrirGaleria,
    lim, suave: (t) => t * t * (3 - 2 * t),
    mistura: (a, b, t) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + (b[k] - a[k]) * t])),
    celular: () => innerWidth < 900,
    LARGURA: 1200,   // o mesmo --largura do CSS
    gutter: () => Math.min(56, Math.max(16, innerWidth * .04)),
    // a página registra as seções dela; a primeira montagem acontece aqui
    pagina(def) { pagina = def; if (def.antes) def.antes(E); montar(); chegada(); },
  };
})();
