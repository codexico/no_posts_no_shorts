const selectorsToRemove = [
  "ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])", // Shorts Desktop
  "ytd-reel-shelf-renderer", // Prateleira de Shorts avulsa
  "ytm-reel-shelf-renderer", // Shorts Mobile
  "ytd-rich-item-renderer:has(ytd-post-renderer)", // Comunidade Desktop
  'ytd-item-section-renderer:has([class*="shorts"])', // Shorts Desktop (variante)
  '[class*="shorts"]', // Qualquer elemento com "shorts" no nome da classe (fallback)
  ".ytGridShelfViewModelGridShelfRow", // Shorts em formato de grade (variante)
  'ytd-item-section-renderer:has([class*="post"])', // Post Desktop (variante)
  '[class*="post"]', // Qualquer elemento com "post" no nome da classe (fallback)
];

// Função que busca e remove (ou oculta) os elementos
function cleanYouTubeHome() {
  // Executa apenas se não estiver na página de vídeo para evitar interferir com o player
  if (window.location.pathname === "/watch") return;

  selectorsToRemove.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      // Remover do DOM alivia a memória e previne o bug de scroll no Firefox
      if (el && el.parentNode) {
        el.remove();
      }
    });
  });
}

// O MutationObserver monitora mudanças no DOM
const observer = new MutationObserver((mutations) => {
  // Um pequeno debounce rudimentar para não travar a thread principal
  // durante injeções massivas do YouTube
  let shouldClean = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldClean = true;
      break;
    }
  }

  if (shouldClean) {
    // Executa apenas se não estiver na página de vídeo para evitar interferir com o player
    if (window.location.pathname !== "/watch") {
      cleanYouTubeHome();
    }
  }
});

// Inicia a observação no documento inteiro
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Limpeza inicial caso os elementos já estejam lá
cleanYouTubeHome();
