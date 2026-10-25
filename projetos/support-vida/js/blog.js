// Blog da Support Vida: lê os artigos publicados no Wix Blog e monta as páginas
// blog.html (lista) e post.html (artigo). Os textos são escritos no painel do Wix;
// nada aqui cria ou inventa conteúdo.
import { queryPosts, queryPostsByCategory, queryCategories, getPostBySlug } from "./wix/wix-blog.js";

const PAGE_SIZE = 12;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
  : "";

const postHref = (post) => `post.html?slug=${encodeURIComponent(post.slug)}`;

function wixImageUrl(src) {
  if (!src) return "";
  if (src.url) return src.url;
  return src.id ? `https://static.wixstatic.com/media/${src.id}` : "";
}

// ---- Lista de artigos (blog.html) -------------------------------------------

function cardHtml(post, catById) {
  const cover = post.media?.wixMedia?.image?.url;
  const cats = (post.categoryIds || []).map((id) => catById[id]).filter(Boolean);
  return `
    <a class="blog-card" href="${postHref(post)}">
      ${cover
        ? `<div class="blog-card-media"><img src="${esc(cover)}" alt="" loading="lazy"></div>`
        : `<div class="blog-card-media blog-card-media-empty" aria-hidden="true"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l2.5 8L13 4l2.5 8H22"/></svg></div>`}
      <div class="blog-card-body">
        ${cats.length ? `<div class="blog-card-cat">${esc(cats[0].label)}</div>` : ""}
        <h2 class="blog-card-title">${esc(post.title)}</h2>
        ${post.excerpt ? `<p class="blog-card-excerpt">${esc(post.excerpt)}</p>` : ""}
        <div class="blog-card-meta">${esc(fmtDate(post.firstPublishedDate))}${post.minutesToRead ? ` · ${post.minutesToRead} min de leitura` : ""}</div>
      </div>
    </a>`;
}

async function initList(root) {
  const grid = root.querySelector("[data-blog-grid]");
  const filters = root.querySelector("[data-blog-filters]");
  const moreBtn = root.querySelector("[data-blog-more]");
  const params = new URLSearchParams(location.search);
  const activeSlug = params.get("categoria");

  let catById = {};
  let activeCat = null;
  try {
    const { categories } = await queryCategories();
    catById = Object.fromEntries(categories.map((c) => [c.id, c]));
    activeCat = categories.find((c) => c.slug === activeSlug) || null;
    filters.innerHTML = [
      `<a class="blog-chip${activeCat ? "" : " active"}" href="blog.html">Todos</a>`,
      ...categories.map((c) =>
        `<a class="blog-chip${activeCat?.id === c.id ? " active" : ""}" href="blog.html?categoria=${encodeURIComponent(c.slug)}">${esc(c.label)}</a>`),
    ].join("");
  } catch {
    filters.hidden = true;
  }

  let cursor = null;
  let shown = 0;
  async function load() {
    moreBtn.disabled = true;
    try {
      const res = activeCat
        ? await queryPostsByCategory(activeCat.id, { limit: PAGE_SIZE, cursor })
        : await queryPosts({ limit: PAGE_SIZE, cursor });
      if (!cursor) grid.innerHTML = "";
      grid.insertAdjacentHTML("beforeend", res.posts.map((p) => cardHtml(p, catById)).join(""));
      shown += res.posts.length;
      cursor = res.nextCursor;
      if (shown === 0) {
        grid.innerHTML = `<p class="blog-empty">${activeCat
          ? "Ainda não há artigos nesta categoria."
          : "Em breve, novos artigos sobre saúde do coração."}</p>`;
      }
      moreBtn.hidden = !cursor;
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<p class="blog-empty">Não foi possível carregar os artigos agora. Tente novamente em instantes.</p>`;
      moreBtn.hidden = true;
    } finally {
      moreBtn.disabled = false;
    }
  }

  moreBtn.addEventListener("click", load);
  await load();
}

// ---- Artigo (post.html) -----------------------------------------------------

function renderText(node) {
  let html = esc(node.textData?.text).replace(/\n/g, "<br>");
  for (const d of node.textData?.decorations || []) {
    if (d.type === "BOLD") html = `<strong>${html}</strong>`;
    else if (d.type === "ITALIC") html = `<em>${html}</em>`;
    else if (d.type === "UNDERLINE") html = `<u>${html}</u>`;
    else if (d.type === "LINK" && d.linkData?.link?.url) {
      const url = d.linkData.link.url;
      if (/^(https?:|mailto:|tel:)/i.test(url)) {
        html = `<a href="${esc(url)}" target="_blank" rel="noopener">${html}</a>`;
      }
    }
  }
  return html;
}

function renderNodes(nodes = []) {
  return nodes.map(renderNode).join("");
}

function renderNode(node) {
  switch (node.type) {
    case "TEXT": return renderText(node);
    case "PARAGRAPH": {
      const inner = renderNodes(node.nodes);
      return inner ? `<p>${inner}</p>` : "";
    }
    case "HEADING": {
      // O título do artigo é o h1; cabeçalhos do texto começam em h2.
      const level = Math.min(Math.max(node.headingData?.level || 2, 2), 4);
      return `<h${level}>${renderNodes(node.nodes)}</h${level}>`;
    }
    case "BULLETED_LIST": return `<ul>${renderNodes(node.nodes)}</ul>`;
    case "ORDERED_LIST": return `<ol>${renderNodes(node.nodes)}</ol>`;
    case "LIST_ITEM": return `<li>${renderNodes(node.nodes)}</li>`;
    case "BLOCKQUOTE": return `<blockquote>${renderNodes(node.nodes)}</blockquote>`;
    case "DIVIDER": return "<hr>";
    case "IMAGE": {
      const img = node.imageData?.image;
      const url = wixImageUrl(img?.src);
      if (!url) return "";
      const caption = node.imageData?.caption;
      return `<figure><img src="${esc(url)}" alt="${esc(node.imageData?.altText)}" loading="lazy"${img.width ? ` width="${img.width}" height="${img.height}"` : ""}>${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}</figure>`;
    }
    default:
      // Tipos não suportados (vídeo, embed, tabela...) mostram ao menos o texto que tiverem.
      return node.nodes?.length ? renderNodes(node.nodes) : "";
  }
}

function setMeta(post) {
  const desc = post.excerpt || "";
  document.title = `${post.title} | Blog Support Vida`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", post.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", desc);
  const canonical = `https://www.clinicasupportvida.com.br/${postHref(post)}`;
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);

  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    headline: post.title,
    description: desc,
    datePublished: post.firstPublishedDate,
    dateModified: post.lastPublishedDate || post.firstPublishedDate,
    url: canonical,
    reviewedBy: { "@type": "Physician", name: "Dr. Abraão Telles Rocha" },
    publisher: { "@type": "MedicalClinic", name: "Support Vida — A Clínica do Coração" },
  });
  document.head.appendChild(ld);
}

async function initPost(root) {
  const slug = new URLSearchParams(location.search).get("slug");
  const notFound = () => {
    root.innerHTML = `
      <div class="blog-empty blog-notfound">
        <h1 class="display">Artigo não encontrado</h1>
        <p>O endereço pode ter mudado ou o artigo foi removido.</p>
        <a class="btn btn-outline" href="blog.html">Ver todos os artigos</a>
      </div>`;
    document.title = "Artigo não encontrado | Blog Support Vida";
    // Evita que o Google indexe a página de "não encontrado".
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
  };

  if (!slug) return notFound();

  let post;
  try {
    post = await getPostBySlug(slug);
  } catch {
    post = null;
  }
  if (!post) return notFound();

  let catById = {};
  try {
    const { categories } = await queryCategories();
    catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  } catch { /* categorias são opcionais na página do artigo */ }

  const cats = (post.categoryIds || []).map((id) => catById[id]).filter(Boolean);
  const cover = post.media?.displayed !== false ? post.media?.wixMedia?.image?.url : null;
  const body = post.richContent?.nodes?.length
    ? renderNodes(post.richContent.nodes)
    : (post.contentText || "").split("\n").filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");

  root.querySelector("[data-post-cats]").innerHTML = cats
    .map((c) => `<a class="blog-chip" href="blog.html?categoria=${encodeURIComponent(c.slug)}">${esc(c.label)}</a>`)
    .join("");
  root.querySelector("[data-post-title]").textContent = post.title;
  root.querySelector("[data-post-meta]").textContent =
    [fmtDate(post.firstPublishedDate), post.minutesToRead ? `${post.minutesToRead} min de leitura` : ""]
      .filter(Boolean).join(" · ");
  const coverEl = root.querySelector("[data-post-cover]");
  if (cover) coverEl.innerHTML = `<img src="${esc(cover)}" alt="">`;
  else coverEl.remove();
  root.querySelector("[data-post-body]").innerHTML = body;
  root.removeAttribute("aria-busy");

  setMeta(post);
}

const listRoot = document.querySelector("[data-blog-list]");
if (listRoot) initList(listRoot);
const postRoot = document.querySelector("[data-blog-post]");
if (postRoot) initPost(postRoot);
