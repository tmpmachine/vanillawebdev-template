let compoMain = window.compoMain = (function() {
  
  let SELF = {
    Init,
    InitSearchHintComponent,
  };
  
  function Init() {
    
  }

  function InitSearchHintComponent(blogName, blogId, searchHintLabelName) {
    let feeder = BlogFeeds({
      blogId,
      searchHintLabelName,
      blog: blogName,
    });
    feeder.init();
    
    let search = BlogSearch({
      inputEl: document.querySelector('._searchInput'),
      resultElDesktop: document.querySelector('._searchResult'),
      resultElMobile: document.querySelector('._searchResult'),
      resultTemplate: document.querySelector('#tmp-search-hint'),
      haystack: feeder.posts,
    });
    search.init();
  }
  
  return SELF;
  
})();