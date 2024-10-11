let BlogFeeds = window.BlogFeeds = (function() {
  
  function BlogFeeds(config) {
    
    let SELF = {
      posts: [],
    };

    let local = {
      searchHintLabelName: config.searchHintLabelName ?? 'search-hint',
    };
    
    let _ = {
      db: null,
      objStoreName: 'settings',
      idbVersion: 1,
      idbName: 'blog-' + config.blogId + '-search-hints',
      blogId: config.blogId,
    };
    
    let settings = {
      start: '1',
      end: 'unknown',
      updatedPoint: (new Date(0)).toISOString(),
      updated: (new Date(0)).toISOString(),
    };
    
    let option = {
      getData: ['id','title','link'],
      maxResults: 50
    };
    
    function getUpdateURL() {
      let URL = `https://www.blogger.com/feeds/${_.blogId}/posts/summary/-/${local.searchHintLabelName}?alt=json&max-results=${option.maxResults}&orderby=updated&updated-min=${settings.updated}&start-index=${(settings.start*1-1) * option.maxResults + 1}&rand=${(new Date()).getTime()}`;
      return URL;
    }
      
    function getUpdateMessage() {
      let message;
      if (settings.end == 'unknown')
        message = 'Checking for update...';
      else {
        if (settings.start > settings.end)
          message = 'Checking for update...';
        else
          message = 'Downloading blog posts... (' + settings.start + '/' + settings.end + ')';
      }
      return message;
    }
    
    function getUpdate(callback) {
      const request = new XMLHttpRequest();
      request.open('GET', getUpdateURL());
      request.onload = function() { handleUpdate(request, callback) };
      // request.onerror = () => { };
      request.send();
    }
    
    function saveSettings(callback) {
       let transaction = _.db.transaction([_.objStoreName], 'readwrite');
        let objStore  = transaction.objectStore(_.objStoreName);
        let request = objStore.put({type:'settings',data:settings});
        request.onsuccess = function(event) {
          callback();
        };
    }
    
    function handleUpdate(request, callback) {
    
      const result = JSON.parse(request.responseText);
      settings.end = Math.ceil(result.feed.openSearch$totalResults.$t/option.maxResults);
      if (result.feed.entry) {
        iteratePosts(result.feed.entry, callback);
      } else {
        callback(null);
      }
    }
    
    function iteratePosts(entriesFeed, callback) {
      let entries = [];
      
      if (settings.start == 1)
        settings.updatedPoint = entriesFeed[0].updated.$t;
        
      for (let e of entriesFeed) {
        let entry = {};
        for (let opt of option.getData) {
          readOpt(opt, entry, e);
        }
        entries.push(entry);
      }
    
      callback(entries);
      updateSetting(callback);
    }
    
    function isSkipStore(entry) {
      
      if (typeof(entry.category) != 'undefined') {
        
        for (let category of entry.category) {
          if (category.term == 'skip') {
            return true;
          }
        }
        
      }
      
      return false;
    }
    
    function readOpt(opt, entry, e) {
      switch (opt) {
        case 'link':
          for (let link of e[opt]) {
            if (link.rel == 'alternate') {
              entry[opt] = link.href;
              break;
            }
          }
          break;
        case 'id':
          entry[opt] = e[opt].$t.split('post-')[1];
          break;
        default:
          entry[opt] = e[opt].$t;
      }
    }
    
    function updateSetting(callback) {
      if (settings.start < settings.end) {
        settings.start++;
        saveSettings(function() {
          getUpdate(callback);
        });
      } else {
        settings.start = '1';
        settings.end = 'unknown';
        settings.updated = new Date(new Date(settings.updatedPoint).getTime()+1).toISOString();
        saveSettings(function() {
          getUpdate(callback);
        });
      }
    }
    
    function updateCallback(result) {
      if (result === null) {
        checkIntegrity();
      } else {
        let transaction = _.db.transaction([_.objStoreName], 'readwrite');
        let objStore  = transaction.objectStore(_.objStoreName);
        let request = objStore.get('posts');
        request.onsuccess = (e) => ongetposts(e, result);
      }
    }
    
    function ongetposts(event, result) {
      let res = event.target.result;
      let posts = (res === undefined) ? {} : res.data;
      for (let data of result) {
        let postData = {
          title: data.title,
          link: data.link,
        };
        if (posts[data.id] === undefined)
          SELF.posts.push(postData);
        posts[data.id] = postData;
      }
      let transaction = _.db.transaction([_.objStoreName], 'readwrite');
      let objStore  = transaction.objectStore(_.objStoreName);
      let request = objStore.put({type:'posts',data:posts});
      request.onsuccess = (e) => onstore(e);
    }
    
    function onstore(event) {
      let transaction = _.db.transaction([_.objStoreName], 'readwrite');
      let objStore  = transaction.objectStore(_.objStoreName);
      let request = objStore.get('posts');
      request.onsuccess = (e) => onget(e);
    }
    
    function onget(event) {
      SELF.posts.length = 0;
      let res = event.target.result;
      if (res !== undefined) {
        for (let key in res.data) {
          SELF.posts.push(res.data[key]);
        } 
      }
    }
    
    function clearData() {
      return new Promise(resolve => {
        let transaction = _.db.transaction([_.objStoreName], "readwrite");
        let objectStore = transaction.objectStore(_.objStoreName);
        let objectStoreRequest = objectStore.clear();
        objectStoreRequest.onsuccess = function(event) {
          resolve();
        };
      });
    }
    
    function checkIntegrity() {
      let URL = `https://www.blogger.com/feeds/${_.blogId}/posts/summary/-/${local.searchHintLabelName}?alt=json&max-results=0&orderby=updated&rand=${(new Date()).getTime()}`;
      const request = new XMLHttpRequest();
      request.open('GET', URL);
      request.onload = (e) => onloadrequest(e);
      request.onerror = () => {};
      request.send();
    }
    
    function onloadrequest(e) { 
      let request = e.target;
      const result = JSON.parse(request.responseText);
      let totalPublished = parseInt(result.feed.openSearch$totalResults.$t);
      if (SELF.posts.length != totalPublished) {
        settings = {
          start: '1',
          end: 'unknown',
          updatedPoint: (new Date(0)).toISOString(),
          updated: (new Date(0)).toISOString(),
        };
        clearData().then(() => {
          getUpdate(updateCallback);
        });
      }
    }
    
    function checkUpdate() {
      let transaction = _.db.transaction([_.objStoreName], 'readwrite')
      let objStore  = transaction.objectStore(_.objStoreName);
      let request = objStore.get('settings');
      request.onsuccess = (e) => ongetsetting(e);
    }
    
    function ongetsetting(event) {
      let res = event.target.result;
      if (res === undefined) {
        getUpdate(updateCallback);
      } else {
        settings = res.data;
        getUpdate(updateCallback);
      }
    }
    
    SELF.init = function() {
      
      if (!window.indexedDB) {
        return;
      }
      
      function onsuccess(event) {
        _.db = event.target.result;
        initPosts()
      }
      
      function onupgradeneeded(event) {
        _.db = event.target.result;
        let objectStore = _.db.createObjectStore(_.objStoreName, { keyPath: "type" });
      }
      
      function initPosts() {
        let transaction = _.db.transaction([_.objStoreName], 'readwrite')
        let objStore  = transaction.objectStore(_.objStoreName);
        let request = objStore.get('posts');
        request.onsuccess = (e) => ongetposts(e);
        checkUpdate();
      }
      
      function ongetposts(event) {
        let res = event.target.result;
        if (res != undefined) {
          for (let key in res.data) {
            SELF.posts.push(res.data[key]);
          } 
        }
      }
      
      let DBOpenRequest = window.indexedDB.open(_.idbName, _.idbVersion);
      DBOpenRequest.onsuccess = (e) => onsuccess(e);
      DBOpenRequest.onupgradeneeded = (e) => onupgradeneeded(e);
    }
    
    return SELF;
  }
  
  return BlogFeeds;
  
})();