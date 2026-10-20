/* Optional reading tools. A click stores chapter IDs on this device only.
   No requests, identities, timestamps, notes, or background reading history. */
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
          if (!entry.isIntersecting) return;
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
  var chapters = window.II_READINGS || {};
  var saved = [];
  var mounts = Array.from(document.querySelectorAll('[data-saved-chapters]'));
  var buttons = Array.from(document.querySelectorAll('[data-save-chapter]'));
  var revealed = false;
  function clean(value) {
    return Array.isArray(value) ? value.filter(function (id, i, all) {
      return typeof id === 'string' && Object.prototype.hasOwnProperty.call(chapters, id) && all.indexOf(id) === i;
    }).slice(0, Object.keys(chapters).length) : [];
  }
  function read() {
    try { saved = clean(JSON.parse(localStorage.getItem(key) || '[]')); }
    catch (e) { saved = []; }
  }
  function announce(message) {
    document.querySelectorAll('[data-reader-status]').forEach(function (el) { el.textContent = message; });
  }
  function render() {
    buttons.forEach(function (button) {
      var active = saved.indexOf(button.dataset.saveChapter) !== -1;
      button.setAttribute('aria-pressed', String(active));
      button.textContent = active ? 'Saved · Remove bookmark' : 'Save this reading';
    });
    mounts.forEach(function (mount) {
      mount.hidden = !saved.length && !revealed;
      var list = mount.querySelector('[data-saved-list], [data-saved-chapters-list]');
      if (list) {
        list.replaceChildren();
        saved.forEach(function (id) {
          var item = document.createElement('li'), link = document.createElement('a');
          link.href = '/quran/read/' + id + '/'; link.textContent = chapters[id];
          item.appendChild(link); list.appendChild(item);
        });
      }
      var clear = mount.querySelector('[data-clear-chapters]');
      if (clear) { clear.hidden = !saved.length; clear.disabled = !saved.length; }
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
        localStorage.setItem(key, JSON.stringify(next)); saved = next; render();
        announce(removing ? 'Bookmark removed from this browser.' : 'Saved only in this browser. You can return from the reading desk.');
      } catch (e) {
        render(); announce('This browser could not save the reading. You can use your browser’s bookmark feature instead.');
      }
    });
  });
  document.querySelectorAll('[data-clear-chapters]').forEach(function (button) {
    button.addEventListener('click', function () {
      try {
        localStorage.removeItem(key); saved = []; revealed = true; render();
        announce('Your saved chapters have been cleared from this browser.');
        var mount = button.closest('[data-saved-chapters]');
        var target = mount && mount.querySelector('[data-reader-status]');
        if (target) { target.tabIndex = -1; target.focus(); }
      } catch (e) { announce('This browser could not clear the bookmarks. Try clearing site data in your browser settings.'); }
    });
  });
  addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) { read(); render(); }
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
