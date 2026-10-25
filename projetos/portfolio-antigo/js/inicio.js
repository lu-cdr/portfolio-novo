/* Página inicial: o hero (o notebook abre e a frase troca junto com o projeto na tela), as
   chamadas (conversar, ver trabalhos, simular investimento), uma faixa com trabalhos em destaque
   e o Sobre. O contato e o topo vêm do js/comum.js; o aparelho, do js/palco.js. */
(function () {
  'use strict';
  const { P, esc, h, lim, suave, mistura, celular, gutter, LARGURA, RITMO, reduzido } = window.LG;

  let hero, frase, destaques, sobre, E;
  let fraseAtual = 0, heroPronto = false;
  let ultimoTroca = performance.now();

  /* ---------- frase do hero: entra letra por letra, cada palavra presa numa caixa para a quebra
     de linha não partir a palavra. esperar: monta as letras escondidas e deixa a entrada para depois */
  function montarFrase(txt, entrando, esperar) {
    frase.innerHTML = txt.split(' ').map((p) =>
      `<span class="palavra">${[...p].map((l) => `<span class="letra${entrando ? ' fora' : ''}">${esc(l)}</span>`).join('')}</span>`
    ).join(' ');
    frase.setAttribute('aria-label', txt);
    if (!entrando || esperar) return;
    revelarFrase();
  }
  function revelarFrase() {
    const letras = frase.querySelectorAll('.letra');
    requestAnimationFrame(() => requestAnimationFrame(() =>
      letras.forEach((l, i) => { l.style.transitionDelay = i * 22 + 'ms'; l.classList.remove('fora'); })));
  }
  function proximaFrase() {
    fraseAtual = (fraseAtual + 1) % E.hero.frases.length;
    const letras = frase.querySelectorAll('.letra');
    letras.forEach((l, i) => { l.style.transitionDelay = i * 14 + 'ms'; l.classList.add('saindo'); });
    setTimeout(() => montarFrase(E.hero.frases[fraseAtual].texto, true), 380 + letras.length * 14);
  }
  // a primeira frase entra com o notebook abrindo ('palco:abrindo', até 2,5 s); a contagem para a
  // próxima começa nesse instante
  function heroEntra() {
    if (heroPronto) return;
    heroPronto = true;
    ultimoTroca = performance.now();
    if (!reduzido) revelarFrase();
  }
  addEventListener('palco:abrindo', heroEntra, { once: true });
  setTimeout(heroEntra, 2500);

  const capaDe = (p) => p.tela.src || p.tela.poster || (p.tela.srcs && p.tela.srcs[0]) || '';

  window.LG.pagina({
    montar(textos) {
      E = textos;
      const H = E.hero, C = H.ctas;
      hero = h(`<section class="hero" id="topo">
        <div class="hero-palco"></div>
        <div class="hero-texto">
          <h1 class="frase" aria-live="polite"></h1>
          ${H.tagline ? `<p class="hero-sub">${esc(H.tagline)}</p>` : ''}
          <div class="hero-ctas">
            <a class="botao cheio" href="#contato">${esc(C.conversar)}<span aria-hidden="true">→</span></a>
            <a class="botao vazado" href="trabalhos.html">${esc(C.trabalhos)}</a>
            <a class="botao texto" href="orcamento.html">${esc(C.simular)}</a>
          </div>
          <small class="dica">${esc(matchMedia('(hover: hover)').matches ? H.dica : H.dicaToque)}</small>
        </div>
      </section>`);
      frase = hero.querySelector('.frase');
      // na chegada a frase espera o notebook; nas montagens seguintes (troca de idioma) entra direto
      if (reduzido || heroPronto) montarFrase(H.frases[fraseAtual].texto, !reduzido);
      else montarFrase(H.frases[fraseAtual].texto, true, true);

      // trabalhos em destaque: capas que levam ao projeto na página Trabalhos
      const D = E.inicio.destaques;
      const porId = Object.fromEntries(E.projetos.map((p) => [p.id, p]));
      destaques = h(`<section class="destaques" id="destaques">
        <div class="destaques-topo"><h2>${esc(D.titulo)}</h2><a class="sublinhado" href="trabalhos.html">${esc(D.link)} →</a></div>
        <ul class="destaques-lista">${D.ids.map((id) => porId[id]).filter(Boolean).map((p) => `
          <li><a class="destaque vidro" href="trabalhos.html#${esc(p.id)}">
            <span class="destaque-capa"><img src="${esc(capaDe(p))}" alt="" loading="lazy"></span>
            <span class="destaque-texto"><b>${esc(p.titulo)}</b><small>${esc(p.tags)}</small></span>
          </a></li>`).join('')}
        </ul>
      </section>`);

      /* sobre: título; à esquerda a foto, o texto e alguns dados; à direita as habilidades */
      const S = E.sobre;
      sobre = h(`<section class="sobre" id="sobre">
        <h2>${esc(S.titulo)}</h2>
        <div class="sobre-grade">
          <div class="sobre-texto">
            <figure class="sobre-foto vidro">${S.foto
              ? `<img src="${esc(S.foto)}" alt="${esc(S.fotoAlt)}" loading="lazy">`
              : `<span class="sobre-vazia">${esc(S.fotoVazia)}</span>`}</figure>
            ${S.textos.map((t) => `<p>${esc(t)}</p>`).join('')}
            <dl class="sobre-dados">${S.dados.map((x) => `<div><dt>${esc(x.rotulo)}</dt><dd>${esc(x.valor)}</dd></div>`).join('')}</dl>
          </div>
          <div class="habilidades">
            <h3>${esc(S.habilidadesTitulo)}</h3>
            <ol>${E.servicos.itens.map((x) => `<li><h4>${esc(x.nome)}</h4><p>${esc(x.inclui)}</p></li>`).join('')}</ol>
          </div>
        </div>
      </section>`);
      return [hero, destaques, sobre];
    },
  });

  /* ---------- o notebook: no hero, de frente no meio; ao rolar, sobe e sai de cena (a tampa
     "fecha", o que no palco vira o aparelho sumindo). Mesma régua de poses do site 3D. */
  const POSES = {
    hero: { x: .5, y: .4, w: .54, h: .46, giro: 0, tampa: 0 },
    fim: { x: .5, y: -.25, w: .4, h: .34, giro: 0, tampa: 1 },
  };
  const POSES_CEL = {
    hero: { x: .5, y: .34, w: .9, h: .34, giro: 0, tampa: 0 },
    fim: { x: .5, y: -.3, w: .6, h: .24, giro: 0, tampa: 1 },
  };
  P.chegada = 'abrir';
  P.pose = 'h';
  let saidaAntes = '';
  function quadro(agora) {
    const vh = innerHeight, poses = celular() ? POSES_CEL : POSES;
    // progresso da saída: 0 no topo, 1 quando o hero já rolou ~70% da tela
    const s = suave(lim(scrollY / (vh * .7)));
    P.alvo = mistura(poses.hero, poses.fim, s);
    // o texto do hero quase não sai do lugar e apaga enquanto a página sobe (variável CSS)
    const saida = lim(scrollY / vh).toFixed(3);
    if (hero && saida !== saidaAntes) { hero.style.setProperty('--saida', saida); saidaAntes = saida; }
    // a frase (e o projeto na tela) troca só enquanto o hero está à vista
    if (s < .5) {
      if (!reduzido && heroPronto && agora - ultimoTroca > RITMO.frase * 1000) { ultimoTroca = agora; proximaFrase(); }
      P.trocaHero = reduzido ? 0 : ultimoTroca + RITMO.frase * 1000;
    } else P.trocaHero = 0;
    P.tela = E.hero.frases[fraseAtual].projeto;
    P.pose = 'h';
    // no computador as poses valem dentro da coluna central (--largura), não da janela
    if (!celular()) {
      const coluna = Math.min(innerWidth - 2 * gutter(), LARGURA) / innerWidth;
      P.alvo = { ...P.alvo, x: .5 + (P.alvo.x - .5) * coluna, w: P.alvo.w * coluna };
    }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
})();
