/*! <![CDATA[ */

(function() {
  
  let $ = (selector, node = document) => node.querySelectorAll(selector);
  let version = Math.floor(1);
  let templateId = `paco-live-html-v${version}`;
  
  class CustomElement extends HTMLElement {
    
    constructor() {
      super();
      this.rootTable = this.findRootTableNode();
      let fragment = document.createDocumentFragment();
      this.attachShadow({mode: 'open'}).append(fragment);
    }
    
    connectedCallback() {
      let waitInterval = window.setInterval(() => {
        if (this.rootTable === null) {
          this.rootTable = this.findRootTableNode();
        } else {
          window.clearInterval(waitInterval);
          
          // this.style.display = 'block';
          
          this.init();
        }
      }, 100);
    }
    
    init() {
      let pre = $('pre', this)[0];
      // let node = document.createElement('div');
      // node.setAttribute('style', 'border:0;width:100%;height:100%')
      // node.innerHTML = this.decodeHtml(pre.innerHTML);
      
      let node = document.createElement('iframe');
      // node.setAttribute('style', 'border:0;width:100%;height:100%')
      node.src = URL.createObjectURL(new Blob([this.decodeHtml(pre.innerHTML)], {type: 'text/html'}));
      $('td',this.rootTable)[1].append(node);
      // pre.parentNode.insertBefore(node, pre);
      // this.shadowRoot.append(node)
    }
    
    decodeHtml(html) {
      var txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    }
    
    findRootTableNode() {
      let node = this;
      let retry = 5;
      while (node.parentNode && retry > 0) {
        if (node.dataset.type == templateId) {
          return node;
        }
        node = node.parentNode;
        retry--;
      }
      return null;
    }
    
  }
  
  customElements.define(templateId, CustomElement);
  
})();

/*! ]]> */