/**
 * Подсветка активного пункта шапки: О компании / Библиотека / Расчёт.
 */
(function () {
  function setupMobileMenu() {
    var topRow = document.querySelector('.top-row');
    var logoLink = document.querySelector('.logo-link');
    var siteNav = document.querySelector('.site-nav');

    if (!topRow || !logoLink || !siteNav || document.querySelector('.mobile-menu-toggle')) {
      return;
    }

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mobile-menu-toggle';
    toggle.setAttribute('aria-label', 'Открыть меню');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    logoLink.insertAdjacentElement('afterend', toggle);

    function closeMenu() {
      topRow.classList.remove('mobile-menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть меню');
    }

    function openMenu() {
      topRow.classList.add('mobile-menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Закрыть меню');
    }

    toggle.addEventListener('click', function () {
      if (topRow.classList.contains('mobile-menu-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    topRow.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 480) closeMenu();
    });
  }

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
      if (hash === '#calc') key = 'calc';
      else key = 'company';
    }

    if (key) {
      var el = document.querySelector('.site-nav-link[data-nav="' + key + '"]');
      if (el) el.classList.add('active');
    }
  }

  setupMobileMenu();
  applyActiveNav();
  window.addEventListener('hashchange', applyActiveNav);
})();
