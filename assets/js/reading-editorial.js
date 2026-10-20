/* Rearrange existing reading controls; never duplicate actions or source text. */
(function () {
  'use strict';
  var panel = document.querySelector('[data-reader-tools]');
  if (!panel || !window.matchMedia) return;
  var session = document.querySelector('[data-reading-session]');
  var heading = session.querySelector('.reading-session-heading');
  var navigation = session.querySelector('[data-guided-navigation]');
  var status = session.querySelector('[data-guided-status]');
  var footer = document.querySelector('[data-guided-footer]');
  var contents = panel.querySelector('.reader-tools-content');
  var footerHome = document.createComment('Reading continuation');
  footer.before(footerHome);
  var compact = window.matchMedia('(max-width: 850px)');
  function arrange() {
    var active = document.activeElement;
    if (compact.matches) {
      panel.open = false;
      contents.prepend(heading, navigation);
      session.append(status, footer);
    } else {
      panel.open = true;
      session.prepend(heading, navigation);
      navigation.append(status);
      footerHome.after(footer);
    }
    // Resizing must never leave keyboard focus inside a closed disclosure.
    if (active && panel.contains(active) && !panel.open) panel.querySelector('summary').focus({preventScroll:true});
  }
  arrange();
  if (compact.addEventListener) compact.addEventListener('change', arrange);
  else if (compact.addListener) compact.addListener(arrange);
})();
