/* A curated choice, never a profile. Static HTML contains every reading path. */
(function () {
  'use strict';
  var root = document.querySelector('[data-house-journal]');
  if (!root) return;
  var links = Array.from(root.querySelectorAll('[data-journal-choice]'));
  var panels = Array.from(root.querySelectorAll('[data-journal-panel]'));
  if (!links.length || links.length !== panels.length) return;
  function hashChoice() {
    var hash;
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch (_) { return null; }
    return panels.find(function (p) { return p.id === hash || p.contains(document.getElementById(hash)); });
  }
  function select(id, updateHistory) {
    if (!panels.some(function (p) { return p.dataset.journalPanel === id; })) return;
    links.forEach(function (link) {
      var active = link.dataset.journalChoice === id;
      link.setAttribute('aria-selected', String(active));
      link.tabIndex = active ? 0 : -1;
    });
    panels.forEach(function (panel) { panel.hidden = panel.dataset.journalPanel !== id; });
    if (updateHistory) {
      var url = new URL(location.href);
      url.hash = 'journal-' + id;
      history.pushState(history.state, '', url.href);
    }
  }
  root.querySelector('.journal-choices').setAttribute('role', 'tablist');
  links.forEach(function (link, index) {
    link.setAttribute('role', 'tab');
    link.setAttribute('aria-controls', 'journal-' + link.dataset.journalChoice);
    link.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); select(link.dataset.journalChoice, true);
    });
    link.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowRight') next = (index + 1) % links.length;
      else if (event.key === 'ArrowLeft') next = (index + links.length - 1) % links.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = links.length - 1;
      else if (event.key === ' ') { event.preventDefault(); select(link.dataset.journalChoice, true); return; }
      else return;
      event.preventDefault();
      select(links[next].dataset.journalChoice, true);
      links[next].focus({preventScroll:true});
    });
  });
  panels.forEach(function (panel) {
    panel.setAttribute('role','tabpanel');
    panel.setAttribute('aria-labelledby','journal-choice-' + panel.dataset.journalPanel);
    panel.tabIndex = 0;
  });
  function followLocation() {
    var panel = hashChoice();
    if (panel) select(panel.dataset.journalPanel, false);
    else if (!location.hash) select(links[0].dataset.journalChoice, false);
  }
  var first = hashChoice();
  select(first ? first.dataset.journalPanel : links[0].dataset.journalChoice, false);
  addEventListener('hashchange', followLocation);
  addEventListener('popstate', followLocation);
  var saved;
  addEventListener('beforeprint', function () {
    saved = panels.map(function (p) { return p.hidden; });
    panels.forEach(function (p) { p.hidden = false; });
  });
  addEventListener('afterprint', function () {
    if (saved) panels.forEach(function (p,i) { p.hidden = saved[i]; });
    saved = null;
  });
})();
