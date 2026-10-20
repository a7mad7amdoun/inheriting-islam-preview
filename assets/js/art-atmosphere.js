/* Small, scroll-led offsets. Text, portraits, covers and sacred writing stay still. */
(function () {
 'use strict';
 var root = document.documentElement;
 var reduce = matchMedia('(prefers-reduced-motion: reduce)');
 var wide = matchMedia('(min-width: 1025px)');
 var art = Array.from(document.querySelectorAll('.inheritance-hero-art img, .apps-cover-art img, .listening-scene img, .about-inheritance-art img, .house-art img, .reader-collection-art img'))
  .filter(function (img) { return !img.closest('[data-still-art], [data-house-art=teaching], .desk-art, .about-portrait, .teacher-opening-portrait, .library-cover-books, .source-grid, .reader-source'); });
 var rooms = Array.from(document.querySelectorAll('.inheritance-hero-layout, .about-cover-grid, .about-partner-grid, .desk-spread, .workshop-opening > .hero-grid, .listening-opening > .hero-grid, .chapter-opening-grid, .reader-opening, .explore-opening, .invitation-opening > .wrap'));
 if (!art.length && !rooms.length) return;
 var frame = 0;
 function enabled() { return wide.matches && !reduce.matches && root.dataset.motion !== 'calm' && !document.hidden; }
 function reset() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  art.forEach(function (img) { img.style.removeProperty('--art-drift'); });
  rooms.forEach(function (room) { room.style.removeProperty('--architecture-drift'); });
 }
 function draw() {
  frame = 0;
  if (!enabled()) { reset(); return; }
  var height = window.innerHeight;
  // Read first, then write: no layout thrashing and no idle animation loop.
  var offsets = art.concat(rooms).map(function (el, i) {
   var rect = el.getBoundingClientRect();
   if (rect.bottom < -100 || rect.top > height + 100) return 0;
   var progress = Math.max(-1, Math.min(1, (height / 2 - rect.top - rect.height / 2) / height));
   return progress * (i < art.length ? (i % 2 ? -14 : 18) : 28);
  });
  art.forEach(function (img, i) { img.style.setProperty('--art-drift', offsets[i].toFixed(2) + 'px'); });
  rooms.forEach(function (room, i) { room.style.setProperty('--architecture-drift', offsets[art.length + i].toFixed(2) + 'px'); });
 }
 function schedule() {
  if (!enabled()) { reset(); return; }
  if (!frame) frame = requestAnimationFrame(draw);
 }
 window.addEventListener('scroll', schedule, {passive:true});
 window.addEventListener('resize', schedule, {passive:true});
 window.addEventListener('pageshow', schedule);
 document.addEventListener('visibilitychange', schedule);
 reduce.addEventListener('change', schedule);
 wide.addEventListener('change', schedule);
 new MutationObserver(schedule).observe(root, {attributes:true, attributeFilter:['data-motion']});
 schedule();
})();

/* Shared edge illumination: scroll, fine pointer, and one gentle click sweep.
   No text moves, no input is intercepted, and rendering stops when settled. */
(function () {
 'use strict';
 var root = document.documentElement;
 var main = document.querySelector('body.open-book');
 if (!main) return;
 var reduce = matchMedia('(prefers-reduced-motion: reduce)');
 var fine = matchMedia('(hover: hover) and (pointer: fine)');
 var frame = 0, previous = 0, x = .94, y = .26, tx = x, ty = y;
 var sweep = null, zoom = 1, targetZoom = 1;
 function enabled() { return !reduce.matches && root.dataset.motion !== 'calm' && !document.hidden; }
 function stop() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0; previous = 0; sweep = null;
 }
 function start() {
  if (!enabled()) { stop(); return; }
  if (!frame) frame = requestAnimationFrame(draw);
 }
 function draw(time) {
  frame = 0;
  if (!enabled()) { stop(); return; }
  var elapsed = previous ? Math.min(time - previous, 64) : 16;
  previous = time;
  if (sweep !== null) {
   if (sweep < 0) sweep = time;
   var progress = Math.min(1, (time - sweep) / 1600);
   var ease = .5 - Math.cos(progress * Math.PI) / 2;
   x = .94 - .88 * ease; tx = x;
   if (progress === 1) sweep = null;
  } else {
   x += (tx - x) * (1 - Math.exp(-elapsed / 240));
  }
  y += (ty - y) * (1 - Math.exp(-elapsed / 240));
  zoom += (targetZoom - zoom) * (1 - Math.exp(-elapsed / 360));
  if (Math.abs(targetZoom - zoom) < .00005) zoom = targetZoom;
  main.style.setProperty('--calligraphy-zoom', zoom.toFixed(5));
  if (Math.abs(tx - x) < .0005) x = tx;
  if (Math.abs(ty - y) < .0005) y = ty;
  main.style.setProperty('--inheritance-light-screen-x', (window.innerWidth * x).toFixed(2) + 'px');
  main.style.setProperty('--inheritance-light-screen-y', (window.innerHeight * y).toFixed(2) + 'px');
  if (sweep !== null || x !== tx || y !== ty || zoom !== targetZoom) frame = requestAnimationFrame(draw);
  else previous = 0;
 }
 function scroll() {
  if (!enabled()) { stop(); return; }
  var distance = Math.max(1, root.scrollHeight - window.innerHeight);
  var progress = Math.max(0, Math.min(1, window.scrollY / distance));
  sweep = null; tx = .94 - progress * .88; ty = .18 + progress * .64;
  targetZoom = 1 + progress * (window.innerWidth <= 760 ? .05 : .08);
  start();
 }
 function pointer(event) {
  if (!enabled() || !fine.matches || event.pointerType === 'touch' || sweep !== null) return;
  tx = Math.max(.06, Math.min(.94, event.clientX / window.innerWidth));
  ty = Math.max(.12, Math.min(.88, event.clientY / window.innerHeight));
  start();
 }
 function click(event) {
  if (!enabled() || (event.button !== undefined && event.button !== 0)) return;
  ty = Math.max(.12, Math.min(.88, event.clientY / window.innerHeight));
  sweep = -1;start();
 }
 window.addEventListener('scroll', scroll, {passive:true});
 window.addEventListener('resize', scroll, {passive:true});
 window.addEventListener('pageshow', scroll);
 window.addEventListener('pagehide', stop);
 document.addEventListener('pointermove', pointer, {passive:true});
 document.addEventListener('pointerdown', click, {passive:true});
 document.addEventListener('visibilitychange', scroll);
 reduce.addEventListener('change', scroll);
 new MutationObserver(scroll).observe(root, {attributes:true, attributeFilter:['data-motion']});
 scroll();
})();
