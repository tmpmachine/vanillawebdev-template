let BlogSearch = window.BlogSearch = (function() {
  
  let $ = document.querySelector.bind(document);
  let $$ = document.querySelectorAll.bind(document);
  
  function BlogSearch(config) {
    
    let SELF = {
      haystack: config.haystack,
    };
    
    let index = 0;
    var wgSearchRes;
    let inputCheker = $('.screen-check-isMobileSearch');
    let inputDesktop = config.resultElDesktop;
    let inputMobile = config.resultElMobile;
    
    SELF.init = function() {
      config.inputEl.addEventListener('blur', (e) => blurSearchInput(e));
      config.inputEl.addEventListener('focus', focusInput);
      config.inputEl.addEventListener('keydown', () => wgSearch.selectHints());
      config.inputEl.addEventListener('input', (e) => { switchInput(); wgSearch.find(e.target.value); });
    };
    
    function switchInput() {
      if (inputCheker?.offsetHeight > 0) {
        config.resultEl = inputMobile;  
      }  else {
        config.resultEl = inputDesktop;  
      }
    }
    
    async function blurSearchInput(e) {
      switchInput();
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!(e.relatedTarget && e.relatedTarget.classList.contains('._searchHints')))  {
        if (inputCheker?.offsetHeight > 0) return;
        
        config.resultEl.style.display='none';
      }
    }
    
    function focusInput() {
      switchInput();
      document.body.classList.toggle('MS', true);
      config.resultEl.style.display='block';
    }
    
    function insertTemplate() {
      let index = this.dataset.index;
      let data = SELF.haystack[index];
      config.resultEl.innerHTML = '';
      toggleInsertSnippet();
      if (data.callback) {
        data.callback();
      } else {
        let curCol = fileTab[activeTab].editor.env.editor.getCursorPosition().column;
        fileTab[activeTab].editor.env.editor.insert(data.snippet);
        fileTab[activeTab].editor.env.editor.moveCursorToPosition({row:fileTab[activeTab].editor.env.editor.getCursorPosition().row+data.pos[0], column: curCol+data.pos[1]});
        fileTab[activeTab].editor.env.editor.focus();
      }
    }
    
    let wgSearch = {
      hints: [],
      pageId: '',
      keywords: [],
      match: function(value) {
        this.find.idx = -1;
    
        if (value.trim().length < 2) return [];
        var data = [];
        var extraMatch = [];
        value = value.replace(/-|,|'/g,'');
        for (var i=0,title,matchIdx,match=1,xmatch=1,wildChar,offset,creps; i<SELF.haystack.length; i++) {
          if (match > 10) break;
          titleOri = SELF.haystack[i].title;
          let link = SELF.haystack[i].link;
          title = titleOri.replace(/-|,|'/g,'');
          matchIdx = title.toLowerCase().indexOf(value.toLowerCase());
          if (matchIdx >= 0) {
            offset = 0;
            wildChar = titleOri.substr(matchIdx,value.length).match(/-|,|'/g);
            if (wildChar !== null)
              offset = wildChar.length;
            title = '<b>'+titleOri.substr(0,matchIdx)+'</b>'+titleOri.substr(matchIdx,value.length+offset)+'<b>'+titleOri.substr(matchIdx+value.length+offset)+'</b>';
            
            if (matchIdx === 0) {
                data.push({index:SELF.haystack[i].index,ori:titleOri.replace(/'/g,'!!!'),title:title,link:link});
                match++;
            } else {
                extraMatch.push({index:SELF.haystack[i].index,ori:titleOri.replace(/'/g,'!!!'),title:title,link:link});
                xmatch++;
            }
          }
        }
        if (match < 10) {
          for (var i=0; i<xmatch-1 && match<10; i++) {
            data.push(extraMatch[i]);
            match++;
          }
        }
        return data;
      },
      selectHints: function() {
        let hints = $$('._searchHints');
        if (hints.length === 0)
            return
        switch(event.keyCode) {
          case 27: // escape
            // document.activeElement.blur();
            break;
          case 13: // enter
            if (this.find.idx > -1) {
              event.preventDefault();
              hints[this.find.idx].click();
            }
          break;
          case 38: // up
            event.preventDefault();
            this.find.idx--;
            if (this.find.idx == -2) {
              this.find.idx = hints.length-1;
              hints[this.find.idx].classList.toggle('_selected');
            } else {
              hints[this.find.idx+1].classList.toggle('_selected');
              if (this.find.idx > -1 && this.find.idx < hints.length)
                hints[this.find.idx].classList.toggle('_selected');
            }
            return;
          break;
          case 40: // down
            this.find.idx++;
            if (this.find.idx == hints.length) {
              this.find.idx = -1;
              hints[hints.length-1].classList.toggle('_selected');
            } else {
              hints[this.find.idx].classList.toggle('_selected');
              if (this.find.idx > 0 && this.find.idx < hints.length)
                hints[this.find.idx-1].classList.toggle('_selected');
            }
            return;
          break;
        }
      },
      highlightHints: function() {
        let idx = Number(this.dataset.searchIndex);
        var hints = $$('._searchHints');
        for (var i=0; i<hints.length; i++) {
          if (i == idx)
            hints[i].classList.toggle('_selected',true);
          else
            hints[i].classList.toggle('_selected',false);
        }
        wgSearch.find.idx = idx;
      },
      displayResult: function(data) {
        config.resultEl.innerHTML = '';
        let i = 0;
        let fragmend = document.createDocumentFragment();
        for (let hint of data) {
          let tmp = config.resultTemplate.content.cloneNode(true);
          tmp.querySelector('._title').innerHTML = hint.title;
          tmp.querySelector('._title').href = hint.link;
          fragmend.appendChild(tmp);
          i++;
        }
        config.resultEl.appendChild(fragmend);
      },
      find: function(v) {
        clearTimeout(this.wait);
        this.v = v;
        
        if (this.v.trim().length < 2) {
          config.resultEl.innerHTML = '';
          return;
        }
        
        var data = wgSearch.match(this.v.toLowerCase());
        
        if (this.keywords.indexOf(v) < 0) {
          this.displayResult(data);
          this.keywords.push(v)
        }
        else if (data.length >= 0)
          this.displayResult(data);
        
      }
    };
    
    return SELF;
  }
  
  return BlogSearch;
  
})();