/* Conteúdo do site (textos PT, en = só o que muda em inglês) e configuração do simulador.
   Compartilhado pelas três páginas. Para mudar um texto ou um preço, edite aqui. */
window.ESTADO = {
  "lang": "pt",
  "nome": "Lucas Giovanni",
  "oficio": "design · sites · motion",
  "meta": {
    "titulo": "Lucas Giovanni — design, sites e motion",
    "descricao": "Design, sites e motion para negócios que querem comunicar à altura do que entregam. Portfólio de Lucas Giovanni."
  },
  "cena": {
    "tema": "auto",
    "ritmo": {
      "slide": 1.05,
      "frase": 7.6,
      "troca": 0.65,
      "intro": 2.2,
      "agua": 1
    },
    "fundo": {
      "caustica": 1,
      "ondas": 1,
      "gotas": 1,
      "mouse": 1,
      "reflexo": 1,
      "cores": {
        "areia": "#fff9ed",
        "veu": "#cceefb",
        "mar": [
          "#070b16",
          "#121b30"
        ],
        "causticaClaro": "#f7fcff",
        "causticaEscuro": "#80b8ff"
      }
    }
  },
  "menu": [
    {
      "rotulo": "Trabalhos",
      "href": "trabalhos.html",
      "pagina": "trabalhos"
    },
    {
      "rotulo": "Sobre",
      "href": "index.html#sobre",
      "pagina": "inicio"
    },
    {
      "rotulo": "Orçamento",
      "href": "orcamento.html",
      "pagina": "orcamento"
    },
    {
      "rotulo": "Contato",
      "href": "#contato"
    }
  ],
  "hero": {
    "frases": [
      {
        "texto": "Sites que inspiram confiança",
        "projeto": "supportvida"
      },
      {
        "texto": "Aplicativos com identidade própria",
        "projeto": "forja"
      },
      {
        "texto": "Identidades visuais com personalidade",
        "projeto": "pingado"
      },
      {
        "texto": "Materiais editoriais claros e bem desenhados",
        "projeto": "cardapio"
      },
      {
        "texto": "Landing pages que geram agendamentos",
        "projeto": "vigomes"
      },
      {
        "texto": "Presença digital à altura do seu trabalho",
        "projeto": "aar"
      }
    ],
    "tagline": "Design, sites e motion para negócios que querem comunicar à altura do que entregam.",
    "dica": "role para conhecer",
    "dicaToque": "deslize para conhecer",
    "ctas": {
      "conversar": "Vamos conversar",
      "trabalhos": "Ver trabalhos",
      "simular": "Simular investimento"
    }
  },
  "trabalhos": {
    "titulo": "Trabalhos",
    "sub": "{n} projetos de 2026, do site institucional ao aplicativo, entre clientes reais e estudos de marca.",
    "fecho": {
      "titulo": "Gostou do que viu?",
      "sub": "Conte o seu projeto ou simule uma faixa de investimento em 30 segundos."
    }
  },
  "projetos": [
    {
      "id": "supportvida",
      "titulo": "Support Vida",
      "cliente": "Cliente real · clínica de cardiologia",
      "ano": "2026",
      "tags": "Site institucional",
      "resumo": "Site institucional que apresenta o cardiologista e explica cada exame em página própria, levando o paciente direto ao agendamento pelo WhatsApp.",
      "entregas": [
        "4 páginas principais",
        "Página para cada exame",
        "Agendamento pelo WhatsApp",
        "Páginas legais da área da saúde"
      ],
      "tela": {
        "tipo": "img",
        "src": "img/trabalhos/supportvida/capa.webp",
        "rolagem": "img/trabalhos/supportvida/rolagem.webp"
      },
      "galeria": [
        "img/trabalhos/supportvida/home-inteira.webp",
        "img/trabalhos/supportvida/servicos.webp",
        "img/trabalhos/supportvida/celular.webp"
      ],
      "dispositivo": "notebook"
    },
    {
      "id": "forja",
      "titulo": "Forja",
      "cliente": "Projeto próprio",
      "ano": "2026",
      "tags": "App, pixel art, vídeo",
      "resumo": "Aplicativo de treino com narrativa de jogo: cada série gera XP para um ferreiro em pixel art, que evolui ao longo de 5 níveis.",
      "entregas": [
        "App instalável (Android e iPhone)",
        "Personagem com 5 níveis",
        "Vídeo de apresentação"
      ],
      "tela": {
        "tipo": "telas",
        "fundo": "#17131a",
        "srcs": [
          "img/trabalhos/forja/01-boas-vindas.webp",
          "img/trabalhos/forja/02-hoje.webp",
          "img/trabalhos/forja/08-treino.webp",
          "img/trabalhos/forja/10-recompensa.webp",
          "img/trabalhos/forja/03-forja-personagem.webp",
          "img/trabalhos/forja/04-progresso.webp"
        ]
      },
      "galeria": [
        "img/trabalhos/forja/03-forja-personagem.webp",
        "img/trabalhos/forja/04-progresso.webp",
        "media/forja-promo.mp4"
      ],
      "dispositivo": "celular"
    },
    {
      "id": "pingado",
      "titulo": "Pingado",
      "cliente": "Projeto conceito · café de rua em São Paulo",
      "ano": "2026",
      "tags": "Identidade visual, landing page",
      "resumo": "Identidade visual e site para uma janela de café de rua: wordmark com a gota de leite no pingo do i, selos, lambe-lambe e merch.",
      "entregas": [
        "Wordmark e selo do copo americano",
        "Paleta asfalto, giz, ácido e chiclete",
        "Landing page bilíngue (PT/EN)",
        "Merch e embalagens"
      ],
      "tela": {
        "tipo": "img",
        "src": "img/trabalhos/pingado/capa.webp",
        "rolagem": "img/trabalhos/pingado/rolagem.webp"
      },
      "galeria": [
        "img/trabalhos/pingado/pagina-01.webp",
        "img/trabalhos/pingado/pagina-02.webp",
        "img/trabalhos/pingado/pagina-03.webp",
        "img/trabalhos/pingado/pagina-04.webp",
        "img/trabalhos/pingado/celular.webp"
      ],
      "dispositivo": "notebook",
      "acessorios": {
        "saco": "img/trabalhos/pingado/merch-saco.webp",
        "copo": "img/trabalhos/pingado/merch-copo.webp"
      }
    },
    {
      "id": "cardapio",
      "titulo": "Cardápio varfarina",
      "cliente": "Cliente real · clínica de cardiologia",
      "ano": "2026",
      "tags": "Material editorial",
      "resumo": "Guia de 20 páginas com cardápio semanal e receitas, desenhado para ajudar pacientes em uso de varfarina a manter a vitamina K estável.",
      "entregas": [
        "PDF de 20 páginas",
        "Tabela semanal de nutrientes",
        "Receitas para as três refeições"
      ],
      "tela": {
        "tipo": "livro",
        "src": "img/trabalhos/cardapio/pagina-01.webp",
        "capa": "#c8161d",
        "papel": "#efe9df",
        "paginas": [
          "img/trabalhos/cardapio/livro-01.webp",
          "img/trabalhos/cardapio/livro-02.webp",
          "img/trabalhos/cardapio/livro-03.webp",
          "img/trabalhos/cardapio/livro-04.webp",
          "img/trabalhos/cardapio/livro-05.webp",
          "img/trabalhos/cardapio/livro-06.webp",
          "img/trabalhos/cardapio/livro-07.webp",
          "img/trabalhos/cardapio/livro-08.webp",
          "img/trabalhos/cardapio/livro-09.webp",
          "img/trabalhos/cardapio/livro-10.webp",
          "img/trabalhos/cardapio/livro-11.webp",
          "img/trabalhos/cardapio/livro-12.webp",
          "img/trabalhos/cardapio/livro-13.webp",
          "img/trabalhos/cardapio/livro-14.webp",
          "img/trabalhos/cardapio/livro-15.webp",
          "img/trabalhos/cardapio/livro-16.webp",
          "img/trabalhos/cardapio/livro-17.webp",
          "img/trabalhos/cardapio/livro-18.webp",
          "img/trabalhos/cardapio/livro-19.webp",
          "img/trabalhos/cardapio/livro-20.webp"
        ],
        "paginasLeve": "-leve"
      },
      "galeria": [
        "img/trabalhos/cardapio/pagina-01.webp",
        "img/trabalhos/cardapio/pagina-02.webp",
        "img/trabalhos/cardapio/pagina-03.webp",
        "img/trabalhos/cardapio/pagina-04.webp"
      ],
      "dispositivo": "livro"
    },
    {
      "id": "vigomes",
      "titulo": "Vi Gomes Nails",
      "cliente": "Cliente real · studio de manicure em Itanhaém",
      "ano": "2026",
      "tags": "Identidade visual, landing page",
      "resumo": "Identidade visual e landing page para uma manicure: serviços, galeria dos trabalhos, horário de atendimento em tempo real e agendamento direto pelo WhatsApp.",
      "entregas": [
        "Monograma V e paleta rosé",
        "Landing page com galeria",
        "Status aberto/fechado ao vivo",
        "Mapa e agendamento pelo WhatsApp"
      ],
      "tela": {
        "tipo": "img",
        "src": "img/trabalhos/vigomes/capa.webp",
        "rolagem": "img/trabalhos/vigomes/rolagem.webp"
      },
      "galeria": [
        "img/trabalhos/vigomes/pagina-01.webp",
        "img/trabalhos/vigomes/pagina-02.webp",
        "img/trabalhos/vigomes/pagina-03.webp",
        "img/trabalhos/vigomes/pagina-04.webp",
        "img/trabalhos/vigomes/celular.webp"
      ],
      "dispositivo": "notebook"
    },
    {
      "id": "aar",
      "titulo": "AAR Advocacia",
      "cliente": "Cliente real · escritório de advocacia",
      "ano": "2026",
      "tags": "Site institucional, blog",
      "resumo": "Site de 17 páginas para uma advogada, com uma página por área de atuação e um blog que responde às dúvidas mais comuns dos clientes.",
      "entregas": [
        "17 páginas",
        "Páginas por área de atuação",
        "Blog com os primeiros artigos",
        "Formulário e WhatsApp"
      ],
      "tela": {
        "tipo": "img",
        "src": "img/trabalhos/aar/capa.webp",
        "rolagem": "img/trabalhos/aar/rolagem.webp"
      },
      "galeria": [
        "img/trabalhos/aar/home-inteira.webp",
        "img/trabalhos/aar/areas.webp",
        "img/trabalhos/aar/blog.webp",
        "img/trabalhos/aar/celular.webp"
      ],
      "dispositivo": "notebook"
    }
  ],
  "sobre": {
    "titulo": "Sobre mim",
    "foto": "img/sobre/lucas.webp",
    "fotoAlt": "Retrato de Lucas Giovanni sorrindo, de camiseta preta, contra um fundo azul-escuro",
    "fotoVazia": "Espaço para a foto (horizontal, 3:2)",
    "textos": [
      "Comecei em 2019, criando um site para o lugar onde trabalhava. O que era só uma forma de aprender acabou me levando cada vez mais fundo no mundo do design e do desenvolvimento web.",
      "Hoje, divido meu tempo entre código, design gráfico e motion. Gosto de descobrir até onde posso levar uma ideia, misturando estética, interatividade e tecnologia para criar algo que realmente se destaque."
    ],
    "dados": [
      {
        "rotulo": "Morando em",
        "valor": "Itanhaém, Brasil"
      },
      {
        "rotulo": "Atuação",
        "valor": "Brasil e exterior, remoto"
      },
      {
        "rotulo": "Idiomas",
        "valor": "Português e inglês"
      }
    ],
    "habilidadesTitulo": "Habilidades"
  },
  "servicos": {
    "titulo": "Como posso ajudar",
    "itens": [
      {
        "nome": "Sites & experiências digitais",
        "inclui": "Crio sites, landing pages e portfólios responsivos, com interfaces cuidadosas, interações personalizadas e desempenho otimizado para diferentes dispositivos.",
        "prazo": "1 a 3 semanas"
      },
      {
        "nome": "Identidade visual & design",
        "inclui": "Desenvolvo identidades visuais e peças gráficas que traduzem a essência de cada marca em sistemas visuais consistentes, reconhecíveis e versáteis.",
        "prazo": "2 a 4 semanas"
      },
      {
        "nome": "Motion & edição de vídeo",
        "inclui": "Crio animações, motion graphics e vídeos com composição, elementos 3D e tratamento de cor, combinando ritmo e linguagem visual para dar vida às ideias.",
        "prazo": "1 semana"
      },
      {
        "nome": "3D & experiências interativas",
        "inclui": "Exploro Blender e tecnologias web para criar cenas 3D, efeitos visuais e interações que conectam design e código em experiências digitais imersivas.",
        "prazo": "Conforme o projeto"
      }
    ]
  },
  "contato": {
    "titulo": "Vamos conversar sobre o seu projeto.",
    "sub": "Conte um pouco sobre o que você tem em mente. Retorno em até um dia útil com perguntas, próximos passos e uma proposta sob medida.",
    "direto": "Prefere falar diretamente? Escreva para",
    "email": "lucasgiovanni3@gmail.com",
    "campos": {
      "nome": "Nome",
      "email": "E-mail",
      "precisa": "O que você precisa?",
      "projeto": "Conte um pouco sobre o projeto"
    },
    "opcoes": [
      "Site",
      "Landing page",
      "Identidade visual",
      "Motion & vídeo",
      "Aplicativo",
      "Design gráfico",
      "3D & interativo"
    ],
    "enviar": "Solicitar orçamento",
    "assunto": "Solicitação de orçamento",
    "pronto": "Copie o texto abaixo e envie para",
    "abrirEmail": "Abrir no app de e-mail",
    "copiar": "Copiar mensagem",
    "copiado": "Copiado",
    "validacao": {
      "limite": 2000,
      "opcional": "opcional",
      "nome": "Escreva seu nome.",
      "email": "Informe um e-mail válido.",
      "emailVazio": "Escreva seu e-mail.",
      "precisa": "Escolha pelo menos uma opção.",
      "contador": "{n} de {max} caracteres",
      "limiteAtingido": "Limite de {max} caracteres atingido."
    },
    "prontoTitulo": "Sua mensagem está pronta",
    "fecharDialogo": "Fechar"
  },
  "ui": {
    "menu": "Menu",
    "fechar": "Fechar",
    "verTelas": "Ver mais telas",
    "temaClaro": "Mudar para o modo claro",
    "temaEscuro": "Mudar para o modo escuro",
    "outraLingua": "EN",
    "outraLinguaNome": "Read in English"
  },
  "en": {
    "lang": "en",
    "oficio": "design · websites · motion",
    "meta": {
      "titulo": "Lucas Giovanni — design, websites and motion",
      "descricao": "Design, websites and motion for businesses that want their communication to match the quality of their work. Portfolio of Lucas Giovanni."
    },
    "menu": [
      {
        "rotulo": "Work"
      },
      {
        "rotulo": "About"
      },
      {
        "rotulo": "Estimate"
      },
      {
        "rotulo": "Contact"
      }
    ],
    "ui": {
      "menu": "Menu",
      "fechar": "Close",
      "verTelas": "See more screens",
      "temaClaro": "Switch to light mode",
      "temaEscuro": "Switch to dark mode",
      "outraLingua": "PT",
      "outraLinguaNome": "Ler em português"
    },
    "hero": {
      "frases": [
        {
          "texto": "Websites that build trust"
        },
        {
          "texto": "Apps with an identity of their own"
        },
        {
          "texto": "Brand identities with personality"
        },
        {
          "texto": "Editorial materials, clear and well designed"
        },
        {
          "texto": "Landing pages that generate bookings"
        },
        {
          "texto": "A digital presence worthy of your work"
        }
      ],
      "tagline": "Design, websites and motion for businesses that want their communication to match the quality of their work.",
      "dica": "scroll to explore",
      "dicaToque": "swipe to explore",
      "ctas": {
        "conversar": "Let's talk",
        "trabalhos": "See the work",
        "simular": "Estimate your project"
      }
    },
    "trabalhos": {
      "titulo": "Work",
      "sub": "{n} projects from 2026, from institutional websites to apps, spanning real clients and brand studies.",
      "fecho": {
        "titulo": "Like what you see?",
        "sub": "Tell me about your project or get an investment range in 30 seconds."
      }
    },
    "projetos": [
      {
        "cliente": "Real client · cardiology clinic",
        "tags": "Institutional website",
        "resumo": "An institutional website that introduces the cardiologist and explains each exam on its own page, taking patients straight to booking through WhatsApp.",
        "entregas": [
          "4 main pages",
          "A page for each exam",
          "WhatsApp booking",
          "Legal pages required for healthcare"
        ]
      },
      {
        "cliente": "Personal project",
        "tags": "App, pixel art, video",
        "resumo": "A workout app with a game narrative: every set earns XP for a pixel-art blacksmith who levels up across 5 stages.",
        "entregas": [
          "Installable app (Android and iPhone)",
          "Character with 5 levels",
          "Promo video"
        ]
      },
      {
        "cliente": "Concept project · street coffee in São Paulo",
        "tags": "Brand identity, landing page",
        "resumo": "Brand identity and website for a walk-up coffee window: a wordmark with a milk drop as the dot on the i, stamps, street posters and merch.",
        "entregas": [
          "Wordmark and coffee-glass badge",
          "Asphalt, chalk, acid and bubblegum palette",
          "Bilingual landing page (PT/EN)",
          "Merch and packaging"
        ]
      },
      {
        "titulo": "Warfarin meal guide",
        "cliente": "Real client · cardiology clinic",
        "tags": "Editorial design",
        "resumo": "A 20-page guide with a weekly menu and recipes, designed to help patients on warfarin keep their vitamin K intake steady.",
        "entregas": [
          "20-page PDF",
          "Weekly nutrient table",
          "Recipes for all three meals"
        ]
      },
      {
        "cliente": "Real client · nail studio in Itanhaém, Brazil",
        "tags": "Brand identity, landing page",
        "resumo": "Brand identity and landing page for a manicurist: services, a gallery of her work, real-time opening hours and booking straight through WhatsApp.",
        "entregas": [
          "V monogram and rosé palette",
          "Landing page with gallery",
          "Live open/closed status",
          "Map and WhatsApp booking"
        ]
      },
      {
        "cliente": "Real client · law firm",
        "tags": "Institutional website, blog",
        "resumo": "A 17-page website for a lawyer, with one page per practice area and a blog that answers clients' most common questions.",
        "entregas": [
          "17 pages",
          "Practice area pages",
          "Blog with the first articles",
          "Contact form and WhatsApp"
        ]
      }
    ],
    "sobre": {
      "titulo": "About me",
      "fotoAlt": "Portrait of Lucas Giovanni smiling, wearing a black T-shirt against a dark blue background",
      "fotoVazia": "Space for the photo (landscape, 3:2)",
      "textos": [
        "I started in 2019 by building a website for the place I worked at. What began as a way to learn pulled me deeper into the world of design and web development.",
        "These days, I split my time between code, graphic design, and motion. I like seeing how far I can take an idea, mixing aesthetics, interactivity, and technology to create something that stands out."
      ],
      "dados": [
        {
          "rotulo": "Based in",
          "valor": "Itanhaém, Brazil"
        },
        {
          "rotulo": "Working across",
          "valor": "Brazil and abroad, remotely"
        },
        {
          "rotulo": "Languages",
          "valor": "Portuguese and English"
        }
      ],
      "habilidadesTitulo": "Skills"
    },
    "servicos": {
      "titulo": "How I can help",
      "itens": [
        {
          "nome": "Websites & digital experiences",
          "inclui": "I build responsive websites, landing pages, and portfolios with thoughtful interfaces, custom interactions, and optimized performance across devices.",
          "prazo": "1 to 3 weeks"
        },
        {
          "nome": "Visual identity & design",
          "inclui": "I develop visual identities and graphic assets that translate each brand’s essence into consistent, recognizable, and versatile visual systems.",
          "prazo": "2 to 4 weeks"
        },
        {
          "nome": "Motion & video editing",
          "inclui": "I create animations, motion graphics, and videos using compositing, 3D elements, and color grading to bring ideas to life through rhythm and visual storytelling.",
          "prazo": "1 week"
        },
        {
          "nome": "3D & interactive experiences",
          "inclui": "I explore Blender and web technologies to create 3D scenes, visual effects, and interactive experiences that bring design and code together.",
          "prazo": "Depends on the project"
        }
      ]
    },
    "contato": {
      "titulo": "Let's talk about your project.",
      "sub": "Tell me a little about what you have in mind. I'll get back to you within one business day with questions, next steps, and a tailored proposal.",
      "direto": "Prefer to reach out directly? Email me at",
      "campos": {
        "nome": "Name",
        "email": "Email",
        "precisa": "What do you need?",
        "projeto": "Tell me a little about the project"
      },
      "opcoes": [
        "Website",
        "Landing page",
        "Brand identity",
        "Motion & video",
        "App",
        "Graphic design",
        "3D & interactive"
      ],
      "enviar": "Request a quote",
      "assunto": "Quote request",
      "pronto": "Copy the text below and send it to",
      "abrirEmail": "Open in email app",
      "copiar": "Copy message",
      "copiado": "Copied",
      "validacao": {
        "opcional": "optional",
        "nome": "Write your name.",
        "email": "Enter a valid email address.",
        "emailVazio": "Write your email.",
        "precisa": "Pick at least one option.",
        "contador": "{n} of {max} characters",
        "limiteAtingido": "{max}-character limit reached."
      },
      "prontoTitulo": "Your message is ready",
      "fecharDialogo": "Close"
    },
    "paginas": {
      "inicio": {
        "titulo": "Lucas Giovanni — design, websites and motion",
        "descricao": "Design, websites and motion for businesses that want their communication to match the quality of their work. Portfolio of Lucas Giovanni."
      },
      "trabalhos": {
        "titulo": "Work · Lucas Giovanni",
        "descricao": "Websites, apps, brand identities and editorial pieces from 2026, for real clients and concept projects."
      },
      "orcamento": {
        "titulo": "Estimate · Lucas Giovanni",
        "descricao": "Get an investment range for your website, app or brand identity in 30 seconds."
      }
    },
    "inicio": {
      "destaques": {
        "titulo": "Featured work",
        "link": "See all work"
      }
    },
    "orcamento": {
      "eyebrow": "Quick estimate",
      "titulo": "What does it take to bring your idea to life?",
      "sub": "Choose what your project needs and get an initial investment estimate. It’s a starting point for planning; the final proposal depends on the scope and details we define together.",
      "tipo": "What are we creating?",
      "paginas": "Number of pages or sections",
      "urgencia": "Desired timeline",
      "depois": "After launch",
      "faixa": "Estimated range",
      "prazo": "Estimated timeline: {a} to {b} weeks",
      "dica": "Select options to adjust your estimate.",
      "pdf": "Download estimate as PDF",
      "enviar": "Send this estimate",
      "verDetalhes": "See details",
      "nota": "Indicative pricing, with no obligation. The final quote depends on the scope agreed during our conversation. Amounts in US dollars.",
      "semDownload": "This browser view can't download files. Copy the estimate and paste it into your message:",
      "copiar": "Copy estimate",
      "copiado": "Copied",
      "resumo": {
        "titulo": "Estimate made with the website simulator",
        "tipo": "Project type",
        "paginas": "Pages or sections",
        "urgencia": "Desired timeline",
        "depois": "After launch",
        "faixa": "Estimated range",
        "prazo": "Expected timeline",
        "idioma": "Language",
        "nenhum": "none",
        "consulta": "on request",
        "aDefinir": "to be defined together",
        "idiomaNome": "English",
        "extras": "Items",
        "sim": "yes",
        "nao": "no"
      },
      "pdfDoc": {
        "titulo": "Project estimate",
        "rotuloDoc": "Estimate",
        "numero": "No. {n}",
        "gerada": "Generated on {data}",
        "validade": "Valid for 30 days",
        "abertura": "Thanks for simulating your project. This is a reference range built from the options you picked on the website, so you can plan with confidence before we talk.",
        "faixa": "Investment range",
        "prazo": "Estimated timeline",
        "semanas": "{a} to {b} weeks",
        "escopo": "What you picked",
        "composicao": "How the range was built",
        "base": "Base: {tipo}",
        "paginasExtras": "{n} extra sections or pages",
        "multiplica": "multiplies the total by {x}",
        "inclui": "In every project",
        "incluiItens": [
          "Custom design, no off-the-shelf template",
          "Phone, tablet and desktop versions",
          "Copy and structure built to convert",
          "Speed optimization and basic SEO",
          "Two rounds of revisions included",
          "Launch and handover of all files"
        ],
        "proximo": "Next steps",
        "passos": [
          [
            "Call",
            "A quick call to understand the business, the audience and what the project has to deliver."
          ],
          [
            "Proposal",
            "Fixed scope, timeline and final price in writing, no surprises."
          ],
          [
            "Project",
            "We start with the visual concept and you follow every stage through launch."
          ]
        ],
        "cta": "Shall we talk?",
        "ctaTexto": "Reply through the form on the website or write to {email}. I reply within one business day.",
        "nota": "Initial estimate, subject to the final definition of scope. Indicative pricing, with no obligation. Items on request and after-launch services are not part of the range and are quoted separately. Amounts in US dollars, converted from Brazilian reals.",
        "pagina": "Page {a} of {b}",
        "arquivo": {
          "base": "estimate-lucas-giovanni",
          "paginas": "{n}p",
          "mais": "plus{k}"
        },
        "consultaLinha": "On request (outside the range)",
        "faixaConsulta": "On request",
        "semanasConsulta": "To be defined",
        "depois": "After launch (quoted separately)",
        "depoisValor": "to be quoted"
      },
      "confirmaPdf": {
        "titulo": "Download the estimate?",
        "texto": "This saves a one-page PDF with the range, the timeline and what you picked.",
        "arquivo": "File",
        "tamanho": "Approximate size",
        "baixar": "Download PDF",
        "cancelar": "Cancel",
        "preparando": "Preparing…"
      },
      "paginasNota": "Initial content estimate. Pages with specialized functionality may require additional scope.",
      "urgenciaNota": "Accelerated projects depend on availability and may require an additional fee.",
      "depoisIntro": "Your project keeps evolving. Add support, maintenance, and improvements to keep your website up to date and ready to grow.",
      "natureza": {
        "recorrente": "monthly",
        "adicional": "one-off"
      },
      "consulta": "on request",
      "consultaDica": "No fixed price: included in the proposal after we talk",
      "faixaConsulta": "On request",
      "prazoConsulta": "Estimated timeline: to be defined together",
      "maisConsulta": "+ {n} {itens} on request, outside the range",
      "item": "item",
      "itens": "items",
      "depoisLinha": "After launch: {lista}, quoted separately"
    },
    "simulador": {
      "tipos": [
        {
          "rotulo": "One-page website"
        },
        {
          "rotulo": "Multi-page website"
        },
        {
          "rotulo": "Landing page"
        },
        {
          "rotulo": "Portfolio"
        },
        {
          "rotulo": "Online store"
        },
        {
          "rotulo": "Web app"
        },
        {
          "rotulo": "3D experience"
        }
      ],
      "grupos": [
        {
          "titulo": "Integrations",
          "itens": [
            {
              "rotulo": "Online booking"
            },
            {
              "rotulo": "Payments"
            },
            {
              "rotulo": "Client portal"
            },
            {
              "rotulo": "Content management system"
            },
            {
              "rotulo": "Blog or catalog"
            },
            {
              "rotulo": "CRM and automations"
            }
          ]
        },
        {
          "titulo": "Visual and technical features",
          "itens": [
            {
              "rotulo": "Animations and microinteractions"
            },
            {
              "rotulo": "Interactive 3D elements"
            },
            {
              "rotulo": "Scroll-driven experiences"
            },
            {
              "rotulo": "Multilingual website PT/EN"
            },
            {
              "rotulo": "Light and dark mode"
            },
            {
              "rotulo": "SEO and analytics"
            }
          ]
        },
        {
          "titulo": "Design and content",
          "itens": [
            {
              "rotulo": "Visual identity"
            },
            {
              "rotulo": "Social media kit"
            },
            {
              "rotulo": "Motion graphics"
            },
            {
              "rotulo": "Video editing and color grading"
            },
            {
              "rotulo": "3D modeling and rendering"
            },
            {
              "rotulo": "Copywriting"
            }
          ]
        }
      ],
      "urgencia": [
        {
          "rotulo": "Standard timeline"
        },
        {
          "rotulo": "Accelerated timeline"
        }
      ],
      "depois": {
        "itens": [
          {
            "rotulo": "Maintenance and updates"
          },
          {
            "rotulo": "Technical support"
          },
          {
            "rotulo": "New pages and features"
          },
          {
            "rotulo": "Content updates"
          },
          {
            "rotulo": "Performance improvements"
          }
        ]
      }
    }
  },
  "paginas": {
    "inicio": {
      "titulo": "Lucas Giovanni — design, sites e motion",
      "descricao": "Design, sites e motion para negócios que querem comunicar à altura do que entregam. Portfólio de Lucas Giovanni."
    },
    "trabalhos": {
      "titulo": "Trabalhos · Lucas Giovanni",
      "descricao": "Sites, apps, identidades visuais e materiais editoriais de 2026, entre clientes reais e projetos conceito."
    },
    "orcamento": {
      "titulo": "Orçamento · Lucas Giovanni",
      "descricao": "Simule em 30 segundos uma faixa de investimento para o seu site, app ou identidade visual."
    }
  },
  "inicio": {
    "destaques": {
      "titulo": "Trabalhos em destaque",
      "link": "Ver todos os trabalhos",
      "ids": [
        "supportvida",
        "pingado",
        "forja"
      ]
    }
  },
  "orcamento": {
    "eyebrow": "Estimativa rápida",
    "titulo": "Quanto custa tirar sua ideia do papel?",
    "sub": "Escolha o que seu projeto precisa e receba uma faixa inicial de investimento. É um ponto de partida para planejar; a proposta final depende do escopo e dos detalhes que definirmos juntos.",
    "tipo": "O que vamos criar?",
    "paginas": "Quantidade de páginas ou seções",
    "urgencia": "Prazo desejado",
    "depois": "Depois do lançamento",
    "faixa": "Faixa estimada",
    "prazo": "Prazo estimado: {a} a {b} semanas",
    "dica": "Marque as opções para ajustar a estimativa.",
    "pdf": "Baixar estimativa em PDF",
    "enviar": "Enviar esta estimativa",
    "verDetalhes": "Ver detalhes",
    "nota": "Valores de referência, sem compromisso. O orçamento final depende do escopo definido na conversa.",
    "semDownload": "Aqui o navegador não deixa baixar arquivos. Copie a estimativa e cole na sua mensagem:",
    "copiar": "Copiar estimativa",
    "copiado": "Copiado",
    "resumo": {
      "titulo": "Estimativa feita no simulador do site",
      "tipo": "Tipo de projeto",
      "paginas": "Páginas ou seções",
      "urgencia": "Prazo desejado",
      "depois": "Depois do lançamento",
      "faixa": "Faixa estimada",
      "prazo": "Prazo previsto",
      "idioma": "Idioma",
      "nenhum": "nenhum",
      "consulta": "sob consulta",
      "aDefinir": "a definir na conversa",
      "idiomaNome": "Português",
      "extras": "Itens",
      "sim": "sim",
      "nao": "não"
    },
    "pdfDoc": {
      "titulo": "Estimativa de projeto",
      "rotuloDoc": "Estimativa",
      "numero": "Nº {n}",
      "gerada": "Gerada em {data}",
      "validade": "Válida por 30 dias",
      "abertura": "Obrigado por simular o seu projeto. Esta é uma faixa de referência montada a partir das opções que você marcou no site, para você se planejar com segurança antes da nossa conversa.",
      "faixa": "Faixa de investimento",
      "prazo": "Prazo estimado",
      "semanas": "{a} a {b} semanas",
      "escopo": "O que você marcou",
      "composicao": "Como a faixa foi montada",
      "base": "Base: {tipo}",
      "paginasExtras": "{n} seções ou páginas extras",
      "multiplica": "multiplica o total por {x}",
      "inclui": "Em todo projeto",
      "incluiItens": [
        "Design sob medida, sem template pronto",
        "Versões para celular, tablet e computador",
        "Textos e estrutura pensados para converter",
        "Otimização de velocidade e SEO básico",
        "Duas rodadas de ajustes inclusas",
        "Publicação e entrega dos arquivos"
      ],
      "proximo": "Próximos passos",
      "passos": [
        [
          "Conversa",
          "Uma chamada rápida para entender o negócio, o público e o que o projeto precisa entregar."
        ],
        [
          "Proposta",
          "Escopo fechado, cronograma e valor final por escrito, sem surpresas."
        ],
        [
          "Projeto",
          "Começamos pelo conceito visual e você acompanha cada etapa até a publicação."
        ]
      ],
      "cta": "Vamos conversar?",
      "ctaTexto": "Responda pelo formulário do site ou escreva para {email}. Respondo em até um dia útil.",
      "nota": "Estimativa inicial, sujeita à definição final do escopo. Valores de referência, sem compromisso. Itens sob consulta e serviços depois do lançamento não entram na faixa e são orçados à parte.",
      "pagina": "Página {a} de {b}",
      "arquivo": {
        "base": "estimativa-lucas-giovanni",
        "paginas": "{n}p",
        "mais": "mais{k}"
      },
      "consultaLinha": "Sob consulta (fora da faixa)",
      "faixaConsulta": "Sob consulta",
      "semanasConsulta": "A definir",
      "depois": "Depois do lançamento (cobrado à parte)",
      "depoisValor": "a combinar"
    },
    "confirmaPdf": {
      "titulo": "Baixar a estimativa?",
      "texto": "Vamos salvar um PDF de uma página com a faixa, o prazo e o que você marcou.",
      "arquivo": "Arquivo",
      "tamanho": "Tamanho aproximado",
      "baixar": "Baixar PDF",
      "cancelar": "Cancelar",
      "preparando": "Preparando…"
    },
    "paginasNota": "Estimativa inicial de conteúdo. Páginas com funcionalidades especiais podem exigir um escopo adicional.",
    "urgenciaNota": "Projetos com prazo reduzido dependem da disponibilidade e podem ter acréscimo no investimento.",
    "depoisIntro": "Seu projeto continua evoluindo. Inclua suporte, manutenção e melhorias para manter seu site atualizado e preparado para crescer.",
    "natureza": {
      "recorrente": "mensal",
      "adicional": "avulso"
    },
    "consulta": "sob consulta",
    "consultaDica": "Sem valor fixo: entra na proposta depois da conversa",
    "faixaConsulta": "Sob consulta",
    "prazoConsulta": "Prazo estimado: a definir na conversa",
    "maisConsulta": "+ {n} {itens} sob consulta, fora da faixa",
    "item": "item",
    "itens": "itens",
    "depoisLinha": "Depois do lançamento: {lista}, a combinar à parte"
  },
  "simulador": {
    "moeda": "BRL",
    "exibicao": {
      "en": {
        "moeda": "USD",
        "cambio": 5.1,
        "multiplo": 5
      }
    },
    "arredondar": 50,
    "paginas": {
      "min": 1,
      "max": 12,
      "padrao": 4
    },
    "tipos": [
      {
        "id": "one",
        "rotulo": "Site one-page",
        "min": 400,
        "max": 2700,
        "semanas": 1.2,
        "porPagina": {
          "min": 190,
          "max": 390,
          "semanas": 0.22
        },
        "contato": "Site",
        "arquivo": "one-page"
      },
      {
        "id": "multi",
        "rotulo": "Site multipáginas",
        "min": 2000,
        "max": 4000,
        "semanas": 1.8,
        "porPagina": {
          "min": 190,
          "max": 390,
          "semanas": 0.22
        },
        "contato": "Site",
        "arquivo": "multipaginas"
      },
      {
        "id": "landing",
        "rotulo": "Landing page",
        "precoDe": "one",
        "contato": "Landing page",
        "arquivo": "landing-page"
      },
      {
        "id": "portfolio",
        "rotulo": "Portfólio",
        "precoDe": "multi",
        "contato": "Site",
        "arquivo": "portfolio"
      },
      {
        "id": "loja",
        "rotulo": "Loja virtual",
        "contato": "Site",
        "arquivo": "loja-virtual"
      },
      {
        "id": "app",
        "rotulo": "Aplicativo web",
        "min": 4200,
        "max": 8400,
        "semanas": 3,
        "porPagina": {
          "min": 360,
          "max": 720,
          "semanas": 0.35
        },
        "contato": "Aplicativo",
        "arquivo": "app"
      },
      {
        "id": "exp3d",
        "rotulo": "Experiência 3D",
        "contato": "3D & interativo",
        "arquivo": "experiencia-3d"
      }
    ],
    "grupos": [
      {
        "id": "integracoes",
        "titulo": "Integrações",
        "itens": [
          {
            "id": "agenda",
            "rotulo": "Agendamento online",
            "min": 300,
            "max": 720,
            "semanas": 0.35,
            "arquivo": "agenda"
          },
          {
            "id": "pagamentos",
            "rotulo": "Pagamentos",
            "min": 540,
            "max": 1320,
            "semanas": 0.45,
            "arquivo": "pagamentos"
          },
          {
            "id": "area",
            "rotulo": "Área do cliente",
            "min": 720,
            "max": 2100,
            "semanas": 0.6,
            "arquivo": "area-cliente"
          },
          {
            "id": "cms",
            "rotulo": "CMS para editar conteúdo",
            "min": 480,
            "max": 960,
            "semanas": 0.35,
            "arquivo": "cms"
          },
          {
            "id": "blog",
            "rotulo": "Blog ou catálogo",
            "min": 420,
            "max": 1080,
            "semanas": 0.45,
            "arquivo": "blog"
          },
          {
            "id": "crm",
            "rotulo": "CRM e automações",
            "arquivo": "crm"
          }
        ]
      },
      {
        "id": "recursos",
        "titulo": "Recursos visuais e técnicos",
        "itens": [
          {
            "id": "animacoes",
            "rotulo": "Animações e microinterações",
            "min": 300,
            "max": 750,
            "semanas": 0.2,
            "arquivo": "animacoes"
          },
          {
            "id": "3d",
            "rotulo": "Elementos 3D interativos",
            "arquivo": "3d-interativo",
            "contato": "3D & interativo"
          },
          {
            "id": "scroll",
            "rotulo": "Experiências com scroll",
            "min": 450,
            "max": 1150,
            "semanas": 0.3,
            "arquivo": "scroll"
          },
          {
            "id": "multilingue",
            "rotulo": "Site multilíngue PT/EN",
            "min": 300,
            "max": 750,
            "semanas": 0.2,
            "arquivo": "multilingue"
          },
          {
            "id": "temas",
            "rotulo": "Tema claro e escuro",
            "min": 150,
            "max": 550,
            "semanas": 0.1,
            "arquivo": "temas"
          },
          {
            "id": "seo",
            "rotulo": "SEO e analytics",
            "min": 150,
            "max": 360,
            "semanas": 0.12,
            "arquivo": "seo"
          }
        ]
      },
      {
        "id": "design",
        "titulo": "Design e conteúdo",
        "itens": [
          {
            "id": "identidade",
            "rotulo": "Identidade visual",
            "min": 1000,
            "max": 1500,
            "semanas": 0.6,
            "contato": "Identidade visual",
            "arquivo": "identidade"
          },
          {
            "id": "social",
            "rotulo": "Kit para redes sociais",
            "min": 360,
            "max": 900,
            "semanas": 0.3,
            "arquivo": "social",
            "contato": "Design gráfico"
          },
          {
            "id": "motion",
            "rotulo": "Motion graphics",
            "min": 480,
            "max": 1200,
            "semanas": 0.4,
            "contato": "Motion & vídeo",
            "arquivo": "motion"
          },
          {
            "id": "video",
            "rotulo": "Vídeo com edição e color grading",
            "contato": "Motion & vídeo",
            "arquivo": "video"
          },
          {
            "id": "modelagem3d",
            "rotulo": "Modelagem e renderização 3D",
            "arquivo": "modelagem-3d",
            "contato": "3D & interativo"
          },
          {
            "id": "copy",
            "rotulo": "Copywriting",
            "min": 300,
            "max": 950,
            "semanas": 0.25,
            "arquivo": "copywriting"
          }
        ]
      }
    ],
    "urgencia": [
      {
        "id": "normal",
        "rotulo": "Prazo padrão"
      },
      {
        "id": "prioridade",
        "rotulo": "Prazo reduzido",
        "mult": 1.2,
        "multSemanas": 0.85,
        "arquivo": "prazo-reduzido"
      }
    ],
    "depois": {
      "itens": [
        {
          "id": "manutencao",
          "rotulo": "Manutenção e atualizações",
          "natureza": "recorrente",
          "arquivo": "manutencao"
        },
        {
          "id": "suporte",
          "rotulo": "Suporte técnico",
          "natureza": "recorrente",
          "arquivo": "suporte"
        },
        {
          "id": "novas",
          "rotulo": "Novas páginas e funcionalidades",
          "natureza": "adicional",
          "arquivo": "novas-paginas"
        },
        {
          "id": "conteudo",
          "rotulo": "Atualização de conteúdo",
          "natureza": "recorrente",
          "arquivo": "conteudo"
        },
        {
          "id": "performance",
          "rotulo": "Melhorias de performance",
          "natureza": "adicional",
          "arquivo": "performance"
        }
      ]
    }
  }
};
