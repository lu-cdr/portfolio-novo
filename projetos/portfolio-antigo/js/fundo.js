/* Fundo do site: a água do portfólio 3D, gravada em vídeo (build/gravar_fundo.py) e com a onda do
   cursor/dedo de verdade por cima (js/agua.js). O modo depende do aparelho, conforme os testes do
   laboratório (fundos/index.html, build/medir_fundos.py):

   - computador (mouse): o vídeo passa pelo WebGL e uma simulação de onda pequena o entorta,
     junta luz e acende as cristas (variante C do laboratório);
   - toque/celular (ou tela < 900 px): o vídeo toca como vídeo comum e um canvas transparente em
     meia resolução desenha só a luz da onda; parado, ele dorme (variante E);
   - sem WebGL2: só o vídeo; com movimento reduzido: só o primeiro quadro, parado.

   Troca o vídeo com o tema (claro: mar tropical sobre areia; escuro: oceano à noite). */
import { criarAgua } from './agua.js?v=5b903d76c4';

const raiz = document.documentElement;
const P = window.portfolio || {};
const fundo = document.querySelector('.fundo');
if (fundo) iniciar();

function iniciar() {
  const escuro = () => (raiz.dataset.theme ? raiz.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const toque = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
  const sufixo = toque ? '-leve' : '';
  const tema = () => (escuro() ? 'escuro' : 'claro');
  const ext = document.createElement('video').canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4';
  const fonte = () => `media/fundo/agua-${tema()}${sufixo}.${ext}`;
  // vindo de outra página do site: o quadro e o ponto do loop em que a água estava (js/comum.js)
  let passagem = P.passagem && P.passagem.tema === tema() ? P.passagem : null;
  // pôster: o primeiro quadro (ou o quadro da passagem), já na tela enquanto o vídeo carrega
  const poster = () => { fundo.style.backgroundImage = passagem ? `url(${passagem.quadro})` : `url(media/fundo/agua-${tema()}.webp)`; };
  poster();
  if (P.reduzido) {
    new MutationObserver(poster).observe(raiz, { attributes: true, attributeFilter: ['data-theme'] });
    return;
  }

  // progresso da rolagem na página inteira (0 no topo, 1 no fim): o fundo desliza devagar
  const rolagem = () => { const max = document.documentElement.scrollHeight - innerHeight; return max > 0 ? Math.min(1, scrollY / max) : 0; };

  const novoVideo = () => {
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'auto' });
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.className = 'agua-video';
    return v;
  };
  let video = novoVideo();
  fundo.append(video);
  const tocar = (v = video) => { const p = v.play(); if (p) p.catch(() => {}); };

  let agua = null;
  const canvas = document.createElement('canvas');
  canvas.className = 'agua-canvas';
  if (!toque) {
    agua = criarAgua({ canvas, modo: 'video', video, escuro, rolagem });
    // o vídeo vira textura da água, mas fica no DOM em tamanho cheio, atrás do canvas (que é opaco
    // e o cobre inteiro). Escondido (2 px, opacidade 0) o Chrome suspendia o decodificador dele
    // depois de um tempo "para poupar energia", e cada quadro pedido pela água travava a página
    // esperando a GPU (dezenas de segundos). Visível, ele segue tocando normalmente.
  } else {
    agua = criarAgua({ canvas, modo: 'camada', dpr: .5, escuro, rolagem: () => 0 });
    // o vídeo é o fundo de verdade aqui: desliza com a rolagem por transform (sem passar pelo WebGL)
    let antes = -1;
    const deslizar = () => {
      const r = rolagem();
      if (Math.abs(r - antes) > .001) { video.style.transform = `translate3d(0,${((.5 - r) * 10).toFixed(2)}%,0)`; antes = r; }
      requestAnimationFrame(deslizar);
    };
    requestAnimationFrame(deslizar);
  }
  if (agua) fundo.append(canvas);

  /* ordem de carregamento: o vídeo da água só começa a baixar quando o clipe de abertura do
     notebook está pronto ('palco:abrindo', ou 4 s), para não dividir a banda com ele. Até lá, e
     até o primeiro quadro, fica o pôster (a mesma água, parada); o canvas aparece junto do vídeo */
  let comecou = false;
  const comecar = () => {
    if (comecou) return;
    comecou = true;
    const pronto = () => {
      fundo.classList.add('pronto');
      if (agua) agua.iniciar();
      dispatchEvent(new Event('fundo:pronto'));
    };
    video.addEventListener('loadeddata', () => {
      if (!passagem || !video.duration) { pronto(); return; }
      // continua do ponto em que a página anterior parou (mais o tempo da troca)
      video.currentTime = (passagem.t + (Date.now() - passagem.quando) / 1000) % video.duration;
      video.addEventListener('seeked', pronto, { once: true });
      setTimeout(() => { if (!fundo.classList.contains('pronto')) pronto(); }, 1500);
    }, { once: true });
    video.src = fonte();
    tocar();
  };
  // página sem aparelho (Orçamento), ou vindo de outra página (o vídeo já está no cache): começa já
  if (passagem || !document.querySelector('script[src$="palco.js"]')) comecar();
  addEventListener('palco:abrindo', comecar, { once: true });
  setTimeout(comecar, 4000);

  /* troca de tema sem piscar: o vídeo do tema novo carrega por trás, pula para o mesmo ponto do
     loop do atual e só então entra aos poucos (no computador o shader mistura os dois; no
     celular os dois vídeos se cruzam por opacidade). Uma troca pedida no meio espera a anterior */
  const CRUZA = 900;
  const CRUZA_VEU = 650;   // pelo botão: a água cruza enquanto o véu do entardecer/amanhecer está denso
  let trocando = false, pendente = false;
  // o botão de tema avisa antes de trocar (js/comum.js > passarCeu): o vídeo do tema novo já começa
  // a carregar, fora da página, e o trocarTema() o usa quando o tema muda de fato
  let preparado = null;
  addEventListener('portfolio:tema-previsto', (e) => {
    if (!comecou || trocando || P.reduzido) return;
    const src = `media/fundo/agua-${e.detail.escuro ? 'escuro' : 'claro'}${sufixo}.${ext}`;
    if (video.src.endsWith(src) || (preparado && preparado.src === src)) return;
    const v = novoVideo();
    v.src = src; v.load();
    preparado = { src, video: v };
  });
  function trocarTema() {
    passagem = null;
    poster();
    if (!comecou) return;   // o vídeo ainda não começou: ele já vai nascer no tema novo
    if (trocando) { pendente = true; return; }
    const src = fonte();
    if (video.src.endsWith(src)) return;
    trocando = true;
    const pronto = preparado && preparado.src === src ? preparado.video : null;
    const cruza = pronto ? CRUZA_VEU : CRUZA;
    preparado = null;
    const novo = pronto || novoVideo();
    if (!pronto) novo.src = src;
    let entrou = false;
    const entrar = () => {
      if (entrou) return;
      entrou = true;
      const velho = video;
      const fim = () => {
        velho.pause(); velho.removeAttribute('src'); velho.load(); velho.remove();
        video = novo; trocando = false;
        if (pendente) { pendente = false; trocarTema(); }
      };
      if (agua && !toque) {
        agua.trocarVideo(novo, cruza, fim);
      } else {
        novo.style.transform = velho.style.transform;
        novo.style.opacity = '0';
        novo.style.transition = `opacity ${cruza}ms ease`;
        requestAnimationFrame(() => requestAnimationFrame(() => { novo.style.opacity = '1'; }));
        setTimeout(fim, cruza + 50);
      }
    };
    // pula para o mesmo ponto do loop do vídeo atual e entra; o pré-carregado pode já ter dados
    const alinhar = () => {
      novo.currentTime = video.currentTime % (novo.duration || 1);
      novo.addEventListener('seeked', () => { tocar(novo); entrar(); }, { once: true });
    };
    if (novo.readyState >= 2) alinhar(); else novo.addEventListener('loadeddata', alinhar, { once: true });
    // no computador o vídeo fica atrás do canvas da água; no celular, por cima do antigo
    if (agua && !toque) fundo.insertBefore(novo, canvas);
    else {
      // no celular o vídeo novo fica por cima do antigo: entra invisível (senão a regra .pronto o
      // mostrava na hora, antes de alinhar o loop, e a água "pulava" de um tema para o outro)
      novo.style.opacity = '0';
      fundo.insertBefore(novo, agua ? canvas : null);
    }
    setTimeout(() => { if (!entrou && novo.readyState >= 2) { tocar(novo); entrar(); } }, 2500);
  }
  new MutationObserver(trocarTema).observe(raiz, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!raiz.dataset.theme) trocarTema(); });
  // saindo para outra página: guarda o quadro atual (JPEG pequeno) e o ponto do loop
  addEventListener('pagehide', () => {
    if (!comecou || video.readyState < 2 || !video.videoWidth) return;
    try {
      const k = Math.min(1, 960 / video.videoWidth);
      const c = document.createElement('canvas');
      c.width = Math.round(video.videoWidth * k); c.height = Math.round(video.videoHeight * k);
      c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
      sessionStorage.setItem('lg-fundo', JSON.stringify({ tema: tema(), t: video.currentTime, quando: Date.now(), quadro: c.toDataURL('image/jpeg', .8) }));
    } catch (e) {}
  });
  // aba escondida: para a simulação (o rAF já para sozinho) e o vídeo
  document.addEventListener('visibilitychange', () => {
    if (!comecou) return;
    if (document.hidden) { video.pause(); agua && agua.parar(); } else { tocar(); agua && agua.iniciar(); }
  });
}
