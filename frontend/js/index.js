    const API = '/api/v1';
    const token = () => localStorage.getItem('access_token');

    async function loadPublicConfig() {
      try {
        const r = await fetch(API + '/public/config');
        const j = await r.json();
        const tel = j.manager_phone || '+74951234567';
        const href = j.manager_phone_tel || ('tel:' + tel.replace(/[^+0-9]/g, ''));
        const mgr = document.getElementById('managerTel');
        mgr.href = href;
        mgr.textContent = tel;
        const ft = document.getElementById('footerTel');
        ft.href = href;
        ft.textContent = tel;
      } catch (e) { console.warn(e); }
    }

    function authUi() {
      const ok = !!token();
      document.getElementById('linkCabinet').style.display = ok ? 'inline-flex' : 'none';
      document.getElementById('btnLogin').style.display = ok ? 'none' : 'inline-flex';
      document.getElementById('btnRegister').style.display = ok ? 'none' : 'inline-flex';
    }

    async function readErrorDetail(r) {
      try {
        const j = await r.json();
        if (typeof j.detail === 'string') return j.detail;
        if (Array.isArray(j.detail)) return j.detail.map(x => x.msg || x).join('; ');
        return JSON.stringify(j.detail);
      } catch (_) {
        return await r.text();
      }
    }

    function forceRelogin(message) {
      localStorage.removeItem('access_token');
      authUi();
      const msg = document.getElementById('loginMsg');
      msg.textContent = message || 'Войдите снова';
      msg.className = 'msg';
      document.getElementById('modalLogin').classList.add('open');
    }

    function calcPayload() {
      return {
        length: parseFloat(document.getElementById('length').value) || 0,
        width: parseFloat(document.getElementById('width').value) || 0,
        height: parseFloat(document.getElementById('height').value) || 0,
        object_type: document.getElementById('objectType').value,
        frame_type: document.getElementById('frameType').value,
      };
    }

    async function recalc() {
      const body = calcPayload();
      const r = await fetch(API + '/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { alert('Ошибка расчёта'); return; }
      const d = await r.json();
      document.getElementById('rvArea').textContent = d.area_sqm.toLocaleString('ru-RU') + ' м²';
      document.getElementById('rvPrice').textContent = d.estimated_cost_rub.toLocaleString('ru-RU') + ' ₽';
      document.getElementById('rvTime').textContent = d.construction_time_label;
      document.getElementById('rvWeight').textContent = '≈ ' + d.material_weight_tonnes.toLocaleString('ru-RU') + ' т';
    }

    async function createFlowAuthenticated() {
      const name = prompt('Название проекта (для сохранения расчёта)', 'Предварительный расчёт ангара');
      if (!name) return;
      const c = calcPayload();
      const body = {
        name,
        object_type: c.object_type,
        frame_type: c.frame_type,
        length: c.length,
        width: c.width,
        height: c.height,
      };
      const r = await fetch(API + '/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        if (r.status === 401) { forceRelogin(await readErrorDetail(r)); return; }
        alert('Ошибка сохранения проекта: ' + (await readErrorDetail(r)));
        return;
      }
      const proj = await r.json();
      const r2 = await fetch(API + '/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
        body: JSON.stringify({ project_id: proj.id, source: 'calculator', comment: 'Заявка с главной страницы (калькулятор)' }),
      });
      if (!r2.ok) {
        if (r2.status === 401) { forceRelogin(await readErrorDetail(r2)); return; }
        alert('Ошибка заявки: ' + (await readErrorDetail(r2)));
        return;
      }
      alert('Заявка создана. Оператор уведомлён по email (в тесте — Mailpit). Откройте личный кабинет.');
      window.location.href = '/cabinet.html';
    }

    function openGuestModal() {
      document.getElementById('guestMsg').textContent = '';
      document.getElementById('guestMsg').className = 'msg';
      document.getElementById('modalGuestRequest').classList.add('open');
    }

    async function createFlow() {
      if (token()) {
        await createFlowAuthenticated();
        return;
      }
      openGuestModal();
    }

    async function submitGuestRequest() {
      const msgEl = document.getElementById('guestMsg');
      const full_name = document.getElementById('guestName').value.trim();
      const phone = document.getElementById('guestPhone').value.trim();
      const comment = document.getElementById('guestComment').value.trim() || null;
      if (!full_name || !phone) {
        msgEl.textContent = 'Укажите имя и телефон';
        msgEl.className = 'msg';
        return;
      }
      const c = calcPayload();
      const body = {
        full_name,
        phone,
        comment,
        length: c.length,
        width: c.width,
        height: c.height,
        object_type: c.object_type,
        frame_type: c.frame_type,
      };
      const r = await fetch(API + '/public/calculator-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        try {
          const e = await r.json();
          msgEl.textContent = e.detail || 'Ошибка отправки';
        } catch (_) {
          msgEl.textContent = await r.text();
        }
        msgEl.className = 'msg';
        return;
      }
      msgEl.textContent = '';
      document.getElementById('modalGuestRequest').classList.remove('open');
      alert('Заявка отправлена. С вами свяжется оператор. Чтобы видеть статус в личном кабинете, зарегистрируйтесь — кнопка «Регистрация» в шапке.');
    }

    document.getElementById('btnCreateRequest').addEventListener('click', createFlow);
    ['length','width','height','objectType','frameType'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('change', recalc);
      el.addEventListener('input', () => { if (id !== 'objectType' && id !== 'frameType') recalc(); });
    });

    document.getElementById('btnLogin').onclick = () => document.getElementById('modalLogin').classList.add('open');
    document.getElementById('btnCloseLogin').onclick = () => document.getElementById('modalLogin').classList.remove('open');
    document.getElementById('btnRegister').onclick = () => document.getElementById('modalRegister').classList.add('open');
    document.getElementById('btnCloseRegister').onclick = () => document.getElementById('modalRegister').classList.remove('open');
    document.getElementById('btnGuestClose').onclick = () => document.getElementById('modalGuestRequest').classList.remove('open');
    document.getElementById('btnGuestToRegister').onclick = () => {
      document.getElementById('modalGuestRequest').classList.remove('open');
      document.getElementById('modalRegister').classList.add('open');
    };
    document.getElementById('btnGuestSubmit').onclick = submitGuestRequest;

    document.getElementById('btnDoLogin').onclick = async () => {
      const fd = new URLSearchParams();
      fd.append('username', document.getElementById('loginEmail').value);
      fd.append('password', document.getElementById('loginPassword').value);
      const r = await fetch(API + '/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fd });
      const msg = document.getElementById('loginMsg');
      if (!r.ok) { msg.textContent = 'Неверный логин или пароль'; msg.className = 'msg'; return; }
      const d = await r.json();
      localStorage.setItem('access_token', d.access_token);
      msg.textContent = 'Успешно'; msg.className = 'msg ok';
      authUi();
      document.getElementById('modalLogin').classList.remove('open');
    };

    document.getElementById('btnDoRegister').onclick = async () => {
      const body = {
        full_name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value,
      };
      const msg = document.getElementById('regMsg');
      const r = await fetch(API + '/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { const e = await r.json(); msg.textContent = e.detail || 'Ошибка'; msg.className = 'msg'; return; }
      msg.textContent = 'Аккаунт создан. Войдите.'; msg.className = 'msg ok';
      document.getElementById('modalRegister').classList.remove('open');
      document.getElementById('modalLogin').classList.add('open');
    };

    loadPublicConfig();
    authUi();
    recalc();

    (function openModalsFromQuery() {
      const p = new URLSearchParams(location.search);
      if (p.get('openLogin') === '1') document.getElementById('modalLogin').classList.add('open');
      if (p.get('openRegister') === '1') document.getElementById('modalRegister').classList.add('open');
    })();
