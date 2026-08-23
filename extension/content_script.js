// ============================================================================
// Seletores para remoção de Shorts e Posts (Desktop e Mobile m.youtube.com)
// ============================================================================
const selectorsToRemove = [
  // Posts da comunidade
  '[class*="post"]',
  '[class*="Post"]',
  "ytm-backstage-post-thread-renderer",
  "ytm-backstage-post-renderer",
  "ytm-post-multi-image-renderer",
  "ytd-post-renderer",

  // Shorts (Views, Shelves e Lockups)
  '[class*="shorts"]',
  '[class*="Shorts"]',
  "ytm-reel-shelf-renderer",
  "ytd-reel-shelf-renderer",
  "ytd-rich-shelf-renderer[is-shorts]",
  "ytm-shorts-lockup-view-model",
  "ytm-shorts-lockup-view-model-v2",
  "ytm-reel-item-renderer",
  "ytd-reel-item-renderer",
  'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
  'ytm-rich-item-renderer:has(a[href*="/shorts/"])',
  'ytm-pivot-bar-item-renderer:has(a[href*="/shorts/"])',
  'ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
  'ytm-compact-video-renderer:has(a[href*="/shorts/"])',
];

// ============================================================================
// AVISO IMPORTANTE:
// NÃO ADICIONE O ATRIBUTO "[override-arrow-position-for-shorts]" À LISTA OU AO CSS!
// Ocultar ou remover elementos por essa propriedade quebra o carregamento infinito
// (infinite scroll) de vídeos no YouTube Mobile (m.youtube.com).
// ============================================================================

// Seletor para varrer os elementos no body, ignorando metadados e scripts
const bodySelector =
  "body :not(script):not(style):not(link):not(meta):not(noscript):not(title):not(svg)";

/**
 * Busca com segurança todos os elementos da página que correspondem ao bodySelector.
 * Retorna uma NodeList (ou array vazio em caso de falha antes do body ser criado).
 */
function getTargetElements() {
  try {
    return document.querySelectorAll(bodySelector);
  } catch (e) {
    return [];
  }
}

/**
 * Filtra e remove elementos cujas tags de elemento contêm "post" ou "shorts".
 */
function findElementsByTagName() {
  const elements = getTargetElements();
  return Array.from(elements).filter((el) => {
    const tagName = el.tagName.toLocaleLowerCase();
    return tagName.includes("post") || tagName.includes("shorts");
  });
}

function removeElementsByTagName() {
  const elements = findElementsByTagName();
  elements.forEach((el) => {
    if (el && el.parentNode) {
      el.remove();
    }
  });
}

/**
 * Filtra e remove elementos que possuem qualquer atributo contendo "shorts" ou "post".
 */
function findElementsByAttrName() {
  const elements = getTargetElements();
  return Array.from(elements).filter((el) => {
    if (!el.attributes) return false;
    const attrNameList = Array.from(el.attributes).map((attr) =>
      attr.name.toLocaleLowerCase(),
    );
    return attrNameList.some(
      (name) => name.includes("shorts") || name.includes("post"),
    );
  });
}

function removeElementsByAttrName() {
  const elements = findElementsByAttrName();
  elements.forEach((el) => {
    if (el && el.parentNode) {
      el.remove();
    }
  });
}

/**
 * Busca elementos via Query Selector CSS configurados em selectorsToRemove.
 */
function findElementsBySelector() {
  return selectorsToRemove.flatMap((selector) => {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  });
}

function removeElementsBySelector() {
  const elements = findElementsBySelector();
  elements.forEach((el) => {
    if (el && el.parentNode) {
      el.remove();
    }
  });
}

/**
 * Função principal de limpeza da Home e feeds do YouTube.
 * Não roda na página /watch para não afetar o player principal de vídeos.
 */
function cleanYouTubeHome() {
  if (window.location.pathname === "/watch") return;

  removeElementsBySelector();
  removeElementsByAttrName();
  removeElementsByTagName();
}

// ============================================================================
// Mecanismo de Debounce
// Evita execução excessiva e congelamento da thread principal durante injeções em massa
// ============================================================================
let debounceTimeout = null;

function debounceClean(delay = 250) {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  debounceTimeout = setTimeout(() => {
    cleanYouTubeHome();
  }, delay);
}

/**
 * Verifica se a limpeza deve rodar baseado na URL atual e presença de mutações no DOM.
 */
function shouldClean(mutations) {
  if (window.location.pathname === "/watch") return false;
  return Array.isArray(mutations) && mutations.length > 0;
}

// Configuração de observação do DOM para alterações dinâmicas
const config = {
  attributes: true,
  childList: true,
  subtree: true,
};

const callback = (mutationList) => {
  if (shouldClean(mutationList)) {
    debounceClean(150);
  }
};

// Observa o documentElement (html), garantindo disponibilidade imediata em document_start
const observerTarget = document.documentElement || document;
const observer = new MutationObserver(callback);

if (observerTarget) {
  observer.observe(observerTarget, config);
}

// ============================================================================
// Gatilhos de Inicialização e Navegação SPA (Single Page Application)
// ============================================================================

// 1. Limpeza imediata no carregamento do script
cleanYouTubeHome();

// 2. Limpeza ao concluir o parse inicial da árvore DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cleanYouTubeHome);
}

// 3. Suporte para navegação interna do YouTube sem recarregar a página (Desktop e Mobile)
window.addEventListener("yt-navigate-finish", cleanYouTubeHome);
window.addEventListener("yt-page-data-updated", cleanYouTubeHome);
window.addEventListener("popstate", cleanYouTubeHome);

// 4. Timers de garantia para elementos com carregamento assíncrono atrasado
setTimeout(cleanYouTubeHome, 300);
setTimeout(cleanYouTubeHome, 1000);
setTimeout(cleanYouTubeHome, 3000);
