/* Runs in the head before the first render, so no arriving transition is missed. */
(function () {
  'use strict';
  var active = null;
  var root = document.documentElement;
  addEventListener('pagereveal', function (event) {
    var transition = event.viewTransition;
    if (!transition) return;
    if (root.dataset.motion === 'calm' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      transition.skipTransition(); return;
    }
    if (innerWidth > 1000) return;
    active = transition;
    root.dataset.pageTravel = 'arriving';
    function finish() {
      if (active === transition) active = null;
      root.dataset.pageTravel = 'complete';
    }
    if (transition.finished) transition.finished.then(finish, finish);
  });
  function interrupt() {
    if (!active) return;
    active.skipTransition(); active = null;
  }
  document.addEventListener('pointerdown', interrupt, {capture:true,passive:true});
  document.addEventListener('click', interrupt, true);
  document.addEventListener('keydown', interrupt, true);
})();
