/* Shantik Master UI V4: accessible mobile navigation, read-only enhancement. */
(function () {
  'use strict';
  var toggle = document.getElementById('navMenuToggle');
  var nav = document.getElementById('shantikNavLinks');
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle('is-open', !!open);
    toggle.setAttribute('aria-expanded', String(!!open));
    toggle.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
    var icon = toggle.querySelector('.menu-icon');
    if (icon) icon.textContent = open ? '×' : '☰';
  }
  toggle.addEventListener('click', function (event) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setOpen(false);
  });
  document.addEventListener('click', function (event) {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 760) setOpen(false);
  }, { passive: true });
})();
