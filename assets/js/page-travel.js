/* Prepare a quiet mobile arrival before the content's first paint. */
(function () {
  'use strict';
  var root = document.documentElement;
  function calm() {
    var saved = false;
    try { saved = localStorage.getItem('ii-motion') === 'calm'; } catch (e) {}
    return saved || root.dataset.motion === 'calm' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  var entry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (innerWidth <= 1000 && !calm() && !(entry && entry.type === 'back_forward')) root.dataset.pageArrival = 'true';
  addEventListener('pagereveal', function (event) {
    if (event.viewTransition && (innerWidth <= 1000 || calm())) event.viewTransition.skipTransition();
  });
  // Cached history returns keep their original scroll position without replaying motion.
  addEventListener('pageshow', function (event) {
    if (event.persisted) delete root.dataset.pageArrival;
  });
  addEventListener('pagehide', function () { delete root.dataset.pageArrival; });
})();
