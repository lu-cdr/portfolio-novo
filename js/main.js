/* Lê o estado (JSON dentro do index.html) e desenha a página.
   Mudar texto = mudar o JSON; este arquivo só sabe montar. */
(function () {
  var E = JSON.parse(document.getElementById("estado").textContent);
  var app = document.getElementById("app");

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function botao(a, extra) {
    return '<a class="botao rotulo ' + (a.tipo || "primario") + (extra ? " " + extra : "") + '" href="' + esc(a.href) + '">' +
      esc(a.rotulo) + ' <span class="seta" aria-hidden="true">→</span></a>';
  }
  // fundo fixo do site inteiro: piso, brilho do cursor, queda de luz e sombras
  var fundo = '<div class="fundo grao" aria-hidden="true"><div class="azulejos"></div><div class="brilho"></div>' +
    '<div class="queda"></div><div class="sombras"><div class="palmeira"></div><div class="monstera"></div></div></div>';

  function cabeca(s, extra) {
    return '<div class="titulo-secao' + (extra ? " " + extra : "") + '"><p class="cab rotulo">' + esc(s.rotulo) + '</p><h2>' + esc(s.titulo) + '</h2></div>';
  }
  // cada letra numa máscara própria, agrupadas por palavra para a quebra de linha não partir palavras
  function letras(txt) {
    return txt.split(" ").map(function (p) {
      return '<span class="pal">' + [...p].map(function (c) { return '<span class="m"><span class="c">' + esc(c) + '</span></span>'; }).join("") + '</span>';
    }).join(" ");
  }
  function dois(n) { return (n < 9 ? "0" : "") + (n + 1); }

  // cada tipo de seção do JSON tem o seu montador; o layout segue o wireframe.html
  var MONTA = {
    // um projeto por vez: moldura desktop + celular com o site real (iframe) e a ficha ao lado
    trabalhos: function (s) {
      var P = s.projetos;
      return '<section class="secao trabalhos" id="' + esc(s.id) + '" aria-roledescription="carrossel">' + cabeca(s) +
        '<div class="slides">' + P.map(function (p, i) {
          return '<article class="slide' + (i ? "" : " ativo") + '" aria-label="' + (i + 1) + ' de ' + P.length + '"' + (i ? " hidden" : "") + '>' +
            '<div class="tela desktop">' + moldura(p, "desktop") + '</div>' +
            '<div class="tela celular">' + moldura(p, "celular") + '</div>' +
            '<div class="ficha"><p class="rotulo origem">' + esc(p.origem) + '</p><h3>' + esc(p.nome) + '</h3>' +
              '<ul class="escopo">' + p.escopo.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join("") + '</ul>' +
              botao({ rotulo: "Ver estudo de caso", href: p.estudo }) + '</div>' +
          '</article>';
        }).join("") + '</div>' +
        '<div class="controle"><button class="anterior rotulo" aria-label="Projeto anterior">←</button>' +
          '<p class="contador rotulo" aria-live="polite"><span class="atual">01</span> / ' + dois(P.length - 1) + '</p>' +
          '<div class="progresso" aria-hidden="true"><i></i></div>' +
          '<button class="proximo rotulo" aria-label="Próximo projeto">→</button></div>' +
        (s.dica ? '<p class="dica rotulo"><span class="ponto" aria-hidden="true"></span>' + esc(s.dica) + '</p>' : "") +
      '</section>';
    },
    // faixa infinita: a lista sai duas vezes para o loop emendar sem salto
    faixa: function (s) {
      var um = s.itens.map(function (t) { return '<span>' + esc(t) + '</span><i aria-hidden="true">✳</i>'; }).join("");
      return '<div class="faixa" aria-label="' + esc(s.itens.join(", ")) + '" role="img"><div class="trilho" aria-hidden="true">' + um + um + '</div></div>';
    },
    servicos: function (s) {
      return '<section class="secao servicos" id="' + esc(s.id) + '">' + cabeca(s, "direita") +
        '<ol class="cartoes">' + s.itens.map(function (c, i) {
          return '<li><p class="num rotulo">' + dois(i) + '</p><h3>' + esc(c.titulo) + '</h3><p>' + esc(c.texto) + '</p>' +
            '<ul class="inclui">' + c.inclui.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("") + '</ul></li>';
        }).join("") + '</ol></section>';
    },
    processo: function (s) {
      return '<section class="secao processo" id="' + esc(s.id) + '">' + cabeca(s) +
        '<ol class="etapas">' + s.etapas.map(function (e, i) {
          return '<li><p class="num">' + (i + 1) + '</p><h3>' + esc(e.titulo) + '</h3><p>' + esc(e.texto) + '</p></li>';
        }).join("") + '</ol></section>';
    },
    // perguntas à esquerda, título à direita
    faq: function (s) {
      return '<section class="secao faq" id="' + esc(s.id) + '">' +
        '<div class="perguntas">' + s.perguntas.map(function (q, i) {
          return '<div class="item' + (i ? "" : " aberto") + '"><button type="button" aria-expanded="' + !i + '" aria-controls="resp-' + i + '" id="perg-' + i + '">' +
            '<span>' + esc(q.p) + '</span><i aria-hidden="true"></i></button>' +
            '<div class="resposta" id="resp-' + i + '" role="region" aria-labelledby="perg-' + i + '"><div><p>' + esc(q.r) + '</p></div></div></div>';
        }).join("") + '</div>' + cabeca(s, "direita") + '</section>';
    },
    contato: function (s) {
      return '<section class="secao contato com-azulejos" id="' + esc(s.id) + '">' +
        '<div class="lado-a"><p class="cab rotulo">' + esc(s.rotulo) + '</p><h2>' + esc(s.titulo) + '</h2>' +
          '<p class="texto">' + esc(s.texto) + '</p>' +
          '<a class="email" href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a>' +
          '<ul class="redes">' + s.redes.map(function (r) { return '<li><a class="rotulo" href="' + esc(r.href) + '">' + esc(r.rotulo) + '</a></li>'; }).join("") + '</ul>' +
        '</div>' +
        '<form class="form" data-email="' + esc(s.email) + '">' +
          '<label><span class="rotulo">Nome</span><input name="nome" autocomplete="name" required></label>' +
          '<label><span class="rotulo">E-mail</span><input name="email" type="email" autocomplete="email" required></label>' +
          '<fieldset><legend class="rotulo">Tipo de projeto</legend><div class="opcoes">' + s.tipos.map(function (t, i) {
            return '<label class="opcao"><input type="radio" name="tipo" value="' + esc(t) + '"' + (i ? "" : " required") + '><span>' + esc(t) + '</span></label>';
          }).join("") + '</div></fieldset>' +
          '<label><span class="rotulo">Mensagem</span><textarea name="mensagem" rows="4" required></textarea></label>' +
          '<button class="botao rotulo primario" type="submit">Enviar <span class="seta" aria-hidden="true">→</span></button>' +
        '</form>' +
        '<footer class="rodape rotulo"><span>' + esc(s.rodape) + '</span><a href="#">Voltar ao topo ↑</a></footer>' +
      '</section>';
    }
  };

  // a moldura guarda o endereço em data-src; o iframe só nasce quando o slide fica ativo
  function moldura(p, tipo) {
    var barra = tipo === "desktop" ? '<div class="barra" aria-hidden="true"><i></i><i></i><i></i><span>' + esc(p.url.replace(/^https?:\/\//, "") || "[inserir link do projeto]") + '</span></div>' : "";
    return barra + '<div class="vidro" data-src="' + esc(p.url) + '" data-tipo="' + tipo + '">' +
      (p.url ? "" : '<p class="vazio rotulo">Prévia ' + (tipo === "desktop" ? "desktop" : "celular") + '<br>[inserir link]</p>') + '</div>';
  }

  // ?estatico: sem animação, para screenshot e conferência
  if (/[?&]estatico/.test(location.search)) document.documentElement.classList.add("estatico");

  var A = E.abertura;
  var html = fundo +
    '<header class="topo">' +
      '<a class="marca" href="#">' + esc(E.nome) + '</a>' +
      '<nav aria-label="Principal">' + E.nav.map(function (n) {
        return '<a class="rotulo" href="' + esc(n.href) + '">' + esc(n.rotulo) + '</a>';
      }).join("") + '</nav>' +
      botao(E.cta) +
      '<button class="menu-btn rotulo" aria-expanded="false">Menu</button>' +
    '</header>' +
    '<main>' +
    '<section class="abertura" aria-labelledby="titulo-abertura"><div class="veu" aria-hidden="true"></div>' +
      '<div class="corpo">' +
        // parte fixa + frase que troca; o leitor de tela lê só o título inteiro (sr-only)
        '<h1 id="titulo-abertura"><span class="sr-only">' + esc(A.titulo) + '</span>' +
          (A.titulo_frases ? '<span aria-hidden="true">' + esc(A.titulo_fixo) + ' <span class="rotativo">' + letras(A.titulo_frases[0]) + '</span></span>'
                           : '<span aria-hidden="true">' + esc(A.titulo) + '</span>') + '</h1>' +
        '<div class="lado"><p class="rotulo rotulo-topo"><span class="ponto" aria-hidden="true"></span>' + esc(A.rotulo) + '</p><p>' + esc(A.texto) + '</p><div class="acoes">' + A.acoes.map(function (a) { return botao(a); }).join("") + '</div></div>' +
      '</div>' +
      // nome vazado; cada letra é um span para acender sozinha no hover (o leitor de tela lê o aria-label)
      '<p class="nome" aria-label="' + esc(E.nome) + '"><span class="base" aria-hidden="true">' +
        [...E.nome].map(function (c) { return c === " " ? " " : '<span class="l">' + esc(c) + '</span>'; }).join("") + '</span></p>' +
    '</section>' +
    E.secoes.map(function (s) {
      // abordagem: texto de um lado, cabeça em ASCII do outro (js/ascii-head.js monta no .cabeca)
      if (s.cabeca) return '<section class="secao abordagem" id="' + esc(s.id) + '">' +
        '<div class="cabeca" aria-hidden="true"></div>' +
        '<div class="texto"><p class="cab rotulo">' + esc(s.rotulo) + '</p><h2>' + esc(s.titulo) + '</h2>' +
        (s.texto || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") +
        (s.dica ? '<p class="dica rotulo"><span class="ponto" aria-hidden="true"></span>' + esc(s.dica) + '</p>' : "") +
        '</div></section>';
      if (MONTA[s.tipo]) return MONTA[s.tipo](s);
      var az = s.fundo === "azulejos";
      return '<section class="secao' + (az ? " com-azulejos" : "") + '" id="' + esc(s.id) + '">' +
        cabeca(s) +
        (s.nota ? '<p class="nota rotulo">' + esc(s.nota) + '</p>' : "") +
      '</section>';
    }).join("") +
    '</main>';
  app.innerHTML = html;
  montarRotativo();
  montarTrabalhos();
  montarFaq();
  montarContato();

  // nome gigante: a Segment A é muito condensada, então o tamanho sai da largura —
  // o nome ocupa a linha inteira, de margem a margem, em qualquer tela
  var nome = app.querySelector(".nome");
  function ajustarNome() {
    nome.style.fontSize = "100px";
    var disp = nome.clientWidth, real = nome.firstChild.getBoundingClientRect().width;
    // teto pela altura: em tela larga e baixa o nome não empurra o texto para fora da primeira dobra
    var teto = window.innerHeight * .6 / .84;
    nome.style.fontSize = Math.min(100 * disp / real * .995, teto) + "px";
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(ajustarNome);
  window.addEventListener("resize", ajustarNome);

  // brilho segue o cursor com atraso suave (lerp), para parecer luz e não um holofote colado
  var fd = app.querySelector(".fundo"), alvo = { x: .72, y: .28 }, pos = { x: .72, y: .28 }, rodando = false;
  function passo() {
    pos.x += (alvo.x - pos.x) * .09; pos.y += (alvo.y - pos.y) * .09;
    fd.style.setProperty("--mx", (pos.x * 100).toFixed(2) + "%");
    fd.style.setProperty("--my", (pos.y * 100).toFixed(2) + "%");
    rodando = Math.abs(alvo.x - pos.x) + Math.abs(alvo.y - pos.y) > .0005;
    if (rodando) requestAnimationFrame(passo);
  }
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener("pointermove", function (e) {
      alvo.x = e.clientX / innerWidth; alvo.y = e.clientY / innerHeight;
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    }, { passive: true });
  }

  var topo = app.querySelector(".topo");
  window.addEventListener("scroll", function () { topo.classList.toggle("rolou", window.scrollY > 40); }, { passive: true });
  var mb = topo.querySelector(".menu-btn");
  mb.addEventListener("click", function () {
    var ab = topo.classList.toggle("aberto");
    mb.setAttribute("aria-expanded", ab);
  });
  topo.querySelector("nav").addEventListener("click", function (e) {
    if (e.target.tagName === "A") { topo.classList.remove("aberto"); mb.setAttribute("aria-expanded", "false"); }
  });

  // Trabalhos: o site roda numa largura de verdade (1440 ou 390px) e é reduzido para caber
  // na moldura — assim o layout dele é o real, e não a versão espremida de um iframe estreito
  function montarTrabalhos() {
    var sec = app.querySelector(".trabalhos");
    if (!sec) return;
    var slides = sec.querySelectorAll(".slide"), atual = 0, LARG = { desktop: 1440, celular: 390 };
    function escala(v) {
      var f = v.querySelector("iframe");
      if (!f) return;
      var k = v.clientWidth / LARG[v.dataset.tipo];
      f.style.width = LARG[v.dataset.tipo] + "px"; f.style.height = v.clientHeight / k + "px";
      f.style.transform = "scale(" + k + ")";
    }
    function carregar(sl) {
      sl.querySelectorAll(".vidro").forEach(function (v) {
        if (!v.dataset.src || v.querySelector("iframe")) return;
        var f = document.createElement("iframe");
        f.src = v.dataset.src; f.loading = "lazy"; f.title = "Site do projeto (" + v.dataset.tipo + ")";
        f.addEventListener("load", function () { ouvirRolagem(f); });
        v.appendChild(f); escala(v);
      });
    }

    // rolagem sincronizada: rolar uma moldura leva a outra para o mesmo ponto, em proporção
    // da página (0 = topo, 1 = fim). Site do mesmo domínio: lido direto. Site de outro domínio:
    // o navegador bloqueia, então ele precisa trazer o js/sincronia-moldura.js (troca por postMessage)
    function par(f) {
      var fs = f.closest(".slide").querySelectorAll("iframe");
      return fs[0] === f ? fs[1] : fs[0];
    }
    function fracao(w) {
      var m = w.document.documentElement.scrollHeight - w.innerHeight;
      return m > 0 ? w.scrollY / m : 0;
    }
    function rolarPara(f, p) {
      f._eco = performance.now(); // a rolagem que nós causamos não volta para a outra moldura
      try {
        var w = f.contentWindow;
        w.scrollTo({ top: p * (w.document.documentElement.scrollHeight - w.innerHeight), behavior: "instant" });
      } catch (e) { f.contentWindow.postMessage({ tipo: "lg-rolar", p: p }, "*"); }
    }
    function aoRolar(f, p) {
      if (performance.now() - (f._eco || 0) < 150) return;
      var o = par(f);
      if (o) rolarPara(o, p);
    }
    function ouvirRolagem(f) {
      try {
        var w = f.contentWindow;
        w.addEventListener("scroll", function () { aoRolar(f, fracao(w)); }, { passive: true });
      } catch (e) {} // outro domínio: chega pelo "message" abaixo
    }
    window.addEventListener("message", function (e) {
      if (!e.data || e.data.tipo !== "lg-rolagem") return;
      sec.querySelectorAll("iframe").forEach(function (f) { if (f.contentWindow === e.source) aoRolar(f, +e.data.p || 0); });
    });
    function ir(n) {
      slides[atual].classList.remove("ativo"); slides[atual].hidden = true;
      atual = (n + slides.length) % slides.length;
      slides[atual].hidden = false; slides[atual].classList.add("ativo");
      carregar(slides[atual]);
      sec.querySelector(".atual").textContent = dois(atual);
      sec.querySelector(".progresso i").style.transform = "scaleX(" + (atual + 1) / slides.length + ")";
    }
    sec.querySelector(".anterior").onclick = function () { ir(atual - 1); };
    sec.querySelector(".proximo").onclick = function () { ir(atual + 1); };
    // só carrega os iframes quando a seção chega perto: a abertura não paga por eles
    new IntersectionObserver(function (es, io) {
      if (es[0].isIntersecting) { io.disconnect(); ir(0); }
    }, { rootMargin: "400px 0px" }).observe(sec);
    if (window.ResizeObserver) new ResizeObserver(function () { sec.querySelectorAll(".vidro").forEach(escala); }).observe(sec);
  }

  // título da abertura: as letras da frase atual sobem e saem uma a uma, e as da próxima
  // sobem de baixo do mesmo jeito. Parado em ?estatico e com "reduzir movimento"
  function montarRotativo() {
    var r = app.querySelector(".abertura .rotativo"), F = A.titulo_frases, i = 0;
    if (!r) return;
    // reserva a altura da frase que ocupa mais linhas nesta largura: a troca nunca empurra o hero
    var h1 = r.closest("h1");
    function reservar() {
      var maior = 0;
      h1.style.minHeight = "";
      F.forEach(function (f) {
        var t = h1.cloneNode(true);
        t.removeAttribute("id");
        t.querySelector(".rotativo").innerHTML = letras(f);
        t.style.cssText = "position:absolute;visibility:hidden;animation:none;width:" + h1.clientWidth + "px";
        h1.parentNode.appendChild(t);
        maior = Math.max(maior, t.offsetHeight);
        t.remove();
      });
      h1.style.minHeight = maior + "px";
    }
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(reservar);
    window.addEventListener("resize", reservar);
    if (F.length < 2 || document.documentElement.classList.contains("estatico") ||
        matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var PASSO = 28, DUR = 520, PAUSA = 2600;
    function escalonar(cs) { cs.forEach(function (c, n) { c.style.transitionDelay = n * PASSO + "ms"; }); }
    function trocar() {
      var velhas = r.querySelectorAll(".c");
      escalonar(velhas);
      velhas.forEach(function (c) { c.classList.add("sai"); });
      setTimeout(function () {
        i = (i + 1) % F.length;
        r.innerHTML = letras(F[i]);
        var novas = r.querySelectorAll(".c");
        novas.forEach(function (c) { c.classList.add("entra"); });
        r.offsetWidth; // aplica a posição de baixo antes de soltar a transição
        escalonar(novas);
        novas.forEach(function (c) { c.classList.remove("entra"); });
        setTimeout(trocar, novas.length * PASSO + DUR + PAUSA);
      }, velhas.length * PASSO + DUR);
    }
    setTimeout(trocar, PAUSA + 900); // espera a entrada da abertura terminar
  }

  // FAQ: uma pergunta aberta por vez; clicar na aberta fecha. A lista reserva a altura de
  // todas fechadas + a maior resposta, então a seção não muda de tamanho ao trocar
  function montarFaq() {
    var lista = app.querySelector(".perguntas");
    if (!lista) return;
    var itens = lista.querySelectorAll(".item");
    lista.addEventListener("click", function (e) {
      var b = e.target.closest(".item > button");
      if (!b) return;
      var alvo = b.parentNode, abrir = !alvo.classList.contains("aberto");
      itens.forEach(function (it) {
        var on = abrir && it === alvo;
        it.classList.toggle("aberto", on);
        it.firstChild.setAttribute("aria-expanded", on);
      });
    });
    function reservar() {
      var base = 0, maior = 0;
      itens.forEach(function (it) {
        base += it.firstChild.offsetHeight + 1; // + o fio de cima
        maior = Math.max(maior, it.querySelector(".resposta p").offsetHeight);
      });
      // +1 do fio de baixo; a margem de baixo do parágrafo entra junto com ele
      lista.style.minHeight = base + 1 + maior + parseFloat(getComputedStyle(itens[0].querySelector(".resposta p")).marginBottom) + "px";
    }
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(reservar);
    window.addEventListener("resize", reservar);
  }

  // sem servidor de formulário ainda: o envio abre o e-mail do visitante já preenchido
  function montarContato() {
    var f = app.querySelector(".contato .form");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(f);
      var corpo = d.get("mensagem") + "\n\n— " + d.get("nome") + " (" + d.get("email") + ")";
      location.href = "mailto:" + f.dataset.email + "?subject=" + encodeURIComponent("Projeto: " + d.get("tipo")) + "&body=" + encodeURIComponent(corpo);
    });
  }
})();
