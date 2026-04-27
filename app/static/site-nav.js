/**
 * Подсветка активного пункта шапки: О компании / Библиотека / Расчёт / Контакты
 */
(function () {
  function applyActiveNav() {
    document.querySelectorAll('.site-nav-link[data-nav]').forEach(function (a) {
      a.classList.remove('active');
    });
    var path = location.pathname || '/';
    var hash = (location.hash || '').toLowerCase();
    var key = null;

    if (path.indexOf('library.html') !== -1) key = 'library';
    else if (path.indexOf('projects.html') !== -1) key = 'library';
    else if (path.indexOf('calculator.html') !== -1) key = 'calc';
    else if (path === '/' || path === '' || path.endsWith('/')) {
      if (hash === '#contacts') key = 'contacts';
      else if (hash === '#calc') key = 'calc';
      else key = 'company';
    }

    if (key) {
      var el = document.querySelector('.site-nav-link[data-nav="' + key + '"]');
      if (el) el.classList.add('active');
    }
  }

  applyActiveNav();
  window.addEventListener('hashchange', applyActiveNav);
})();
