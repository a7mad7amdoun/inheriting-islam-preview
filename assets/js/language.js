/* Native links work without scripting. Preserve route state when switching. */
(function () {
 'use strict';
 var links = document.querySelectorAll('[data-language-link]');
 function sync() {
  links.forEach(function (link) {
   var target = new URL(link.dataset.languageLink, location.origin);
   target.search = location.search;
   target.hash = location.hash;
   link.href = target.pathname + target.search + target.hash;
  });
 }
 sync();
 addEventListener('hashchange', sync);
 links.forEach(function (link) { link.addEventListener('pointerdown', sync); link.addEventListener('focus', sync); });
})();
