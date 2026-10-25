// Cookie consent + Google Analytics 4 (G-WFCFTZ1NSY).
//
// GA is never downloaded until the visitor clicks "Aceitar". The choice is
// kept in localStorage; [data-abrir-consentimento] buttons (footer, cookie
// policy) bring the banner back so it can be changed at any time.
//
// Events carry only where the click happened (origem) and the page — never
// what was typed into a form. window.svTrack is a no-op without consent.
(function () {
  var GA_ID = 'G-WFCFTZ1NSY';
  var CHAVE = 'sv-consentimento';

  function lerEscolha() {
    try { return localStorage.getItem(CHAVE); } catch (erro) { return null; }
  }
  function salvarEscolha(valor) {
    try { localStorage.setItem(CHAVE, valor); } catch (erro) { /* modo privado: vale só nesta visita */ }
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  });

  var gaCarregado = false;
  var consentido = false;

  function ativarAnalytics() {
    consentido = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (gaCarregado) { return; }
    gaCarregado = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);
    gtag('js', new Date());
    // Statistics only: no Google signals or ad personalisation, matching
    // what the cookie policy promises.
    gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  }

  function desativarAnalytics() {
    consentido = false;
    gtag('consent', 'update', { analytics_storage: 'denied' });
    // Apaga os cookies que o GA já tenha gravado (_ga, _ga_XXXX).
    document.cookie.split(';').forEach(function (par) {
      var nome = par.split('=')[0].trim();
      if (nome.indexOf('_ga') === 0) {
        var dominio = location.hostname.replace(/^www\./, '');
        document.cookie = nome + '=; Max-Age=0; path=/';
        document.cookie = nome + '=; Max-Age=0; path=/; domain=.' + dominio;
      }
    });
  }

  window.svTrack = function (evento, params) {
    if (!consentido) { return; }
    params = params || {};
    params.pagina = location.pathname.replace(/^\//, '') || 'index.html';
    gtag('event', evento, params);
  };

  // Banner -------------------------------------------------------------------
  var banner = null;

  function fecharBanner() {
    if (banner) { banner.hidden = true; }
  }

  function abrirBanner(moverFoco) {
    if (!banner) {
      banner = document.createElement('section');
      banner.className = 'cookie-banner';
      banner.setAttribute('aria-label', 'Aviso de cookies');
      banner.innerHTML =
        '<p class="cookie-texto">Usamos cookies de estatística (Google Analytics) para entender como o site é usado e melhorar o atendimento. ' +
        'Nada é ativado sem a sua permissão. <a href="politica-de-cookies.html">Saiba mais</a>.</p>' +
        '<div class="cookie-acoes">' +
        '<button type="button" class="btn btn-outline btn-sm" data-cookie="recusado">Recusar</button>' +
        '<button type="button" class="btn btn-primary btn-sm" data-cookie="aceito">Aceitar</button>' +
        '</div>';
      banner.addEventListener('click', function (event) {
        var botao = event.target.closest('[data-cookie]');
        if (!botao) { return; }
        var valor = botao.getAttribute('data-cookie');
        salvarEscolha(valor);
        if (valor === 'aceito') { ativarAnalytics(); } else { desativarAnalytics(); }
        fecharBanner();
      });
      document.body.appendChild(banner);
    }
    banner.hidden = false;
    if (moverFoco) { banner.querySelector('[data-cookie="aceito"]').focus(); }
  }

  var escolha = lerEscolha();
  if (escolha === 'aceito') { ativarAnalytics(); }

  document.addEventListener('DOMContentLoaded', function () {
    if (escolha !== 'aceito' && escolha !== 'recusado') { abrirBanner(false); }

    // Preferences buttons (footer, cookie policy).
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-abrir-consentimento]')) { abrirBanner(true); }
    });

    // Conversion events ------------------------------------------------------
    function origemDe(el) {
      if (el.closest('.whatsapp-float')) { return 'flutuante'; }
      if (el.closest('.topbar')) { return 'topbar'; }
      if (el.closest('.header')) { return 'header'; }
      if (el.closest('.hero')) { return 'hero'; }
      if (el.closest('.cta-banner')) { return 'banner'; }
      if (el.closest('.category-card')) { return 'servicos'; }
      if (el.closest('.svc-grid')) { return 'cards_home'; }
      if (el.closest('.quote-aside')) { return 'depoimentos'; }
      if (el.closest('dialog')) { return 'modal_' + el.closest('dialog').id; }
      if (el.closest('footer')) { return 'rodape'; }
      return 'pagina';
    }

    // Capture phase: main.js stops the default on the dialog triggers, and
    // the click must still be counted.
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a, button');
      if (!link) { return; }
      var origem = origemDe(link);
      var href = link.getAttribute('href') || '';

      if (link.matches('[data-abre-agendar], [data-abre-consulta], [data-abre-exame]')) {
        window.svTrack('agendar_click', {
          origem: origem,
          tipo: link.getAttribute('data-tipo') || (link.hasAttribute('data-abre-exame') ? 'exame' : link.hasAttribute('data-abre-consulta') ? 'consulta' : 'escolha')
        });
      } else if (href.indexOf('api.whatsapp.com') !== -1) {
        window.svTrack('whatsapp_open', { origem: origem });
      } else if (href.indexOf('tel:') === 0) {
        window.svTrack('tel_click', { origem: origem });
      } else if (href.indexOf('mailto:') === 0) {
        window.svTrack('email_click', { origem: origem });
      }
    }, true);

    document.addEventListener('submit', function (event) {
      var nomes = { contatoForm: 'contato', formConsulta: 'consulta', formExame: 'exame' };
      var formulario = nomes[event.target.id];
      if (!formulario) { return; }
      window.svTrack('form_submit', { formulario: formulario });
      window.svTrack('whatsapp_open', { origem: 'formulario_' + formulario });
    });
  });
})();
