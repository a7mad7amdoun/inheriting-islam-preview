/* Native links and disclosures remain useful without JavaScript. No tracking. */
(function () {
  'use strict';
  var index = document.querySelector('[data-book-index]');
  if (index && window.matchMedia) {
    var compact = matchMedia('(max-width: 760px)');
    var summary = index.querySelector('summary');
    var locationLabel = index.querySelector('[data-book-location]');
    var initial = locationLabel.textContent;
    var entries = Array.from(index.querySelectorAll('nav a[href*="#"]')).map(function (a) {
      var hash = new URL(a.href).hash;
      return {link:a, section:document.getElementById(decodeURIComponent(hash.slice(1))), label:a.textContent.trim().replace(/^\d+\s*/, '')};
    }).filter(function (entry) { return entry.section; });
    function arrange() {
      var active = document.activeElement;
      index.open = !compact.matches;
      if (!index.open && index.contains(active) && active !== summary) summary.focus({preventScroll:true});
    }
    arrange();
    compact.addEventListener('change', arrange);
    var pending = false;
    function mark() {
      pending = false;
      var header = document.getElementById('header');
      var edge = (header ? header.getBoundingClientRect().bottom : 0) + 100;
      var current = null;
      entries.forEach(function (entry) {
        if (entry.section.getClientRects().length && entry.section.getBoundingClientRect().top <= edge) current = entry;
      });
      entries.forEach(function (entry) {
        if (entry === current) entry.link.setAttribute('aria-current','location');
        else entry.link.removeAttribute('aria-current');
      });
      locationLabel.textContent = current ? current.label : initial;
    }
    function queue() { if (!pending) { pending = true; requestAnimationFrame(mark); } }
    document.addEventListener('scroll', queue, {passive:true,capture:true});
    window.addEventListener('resize', queue, {passive:true});
    window.addEventListener('pageshow', queue);
    entries.forEach(function (entry) {
      entry.link.addEventListener('click', function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (compact.matches) index.open = false;
        // Keep the native anchor behavior; move keyboard focus to its destination.
        requestAnimationFrame(function () {
          if (!entry.section.hasAttribute('tabindex')) entry.section.tabIndex = -1;
          entry.section.focus({preventScroll:true}); queue();
        });
      });
    });
    queue();
  }
  var panel = document.querySelector('[data-reading-origin-panel]');
  if (!panel) return;
  var slug = new URLSearchParams(location.search).get('reading');
  var origin = Array.from(panel.querySelectorAll('[data-reading-origin]')).find(function (a) { return a.dataset.readingOrigin === slug; });
  if (!origin) return;
  panel.querySelectorAll('[data-reading-origin]').forEach(function (a) { a.hidden = a !== origin; });
  panel.hidden = false;
  var message = document.getElementById('f-message');
  if (message && !message.value.trim()) message.value = origin.dataset.question + '\n\n' + origin.href;
})();
