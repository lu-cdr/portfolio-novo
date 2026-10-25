/* Cabeça facetada em ASCII verde (seção Abordagem).
   Duas passadas: a cena 3D é desenhada numa textura pequena (um punhado de pixels por célula)
   e um shader troca cada célula por um caractere do atlas, do mais vazio ao mais cheio, conforme
   a luz. O cursor gira a cabeça, arrasta a luz pelos planos e, em volta dele, as células
   acendem e embaralham. Só carrega quando a seção chega perto da tela. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const RAMPA = " .:-=+*co0O#%@";
const VERDE = new THREE.Color("#a8b27a"), CLARO = new THREE.Color("#e0e0e0");

export function montar(caixa) {
  const parado = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toque = matchMedia("(pointer: coarse)").matches;
  const dpr = Math.min(devicePixelRatio || 1, toque ? 1.5 : 2);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  } catch (e) { caixa.classList.add("sem-webgl"); return; }
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  caixa.appendChild(renderer.domElement);

  // ---------- cena ----------
  const cena = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(28, 1, .1, 50);
  cam.position.set(0, 0, 8);
  const pivo = new THREE.Group();
  cena.add(pivo);
  cena.add(new THREE.HemisphereLight(0xffffff, 0x111111, .3));
  const luz = new THREE.DirectionalLight(0xffffff, 1.5);
  cena.add(luz);
  const contra = new THREE.DirectionalLight(0xffffff, .25);
  contra.position.set(-3, 1, -2);
  cena.add(contra);

  // ---------- atlas de glifos: uma linha, uma célula por caractere ----------
  let cel = 0, atlas = null;
  function desenharAtlas() {
    const c = document.createElement("canvas");
    c.width = cel * RAMPA.length; c.height = cel;
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `700 ${Math.round(cel * 1.02)}px ui-monospace, "Cascadia Mono", Consolas, monospace`;
    [...RAMPA].forEach((ch, i) => g.fillText(ch, (i + .5) * cel, cel * .54));
    if (atlas) atlas.dispose();
    atlas = new THREE.CanvasTexture(c);
    atlas.minFilter = atlas.magFilter = THREE.NearestFilter;
    atlas.generateMipmaps = false;
  }

  // ---------- passada ASCII ----------
  const alvoCena = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const quadro = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    transparent: true, depthTest: false,
    uniforms: {
      tCena: { value: alvoCena.texture }, tGlifos: { value: null },
      uRes: { value: new THREE.Vector2() }, uCel: { value: 10 }, uN: { value: RAMPA.length },
      uMouse: { value: new THREE.Vector2(-1e4, -1e4) }, uRaio: { value: 160 }, uPerto: { value: 0 },
      uTempo: { value: 0 }, uVerde: { value: VERDE }, uClaro: { value: CLARO },
    },
    vertexShader: "void main(){ gl_Position = vec4(position.xy, 0., 1.); }",
    fragmentShader: /* glsl */`
      uniform sampler2D tCena, tGlifos;
      uniform vec2 uRes, uMouse;
      uniform float uCel, uN, uRaio, uPerto, uTempo;
      uniform vec3 uVerde, uClaro;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 grade = uRes / uCel;
        vec2 c = floor(gl_FragCoord.xy / uCel);
        vec4 s = texture2D(tCena, (c + .5) / grade);
        float cobre = s.a;
        // a cena sai linear; a curva espalha os planos pela rampa inteira (sombra rala, luz cheia)
        float lum = .1 + .9 * smoothstep(.0, .6, dot(s.rgb / max(s.a, 1e-4), vec3(.299, .587, .114)));

        // zona do cursor: células acendem e algumas embaralham, num tique de ~12 quadros/s
        float d = distance((c + .5) * uCel, uMouse);
        float m = (1. - smoothstep(uRaio * .15, uRaio, d)) * uPerto;
        float tique = floor(uTempo * 12.);
        lum = clamp(lum + m * .3, 0., 1.);
        // na cabeça nunca fica célula vazia: a silhueta continua legível do lado da sombra
        float idx = max(1., floor(lum * (uN - 1.) + .5));
        float sorteio = hash(c + tique);
        bool troca = sorteio < m * .45;
        if (troca) idx = 1. + floor(hash(c * 1.7 + tique + 3.1) * (uN - 1.));

        // fundo vazio: só um pó de caracteres apagados em volta do cursor
        float a = cobre;
        if (cobre < .5) { a = (hash(c + 9.) < m * .5) ? m * .35 : 0.; if (a > 0.) idx = 1. + floor(hash(c + tique * .5) * 4.); }

        vec2 dentro = fract(gl_FragCoord.xy / uCel);
        float g = texture2D(tGlifos, vec2((idx + dentro.x) / uN, dentro.y)).r;
        vec3 cor = mix(uVerde, uClaro, clamp(m * .9 + (troca ? .3 : 0.), 0., 1.));
        a *= g;
        gl_FragColor = vec4(cor * a, a);
      }`,
  }));
  quadro.frustumCulled = false;
  const cenaAscii = new THREE.Scene();
  cenaAscii.add(quadro);
  const camAscii = new THREE.Camera();

  // ---------- tamanho ----------
  let L = 1, A = 1;
  function medir() {
    L = caixa.clientWidth; A = caixa.clientHeight;
    renderer.setSize(L, A, false);
    const celCss = L < 520 ? 8 : 10;
    const novo = Math.round(celCss * dpr);
    if (novo !== cel) { cel = novo; desenharAtlas(); quadro.material.uniforms.tGlifos.value = atlas; }
    const w = L * dpr, h = A * dpr;
    // 2×2 pixels de cena por célula: a amostra linear no centro já faz a média
    alvoCena.setSize(Math.ceil(w / cel) * 2, Math.ceil(h / cel) * 2);
    quadro.material.uniforms.uRes.value.set(w, h);
    quadro.material.uniforms.uCel.value = cel;
    quadro.material.uniforms.uRaio.value = Math.min(w, h) * .26;
    cam.aspect = L / A; cam.updateProjectionMatrix();
    pedir();
  }

  // ---------- modelo ----------
  const draco = new DRACOLoader().setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/");
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const base = new URL("../models/", import.meta.url).href;
  function usar(gltf) {
    const obj = gltf.scene;
    obj.traverse((o) => {
      if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0xd9dcdf, roughness: .55, metalness: 0, flatShading: true });
    });
    // centraliza e normaliza a altura para 3 unidades
    const box = new THREE.Box3().setFromObject(obj), tam = box.getSize(new THREE.Vector3()), centro = box.getCenter(new THREE.Vector3());
    obj.position.sub(centro);
    const esc = 3 / tam.y;
    const g = new THREE.Group(); g.add(obj); g.scale.setScalar(esc);
    pivo.add(g);
    caixa.classList.add("pronta");
    pedir();
  }
  loader.load(base + "cabeca-draco.glb", usar, undefined, () => loader.load(base + "cabeca.glb", usar));

  // ---------- cursor ----------
  const alvo = { x: 0, y: 0 }, pos = { x: 0, y: 0 };
  let perto = 0, pertoAlvo = 0, ultimoMov = -1e9, mxPx = -1e4, myPx = -1e4;
  function apontar(cx, cy) {
    const r = caixa.getBoundingClientRect();
    // -1..1 em relação ao centro da caixa; fora dela continua valendo (a cabeça acompanha da página toda)
    alvo.x = Math.max(-1.2, Math.min(1.2, (cx - (r.left + r.width / 2)) / (r.width / 2)));
    alvo.y = Math.max(-1.2, Math.min(1.2, (cy - (r.top + r.height / 2)) / (r.height / 2)));
    mxPx = (cx - r.left) * dpr; myPx = (r.bottom - cy) * dpr;
    const dentro = cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    pertoAlvo = dentro ? 1 : 0;
    ultimoMov = performance.now();
    pedir();
  }
  if (!parado) {
    addEventListener("pointermove", (e) => apontar(e.clientX, e.clientY), { passive: true });
    addEventListener("pointerdown", (e) => apontar(e.clientX, e.clientY), { passive: true });
    caixa.addEventListener("pointerleave", () => { pertoAlvo = 0; pedir(); });
    if (toque) addEventListener("touchend", () => { pertoAlvo = 0; pedir(); }, { passive: true });
  }

  // ---------- laço: só roda com a seção visível e enquanto algo se mexe ----------
  let visivel = false, pedido = false, t0 = performance.now();
  function pedir() { if (!pedido && visivel) { pedido = true; requestAnimationFrame(quadroDeAnimacao); } }
  function quadroDeAnimacao(agora) {
    pedido = false;
    const t = (agora - t0) / 1000;
    // parado há um tempo: a cabeça volta a respirar sozinha
    const ocioso = agora - ultimoMov > 2500;
    const ax = ocioso && !parado ? Math.sin(t * .35) * .45 : alvo.x;
    const ay = ocioso && !parado ? Math.sin(t * .23) * .18 : alvo.y;
    const k = parado ? 1 : .06;
    pos.x += (ax - pos.x) * k; pos.y += (ay - pos.y) * k;
    perto += (pertoAlvo - perto) * (parado ? 1 : .12);

    pivo.rotation.y = pos.x * .42;
    pivo.rotation.x = pos.y * .22;
    // a luz fica do lado do cursor, um pouco à frente: arrasta o claro pelos planos
    luz.position.set(pos.x * 4 + .6, -pos.y * 3 + 1.4, 3.2);

    const u = quadro.material.uniforms;
    u.uMouse.value.set(mxPx, myPx); u.uPerto.value = perto; u.uTempo.value = t;

    renderer.setRenderTarget(alvoCena); renderer.clear(); renderer.render(cena, cam);
    renderer.setRenderTarget(null); renderer.clear(); renderer.render(cenaAscii, camAscii);

    const mexendo = Math.abs(ax - pos.x) + Math.abs(ay - pos.y) > .0005 || perto > .01 || Math.abs(pertoAlvo - perto) > .01;
    if (!parado && (mexendo || ocioso)) pedir();
  }

  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; pedir(); }).observe(caixa);
  new ResizeObserver(medir).observe(caixa);
  medir();
}
