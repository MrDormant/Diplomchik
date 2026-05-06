    const API = '/api/v1';
    let token = localStorage.getItem('manager_token');
    let currentUser = null;

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

    function escapeHtml(s) {
      return (s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    function statusClass(status) {
      const map = {
        new: 'new',
        in_progress: 'in_progress',
        quoted: 'quoted',
        done: 'done',
        cancelled: 'cancelled'
      };
      return map[status] || 'new';
    }

    function statusLabel(status) {
      const map = {
        new: 'новая',
        in_progress: 'в работе',
        quoted: 'КП отправлено',
        done: 'завершена',
        cancelled: 'отменена'
      };
      return map[status] || status;
    }

    function showAdminSection(section) {
      document.querySelectorAll('.admin-section').forEach(el => {
        el.classList.toggle('active', el.id === 'admin-section-' + section);
      });
      document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
      });
    }

    function authHeaders() {
      return { 'Authorization': 'Bearer ' + token };
    }

    function isStaff() {
      return currentUser && (currentUser.role === 'manager' || currentUser.role === 'admin');
    }

    function isAdmin() {
      return currentUser && currentUser.role === 'admin';
    }

    async function ensureStaffAccess() {
      const msg = document.getElementById('msg');
      if (!token) {
        msg.textContent = 'Войдите как менеджер или администратор';
        return false;
      }
      const r = await fetch(API + '/me', { headers: authHeaders() });
      if (!r.ok) {
        localStorage.removeItem('manager_token');
        token = null;
        msg.textContent = 'Сессия недействительна — войдите снова';
        return false;
      }
      currentUser = await r.json();
      if (!isStaff()) {
        msg.textContent = 'Недостаточно прав: панель доступна только менеджеру или администратору';
        msg.style.color = 'var(--danger)';
        return false;
      }
      msg.textContent = 'Вы вошли как ' + escapeHtml(currentUser.full_name) + ' (' + escapeHtml(currentUser.role) + ').';
      msg.style.color = 'var(--muted)';
      return true;
    }

    function formatRubMaybe(v) {
      const n = Number(v || 0);
      if (!n) return '—';
      return n.toLocaleString('ru-RU') + ' ₽';
    }

    async function readResponseError(r) {
      try {
        const e = await r.json();
        return typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail);
      } catch (_) {
        return await r.text();
      }
    }

    async function loadSummary() {
      const r = await fetch(API + '/admin/summary', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!r.ok) return;
      const s = await r.json();
      const box = document.getElementById('summary');
      box.style.display = 'block';
      let chips = '';
      for (const key of Object.keys(s.by_status)) {
        chips += '<span class="chip" style="background:var(--cyan-soft);color:var(--cyan);border-color:var(--cyan);">' + escapeHtml(statusLabel(key)) + ': ' + s.by_status[key] + '</span>';
      }
      box.innerHTML =
        '<div class="panel-head" style="background:#f5f8fc;color:var(--text);"><h3 style="color:var(--text);">Сводка</h3><div class="chips">' +
        '<span class="chip" style="background:var(--navy);color:#fff;border-color:var(--navy);">Всего: ' + s.requests_total + '</span>' +
        chips +
        '</div></div>';
    }

    async function loadRequests() {
      const r = await fetch(API + '/admin/requests', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!r.ok) {
        document.getElementById('msg').textContent = 'Нет доступа (нужен менеджер или админ)';
        return;
      }
      document.getElementById('msg').textContent = '';
      const rows = await r.json();
      document.getElementById('tbl').style.display = 'block';
      const tb = document.getElementById('tbody');
      tb.innerHTML = '';
      rows.forEach(x => {
        const tr = document.createElement('tr');

        const sel = document.createElement('select');
        sel.className = 'mini';
        ['new','in_progress','quoted','done','cancelled'].forEach(st => {
          const o = document.createElement('option');
          o.value = st; o.textContent = st;
          if (st === x.status) o.selected = true;
          sel.appendChild(o);
        });

        const note = document.createElement('input');
        note.type = 'text';
        note.className = 'input';
        note.placeholder = 'Комментарий для клиента';
        note.value = x.manager_note || '';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn primary';
        btn.textContent = 'Сохранить';
        btn.onclick = async () => {
          const r2 = await fetch(API + '/admin/requests/' + x.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ status: sel.value, manager_note: note.value || null }),
          });
          if (!r2.ok) { alert(await r2.text()); return; }
          loadRequests();
          loadSummary();
        };

        const actionTd = document.createElement('td');
        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.gap = '6px';
        wrap.style.alignItems = 'center';
        wrap.appendChild(sel);
        wrap.appendChild(btn);
        actionTd.appendChild(wrap);

        const noteTd = document.createElement('td');
        noteTd.style.minWidth = '220px';
        noteTd.appendChild(note);

        const client = x.user
          ? (escapeHtml(x.user.full_name) + '<br><span class="sm mono">' + escapeHtml(x.user.email) + (x.user.phone ? ' · ' + escapeHtml(x.user.phone) : '') + '</span>')
          : (x.guest_full_name
              ? (escapeHtml(x.guest_full_name) + '<br><span class="sm mono">гость · ' + escapeHtml(x.guest_phone || '') + '</span>')
              : ('—'));

        tr.innerHTML =
          '<td class="num mono">#' + x.id + '</td>' +
          '<td>' + client + '</td>' +
          '<td><span class="status ' + statusClass(x.status) + '">' + statusLabel(x.status) + '</span></td>' +
          '<td class="sm">' + escapeHtml(x.source === 'calculator' ? 'Калькулятор' : 'Библиотека') + '</td>' +
          '<td class="sm mono">' + new Date(x.created_at).toLocaleString('ru-RU') + '</td>';
        tr.appendChild(noteTd);
        tr.appendChild(actionTd);
        tb.appendChild(tr);
      });
    }

    async function loadCategories() {
      const r = await fetch(API + '/categories');
      if (!r.ok) return;
      const rows = await r.json();
      const sel = document.getElementById('adminSolutionCat');
      sel.innerHTML = '';
      rows.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.name + ' (' + c.slug + ')';
        sel.appendChild(o);
      });
    }

    async function loadUsers() {
      const tb = document.getElementById('adminUsersBody');
      const r = await fetch(API + '/admin/users', { headers: authHeaders() });
      if (!r.ok) {
        tb.innerHTML = '<tr><td colspan="7" class="sm">Не удалось загрузить пользователей</td></tr>';
        return;
      }
      const rows = await r.json();
      tb.innerHTML = '';
      rows.forEach(u => {
        const tr = document.createElement('tr');
        const actionTd = document.createElement('td');
        if (isAdmin() && currentUser.id !== u.id) {
          const wrap = document.createElement('div');
          wrap.style.display = 'flex';
          wrap.style.gap = '6px';
          wrap.style.alignItems = 'center';
          const sel = document.createElement('select');
          sel.className = 'mini';
          ['client','manager','admin'].forEach(role => {
            const o = document.createElement('option');
            o.value = role;
            o.textContent = role;
            if (role === u.role) o.selected = true;
            sel.appendChild(o);
          });
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn ghost';
          btn.textContent = 'Сохранить';
          btn.onclick = async () => {
            const upd = await fetch(API + '/admin/users/' + u.id + '/role', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', ...authHeaders() },
              body: JSON.stringify({ role: sel.value }),
            });
            if (!upd.ok) { alert(await readResponseError(upd)); return; }
            loadUsers();
          };
          wrap.appendChild(sel);
          wrap.appendChild(btn);
          actionTd.appendChild(wrap);
        } else {
          actionTd.innerHTML = '<span class="sm">только просмотр</span>';
        }
        tr.innerHTML =
          '<td class="mono">' + u.id + '</td>' +
          '<td>' + escapeHtml(u.full_name) + '</td>' +
          '<td class="sm">' + escapeHtml(u.email) + '</td>' +
          '<td class="sm mono">' + escapeHtml(u.phone || '—') + '</td>' +
          '<td><span class="chip" style="background:var(--cyan-soft);color:var(--navy);border:1px solid var(--line);">' + escapeHtml(u.role) + '</span></td>' +
          '<td class="sm mono">' + new Date(u.created_at).toLocaleString('ru-RU') + '</td>';
        tr.appendChild(actionTd);
        tb.appendChild(tr);
      });
    }

    async function loadAllAdminData() {
      if (!(await ensureStaffAccess())) return;
      await loadSummary();
      await loadRequests();
      await loadUsers();
      await loadCategories();
      await loadSolutions();
      await loadShowcase();
    }

    async function loadSolutions() {
      const tb = document.getElementById('adminSolutionsBody');
      const r = await fetch(API + '/admin/solutions', { headers: authHeaders() });
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
          const d = await fetch(API + '/admin/solutions/' + s.id, { method: 'DELETE', headers: authHeaders() });
          if (!d.ok) { alert(await readResponseError(d)); return; }
          loadSolutions();
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

    async function addSolution() {
      const msgEl = document.getElementById('solutionMsg');
      msgEl.textContent = '';
      msgEl.className = 'msg';
      const categoryId = parseInt(document.getElementById('adminSolutionCat').value, 10);
      const name = document.getElementById('adminSolutionName').value.trim();
      const slug = document.getElementById('adminSolutionSlug').value.trim().toLowerCase();
      if (!name || !slug) {
        msgEl.textContent = 'Укажите название и slug';
        return;
      }

      const body = new FormData();
      body.append('category_id', String(categoryId));
      body.append('name', name);
      body.append('slug', slug);
      body.append('code', document.getElementById('adminSolutionCode').value.trim());
      body.append('short_description', document.getElementById('adminSolutionShort').value.trim());
      body.append('description', '');
      body.append('base_material_cost', String(parseFloat(document.getElementById('adminSolutionMat').value) || 0));
      body.append('base_work_cost', String(parseFloat(document.getElementById('adminSolutionWork').value) || 0));
      body.append('material_type', document.getElementById('adminSolutionMatType').value.trim());
      body.append('is_featured', document.getElementById('adminSolutionFeatured').checked ? 'true' : 'false');
      const cover = document.getElementById('adminSolutionCover').files[0];
      if (cover) body.append('cover_file', cover);

      const r = await fetch(API + '/admin/solutions', {
        method: 'POST',
        headers: authHeaders(),
        body,
      });
      if (!r.ok) {
        msgEl.textContent = await readResponseError(r);
        return;
      }
      msgEl.textContent = 'Сохранено';
      msgEl.className = 'msg ok';
      ['adminSolutionName','adminSolutionSlug','adminSolutionCode','adminSolutionShort','adminSolutionMatType'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('adminSolutionMat').value = '0';
      document.getElementById('adminSolutionWork').value = '0';
      document.getElementById('adminSolutionFeatured').checked = false;
      document.getElementById('adminSolutionCover').value = '';
      loadSolutions();
    }

    async function loadShowcase() {
      const tb = document.getElementById('adminShowcaseBody');
      const r = await fetch(API + '/admin/showcase-projects', { headers: authHeaders() });
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
          const d = await fetch(API + '/admin/showcase-projects/' + p.id, { method: 'DELETE', headers: authHeaders() });
          if (!d.ok) { alert(await readResponseError(d)); return; }
          loadShowcase();
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

    async function addShowcase() {
      const msgEl = document.getElementById('showcaseMsg');
      msgEl.textContent = '';
      msgEl.className = 'msg';
      const name = document.getElementById('adminShowcaseName').value.trim();
      if (!name) {
        msgEl.textContent = 'Укажите название проекта';
        return;
      }

      const body = new FormData();
      body.append('name', name);
      body.append('description', document.getElementById('adminShowcaseDesc').value.trim());
      body.append('address', document.getElementById('adminShowcaseAddr').value.trim());
      const cost = document.getElementById('adminShowcaseCost').value.trim();
      if (cost !== '') body.append('project_cost', cost);
      const cover = document.getElementById('adminShowcaseCover').files[0];
      if (cover) body.append('cover_file', cover);

      const r = await fetch(API + '/admin/showcase-projects', {
        method: 'POST',
        headers: authHeaders(),
        body,
      });
      if (!r.ok) {
        msgEl.textContent = await readResponseError(r);
        return;
      }
      msgEl.textContent = 'Проект добавлен';
      msgEl.className = 'msg ok';
      ['adminShowcaseName','adminShowcaseDesc','adminShowcaseAddr','adminShowcaseCost'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('adminShowcaseCover').value = '';
      loadShowcase();
    }

    document.getElementById('btnLogin').onclick = async () => {
      const fd = new URLSearchParams();
      fd.append('username', document.getElementById('email').value);
      fd.append('password', document.getElementById('pass').value);
      const r = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: fd
      });
      if (!r.ok) {
        document.getElementById('loginState').textContent = 'Ошибка входа';
        document.getElementById('loginState').style.color = 'var(--danger)';
        return;
      }
      const d = await r.json();
      token = d.access_token;
      localStorage.setItem('manager_token', token);
      localStorage.setItem('access_token', token);
      if (await ensureStaffAccess()) {
        document.getElementById('loginState').textContent = 'Вход выполнен';
        document.getElementById('loginState').style.color = 'var(--success)';
        loadSummary();
        loadRequests();
        loadUsers();
        loadCategories();
        loadSolutions();
        loadShowcase();
      } else {
        localStorage.removeItem('manager_token');
        token = null;
      }
    };

    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => showAdminSection(btn.dataset.section));
    });

    document.getElementById('btnRefreshRequests').onclick = () => {
      if (!token) return;
      loadRequests();
      loadSummary();
    };

    document.getElementById('btnRefreshSummary').onclick = () => {
      if (!token) return;
      loadSummary();
    };

    document.getElementById('btnRefreshUsers').onclick = () => {
      if (!token) return;
      loadUsers();
    };

    document.getElementById('btnRefreshSolutions').onclick = () => {
      if (!token) return;
      loadSolutions();
    };

    document.getElementById('btnRefreshShowcase').onclick = () => {
      if (!token) return;
      loadShowcase();
    };

    document.getElementById('btnAddSolution').onclick = () => {
      if (!token) return;
      addSolution();
    };

    document.getElementById('btnAddShowcase').onclick = () => {
      if (!token) return;
      addShowcase();
    };

    if (token) {
      document.getElementById('loginState').textContent = 'Сессия активна';
      document.getElementById('loginState').style.color = 'var(--success)';
      loadAllAdminData();
    }
