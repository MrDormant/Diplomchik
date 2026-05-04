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

    async function loadStaffCategories() {
      const r = await fetch(API + '/categories');
      if (!r.ok) return;
      const list = await r.json();
      const sel = document.getElementById('staffCat');
      sel.innerHTML = '';
      list.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.name + ' (' + c.slug + ')';
        sel.appendChild(o);
      });
    }

    async function loadStaffUsers() {
      const r = await fetch(API + '/admin/users', { headers: { 'Authorization': 'Bearer ' + token() } });
      const tb = document.getElementById('staffUsersBody');
      if (!r.ok) {
        tb.innerHTML = '<tr><td colspan="6" class="sm">Не удалось загрузить пользователей</td></tr>';
        return;
      }
      const rows = await r.json();
      tb.innerHTML = '';
      rows.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td class="mono">' + u.id + '</td>' +
          '<td>' + escapeHtml(u.full_name) + '</td>' +
          '<td class="sm">' + escapeHtml(u.email) + '</td>' +
          '<td class="sm mono">' + escapeHtml(u.phone || '—') + '</td>' +
          '<td><span class="chip" style="background:var(--cyan-soft);color:var(--navy);border:1px solid var(--line);">' + escapeHtml(u.role) + '</span></td>' +
          '<td class="sm mono">' + new Date(u.created_at).toLocaleString('ru-RU') + '</td>';
        tb.appendChild(tr);
      });
    }

    async function loadStaffSolutions() {
      const r = await fetch(API + '/admin/solutions', { headers: { 'Authorization': 'Bearer ' + token() } });
      const tb = document.getElementById('staffSolBody');
      if (!r.ok) {
        tb.innerHTML = '<tr><td colspan="6" class="sm">Нет доступа к каталогу</td></tr>';
        return;
      }
      const rows = await r.json();
      tb.innerHTML = '';
      rows.forEach(s => {
        const tr = document.createElement('tr');
        const active = s.is_active;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn ghost';
        btn.textContent = active ? 'Снять с сайта' : '—';
        btn.disabled = !active;
        btn.onclick = async () => {
          if (!confirm('Снять решение «' + s.name + '» с публикации на сайте?')) return;
          const d = await fetch(API + '/admin/solutions/' + s.id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token() } });
          if (!d.ok) { alert(await d.text()); return; }
          loadStaffSolutions();
        };
        const tdAct = document.createElement('td');
        tdAct.appendChild(btn);
        tr.innerHTML =
          '<td class="mono">' + s.id + '</td>' +
          '<td class="mono">' + escapeHtml(s.code || '—') + '</td>' +
          '<td>' + escapeHtml(s.name) + '</td>' +
          '<td class="sm">' + escapeHtml(s.category_name) + '</td>' +
          '<td>' + (active ? '<span class="status done">да</span>' : '<span class="status cancelled">нет</span>') + '</td>';
        tr.appendChild(tdAct);
        tb.appendChild(tr);
      });
    }

    document.getElementById('btnAddSolution').onclick = async () => {
      const msgEl = document.getElementById('staffSolMsg');
      msgEl.textContent = '';
      msgEl.className = 'msg';
      const category_id = parseInt(document.getElementById('staffCat').value, 10);
      const name = document.getElementById('staffName').value.trim();
      const slug = document.getElementById('staffSlug').value.trim().toLowerCase();
      if (!name || !slug) {
        msgEl.textContent = 'Укажите название и slug';
        return;
      }
      const body = new FormData();
      body.append('category_id', String(category_id));
      body.append('name', name);
      body.append('slug', slug);
      body.append('code', document.getElementById('staffCode').value.trim());
      body.append('short_description', document.getElementById('staffShort').value.trim());
      body.append('description', '');
      body.append('base_material_cost', String(parseFloat(document.getElementById('staffMat').value) || 0));
      body.append('base_work_cost', String(parseFloat(document.getElementById('staffWork').value) || 0));
      body.append('material_type', document.getElementById('staffMatType').value.trim());
      body.append('is_featured', document.getElementById('staffFeatured').checked ? 'true' : 'false');
      const cover = document.getElementById('staffCover').files[0];
      if (cover) body.append('cover_file', cover);

      const r = await fetch(API + '/admin/solutions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token() },
        body,
      });
      if (!r.ok) {
        try {
          const e = await r.json();
          msgEl.textContent = typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail);
        } catch (_) {
          msgEl.textContent = await r.text();
        }
        return;
      }
      msgEl.textContent = 'Сохранено';
      msgEl.className = 'msg ok';
      document.getElementById('staffName').value = '';
      document.getElementById('staffSlug').value = '';
      document.getElementById('staffCode').value = '';
      document.getElementById('staffShort').value = '';
      document.getElementById('staffCover').value = '';
      loadStaffSolutions();
    };

    function formatRubMaybe(v) {
      const n = Number(v || 0);
      if (!n) return '—';
      return n.toLocaleString('ru-RU') + ' ₽';
    }

    async function loadStaffShowcase() {
      const r = await fetch(API + '/admin/showcase-projects', { headers: { 'Authorization': 'Bearer ' + token() } });
      const tb = document.getElementById('showBody');
      if (!r.ok) {
        tb.innerHTML = '<tr><td colspan="6" class="sm">Не удалось загрузить готовые проекты</td></tr>';
        return;
      }
      const rows = await r.json();
      tb.innerHTML = '';
      if (!rows.length) {
        tb.innerHTML = '<tr><td colspan="6" class="sm">Готовых проектов пока нет</td></tr>';
        return;
      }
      rows.forEach(p => {
        const tr = document.createElement('tr');
        const active = p.is_active;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn ghost';
        btn.textContent = active ? 'Снять с сайта' : '—';
        btn.disabled = !active;
        btn.onclick = async () => {
          if (!confirm('Снять проект «' + p.name + '» с публикации?')) return;
          const d = await fetch(API + '/admin/showcase-projects/' + p.id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token() } });
          if (!d.ok) { alert(await d.text()); return; }
          loadStaffShowcase();
        };
        const tdAct = document.createElement('td');
        tdAct.appendChild(btn);
        tr.innerHTML =
          '<td class="mono">' + p.id + '</td>' +
          '<td>' + escapeHtml(p.name) + '</td>' +
          '<td class="sm">' + escapeHtml(p.address || '—') + '</td>' +
          '<td class="mono">' + formatRubMaybe(p.project_cost) + '</td>' +
          '<td>' + (active ? '<span class="status done">да</span>' : '<span class="status cancelled">нет</span>') + '</td>';
        tr.appendChild(tdAct);
        tb.appendChild(tr);
      });
    }

    document.getElementById('btnAddShowcase').onclick = async () => {
      const msgEl = document.getElementById('showMsg');
      msgEl.textContent = '';
      msgEl.className = 'msg';
      const name = document.getElementById('showName').value.trim();
      if (!name) {
        msgEl.textContent = 'Укажите название проекта';
        return;
      }
      const body = new FormData();
      body.append('name', name);
      body.append('description', document.getElementById('showDesc').value.trim());
      body.append('address', document.getElementById('showAddr').value.trim());
      const cost = document.getElementById('showCost').value.trim();
      if (cost !== '') body.append('project_cost', cost);
      const cover = document.getElementById('showCover').files[0];
      if (cover) body.append('cover_file', cover);

      const r = await fetch(API + '/admin/showcase-projects', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token() },
        body,
      });
      if (!r.ok) {
        try {
          const e = await r.json();
          msgEl.textContent = typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail);
        } catch (_) {
          msgEl.textContent = await r.text();
        }
        return;
      }
      msgEl.textContent = 'Проект добавлен';
      msgEl.className = 'msg ok';
      document.getElementById('showName').value = '';
      document.getElementById('showDesc').value = '';
      document.getElementById('showAddr').value = '';
      document.getElementById('showCost').value = '';
      document.getElementById('showCover').value = '';
      loadStaffShowcase();
    };

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
        await loadStaffCategories();
        await loadStaffUsers();
        await loadStaffSolutions();
        await loadStaffShowcase();
      } else {
        document.getElementById('clientPanel').style.display = 'block';
        await runClient();
      }
    }

    init();
