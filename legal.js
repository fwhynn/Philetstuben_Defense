'use strict';
// Legal pages opened from the game come up in their own tab (?from=game). "Zum Spiel"
// closes that tab instead of loading a second copy of the game; links between the legal
// pages replace the history entry so the tab stays closable by script.
function initLegalPage(win) {
  const doc = win.document;
  if (new URLSearchParams(win.location.search).get('from') !== 'game') return;
  const plainClick = event => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
  for (const link of doc.querySelectorAll('a[href$="impressum.html"], a[href$="datenschutz.html"]')) {
    link.addEventListener('click', event => {
      if (!plainClick(event)) return;
      event.preventDefault();
      win.location.replace(link.getAttribute('href') + '?from=game');
    });
  }
  const back = doc.querySelector('[data-back-to-game]');
  back?.addEventListener('click', event => {
    if (!plainClick(event)) return;
    event.preventDefault();
    win.close();
    // Browsers that refuse to close the tab fall back to the normal link.
    win.setTimeout(() => { if (!win.closed) win.location.href = back.getAttribute('href'); }, 200);
  });
}
if (typeof module === 'object' && module.exports) module.exports = { initLegalPage };
else initLegalPage(window);
