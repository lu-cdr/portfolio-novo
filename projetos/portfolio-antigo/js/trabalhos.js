/* Página Trabalhos: os projetos em slides, o mesmo fluxo de antes. Cada trabalho é um trecho alto
   com o card preso (sticky); um gesto leve leva ao próximo, e o aparelho troca de lado num arco,
   girando (js/palco.js). A página chega direto no primeiro trabalho, ou no da âncora
   (trabalhos.html#pingado); depois do último, um gesto leva ao fecho (chamadas) e ao contato. */
(function () {
  'use strict';
  const LG = window.LG;
  const { P, esc, h, lim, suave, mistura, celular, gutter, LARGURA, RITMO, reduzido } = LG;

  let trab, fecho, itens = [], E;
  // com âncora, os slides só passam a mandar no projeto do palco depois de a página rolar até ela
  // "{n} projetos de 2026": o número por extenso (com maiúscula no começo da frase), para o texto
  // acompanhar quantos projetos estão visíveis
  const EXTENSO = {
    pt: ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze'],
    en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
  };
  function comContagem(txt, n) {
    const palavra = (EXTENSO[LG.lingua === 'en' ? 'en' : 'pt'] || [])[n] || String(n);
    return String(txt).replace(/\{n\}/g, (m, pos) => (pos === 0 ? palavra.charAt(0).toUpperCase() + palavra.slice(1) : palavra));
  }
  let ancoraFeita = !decodeURIComponent((location.hash || '').slice(1));
  let medidas = null;

  // o projeto da âncora, se houver: o palco já nasce com ele (o aparelho dele entra girando)
  const ancora = decodeURIComponent((location.hash || '').slice(1));
  const lado = (i) => (i % 2 ? -1 : 1);
  (function inicial() {
    const ps = LG.E.projetos, i = Math.max(0, ps.findIndex((p) => p.id === ancora));
    P.tela = ps[i].id;
    P.pose = lado(i) > 0 ? 'd' : 'e';
    // a chegada do palco lê estes dois: P.tela e P.pose mudam com a rolagem, e um quadro pode rodar
    // antes de o palco.js terminar de baixar
    P.telaInicial = P.tela; P.poseInicial = P.pose;
    P.chegada = 'entrada';
  })();

  LG.pagina({
    montar(textos) {
      E = textos;
      trab = h(`<section class="trabalhos" id="trabalhos">
        <ol class="projetos">${E.projetos.map((p, i) => `
          <li class="projeto" id="${esc(p.id)}" data-id="${esc(p.id)}">
            <div class="projeto-corpo">${i === 0 ? `<div class="cabeca"><h1>${esc(E.trabalhos.titulo)}</h1><p>${esc(comContagem(E.trabalhos.sub, E.projetos.length))}</p></div>` : ''}<div class="projeto-cartao vidro">
              <span class="projeto-num"><b>${String(i + 1).padStart(2, '0')}</b> / ${String(E.projetos.length).padStart(2, '0')}</span>
              <h3>${esc(p.titulo)}</h3>
              <div class="projeto-meta"><span>${esc(p.cliente)}</span><span>${esc(p.tags)}</span><span>${esc(p.ano)}</span></div>
              <p>${esc(p.resumo)}</p>
              <ul class="entregas">${p.entregas.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
              ${p.galeria.length ? `<button class="ver-telas" data-id="${esc(p.id)}">${esc(E.ui.verTelas)}</button>` : ''}
            </div></div>
          </li>`).join('')}
        </ol>
      </section>`);
      itens = [...trab.querySelectorAll('.projeto')];
      const F = E.trabalhos.fecho, C = E.hero.ctas;
      fecho = h(`<section class="fecho" id="fecho">
        <h2>${esc(F.titulo)}</h2>
        <p>${esc(F.sub)}</p>
        <div class="hero-ctas">
          <a class="botao cheio" href="#contato">${esc(C.conversar)}<span aria-hidden="true">→</span></a>
          <a class="botao vazado" href="orcamento.html">${esc(C.simular)}</a>
        </div>
      </section>`);
      medidas = null;
      return [trab, fecho];
    },
    depois() {
      // chegada pela âncora: vai direto ao centro do projeto, sem animar
      if (ancora && !LG._ancoraFeita) {
        LG._ancoraFeita = true;
        requestAnimationFrame(() => {
          const i = itens.findIndex((li) => li.dataset.id === ancora);
          if (i > 0) { const y = centros()[i]; if (LG.lenis) LG.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); }
          requestAnimationFrame(() => { ancoraFeita = true; });
        });
      }
    },
  });

  /* ---------- medidas: posições no documento, refeitas só quando o layout muda */
  const remedir = () => { medidas = null; };
  addEventListener('resize', remedir);
  new ResizeObserver(remedir).observe(document.body);
  function medir() {
    const y = scrollY, topoDe = (el) => el.getBoundingClientRect().top + y;
    medidas = { fecho: topoDe(fecho), itens: itens.map((li) => ({ t: topoDe(li), h: li.offsetHeight })) };
    return medidas;
  }
  function zonas() {
    const m = medidas || medir(), vh = innerHeight;
    return m.itens.map(({ t, h: alt }) => ({ ini: t, fim: t + alt - vh }));
  }
  // índice contínuo: 2 = parado no terceiro trabalho, 2.4 = 40% da troca do terceiro para o quarto
  function indice(z) {
    const y = scrollY;
    for (let i = 0; i < z.length - 1; i++) {
      if (y <= z[i].fim) return i;
      if (y < z[i + 1].ini) return i + (y - z[i].fim) / (z[i + 1].ini - z[i].fim);
    }
    return z.length - 1;
  }

  /* ---------- trabalhos como slides (computador e celular)
     Um gesto leve (roda, trackpad, setas, PageUp/Down, espaço ou arrastar no toque) leva ao
     próximo trabalho, ou ao anterior; não dá para parar no meio de uma troca. A inércia do
     trackpad que chega depois não conta como gesto novo (~220 ms de silêncio). O primeiro trabalho
     para no topo da página (é onde a página chega); do último, um gesto leva ao fecho e, de lá,
     um gesto para cima volta inteiro ao último. Abaixo do fecho a rolagem é livre. */
  const DURACAO_SLIDE = RITMO.slide;
  // paradas: o primeiro no topo (y = 0), os outros no meio do trecho de cada um
  const centros = () => zonas().map((z, i) => (i === 0 ? 0 : (z.ini + z.fim) / 2));
  const paradaFecho = () => (medidas || medir()).fecho - innerHeight * .18;
  let animandoSlide = false, gestoPreso = false, ultimaRoda = 0, seguranca = null;

  function irPara(y) {
    const lenis = LG.lenis;
    animandoSlide = true; gestoPreso = true;
    clearTimeout(seguranca);
    const soltar = () => { animandoSlide = false; };
    seguranca = setTimeout(soltar, DURACAO_SLIDE * 1000 + 300);
    lenis.scrollTo(y, { duration: DURACAO_SLIDE, lock: true, force: true, easing: (x) => 1 - Math.pow(1 - x, 3), onComplete: soltar });
  }
  // destino de um gesto na direção `dir` (+1 desce, -1 sobe), ou null para deixar a rolagem livre
  function destino(dir) {
    const c = centros(), y = scrollY, n = c.length;
    if (!n) return null;
    const s = paradaFecho();
    if (y > c[n - 1] + 2) {
      if (y > s + 2) return null;
      return dir > 0 ? (y < s - 2 ? s : null) : c[n - 1];
    }
    let k = 0;
    for (let i = 1; i < n; i++) if (Math.abs(c[i] - y) < Math.abs(c[k] - y)) k = i;
    if (dir > 0) {
      if (y < c[k] - 2) return c[k];
      return k < n - 1 ? c[k + 1] : s;
    }
    if (y > c[k] + 2) return c[k];
    if (k > 0) return c[k - 1];
    return null;   // no primeiro trabalho, para cima: nada acima
  }
  function gesto(dir, evento) {
    if (!LG.lenis) return false;
    if (animandoSlide) { evento.preventDefault(); evento.stopPropagation(); return true; }
    const alvo = destino(dir);
    if (alvo === null) return false;
    evento.preventDefault(); evento.stopPropagation();
    irPara(alvo);
    return true;
  }
  if (LG.lenis) {
    addEventListener('wheel', (e) => {
      if (celular() || e.ctrlKey) return;
      if (e.target.closest && e.target.closest('[data-lenis-prevent]')) return;   // caixas que rolam por dentro
      const agora = performance.now();
      const continuacao = agora - ultimaRoda < 220;
      ultimaRoda = agora;
      if (animandoSlide || (gestoPreso && continuacao)) { e.preventDefault(); e.stopPropagation(); return; }
      gestoPreso = false;
      if (Math.abs(e.deltaY) < 2) return;
      gesto(Math.sign(e.deltaY), e);
    }, { capture: true, passive: false });
    addEventListener('keydown', (e) => {
      if (e.target.closest && e.target.closest('input, textarea, button, [contenteditable]')) return;
      const dir = { ArrowDown: 1, PageDown: 1, ' ': e.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 }[e.key];
      if (dir) gesto(dir, e);
    }, { capture: true });
    // toque: dentro da seção a rolagem nativa é bloqueada desde o primeiro movimento e um
    // deslize de 14 px já vira troca de slide; fora dela o dedo rola a página normalmente
    let toqueY = null, toqueUsado = false;
    addEventListener('touchstart', (e) => { toqueY = e.touches[0].clientY; toqueUsado = false; }, { passive: true });
    addEventListener('touchmove', (e) => {
      if (toqueY === null || e.touches.length > 1) return;
      const dy = toqueY - e.touches[0].clientY;
      const dentro = animandoSlide || destino(Math.sign(dy) || 1) !== null;
      if (!dentro) return;
      if (e.cancelable) e.preventDefault();
      if (!toqueUsado && !animandoSlide && Math.abs(dy) > 14 && gesto(Math.sign(dy), e)) toqueUsado = true;
    }, { passive: false });
    addEventListener('touchend', () => { toqueY = null; }, { passive: true });
    // reserva: se a página parar fora de uma parada (barra de rolagem arrastada, link), encaixa
    let parado = null;
    LG.lenis.on('scroll', () => {
      clearTimeout(parado);
      parado = setTimeout(() => {
        if (animandoSlide) return;
        const c = centros(), y = scrollY;
        if (!c.length) return;
        const ult = c[c.length - 1], s = paradaFecho();
        if (y > ult + 4) { if (y < s - 4) irPara(y - ult < s - y ? ult : s); return; }
        let k = 0;
        for (let i = 1; i < c.length; i++) if (Math.abs(c[i] - y) < Math.abs(c[k] - y)) k = i;
        if (Math.abs(c[k] - y) > 4) irPara(c[k]);
      }, 160);
    });
  }

  /* ---------- o aparelho: mesmo tamanho o tempo todo, troca de lado num arco; depois do último
     trabalho sai de cena (a saída começa com o fecho) */
  const POSES = {
    trab: { x: .74, y: .5, w: .5, h: .56, giro: -.42, tampa: 0 },
    fim: { x: .74, y: 1.3, w: .38, h: .46, giro: -.9, tampa: 1 },
  };
  const POSES_CEL = {
    trab: { x: .5, y: .25, w: .74, h: .25, giro: -.18, tampa: 0 },
    fim: { x: .5, y: -.35, w: .6, h: .24, giro: -.5, tampa: 1 },
  };
  function poseTrab(base, f, arcoAlt = .1) {
    const i = Math.floor(f), t = suave(f - i);
    const s0 = lado(i), s1 = lado(Math.min(i + 1, itens.length - 1));
    const sx = s0 + (s1 - s0) * t;
    const arco = s0 !== s1 ? Math.sin(Math.PI * t) : 0;
    return { ...base, x: .5 + (base.x - .5) * sx, giro: base.giro * sx, y: base.y + arco * arcoAlt };
  }
  const ladoDe = (base, sx) => ({ ...base, x: .5 + (base.x - .5) * sx, giro: base.giro * sx });
  function quadro() {
    const vh = innerHeight, poses = celular() ? POSES_CEL : POSES;
    const m = medidas || medir();
    // a saída termina antes de o fecho chegar a meia tela
    const b = suave(lim((vh - (m.fecho - scrollY)) / (vh * .45)));
    const f = indice(zonas()), atual = Math.round(f);
    P.alvo = mistura(poseTrab(poses.trab, f, celular() ? -.03 : .1), ladoDe(poses.fim, lado(itens.length - 1)), b);
    if (ancoraFeita) {
      P.tela = itens[atual].dataset.id;
      // a pose de descanso olha para o meio da página: à direita (d) vira para a esquerda
      P.pose = lado(atual) > 0 ? 'd' : 'e';
    }
    P.trocaHero = 0;
    itens.forEach((li, i) => li.classList.toggle('ativo', i === atual));
    if (!celular()) {
      const coluna = Math.min(innerWidth - 2 * gutter(), LARGURA) / innerWidth;
      P.alvo = { ...P.alvo, x: .5 + (P.alvo.x - .5) * coluna, w: P.alvo.w * coluna };
    }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
})();
