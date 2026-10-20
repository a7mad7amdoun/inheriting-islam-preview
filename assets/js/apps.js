/* The Apps — one enhancement, and the page is complete without it.

   Each card in the ledger links to ?app=<slug>#waitlist. If somebody arrived
   from a particular app, that box is already ticked when they get there rather
   than making them find it again in a list of seven.

   Nothing is fetched, stored, or sent anywhere. */
(function () {
  'use strict';

  var slug = new URLSearchParams(location.search).get('app');
  if (!slug) return;

  var box = document.getElementById('w-' + slug.replace(/[^a-z]/gi, ''));
  if (!box || box.type !== 'checkbox') return;

  box.checked = true;

  var hint = document.querySelector('[data-apphint]');
  if (hint) {
    var label = document.querySelector('label[for="' + box.id + '"] span');
    hint.textContent = (label ? label.textContent : 'That app') +
      ' is ticked because that is the card you came from. Add any others, or untick it.';
  }
})();
