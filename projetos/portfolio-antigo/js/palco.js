/* Palco: o aparelho da vez, feito de vídeos com fundo transparente (renderizados no Blender por
   build/renderizar_aparelhos.py), e a tela dele, que é HTML encaixado por cima.

   O script da página (js/inicio.js ou js/trabalhos.js) decide, a cada quadro, onde o aparelho fica (P.alvo: centro x/y e tamanho w/h em
   fração da janela), em que pose ele descansa (P.pose: h de frente, d virado para a esquerda
   quando está à direita da página, e virado para a direita) e qual projeto aparece (P.tela).
   Toda vez que o projeto ou a pose mudam, o aparelho dá um giro de 360°: toca o vídeo de saída
   (meia volta, some no fim), troca o conteúdo enquanto está invisível e toca o de entrada do
   aparelho novo (aparece no começo e termina de frente para a pose nova).

   A tela acompanha o vídeo quadro a quadro: cada clipe tem um JSON com os 4 cantos da tela em
   cada quadro, e um matrix3d (homografia) leva um retângulo HTML de tamanho fixo até eles. Assim
   o site rola dentro do notebook em resolução nativa, sem textura nem WebGL.

   Safari não mostra o alpha do VP9: lá o vídeo é um MP4 com a cor em cima e o alpha embaixo, e
   um canvas WebGL mínimo junta as duas metades (só nesse caso). */
(function () {
  'use strict';
  const P = window.portfolio;
  if (!P) return;

  const W = 1280, H = 960;              // quadro dos vídeos (o .aparelho tem esse tamanho e escala)
  const TROCA = .95;                     // o giro inteiro, em segundos (saída + entrada)
  const SOME = [.361, .475];             // na saída: some entre esses instantes (t .38–.50 do giro)
  const APARECE = .114;                  // na entrada: aparece nos primeiros 0,114 s
  // fração do quadro que o aparelho ocupa em repouso (medido nos renders): largura e altura
  const OCUPA = { notebook: [.573, .45], celular: [.231, .43], livro: [.668, .567], pingado: [.79, .45] };
  const MIDIA = 'media/aparelhos/';

  const leve = innerWidth < 900;
  const sufixo = leve ? '-leve' : '';
  const ua = navigator.userAgent;
  const webkit = /AppleWebKit/.test(ua) && !/(Chrome|Chromium|Edg)\//.test(ua);
  const reduzido = P.reduzido;

  /* ---------- aparelhos disponíveis: o que não tem vídeo ainda cai no notebook */
  // pingado = o notebook com o pacote de café e o copo ao lado (o projeto com "acessorios")
  const DISPONIVEIS = { notebook: true, livro: true, celular: true, pingado: true };
  // poses de descanso que cada aparelho tem: o livreto fica sempre de frente (h), dos dois lados
  const POSES = { livro: 'h' };
  const poseDe = (aparelho, k) => (POSES[aparelho] && !POSES[aparelho].includes(k) ? POSES[aparelho][0] : k);
  const aparelhoDe = (p) => (p.acessorios ? 'pingado' : DISPONIVEIS[p.dispositivo] ? p.dispositivo : 'notebook');
  const formaTela = (aparelho) => (aparelho === 'celular' ? 'celular' : 'notebook');
  const porId = () => Object.fromEntries(P.projetos.map((p) => [p.id, p]));

  /* ---------- montagem */
  const palco = document.createElement('div');
  palco.className = 'palco';
  palco.setAttribute('aria-hidden', 'true');
  const caixa = document.createElement('div');
  caixa.className = 'aparelho';
  caixa.style.width = W + 'px'; caixa.style.height = H + 'px';
  const pose = new Image();
  pose.className = 'pose';
  pose.alt = '';
  const tela = document.createElement('div');
  tela.className = 'tela notebook';
  // o recorte do copo (Pingado) fica num invólucro 2D do tamanho do quadro, não na tela: clip-path
  // num elemento com matrix3d que muda a cada quadro fazia o Chrome refazer uma máscara cara a cada
  // quadro do giro, e depois de algumas trocas a GPU engasgava e o navegador travava
  const envolve = document.createElement('div');
  envolve.className = 'tela-recorte';
  envolve.append(tela);
  caixa.append(pose, envolve);
  palco.append(caixa);
  document.body.prepend(palco);

  /* ---------- clipes
     Cada <video> vivo segura um decodificador e quadros na GPU. Guardar todos os clipes já
     usados como vídeos (eram ~45 depois de uma volta pelos trabalhos) travava o navegador depois
     de alguns minutos. Agora há duas camadas:
     - arquivos: os bytes de cada clipe, baixados uma vez e guardados como blob (barato);
     - vídeos: no máximo MAX_VIDEOS elementos <video> vivos; o usado há mais tempo é descarregado
       de verdade (src removido + load(), o que libera o decodificador) e sai do DOM.
     Os cantos (JSON) são pequenos e ficam todos guardados. */
  const MAX_VIDEOS = leve ? 3 : 4;
  const urlDe = (aparelho, nome) => MIDIA + `${aparelho}/${nome}${sufixo}.${webkit ? 'mp4' : 'webm'}`;
  const arquivos = new Map();
  // prioridade: 'high' para o que a chegada mostra; 'low' para o pré-carregamento (o navegador
  // atende antes o que é alto e não divide a banda com o que pode esperar)
  function arquivo(url, prioridade = 'auto') {
    if (!arquivos.has(url)) {
      arquivos.set(url, fetch(url, { priority: prioridade }).then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
        .then((b) => URL.createObjectURL(b))
        .catch(() => url));   // sem blob (erro de rede): o vídeo carrega direto da URL
    }
    return arquivos.get(url);
  }
  const jsons = new Map();
  function dados(aparelho, nome) {
    const k = aparelho + '/' + nome;
    if (!jsons.has(k)) jsons.set(k, fetch(MIDIA + `${k}.json`).then((r) => r.json()));
    return jsons.get(k);
  }
  const clipes = new Map();
  let usoN = 0;
  function liberar(c) {
    c.v.pause();
    c.v.removeAttribute('src');
    c.v.load();
    c.v.remove();
    clipes.delete(c.aparelho + '/' + c.nome);
  }
  function clipe(aparelho, nome) {
    const chave = aparelho + '/' + nome;
    if (clipes.has(chave)) { const c = clipes.get(chave); c.uso = ++usoN; return c; }
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    if (!webkit) caixa.insertBefore(v, envolve);
    const c = { v, nome, aparelho, cantos: null, pronto: null, uso: ++usoN };
    c.json = dados(aparelho, nome).then((d) => { c.cantos = d.cantos; c.recorte = d.recorte || null; c.fps = d.fps; });
    c.pronto = Promise.all([c.json, arquivo(urlDe(aparelho, nome)).then((src) => new Promise((ok) => {
      if (!clipes.has(chave)) return ok();   // já foi liberado antes de carregar
      v.src = src;
      v.addEventListener('canplaythrough', ok, { once: true });
      setTimeout(ok, 4000);
    }))]);
    clipes.set(chave, c);
    // passou do limite: libera os usados há mais tempo (nunca o que está na tela)
    while (clipes.size > MAX_VIDEOS) {
      let velho = null;
      for (const x of clipes.values()) if (x !== tocando && x !== c && (!velho || x.uso < velho.uso)) velho = x;
      if (!velho) break;
      liberar(velho);
    }
    return c;
  }
  // pré-baixa os arquivos (não os vídeos) dos giros de um aparelho: ~150 KB cada
  function aquecer(aparelho, prioridade = 'low') {
    for (const k of POSES[aparelho] || 'hde') for (const f of ['', '_anti']) {
      for (const n of ['saida_' + k + f, 'entrada_' + k + f]) { arquivo(urlDe(aparelho, n), prioridade); dados(aparelho, n); }
    }
    if (aparelho === 'livro') for (const n of ['conteudo', 'virar']) { arquivo(urlDe('livro', n), prioridade); dados('livro', n); }
  }
  // sentido do giro: acompanha o deslocamento. Indo para a esquerda da página (de d para e, ou de
  // d para h, ou de h para e) gira anti-horário; para a direita ou parado, horário
  const ORDEM = { e: -1, h: 0, d: 1 };
  const sentido = (de, para) => (ORDEM[para] < ORDEM[de] ? '_anti' : '');

  /* ---------- Safari: junta cor (metade de cima) e alpha (metade de baixo) num canvas WebGL */
  /* ---------- o aparelho aparece num canvas, não no <video>
     O palco desenha cada quadro do vídeo no canvas no mesmo callback em que move a tela HTML:
     os dois vão juntos para o mesmo quadro da página. Com o <video> visível, o navegador
     apresentava o vídeo por conta própria (no compositor) e a tela seguia pela thread principal,
     então nos giros um chegava antes do outro, ainda mais no celular. Os <video> ficam no DOM,
     escondidos, só como fonte (sem autoplay: o Chrome pausa vídeo autoplay invisível).
     No Safari o canvas é WebGL e junta a cor e o alpha do MP4 empilhado; nos outros, 2D. */
  let juntar = null;
  // o canvas acompanha a resolução do clipe (o livreto vem em 1920 x 1440; os outros em 1280 x 960)
  const medidaDe = (cv, w, h) => { if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } };
  if (!webkit) {
    const cv = document.createElement('canvas');
    cv.width = leve ? 720 : W; cv.height = leve ? 540 : H;
    caixa.insertBefore(cv, envolve);
    const ctx = cv.getContext('2d');
    juntar = (v) => {
      if (v.readyState < 2 || !v.videoWidth) return;
      medidaDe(cv, v.videoWidth, v.videoHeight);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(v, 0, 0, cv.width, cv.height);
    };
    juntar.canvas = cv;
  } else {
    const cv = document.createElement('canvas');
    cv.width = leve ? 720 : W; cv.height = leve ? 540 : H;
    caixa.insertBefore(cv, envolve);
    const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true });
    if (gl) {
      const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 u;void main(){u=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, 'precision mediump float;uniform sampler2D t;varying vec2 u;void main(){vec3 c=texture2D(t,vec2(u.x,u.y*.5)).rgb;float a=texture2D(t,vec2(u.x,.5+u.y*.5)).r;gl_FragColor=vec4(c,a);}'));
      gl.linkProgram(prog); gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      juntar = (v) => {
        if (v.readyState < 2 || !v.videoWidth) return;
        medidaDe(cv, v.videoWidth, v.videoHeight / 2);   // o MP4 empilhado tem o dobro da altura
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v);
        gl.viewport(0, 0, cv.width, cv.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
      juntar.canvas = cv;
    }
  }

  /* ---------- homografia: retângulo w×h -> quadrilátero (TL, TR, BR, BL) em px do quadro.
     Devolve os 8 coeficientes de x' = (a·x + b·y + c) / (g·x + h·y + 1), y' = (d·x + e·y + f) / (...) */
  function homografia(w, h, q) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
    const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    const det = dx1 * dy2 - dx2 * dy1;
    const g = (sx * dy2 - dx2 * sy) / det, hh = (dx1 * sy - sx * dy1) / det;
    // unidade -> quadrilátero, com o retângulo escalado para a unidade
    return { a: (x1 - x0 + g * x1) / w, b: (x3 - x0 + hh * x3) / h, c: x0, d: (y1 - y0 + g * y1) / w, e: (y3 - y0 + hh * y3) / h, f: y0, g: g / w, h: hh / h };
  }
  const matriz = (m) => `matrix3d(${m.a},${m.d},0,${m.g},${m.b},${m.e},0,${m.h},0,0,1,0,${m.c},${m.f},0,1)`;
  // área com sinal: negativa = a tela está de costas (o giro passou dos 90°)
  const area = (q) => q.reduce((s, p, i) => { const n = q[(i + 1) % 4]; return s + p[0] * n[1] - n[0] * p[1]; }, 0) / 2;

  let telaW = 1440, telaH = 900;
  let recorteAntes = '';
  function encaixar(cantos, recorte) {
    if (!cantos) { tela.style.visibility = 'hidden'; return; }
    const q = cantos.map(([x, y]) => [x * W, y * H]);
    if (area(q) < 4000) { tela.style.visibility = 'hidden'; return; }   // de costas, de lado ou fechada
    const m = homografia(telaW, telaH, q);
    tela.style.transform = matriz(m);
    tela.style.visibility = 'visible';
    // um objeto na frente da tela (o copo do Pingado): fura o invólucro com a silhueta dele
    // (evenodd), em px do quadro, sem passar pela homografia
    let cp = '';
    if (recorte) {
      const pts = recorte.map(([x, y]) => `${(x * W).toFixed(1)} ${(y * H).toFixed(1)}`);
      cp = `path(evenodd, 'M0 0H${W}V${H}H0Z M${pts.join(' L')}Z')`;
    }
    if (cp !== recorteAntes) { envolve.style.clipPath = cp; recorteAntes = cp; }
  }

  /* ---------- conteúdo da tela */
  let animConteudo = null, timerTelas = null, voltaLivro = 0;
  function pararConteudo() {
    if (animConteudo) { animConteudo.cancel(); animConteudo = null; }
    clearInterval(timerTelas); timerTelas = null;
    voltaLivro++;
    rolando = false;
  }
  function montarConteudo(p, aparelho) {
    pararConteudo();
    rolo = null;
    tela.className = 'tela ' + formaTela(aparelho);
    [telaW, telaH] = formaTela(aparelho) === 'celular' ? [660, 1440] : [1440, 900];
    const t = p.tela || {};
    tela.style.background = t.fundo || '';
    if (aparelho === 'livro') {
      tela.innerHTML = '';   // o livreto não tem tela: as páginas estão no próprio vídeo
    } else if (aparelho === 'celular' && t.srcs) {
      tela.innerHTML = `<div class="telas">${t.srcs.map((s, i) => `<img src="${s}" alt="" style="transform:translateX(${i ? 100 : 0}%)">`).join('')}</div>`;
    } else if (t.rolagem) {
      // a captura longa do site rola dentro de um canvas do tamanho da tela, que desenha só o
      // trecho visível. Antes era a imagem inteira (até 1440 x 7200 px) dentro da tela com
      // matrix3d: o Chrome re-rasterizava essa camada gigante a cada quadro dos giros e, depois de
      // alguns minutos, o cache de blocos da GPU estourava e o navegador travava
      tela.innerHTML = `<canvas class="rolo" width="${ROLO_W}" height="${ROLO_H}"></canvas>`;
      montarRolo(tela.querySelector('.rolo'), t);
    } else {
      // sem rolagem (ou aparelho que ainda não existe): a capa parada, cobrindo a tela
      const capa = t.src || t.poster || (t.srcs && t.srcs[0]) || '';
      tela.innerHTML = `<img src="${capa}" alt="" style="height:100%;object-fit:${t.srcs ? 'contain' : 'cover'}">`;
    }
  }
  /* ---------- rolagem do site no canvas da tela: a captura (1200 px de largura) desenhada 1:1 */
  const ROLO_W = 1200, ROLO_H = 750;
  let rolo = null;   // { cv, ctx, img, pronta, y }
  function montarRolo(cv, t) {
    const ctx = cv.getContext('2d', { alpha: false });
    const r = rolo = { cv, ctx, img: null, pronta: false, y: 0 };
    const desenhar = (img) => {
      if (rolo !== r) return;
      const esc = ROLO_W / img.naturalWidth;
      ctx.fillStyle = '#0a0a0b'; ctx.fillRect(0, 0, ROLO_W, ROLO_H);
      ctx.drawImage(img, 0, r.y / esc, img.naturalWidth, Math.min(img.naturalHeight, ROLO_H / esc), 0, 0, ROLO_W, Math.min(ROLO_H, img.naturalHeight * esc));
    };
    r.desenhar = () => { if (r.img) desenhar(r.img); };
    // a capa (leve) segura a tela enquanto a captura longa chega
    const carregar = (src) => { const i = new Image(); i.decoding = 'async'; i.src = src; return i.decode().then(() => i); };
    if (t.src) carregar(t.src).then((i) => { if (!r.pronta) desenhar(i); }).catch(() => {});
    carregar(t.rolagem).then((i) => { r.img = i; r.pronta = true; r.desenhar(); }).catch(() => {});
  }
  // desce a página inteira na janela da frase, segura embaixo e volta (vai e vem), a 30 quadros/s
  function rolarSite(janela) {
    const r = rolo;
    if (!r) return;
    const curva = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const ESPERA = 500, SEGURA = 900;
    const ciclo = ESPERA + janela + SEGURA;
    let inicio = null, ultimo = 0;
    const passo = (agora) => {
      if (rolo !== r || !rolando) return;
      requestAnimationFrame(passo);
      if (!r.pronta) return;
      if (inicio === null) inicio = agora;
      if (agora - ultimo < 1000 / 30) return;
      ultimo = agora;
      const desce = r.img.naturalHeight * (ROLO_W / r.img.naturalWidth) - ROLO_H;
      if (desce <= 0) return;
      const k = Math.floor((agora - inicio) / ciclo), dentro = (agora - inicio) % ciclo;
      let u = Math.min(1, Math.max(0, (dentro - ESPERA) / janela));
      if (k % 2) u = 1 - u;   // volta
      r.y = desce * curva(u);
      r.desenhar();
    };
    rolando = true;
    requestAnimationFrame(passo);
  }
  let rolando = false;

  // a animação do conteúdo começa quando o giro de entrada termina
  function animarConteudo() {
    pararConteudo();
    if (reduzido) return;
    if (atual && atual.aparelho === 'livro') {
      // abre, folheia e fecha na contracapa; uma meia volta leva de novo à capa, e repete até a troca
      const volta = voltaLivro;
      (async () => {
        while (volta === voltaLivro) {
          await tocar(clipe('livro', 'conteudo'), null);
          if (volta !== voltaLivro) break;
          // na primeira tela a próxima frase já vem: fica fechado na contracapa, de onde a saída parte
          if (P.trocaHero && P.trocaHero - performance.now() < 1300) break;
          await tocar(clipe('livro', 'virar'), null);
        }
      })();
      return;
    }
    const janela = Math.max(2, (P.ritmo.frase || 7.6) - TROCA) * 1000;
    if (tela.querySelector('.rolo')) { rolarSite(janela); return; }
    const imgs = [...tela.querySelectorAll('.telas img')];
    if (imgs.length > 1) {
      let i = 0;
      timerTelas = setInterval(() => {
        const j = (i + 1) % imgs.length;
        imgs[i].style.transform = 'translateX(-100%)';
        imgs[j].style.transition = 'none'; imgs[j].style.transform = 'translateX(100%)';
        imgs[j].offsetWidth;   // aplica a posição de partida antes de animar
        imgs[j].style.transition = ''; imgs[j].style.transform = 'translateX(0)';
        i = j;
      }, janela / imgs.length);
    }
  }

  /* ---------- tocar um clipe com a tela acompanhando */
  let tocando = null;    // clipe ativo (o último quadro dele fica na tela em repouso)
  let opacidadeClipe = 1;
  function mostrar(c) {
    if (tocando && tocando !== c) {
      tocando.v.pause();
      if (!juntar) tocando.v.classList.remove('ativo');
    }
    tocando = c;
    // com canvas, o <video> nunca aparece: o canvas mostra o quadro desenhado
    if (juntar) juntar.canvas.classList.add('ativo');
    else c.v.classList.add('ativo');
    pose.hidden = true;
  }
  const indiceDe = (c, tempo, n) => Math.min(n - 1, Math.max(0, Math.round(tempo * c.fps)));
  function quadroDe(c, tempo) {
    if (!c.cantos) return null;
    return c.cantos[indiceDe(c, tempo, c.cantos.length)];
  }
  const recorteDe = (c, tempo) => (c.recorte ? c.recorte[indiceDe(c, tempo, c.recorte.length)] : null);
  // toca do começo ao fim; opacidade(t) devolve a presença do aparelho naquele instante
  function tocar(c, opacidade) {
    c.uso = ++usoN;
    return c.pronto.then(() => new Promise((fim) => {
      if (!clipes.has(c.aparelho + '/' + c.nome)) return fim();   // liberado antes de tocar: pula
      const v = c.v;
      v.currentTime = 0;
      let acabou = false;
      const terminar = () => { if (acabou) return; acabou = true; atualizar(v.duration || 1); fim(); };
      const atualizar = (t) => {
        if (tocando !== c) return;   // outro clipe já tomou o palco (troca no meio do folhear)
        opacidadeClipe = opacidade ? opacidade(t) : 1;
        encaixar(quadroDe(c, t), recorteDe(c, t));
        if (juntar) juntar(v);
      };
      const porQuadro = 'requestVideoFrameCallback' in v;
      const laco = (agora, meta) => {
        if (acabou) return;
        atualizar(meta ? meta.mediaTime : v.currentTime);
        porQuadro ? v.requestVideoFrameCallback(laco) : requestAnimationFrame(() => laco());
      };
      v.addEventListener('ended', terminar, { once: true });
      setTimeout(terminar, (v.duration || 2) * 1000 + 1500);   // se o 'ended' não vier
      const p = v.play();
      mostrar(c);
      atualizar(0);
      if (p && p.catch) p.catch(terminar);
      porQuadro ? v.requestVideoFrameCallback(laco) : requestAnimationFrame(() => laco());
    }));
  }
  const passo01 = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));

  /* ---------- estado do palco e trocas */
  let atual = null;           // { projeto, pose, aparelho }
  let exibido = 'notebook';   // o aparelho que está no palco agora: troca no meio do giro (invisível),
                              // antes de 'atual', que só muda quando a entrada termina
  let trocando = false;

  function poseParada(aparelho, k) {
    // repouso sem vídeo (movimento reduzido): a imagem da pose e os cantos do fim da entrada
    pose.src = MIDIA + `${aparelho}/pose-${k}${sufixo}.webp`;
    pose.hidden = false;
    dados(aparelho, 'entrada_' + k).then((d) => encaixar(d.cantos[d.cantos.length - 1], d.recorte && d.recorte[d.recorte.length - 1]));
  }

  async function trocar(para) {
    trocando = true;
    const proj = porId()[para.projeto];
    const aparelho = aparelhoDe(proj);
    if (reduzido) {
      montarConteudo(proj, aparelho);
      exibido = aparelho;
      poseParada(aparelho, poseDe(aparelho, para.pose));
      atual = { ...para, aparelho };
      trocando = false;
      return;
    }
    aquecer(aparelho, 'high');
    const f = atual ? sentido(atual.pose, para.pose) : '';
    const saida = atual && clipe(atual.aparelho, 'saida_' + poseDe(atual.aparelho, atual.pose) + f);
    // a entrada começa a carregar já, enquanto a saída gira (fica pronta antes do meio do giro)
    const entrada = clipe(aparelho, 'entrada_' + poseDe(aparelho, para.pose) + f);
    if (saida) {
      pararConteudo();
      await tocar(saida, (t) => 1 - passo01(SOME[0], SOME[1], t));
    }
    // invisível: troca o conteúdo e as medidas e entra com o aparelho novo, no mesmo sentido do giro
    montarConteudo(proj, aparelho);
    exibido = aparelho;
    await tocar(entrada, (t) => passo01(0, APARECE, t));
    atual = { ...para, aparelho };
    animarConteudo();
    trocando = false;
  }

  // chegada: o notebook abre (o primeiro projeto do hero é um site)
  async function chegar() {
    // o projeto e a pose da chegada: a página pode fixá-los (P.telaInicial, P.poseInicial), porque
    // P.tela e P.pose acompanham a rolagem e podem mudar antes de este script rodar
    const telaIni = P.telaInicial || P.tela;
    const proj = porId()[telaIni];
    const aparelho = aparelhoDe(proj);
    montarConteudo(proj, aparelho);
    exibido = aparelho;
    // pose de chegada: no Início, de frente (h); em Trabalhos, a do lado do projeto (d ou e)
    const poseIni = P.poseInicial || P.pose || 'h', k = poseDe(aparelho, poseIni);
    if (reduzido) { poseParada(aparelho, k); atual = { projeto: telaIni, pose: poseIni, aparelho }; return; }
    /* ordem de carregamento da chegada: primeiro o clipe de abertura (prioridade alta) e o site da
       tela; a frase do hero (js/inicio.js) e o vídeo da água (fundo.js) esperam o evento
       'palco:abrindo'; os giros dos outros aparelhos só baixam depois que a água chegou. Enquanto
       o clipe não chega, o notebook fechado já está no lugar, com um brilho passando (.carregando) */
    trocando = true;
    let c;
    // P.chegada 'abrir' (Início): o notebook fechado abre; 'entrada' (Trabalhos) ou outro aparelho:
    // a metade de entrada do giro, já na pose do lado certo
    const abrir = P.chegada !== 'entrada' && aparelho === 'notebook' && k === 'h';
    if (abrir) {
      pose.src = MIDIA + `notebook/fechado${sufixo}.webp`;
      caixa.style.setProperty('--mascara', `url("${pose.src}")`);
      caixa.classList.add('carregando');
      arquivo(urlDe('notebook', 'abrir'), 'high');
      c = clipe('notebook', 'abrir');
    } else {
      arquivo(urlDe(aparelho, 'entrada_' + k), 'high');
      c = clipe(aparelho, 'entrada_' + k);
    }
    await c.pronto;
    caixa.classList.remove('carregando');
    dispatchEvent(new Event('palco:abrindo'));
    // os giros do aparelho da chegada são os primeiros de que o hero vai precisar
    aquecer(aparelho, 'low');
    await tocar(c, abrir ? null : (t) => passo01(0, APARECE, t));
    atual = { projeto: telaIni, pose: poseIni, aparelho };
    animarConteudo();
    trocando = false;
    P.pronta = true;
    // por último, em segundo plano: os giros de todos os aparelhos (só os bytes, sem criar vídeos),
    // depois que a água chegou (ou 6 s, se ela não vier), para a primeira troca não esperar a rede
    let foi = false;
    const resto = () => { if (foi) return; foi = true; [...new Set(P.projetos.map(aparelhoDe))].forEach((x) => aquecer(x, 'low')); };
    addEventListener('fundo:pronto', resto, { once: true });
    setTimeout(resto, 6000);
  }

  /* ---------- a cada quadro: posição e tamanho do aparelho, e se precisa trocar */
  let antes = '';
  function quadro() {
    const a = P.alvo, vw = innerWidth, vh = innerHeight;
    const ocupa = OCUPA[exibido] || OCUPA.notebook;
    // escala que faz o aparelho caber em w×h da janela (com a mesma régua do site 3D)
    // no celular o aparelho cabe numa faixa baixa no alto da tela; o celular (alto e estreito)
    // ficava pequeno nela: ganha 30% e desce um pouco para não encostar no topo
    const fone = leve && exibido === 'celular';
    const s = Math.min((a.w * vw) / (ocupa[0] * W), (a.h * vh) / (ocupa[1] * W)) * (fone ? 1.3 : 1);
    const x = a.x * vw - W / 2, y = (a.y + (fone ? .02 : 0)) * vh - H / 2;
    // na saída para o Sobre a tampa "fecha" (P.alvo.tampa vai a 1): aqui o aparelho só some
    const presenca = opacidadeClipe * (1 - passo01(.35, .9, a.tampa));
    const t = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})|${presenca.toFixed(3)}`;
    if (t !== antes) {
      const [tr, op] = t.split('|');
      caixa.style.transform = tr;
      caixa.style.opacity = op;
      antes = t;
    }
    if (atual && !trocando && P.tela && P.pose && (P.tela !== atual.projeto || P.pose !== atual.pose)) {
      trocar({ projeto: P.tela, pose: P.pose });
    }
    requestAnimationFrame(quadro);
  }

  chegar();
  requestAnimationFrame(quadro);
  window.palco = { clipes, get atual() { return atual; }, get trocando() { return trocando; } };
})();
