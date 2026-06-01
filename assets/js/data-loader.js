(async () => {
  'use strict';

  window.deckData = null;
  window.deckDataReady = new Promise((resolve, reject) => {
    fetch('assets/data/deck.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        window.deckData = data;
        document.dispatchEvent(new CustomEvent('deckdataready', { detail: data }));
        resolve(data);
      })
      .catch(err => {
        console.error('[data-loader] échec du chargement de deck.json :', err);
        reject(err);
      });
  });
})();
