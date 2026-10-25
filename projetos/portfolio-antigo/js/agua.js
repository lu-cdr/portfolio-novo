/* Água do portfólio 3D, sem three.js: WebGL2 cru, só o fundo (gesso + água + cáustica + ondas do
   mouse). É o shader de projetos/portfolio-3d/js/cena.js sem o reflexo do notebook, que era a
   parte cara. Dois modos:

   - 'shader': desenha tudo ao vivo (gesso, ondulação, cáustica, brilho), em resolução reduzida;
   - 'video':  o fundo já vem pronto num vídeo em loop (gravado deste mesmo shader, sem mouse) e
               aqui só entra a onda do mouse: a simulação entorta o vídeo (refração), junta luz onde
               a onda concentra (foco da cáustica) e acende as cristas. Bem mais barato: a cáustica
               (o laço de senos por pixel) não roda mais.

   A simulação é a mesma equação de onda num mapa de alturas pequeno (r = altura, g = velocidade),
   em ping-pong entre duas texturas de meia precisão. Sem EXT_color_buffer_float, não liga. */

const VS = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

const FS_SIM = `#version 300 es
precision highp float;
uniform sampler2D uAnt; uniform vec2 uTexel; uniform float uAspecto;
uniform vec2 uA, uB; uniform float uForca; uniform vec3 uGota;
uniform float uBorda;   // 0..1: quanto as bordas absorvem a onda (1 no celular)
in vec2 vUv; out vec4 cor;
float aoSegmento(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-7), 0., 1.); return length(pa - ba * h); }
void main(){
  vec4 d = texture(uAnt, vUv);
  float media = (texture(uAnt, vUv + vec2(uTexel.x, 0.)).r + texture(uAnt, vUv - vec2(uTexel.x, 0.)).r
               + texture(uAnt, vUv + vec2(0., uTexel.y)).r + texture(uAnt, vUv - vec2(0., uTexel.y)).r) * .25;
  d.g += (media - d.r) * 2.;
  d.g *= .993 - .009 * uBorda;   // atrito: no celular a onda perde força mais rápido
  d.r += d.g;
  d.r *= .997;
  vec2 asp = vec2(uAspecto, 1.);
  float k = max(0., 1. - aoSegmento(vUv * asp, uA * asp, uB * asp) / .042);
  d.r -= uForca * (.5 - .5 * cos(k * 3.14159));
  float kg = max(0., 1. - length((vUv - uGota.xy) * asp) / .018);
  d.r -= uGota.z * (.5 - .5 * cos(kg * 3.14159));
  // a borda da simulação é uma parede (a textura repete o último pixel): a onda bate e volta, e
  // numa tela estreita os reflexos se cruzam sem parar. Uma faixa de 14% em cada borda amortece a
  // onda aos poucos, como se o mar continuasse além da tela (o mesmo do portfólio 3D)
  float aBorda = min(min(vUv.x, 1. - vUv.x) * uAspecto, min(vUv.y, 1. - vUv.y));
  d.rg *= 1. - (1. - smoothstep(0., .14, aBorda)) * .22 * uBorda;
  if (d.r != d.r || d.g != d.g) d = vec4(0.);
  d.rg = clamp(d.rg, -1.5, 1.5);
  cor = d;
}`;

// partes comuns aos dois modos: inclinação da água a partir do mapa de alturas
const FS_COMUM = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 saida;
uniform sampler2D uAltura; uniform vec2 uTexel; uniform float uAspecto;
uniform float uTempo, uRolagem, uEscuro, uLeve;
vec2 inclinacao(out float lap){
  float hC = texture(uAltura, vUv).r;
  float hE = texture(uAltura, vUv + vec2(uTexel.x, 0.)).r, hW = texture(uAltura, vUv - vec2(uTexel.x, 0.)).r;
  float hN = texture(uAltura, vUv + vec2(0., uTexel.y)).r, hS = texture(uAltura, vUv - vec2(0., uTexel.y)).r;
  lap = hE + hW + hN + hS - 4. * hC;
  return vec2(hE - hW, hN - hS);
}
vec3 brilho(vec3 n){
  vec3 L = normalize(vec3(-.35, .55, .76));
  float esp = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 90.);
  return esp * mix(vec3(.9), vec3(.62, .76, 1.), uEscuro) + dot(n.xy, vec2(-.35, .55)) * mix(vec3(.12), vec3(.035, .06, .13), uEscuro);
}
`;

const FS_SHADER = FS_COMUM + `
uniform sampler2D uGesso;
uniform vec3 uAreia, uVeu, uMar1, uMar2, uCaus1, uCaus2;
uniform float uSoAmbiente;   // 1 = sem a onda do mouse (para gravar o vídeo do fundo)
vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1. + 2. * fract(sin(p) * 43758.5453); }
vec3 gesso(vec2 p){
  float l = texture(uGesso, p / 4.).r;
  vec3 c = vec3(.78 + .2 * l) * uAreia;
  c += hash2(floor(p * 420.)).x * .008;
  return c;
}
float ondas(vec2 q){
  return (texture(uGesso, (q + vec2(uTempo * .13, uTempo * .09)) / 6.).g - .5) * 1.1
       + (texture(uGesso, (q * 2.3 - uTempo * .17) / 14.).b - .5) * .55;
}
float caustica(vec2 p, float t){
  vec2 i = p; float c = 1., inten = .005;
  float voltas = uLeve > .5 ? 2. : 4.;
  for (int n = 0; n < 4; n++){
    if (float(n) >= voltas) break;
    float tt = t * (1. - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1. / max(length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten))), 1e-3);
  }
  c /= voltas;
  c = 1.17 - pow(c, 1.4);
  return min(pow(abs(c), 7.), 4.);
}
void main(){
  vec2 uv = vUv, asp = vec2(uAspecto, 1.);
  float lap; vec2 g = inclinacao(lap) * (1. - uSoAmbiente); lap *= 1. - uSoAmbiente;
  vec2 q = uv * asp * 4.;
  float e = .02;
  float a0 = ondas(q), ax = ondas(q + vec2(e, 0.)), ay = ondas(q + vec2(0., e));
  g += vec2(ax - a0, ay - a0) * (uLeve > .5 ? .025 : .05);
  vec3 n = normalize(vec3(-g * 14., 1.));
  vec2 refr = g * .16;
  vec2 p = (uv + refr) * asp * 2.1 + vec2(0., uRolagem * 2.1);
  vec3 cor = gesso(p);
  vec3 mar = mix(uMar1, uMar2, pow(1. - uv.y, 1.4));
  mar *= .82 + (cor.g - .92) * 2.4;
  cor = mix(cor, mar, uEscuro);
  float foco = clamp(-lap * 80., -.6, 2.6);
  vec2 pc = ((uv + refr * 2.5) * asp + vec2(0., uRolagem)) * 6.2831 * 1.6;
  float ca = caustica(mod(pc, 6.2831 * 4.) - 250., uTempo * .32 + 23.);
  cor += mix(uCaus1, uCaus2, uEscuro) * ca * (.17 + .38 * max(foco, 0.)) * mix(1.35, .55, uEscuro) - foco * .02 * (1. - uEscuro);
  vec3 tropical = mix(uVeu, mix(uVeu, vec3(1.), .65), pow(1. - uv.y, 1.3));
  cor *= mix(tropical, vec3(1.), uEscuro);
  cor += brilho(n);
  saida = vec4(clamp(cor, 0., 1.), 1.);
}`;

const FS_VIDEO = FS_COMUM + `
uniform sampler2D uVideo; uniform vec2 uCobre;   // uCobre: escala do "object-fit: cover"
uniform sampler2D uVideo2; uniform float uMistura;   // troca de tema: o vídeo novo entra aos poucos
uniform vec3 uCaus1, uCaus2;
void main(){
  float lap; vec2 g = inclinacao(lap);
  vec3 n = normalize(vec3(-g * 14., 1.));
  // o vídeo entortado pela onda, como o gesso visto através da água. Amplia 10% e, com a rolagem
  // (uRolagem = 0 no topo da página, 1 no fim), desliza nessa sobra: o fundo anda devagar, como o
  // piso que passava por baixo no portfólio 3D
  vec2 uv = (vUv + g * .16 * 1.4 - .5) * uCobre * .9 + .5 - vec2(0., (uRolagem - .5) * .1);
  vec2 st = vec2(uv.x, 1. - uv.y);
  vec3 cor = mix(texture(uVideo, st).rgb, texture(uVideo2, st).rgb, uMistura);
  // onde a onda junta luz, a cáustica do vídeo acende (ela já está lá: aqui só ganha foco)
  float foco = clamp(-lap * 80., -.6, 2.6);
  float luz = max(dot(cor, vec3(.33)) - mix(.78, .12, uEscuro), 0.) * 3.;
  cor += mix(uCaus1, uCaus2, uEscuro) * (luz * .5 + .06) * max(foco, 0.) * mix(1., .6, uEscuro) - foco * .02 * (1. - uEscuro);
  // só a parte do brilho que vem da onda do mouse (a ondulação de fundo já está no vídeo)
  cor += brilho(n) - brilho(vec3(0., 0., 1.));
  saida = vec4(clamp(cor, 0., 1.), 1.);
}`;

// modo 'camada': canvas transparente por cima de um <video> comum. Sem refração (o vídeo não passa
// pelo WebGL): só a luz da onda. Cor pré-multiplicada: rgb = luz somada, a = quanto escurece o que
// está embaixo (o vale da onda e o lado da crista contra a luz)
const FS_CAMADA = FS_COMUM + `
uniform vec3 uCaus1, uCaus2;
void main(){
  float lap; vec2 g = inclinacao(lap);
  vec3 n = normalize(vec3(-g * 14., 1.));
  float foco = clamp(-lap * 80., -.6, 2.6);
  vec3 L = normalize(vec3(-.35, .55, .76));
  float esp = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 60.);
  float lado = dot(n.xy, vec2(-.35, .55));
  vec3 luz = esp * mix(vec3(.9), vec3(.62, .76, 1.), uEscuro)
           + mix(uCaus1, uCaus2, uEscuro) * max(foco, 0.) * mix(.22, .14, uEscuro)
           + max(lado, 0.) * mix(vec3(.14), vec3(.04, .07, .15), uEscuro);
  float sombra = clamp(max(-lado, 0.) * mix(.3, .5, uEscuro) + max(-foco, 0.) * .03, 0., .12);
  saida = vec4(luz, sombra);
}`;

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

export function criarAgua(op) {
  const o = {
    modo: 'shader', video: null, gesso: '../img/textura/gesso.webp',
    dpr: Math.min(devicePixelRatio, 1), simEsc: .25, interacao: true, gotas: true,
    borda: op && op.modo === 'camada' ? 1 : .35,   // amortecimento nas bordas: forte no celular
    escuro: () => false, rolagem: () => scrollY / innerHeight,
    cores: { areia: '#fff9ed', veu: '#cceefb', mar: ['#070b16', '#121b30'], causticaClaro: '#f7fcff', causticaEscuro: '#80b8ff' },
    ...op,
  };
  const canvas = o.canvas;
  const camada = o.modo === 'camada';
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: camada, premultipliedAlpha: true, preserveDrawingBuffer: !!o.preservar });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;
  gl.getExtension('OES_texture_float_linear');

  function programa(fs) {
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nome = gl.getActiveUniform(p, i).name; u[nome] = gl.getUniformLocation(p, nome); }
    return { p, u };
  }
  const sim = programa(FS_SIM);
  const fundo = programa({ video: FS_VIDEO, camada: FS_CAMADA }[o.modo] || FS_SHADER);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function textura(filtro, wrap) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  }
  // simulação: duas texturas RGBA16F + framebuffers
  const alvos = [0, 1].map(() => ({ t: textura(gl.LINEAR, gl.CLAMP_TO_EDGE), f: gl.createFramebuffer() }));
  let sw = 4, sh = 4;
  function tamanhoSim(w, h) {
    sw = Math.max(64, Math.round(w * o.simEsc)); sh = Math.max(64, Math.round(h * o.simEsc));
    for (const a of alvos) {
      gl.bindTexture(gl.TEXTURE_2D, a.t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, sw, sh, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, a.f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, a.t, 0);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // gesso (modo shader) ou vídeo (modo vídeo)
  const texGesso = textura(gl.LINEAR, gl.REPEAT);
  let gessoPronto = false;
  if (o.modo === 'shader') {
    const img = new Image();
    img.onload = () => { gl.bindTexture(gl.TEXTURE_2D, texGesso); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gessoPronto = true; };
    img.src = o.gesso;
  }
  // fontes de vídeo: a atual e, durante a troca de tema, a nova. Cada uma tem a sua textura e
  // só sobe um quadro para a GPU quando o vídeo tem um quadro novo (30 por segundo)
  function fonteDe(v) {
    const f = { v, tex: textura(gl.LINEAR, gl.CLAMP_TO_EDGE), novo: true, viva: true, timer: 0 };
    if ('requestVideoFrameCallback' in v) {
      const marcar = () => { if (!f.viva) return; f.novo = true; v.requestVideoFrameCallback(marcar); };
      v.requestVideoFrameCallback(marcar);
    } else f.timer = setInterval(() => { f.novo = true; }, 33);
    return f;
  }
  const soltar = (f) => { f.viva = false; clearInterval(f.timer); gl.deleteTexture(f.tex); };
  let fonte = o.video ? fonteDe(o.video) : null, fonte2 = null, troca = null;
  function subir(f, unidade) {
    gl.activeTexture(unidade); gl.bindTexture(gl.TEXTURE_2D, f.tex);
    if (f.v.readyState >= 2 && f.novo) {
      f.novo = false;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, f.v);
    }
  }
  // tom da água: 0 claro, 1 escuro. Desliza até o tema atual em vez de pular
  let esc = o.escuro() ? 1 : 0;

  // cores fixas
  gl.useProgram(fundo.p);
  const C = o.cores;
  const set3 = (nome, h) => fundo.u[nome] && gl.uniform3fv(fundo.u[nome], hex(h));
  set3('uAreia', C.areia); set3('uVeu', C.veu); set3('uMar1', C.mar[0]); set3('uMar2', C.mar[1]);
  set3('uCaus1', C.causticaClaro); set3('uCaus2', C.causticaEscuro);
  if (fundo.u.uGesso) gl.uniform1i(fundo.u.uGesso, 1);
  if (fundo.u.uVideo) gl.uniform1i(fundo.u.uVideo, 1);
  if (fundo.u.uVideo2) gl.uniform1i(fundo.u.uVideo2, 2);
  gl.uniform1i(fundo.u.uAltura, 0);

  let W = 1, H = 1;
  function redimensionar() {
    W = Math.max(1, o.largura || innerWidth); H = Math.max(1, o.altura || innerHeight);
    canvas.width = Math.round(W * o.dpr); canvas.height = Math.round(H * o.dpr);
    tamanhoSim(W, H);
  }
  if (!o.largura) addEventListener('resize', redimensionar);
  redimensionar();

  // mouse e toque: a posição anterior e a atual formam o segmento que empurra a água
  const m = { x: -1, y: -1, ax: -1, ay: -1, ativo: false };
  let gotaExtra = null, proximaGota = 1.5;
  if (o.interacao) {
    const mover = (cx, cy) => {
      const x = cx / W, y = 1 - cy / H;
      if (!m.ativo) { m.ax = x; m.ay = y; m.ativo = true; }
      m.x = x; m.y = y;
    };
    addEventListener('pointermove', (e) => mover(e.clientX, e.clientY), { passive: true });
    addEventListener('pointerdown', (e) => { gotaExtra = [e.clientX / W, 1 - e.clientY / H, .55]; }, { passive: true });
    document.addEventListener('pointerleave', () => { m.ativo = false; });
  }

  let a = 0;   // índice do alvo com o estado atual
  function passo() {
    gl.useProgram(sim.p);
    const u = sim.u;
    gl.uniform2f(u.uTexel, 1 / sw, 1 / sh); gl.uniform1f(u.uAspecto, W / H);
    gl.uniform1f(u.uBorda, o.borda);
    const vel = Math.hypot(m.x - m.ax, (m.y - m.ay) / (W / H));
    gl.uniform2f(u.uA, m.ax, m.ay); gl.uniform2f(u.uB, m.x, m.y);
    gl.uniform1f(u.uForca, m.ativo ? Math.min(.24, vel * 3.2) : 0);
    m.ax = m.x; m.ay = m.y;
    proximaGota -= 1 / 60;
    let gota = [-1, -1, 0];
    if (gotaExtra) { gota = gotaExtra; gotaExtra = null; }
    else if (o.gotas && proximaGota <= 0) { gota = [Math.random(), Math.random(), .18 + Math.random() * .2]; proximaGota = camada ? 4 + Math.random() * 5 : .9 + Math.random() * 1.8; }
    gl.uniform3fv(u.uGota, gota);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, alvos[a].t);
    gl.uniform1i(u.uAnt, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, alvos[1 - a].f);
    gl.viewport(0, 0, sw, sh);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    a = 1 - a;
  }

  let dtTom = 1;
  function desenhar(tempo, soAmbiente = 0) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(fundo.p);
    const u = fundo.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, alvos[a].t);
    gl.activeTexture(gl.TEXTURE1);
    let mistura = 0;
    if (troca) {
      const k = Math.min(1, (performance.now() - troca.inicio) / troca.ms);
      mistura = k * k * (3 - 2 * k);
      if (k >= 1) {   // fim da troca: o vídeo novo vira o único
        soltar(fonte); fonte = fonte2; fonte2 = null; mistura = 0;
        const fim = troca.fim; troca = null; fim && fim();
      }
    }
    if (o.modo === 'video' && fonte) {
      subir(fonte, gl.TEXTURE1);
      if (fonte2) subir(fonte2, gl.TEXTURE2);
      gl.uniform1f(u.uMistura, fonte2 ? mistura : 0);
      const v = fonte.v;
      if (v.readyState >= 2) {
        // cover: a menor escala que preenche a tela
        const av = v.videoWidth / v.videoHeight, at = W / H;
        gl.uniform2f(u.uCobre, at > av ? 1 : at / av, at > av ? av / at : 1);
      }
    } else gl.bindTexture(gl.TEXTURE_2D, texGesso);
    gl.uniform2f(u.uTexel, 1 / sw, 1 / sh);
    gl.uniform1f(u.uAspecto, W / H);
    gl.uniform1f(u.uTempo, tempo);
    gl.uniform1f(u.uRolagem, o.rolagem());
    // o tom acompanha a mistura dos vídeos na troca; fora dela, desliza sozinho até o tema atual
    const alvo = o.escuro() ? 1 : 0;
    if (troca) esc = troca.de + (alvo - troca.de) * mistura;
    else esc += (alvo - esc) * Math.min(1, dtTom / .22);
    gl.uniform1f(u.uEscuro, esc);
    gl.uniform1f(u.uLeve, 0);
    if (u.uSoAmbiente) gl.uniform1f(u.uSoAmbiente, soAmbiente);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // no modo camada a água dorme: ~3,5 s depois do último movimento ou gota a onda já sumiu, então
  // limpa o canvas e para de desenhar até o próximo movimento (o vídeo embaixo segue sozinho)
  let rodando = false, antes = 0, tempo = 0, acum = 0, id = 0, acordada = 0, dormindo = false;
  const acordar = () => {
    acordada = performance.now();
    if (dormindo && rodando) { dormindo = false; antes = performance.now(); id = requestAnimationFrame(quadro); }
  };
  if (camada && o.interacao) {
    addEventListener('pointermove', acordar, { passive: true });
    addEventListener('pointerdown', acordar, { passive: true });
  }
  function quadro(agora) {
    if (!rodando || dormindo) return;
    const dt = Math.min(.05, (agora - antes) / 1000); antes = agora;
    tempo += dt; acum += dt;
    if (camada && o.gotas && proximaGota <= 1 / 60) acordada = agora;   // gota vindo: fica acordada
    let n = 0;
    while (acum >= 1 / 60 && n < 3) { acum -= 1 / 60; passo(); n++; }
    dtTom = dt;
    desenhar(tempo);
    // durante a troca de tema a camada fica acordada (o tom da onda está deslizando)
    if (camada && Math.abs((o.escuro() ? 1 : 0) - esc) > .01) acordada = agora;
    if (camada && agora - acordada > 3500) {
      dormindo = true;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      for (const x of alvos) { gl.bindFramebuffer(gl.FRAMEBUFFER, x.f); gl.clear(gl.COLOR_BUFFER_BIT); }
      // a próxima gota acorda sozinha
      if (o.gotas) setTimeout(acordar, Math.max(0, proximaGota * 1000 - 50));
      return;
    }
    id = requestAnimationFrame(quadro);
  }
  return {
    gl,
    get pronto() { return o.modo !== 'shader' || gessoPronto; },
    iniciar() { if (rodando) return; rodando = true; dormindo = false; acordada = performance.now(); antes = performance.now(); id = requestAnimationFrame(quadro); },
    get dormindo() { return dormindo; },
    parar() { rodando = false; cancelAnimationFrame(id); },
    // para gravar o vídeo do fundo: um quadro no instante t, sem a onda do mouse
    quadroFixo(t) { dtTom = 1; desenhar(t, 1); },
    // troca de tema no modo vídeo: o vídeo novo (já tocando no mesmo ponto do loop) entra por
    // cima do atual em `ms`; no fim, o antigo é solto e `fim` é chamado
    trocarVideo(v, ms = 900, fim) {
      if (troca) { soltar(fonte2); }
      fonte2 = fonteDe(v);
      troca = { inicio: performance.now(), ms, fim, de: esc };
    },
  };
}
