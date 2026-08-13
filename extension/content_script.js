// Estes são os seletores que consegui identificar.
// Alguns são redundantes, mas mantive para garantir que funcione
const selectorsToRemove = [
  '[class*="post"]',
  '[class*="Post"]',
  "ytm-backstage-post-thread-renderer",
  "ytm-backstage-post-renderer",
  "ytm-post-multi-image-renderer",
  "ytd-post-renderer",
  '[class*="shorts"]',
  '[class*="Shorts"]',
  "ytm-shorts-lockup-view-model",
  "ytm-shorts-lockup-view-model-v2",
  // DO NOT REMOVE THIS
  // removing this blocks yt from loading more content on mobile
  // "[override-arrow-position-for-shorts]",
];

// easter egg: header
// the Shorts header is not removed from the page
// pq não consegui mesmo remover o header do Shorts

// tem um caso em que o body tem um atributo "is-shorts"
// então vamos ignorar o body
// e aproveitar para já ignorar outras coisas também
// const bodySelector =
//  "body :not(script):not(style):not(link):not(meta):not(noscript):not(title):not(svg)";
// agora vamos direto no conteudo
// #app for mobile and #content for desktop
const targetNode =
  document.getElementById("app") || document.getElementById("content");

function findElementsByTagName() {
  // Busca todos os elementos com a tag especificada
  return Array.from(targetNode).filter((el) => {
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
  return Array.from(targetNode).filter((el) => {
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

function cleanYouTubeHome() {
  // Executa apenas se não estiver na página de vídeo para evitar interferir com o player
  if (window.location.pathname === "/watch") return;

  removeElementsBySelector();
  removeElementsByAttrName();
  removeElementsByTagName();
}

function debounce() {
  let timeout;
  return function executedFunction() {
    const later = () => {
      clearTimeout(timeout);
      cleanYouTubeHome();
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, 2222);
  };
}

let should = false;

function shouldClean(mutations) {
  should = false;
  // Executa apenas se não estiver na página de vídeo para evitar interferir com o player
  // e se existirem mutations
  if (window.location.pathname !== "/watch" && mutations.length > 0) {
    should = true;
  }
}

const config = {
  attributes: true, // Watch for attribute changes (e.g., class, style)
  childList: true, // Watch for adding/removing child elements
  subtree: true, // Extend watching to all descendant nodes
};

// 3. Create the callback function to execute when changes happen
const callback = (mutationList, observer) => {
  if (shouldClean(mutationList)) {
    // Um pequeno debounce rudimentar para não travar a thread principal
    // durante injeções massivas do YouTube
    debounce()();
  }
};

// O MutationObserver monitora mudanças no DOM
// 4. Create and start the observer instance
const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

// 0 - Limpeza inicial caso os elementos já estejam lá
const timeout0 = setTimeout(() => {
  debounce()();
  clearTimeout(timeout0);
}, 111);

// 1 - algumas vezes o Post demora um pouco,
// sem trigger de mutation, então vamos tentar novamente
const timeout1 = setTimeout(() => {
  debounce()();
  clearTimeout(timeout1);
}, 7777);

// 2 - pra garantir, rodar de vez em quando
// pois o carregamento pode demorar no mobile
// function interval(time) {
//   const timetouInterval = setTimeout(() => {
//     debounce()();

//     clearTimeout(timetouInterval);
//     interval(time);
//   }, time);
// }
// interval(7777);
