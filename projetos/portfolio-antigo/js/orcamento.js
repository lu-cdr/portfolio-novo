/* Página Orçamento: simulador de investimento. A mecânica é a da ALATE Studio: base do tipo de
   projeto + um valor por página além da primeira + os itens marcados; depois os multiplicadores
   (identidade visual, prazo reduzido). O resultado é arredondado (estado.simulador.arredondar) e o
   prazo sai em semanas. Todos os valores ficam em js/estado.js > simulador; opção sem valor é
   "sob consulta" (não entra na faixa) e os serviços de depois do lançamento são sempre à parte.

   "Enviar esta estimativa" escreve o resumo no contato (logo abaixo) e marca as pílulas certas.
   "Baixar estimativa em PDF" monta o PDF com jsPDF (carregado só no primeiro clique), no visual do site.
   Dentro do claude.ai (página num quadro) o navegador bloqueia downloads: lá o botão mostra o
   resumo para copiar. */
(function () {
  'use strict';
  const LG = window.LG;
  const { esc, h, reduzido } = LG;

  let E, secao, saida = {};
  // escolhas do visitante: sobrevivem à troca de idioma (a página é remontada)
  const cfg0 = window.ESTADO.simulador;
  const sel = { tipo: cfg0.tipos[0].id, paginas: cfg0.paginas.padrao, itens: new Set(), urgencia: cfg0.urgencia[0].id, depois: new Set() };
  let mostrado = { min: 0, max: 0 };

  /* moeda: os preços ficam em reais no estado; em inglês a página mostra outra moeda se houver
     estado.simulador.exibicao.en (moeda, cambio = quantos reais vale 1 unidade dela, multiplo):
     converte e arredonda PARA CIMA no múltiplo (ex.: US$ 5). O cálculo continua todo em reais */
  function moeda() {
    const S = E.simulador, en = LG.lingua === 'en', X = en ? (S.exibicao || {}).en : null;
    const nf = new Intl.NumberFormat(en ? 'en-US' : 'pt-BR', { style: 'currency', currency: X ? X.moeda : (S.moeda || 'BRL'), maximumFractionDigits: 0 });
    const m = X ? X.multiplo || 5 : 0;
    return { format: (v) => nf.format(X ? Math.ceil(v / X.cambio / m) * m : v) };
  }
  const todosItens = () => E.simulador.grupos.flatMap((g) => g.itens);

  /* ---------- regras de preço (as únicas: o resto do arquivo só lê o resultado de calcular())
     - uma opção tem preço se soma (min/max) ou multiplica (mult); sem isso ela é "sob consulta":
       aparece no resumo, na mensagem e no PDF, mas não mexe na faixa;
     - um tipo pode usar a base de outro (precoDe), para não repetir valores (landing = one-page);
     - os serviços de depois do lançamento nunca entram na faixa (são mensais ou avulsos, à parte) */
  const temPreco = (o) => !!o && (o.min != null || o.mult != null);
  function precoDoTipo(tipo) {
    let t = tipo, voltas = 0;
    while (t && t.precoDe && voltas++ < 5) t = E.simulador.tipos.find((x) => x.id === t.precoDe);
    return t && t.min != null ? t : null;
  }

  /* ---------- o cálculo: base do tipo + páginas além da primeira + itens que somam; depois os que
     multiplicam e o prazo reduzido; arredonda (estado.simulador.arredondar) e dá o prazo em semanas */
  function calcular() {
    const S = E.simulador;
    const tipo = S.tipos.find((t) => t.id === sel.tipo) || S.tipos[0];
    const base = precoDoTipo(tipo);
    const selecionados = todosItens().filter((i) => sel.itens.has(i.id));
    const marcados = selecionados.filter(temPreco), consulta = selecionados.filter((i) => !temPreco(i));
    const urg = S.urgencia.find((u) => u.id === sel.urgencia) || S.urgencia[0];
    const depois = ((S.depois || {}).itens || []).filter((i) => sel.depois.has(i.id));
    const d = { tipo, base, urg, selecionados, marcados, consulta, depois, paginas: sel.paginas, faixa: null, semMin: null, semMax: null, min: 0, max: 0 };
    if (!base) return d;   // tipo sob consulta: sem faixa, mas o resto do resumo segue
    // campos que faltarem (ex.: um tipo novo sem valor por página no painel) contam como zero
    const pp = base.porPagina || {};
    let min = base.min, max = base.max, sem = base.semanas || 0;
    const extra = Math.max(0, sel.paginas - 1);
    min += extra * (pp.min || 0); max += extra * (pp.max || 0); sem += extra * (pp.semanas || 0);
    for (const i of marcados.filter((x) => !x.mult)) { min += i.min || 0; max += i.max || 0; sem += i.semanas || 0; }
    for (const i of marcados.filter((x) => x.mult)) { min *= i.mult; max *= i.mult; sem *= i.multSemanas || 1; }
    if (urg.mult) { min *= urg.mult; max *= urg.mult; sem *= urg.multSemanas || 1; }
    const r = S.arredondar || 50;
    d.min = Math.round(min / r) * r; d.max = Math.round(max / r) * r; d.faixa = { min: d.min, max: d.max };
    d.semMin = Math.max(1, Math.floor(sem)); d.semMax = Math.max(d.semMin, Math.ceil(sem + .8));
    return d;
  }

  /* ---------- resumo em texto (mensagem do contato, cópia e PDF) */
  const listaNomes = (itens, R) => (itens.length ? itens.map((i) => i.rotulo + (temPreco(i) ? '' : ` (${R.consulta})`)).join(', ') : R.nenhum);
  const naturezaDe = (i) => (E.orcamento.natureza || {})[i.natureza] || '';
  function linhasResumo(d) {
    const O = E.orcamento, R = O.resumo, fmt = moeda(), en = LG.lingua === 'en';
    const grupos = E.simulador.grupos.map((g) => [g.titulo, listaNomes(g.itens.filter((i) => sel.itens.has(i.id)), R)]);
    return [
      [R.tipo, d.tipo.rotulo + (d.base ? '' : ` (${R.consulta})`)],
      [R.paginas, String(d.paginas)],
      ...grupos,
      [R.urgencia, d.urg.rotulo],
      [R.depois, d.depois.length ? d.depois.map((i) => `${i.rotulo} (${naturezaDe(i)})`).join(', ') : R.nenhum],
      [R.faixa, d.faixa ? `${fmt.format(d.min)} ${en ? 'to' : 'a'} ${fmt.format(d.max)}` : R.aDefinir],
      [R.prazo, d.faixa ? O.prazo.replace('{a}', d.semMin).replace('{b}', d.semMax).replace(/^[^:]*:\s*/, '') : R.aDefinir],
      [R.idioma, R.idiomaNome],
    ];
  }
  const textoResumo = (d) => [E.orcamento.resumo.titulo, ...linhasResumo(d).map(([k, v]) => `${k}: ${v}`)].join('\n');

  /* ---------- montagem da página */
  // um chip: input escondido (rádio ou caixa, acessível pelo teclado) + rótulo; "marca" é o texto
  // pequeno ao lado ("sob consulta", "mensal"), com explicação no title
  const opcao = (tipo, nome, valor, rotulo, marcado, marca = '', dica = '') => `<label class="opcao"${dica ? ` title="${esc(dica)}"` : ''}><input type="${tipo}" name="${nome}" value="${esc(valor)}"${marcado ? ' checked' : ''}><span>${esc(rotulo)}${marca ? `<small class="opcao-marca">${esc(marca)}</small>` : ''}</span></label>`;
  function montar(textos) {
    E = textos;
    const O = E.orcamento, S = E.simulador;
    const marcaConsulta = (o, ehTipo) => ((ehTipo ? precoDoTipo(o) : temPreco(o)) ? ['', ''] : [O.consulta, O.consultaDica]);
    secao = h(`<section class="orcamento" id="simulador">
      <header class="orc-topo">
        <p class="olho">${esc(O.eyebrow)}</p>
        <h1>${esc(O.titulo)}</h1>
        <p class="orc-sub">${esc(O.sub)}</p>
      </header>
      <div class="orc-grade">
        <form class="orc-escolhas vidro" novalidate>
          <fieldset><legend>${esc(O.tipo)}</legend>
            <div class="opcoes">${S.tipos.map((t) => opcao('radio', 'tipo', t.id, t.rotulo, sel.tipo === t.id, ...marcaConsulta(t, true))).join('')}</div>
          </fieldset>
          <fieldset><legend><label for="orc-paginas">${esc(O.paginas)}</label> <output class="orc-n" for="orc-paginas">${sel.paginas}</output></legend>
            <input type="range" id="orc-paginas" min="${S.paginas.min}" max="${S.paginas.max}" step="1" value="${sel.paginas}" aria-describedby="orc-paginas-nota">
            <p class="orc-nota-campo" id="orc-paginas-nota">${esc(O.paginasNota)}</p>
          </fieldset>
          ${S.grupos.map((g) => `<fieldset><legend>${esc(g.titulo)}</legend>
            <div class="opcoes">${g.itens.map((i) => opcao('checkbox', 'item', i.id, i.rotulo, sel.itens.has(i.id), ...marcaConsulta(i))).join('')}</div>
          </fieldset>`).join('')}
          <fieldset><legend>${esc(O.urgencia)}</legend>
            <div class="opcoes">${S.urgencia.map((u) => opcao('radio', 'urgencia', u.id, u.rotulo, sel.urgencia === u.id)).join('')}</div>
            <p class="orc-nota-campo">${esc(O.urgenciaNota)}</p>
          </fieldset>
          <fieldset><legend>${esc(O.depois)}</legend>
            <p class="orc-nota-campo orc-nota-topo">${esc(O.depoisIntro)}</p>
            <div class="opcoes">${((S.depois || {}).itens || []).map((i) => opcao('checkbox', 'depois', i.id, i.rotulo, sel.depois.has(i.id), naturezaDe(i), O.consultaDica)).join('')}</div>
          </fieldset>
        </form>
        <aside class="orc-resultado vidro" aria-live="polite">
          <p class="olho">${esc(O.faixa)}</p>
          <p class="orc-valor"><span class="orc-min"></span><span class="orc-traco"> — </span><span class="orc-max"></span></p>
          <p class="orc-prazo"></p>
          <p class="orc-obs"></p>
          <div class="orc-acoes">
            <button type="button" class="botao cheio orc-enviar">${esc(O.enviar)}<span aria-hidden="true">→</span></button>
            <button type="button" class="botao vazado orc-pdf">${esc(O.pdf)}</button>
          </div>
          <div class="orc-copia" hidden><p></p><pre data-lenis-prevent></pre><button type="button" class="botao vazado">${esc(O.copiar)}</button></div>
          <small class="orc-nota">${esc(O.nota)}</small>
        </aside>
      </div>
      <div class="orc-barra" aria-hidden="true">
        <span class="orc-barra-valor"></span>
        <button type="button" tabindex="-1">${esc(O.verDetalhes)}</button>
      </div>
    </section>`);
    saida = {
      min: secao.querySelector('.orc-min'), max: secao.querySelector('.orc-max'), traco: secao.querySelector('.orc-traco'),
      prazo: secao.querySelector('.orc-prazo'), obs: secao.querySelector('.orc-obs'),
      n: secao.querySelector('.orc-n'), valor: secao.querySelector('.orc-valor'),
      barra: secao.querySelector('.orc-barra'), barraValor: secao.querySelector('.orc-barra-valor'),
      resultado: secao.querySelector('.orc-resultado'), copia: secao.querySelector('.orc-copia'),
    };
    const form = secao.querySelector('form');
    // a parte preenchida do slider (o CSS pinta a trilha até --p)
    const faixaRange = form.querySelector('#orc-paginas');
    const pintarRange = () => { const r = faixaRange; r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); };
    pintarRange();
    faixaRange.addEventListener('input', pintarRange);
    const ler = () => {
      sel.tipo = form.querySelector('input[name=tipo]:checked').value;
      sel.urgencia = form.querySelector('input[name=urgencia]:checked').value;
      sel.paginas = +form.querySelector('#orc-paginas').value;
      sel.itens = new Set([...form.querySelectorAll('input[name=item]:checked')].map((i) => i.value));
      sel.depois = new Set([...form.querySelectorAll('input[name=depois]:checked')].map((i) => i.value));
      atualizar(true);
    };
    form.addEventListener('input', ler);
    form.addEventListener('change', ler);
    secao.querySelector('.orc-enviar').addEventListener('click', enviar);
    secao.querySelector('.orc-pdf').addEventListener('click', baixarPdf);
    secao.querySelector('.orc-barra button').addEventListener('click', () => LG.rolarAte(saida.resultado, 1));
    saida.copia.querySelector('button').addEventListener('click', copiarResumo);
    mostrado = { min: 0, max: 0 };
    atualizar(false);
    return [secao];
  }

  /* ---------- saída: a faixa anima de um valor ao outro (Number Counter); sem faixa (tipo sob
     consulta), o card diz "Sob consulta" e o prazo fica para a conversa */
  let animacao = 0;
  function atualizar(animar) {
    const d = calcular(), O = E.orcamento, fmt = moeda();
    saida.n.textContent = d.paginas;
    saida.prazo.textContent = `${d.faixa ? O.prazo.replace('{a}', d.semMin).replace('{b}', d.semMax) : O.prazoConsulta} · ${d.tipo.rotulo}`;
    const obs = [];
    if (d.consulta.length) obs.push(O.maisConsulta.replace('{n}', d.consulta.length).replace('{itens}', d.consulta.length === 1 ? O.item : O.itens));
    if (d.depois.length) obs.push(O.depoisLinha.replace('{lista}', d.depois.map((i) => `${i.rotulo} (${naturezaDe(i)})`).join(', ')));
    saida.obs.textContent = obs.length ? obs.join('\n') : O.dica;
    cancelAnimationFrame(animacao);
    saida.valor.classList.toggle('consulta', !d.faixa);
    if (!d.faixa) {
      saida.min.textContent = O.faixaConsulta; saida.max.textContent = ''; saida.traco.style.display = 'none';
      saida.barraValor.textContent = O.faixaConsulta; mostrado = { min: 0, max: 0 };
      return;
    }
    saida.traco.style.display = '';
    const de = { ...mostrado }, para = { min: d.min, max: d.max };
    const escrever = (v) => {
      saida.min.textContent = fmt.format(v.min); saida.max.textContent = fmt.format(v.max);
      saida.barraValor.textContent = `${fmt.format(v.min)} — ${fmt.format(v.max)}`;
    };
    if (!animar || reduzido || (de.min === 0 && de.max === 0)) { escrever(para); mostrado = para; return; }
    if (de.min === para.min && de.max === para.max) return;
    const t0 = performance.now(), dur = 450;
    saida.valor.classList.remove('pulo'); void saida.valor.offsetWidth; saida.valor.classList.add('pulo');
    const passo = (agora) => {
      const k = Math.min(1, (agora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      const v = { min: Math.round(de.min + (para.min - de.min) * e), max: Math.round(de.max + (para.max - de.max) * e) };
      escrever(v); mostrado = v;
      if (k < 1) animacao = requestAnimationFrame(passo); else mostrado = para;
    };
    animacao = requestAnimationFrame(passo);
  }

  /* ---------- enviar: o resumo vai para o campo do contato, com as pílulas certas marcadas */
  function enviar() {
    const d = calcular();
    const pt = window.ESTADO.contato.opcoes, aqui = E.contato.opcoes;
    // os rótulos das pílulas mudam com o idioma: casa pelo rótulo em português (estado) e usa o
    // da posição correspondente no idioma atual (itens sob consulta também marcam a pílula)
    const opcoes = [...new Set([d.tipo.contato, ...d.selecionados.map((i) => i.contato)].filter(Boolean))]
      .map((r) => aqui[pt.indexOf(r)]).filter(Boolean);
    LG.preencherContato({ texto: textoResumo(d) + '\n\n', opcoes });
  }

  /* ---------- PDF da estimativa */
  const emQuadro = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();
  const carregarJsPdf = () => window.PDFMarca.carregarJsPdf();
  function mostrarCopia() {
    const d = calcular();
    saida.copia.hidden = false;
    saida.copia.querySelector('p').textContent = E.orcamento.semDownload;
    saida.copia.querySelector('pre').textContent = textoResumo(d);
    saida.copia.querySelector('button').textContent = E.orcamento.copiar;
  }
  function copiarResumo(ev) {
    const b = ev.currentTarget, pre = saida.copia.querySelector('pre');
    const selecionar = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(pre.textContent).then(() => { b.textContent = E.orcamento.copiado; }, selecionar); } catch (e) { selecionar(); }
  }
  /* O PDF usa o modelo da marca (js/pdf-marca.js: faixa escura com ondas, marca, rótulos, fios,
     rodapé, fontes do site) e acrescenta o que é da estimativa: o card de vidro com a faixa e o
     prazo, o resumo, "Como a faixa foi montada", os passos e a chamada. Tudo numa folha A4.
     Os textos ficam em estado > orcamento.pdfDoc. */
  const carregarFontes = () => window.PDFMarca.carregarFontes();

  // como a faixa foi montada: as parcelas do mesmo cálculo de calcular(), para o PDF
  function composicao(d) {
    const D = E.orcamento.pdfDoc, linhas = [], mults = [];
    if (d.base) {
      const b = d.base;
      linhas.push({ rotulo: D.base.replace('{tipo}', d.tipo.rotulo), min: b.min, max: b.max });
      const extra = Math.max(0, d.paginas - 1);
      const pp = b.porPagina || {};
      if (extra && pp.max) linhas.push({ rotulo: D.paginasExtras.replace('{n}', extra), min: extra * (pp.min || 0), max: extra * pp.max });
      mults.push(...d.marcados.filter((x) => x.mult).map((i) => ({ rotulo: i.rotulo, mult: i.mult })),
        ...(d.urg.mult ? [{ rotulo: d.urg.rotulo, mult: d.urg.mult }] : []));
    }
    // os itens com preço aparecem com o valor deles mesmo sem base (tipo sob consulta); só o total fica a definir
    for (const i of d.marcados.filter((x) => !x.mult)) linhas.push({ rotulo: i.rotulo, min: i.min || 0, max: i.max || 0 });
    const consulta = [...(d.base ? [] : [d.tipo]), ...d.consulta];
    return { linhas, mults, consulta, arredondar: E.simulador.arredondar || 50 };
  }

  /* nome do arquivo a partir das escolhas, para estimativas diferentes não saírem com o mesmo nome:
     base-tipo-páginas[-até 2 itens][-maisN][-prazo-reduzido].pdf. Os dois itens mostrados são os de
     maior peso no valor (os sob consulta pesam menos); os outros viram só a contagem (maisN).
     Ex.: estimativa-lucas-giovanni-app-8p-area-cliente-pagamentos-mais7-prazo-reduzido.pdf */
  function nomeArquivo(d) {
    const A = E.orcamento.pdfDoc.arquivo;
    const partes = [A.base, d.tipo.arquivo, A.paginas.replace('{n}', d.paginas)];
    // peso de um item: o máximo que ele soma; os que multiplicam pesam pelo quanto aumentam o total
    const peso = (i) => (i.mult ? (i.mult - 1) * (d.max || 1000) : i.max || 0);
    const itens = [...d.selecionados].sort((x, y) => peso(y) - peso(x));
    partes.push(...itens.slice(0, 2).map((i) => i.arquivo));
    if (itens.length > 2) partes.push(A.mais.replace('{k}', itens.length - 2));
    if (d.urg.arquivo) partes.push(d.urg.arquivo);
    return partes.filter(Boolean).join('-').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + '.pdf';
  }

  // o PDF é montado antes de perguntar: assim o pop-up já mostra o tamanho real do arquivo
  let gerando = false;
  async function baixarPdf(ev) {
    // dentro do claude.ai o download é bloqueado: mostra o resumo para copiar
    if (emQuadro) { mostrarCopia(); return; }
    if (gerando) return;
    const botao = ev && ev.currentTarget, rotulo = botao && botao.textContent;
    gerando = true;
    if (botao) { botao.textContent = E.orcamento.confirmaPdf.preparando; botao.setAttribute('aria-busy', 'true'); }
    try {
      let JsPDF;
      try { JsPDF = await carregarJsPdf(); } catch (e) { mostrarCopia(); return; }
      const fontes = await carregarFontes();
      const d = calcular();
      const blob = montarPdf(JsPDF, fontes, d).output('blob');
      confirmarDownload(blob, botao, nomeArquivo(d));
    } finally {
      gerando = false;
      if (botao) { botao.textContent = rotulo; botao.removeAttribute('aria-busy'); }
    }
  }

  // pop-up de confirmação: nome do arquivo e tamanho; "Baixar" salva, Esc ou fora fecha
  function confirmarDownload(blob, voltarPara, nome) {
    const C = E.orcamento.confirmaPdf;
    const kb = blob.size / 1024;
    const tam = kb < 1024 ? `${Math.max(1, Math.round(kb))} KB` : `${(kb / 1024).toFixed(1).replace('.', LG.lingua === 'en' ? '.' : ',')} MB`;
    const dlg = h(`<dialog class="dialogo" aria-labelledby="dialogo-t">
      <div class="dialogo-caixa vidro">
        <span class="dialogo-icone" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9.5 14.5 12 17l2.5-2.5"/></svg></span>
        <h2 id="dialogo-t">${esc(C.titulo)}</h2>
        <p>${esc(C.texto)}</p>
        <dl class="dialogo-dados">
          <div><dt>${esc(C.arquivo)}</dt><dd>${esc(nome)}</dd></div>
          <div><dt>${esc(C.tamanho)}</dt><dd>${esc(tam)}</dd></div>
        </dl>
        <div class="dialogo-acoes">
          <button type="button" class="botao vazado" data-acao="cancelar">${esc(C.cancelar)}</button>
          <button type="button" class="botao cheio" data-acao="baixar">${esc(C.baixar)} <span aria-hidden="true">↓</span></button>
        </div>
      </div>
    </dialog>`);
    document.body.append(dlg);
    if (LG.lenis) LG.lenis.stop();
    const fechar = () => {
      if (dlg.classList.contains('saindo')) return;
      dlg.classList.add('saindo');
      setTimeout(() => { dlg.close(); dlg.remove(); if (LG.lenis) LG.lenis.start(); if (voltarPara) voltarPara.focus(); }, reduzido ? 0 : 220);
    };
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); fechar(); });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) { fechar(); return; }   // clique fora da caixa
      const acao = e.target.closest('[data-acao]');
      if (!acao) return;
      if (acao.dataset.acao === 'baixar') {
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = nome; document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
      fechar();
    });
    dlg.showModal();
    dlg.querySelector('[data-acao="baixar"]').focus();
  }

  function montarPdf(JsPDF, fontes, d) {
    const D = E.orcamento.pdfDoc, R = E.orcamento.resumo, en = LG.lingua === 'en';
    const fmtMoeda = moeda();
    const dinheiro = (v) => fmtMoeda.format(v).replace(/ /g, ' ');
    const faixa = (a, b) => `${dinheiro(a)} — ${dinheiro(b)}`;
    const k = window.PDFMarca.criar(JsPDF, fontes, {
      titulo: D.titulo, rotulo: D.rotuloDoc, nome: E.nome, oficio: E.oficio, email: E.contato.email,
      numeroTexto: D.numero, dados: [D.gerada, D.validade], abertura: D.abertura, paginaTexto: D.pagina, lingua: LG.lingua,
    });
    const { doc, COR, W, M, L, DISP, CORPO, FORTE, cor, fonte, opac, olho, fio, dois } = k;
    let y = 0;
    const caber = (alt) => { k.y = y; k.caber(alt); y = k.y; };

    /* ---------- faixa escura com a marca, o número e o título (modelo da marca) */
    const FAIXA = k.cabecalho({ faixa: 196 });

    /* ---------- card de vidro: faixa e prazo (ou "sob consulta") */
    const cy = FAIXA - 40, ch = 86;
    opac(.1); doc.setFillColor(...COR.tinta); doc.roundedRect(M + 4, cy + 7, L - 8, ch, 16, 16, 'F'); opac(1);
    doc.setFillColor(...COR.cartao); doc.setDrawColor(...COR.fio); doc.setLineWidth(.7);
    doc.roundedRect(M, cy, L, ch, 16, 16, 'FD');
    const div = M + L * .64;
    doc.setFillColor(...COR.brasa); doc.circle(M + 24, cy + 24.5, 2.3, 'F');
    olho(D.faixa, M + 32, cy + 27);
    const textoFaixa = d.faixa ? faixa(d.min, d.max) : D.faixaConsulta;
    // a faixa encolhe se não couber antes do divisor (valores de cinco dígitos)
    let tamFaixa = 28; fonte(DISP, tamFaixa);
    while (doc.getTextWidth(textoFaixa) > div - M - 44 && tamFaixa > 18) fonte(DISP, --tamFaixa);
    cor(COR.tinta); doc.text(textoFaixa, M + 22, cy + 57);
    fonte(CORPO, 7.8); cor(COR.fraco); doc.text(`${d.tipo.rotulo} · ${d.paginas} ${R.paginas.toLowerCase()}`, M + 22, cy + 73);
    fio(div, cy + 18, div, cy + ch - 18);
    olho(D.prazo, div + 22, cy + 27);
    fonte(DISP, 20); cor(COR.tinta); doc.text(d.faixa ? D.semanas.replace('{a}', d.semMin).replace('{b}', d.semMax) : D.semanasConsulta, div + 22, cy + 55);
    fonte(CORPO, 7.8); cor(COR.fraco); doc.text(d.urg.rotulo, div + 22, cy + 73);

    /* ---------- o que você marcou | em todo projeto
       os itens com preço aparecem um a um logo abaixo, com o valor de cada um; aqui fica o resumo
       por grupo (quantos marcados) */
    y = cy + ch + 28;
    const colE = 228, xD = M + colE + 28, colD = L - colE - 28;
    olho(D.escopo, M, y); olho(D.inclui, xD, y);
    fio(M, y + 8, M + colE, y + 8, COR.tinta, .8); fio(xD, y + 8, W - M, y + 8, COR.tinta, .8);
    let ye = y + 24;
    const linhaEscopo = (rotulo, valor) => {
      fonte(CORPO, 7.6); cor(COR.fraco);
      let r = String(rotulo);
      while (doc.getTextWidth(r) > 112 && r.length > 4) r = r.slice(0, -2) + '…';
      doc.text(r, M, ye);
      fonte(CORPO, 9.2); cor(COR.tinta); doc.text(String(valor), M + 118, ye);
      fio(M, ye + 7, M + colE, ye + 7);
      ye += 18.5;
    };
    linhaEscopo(R.tipo, d.tipo.rotulo);
    linhaEscopo(R.paginas, String(d.paginas));
    for (const g of E.simulador.grupos) linhaEscopo(g.titulo, String(g.itens.filter((i) => sel.itens.has(i.id)).length || R.nenhum));
    // o prazo desejado já está no card, logo abaixo do prazo estimado
    // o que vem em todo projeto: tique verde (é o que está incluso)
    let yd = y + 24;
    for (const item of D.incluiItens) {
      fonte(CORPO, 8.6); cor(COR.tinta);
      const t = doc.splitTextToSize(item, colD - 18);
      doc.setFillColor(...COR.verdeClaro); doc.circle(xD + 5, yd - 3, 5.2, 'F');
      doc.setDrawColor(...COR.verde); doc.setLineWidth(1.1); doc.setLineCap('round'); doc.setLineJoin('round');
      doc.lines([[1.6, 1.6], [3.2, -3.4]], xD + 2.6, yd - 2.9, [1, 1], 'S');
      doc.setLineCap('butt'); doc.setLineJoin('miter');
      doc.text(t, xD + 17, yd, { lineHeightFactor: 1.3 });
      yd += 11.2 * t.length + 4.4;
    }
    y = Math.max(ye, yd) + 8;

    /* ---------- como a faixa foi montada: duas colunas quando a lista é longa; o que é sob
       consulta vem numa linha à parte, fora da conta */
    const C = composicao(d);
    const linhas = [...C.linhas.map((l) => ({ rotulo: l.rotulo, valor: faixa(l.min, l.max).replace(' — ', ' – ') })),
      ...C.mults.map((m) => ({ rotulo: m.rotulo, valor: D.multiplica.replace('{x}', m.mult.toLocaleString(en ? 'en-US' : 'pt-BR')), mult: true }))];
    const duas = linhas.length > 5, porColuna = duas ? Math.ceil(linhas.length / 2) : linhas.length;
    const lc = duas ? (L - 16) / 2 : L, AL = 16.5;
    caber(40 + porColuna * AL + 40);
    olho(D.composicao, M, y); fio(M, y + 8, W - M, y + 8, COR.tinta, .8);
    y += 23;
    linhas.forEach((l, i) => {
      const col = Math.floor(i / porColuna), lin = i % porColuna;
      const x = M + col * (lc + 16), yy = y + lin * AL;
      if (lin % 2 === 0) { doc.setFillColor(...COR.realce); doc.roundedRect(x, yy - 11.5, lc, AL, 4, 4, 'F'); }
      fonte(CORPO, 8.2); cor(COR.tinta);
      let rot = l.rotulo;
      const larg = lc - 16 - doc.getTextWidth(l.valor) - 12;
      while (doc.getTextWidth(rot) > larg && rot.length > 4) rot = rot.slice(0, -2) + '…';
      doc.text(rot, x + 8, yy);
      cor(l.mult ? COR.brasa : COR.fraco); doc.text(l.valor, x + lc - 8, yy, { align: 'right' });
    });
    y += porColuna * AL + 2;
    if (C.consulta.length) {
      fonte(CORPO, 8.2);
      const txt = doc.splitTextToSize(`${D.consultaLinha}: ${C.consulta.map((i) => i.rotulo).join(', ')}`, L - 16);
      caber(txt.length * 11.5 + 8);
      cor(COR.fraco); doc.text(txt, M + 8, y + 2, { lineHeightFactor: 1.4 });
      y += txt.length * 11.5 + 6;
    }
    fio(M, y - 6, W - M, y - 6, COR.tinta, .8);
    y += 13;
    fonte(FORTE, 9); cor(COR.tinta); doc.text(R.faixa, M + 8, y);
    fonte(DISP, 16); cor(COR.tinta); doc.text(d.faixa ? faixa(d.min, d.max) : D.faixaConsulta, W - M - 8, y + 1, { align: 'right' });
    y += 22;

    /* ---------- depois do lançamento: sempre à parte da faixa (mensal ou avulso, a combinar) */
    if (d.depois.length) {
      caber(40 + d.depois.length * 17);
      olho(D.depois, M, y); fio(M, y + 8, W - M, y + 8, COR.tinta, .8);
      y += 22;
      d.depois.forEach((i, n) => {
        if (n % 2 === 0) { doc.setFillColor(...COR.realce); doc.roundedRect(M, y - 11.5, L, 16.5, 4, 4, 'F'); }
        fonte(CORPO, 8.2); cor(COR.tinta); doc.text(i.rotulo, M + 8, y);
        cor(COR.fraco); doc.text(`${naturezaDe(i)} · ${D.depoisValor}`, W - M - 8, y, { align: 'right' });
        y += 16.5;
      });
      y += 8;
    }

    /* ---------- próximos passos: 01, 02, 03 como no menu */
    caber(80);
    olho(D.proximo, M, y); fio(M, y + 8, W - M, y + 8, COR.tinta, .8);
    y += 23;
    const gap = 18, cw = (L - gap * 2) / 3;
    let alt = 0;
    D.passos.forEach(([titulo, texto], i) => {
      const x = M + i * (cw + gap);
      fonte(CORPO, 7.2); cor(COR.brasa); doc.text(dois(i + 1), x, y);
      fonte(DISP, 15); cor(COR.tinta); doc.text(titulo, x + 15, y + 1);
      fonte(CORPO, 8); cor(COR.fraco);
      const t = doc.splitTextToSize(texto, cw);
      doc.text(t, x, y + 15, { lineHeightFactor: 1.4 });
      alt = Math.max(alt, 15 + t.length * 11.2);
    });
    y += alt + 10;

    /* ---------- chamada final: o card escuro do contato, numa faixa só */
    caber(66);
    const ah = 54;
    doc.setFillColor(...COR.tinta); doc.roundedRect(M, y, L, ah, 14, 14, 'F');
    fonte(DISP, 20); cor(COR.papel); doc.text(D.cta, M + 22, y + 34);
    const xt = M + 22 + doc.getTextWidth(D.cta) + 24, ty = y + 24;
    fio(xt - 12, y + 14, xt - 12, y + ah - 14, COR.onda, .8);
    const [antes, depois] = D.ctaTexto.split('{email}');
    fonte(CORPO, 8.2); cor(COR.claro);
    doc.text(antes.trim(), xt, ty);
    fonte(FORTE, 8.2); cor(COR.papel);
    const ye2 = ty + 13;
    doc.textWithLink(E.contato.email, xt, ye2, { url: 'mailto:' + E.contato.email });
    const we = doc.getTextWidth(E.contato.email);
    fio(xt, ye2 + 2, xt + we, ye2 + 2, COR.brasa, .8);
    fonte(CORPO, 8.2); cor(COR.claro);
    if ((depois || '').trim()) doc.text(depois.replace(/^\s*/, '').replace(/^\.\s*/, '· '), xt + we + 6, ye2);
    y += ah + 10;

    /* ---------- nota */
    caber(18);
    fonte(CORPO, 7); cor(COR.fraco);
    doc.text(doc.splitTextToSize(D.nota, L), M, y, { lineHeightFactor: 1.4 });

    return k.finalizar();
  }
  // para conferir o layout sem baixar (build/conferir_pdf.py)
  LG._pdfTeste = async () => {
    const JsPDF = await carregarJsPdf(), fontes = await carregarFontes();
    return montarPdf(JsPDF, fontes, calcular()).output('datauristring');
  };
  LG._orcSel = sel;
  LG._orcNome = () => nomeArquivo(calcular());
  LG._orcCalc = () => calcular();

  /* ---------- barra do celular: some quando o card de resultado ou o contato estão à vista */
  function vigiarBarra() {
    // o observador só avisa o que mudou: guarda a visibilidade de cada alvo
    const visivel = new Map();
    const io = new IntersectionObserver((itens) => {
      for (const i of itens) visivel.set(i.target, i.isIntersecting);
      saida.barra.classList.toggle('escondida', [...visivel.values()].some(Boolean));
    }, { threshold: .15 });
    io.observe(saida.resultado);
    if (LG.contato) io.observe(LG.contato);
    return io;
  }
  let vigia = null;
  LG.pagina({
    montar,
    depois() { if (vigia) vigia.disconnect(); vigia = vigiarBarra(); },
  });
})();
