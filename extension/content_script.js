// Estes são os seletores que consegui identificar.
// Alguns são redundantes, mas mantive para garantir que funcione
const selectorsToRemove = [
  '[class*="post"]',
  '[class*="Post"]',
  "ytm-backstage-post-thread-renderer",
  "ytm-backstage-post-renderer",
  "ytd-post-renderer",
  '[class*="shorts"]',
  '[class*="Shorts"]',
  "ytm-shorts-lockup-view-model",
  "ytm-shorts-lockup-view-model-v2",
  "[override-arrow-position-for-shorts]",
];

// tem um caso em que o body tem um atributo "is-shorts"
// então vamos ignorar o body
// e aproveitar para já ignorar outras coisas também
const bodySelector =
  "body :not(script):not(style):not(link):not(meta):not(noscript):not(title):not(svg)";

function findElementsByTagName() {
  // Busca todos os elementos com a tag especificada
  return Array.from(document.querySelectorAll(bodySelector)).filter((el) => {
    const tagName = el.tagName.toLocaleLowerCase();
    return tagName.includes("post") || tagName.includes("shorts");
  });
}

function removeElementsByTagName() {
  const elements = findElementsByTagName();
  elements.forEach((el) => {
    if (el && el.parentNode) {
      // console.log(`Removendo elemento por tag: ${el.tagName}`);
      el.remove();
    }
  });
}

function findElementsByAttrName() {
  // Busca todos os elementos com atributos contendo shorts ou post
  return Array.from(document.querySelectorAll(bodySelector)).filter((el) => {
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
      // console.log(`Removendo elemento por atributo: ${el.tagName}`);
      el.remove();
    }
  });
}

function findElementsBySelector() {
  // Busca todos os elementos com os seletores especificados
  return selectorsToRemove.flatMap((selector) =>
    Array.from(document.querySelectorAll(selector)),
  );
}

function removeElementsBySelector() {
  const elements = findElementsBySelector();
  elements.forEach((el) => {
    if (el && el.parentNode) {
      // console.log(`Removendo elemento por seletor: ${el.tagName}`);
      el.remove();
    }
  });
}

// Função que busca e remove (ou oculta) os elementos
function cleanYouTubeHome() {
  // Executa apenas se não estiver na página de vídeo para evitar interferir com o player
  if (window.location.pathname === "/watch") return;

  removeElementsBySelector();
  removeElementsByAttrName();
  removeElementsByTagName();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// O MutationObserver monitora mudanças no DOM
const observer = new MutationObserver((mutations) => {
  let shouldClean = false;

  // Executa apenas se não estiver na página de vídeo para evitar interferir com o player
  if (window.location.pathname !== "/watch") {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldClean = true;
        break;
      }
    }
  }

  if (shouldClean) {
    // Um pequeno debounce rudimentar para não travar a thread principal
    // durante injeções massivas do YouTube
    debounce(cleanYouTubeHome, 200)();
  }
});

// Inicia a observação no documento inteiro
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Limpeza inicial caso os elementos já estejam lá
cleanYouTubeHome();
