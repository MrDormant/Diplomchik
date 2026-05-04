    const API = '/api/v1';
    let token = localStorage.getItem('manager_token');

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
      document.getElementById('loginState').textContent = 'Вход выполнен';
      document.getElementById('loginState').style.color = 'var(--success)';
      loadSummary();
      loadRequests();
    };

    if (token) {
      document.getElementById('loginState').textContent = 'Сессия активна';
      document.getElementById('loginState').style.color = 'var(--success)';
      loadSummary();
      loadRequests();
    }
