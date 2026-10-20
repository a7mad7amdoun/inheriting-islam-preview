/* A voluntary reading sequence. All text is present without JavaScript.
   No requests, timers, storage, saved answers or completion scoring. */
(function () {
  'use strict';
  var filters = document.querySelector('[data-reading-filter]');
  if (filters) {
    var entries = Array.from(document.querySelectorAll('[data-reading-kind]'));
    var choices = Array.from(filters.querySelectorAll('[data-reading-kind-filter]'));
    filters.hidden = false;
    choices.forEach(function (choice) {
      choice.addEventListener('click', function () {
        var total = 0;
        entries.forEach(function (entry) {
          entry.hidden = choice.dataset.readingKindFilter !== 'all' && entry.dataset.readingKind.split(' ').indexOf(choice.dataset.readingKindFilter) === -1;
          if (!entry.hidden) total++;
        });
        choices.forEach(function (button) { button.setAttribute('aria-pressed', String(button === choice)); });
        filters.querySelector('[data-reading-filter-status]').textContent = total + (total === 1 ? ' reading' : ' readings');
      });
    });
  }
  var session = document.querySelector('[data-reading-session]');
  if (!session) return;
  var ids = ['received', 'lived', 'passed-on'];
  var sections = ids.map(function (id) { return document.getElementById(id); });
  if (sections.some(function (section) { return !section; })) return;
  var toggle = session.querySelector('[data-guided-toggle]');
  var navigation = session.querySelector('[data-guided-navigation]');
  var steps = Array.from(session.querySelectorAll('[data-guided-step]'));
  var footer = document.querySelector('[data-guided-footer]');
  var previous = footer.querySelector('[data-guided-previous]');
  var next = footer.querySelector('[data-guided-next]');
  var finish = footer.querySelector('[data-guided-finish]');
  var names = ['Source and context', 'Reflection and optional practice', 'Keep the reference'];
  var guided = false, current = 0, printing = false;
  function fromHash() {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return 0; }
    var target = document.getElementById(id);
    var index = sections.findIndex(function (section) { return section === target || section.contains(target); });
    return index < 0 ? 0 : index;
  }
  function show(index, moveFocus) {
    current = Math.max(0, Math.min(index, sections.length - 1));
    document.body.classList.toggle('reading-guided', guided);
    navigation.hidden = !guided;
    footer.hidden = !guided;
    sections.forEach(function (section, i) { section.hidden = guided && !printing && i !== current; });
    steps.forEach(function (button, i) {
      if (guided && i === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    document.querySelectorAll('.reader-margin > a[href^="#"]').forEach(function (link) {
      if (guided && link.getAttribute('href') === '#' + ids[current]) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    toggle.setAttribute('aria-pressed', String(guided));
    toggle.textContent = guided ? 'Read the whole chapter' : 'Read step by step';
    previous.disabled = current === 0;
    next.hidden = current === sections.length - 1;
    finish.hidden = current !== sections.length - 1;
    next.textContent = current === 0 ? 'Continue to reflection →' : 'Carry it forward →';
    session.querySelector('[data-guided-status]').textContent = guided ? 'Step ' + (current + 1) + ' of 3 · ' + names[current] : '';
    if (moveFocus) {
      var heading = sections[current].querySelector('h2');
      heading.setAttribute('tabindex', '-1');
      heading.focus({preventScroll: true});
      if (heading.scrollIntoView) heading.scrollIntoView({block: 'start', behavior: 'auto'});
    }
  }
  toggle.addEventListener('click', function () {
    guided = !guided;
    if (guided) show(fromHash(), true);
    else {
      show(current, false);
      toggle.focus({preventScroll: true});
      // The URL may have explicitly requested a guided entrance; exit should survive reload.
      var url = new URL(location.href);
      if (url.searchParams.get('mode') === 'guided') {
        url.searchParams.delete('mode');
        history.replaceState(history.state, '', url.href);
      }
    }
  });
  steps.forEach(function (button, index) { button.addEventListener('click', function () { show(index, true); }); });
  previous.addEventListener('click', function () { show(current - 1, true); });
  next.addEventListener('click', function () { show(current + 1, true); });
  document.querySelectorAll('.reader-margin > a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () { if (guided) show(ids.indexOf(link.hash.slice(1)), false); });
  });
  window.addEventListener('hashchange', function () { if (guided) show(fromHash(), false); });
  window.addEventListener('beforeprint', function () { printing = true; sections.forEach(function (section) { section.hidden = false; }); });
  window.addEventListener('afterprint', function () { printing = false; show(current, false); });
  session.hidden = false;
  guided = new URLSearchParams(location.search).get('mode') === 'guided';
  show(fromHash(), false);
})();
