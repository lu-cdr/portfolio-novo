/* Modelo de PDF da marca Lucas Giovanni: o visual do site em papel A4, para qualquer impresso
   (estimativa do simulador, contratos, propostas, recibos). Usado pelo js/orcamento.js e pelos
   modelos em modelos/ (ver modelos/LEIAME.md).

   Visual: fundo creme, faixa escura no alto com ondas e anéis (a água do site), marca LG,
   título em Instrument Serif, rótulos em caixa alta espaçados, fios finos, numeração 01/02/03 e
   rodapé com nome, e-mail, número do documento e página. Fontes do site em fonts/ (Instrument
   Serif, Geist Regular e Medium); sem elas, Times e Helvetica.

   Uso:
     const JsPDF = await PDFMarca.carregarJsPdf();
     const fontes = await PDFMarca.carregarFontes();          // base opcional: '../' etc.
     const k = PDFMarca.criar(JsPDF, fontes, { titulo, rotulo, nome, oficio, email, ... });
     k.cabecalho();                 // página 1: faixa, marca, dados à direita, título, abertura
     k.secao('Objeto'); k.paragrafo('...'); k.lista([...], { marcador: 'numero' });
     k.assinaturas([{ nome: 'Contratante' }, { nome: 'Lucas Giovanni' }]);
     k.finalizar().save('arquivo.pdf');
   k.y é a altura atual (pt); k.caber(alt) passa para a próxima página se alt não couber. */
(function () {
  'use strict';
  const JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const COR = {
    papel: [247, 242, 232], tinta: [16, 39, 45], fraco: [78, 100, 104], brasa: [224, 97, 63],
    fio: [215, 214, 206], realce: [234, 230, 220], cartao: [252, 250, 246],
    claro: [190, 206, 209], onda: [40, 78, 87], verde: [40, 132, 92], verdeClaro: [220, 236, 222],
  };
  const FONTES = [
    ['fonts/InstrumentSerif-Regular.ttf', 'InstrumentSerif', 'normal'],
    ['fonts/Geist-Regular.ttf', 'Geist', 'normal'],
    ['fonts/Geist-Medium.ttf', 'Geist', 'bold'],
  ];

  let carregando = null;
  function carregarJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (!carregando) carregando = new Promise((ok, falha) => {
      const s = document.createElement('script');
      s.src = JSPDF; s.onload = () => ok(window.jspdf.jsPDF); s.onerror = falha;
      document.head.append(s);
    });
    return carregando;
  }
  const cacheFontes = {};
  // [{arquivo, base64, nome, estilo}], ou [] quando as fontes não estão disponíveis
  async function carregarFontes(base = '') {
    if (cacheFontes[base]) return cacheFontes[base];
    const b64 = (buf) => {
      const bytes = new Uint8Array(buf); let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(s);
    };
    try {
      cacheFontes[base] = await Promise.all(FONTES.map(async ([url, nome, estilo]) => {
        const r = await fetch(base + url);
        if (!r.ok) throw new Error(url);
        return { arquivo: url.split('/').pop(), base64: b64(await r.arrayBuffer()), nome, estilo };
      }));
    } catch (e) { cacheFontes[base] = []; }
    return cacheFontes[base];
  }

  /* info: titulo, rotulo (ex.: "Estimativa", "Contrato"), nome, oficio, email, numero (gerado se
     faltar, com o prefixo), prefixo ('LG'), dados (linhas à direita, abaixo do número), abertura,
     paginaTexto ('Página {a} de {b}'), numeroTexto ('Nº {n}'), lingua ('pt' | 'en') */
  function criar(JsPDF, fontes, info) {
    const en = info.lingua === 'en';
    const doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
    for (const f of fontes) { doc.addFileToVFS(f.arquivo, f.base64); doc.addFont(f.arquivo, f.nome, f.estilo); }
    const temFontes = fontes.length === FONTES.length;
    const DISP = temFontes ? ['InstrumentSerif', 'normal'] : ['times', 'normal'];
    const CORPO = temFontes ? ['Geist', 'normal'] : ['helvetica', 'normal'];
    const FORTE = temFontes ? ['Geist', 'bold'] : ['helvetica', 'bold'];
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const M = 44, L = W - M * 2, RODAPE = H - 50;

    const cor = (c) => doc.setTextColor(...c);
    const fonte = (f, tam) => { doc.setFont(...f); doc.setFontSize(tam); };
    const opac = (o) => doc.setGState(new doc.GState({ opacity: o }));
    // rótulo em caixa alta e espaçado; com alinhar = 'right', x é a borda direita
    const olho = (txt, x, y, c = COR.fraco, alinhar) => {
      fonte(FORTE, 7.2); cor(c); const t = String(txt).toUpperCase();
      if (alinhar === 'right') x -= doc.getTextWidth(t) + 1.1 * (t.length - 1);
      doc.text(t, x, y, { charSpace: 1.1 });
    };
    const fio = (x1, y1, x2, y2, c = COR.fio, w = .6) => { doc.setDrawColor(...c); doc.setLineWidth(w); doc.line(x1, y1, x2, y2); };
    const dois = (n) => String(n).padStart(2, '0');
    const agora = new Date();
    const numero = info.numero || `${info.prefixo || 'LG'}-${String(agora.getFullYear()).slice(2)}${dois(agora.getMonth() + 1)}${dois(agora.getDate())}-${dois(agora.getHours())}${dois(agora.getMinutes())}`;
    const data = agora.toLocaleDateString(en ? 'en-US' : 'pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    // ondas: a água do site, em linhas finas sobre a faixa escura; anéis da onda do cursor à direita
    function ondas(y0, altura, aneisY) {
      doc.setDrawColor(...COR.onda);
      for (let i = 0; i < 7; i++) {
        const base = y0 + altura * (.1 + i * .1), amp = 3 + i, fase = i * .9;
        doc.setLineWidth(.5 + i * .08); opac(.5 - i * .05);
        const pts = [];
        for (let x = 0; x <= W; x += 12) pts.push([x, base + Math.sin(x / 70 + fase) * amp + Math.sin(x / 23 + fase * 2) * amp * .25]);
        doc.lines(pts.slice(1).map((p, j) => [p[0] - pts[j][0], p[1] - pts[j][1]]), pts[0][0], pts[0][1], [1, 1], 'S');
      }
      doc.setDrawColor(...COR.claro);
      for (let i = 1; i <= 4; i++) { opac(.2 - i * .04); doc.setLineWidth(.7); doc.ellipse(W - 80, aneisY, i * 18, i * 6.5, 'S'); }
      opac(1);
    }
    const fundo = () => { doc.setFillColor(...COR.papel); doc.rect(0, 0, W, H, 'F'); };
    function marca(x, y, claro) {
      doc.setFillColor(...(claro ? COR.papel : COR.tinta)); doc.roundedRect(x, y, 26, 26, 6, 6, 'F');
      fonte(DISP, 13); cor(claro ? COR.tinta : COR.papel); doc.text('LG', x + 13, y + 17.5, { align: 'center' });
      fonte(DISP, 16.5); cor(claro ? COR.papel : COR.tinta); doc.text(info.nome, x + 36, y + 12);
      fonte(CORPO, 7.8); cor(claro ? COR.claro : COR.fraco); doc.text(info.oficio, x + 36, y + 23);
    }
    function rodape() {
      fio(M, H - 40, W - M, H - 40);
      fonte(CORPO, 7.5); cor(COR.fraco);
      doc.text(`${info.nome} · ${info.email}`, M, H - 26);
      doc.text(`${info.rotulo} ${numero}`, W / 2, H - 26, { align: 'center' });
    }

    const k = {
      doc, COR, W, H, M, L, RODAPE, DISP, CORPO, FORTE, numero, data, en,
      cor, fonte, opac, olho, fio, dois, ondas, marca, fundo, rodape,
      y: 0,
      // continuação: página nova com um cabeçalho curto (marca escura, título e número à direita)
      novaPagina() {
        rodape(); doc.addPage(); fundo();
        marca(M, 34, false);
        fonte(CORPO, 8); cor(COR.fraco); doc.text(`${info.titulo} · ${numero}`, W - M, 52, { align: 'right' });
        fio(M, 76, W - M, 76);
        k.y = 106;
      },
      caber(alt) { if (k.y + alt > RODAPE) k.novaPagina(); },

      /* página 1: faixa escura com a marca, número e dados à direita, título e abertura.
         faixa: altura da faixa (196 na estimativa, que põe um card por cima da borda; ~170 sem
         card). Devolve a altura da faixa; k.y fica logo abaixo dela */
      cabecalho({ faixa = 170 } = {}) {
        fundo();
        doc.setFillColor(...COR.tinta); doc.rect(0, 0, W, faixa, 'F');
        ondas(faixa - 46, 46, 104);
        marca(M, 30, true);
        olho(info.rotulo, W - M, 38, COR.brasa, 'right');
        fonte(CORPO, 9); cor(COR.papel); doc.text((info.numeroTexto || (en ? 'No. {n}' : 'Nº {n}')).replace('{n}', numero), W - M, 51, { align: 'right' });
        fonte(CORPO, 7.8); cor(COR.claro);
        (info.dados || []).forEach((linha, i) => doc.text(linha.replace('{data}', data), W - M, 62 + i * 10, { align: 'right' }));
        fonte(DISP, 34); cor(COR.papel); doc.text(info.titulo, M, 108);
        if (info.abertura) {
          fonte(CORPO, 8.6); cor(COR.claro);
          doc.text(doc.splitTextToSize(info.abertura, 390), M, 126, { lineHeightFactor: 1.45 });
        }
        k.y = faixa + 30;
        return faixa;
      },
      // título de seção: rótulo + fio escuro; com numero, ganha o 01/02 cor de brasa na frente
      secao(titulo, { numero: n, x = M, largura = L } = {}) {
        if (k.y > 120) k.y += 8;   // respiro antes de cada seção, menos no topo da página
        k.caber(48);
        let xt = x;
        if (n) { fonte(CORPO, 7.2); cor(COR.brasa); doc.text(dois(n), x, k.y); xt = x + 16; }
        olho(titulo, xt, k.y);
        fio(x, k.y + 8, x + largura, k.y + 8, COR.tinta, .8);
        k.y += 25;
      },
      // parágrafo corrido, quebrando de página linha a linha se precisar
      paragrafo(texto, { tam = 9, c = COR.tinta, x = M, largura = L, entrelinha = 1.5, depois = 8 } = {}) {
        fonte(CORPO, tam); cor(c);
        const passo = tam * entrelinha;
        for (const linha of doc.splitTextToSize(String(texto), largura)) {
          k.caber(passo); fonte(CORPO, tam); cor(c);
          doc.text(linha, x, k.y); k.y += passo;
        }
        k.y += depois;
      },
      // lista: marcador 'tique' (verde, incluso), 'traco' (brasa) ou 'numero' (1.1, 1.2... com prefixo)
      lista(itens, { marcador = 'traco', prefixo = '', tam = 9, x = M, largura = L } = {}) {
        itens.forEach((item, i) => {
          fonte(CORPO, tam);
          const linhas = doc.splitTextToSize(String(item), largura - 20), passo = tam * 1.45;
          k.caber(passo * Math.min(linhas.length, 2) + 4);
          if (marcador === 'tique') {
            doc.setFillColor(...COR.verdeClaro); doc.circle(x + 5, k.y - 3, 5.2, 'F');
            doc.setDrawColor(...COR.verde); doc.setLineWidth(1.1); doc.setLineCap('round'); doc.setLineJoin('round');
            doc.lines([[1.6, 1.6], [3.2, -3.4]], x + 2.6, k.y - 2.9, [1, 1], 'S');
            doc.setLineCap('butt'); doc.setLineJoin('miter');
          } else if (marcador === 'numero') {
            fonte(CORPO, tam - 1); cor(COR.brasa); doc.text(`${prefixo}${i + 1}`, x, k.y);
          } else {
            doc.setFillColor(...COR.brasa); doc.rect(x, k.y - 3.4, 6, 1.4, 'F');
          }
          fonte(CORPO, tam); cor(COR.tinta);
          for (const linha of linhas) { k.caber(passo); fonte(CORPO, tam); cor(COR.tinta); doc.text(linha, x + 20, k.y); k.y += passo; }
          k.y += 4;
        });
        k.y += 4;
      },
      // pares rótulo/valor com fio entre eles (dados das partes, resumo)
      dados(pares, { x = M, largura = L, coluna = 130 } = {}) {
        for (const [rotulo, valor] of pares) {
          fonte(CORPO, 9.4);
          const linhas = doc.splitTextToSize(String(valor), largura - coluna);
          k.caber(13 * linhas.length + 10);
          fonte(CORPO, 7.6); cor(COR.fraco); doc.text(String(rotulo), x, k.y);
          fonte(CORPO, 9.4); cor(COR.tinta); doc.text(linhas, x + coluna, k.y);
          k.y += 13 * (linhas.length - 1);
          fio(x, k.y + 8, x + largura, k.y + 8);
          k.y += 21;
        }
        k.y += 6;
      },
      // linhas de assinatura lado a lado (2 por linha), com nome e papel embaixo
      assinaturas(pessoas, { local } = {}) {
        k.caber(110);
        if (local) { fonte(CORPO, 9); cor(COR.tinta); doc.text(local.replace('{data}', data), M, k.y); k.y += 50; } else k.y += 30;
        const gap = 40, w = (L - gap) / 2;
        pessoas.forEach((p, i) => {
          if (i && i % 2 === 0) { k.y += 62; k.caber(70); }
          const x = M + (i % 2) * (w + gap);
          fio(x, k.y, x + w, k.y, COR.tinta, .8);
          fonte(CORPO, 9.4); cor(COR.tinta); doc.text(p.nome, x, k.y + 15);
          if (p.papel) { fonte(CORPO, 7.6); cor(COR.fraco); doc.text(p.papel, x, k.y + 27); }
        });
        k.y += 50;
      },
      // rodapé da última página e números de página (só depois de saber o total)
      finalizar() {
        rodape();
        const total = doc.getNumberOfPages(), modelo = info.paginaTexto || (en ? 'Page {a} of {b}' : 'Página {a} de {b}');
        for (let p = 1; p <= total; p++) {
          doc.setPage(p); fonte(CORPO, 7.5); cor(COR.fraco);
          doc.text(modelo.replace('{a}', p).replace('{b}', total), W - M, H - 26, { align: 'right' });
        }
        return doc;
      },
    };
    return k;
  }

  window.PDFMarca = { COR, FONTES, carregarJsPdf, carregarFontes, criar };
})();
