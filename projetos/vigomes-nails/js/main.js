// Monta a landing page a partir do JSON em #estado e liga as interações.
// Mudar conteúdo = mudar o JSON. Campos vazios (WhatsApp, endereço, preços, fotos que faltam)
// aparecem marcados como provisórios, para a Vitória ver o que ainda precisa mandar.
(() => {
  const E = JSON.parse(document.getElementById('estado').textContent);
  const Q = new URLSearchParams(location.search);
  const ESTATICO = Q.has('estatico');
  const CALMO = ESTATICO || matchMedia('(prefers-reduced-motion: reduce)').matches;
    // dentro do claude.ai a página roda num iframe que não deixa embutir o Google Maps
  const EMBUTIDO = window.self !== window.top;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rico = s => esc(s).replace(/&lt;(\/?)(em|br)&gt;/g, '<$1$2>');
  // o sublinhado tracejado de "a confirmar" só aparece enquanto a página estiver marcada como provisória
  const prov = t => E.provisorio ? `<span class="prov">${esc(t)}</span>` : esc(t);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- ícones ----------
  const UNHA = 'M0 30C10 22 13 -6 11 -18Q8 -30 0 -30Q-8 -30 -11 -18C-13 -6 -10 22 0 30Z';
  const icone = (fg = '#3B2A26', ac = '#D99A94') => `<svg viewBox="0 0 100 100" aria-hidden="true">${[[-21, fg], [21, ac]].map(([r, c]) => `<g transform="translate(50 86) rotate(${r}) translate(0 -36)"><path d="${UNHA}" fill="${c}"/><path d="M-5 -20Q-6 -8 -4 2" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" fill="none"/></g>`).join('')}</svg>`;
  const I = {
    zap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.6-.3z"/></svg>',
    seta: '<svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    volta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fecha: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    insta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>',
    pino: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    relogio: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    fala: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H9l-4 4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    rota: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 20l-8-4-8 4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    ext: '<svg class="ext" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copia: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    certo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrasta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" fill="none" stroke="#3B2A26" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // ---------- WhatsApp com mensagem pronta (a ideia do Studio 21); sem número, leva para "Onde fica" ----------
  const numero = String(E.contato.whatsapp || '').replace(/\D/g, '');
  // número para mostrar: (13) 99145-7205
  const telefone = numero.length === 13 ? `(${numero.slice(2, 4)}) ${numero.slice(4, 9)}-${numero.slice(9)}` : E.contato.whatsapp;
  const zap = (servico, msg) => numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(msg || (servico ? `Oi Vitória! Vim pelo site e quero agendar ${servico.toLowerCase()}.` : 'Oi Vitória! Vim pelo site e quero agendar um horário.'))}`
    : '#onde';
  const MSG_FOTO = 'Oi Vitória! Vim pelo site. Vou te mandar uma foto da minha unha para você me indicar o melhor serviço.';
  const alvo = numero ? ' target="_blank" rel="noopener"' : '';
  const btnZap = (txt, servico = '', cls = '') => `<a class="btn ${cls}" href="${zap(servico)}"${alvo}>${I.zap}<span>${esc(txt)}</span></a>`;
  const ig = `https://www.instagram.com/${esc(E.marca.instagram)}/`;

  // ---------- horário: aberto agora ou quando abre ----------
  const DIAS = E.horarios;
  const h = n => `${n}h`;
  function situacao(agora = new Date()) {
    const d = agora.getDay(), hr = agora.getHours() + agora.getMinutes() / 60;
    const [, abre, fecha] = DIAS[d];
    if (abre != null && hr >= abre && hr < fecha) return { aberto: true, txt: `<b>Aberto agora</b>, fecha às ${h(fecha)}` };
    if (abre != null && hr < abre) return { aberto: false, txt: `<b>Fechado</b>, abre hoje às ${h(abre)}` };
    for (let k = 1; k <= 7; k++) {
      const [nome, a] = DIAS[(d + k) % 7];
      if (a != null) return { aberto: false, txt: `<b>Fechado</b>, abre ${k === 1 ? 'amanhã' : nome.toLowerCase()} às ${h(a)}` };
    }
    return { aberto: false, txt: '<b>Fechado</b>' };
  }
  const pilula = () => { const s = situacao(); return `<span class="estado ${s.aberto ? 'aberto' : ''}" data-estado><i></i><span>${s.txt}</span></span>`; };
  // no topo e no menu, "fechado" logo abaixo do botão de agendar desanima; fora do horário mostra quando atende
  const txtHero = () => { const s = situacao(); return { aberto: s.aberto, txt: s.aberto ? s.txt : `Atendo de ${resumoDias[0].toLowerCase()}${resumoDias.slice(1)}` }; };
  const pilulaHero = () => { const s = txtHero(); return `<span class="estado ${s.aberto ? 'aberto' : 'neutro'}" data-estado-hero><i></i><span>${s.txt}</span></span>`; };
  const resumoDias = (() => {
    const abertos = DIAS.map((d, i) => [i, d]).filter(([, d]) => d[1] != null);
    const [p, u] = [abertos[0][1], abertos[abertos.length - 1][1]];
    return `${p[0]} a ${u[0].toLowerCase()}, ${h(p[1])} às ${h(p[2])}`;
  })();

  // ---------- mapa ----------
  const local = [E.contato.endereco, E.contato.bairro, E.contato.cidade].filter(Boolean).join(', ');
  const qMapa = encodeURIComponent(E.contato.endereco ? local : E.contato.mapa);
  const urlMaps = `https://www.google.com/maps/search/?api=1&query=${qMapa}`;
  const urlRota = `https://www.google.com/maps/dir/?api=1&destination=${qMapa}`;
  // ilustração de Itanhaém (rio, praia e mar) para quando o mapa de verdade não pode carregar
  const ILUSTRA = `<svg class="ilustra" viewBox="0 0 600 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="600" height="520" fill="#EFE3DA"/>
    <g stroke="#FFFFFF" stroke-width="7" fill="none" opacity=".95">${[60, 140, 220, 300, 380].map(y => `<path d="M-20 ${y} L640 ${y - 70}"/>`).join('')}${[70, 170, 270, 370, 470, 570].map(x => `<path d="M${x} -20 L${x + 60} 540"/>`).join('')}</g>
    <path d="M-20 250 C 90 230, 140 300, 230 285 S 360 200, 420 230" stroke="#C9D8D3" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M330 520 C 420 430, 500 400, 640 380 L640 520 Z" fill="#F3E3CC"/>
    <path d="M380 540 C 450 470, 530 440, 640 425 L640 540 Z" fill="#C9D8D3"/>
    <ellipse cx="150" cy="120" rx="58" ry="34" fill="#DCE3CF"/>
    <text x="500" y="492" font-family="Cormorant Garamond, serif" font-style="italic" font-size="17" fill="#6E8A84">Oceano Atlântico</text>
    <text x="40" y="232" font-family="Cormorant Garamond, serif" font-style="italic" font-size="15" fill="#6E8A84">Rio Itanhaém</text>
  </svg>`;

  // ---------- montagem ----------
  const lockup = (cor) => `<a class="lk" href="#topo" aria-label="${esc(E.marca.nome)} ${esc(E.marca.sufixo)}, início">${icone(cor)}<span><b>${esc(E.marca.nome)}</b><small>${esc(E.marca.sufixo)}</small></span></a>`;
  const foto = (src, alt, lazy = true) => src ? `<img src="${esc(src)}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''}>` : '';
  const H = E.hero, S = E.servicos, T = E.trabalhos, D = E.dura, P = E.porque, B = E.sobre, F = E.final;
  const titulo = Array.isArray(H.titulo) ? H.titulo : [H.titulo];
  const temPreco = S.itens.some(s => s.preco);
  // blocos que dependem de material da Vitória só aparecem quando ele existir
  const temDura = !!(D.antes && D.depois), temDepo = E.depoimentos.length > 0;
  const NAV = [['#servicos', 'Serviços'], ['#trabalhos', 'Trabalhos'], ['#sobre', 'Sobre'], ['#duvidas', 'Dúvidas'], ['#onde', 'Onde fica']];
  const ajudaFoto = cls => `<div class="ajuda ${cls}"><b>Não sabe qual escolher?</b><p>Me manda uma foto da sua unha e eu indico o melhor serviço para ela.</p><a class="btn linha" href="${zap('', MSG_FOTO)}"${alvo}>${I.zap}<span>Mandar foto</span></a></div>`;
  const ajudaDuvida = cls => `<div class="ajuda ${cls}"><b>Não achou a sua?</b><p>Pergunta no WhatsApp. Eu respondo entre um atendimento e outro.</p>${btnZap('Perguntar no WhatsApp', '', 'linha')}</div>`;
  const unhaCor = c => `<svg viewBox="-14 -32 28 64" aria-hidden="true"><path d="M0 30C10 22 13 -6 11 -18Q8 -30 0 -30Q-8 -30 -11 -18C-13 -6 -10 22 0 30Z" fill="${esc(c)}"/><path d="M-5 -20Q-6 -8 -4 2" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`;
  const cartela = `<ul aria-label="Cores que eu faço">${E.cartela.map(([n, c]) => `<li>${unhaCor(c)}<span>${esc(n)}</span></li>`).join('')}</ul>`;

  document.getElementById('app').innerHTML = `
  <div class="progresso" aria-hidden="true"></div>
  ${E.provisorio ? `<div class="aviso"><b>Versão provisória.</b> Textos <span class="prov">sublinhados assim</span> ainda serão confirmados com a Vitória.</div>` : ''}
  <header class="topo" id="topo"><div class="wrap">
    ${lockup()}
    <nav aria-label="Seções">${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</nav>
    <div class="direita">
      <a class="redondo ig" href="${ig}" target="_blank" rel="noopener" aria-label="Instagram @${esc(E.marca.instagram)}">${I.insta}</a>
      ${btnZap('Agendar')}
      <button class="redondo burger" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu">${I.menu}</button>
    </div>
  </div></header>

  <div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="cima">${lockup('#F7F1EC')}<button class="redondo" type="button" data-fecha-menu aria-label="Fechar menu">${I.fecha}</button></div>
    <nav>${NAV.map(([h, t]) => `<a href="${h}" data-fecha-menu>${t}</a>`).join('')}</nav>
    <div class="baixo">${pilulaHero()}${btnZap('Agendar pelo WhatsApp', '', 'claro grande')}</div>
  </div>

  <main>
  <section class="hero">
    <div class="hero-foto"><img src="${esc(H.fundo)}" alt="${esc(H.fundo_alt)}" style="object-position:${esc(H.fundo_pos || 'center')}" fetchpriority="high"></div>
    <div class="wrap"><div class="hero-txt">
      <h1>${titulo.map(l => `<span class="l"><span>${rico(l)}</span></span>`).join(' ')}</h1>
      <p class="txt">${esc(H.texto)}</p>
      <div class="acoes">${btnZap('Agendar pelo WhatsApp', '', 'grande')}<a class="btn linha grande" href="#trabalhos">Ver trabalhos</a></div>
      <div class="acoes" style="margin-top:22px">${pilulaHero()}</div>
      <ul class="fatos">${H.fatos.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    </div>
  </div></section>

  <div class="cartela">${cartela}</div>

  <section class="faixa branca" id="servicos"><div class="wrap servicos">
    <div class="cab"><h2>${rico(S.titulo)}</h2><p>${esc(S.texto)}</p>
      ${ajudaFoto('so-pc')}</div>
    <ul class="tabela ${temPreco ? '' : 'sem-preco'}">${S.itens.map(s => `<li>
      <div class="nome">${s.destaque ? '<span class="tag">mais pedido</span>' : ''}<h3>${esc(s.nome)}</h3><p>${esc(s.desc)}</p></div>
      ${temPreco ? `<span class="preco">${s.preco ? `<small>a partir de</small>${esc(s.preco)}` : prov('sob consulta')}</span>` : ''}
      <a class="redondo zap" href="${zap(s.nome)}"${alvo} aria-label="Agendar ${esc(s.nome)} pelo WhatsApp">${I.zap}</a>
    </li>`).join('')}</ul>
    ${ajudaFoto('so-cel')}
  </div></section>

${temDura ? `
  <section class="faixa"><div class="wrap dura">
    <div class="comp" id="comp">
      <div class="lado">${foto(D.antes, 'Unha no dia do atendimento')}</div>
      <div class="lado depois">${foto(D.depois, 'A mesma unha 15 dias depois')}</div>
      <span class="rot a">No dia</span><span class="rot d">15 dias depois</span>
      <span class="linha"><span class="alca">${I.arrasta}</span></span>
      <input type="range" min="0" max="100" value="50" aria-label="Comparar no dia e 15 dias depois">
    </div>
    <div class="cab" style="margin:0"><h2>${rico(D.titulo)}</h2><p>${esc(D.texto)}</p>
      <div class="acoes" style="margin-top:12px">${btnZap('Quero uma unha que dura', 'Esmaltação em gel')}</div></div>
  </div></section>

` : ''}
  <section class="faixa" id="trabalhos"><div class="wrap">
    <div class="galeria-cab"><div class="cab"><h2>${rico(T.titulo)}</h2><p>${esc(T.texto)}</p></div>
      <a class="sub" href="${ig}" target="_blank" rel="noopener">Mais no Instagram @${esc(E.marca.instagram)}</a></div>
  </div>
    <div class="gal" id="gal" aria-label="Galeria de trabalhos">${T.fotos.map(([src, leg], i) => `<div class="slide"><button type="button" data-abre="${i}" aria-label="Ver maior: ${esc(leg)}"><div class="quadro">${foto(src, leg, i > 3)}</div><span>${esc(leg)}</span></button></div>`).join('')}</div>
    <div class="wrap"><div class="gal-ctl"><span class="cont" id="gal-n" aria-hidden="true">01 / ${T.fotos.length}</span><div class="barra" aria-hidden="true"><i id="gal-p"></i></div>
      <button class="redondo" type="button" id="gal-ant" aria-label="Fotos anteriores">${I.volta}</button><button class="redondo" type="button" id="gal-prox" aria-label="Próximas fotos">${I.seta}</button></div></div>
  </section>
  <dialog class="caixa" id="caixa" aria-label="Foto ampliada">
    <div class="cima"><span id="caixa-n"></span><button class="redondo" type="button" data-fecha-caixa aria-label="Fechar">${I.fecha}</button></div>
    <figure><img id="caixa-img" alt=""></figure>
    <div class="baixo"><p id="caixa-leg"></p><div class="setas"><button class="redondo" type="button" data-passo="-1" aria-label="Foto anterior">${I.volta}</button><button class="redondo" type="button" data-passo="1" aria-label="Próxima foto">${I.seta}</button></div></div>
  </dialog>

  <section class="faixa branca"><div class="wrap">
    <div class="depo-cab"><div class="cab"><h2>${rico(P.titulo)}</h2></div>
      ${temDepo ? `<div class="setas"><button class="redondo" type="button" data-depo="-1" aria-label="Depoimento anterior">${I.volta}</button><button class="redondo" type="button" data-depo="1" aria-label="Próximo depoimento">${I.seta}</button></div>` : ''}</div>
    <div class="porque">${P.itens.map(([t, d]) => `<div><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
    ${temDepo ? `<div class="depo" id="depo" tabindex="0" aria-label="Depoimentos">${E.depoimentos.map(([q, n, s]) => `<blockquote><q>${esc(q)}</q><footer><i>${esc(n[0])}</i><span><b>${esc(n)}</b>${esc(s)}</span></footer></blockquote>`).join('')}</div>` : ''}
  </div></section>

  <section class="faixa" id="sobre"><div class="wrap sobre">
    <div class="arco">${foto(B.foto || B.reserva, B.foto ? 'Vitória no estúdio' : 'Unhas feitas no estúdio')}</div>
    <div><h2>${rico(B.titulo)}</h2><div class="txt">${B.texto.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="acoes"><a class="sub" href="${ig}" target="_blank" rel="noopener">Acompanhar no Instagram</a></div></div>
  </div></section>

  <section class="faixa branca" id="duvidas"><div class="wrap duvidas">
    <div class="cab"><h2>Ficou com <em>dúvida?</em></h2>${ajudaDuvida('so-pc')}</div>
    <div class="faq">${E.faq.map(f => `<details><summary>${esc(f.p)}<span class="mais" aria-hidden="true"></span></summary><div class="resp"><div>${f.lista ? `<ol>${f.lista.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : `<p>${f.prov ? prov(f.r) : esc(f.r)}</p>`}</div></div></details>`).join('')}</div>
    ${ajudaDuvida('so-cel')}
  </div></section>

  <section class="faixa" id="onde"><div class="wrap">
    <div class="cab-centro"><span class="olho">Localização</span><h2>Venha me <em>visitar.</em></h2><p>Fico na Cidade Anchieta, em Itanhaém. Atendo com hora marcada: me chama no WhatsApp e eu te ajudo a chegar.</p></div>
    <div class="onde">
      <div class="mapa">${ILUSTRA}${EMBUTIDO ? '' : `<iframe title="Mapa: ${esc(local || E.contato.mapa)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${qMapa}&output=embed"></iframe>`}
        ${EMBUTIDO ? `<div class="pino"><span class="gota">${icone('#F7F1EC', '#D99A94')}</span></div>` : ''}
        <div class="rotulo"><span>${EMBUTIDO ? 'Mapa ilustrativo. ' : ''}${E.contato.endereco ? esc(local) : 'Endereço a confirmar'}</span></div>
      </div>
      <div class="cartao-onde">
        <ul class="linhas">
          <li><span class="ic">${I.pino}</span><div><h3>Endereço</h3>
            <div class="val com-copia"><span>${E.contato.endereco ? esc(E.contato.endereco) : prov('Rua e número a confirmar')}<br>${esc([E.contato.bairro, E.contato.cidade].filter(Boolean).join(' · '))}</span><button class="copia" type="button" data-copia aria-label="Copiar endereço" title="Copiar endereço">${I.copia}</button><span class="copiado" role="status" hidden>Copiado</span></div></div></li>
          <li><span class="ic">${I.relogio}</span><div><h3>Horário</h3>
            <div class="val">${esc(resumoDias)}</div>${pilula()}</div></li>
          <li><span class="ic">${I.fala}</span><div><h3>Contato</h3>
            <div class="val">${numero ? `<a class="sub" href="${zap('')}"${alvo}>${esc(telefone)}</a>` : prov('WhatsApp a confirmar')}<br><a class="sub" href="${ig}" target="_blank" rel="noopener">@${esc(E.marca.instagram)}</a></div></div></li>
        </ul>
        <div class="rotas">
          <a class="btn larga linha" href="${urlMaps}" target="_blank" rel="noopener"><span>Abrir no Google Maps</span>${I.ext}</a>
          <a class="btn larga" href="${zap('')}"${alvo}><span>Falar no WhatsApp</span>${I.ext}</a>
        </div>
      </div>
    </div>
  </div></section>
  </main>

  <section class="faixa final"><div class="wrap">
    <h2>${rico(F.titulo)}</h2>
    <div class="linha2"><p>${esc(F.texto)}</p>${btnZap('Agendar pelo WhatsApp', '', 'claro grande')}</div>
  </div></section>
  <footer class="rodape"><div class="wrap">
    <div class="marca">${lockup('#F7F1EC')}<p>Unhas feitas com calma, uma cliente por vez, em Itanhaém. Esmaltação em gel, manicure e alongamento com hora marcada.</p></div>
    <div><h4>Navegue</h4><ul>${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
    <div><h4>Horário</h4><ul><li>${esc(resumoDias)}</li><li>Domingo e segunda, fechado</li></ul></div>
    <div><h4>Contato</h4><ul><li><a href="${zap('')}"${alvo}>WhatsApp</a></li><li><a href="${ig}" target="_blank" rel="noopener">Instagram</a></li><li><a href="${urlMaps}" target="_blank" rel="noopener">Google Maps</a></li></ul></div>
    <div class="fim"><span>${esc(E.marca.nome)} ${esc(E.marca.sufixo)}, ${esc(E.contato.cidade)}</span><span>Site por Lucas Giovanni</span></div>
  </div></footer>
  <a class="flutua" href="${zap('')}"${alvo} aria-label="Agendar pelo WhatsApp">${I.zap}<span>Agendar pelo WhatsApp</span></a>`;

  // padrão de fundo feito do símbolo: o V reto, como no logo, em grade intercalada, quase no tom do fundo
  const ladrilho = (fg, ac) => {
    const v = (x, y) => [[-21, fg], [21, ac]].map(([g, c]) => `<g transform="translate(${x} ${y}) scale(.5) translate(0 36) rotate(${g}) translate(0 -36)"><path d="${UNHA}" fill="${c}"/></g>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">${v(50, 50)}${v(150, 150)}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  };
  const raiz = document.documentElement.style;
  raiz.setProperty('--padrao-claro', ladrilho('rgba(168,100,79,.075)', 'rgba(217,154,148,.15)'));
  raiz.setProperty('--padrao-escuro', ladrilho('rgba(247,241,236,.05)', 'rgba(217,154,148,.10)'));
  // alterna entre as seções: começa no topo, pula uma, aplica na seguinte, até o fim
  $$('.hero, main > section, .final').forEach((sec, i) => { if (i % 2 === 0) sec.classList.add('padrao', ...(sec.classList.contains('final') ? ['escuro'] : [])); });

  if (!ESTATICO) document.documentElement.classList.add('anima');

  // ---------- rolagem suave (Lenis) ----------
  let lenis = null;
  if (!CALMO && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const vaiPara = (alvoEl) => {
    if (!alvoEl) return;
    const off = -(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topo-h')) || 70) + 1;
    if (lenis) lenis.scrollTo(alvoEl, { offset: off, duration: 1.3 });
    else alvoEl.scrollIntoView({ behavior: CALMO ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', ev => {
    const a = ev.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const el = id === '#topo' ? document.body : $(id);
    if (!el) return;
    ev.preventDefault();
    fechaMenu();
    if (id === '#topo') { lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: CALMO ? 'auto' : 'smooth' }); } else vaiPara(el);
  });

  // ---------- topo, barra de leitura, item ativo ----------
  const topo = $('.topo'), barra = $('.progresso'), flutua = $('.flutua'), finalEl = $('.final'), tabelaEl = $('.tabela');
  let ultimo = 0;
  function aoRolar() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    barra.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    topo.classList.toggle('rolou', y > 8);
    topo.classList.toggle('escondido', y > 400 && y > ultimo && !$('#menu').classList.contains('aberto'));
    ultimo = y;
    // o botão flutuante sai de cena quando a faixa final (que já tem o botão de agendar) aparece
    const rt = tabelaEl.getBoundingClientRect();
    flutua.classList.toggle('some', finalEl.getBoundingClientRect().top < innerHeight * .8 || (rt.top < innerHeight - 80 && rt.bottom > 120));
  }
  addEventListener('scroll', aoRolar, { passive: true });
  const links = $$('.topo nav a');
  const vigia = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('ativo', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  NAV.forEach(([h]) => { const s = $(h); s && vigia.observe(s); });

  // ---------- menu do celular ----------
  const menu = $('#menu'), burger = $('.burger');
  function fechaMenu() { if (!menu.classList.contains('aberto')) return; menu.classList.remove('aberto'); burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('travado'); lenis && lenis.start(); burger.focus({ preventScroll: true }); }
  burger.addEventListener('click', () => { menu.classList.add('aberto'); burger.setAttribute('aria-expanded', 'true'); document.body.classList.add('travado'); lenis && lenis.stop(); $('[data-fecha-menu]', menu).focus(); });
  menu.addEventListener('click', ev => { if (ev.target.closest('button[data-fecha-menu]')) fechaMenu(); });
  addEventListener('keydown', ev => { if (ev.key === 'Escape') fechaMenu(); });

  // ---------- galeria: faixa com a física do Smooothy (inércia, snap, loop) e foto ampliada ----------
  const galEl = $('#gal');
  if (galEl && window.Smooothy) {
    const lerpA = (a, b, t) => a + (b - a) * t, damp = (a, b, k, dt) => lerpA(a, b, 1 - Math.exp(-k * dt));
    const cards = [...galEl.querySelectorAll('.slide > button')], fotosG = [...galEl.querySelectorAll('img')];
    const nG = cards.length, contG = $('#gal-n'), barraG = $('#gal-p');
    galEl.classList.add('sm'); galEl.scrollLeft = 0;
    let vel = 0;
    const g = new Smooothy(galEl, { infinite: true, snap: true, snapStrength: .08, lerpFactor: CALMO ? .12 : .24, speedDecay: .88 });
    g.onResize = s => { s.config.dragSensitivity = 1 / s.viewport.itemWidth; };
    g.onUpdate = ({ parallaxValues, speed, deltaTime, progress, currentSlide }) => {
      vel = damp(vel, speed, 6, deltaTime);
      const inc = CALMO ? 0 : Math.max(-5, Math.min(5, vel * -1.6));
      for (let i = 0; i < nG; i++) {
        const p = parallaxValues[i], a = Math.min(Math.abs(p), 2);
        cards[i].style.transform = CALMO ? '' : `scale(${1 - a * .045}) skewX(${inc}deg)`;
        fotosG[i].style.transform = CALMO ? '' : `translateX(${Math.max(-1.6, Math.min(1.6, p)) * -6}%)`;
      }
      barraG.style.setProperty('--p', Math.max(.04, progress));
      contG.textContent = String(currentSlide + 1).padStart(2, '0') + ' / ' + nG;
    };
    g.resize();
    const tique = () => { g.update(); requestAnimationFrame(tique); };
    requestAnimationFrame(tique);
    $('#gal-ant').addEventListener('click', () => g.goToPrev());
    $('#gal-prox').addEventListener('click', () => g.goToNext());
    // depois de arrastar, o clique não abre a foto
    let x0 = null, moveu = false;
    galEl.addEventListener('pointerdown', e => { x0 = e.clientX; moveu = false; });
    addEventListener('pointermove', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 6) { moveu = true; galEl.classList.add('arrasta'); } });
    addEventListener('pointerup', () => { x0 = null; galEl.classList.remove('arrasta'); });
    galEl.addEventListener('click', e => { if (moveu) { e.stopPropagation(); e.preventDefault(); moveu = false; } }, true);
    galEl.addEventListener('keydown', e => { if (e.key === 'ArrowRight') g.goToNext(); if (e.key === 'ArrowLeft') g.goToPrev(); });
  } else if ($('#gal-n')) { $('.gal-ctl').hidden = true; }
  const caixa = $('#caixa'), cImg = $('#caixa-img'), cLeg = $('#caixa-leg'), cN = $('#caixa-n');
  let iCaixa = 0;
  function abreFoto(i) {
    iCaixa = (i + T.fotos.length) % T.fotos.length;
    const [s, l] = T.fotos[iCaixa];
    cImg.src = s; cImg.alt = l; cLeg.textContent = l; cN.textContent = `${iCaixa + 1} de ${T.fotos.length}`;
    if (!caixa.open) { caixa.showModal(); lenis && lenis.stop(); }
  }
  $$('[data-abre]').forEach(b => b.addEventListener('click', () => abreFoto(+b.dataset.abre)));
  caixa.addEventListener('click', ev => {
    if (ev.target.closest('[data-fecha-caixa]') || ev.target === caixa) caixa.close();
    const p = ev.target.closest('[data-passo]'); if (p) abreFoto(iCaixa + +p.dataset.passo);
  });
  caixa.addEventListener('close', () => lenis && lenis.start());
  caixa.addEventListener('keydown', ev => { if (ev.key === 'ArrowRight') abreFoto(iCaixa + 1); if (ev.key === 'ArrowLeft') abreFoto(iCaixa - 1); });
  let x0 = null;
  caixa.addEventListener('touchstart', ev => { x0 = ev.touches[0].clientX; }, { passive: true });
  caixa.addEventListener('touchend', ev => { if (x0 == null) return; const dx = ev.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) abreFoto(iCaixa + (dx < 0 ? 1 : -1)); x0 = null; });

  // ---------- comparador: na primeira vez que aparece, a alça mostra que dá para arrastar ----------
  const comp = $('#comp'), rg = comp && $('input', comp);
  const corta = () => comp.style.setProperty('--corte', rg.value + '%');
  if (comp) { rg.addEventListener('input', corta); corta(); }
  if (comp && !CALMO) {
    let mexeu = false;
    rg.addEventListener('pointerdown', () => { mexeu = true; });
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (!e.isIntersecting) return; ob.disconnect();
      const quadros = [50, 32, 68, 50]; let k = 0, t0 = null;
      const passo = t => { if (mexeu) return; t0 ??= t; const f = Math.min((t - t0) / 700, 1), a = quadros[k], b = quadros[k + 1]; rg.value = a + (b - a) * (f < .5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2); corta(); if (f === 1) { k++; t0 = null; if (k >= quadros.length - 1) return; } requestAnimationFrame(passo); };
      setTimeout(() => requestAnimationFrame(passo), 300);
    }), { threshold: .6 }).observe(comp);
  }

  // ---------- depoimentos ----------
  const depo = $('#depo');
  if (depo) {
    const [dAnt, dProx] = $$('[data-depo]');
    const cartao = () => depo.firstElementChild.getBoundingClientRect().width + 18;
    const setasDepo = () => { dAnt.disabled = depo.scrollLeft < 4; dProx.disabled = depo.scrollLeft + depo.clientWidth > depo.scrollWidth - 4; };
    [dAnt, dProx].forEach(b => b.addEventListener('click', () => depo.scrollBy({ left: cartao() * +b.dataset.depo, behavior: CALMO ? 'auto' : 'smooth' })));
    depo.addEventListener('scroll', setasDepo, { passive: true }); setasDepo();
  }

  // ---------- dúvidas: abre e fecha com a altura animada ----------
  $$('.faq details').forEach(d => {
    const s = $('summary', d), r = $('.resp', d);
    s.addEventListener('click', ev => {
      if (CALMO) return;
      ev.preventDefault();
      if (d.open) {
        r.animate([{ height: r.offsetHeight + 'px' }, { height: '0px' }], { duration: 350, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        r.animate([{ height: '0px' }, { height: r.offsetHeight + 'px' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
  });

  // ---------- copiar endereço ----------
  const bCopia = $('[data-copia]'), ok = bCopia.nextElementSibling;
  bCopia.addEventListener('click', async () => {
    const txt = local || `${E.marca.nome} ${E.marca.sufixo}, ${E.contato.cidade}`;
    try { await navigator.clipboard.writeText(txt); ok.textContent = 'Copiado'; bCopia.innerHTML = I.certo; bCopia.classList.add('ok'); }
    // sem permissão de área de transferência: o endereço já está na tela, então só orienta
    catch (e) { ok.textContent = 'Toque e segure o endereço para copiar'; ok.style.color = 'var(--fraco)'; }
    ok.hidden = false;
    setTimeout(() => { ok.hidden = true; ok.style.color = ''; bCopia.innerHTML = I.copia; bCopia.classList.remove('ok'); }, 2600);
  });

  // a situação (aberto/fechado) se atualiza sozinha a cada minuto
  setInterval(() => {
    const s = situacao(), t = txtHero();
    $$('[data-estado]').forEach(el => { el.classList.toggle('aberto', s.aberto); el.lastElementChild.innerHTML = s.txt; });
    $$('[data-estado-hero]').forEach(el => { el.classList.toggle('aberto', t.aberto); el.classList.toggle('neutro', !t.aberto); el.lastElementChild.innerHTML = t.txt; });
  }, 60000);


  aoRolar();

  // ---------- dados estruturados ----------
  const ld = { '@context': 'https://schema.org', '@type': 'NailSalon', name: `${E.marca.nome} ${E.marca.sufixo}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Itanhaém', addressRegion: 'SP', addressCountry: 'BR', ...(E.contato.endereco ? { streetAddress: E.contato.endereco } : {}) },
    openingHoursSpecification: DIAS.map(([n, a, f], i) => a == null ? null : { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i], opens: `${String(a).padStart(2, '0')}:00`, closes: `${String(f).padStart(2, '0')}:00` }).filter(Boolean),
    sameAs: [ig], ...(numero ? { telephone: '+' + numero } : {}) };
  const sc = document.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
})();
