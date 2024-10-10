let pwaCacher = (function() {
  
  let cacheName = location.origin;
  let cacheIndexFile = 'manifest-cache.json';
  
  let SELF = {
    DeleteCache,
    RefreshCache,
  };
  
  function extractUrlsFromJson(json) {
    let urls = [];
    for (let key in json) {
      if (Array.isArray(json[key])) {
        urls = urls.concat(json[key]);
      }
    }
    return urls;
  }
    
  function DeleteCache() {
    caches.delete(cacheName)
      .then(() => {
          alert('Done! Reload to take effect.');
      });
  };
  
  function RefreshCache() {
    
    fetch(cacheIndexFile)
    .then(res => res.json())
    .then(json => {
      
      let cacheURLs = extractUrlsFromJson(json);
  
      caches.delete(cacheName)
      .then(() => {
        caches.open(cacheName)
        .then(function(cache) {
          return Promise.all(
            cacheURLs.map(function(url) {
              return cache.add(url).catch(function(error) {
                console.error('Failed to cache URL:', url, error);
              });
            })
          );
        })
        .then(function() {
          alert('Done! Reload to take effect.');
        })
        .catch(function(error) {
          alert('Failed. Check console.');
        });
      });
    
    });
    
  };
  
  return SELF; 
  
})();