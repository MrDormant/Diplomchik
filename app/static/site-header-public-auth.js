/**
 * Шапка на публичных страницах (библиотека, расчёт): Вход / Регистрация / Кабинет по access_token.
 */
(function () {
  function token() {
    return localStorage.getItem('access_token');
  }
  function authUi() {
    var ok = !!token();
    var cab = document.getElementById('linkCabinet');
    var login = document.getElementById('hdrLogin');
    var reg = document.getElementById('hdrRegister');
    if (cab) cab.style.display = ok ? 'inline-flex' : 'none';
    if (login) login.style.display = ok ? 'none' : 'inline-flex';
    if (reg) reg.style.display = ok ? 'none' : 'inline-flex';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', authUi);
  } else {
    authUi();
  }
})();
