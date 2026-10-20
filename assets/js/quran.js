/* Inheriting Qur'an — the only script the /quran/ pages add on top of site.js.
   Everything here is an enhancement: each page is complete and readable with
   JavaScript switched off. Nothing is fetched, nothing is stored, nothing is
   sent anywhere. */
(function () {
  'use strict';

  function moveTo(element) {
    if (!element) return;
    var reduced = document.documentElement.dataset.motion === 'calm' ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  function focusHeading(container) {
    var heading = container && container.querySelector('h2');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  /* Elements marked .js-only are the ones that would be useless without a
     script — a progress bar, a "start over" button. They are hidden in CSS and
     revealed here, so a no-JS visitor never sees a dead control. */
  document.querySelectorAll('.js-only').forEach(function (el) {
    el.classList.remove('js-only');
  });

  /* ==================================================================
     1 — The placement check  (/quran/start/)

     Five specimens, easiest first. "Yes" moves on; "not yet" stops and
     names the starting point. Answering yes to all five is its own
     outcome, and it is the honest one: this syllabus ends where you
     already are.

     With no JavaScript, every step and every outcome is simply on the
     page in order, which is a slower but perfectly usable version of
     the same thing.
     ================================================================== */
  var check = document.querySelector('[data-check]');
  if (check) {
    check.classList.add('check-enhanced');
    var steps = Array.prototype.slice.call(check.querySelectorAll('[data-step]'));
    var results = Array.prototype.slice.call(document.querySelectorAll('[data-result]'));
    var resultsWrap = document.getElementById('results');
    var resultsBand = document.getElementById('results-band');
    var checkBand = document.getElementById('check-section');
    var intro = document.getElementById('results-intro');
    /* The progress line is a sibling of [data-check], not a child of it —
       query the document, not the check. */
    var bar = document.querySelector('[data-bar]');
    var count = document.querySelector('[data-count]');
    var total = steps.length;

    var show = function (i, focus) {
      steps.forEach(function (s, n) { s.hidden = n !== i; });
      if (bar) bar.style.width = (i / total * 100) + '%';
      if (count) count.textContent = 'Step ' + (i + 1) + ' of ' + total;
      if (focus && steps[i]) focusHeading(steps[i]);
    };

    /* Once an answer lands, the questions go away entirely rather than
       collapsing to an empty band with a stale progress line above it. */
    var settle = function (n) {
      steps.forEach(function (s) { s.hidden = true; });
      results.forEach(function (r) { r.hidden = String(n) !== r.getAttribute('data-result'); });
      if (bar) bar.style.width = '100%';
      if (count) count.textContent = 'Where you start';
      if (intro) intro.hidden = true;
      if (checkBand) checkBand.hidden = true;
      if (resultsBand) resultsBand.hidden = false;
      if (resultsWrap) {
        resultsWrap.hidden = false;
        focusHeading(results.find(function (r) { return !r.hidden; }));
        moveTo(resultsWrap);
      }
    };

    var restart = function () {
      results.forEach(function (r) { r.hidden = true; });
      if (resultsWrap) resultsWrap.hidden = true;
      if (resultsBand) resultsBand.hidden = true;
      if (checkBand) checkBand.hidden = false;
      show(0, true);
      moveTo(check);
    };

    /* The whole outcomes band goes away until an answer produces one. Without
       JavaScript it stays exactly where it is — five steps followed by six
       outcomes, in order, which is the same information more slowly. The
       intro paragraph explains that, so it is only ever shown to a no-JS
       visitor. */
    results.forEach(function (r) { r.hidden = true; });
    if (resultsWrap) resultsWrap.hidden = true;
    if (resultsBand) resultsBand.hidden = true;
    if (intro) intro.hidden = true;
    show(0);

    check.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-answer]');
      if (!btn) return;
      var i = steps.indexOf(btn.closest('[data-step]'));
      if (i < 0) return;
      if (btn.getAttribute('data-answer') === 'no') { settle(i + 1); return; }
      if (i + 1 < total) { show(i + 1, true); moveTo(check); }
      else { settle(total + 1); }
    });

    // The contents link remains useful after the questions have been hidden.
    document.querySelectorAll('.study-contents a[href="#check-section"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (checkBand && checkBand.hidden) { event.preventDefault(); restart(); }
      });
    });

    document.querySelectorAll('[data-restart]').forEach(function (b) {
      b.addEventListener('click', restart);
    });
  }

  /* ==================================================================
     2 — The letters  (/quran/lesson/)

     Tap a letter, read its name and where in the mouth it is made. The
     grid itself is in the HTML; this only fills the panel beside it.
     The makhraj descriptions follow the classical seventeen points,
     grouped into the five zones set out on the page.
     ================================================================== */
  var LETTERS = [
    ['ا', 'alif', 'ā', 'The empty space', 'A carrier rather than a sound of its own — it lengthens the fatḥah before it. The hamzah ء it often sits under is made at the deepest part of the throat.'],
    ['ب', 'bāʾ', 'b', 'The lips', 'Both lips pressed together and released.'],
    ['ت', 'tāʾ', 't', 'The tongue', 'Tip of the tongue against the gum of the upper front teeth. Light.'],
    ['ث', 'thāʾ', 'th', 'The tongue', 'Tip of the tongue against the edge of the upper front teeth — the tongue shows.'],
    ['ج', 'jīm', 'j', 'The tongue', 'Middle of the tongue pressed to the roof of the mouth.'],
    ['ح', 'ḥāʾ', 'ḥ', 'The throat', 'Middle of the throat, open and unvoiced. The letter English speakers most often turn into a hāʾ.'],
    ['خ', 'khāʾ', 'kh', 'The throat', 'Nearest part of the throat, heavy.'],
    ['د', 'dāl', 'd', 'The tongue', 'Tip of the tongue against the gum of the upper front teeth, voiced.'],
    ['ذ', 'dhāl', 'dh', 'The tongue', 'Tip of the tongue against the edge of the upper front teeth, voiced.'],
    ['ر', 'rāʾ', 'r', 'The tongue', 'Tip of the tongue at the gum, a little further back than lām and nūn.'],
    ['ز', 'zāy', 'z', 'The tongue', 'Tip of the tongue behind the lower front teeth, voiced and whistling.'],
    ['س', 'sīn', 's', 'The tongue', 'Tip of the tongue behind the lower front teeth, unvoiced and whistling.'],
    ['ش', 'shīn', 'sh', 'The tongue', 'Middle of the tongue to the roof of the mouth, with the sound spreading.'],
    ['ص', 'ṣād', 'ṣ', 'The tongue', 'The heavy pair of sīn — same place, mouth full and rounded.'],
    ['ض', 'ḍād', 'ḍ', 'The tongue', 'The edge of the tongue against the upper molars. The hardest letter in the language, and the one Arabic is named after.'],
    ['ط', 'ṭāʾ', 'ṭ', 'The tongue', 'The heavy pair of tāʾ — same place, mouth full.'],
    ['ظ', 'ẓāʾ', 'ẓ', 'The tongue', 'The heavy pair of dhāl — tongue to the edge of the upper teeth, mouth full.'],
    ['ع', 'ʿayn', 'ʿ', 'The throat', 'Middle of the throat, voiced. It has no English equivalent, so it has to be heard and corrected rather than described.'],
    ['غ', 'ghayn', 'gh', 'The throat', 'Nearest part of the throat, voiced — the heavy pair of khāʾ.'],
    ['ف', 'fāʾ', 'f', 'The lips', 'Inside of the lower lip against the tips of the upper front teeth.'],
    ['ق', 'qāf', 'q', 'The tongue', 'Deepest part of the tongue against the soft palate. Heavy.'],
    ['ك', 'kāf', 'k', 'The tongue', 'Just in front of qāf, and light where qāf is heavy.'],
    ['ل', 'lām', 'l', 'The tongue', 'The edges of the tongue meeting the gums, tip at the front.'],
    ['م', 'mīm', 'm', 'The lips', 'Both lips together, with the sound running through the nose.'],
    ['ن', 'nūn', 'n', 'The tongue', 'Tip of the tongue at the gum, with the sound running through the nose.'],
    ['ه', 'hāʾ', 'h', 'The throat', 'Deepest part of the throat, open and unvoiced.'],
    ['و', 'wāw', 'w', 'The lips', 'Lips rounded without touching. When it carries a ḍammah before it, it stops being a consonant and becomes a long vowel.'],
    ['ي', 'yāʾ', 'y', 'The tongue', 'Middle of the tongue. When it carries a kasrah before it, it stops being a consonant and becomes a long vowel.']
  ];

  var pane = document.getElementById('letterpane');
  var grid = document.querySelector('.huruf.pick');
  if (pane && grid) {
    // The no-script alphabet remains plain readable text. Upgrade to native
    // buttons only when the explanation panel is available.
    var cells = Array.prototype.slice.call(grid.querySelectorAll('span')).map(function (span) {
      var button = document.createElement('button');
      button.type = 'button';
      var glyph = document.createElement('span');
      glyph.className = 'letter-glyph';
      glyph.lang = 'ar';
      glyph.dir = 'rtl';
      glyph.textContent = span.textContent;
      button.appendChild(glyph);
      button.setAttribute('lang', 'en');
      button.setAttribute('aria-controls', 'letterpane');
      span.replaceWith(button);
      return button;
    });
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Arabic letter explorer');
    grid.setAttribute('lang', 'en');
    var keyboardHelp = document.createElement('p');
    keyboardHelp.className = 'lesson-keyboard';
    keyboardHelp.id = 'letter-keys';
    keyboardHelp.textContent = 'Keyboard: use the arrow keys to explore the letters, Home or End to reach the first or last. Tab continues to the next part of the page.';
    var explorer = document.createElement('div');
    explorer.className = 'letter-explorer';
    grid.parentNode.insertBefore(explorer, grid);
    explorer.appendChild(grid);
    explorer.appendChild(keyboardHelp);
    grid.setAttribute('aria-describedby', 'letter-keys');
    var paneGl = pane.querySelector('[data-gl]');
    var paneNm = pane.querySelector('[data-nm]');
    var paneTr = pane.querySelector('[data-tr]');
    var paneTx = pane.querySelector('[data-tx]');
    var paneZn = pane.querySelector('[data-zn]');

    // A short, selected-letter prompt lives inside the existing live panel.
    var practice = document.createElement('p');
    practice.className = 'letter-practice';
    var practiceLabel = document.createElement('strong');
    practiceLabel.textContent = 'Your turn';
    var practiceText = document.createElement('span');
    practice.appendChild(practiceLabel);
    practice.appendChild(practiceText);
    paneTx.parentNode.appendChild(practice);

    var pick = function (i) {
      var L = LETTERS[i];
      if (!L) return;
      cells.forEach(function (c, n) {
        c.setAttribute('aria-pressed', String(n === i));
        c.tabIndex = n === i ? 0 : -1;
      });
      paneGl.textContent = L[0];
      paneNm.textContent = L[1];
      paneTr.textContent = L[2];
      paneZn.textContent = L[3];
      paneTx.textContent = L[4];
      practiceText.textContent = 'Trace the shape, notice its dots, then find this letter again: ';
      var practiceLetter = document.createElement('bdi');
      practiceLetter.lang = 'ar';
      practiceLetter.dir = 'rtl';
      practiceLetter.textContent = L[0];
      practiceText.appendChild(practiceLetter);
    };

    cells.forEach(function (c, i) {
      var L = LETTERS[i];
      c.setAttribute('aria-pressed', 'false');
      if (L) c.setAttribute('aria-label', L[1] + ' — ' + L[3]);
      c.addEventListener('click', function () { pick(i); });
      c.addEventListener('keydown', function (e) {
        // This grid is right-to-left. Read the actual CSS column count so
        // vertical movement also works when the phone layout uses four.
        var columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
        if (columns < 2) columns = 7;
        var next = i;
        if (e.key === 'ArrowLeft') next = Math.min(cells.length - 1, i + 1);
        else if (e.key === 'ArrowRight') next = Math.max(0, i - 1);
        else if (e.key === 'ArrowDown') next = Math.min(cells.length - 1, i + columns);
        else if (e.key === 'ArrowUp') next = Math.max(0, i - columns);
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = cells.length - 1;
        else return; // Enter and Space keep the native button behavior.
        e.preventDefault();
        pick(next);
        cells[next].focus();
      });
    });
    pick(0);
  }

  /* ==================================================================
     3 — Time zones  (/quran/cohorts/)

     A class hour has to work for a student in Atlanta and a teacher
     abroad, so the waitlist asks where you are. The browser already
     knows; we offer it rather than making anyone look it up, and we
     ask rather than assume.
     ================================================================== */
  var tzField = document.getElementById('w-tz');
  var tzNote = document.querySelector('[data-tznote]');
  if (tzField) {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (tz && !tzField.value) tzField.value = tz.replace(/_/g, ' ');
    if (tz && tzNote) {
      tzNote.textContent = 'Filled in from your browser (' + tz.replace(/_/g, ' ') + '). Change it if that is not where you will be sitting.';
    }
  }

  /* ==================================================================
     4 — Carrying an answer to the form  (/quran/#enrol)

     The placement check links back to the enrollment form as
     ?level=N#enrol. Rather than make someone answer the same question
     twice, the matching option is selected for them — and visibly, so
     they can change it.
     ================================================================== */
  var sel = document.getElementById('q-level');
  if (sel) {
    var level = new URLSearchParams(location.search).get('level');
    var map = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5 };
    if (level && map[level] && sel.options[map[level]]) {
      sel.selectedIndex = map[level];
      var hint = document.querySelector('[data-levelhint]');
      if (hint) {
        hint.textContent = 'Carried over from the placement check — change it if it is not right.';
      }
    }
  }
})();
