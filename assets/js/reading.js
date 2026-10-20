/* Optional reading tools. A click saves a chapter and its current section on this device only.
   No requests, identities, timestamps, notes, or visit history. */
(function () {
  'use strict';
  /* Reading appearance is transient; no preference or reading activity is stored. */
  var prose = document.querySelector('.reader-prose');
  if (prose) {
    // Print source context with the passage, then restore the reader's disclosures.
    var printNotes = null;
    window.addEventListener('beforeprint', function () {
      if (printNotes) return;
      printNotes = Array.from(prose.querySelectorAll('.reader-source-notes')).map(function (note) {
        var state = {note: note, open: note.open};
        note.open = true;
        return state;
      });
    });
    window.addEventListener('afterprint', function () {
      if (!printNotes) return;
      printNotes.forEach(function (state) { state.note.open = state.open; });
      printNotes = null;
    });
    if ('IntersectionObserver' in window) {
      var contentsLinks = Array.from(document.querySelectorAll('.reader-margin > a[href^="#"]'));
      var sectionObserver = new IntersectionObserver(function (entries) {
        if (document.body.classList.contains('reading-guided')) return;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || printNotes) return;
          rememberPlace(entry.target.id, false);
          contentsLinks.forEach(function (link) {
            if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        });
      }, {rootMargin: '-20% 0px -65% 0px', threshold: 0});
      prose.querySelectorAll('.reader-section[id]').forEach(function (section) { sectionObserver.observe(section); });
    }
  }
  var comfort = document.querySelector('[data-reading-comfort]');
  var focusButton = document.querySelector('[data-reading-focus]');
  var focusBar = document.querySelector('[data-focus-bar]');
  if (focusButton && focusBar) {
    var exitFocus = focusBar.querySelector('[data-focus-exit]');
    function setFocus(active) {
      document.body.classList.toggle('reading-focused', active);
      focusButton.setAttribute('aria-pressed', String(active));
      focusButton.textContent = active ? 'Exit reading focus' : 'Focus on this reading';
      focusBar.hidden = !active;
      // Focus always moves to a visible control; Escape offers the same exit.
      (active ? exitFocus : focusButton).focus({preventScroll: true});
    }
    focusButton.addEventListener('click', function () { setFocus(!document.body.classList.contains('reading-focused')); });
    exitFocus.addEventListener('click', function () { setFocus(false); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && document.body.classList.contains('reading-focused')) {
        event.preventDefault();
        setFocus(false);
      }
    });
  }
  if (prose && comfort) {
    comfort.hidden = false;
    comfort.querySelectorAll('[data-reading-size]').forEach(function (button) {
      button.addEventListener('click', function () {
        var large = button.dataset.readingSize === 'large';
        prose.dataset.readingSize = large ? 'large' : 'standard';
        comfort.querySelectorAll('[data-reading-size]').forEach(function (choice) {
          choice.setAttribute('aria-pressed', String(choice === button));
        });
        comfort.querySelector('[data-reading-size-status]').textContent = large ? 'Larger reading text selected for this page.' : 'Standard reading text restored.';
      });
    });
  }
  var key = 'ii-saved-readings-v1';
  var placeKey = 'ii-reading-places-v1';
  var places = {}, undo = null;
  var sectionIds = ['received', 'lived', 'passed-on'];
  var sectionNames = ['Source and context', 'Reflection and optional practice', 'Keep the reference'];
  var currentSection = sectionIds.indexOf(location.hash.slice(1)) >= 0 ? location.hash.slice(1) : 'received';
  var currentGuided = new URLSearchParams(location.search).get('mode') === 'guided';
  var chapters = window.II_READINGS || {};
  var saved = [];
  var mounts = Array.from(document.querySelectorAll('[data-saved-chapters]'));
  var buttons = Array.from(document.querySelectorAll('[data-save-chapter]'));

  function clean(value) {
    return Array.isArray(value) ? value.filter(function (id, i, all) {
      return typeof id === 'string' && Object.prototype.hasOwnProperty.call(chapters, id) && all.indexOf(id) === i;
    }).slice(0, Object.keys(chapters).length) : [];
  }
  function read() {
    try { saved = clean(JSON.parse(localStorage.getItem(key) || '[]')); }
    catch (e) { saved = []; }
    places = {};
    try {
      var raw = JSON.parse(localStorage.getItem(placeKey) || '{}');
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) saved.forEach(function (id) {
        var place = raw[id];
        if (place && sectionIds.indexOf(place.section) >= 0 && typeof place.guided === 'boolean') {
          places[id] = {section: place.section, guided: place.guided};
        }
      });
    } catch (e) { places = {}; }
  }
  function announce(message) {
    document.querySelectorAll('[data-reader-status]').forEach(function (el) { el.textContent = message; });
  }
  function rememberPlace(section, guided) {
    if (sectionIds.indexOf(section) < 0) return;
    currentSection = section; currentGuided = guided;
    read();
    var button = buttons[0], id = button && button.dataset.saveChapter;
    if (!id || saved.indexOf(id) < 0) return;
    if (places[id] && places[id].section === section && places[id].guided === guided) return true;
    places[id] = {section: section, guided: guided};
    try { localStorage.setItem(placeKey, JSON.stringify(places)); return true; }
    catch (e) { announce('Your bookmark is kept, but this browser could not update your place.'); return false; }
  }
  document.addEventListener('reading:place', function (event) {
    if (event.detail) rememberPlace(event.detail.section, event.detail.guided);
  });
  function removeSaved(ids) {
    read();
    var previous = {saved: saved.slice(), places: Object.assign({}, places)};
    var next = saved.filter(function (id) { return ids.indexOf(id) < 0; });
    try {
      if (next.length) localStorage.setItem(key, JSON.stringify(next));
      else localStorage.removeItem(key);
      saved = next;
      // Orphaned places never render; removing a bookmark also removes its position.
      ids.forEach(function (id) { delete places[id]; });
      try {
        if (Object.keys(places).length) localStorage.setItem(placeKey, JSON.stringify(places));
        else localStorage.removeItem(placeKey);
      } catch (e) { /* Invalid orphan positions are ignored on the next read. */ }
      undo = previous; render();
      announce('Bookmark removed. You can undo this change.');
      var target = document.querySelector('[data-undo-saved]');
      if (target) target.focus({preventScroll: true});
    } catch (e) { announce('This browser could not clear the bookmarks. Try clearing site data in your browser settings.'); }
  }
  function render() {
    document.querySelectorAll('[data-bookmark-control]').forEach(function (control) { control.hidden = false; });
    buttons.forEach(function (button) {
      var active = saved.indexOf(button.dataset.saveChapter) !== -1;
      button.setAttribute('aria-pressed', String(active));
      button.textContent = active ? 'Saved · Remove bookmark' : 'Save this reading';
    });
    document.querySelectorAll('[data-saved-shortcut]').forEach(function (link) { link.hidden = false; });
    mounts.forEach(function (mount) {
      mount.hidden = false;
      var empty = mount.querySelector('[data-saved-empty]');
      if (empty) empty.hidden = !!saved.length;
      var list = mount.querySelector('[data-saved-list], [data-saved-chapters-list]');
      if (list) {
        list.replaceChildren();
        saved.forEach(function (id) {
          var item = document.createElement('li'), link = document.createElement('a');
          var title = document.createElement('h3'), context = document.createElement('p');
          var actions = document.createElement('div'), remove = document.createElement('button');
          var place = places[id];
          title.textContent = chapters[id];
          context.className = 'saved-place';
          context.textContent = place ? sectionNames[sectionIds.indexOf(place.section)] : 'Ready when you are';
          link.href = '/quran/read/' + `${id}/` + (place ? (place.guided ? '?mode=guided' : '') + '#' + place.section : '');
          link.textContent = place ? 'Continue reading' : 'Open reading';
          link.setAttribute('aria-label', link.textContent + ': ' + chapters[id]);
          link.className = 'saved-resume';
          remove.type = 'button'; remove.textContent = 'Remove';
          remove.setAttribute('aria-label', 'Remove' + ': ' + chapters[id]);
          remove.addEventListener('click', function () { removeSaved([id]); });
          actions.className = 'saved-item-actions'; actions.append(link, remove);
          item.append(context, title, actions); list.appendChild(item);
        });
      }
      var clear = mount.querySelector('[data-clear-chapters]');
      if (clear) { clear.hidden = !saved.length; clear.disabled = !saved.length; }
      var undoButton = mount.querySelector('[data-undo-saved]');
      if (undoButton) undoButton.hidden = !undo;
    });
  }
  read();
  buttons.forEach(function (button) {
    var id = button.dataset.saveChapter;
    if (!Object.prototype.hasOwnProperty.call(chapters, id)) return;
    button.hidden = false;
    button.addEventListener('click', function () {
      read();
      var removing = saved.indexOf(id) !== -1;
      var next = removing ? saved.filter(function (value) { return value !== id; }) : saved.concat(id);
      try {
        localStorage.setItem(key, JSON.stringify(next)); saved = next;
        if (removing) {
          delete places[id];
          try { localStorage.setItem(placeKey, JSON.stringify(places)); } catch (e) {}
        } else {
          var placeSaved = rememberPlace(currentSection, currentGuided);
        }
        render();
        if (removing) announce('Bookmark removed from this browser.');
        else if (placeSaved) announce('Saved only in this browser. Return from Your saved readings.');
      } catch (e) {
        render(); announce('This browser could not save the reading. You can use your browser’s bookmark feature instead.');
      }
    });
  });
  document.querySelectorAll('[data-clear-chapters]').forEach(function (button) {
    button.addEventListener('click', function () { read(); removeSaved(saved.slice()); });
  });
  document.querySelectorAll('[data-undo-saved]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (!undo) return;
      read();
      var restored = clean(saved.concat(undo.saved));
      var restoredPlaces = Object.assign({}, undo.places, places);
      try {
        localStorage.setItem(key, JSON.stringify(restored));
        localStorage.setItem(placeKey, JSON.stringify(restoredPlaces));
        saved = restored; places = restoredPlaces; undo = null; render();
        announce('Your saved readings have been restored.');
        var first = document.querySelector('.saved-resume');
        if (first) first.focus({preventScroll: true});
      } catch (e) { announce('This browser could not restore your saved readings.'); }
    });
  });
  addEventListener('storage', function (event) {
    if (event.key === key || event.key === placeKey || event.key === null) { read(); render(); }
  });
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var previous = document.activeElement, area = document.createElement('textarea');
      area.value = text; area.readOnly = true; area.setAttribute('aria-label', 'Reading link');
      area.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(area); area.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('Copy unavailable')); }
      catch (e) { reject(e); }
      area.remove(); if (previous && previous.focus) previous.focus();
    });
  }
  document.querySelectorAll('[data-copy-chapter]').forEach(function (button) {
    button.hidden = false;
    button.addEventListener('click', function () {
      // Preview links stay on the preview; never advertise a draft at production.
      var url = location.origin + location.pathname;
      copy(url).then(function () {
        announce('Reading link copied. This draft link works where the preview is accessible.');
      }, function () { announce('Copy is unavailable. Copy this page’s address from your browser instead.'); });
    });
  });
  document.querySelectorAll('[data-print-chapter]').forEach(function (button) {
    button.hidden = false;
    button.addEventListener('click', function () { window.print(); });
  });
  render();
})();
