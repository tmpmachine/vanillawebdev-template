export { loadScripts };

function loadScripts(components, opt) {
  let loadIndex = -1;
  let basePath = opt?.basePath ?? '';
  loadComponents(components, loadIndex, basePath);
}

function loadComponents(components, index, basePath) {
  if (index >= 0 && components[index].callback) {
    components[index].callback();
  }
  index++;
  if (index < components.length) {
    loadExternalFiles(components[index].urls, basePath).then(() => {
      loadComponents(components, index, basePath);
    });
  }
}

function requireExternalFiles(url) {
  return new Promise((resolve, reject) => {
    let el;
    el = document.createElement('script');
    el.setAttribute('src', url);
    el.setAttribute('async', true);
    el.onload = () => resolve(url);
    el.onerror = () => reject(url);
    document.head.appendChild(el);
  });
}

function loadExternalFiles(URLs, basePath) {
  return new Promise(resolve => {
    let bundleURL = [];
    for (let URL of URLs) {
      bundleURL.push(requireExternalFiles(basePath + URL));
    }
    Promise.all(bundleURL).then(() => {
      resolve();
    }).catch(error => {
      console.log(error);
      console.log('Could not load one or more required file(s).');
    });
  });
}