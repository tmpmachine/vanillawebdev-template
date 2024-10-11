/*! <![CDATA[ */

(function(w, d) {
  'use strict';

  let _containerEl = d;
  if(w.hljs) {
      w.hljs.highlightLinesAll = highlightLinesAll;
      w.hljs.highlightLinesElement = highlightLinesElement;

      /* deprecated */
      w.hljs.initHighlightLinesOnLoad = initHighlightLinesOnLoadWithDeprecated;
      w.hljs.highlightLinesCode = highlightLinesCodeWithDeprecated;
  }

  function highlightLinesAll(options, containerEl) {
      for(let i = 0; i < options.length; ++i) {
          for(let option of options[i]) {
              --option.start;
              --option.end;
          }
      }
      if (containerEl) {
        _containerEl = containerEl;
      }
      initHighlightLinesOnLoad(options);
  }

  let initHighlightLinesOnLoadWithDeprecatedCalled = false;
  function initHighlightLinesOnLoadWithDeprecated(options) {
      if(!initHighlightLinesOnLoadWithDeprecatedCalled) {
          console.log('hljs.initHighlightLinesOnLoad is deprecated. Please use hljs.highlightLinesAll');
          initHighlightLinesOnLoadWithDeprecatedCalled = true;
      }
      initHighlightLinesOnLoad(options);
  }

  function initHighlightLinesOnLoad(options) {
      function callHighlightLinesCode() {
          let codes = _containerEl.getElementsByClassName('hljs');
          for(let i = 0; i < codes.length; ++i) {
              highlightLinesCode(codes[i], options[i]);
          }
      }

      if(d.readyState !== 'loading') {
          callHighlightLinesCode();
      }
      else {
          w.addEventListener('DOMContentLoaded', function() {
              callHighlightLinesCode();
          });
      }
  }

  function highlightLinesElement(code, options, has_numbers) {
      for(let option of options) {
          --option.start;
          --option.end;
      }
      highlightLinesCode(code, options, has_numbers);
  }

  let highlightLinesCodeWithDeprecatedCalled = false;
  function highlightLinesCodeWithDeprecated(code, options, has_numbers) {
      if(!highlightLinesCodeWithDeprecatedCalled) {
          console.log('hljs.highlightLinesCode is deprecated. Please use hljs.highlightLinesElement');
          highlightLinesCodeWithDeprecatedCalled = true;
      }
      highlightLinesCode(code, options, has_numbers);
  }

  function highlightLinesCode(code, options, has_numbers) {
      function highlightLinesCodeWithoutNumbers() {
          code.innerHTML = code.innerHTML.replace(/([ \S]*\n|[ \S]*$)/gm, function(match) {
                  return '<div class="highlight-line">' + match + '</div>';
                  });

          if(options === undefined) {
              return;
          }
          let lines = code.getElementsByClassName('highlight-line');
          for(let option of options) {
              for(let j = option.start; j <= option.end; ++j) {
                  lines[j].classList.add(option.group)
              }
          }
      }
      function highlightLinesCodeWithNumbers() {
          let tables = code.getElementsByTagName('table');
          if(tables.length == 0) {
              if(count-- < 0) {
                  clearInterval(interval_id);
                  highlightLinesCodeWithoutNumbers();
              }
              return;
          }

          clearInterval(interval_id);

          let table = tables[0];
          table.style.width = '100%';
          let hljs_ln_numbers = table.getElementsByClassName('hljs-ln-numbers');
          for(let hljs_ln_number of hljs_ln_numbers) {
              hljs_ln_number.style.width = '2em';
          }

          if(options === undefined) {
              return;
          }
          let lines = code.getElementsByTagName('tr');
          for(let option of options) {
              for(let j = option.start; j <= option.end; ++j) {
                  lines[j].style.backgroundColor = option.color;
              }
          }
      }

      if(hljs.hasOwnProperty('initLineNumbersOnLoad') && has_numbers !== false) {
          let count = 100;
          let interval_id = setInterval(highlightLinesCodeWithNumbers, 100);
          return;
      }

      highlightLinesCodeWithoutNumbers();
  }

}(window, document));

(function() {
  
  let $ = (selector, node = document) => node.querySelectorAll(selector);
  let version = Math.floor(2.3);
  let templateId = `paco-code-block-v${version}`;
  
  class CustomElement extends HTMLElement {
    constructor(e) {
      super();
      this.extensions = {};
      this.options = [];
    }
    
    connectedCallback() {
      window.setTimeout(() => {
        this.rootTable = this.findRootTableNode();
        this.detectExtension();
        this.hightlight();
        if (!this.options.includes('no-copy'))
          this.initExtensions();
      });
    }
    
    detectExtension() {
      let extensions = $('template[name="ext-paco-block"]');
      for (let ext of extensions) {
        this.extensions[ext.dataset.id] = ext.content.cloneNode(true);
      }
    }
    
    hightlight() {
      let pre = $('pre', this)[0];
      let language = this.getLanguage();
      pre.innerHTML = '<code class="language-'+language+'">'+pre.innerHTML+'</code>';
      hljs.highlightElement(pre.firstElementChild);
      this.highlightLines();
    }
    
    highlightLines() {
      let highlightSettings = $('tr td', this.rootTable)[1];
      if (highlightSettings) {
        let options = [];
        let lines = highlightSettings.innerHTML.trim().replace(/ +/g,'').replace(/\n+/g,'\n').split('\n');
        for (let line of lines) {
          let group = line.split(':')[0];
          let lineSeries = line.split(':')[1].split(',');
          for (let series of lineSeries) {
            let start = window.parseInt(series);
            let end = start;
            if (series.includes('-')) {
              end = window.parseInt(series.split('-')[1]);
            }
            options.push({start, end, group});
          }
        }
        
        hljs.highlightLinesAll([
          options,
        ], this);
      }
    }
    
    initExtensions() {
      for (let key in this.extensions) {
        switch (key) {
          case 'copy':
            this.initControl(this.extensions[key]);
            break;
        }
      }
    }
    
    initControl(extNode) {
      if (this.rootTable) {
        this.notifNode = $('span', extNode)[0];
        $('button', extNode)[0].addEventListener('click', this.copySnippetCode.bind(this));
        
        this.rootTable.parentNode.insertBefore(extNode, this.rootTable);
      }
    }
              
    getLanguage() {
      let language = 'plaintext'
      if (this.rootTable) {
        let node = $('th', this.rootTable)[0];
        let definedLanguage = node.textContent.trim().split('|');
        let myLan = definedLanguage[0].trim();
        if (myLan.length > 0) {
          language = myLan;
        }
        if (definedLanguage[1]) {
          let opt = definedLanguage[1].trim().split(',');
          this.options = opt;
        }
      }
      return language;
    }
    
    findRootTableNode() {
      let node = this;
      let retry = 5;
      while (node.parentNode && retry > 0) {
        if (node.dataset.type == 'code') {
          let style = node.getAttribute('style');
          if (style) {
            style = style.replace('%px', '%').replace(/color:.*?;/, '')
            node.setAttribute('style', style); 
          }
          return node;
          break;
        }
        node = node.parentNode;
        retry--;
      }
      return null;
    }
    
    copySnippetCode() {
      let node  = document.createElement('textarea');
      node.value = this.textContent;
      document.body.append(node);
      node.select();
      node.setSelectionRange(0, node.value.length);
      document.execCommand("copy");
      node.remove();
      this.showCopyNotif();
    }
    
    showCopyNotif() {
      this.notifNode.style.display = 'block';
      window.clearTimeout(this.copyTimeout);
      this.copyTimeout = window.setTimeout(this.hideCopyNotif.bind(this), 1000);
    }
    
    hideCopyNotif() {
      let node = this.extensions['code'];
      this.notifNode.style.display = 'none';
    }
    
  }
  customElements.define(templateId, CustomElement);
})();

/*! ]]> */