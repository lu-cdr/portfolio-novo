document.addEventListener('DOMContentLoaded', function () {
  var hamburger = document.getElementById('hamburgerBtn');
  var menu = document.getElementById('mobileMenu');
  if (hamburger && menu) {
    var definirMenu = function (aberto) {
      menu.classList.toggle('open', aberto);
      hamburger.classList.toggle('active', aberto);
      hamburger.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      hamburger.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    };
    hamburger.addEventListener('click', function () {
      definirMenu(!menu.classList.contains('open'));
    });
    // Esc and a tap anywhere outside the header close it; Esc also hands
    // focus back to the button so keyboard users are not left stranded.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('open')) {
        definirMenu(false);
        hamburger.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (menu.classList.contains('open') && !event.target.closest('.header')) { definirMenu(false); }
    });
  }

  // Header shadow on scroll
  var header = document.querySelector('.header');
  if (header) {
    var toggleHeaderShadow = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    toggleHeaderShadow();
    window.addEventListener('scroll', toggleHeaderShadow, { passive: true });
  }

  // Floating WhatsApp button (present on every page)
  var whatsapp = document.createElement('a');
  whatsapp.href = 'https://api.whatsapp.com/send/?phone=5513988055801';
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener';
  whatsapp.className = 'whatsapp-float';
  whatsapp.setAttribute('aria-label', 'Agendar ou tirar uma dúvida no WhatsApp');
  // Same entry point as every other 'Agendar' button: the choice dialog, which
  // also offers a plain chat. The href stays as the no-JS fallback.
  whatsapp.setAttribute('data-abre-agendar', '');
  whatsapp.innerHTML = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.81 14.07c-.24.68-1.4 1.32-1.93 1.4-.51.08-1.15.11-1.86-.12-.43-.13-.97-.31-1.68-.6-2.95-1.28-4.87-4.24-5.02-4.44-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.6-.37.79-.37h.57c.18 0 .43-.07.67.51.24.59.83 2.03.9 2.18.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.38 1.47.3.15.47.12.65-.08.18-.2.76-.88.96-1.18.2-.3.4-.25.67-.15.27.1 1.71.81 2 .96.29.15.49.22.56.34.07.13.07.75-.17 1.43z"/></svg>';
  document.body.appendChild(whatsapp);

  // Modal dialogs. Each trigger stays a real link, so without <dialog>
  // support — or without JS at all — clicking it simply follows its href:
  // the contact page, or WhatsApp. The dialog is an enhancement on top.
  // Shared across dialogs on purpose. One dialog can open another — the
  // "Agendar consulta" option hands off to the form — and the trigger that
  // did it is inside a dialog that has since closed, so it is hidden and
  // cannot take focus. Only a trigger out on the page is worth returning to.
  var gatilhoDeOrigem = null;

  function ligarModal(idDialog, seletorGatilho) {
    var dialog = document.getElementById(idDialog);
    if (!dialog || typeof dialog.showModal !== 'function') { return; }

    Array.prototype.forEach.call(
      document.querySelectorAll(seletorGatilho),
      function (gatilho) {
        gatilho.addEventListener('click', function (event) {
          event.preventDefault();
          if (!this.closest('dialog')) { gatilhoDeOrigem = this; }
          // A trigger tied to one service (servicos.html) pre-selects it, and
          // the change event re-runs rules such as the no-Friday exams.
          var tipo = this.getAttribute('data-tipo');
          var campoTipo = dialog.querySelector('select[name="tipo"]');
          if (tipo && campoTipo) {
            campoTipo.value = tipo;
            campoTipo.dispatchEvent(new Event('change'));
          }
          dialog.showModal();
        });
      }
    );

    dialog.addEventListener('close', function () {
      // Another dialog may be taking over; only restore once none is left.
      if (gatilhoDeOrigem && !document.querySelector('dialog[open]')) {
        gatilhoDeOrigem.focus();
      }
    });

    Array.prototype.forEach.call(
      dialog.querySelectorAll('[data-fecha-modal]'),
      function (botao) {
        botao.addEventListener('click', function () { dialog.close(); });
      }
    );

    // A click that lands on the dialog itself fell outside the card.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { dialog.close(); }
    });

    // Belt and braces on Escape. showModal() is supposed to handle it, but
    // some embedded webviews swallow the key's default action — the keydown
    // arrives and the dialog stays open. Closing here is a no-op when the
    // browser already did it.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && dialog.open) { dialog.close(); }
    });

    // Picking an option navigates away or opens an app; close behind it so
    // the page is not left with the dialog still up on return.
    Array.prototype.forEach.call(
      dialog.querySelectorAll('.modal-opcao'),
      function (opcao) {
        opcao.addEventListener('click', function () { dialog.close(); });
      }
    );
  }

  ligarModal('modalContato', '[data-abre-contato]');
  ligarModal('modalAgendar', '[data-abre-agendar]');
  ligarModal('modalConsulta', '[data-abre-consulta]');
  ligarModal('modalExame', '[data-abre-exame]');

  // Both scheduling forms compose their WhatsApp message the same way: an
  // opening line, the name, the chosen item, and the preferred day. Only the
  // consultation asks for a period, so that line is optional. Each runs after
  // the browser has accepted the required fields.
  function ligarFormulario(idForm, idDialog, abertura, rotulo, comPeriodo) {
    var form = document.getElementById(idForm);
    if (!form) { return; }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var escolhido = function (nome) {
        var marcado = form.querySelector('input[name="' + nome + '"]:checked');
        return marcado ? marcado.value : '';
      };

      var linhas = [abertura, ''];
      linhas.push('Nome: ' + form.elements.nome.value.trim());
      linhas.push(rotulo + ': ' + form.elements.tipo.value);
      linhas.push('Preferência: ' + escolhido('dia') +
                  (comPeriodo ? ', ' + escolhido('periodo') : ''));

      var url = 'https://api.whatsapp.com/send/?phone=5513988055801&text=' +
                encodeURIComponent(linhas.join('\n'));

      window.open(url, '_blank', 'noopener');

      var dialog = document.getElementById(idDialog);
      if (dialog && dialog.open) { dialog.close(); }
    });
  }

  ligarFormulario('formConsulta', 'modalConsulta',
                  'Olá! Gostaria de agendar uma consulta.', 'Tipo', true);
  ligarFormulario('formExame', 'modalExame',
                  'Olá! Gostaria de agendar um exame.', 'Exame', false);

  // MAPA 24h, Holter 24h e HolterMAPA 24h ficam colocados por 24h e precisam
  // ser retirados no dia seguinte — por isso não saem numa sexta, o que
  // exigiria retirada num sábado com a clínica fechada. O pill de sexta
  // desativa (e desmarca, se estava marcado) quando um desses é escolhido.
  var exameTipo = document.getElementById('exameTipo');
  var examesSemSexta = ['Holter 24h', 'MAPA 24h', 'HolterMAPA 24h', 'Polissonografia'];
  if (exameTipo) {
    var pillSexta = exameTipo.form.querySelector('input[name="dia"][value="sexta-feira"]');
    if (pillSexta) {
      var atualizarSexta = function () {
        var restrito = examesSemSexta.indexOf(exameTipo.value) !== -1;
        pillSexta.disabled = restrito;
        if (restrito && pillSexta.checked) { pillSexta.checked = false; }
      };
      exameTipo.addEventListener('change', atualizarSexta);
      atualizarSexta();
    }
  }

  // Brazilian phone mask: (13) 4109-1206 for landlines, (13) 98805-5801 for
  // mobiles. The split moves to 5+4 only once an eleventh digit arrives, so
  // a number is never shown in a shape it cannot end up in.
  var campoTelefone = document.getElementById('tel');
  if (campoTelefone) {
    var formatarTelefone = function (valor) {
      var digitos = valor.replace(/\D/g, '').slice(0, 11);
      if (!digitos) { return ''; }
      if (digitos.length <= 2) { return '(' + digitos; }

      var ddd = digitos.slice(0, 2);
      var resto = digitos.slice(2);
      if (resto.length <= 4) { return '(' + ddd + ') ' + resto; }

      var corte = resto.length > 8 ? 5 : 4;
      var inicio = resto.slice(0, corte);
      var fim = resto.slice(corte);
      return '(' + ddd + ') ' + inicio + (fim ? '-' + fim : '');
    };

    campoTelefone.addEventListener('input', function () {
      // Count the digits before the caret, reformat, then put the caret back
      // after that same digit — otherwise editing mid-number throws it to
      // the end on every keystroke.
      var caret = this.selectionStart;
      var digitosAntes = this.value.slice(0, caret).replace(/\D/g, '').length;
      var formatado = formatarTelefone(this.value);
      this.value = formatado;

      var posicao = 0;
      var contados = 0;
      while (posicao < formatado.length && contados < digitosAntes) {
        if (/\d/.test(formatado.charAt(posicao))) { contados++; }
        posicao++;
      }
      try { this.setSelectionRange(posicao, posicao); } catch (erro) { /* noop */ }
    });
  }

  // Contact form -> WhatsApp with the message already written (contato.html).
  // The form keeps its native validation: this runs only after the browser
  // has accepted the required fields. Without JS the form still submits to
  // the wa.me endpoint, which opens the chat without the prefilled text.
  var contatoForm = document.getElementById('contatoForm');
  if (contatoForm) {
    contatoForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var valor = function (id) {
        var campo = document.getElementById(id);
        return campo ? campo.value.trim() : '';
      };

      var linhas = ['Olá! Vim pelo site da Support Vida.', ''];
      linhas.push('Nome: ' + valor('nome'));
      if (valor('tel')) { linhas.push('Telefone: ' + valor('tel')); }
      if (valor('email')) { linhas.push('E-mail: ' + valor('email')); }
      linhas.push('', valor('msg'));

      var url = 'https://api.whatsapp.com/send/?phone=5513988055801&text=' +
                encodeURIComponent(linhas.join('\n'));

      // Also records the lead in the Wix CRM (Wix Forms), independent of the
      // WhatsApp handoff below. Fire-and-forget: __wixSubmitContato already
      // catches its own errors, so a failure here never blocks WhatsApp.
      if (window.__wixSubmitContato) {
        var valoresWix = { first_name_sv01: valor('nome'), message_sv01: valor('msg') };
        if (valor('tel')) { valoresWix.phone_sv01 = '+55' + valor('tel').replace(/\D/g, ''); }
        if (valor('email')) { valoresWix.email_sv01 = valor('email'); }
        window.__wixSubmitContato(valoresWix);
      }

      window.open(url, '_blank', 'noopener');
    });
  }

  // Facility gallery lightbox: tap/click a photo to open it full-screen,
  // then move between photos with the on-screen arrows, the keyboard arrows,
  // or by dragging/swiping the image itself.
  var galeria = document.querySelector('.gallery');
  if (galeria) {
    var itensGaleria = Array.prototype.slice.call(galeria.querySelectorAll('.gallery-item'));
    var dialogGaleria = document.getElementById('modalGaleria');
    var trilhaGaleria = document.getElementById('lightboxTrack');
    var contadorGaleria = document.getElementById('lightboxContador');
    var botaoAnterior = dialogGaleria ? dialogGaleria.querySelector('.lightbox-prev') : null;
    var botaoProximo = dialogGaleria ? dialogGaleria.querySelector('.lightbox-next') : null;

    if (dialogGaleria && trilhaGaleria && itensGaleria.length && typeof dialogGaleria.showModal === 'function') {
      var indiceAtual = 0;
      var ultimoGatilho = null;

      var posicionarTrilha = function (comAnimacao) {
        trilhaGaleria.classList.toggle('sem-transicao', !comAnimacao);
        trilhaGaleria.style.transform = 'translateX(' + (-indiceAtual * 100) + '%)';
        if (botaoAnterior) { botaoAnterior.disabled = indiceAtual === 0; }
        if (botaoProximo) { botaoProximo.disabled = indiceAtual === itensGaleria.length - 1; }
        if (contadorGaleria) { contadorGaleria.textContent = (indiceAtual + 1) + ' / ' + itensGaleria.length; }
      };

      var irPara = function (indice) {
        indiceAtual = Math.max(0, Math.min(itensGaleria.length - 1, indice));
        posicionarTrilha(true);
      };

      // The slide track is built straight from the grid's own images, so
      // captions and order never drift out of sync with what is on the page.
      itensGaleria.forEach(function (item, indice) {
        var img = item.querySelector('img');
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', 'Ampliar foto: ' + (img ? img.alt : ''));

        var slide = document.createElement('div');
        slide.className = 'lightbox-slide';
        var slideImg = document.createElement('img');
        // The tile shows a small srcset candidate; the lightbox wants the largest.
        slideImg.src = img.getAttribute('data-full') || img.currentSrc || img.src;
        slideImg.alt = img.alt;
        slideImg.draggable = false;
        slide.appendChild(slideImg);
        trilhaGaleria.appendChild(slide);

        var abrir = function () {
          indiceAtual = indice;
          ultimoGatilho = item;
          posicionarTrilha(false);
          dialogGaleria.showModal();
        };
        item.addEventListener('click', abrir);
        item.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            abrir();
          }
        });
      });

      if (botaoAnterior) { botaoAnterior.addEventListener('click', function () { irPara(indiceAtual - 1); }); }
      if (botaoProximo) { botaoProximo.addEventListener('click', function () { irPara(indiceAtual + 1); }); }

      dialogGaleria.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowLeft') { irPara(indiceAtual - 1); }
        if (event.key === 'ArrowRight') { irPara(indiceAtual + 1); }
      });

      Array.prototype.forEach.call(dialogGaleria.querySelectorAll('[data-fecha-modal]'), function (botao) {
        botao.addEventListener('click', function () { dialogGaleria.close(); });
      });
      dialogGaleria.addEventListener('click', function (event) {
        if (event.target === dialogGaleria) { dialogGaleria.close(); }
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && dialogGaleria.open) { dialogGaleria.close(); }
      });
      dialogGaleria.addEventListener('close', function () {
        trilhaGaleria.classList.remove('sem-transicao');
        if (ultimoGatilho) { ultimoGatilho.focus(); }
      });

      // Drag/swipe: the track follows the finger 1:1 while dragging, then
      // either completes the move to the next/previous slide or springs
      // back, based on how far past a fifth of the stage width it went.
      var arrastando = false;
      var inicioX = 0;
      var deslocamentoInicial = 0;
      var larguraPalco = 0;

      var inicioArraste = function (x) {
        arrastando = true;
        inicioX = x;
        larguraPalco = trilhaGaleria.parentElement.clientWidth || 1;
        deslocamentoInicial = -indiceAtual * larguraPalco;
        trilhaGaleria.classList.add('sem-transicao');
      };
      var moverArraste = function (x) {
        if (!arrastando) { return; }
        trilhaGaleria.style.transform = 'translateX(' + (deslocamentoInicial + (x - inicioX)) + 'px)';
      };
      var fimArraste = function (x) {
        if (!arrastando) { return; }
        arrastando = false;
        var delta = x - inicioX;
        if (Math.abs(delta) > larguraPalco / 5) {
          irPara(indiceAtual + (delta < 0 ? 1 : -1));
        } else {
          posicionarTrilha(true);
        }
      };

      trilhaGaleria.addEventListener('touchstart', function (event) { inicioArraste(event.touches[0].clientX); }, { passive: true });
      trilhaGaleria.addEventListener('touchmove', function (event) { moverArraste(event.touches[0].clientX); }, { passive: true });
      trilhaGaleria.addEventListener('touchend', function (event) { fimArraste(event.changedTouches[0].clientX); });

      trilhaGaleria.addEventListener('mousedown', function (event) {
        event.preventDefault();
        inicioArraste(event.clientX);
        var mover = function (e) { moverArraste(e.clientX); };
        var soltar = function (e) {
          fimArraste(e.clientX);
          document.removeEventListener('mousemove', mover);
          document.removeEventListener('mouseup', soltar);
        };
        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);
      });
    }
  }

  // Services page — category cards that expand into their sub-services
  // (servicos.html). Toggled via aria-expanded + the native `hidden`
  // attribute, so a panel is genuinely removed from the a11y tree when
  // collapsed rather than just visually clipped. Each category is
  // independent — opening one does not close the others.
  Array.prototype.forEach.call(document.querySelectorAll('.category-toggle'), function (toggle) {
    toggle.addEventListener('click', function () {
      var estaAberto = toggle.getAttribute('aria-expanded') === 'true';
      var painel = document.getElementById(toggle.getAttribute('aria-controls'));
      toggle.setAttribute('aria-expanded', String(!estaAberto));
      if (painel) { painel.hidden = estaAberto; }
      var card = toggle.closest('.category-card');
      if (card) { card.classList.toggle('is-open', !estaAberto); }
    });
  });

  // "Como se preparar": the Agendar button is centred against the closed card,
  // so opening the list would drag it down to the new middle. The summary's
  // click runs before the details toggles, so its current spot can be read
  // and pinned there while open. The stacked mobile layout has nothing to pin.
  document.querySelectorAll('.service-row .exam-prep summary').forEach(function (summary) {
    var detalhes = summary.parentElement;
    var linha = detalhes.closest('.service-row');
    var botao = linha.querySelector('.service-cta');
    if (!botao) { return; }
    summary.addEventListener('click', function () {
      if (detalhes.open) {
        botao.style.alignSelf = '';
        botao.style.marginTop = '';
        return;
      }
      if (getComputedStyle(linha).flexDirection === 'column') { return; }
      var estilo = getComputedStyle(linha);
      var topoConteudo = linha.getBoundingClientRect().top + parseFloat(estilo.borderTopWidth) + parseFloat(estilo.paddingTop);
      botao.style.marginTop = (botao.getBoundingClientRect().top - topoConteudo) + 'px';
      botao.style.alignSelf = 'flex-start';
    });
  });

  // Scroll-reveal for below-the-fold content
  var revealSelectors = [
    '.pillar', '.svc-card', '.about-photo', '.about-text', '.benefit',
    '.quote', '.quote-aside', '.cta-banner', '.location-col', '.bio-photo', '.bio-text',
    '.title-row', '.rows-wrap .row', '.sub-rows .row', '.category-card', '.contact-col', '.gallery-item'
  ];
  var revealEls = document.querySelectorAll(revealSelectors.join(', '));

  if (revealEls.length && 'IntersectionObserver' in window) {
    revealEls.forEach(function (el) { el.classList.add('reveal'); });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { observer.observe(el); });
  }
});
