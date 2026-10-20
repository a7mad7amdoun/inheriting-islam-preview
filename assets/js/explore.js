/* Filter the rendered directory. No requests, storage, query URLs, or accounts. */
(function () {
  'use strict';
  var controls = document.querySelector('[data-explore-controls]');
  if (!controls) return;
  var input = document.getElementById('house-query');
  var category = document.getElementById('house-category');
  var entries = Array.from(document.querySelectorAll('.explore-entry'));
  var count = document.querySelector('[data-explore-count]');
  var empty = document.querySelector('[data-explore-empty]');
  var shortcuts = Array.from(document.querySelectorAll('[data-explore-category]'));
  function normalize(value) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '')
      .replace(/[’'ʿʻ‘ʼ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }
  var searchable = entries.map(function (entry) { return normalize(entry.dataset.search); });
  function update() {
    var words = normalize(input.value).split(/\s+/).filter(Boolean);
    var total = 0;
    entries.forEach(function (entry, index) {
      var match = (category.value === 'all' || entry.dataset.category === category.value) && words.every(function (word) { return searchable[index].includes(word); });
      entry.hidden = !match;
      if (match) total++;
    });
    count.textContent = total + (total === 1 ? ' resource' : ' resources') + (words.length || category.value !== 'all' ? ' found' : '');
    empty.hidden = total !== 0;
    shortcuts.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.exploreCategory === category.value));
    });
  }
  controls.hidden = false;
  input.addEventListener('input', update);
  category.addEventListener('change', update);
  shortcuts.forEach(function (button) {
    button.addEventListener('click', function () {
      input.value = ''; category.value = button.dataset.exploreCategory; update();
    });
  });
  document.querySelectorAll('[data-explore-reset]').forEach(function (button) {
    button.addEventListener('click', function () { input.value = ''; category.value = 'all'; update(); input.focus(); });
  });
  document.querySelectorAll('[data-explore-suggestion]').forEach(function (button) {
    button.addEventListener('click', function () { input.value = button.dataset.exploreSuggestion; category.value = 'all'; update(); input.focus(); });
  });
  // Retain native search-field Escape behavior; only clear this field, never navigate.
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && input.value) { input.value = ''; update(); }
  });
  update();
})();
