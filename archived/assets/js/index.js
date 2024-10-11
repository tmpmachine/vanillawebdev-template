import { loadScripts } from './script-loader.js';

(function() {

  loadScripts([
    {
      urls: [
        "/blogfeeds.js",
        "/blogsearch.js",
      ],
    },
    {
      urls: [
        "/main-component.js",
      ],
    },
  ], {
    basePath: document.body.dataset.jsAssetsPath,
  });
  
})();