/* Cole este arquivo (ou o conteúdo dele numa <script>) nos sites dos projetos que estão
   em outro domínio. Sem ele, o navegador não deixa o portfólio ler nem mexer na rolagem
   do site dentro da moldura, e desktop e celular rolam cada um por si.
   Só age quando o site está dentro de um iframe; aberto direto, não faz nada. */
(function () {
  if (window.parent === window) return;
  var eco = 0;
  function maximo() { return document.documentElement.scrollHeight - innerHeight; }
  addEventListener("scroll", function () {
    if (performance.now() - eco < 150) return; // rolagem pedida pelo portfólio: não devolve
    var m = maximo();
    parent.postMessage({ tipo: "lg-rolagem", p: m > 0 ? scrollY / m : 0 }, "*");
  }, { passive: true });
  addEventListener("message", function (e) {
    if (!e.data || e.data.tipo !== "lg-rolar") return;
    eco = performance.now();
    scrollTo({ top: e.data.p * maximo(), behavior: "instant" });
  });
})();
