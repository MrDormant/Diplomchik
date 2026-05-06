    const API = '/api/v1';
    const token = () => localStorage.getItem('access_token');

    async function loadPublicConfig() {
      try {
        const j = await (await fetch(API + '/public/config')).json();
        const tel = j.manager_phone || '+74951234567';
        const href = j.manager_phone_tel || ('tel:' + tel.replace(/[^+0-9]/g, ''));
        const mgr = document.getElementById('managerTel');
        mgr.href = href;
        mgr.textContent = tel;
      } catch (e) {}
    }
    loadPublicConfig();

    document.getElementById('btnLogout').onclick = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('manager_token');
      location.href = '/';
    };

    function escapeHtml(s) {
      return (s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    function statusClass(status) {
      const map = { new: 'new', in_progress: 'in_progress', quoted: 'quoted', done: 'done', cancelled: 'cancelled' };
      return map[status] || 'new';
    }

    function statusLabel(status) {
      const map = {
        new: 'новая', in_progress: 'в работе', quoted: 'КП отправлено', done: 'завершена', cancelled: 'отменена'
      };
      return map[status] || status;
    }

    async function runClient() {
      const r = await fetch(API + '/requests', { headers: { 'Authorization': 'Bearer ' + token() } });
      if (!r.ok) {
        if (r.status === 401) {
          localStorage.removeItem('access_token');
          document.getElementById('msg').textContent = 'Сессия недействительна — войдите снова.';
          document.getElementById('msg').style.color = 'var(--danger)';
          return;
        }
        document.getElementById('msg').textContent = 'Нет доступа к заявкам';
        return;
      }
      const rows = await r.json();
      if (!rows.length) {
        document.getElementById('msg').textContent = 'Пока нет заявок. Сделайте расчёт на главной или выберите решение в библиотеке.';
        return;
      }
      document.getElementById('msg').textContent = '';
      document.getElementById('tbl').style.display = 'block';
      const tb = document.getElementById('tbody');
      tb.innerHTML = '';
      rows.forEach(x => {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td class="num mono">#' + x.id + '</td>' +
          '<td><span class="status ' + statusClass(x.status) + '">' + statusLabel(x.status) + '</span></td>' +
          '<td class="sm">' + escapeHtml(x.source === 'calculator' ? 'Калькулятор' : 'Библиотека') + '</td>' +
          '<td class="sm mono">' + new Date(x.created_at).toLocaleString('ru-RU') + '</td>' +
          '<td>' + escapeHtml(x.manager_note || '—') + '</td>';
        tb.appendChild(tr);
      });
    }

    async function init() {
      const msg = document.getElementById('msg');
      if (!token()) {
        msg.textContent = 'Нужна авторизация. На главной нажмите «Вход» или перейдите по ссылке из библиотеки.';
        msg.style.color = 'var(--danger)';
        return;
      }
      const meR = await fetch(API + '/me', { headers: { 'Authorization': 'Bearer ' + token() } });
      if (!meR.ok) {
        if (meR.status === 401) {
          localStorage.removeItem('access_token');
          msg.textContent = 'Сессия недействительна — войдите снова.';
          msg.style.color = 'var(--danger)';
          return;
        }
        msg.textContent = 'Не удалось загрузить профиль';
        return;
      }
      const me = await meR.json();
      msg.textContent = 'Вы вошли как ' + escapeHtml(me.full_name) + ' (' + escapeHtml(me.role) + ').';
      if (me.role === 'manager' || me.role === 'admin') {
        document.getElementById('staffPanel').style.display = 'block';
      } else {
        document.getElementById('clientPanel').style.display = 'block';
        await runClient();
      }
    }

    init();
