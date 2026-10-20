/* Shared, local-only interaction. No requests, cookies or tracking. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var motionChoice = 'system';
  try { motionChoice = localStorage.getItem('ii-motion') || 'system'; } catch (e) {}
  var motionButton = document.querySelector('[data-motion-toggle]');
  function setMotion() {
    var calm = reduce.matches || motionChoice === 'calm';
    root.dataset.motion = calm ? 'calm' : 'gentle';
    if (calm && activeThemeTransition) {
      activeThemeTransition.skipTransition();
      applyTheme(desiredTheme);
      delete root.dataset.themeTransition;
    }
    if (calm && document.getAnimations) document.getAnimations().forEach(function (a) { a.cancel(); });
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.textContent = reduce.matches ? 'Motion: reduced by your device' : calm ? 'Motion: calm' : 'Motion: gentle';
      motionButton.setAttribute('aria-pressed', String(calm));
      motionButton.disabled = reduce.matches;
    }
  }
  if (motionButton) motionButton.addEventListener('click', function () {
    motionChoice = root.dataset.motion === 'calm' ? 'system' : 'calm';
    try { localStorage.setItem('ii-motion', motionChoice); } catch (e) {}
    setMotion();
  });
  if (reduce.addEventListener) reduce.addEventListener('change', setMotion);
  setMotion();
  // Pause only the decorative background while this document is hidden.
  function syncBackgroundVisibility() {
    root.toggleAttribute('data-background-paused', document.hidden);
  }
  document.addEventListener('visibilitychange', syncBackgroundVisibility);
  window.addEventListener('pageshow', syncBackgroundVisibility);
  syncBackgroundVisibility();
  // Native page navigation retains history, downloads and modified-click behavior.
  ['pageswap', 'pagereveal'].forEach(function (name) {
    addEventListener(name, function (event) {
      if (event.viewTransition && (reduce.matches || root.dataset.motion === 'calm')) event.viewTransition.skipTransition();
    });
  });

  // Older engines keep native navigation and receive a small arrival fade only.
  // Never intercept links, postpone navigation, or replay an arrival on browser Back.
  if (!('onpagereveal' in window)) {
    addEventListener('pageshow', function (event) {
      delete root.dataset.pageArrival;
      if (event.persisted || innerWidth > 1000 || reduce.matches || root.dataset.motion === 'calm') return;
      var entry = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      if (entry && entry.type === 'back_forward') return;
      root.dataset.pageArrival = 'true';
    });
    addEventListener('pagehide', function () { delete root.dataset.pageArrival; });
  }

  var toggle = document.getElementById('themeToggle');
  var appLogos = document.querySelectorAll('img[data-logo-dark][data-logo-light]');
  function syncAppLogos() {
    var theme = root.dataset.theme === 'light' ? 'light' : 'dark';
    appLogos.forEach(function (img) {
      var source = img.getAttribute('data-logo-' + theme);
      if (img.getAttribute('src') !== source) img.setAttribute('src', source);
    });
  }
  syncAppLogos();
  function themeLabel() {
    if (toggle) toggle.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    if (toggle) toggle.title = root.dataset.theme === 'dark' ? 'Daylight — warm ivory and pine' : 'Lamplight — deep forest and brass';
    if (toggle) {
      var name = toggle.querySelector('[data-theme-name]');
      var action = toggle.querySelector('[data-theme-action]');
      if (name) name.textContent = root.dataset.theme === 'dark' ? 'Lamplight' : 'Daylight';
      if (action) action.textContent = root.dataset.theme === 'dark' ? 'Switch to daylight' : 'Switch to lamplight';
    }
  }
  var desiredTheme = root.dataset.theme === 'light' ? 'light' : 'dark';
  var activeThemeTransition = null;
  var themeRevision = 0;
  function applyTheme(theme) {
    root.dataset.theme = theme;
    syncAppLogos();
    themeLabel();
  }
  function changeTheme() {
    desiredTheme = desiredTheme === 'dark' ? 'light' : 'dark';
    var revision = ++themeRevision;
    var next = desiredTheme;
    try { localStorage.setItem('ii-theme', next); } catch (e) {}
    if (activeThemeTransition) activeThemeTransition.skipTransition();
    activeThemeTransition = null;
    delete root.dataset.themeTransition;
    function update() { if (revision === themeRevision) applyTheme(next); }
    if (!document.startViewTransition || root.dataset.motion === 'calm' || reduce.matches) {
      update();
      return;
    }
    // Reveal the new paper in place; text never translates, scales, or blurs.
    root.dataset.themeTransition = 'paper';
    try {
      var transition = document.startViewTransition(update);
      activeThemeTransition = transition;
      transition.ready.catch(function () { update(); });
      transition.finished.catch(function () { update(); }).then(function () {
        if (revision !== themeRevision) return;
        activeThemeTransition = null;
        delete root.dataset.themeTransition;
      });
    } catch (e) {
      update();
      delete root.dataset.themeTransition;
    }
  }
  if (toggle) {
    toggle.hidden = false;
    themeLabel();
    toggle.addEventListener('click', changeTheme);
  }
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', (window.scrollY || document.body.scrollTop) > 8); };
    onScroll();
    document.addEventListener('scroll', onScroll, { capture:true, passive: true });
  }

  var navBtn = document.getElementById('navToggle');
  var navPanel = document.getElementById('mobileNav');
  var journeyMenu = document.querySelector('[data-journey-menu]');
  var navReturnTarget = navBtn;
  var background = Array.from(document.querySelectorAll('main, body > footer, .armbar, .journey-tray, .journey-dock'));
  var previousInert = [];
  var navAnimation = null;
  var navAnimationRevision = 0;
  function revealMobileMenu(open, animate) {
    var revision = ++navAnimationRevision;
    if (navAnimation) navAnimation.cancel();
    navAnimation = null;
    navPanel.inert = !open;
    function finish() {
      if (revision !== navAnimationRevision) return;
      navAnimation = null;
      if (!open) navPanel.hidden = true;
    }
    if (!animate || reduce.matches || root.dataset.motion === 'calm' || !navPanel.animate) { finish(); return; }
    // Only opacity changes. Arabic glyphs keep their position, scale and sharpness.
    navAnimation = navPanel.animate([{opacity:open ? 0 : 1},{opacity:open ? 1 : 0}], {
      duration:open ? 280 : 180, easing:'cubic-bezier(.22,1,.36,1)'
    });
    navAnimation.finished.then(finish, finish);
  }
  function closeNav(restoreFocus, animate) {
    if (!navBtn || !navPanel || navBtn.getAttribute('aria-expanded') !== 'true') return;
    navBtn.setAttribute('aria-expanded', 'false');
    if (journeyMenu) journeyMenu.setAttribute('aria-expanded', 'false');
    navBtn.setAttribute('aria-label', 'Open menu');
    var menuLabel = navBtn.querySelector('.nav-menu-label');
    if (menuLabel) menuLabel.textContent = 'Menu';
    navPanel.classList.remove('open');
    revealMobileMenu(false, animate !== false);
    document.body.classList.remove('nav-lock');
    background.forEach(function (el, i) { el.inert = previousInert[i]; });
    if (restoreFocus) (navReturnTarget || navBtn).focus();
  }
  if (navBtn && navPanel) {
    navBtn.hidden = false;
    navPanel.hidden = true;
    navBtn.setAttribute('aria-label', 'Open menu');
    navBtn.addEventListener('click', function () {
      if (navBtn.getAttribute('aria-expanded') === 'true') { closeNav(true); return; }
      navReturnTarget = document.activeElement === journeyMenu ? journeyMenu : navBtn;
      previousInert = background.map(function (el) { return !!el.inert; });
      background.forEach(function (el) { el.inert = true; });
      navPanel.hidden = false;
      navPanel.querySelectorAll('details').forEach(function (group) {
        if (group.querySelector('[aria-current="page"]')) group.open = true;
      });
      navPanel.classList.add('open');
      navBtn.setAttribute('aria-expanded', 'true');
      if (journeyMenu) journeyMenu.setAttribute('aria-expanded', 'true');
      navBtn.setAttribute('aria-label', 'Close menu');
      var menuLabel = navBtn.querySelector('.nav-menu-label');
      if (menuLabel) menuLabel.textContent = 'Close';
      document.body.classList.add('nav-lock');
      revealMobileMenu(true, true);
      navPanel.scrollTop = 0;
      var first = navPanel.querySelector('a');
      if (first) first.focus({preventScroll:true});
    });
    navPanel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closeNav(true, false); });
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navBtn.getAttribute('aria-expanded') === 'true') { e.preventDefault(); closeNav(true); }
    });
    addEventListener('resize', function () {
      if (innerWidth <= 1000 || navBtn.getAttribute('aria-expanded') !== 'true') return;
      var focused = navPanel.contains(document.activeElement) || document.activeElement === navBtn;
      closeNav(false, false);
      if (focused) {
        var destination = document.querySelector('.nav [aria-current], #header .brand');
        if (destination) destination.focus();
      }
    });
  }
  if (journeyMenu && navBtn && navPanel) {
    journeyMenu.hidden = false;
    journeyMenu.addEventListener('click', function () { navBtn.click(); });
  }

  // An explicit, reversible reading preference; never hide navigation on a timer.
  var journeyToggle = document.querySelector('[data-journey-toggle]');
  var journeyDock = document.querySelector('.journey-dock');
  if (journeyToggle && journeyDock) {
    function setJourneyCollapsed(collapsed) {
      document.body.dataset.journeyCollapsed = String(collapsed);
      journeyToggle.setAttribute('aria-expanded', String(!collapsed));
      journeyToggle.querySelector('span').textContent = collapsed ? journeyToggle.dataset.showLabel : journeyToggle.dataset.hideLabel;
      journeyDock.inert = collapsed;
    }
    var collapsed = false;
    try { collapsed = sessionStorage.getItem('ii-navigation-collapsed') === 'true'; } catch (e) {}
    setJourneyCollapsed(collapsed);
    journeyToggle.hidden = false;
    journeyToggle.addEventListener('click', function () {
      collapsed = document.body.dataset.journeyCollapsed !== 'true';
      setJourneyCollapsed(collapsed);
      try { sessionStorage.setItem('ii-navigation-collapsed', String(collapsed)); } catch (e) {}
    });
    // Native history restores window scrolling; the mobile reading viewport is
    // independent, so retain its position on the existing history entry only.
    addEventListener('pagehide', function () {
      if (innerWidth > 1000) return;
      try {
        history.replaceState(Object.assign({}, history.state, {iiViewport:{url:location.href, top:document.body.scrollTop}}), '', location.href);
      } catch (e) {}
    });
    addEventListener('pageshow', function () {
      if (innerWidth > 1000) return;
      var saved = history.state && history.state.iiViewport;
      if (saved && saved.url === location.href) {
        if (document.body.scrollTo) document.body.scrollTo({top:saved.top, behavior:'instant'});
        else document.body.scrollTop = saved.top;
      } else if (location.hash) {
        var target;
        try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
        if (target) target.scrollIntoView({block:'start', behavior:'instant'});
      }
    });
    // Preserve the reader's position when crossing the mobile/desktop breakpoint.
    var mobileJourney = innerWidth <= 1000;
    var journeyScroll = mobileJourney ? document.body.scrollTop : window.scrollY;
    document.addEventListener('scroll', function () {
      journeyScroll = mobileJourney ? document.body.scrollTop : window.scrollY;
    }, {capture:true, passive:true});
    addEventListener('resize', function () {
      var nextMobile = innerWidth <= 1000;
      if (nextMobile === mobileJourney) return;
      mobileJourney = nextMobile;
      if (mobileJourney) document.body.scrollTop = journeyScroll;
      else window.scrollTo({top:journeyScroll, behavior:'instant'});
    });
  }

  /* Native desktop disclosure: usable without JS, enhanced with dismissal.
     These are ordinary navigation links, not an application menu widget. */
  var learningMenu = document.querySelector('.nav-disclosure');
  function closeLearning(restoreFocus) {
    if (!learningMenu || !learningMenu.open) return;
    learningMenu.open = false;
    if (restoreFocus) learningMenu.querySelector('summary').focus();
  }
  if (learningMenu) {
    document.addEventListener('click', function (event) {
      if (!learningMenu.contains(event.target)) closeLearning(false);
    });
    learningMenu.addEventListener('focusout', function (event) {
      if (event.relatedTarget && !learningMenu.contains(event.relatedTarget)) closeLearning(false);
    });
    learningMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { closeLearning(false); });
    });
    addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && learningMenu.open) { event.preventDefault(); closeLearning(true); }
    });
    addEventListener('resize', function () {
      if (innerWidth <= 1000) {
        var hadFocus = learningMenu.contains(document.activeElement);
        closeLearning(false);
        if (hadFocus && navBtn) navBtn.focus();
      }
    });
  }
  /* Keep keyboard focus within the open mobile navigation and its controls. */
  addEventListener('keydown', function (event) {
    if (event.key !== 'Tab' || !navPanel || navBtn.getAttribute('aria-expanded') !== 'true') return;
    var candidates = Array.from(navPanel.querySelectorAll('a[href], summary, button:not([disabled])')).filter(function (el) {
      var closed = el.closest('details:not([open])');
      return !el.closest('[hidden]') && (!closed || (el.tagName === 'SUMMARY' && el.parentElement === closed));
    });
    // Footer utilities are inert while the menu is open, so never trap focus there.
    var focusable = [document.querySelector('[data-language-link]'), navBtn].filter(function (el) { return el && !el.hidden; }).concat(candidates);
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (!first) return;
    if (!focusable.includes(document.activeElement)) {
      event.preventDefault(); (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  root.dataset.navReady = 'true';

  /* A decorative reading guide. It follows focus as well as the pointer;
     current-section semantics stay on the links themselves. */
  var primaryNav = document.querySelector('#header .nav');
  var masthead = document.querySelector('#header .hbar');
  if (primaryNav && masthead && header) {
    var flow = document.createElement('span');
    flow.className = 'nav-flow-line';
    flow.setAttribute('aria-hidden', 'true');
    masthead.appendChild(flow);
    function navTarget(node) {
      if (!node || !node.closest || !primaryNav.contains(node)) return null;
      var disclosure = node.closest('.nav-disclosure');
      if (disclosure) return disclosure.querySelector('summary');
      var link = node.closest('a');
      return link && link.parentElement === primaryNav ? link : null;
    }
    function currentNavTarget() {
      return primaryNav.querySelector(':scope > a[aria-current], .nav-disclosure > summary[aria-current]');
    }
    function moveGuide(target) {
      if (!target || innerWidth <= 1000) { flow.dataset.visible = 'false'; return; }
      var bounds = target.getBoundingClientRect(), shell = masthead.getBoundingClientRect();
      if (!bounds.width) { flow.dataset.visible = 'false'; return; }
      header.dataset.flowReady = 'true';
      flow.style.setProperty('--nav-flow-width', Math.max(0, bounds.width - 26) + 'px');
      flow.style.setProperty('--nav-flow-x', (bounds.left - shell.left - masthead.clientLeft + 13) + 'px');
      flow.style.setProperty('--nav-flow-y', (bounds.bottom - shell.top - masthead.clientTop + 3) + 'px');
      flow.dataset.visible = 'true';
    }
    function restoreGuide() { moveGuide(navTarget(document.activeElement) || currentNavTarget()); }
    primaryNav.addEventListener('pointerover', function (event) { moveGuide(navTarget(event.target)); });
    primaryNav.addEventListener('pointerleave', restoreGuide);
    primaryNav.addEventListener('focusin', function (event) { moveGuide(navTarget(event.target)); });
    primaryNav.addEventListener('focusout', function (event) { moveGuide(navTarget(event.relatedTarget) || currentNavTarget()); });
    addEventListener('resize', restoreGuide);
    if ('ResizeObserver' in window) {
      var navSizeObserver = new ResizeObserver(restoreGuide);
      navSizeObserver.observe(masthead);
      navSizeObserver.observe(primaryNav);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(restoreGuide);
    restoreGuide();
  }

  /* Static sources are the foundation. Tabs only choose which reading is open;
     they never generate an interpretation, save a reflection, or animate scripture. */
  /* Three reading intentions, with native anchor links as the fallback.
     The URL is the state: deep links and browser Back reveal the right path. */
  function openLinkedDetails(target) {
    if (!target) return false;
    var opened = false;
    var disclosure = target.querySelector(':scope > .course-disclosure, :scope > .wrap > .chapter-disclosure');
    if (disclosure && !disclosure.open) { disclosure.open = true; opened = true; }
    var node = target;
    while (node) {
      if (node.tagName === 'DETAILS' && !node.open) { node.open = true; opened = true; }
      node = node.parentElement;
    }
    return opened;
  }
  var journeyRoot = document.querySelector('[data-learning-journeys]');
  var revealJourneyTarget = function () {};
  if (journeyRoot) {
    var journeyList = journeyRoot.querySelector('[data-learning-routes]');
    var journeyTabs = Array.from(journeyRoot.querySelectorAll('[data-journey-choice]'));
    var journeyPanels = Array.from(journeyRoot.querySelectorAll('[data-journey-panel]'));
    var chooseJourney = function (name) {
      if (!journeyPanels.some(function (p) { return p.dataset.journeyPanel === name; })) return;
      journeyPanels.forEach(function (p) { p.hidden = p.dataset.journeyPanel !== name; });
      journeyTabs.forEach(function (t) {
        var active = t.dataset.journeyChoice === name;
        t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1;
      });
    };
    journeyList.setAttribute('role', 'tablist');
    journeyList.setAttribute('aria-orientation', 'vertical');
    journeyTabs.forEach(function (tab, index) {
      var panel = document.getElementById(tab.hash.slice(1));
      tab.setAttribute('role', 'tab');tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');panel.setAttribute('aria-labelledby', tab.id);panel.tabIndex = 0;
      function activate(mode) {
        chooseJourney(tab.dataset.journeyChoice);
        try { history[mode + 'State'](null, '', tab.hash); } catch (e) {}
        window.dispatchEvent(new Event('resize'));
      }
      tab.addEventListener('click', function (event) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        event.preventDefault();activate('push');
        panel.scrollIntoView({behavior:root.dataset.motion === 'calm' ? 'auto' : 'smooth',block:'start'});
      });
      tab.addEventListener('keydown', function (event) {
        var next;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % journeyTabs.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + journeyTabs.length - 1) % journeyTabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = journeyTabs.length - 1;
        else if (event.key === ' ') { event.preventDefault();activate('push');return; }
        else return;
        event.preventDefault();var target = journeyTabs[next];
        chooseJourney(target.dataset.journeyChoice);target.focus({preventScroll:true});
        try { history.replaceState(null, '', target.hash); } catch (e) {}
        window.dispatchEvent(new Event('resize'));
      });
    });
    revealJourneyTarget = function (target) {
      var panel = target && target.closest('[data-journey-panel]');
      if (panel) chooseJourney(panel.dataset.journeyPanel);
    };
    chooseJourney('begin');
    var initialTarget;
    try { initialTarget = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
    revealJourneyTarget(initialTarget);
    journeyRoot.dataset.journeysReady = 'true';
    // Select before native anchor scrolling, including repeated links to the same hash.
    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href]');
      if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      var url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      var target;try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (e) { return; }
      var destinationPanel = target && target.closest('[data-journey-panel]');
      var changedPath = destinationPanel && destinationPanel.hidden;
      revealJourneyTarget(target);
      openLinkedDetails(target);
      if (changedPath) {
        if (!target.hasAttribute('tabindex') && !target.matches('input, select, textarea, button, a[href]')) target.tabIndex = -1;
        target.focus({preventScroll:true});
      }
    });
  }

  document.querySelectorAll('[data-reflection-reader]').forEach(function (reader) {
    var tabs = reader.querySelector('[data-reflection-tabs]');
    var choices = Array.from(reader.querySelectorAll('[data-reflection-choice]'));
    var pages = Array.from(reader.querySelectorAll('[data-reflection-panel]'));
    if (!tabs || !choices.length || choices.length !== pages.length) return;
    var selected = choices[0].dataset.reflectionChoice;
    function choose(value, focus) {
      var choice = choices.find(function (button) { return button.dataset.reflectionChoice === value; });
      if (!choice) return;
      selected = value;
      choices.forEach(function (button) {
        var current = button === choice;
        button.setAttribute('aria-selected', String(current));
        button.tabIndex = current ? 0 : -1;
      });
      pages.forEach(function (page) { page.hidden = page.dataset.reflectionPanel !== value; });
      if (focus) choice.focus();
    }
    pages.forEach(function (page) {
      var value = page.dataset.reflectionPanel;
      var body = page.querySelector('.inheritance-leaf-body');
      body.id = 'reflection-panel-' + value;
      body.setAttribute('role', 'tabpanel');
      body.setAttribute('aria-labelledby', 'reflection-tab-' + value);
      body.tabIndex = 0;
      page.open = true;
      page.querySelector(':scope > summary').hidden = true;
    });
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Choose a theme to reflect on');
    function tabOrientation() { tabs.setAttribute('aria-orientation', innerWidth <= 900 ? 'horizontal' : 'vertical'); }
    tabOrientation();
    addEventListener('resize', tabOrientation);
    choices.forEach(function (button, i) {
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', 'reflection-panel-' + button.dataset.reflectionChoice);
      button.addEventListener('click', function () { choose(button.dataset.reflectionChoice, false); });
      button.addEventListener('keydown', function (event) {
        var next;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % choices.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i + choices.length - 1) % choices.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = choices.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        choose(choices[next].dataset.reflectionChoice, true);
      });
    });
    function followReflectionHash(scroll) {
      var id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
      var target = document.getElementById(id);
      var page = target && target.closest('[data-reflection-panel]');
      if (page && reader.contains(page)) {
        choose(page.dataset.reflectionPanel, false);
        if (scroll) page.scrollIntoView({behavior:'auto',block:'start'});
      }
    }
    choose(selected, false);
    followReflectionHash(false);
    tabs.hidden = false;
    reader.dataset.enhanced = 'true';
    addEventListener('hashchange', function () { followReflectionHash(true); });
  });

  /* A quiet page-position rule, local to this visit and never a completion score. */
  var readingMain = document.getElementById('main');
  if (readingMain && masthead) {
    var progress = document.createElement('span');
    progress.className = 'reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.appendChild(document.createElement('span'));
    masthead.appendChild(progress);
    var progressPending = false;
    function updateProgress() {
      progressPending = false;
      var box = readingMain.getBoundingClientRect();
      var headerSize = header.getBoundingClientRect().height;
      var visibleHeight = Math.min(innerHeight, document.body.clientHeight || innerHeight);
      var distance = box.height - (visibleHeight - headerSize);
      var ratio = distance > 0 ? Math.max(0, Math.min(1, (headerSize - box.top) / distance)) : 0;
      progress.style.setProperty('--reading-position', String(ratio));
    }
    function scheduleProgress() {
      if (progressPending) return;
      progressPending = true;
      (window.requestAnimationFrame || function (fn) { return setTimeout(fn,16); })(updateProgress);
    }
    document.addEventListener('scroll', scheduleProgress, {capture:true, passive:true});
    addEventListener('resize', scheduleProgress);
    document.addEventListener('toggle', scheduleProgress, true);
    if ('ResizeObserver' in window) new ResizeObserver(scheduleProgress).observe(readingMain);
    updateProgress();
  }

  /* Architectural motion is limited to images and independent rules.
     Content is visible before enhancement; sacred text never enters a motion target. */
  document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  function enter(el) {
    if (root.dataset.motion === 'calm' || reduce.matches || !el.animate) return;
    if (el.closest('[data-still-art], .source-encounter, .reader-source, .quran-companion, [data-reflection-reader], [lang="ar"]') || el.querySelector('[lang="ar"], .check, .letterpane')) return;
    var rule = el.dataset.entrance === 'rule';
    var frames = el.dataset.entrance === 'thread' ? [{strokeDashoffset:240},{strokeDashoffset:0}] : rule ? [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }]
      : [{ opacity: .92, translate: '0 4px' }, { opacity: 1, translate: '0 0' }];
    el.animate(frames, { duration: rule ? 500 : 600, easing: 'cubic-bezier(.25,.8,.25,1)' });
  }
  document.querySelectorAll('.desk-art img, .book-teacher img, .open-life-tools img, .need-finder img, .tool-dossiers .plate img, .hero-art .frame, .house-art img, .journal-art img, .open-learning-art img, .open-listening figure img').forEach(function (scene) {
    if (!scene.closest('[data-still-art], [data-entrance], .source-encounter, .reader-source, .quran-companion, [data-reflection-reader], [data-study=books], [data-study=lesson]') && !scene.querySelector('[lang="ar"]')) scene.dataset.entrance = 'image';
  });
  var entrances = document.querySelectorAll('[data-entrance]');
  if ('IntersectionObserver' in window) {
    var entranceObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { enter(entry.target); entranceObserver.unobserve(entry.target); }
      });
    }, { threshold: .12 });
    entrances.forEach(function (el) { entranceObserver.observe(el); });
  } else entrances.forEach(enter);

  /* Native disclosures remain usable without JS. Deep links open any ancestor
     disclosure so an existing anchor never lands in hidden content. */
  function revealHashTarget() {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var panel = target.closest('[data-journey-panel]');
    var opened = !!(panel && panel.hidden);
    revealJourneyTarget(target);
    opened = openLinkedDetails(target) || opened;
    if (opened) target.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  revealHashTarget();
  addEventListener('hashchange', revealHashTarget);
  addEventListener('popstate', function () {
    if (journeyRoot && !location.hash) chooseJourney('begin');
    revealHashTarget();
  });

  /* A reading position cue, with ordinary anchor links as the foundation. */
  var chapterLinks = Array.from(document.querySelectorAll('.chapter-contents a, .study-contents a, .about-contents a'));
  var sectionLinks = new Map();
  chapterLinks.forEach(function (link) {
    var url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    var section = document.getElementById(url.hash.slice(1));
    if (section) sectionLinks.set(section, link);
  });
  if (sectionLinks.size) {
    var updatePending = false;
    var frame = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
    function updateChapter() {
      updatePending = false;
      var line = Math.min(innerHeight * .35, 240), current = null, nearest = -Infinity;
      sectionLinks.forEach(function (link, section) {
        if (section.closest('[hidden]')) return;
        var top = section.getBoundingClientRect().top;
        if (!current) current = link;
        if (top <= line && top > nearest) { current = link; nearest = top; }
      });
      chapterLinks.forEach(function (link) {
        if (link === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    function scheduleChapter() {
      if (!updatePending) { updatePending = true; frame(updateChapter); }
    }
    updateChapter();
    document.addEventListener('scroll', scheduleChapter, { capture:true, passive: true });
    addEventListener('resize', scheduleChapter);
    addEventListener('hashchange', scheduleChapter);
    document.addEventListener('toggle', scheduleChapter, true);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      var previous = document.activeElement;
      area.value = text;
      area.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(area); area.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('Copy unavailable')); } catch (e) { reject(e); }
      area.remove();
      if (previous && previous.focus) previous.focus();
    });
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var status = document.createElement('span');
    status.className = 'copy-status'; status.setAttribute('role', 'status');
    btn.insertAdjacentElement('afterend', status);
    btn.addEventListener('click', function () {
      copyText(btn.getAttribute('data-copy')).then(function () { status.textContent = 'Copied.'; }, function () { status.textContent = 'Copy is unavailable. Select and copy the text directly.'; });
    });
  });

  document.querySelectorAll('form[data-to]').forEach(function (form) {
    var to = form.getAttribute('data-to');
    var note = form.querySelector('.formnote');
    if (note) { note.setAttribute('role', 'status'); note.setAttribute('aria-live', 'polite'); }
    var preview = document.createElement('section');
    preview.className = 'email-preview'; preview.hidden = true;
    preview.setAttribute('aria-label', 'Your email draft');
    var title = document.createElement('h3'); title.textContent = 'Your message, ready to review.'; title.tabIndex = -1;
    var guidance = document.createElement('p'); guidance.textContent = 'Nothing has been sent. Review the draft, then open your email app to send it. You can also copy it and email ' + to + ' directly.';
    var contents = document.createElement('pre'); contents.tabIndex = 0; contents.setAttribute('aria-label', 'Draft subject and message');
    var actions = document.createElement('div'); actions.className = 'btns';
    var open = document.createElement('a'); open.className = 'btn btn-primary'; open.textContent = 'Open email draft';
    var copy = document.createElement('button'); copy.type = 'button'; copy.className = 'btn btn-ghost'; copy.textContent = 'Copy message';
    var copyStatus = document.createElement('p'); copyStatus.className = 'copy-status'; copyStatus.setAttribute('role', 'status');
    actions.append(open, copy); preview.append(title, guidance, contents, actions, copyStatus); form.append(preview);
    copy.addEventListener('click', function () {
      copyText(contents.textContent).then(function () { copyStatus.textContent = 'Copied. Paste it into your email app and send when you are ready.'; }, function () { copyStatus.textContent = 'Copy is unavailable. Select the draft text above and copy it directly.'; });
    });
    function invalidate() {
      if (!preview.hidden) {
        preview.hidden = true; open.removeAttribute('href'); contents.textContent = ''; copyStatus.textContent = '';
        if (note) note.textContent = 'Your details changed. Prepare the email again to update the draft.';
      }
    }
    form.addEventListener('input', invalidate);
    form.addEventListener('change', invalidate);
    form.addEventListener('reset', invalidate);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (el.type === 'text' || el.type === 'email') el.value = el.value.trim();
        var valid = el.checkValidity();
        if (valid) el.removeAttribute('aria-invalid'); else { el.setAttribute('aria-invalid', 'true'); if (!firstInvalid) firstInvalid = el; }
      });
      if (firstInvalid) {
        preview.hidden = true;
        if (note) { note.classList.remove('ok'); note.textContent = 'Please complete the required fields and enter a valid email address before preparing your message.'; }
        firstInvalid.focus(); return;
      }
      var lines = ['Assalamu alaikum,', ''];
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (!el.name || el.disabled || ['submit', 'button', 'reset'].includes(el.type)) return;
        if (['checkbox', 'radio'].includes(el.type) && !el.checked) return;
        var label = el.labels && el.labels[0];
        var key = label ? label.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim() : el.name;
        var value = el.tagName === 'SELECT' ? Array.from(el.selectedOptions).filter(function (o) { return !!o.value; }).map(function (o) { return o.textContent.trim(); }).join(', ') : el.value.trim();
        if (el.type === 'checkbox') value = 'Yes';
        if (value) lines.push(key + (el.tagName === 'TEXTAREA' ? ':\r\n' : ': ') + value, '');
      });
      var name = form.querySelector('[name="name"]');
      var subject = (form.getAttribute('data-subject') || 'Inquiry') + (name ? ' — ' + name.value.trim() : '');
      var body = lines.join('\r\n');
      contents.textContent = 'To: ' + to + '\nSubject: ' + subject + '\n\n' + body;
      open.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      preview.hidden = false; copyStatus.textContent = '';
      if (note) { note.classList.add('ok'); note.textContent = 'Draft prepared below. Nothing has been sent.'; }
      title.focus();
    });
    form.querySelectorAll('[type="submit"]').forEach(function (button) { button.disabled = false; });
  });
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
