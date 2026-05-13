    const API = '/api/v1';
    const token = () => localStorage.getItem('access_token');
    /** Счётчик запросов расчёта: отбрасываем устаревший ответ fetch при быстром вводе. */
    let calcRecalcSeq = 0;

    function normalizePhone(v) {
      return (v || '').replace(/[\s()\-]/g, '');
    }
    function isValidPhone(v) {
      const n = normalizePhone(v);
      return /^(\+7|8|7)\d{10}$/.test(n);
    }

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

    function formatApiDetail(detail) {
      if (detail == null || detail === '') return '';
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((part) => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object' && typeof part.msg === 'string') return part.msg;
            return '';
          })
          .filter(Boolean)
          .join('; ');
      }
      if (typeof detail === 'object' && detail !== null && typeof detail.msg === 'string') return detail.msg;
      try {
        return JSON.stringify(detail);
      } catch (_) {
        return '';
      }
    }

    async function readErrorDetail(r) {
      try {
        const j = await r.json();
        const line = formatApiDetail(j.detail);
        return line || 'Запрос отклонён';
      } catch (_) {
        return (await r.text()) || 'Ошибка';
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

    /** @returns {{ ok: true, length: number, width: number, height: number } | { ok: false, reason: string }} */
    function getCalcDims() {
      const defs = [
        { id: 'length', ru: 'длина', el: document.getElementById('length') },
        { id: 'width', ru: 'ширина', el: document.getElementById('width') },
        { id: 'height', ru: 'высота', el: document.getElementById('height') },
      ];
      const out = {};
      for (const { id, ru, el } of defs) {
        const raw = String(el.value ?? '').trim();
        if (raw === '' || raw === '-' || raw === '+' || /^[+-]$/.test(raw)) {
          return { ok: false, reason: 'Введите габариты: положительные числа в пределах, указанных у полей.' };
        }
        const n = parseFloat(raw);
        if (!Number.isFinite(n) || n <= 0) {
          return { ok: false, reason: 'Габариты должны быть положительными числами (без «−» и букв).' };
        }
        const min = parseFloat(el.getAttribute('min'));
        const max = parseFloat(el.getAttribute('max'));
        if (Number.isFinite(min) && n < min) {
          return { ok: false, reason: ru.charAt(0).toUpperCase() + ru.slice(1) + `: не менее ${min} м.` };
        }
        if (Number.isFinite(max) && n > max) {
          return { ok: false, reason: ru.charAt(0).toUpperCase() + ru.slice(1) + `: не более ${max} м.` };
        }
        out[id] = n;
      }
      return { ok: true, length: out.length, width: out.width, height: out.height };
    }

    function calcPayload() {
      const d = getCalcDims();
      if (!d.ok) return null;
      return {
        length: d.length,
        width: d.width,
        height: d.height,
        object_type: document.getElementById('objectType').value,
        frame_type: document.getElementById('frameType').value,
      };
    }

    function setCalcResultPlaceholders() {
      document.getElementById('rvArea').textContent = '—';
      document.getElementById('rvPrice').textContent = '—';
      document.getElementById('rvTime').textContent = '—';
      document.getElementById('rvWeight').textContent = '—';
    }

    function setRequestButtonEnabled(on) {
      const btn = document.getElementById('btnCreateRequest');
      btn.disabled = !on;
      btn.setAttribute('aria-disabled', on ? 'false' : 'true');
    }

    async function recalc() {
      const seq = ++calcRecalcSeq;
      const hint = document.getElementById('calcInputHint');
      const dims = getCalcDims();
      if (!dims.ok) {
        setCalcResultPlaceholders();
        setRequestButtonEnabled(false);
        if (hint) {
          hint.textContent = dims.reason;
          hint.hidden = false;
        }
        return;
      }
      if (hint) hint.hidden = true;

      const body = {
        length: dims.length,
        width: dims.width,
        height: dims.height,
        object_type: document.getElementById('objectType').value,
        frame_type: document.getElementById('frameType').value,
      };
      const r = await fetch(API + '/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (seq !== calcRecalcSeq) return;

      if (!r.ok) {
        setCalcResultPlaceholders();
        setRequestButtonEnabled(false);
        const errText = await readErrorDetail(r);
        if (seq !== calcRecalcSeq) return;
        if (hint) {
          hint.textContent = 'Расчёт недоступен: ' + errText;
          hint.hidden = false;
        }
        return;
      }
      const d = await r.json();
      if (seq !== calcRecalcSeq) return;
      setRequestButtonEnabled(true);
      if (hint) hint.hidden = true;
      document.getElementById('rvArea').textContent = d.area_sqm.toLocaleString('ru-RU') + ' м²';
      document.getElementById('rvPrice').textContent = d.estimated_cost_rub.toLocaleString('ru-RU') + ' ₽';
      document.getElementById('rvTime').textContent = d.construction_time_label;
      document.getElementById('rvWeight').textContent = '≈ ' + d.material_weight_tonnes.toLocaleString('ru-RU') + ' т';
    }

    async function createFlowAuthenticated() {
      const dims = getCalcDims();
      if (!dims.ok) {
        alert(dims.reason);
        return;
      }
      const name = prompt('Название проекта (для сохранения расчёта)', 'Предварительный расчёт ангара');
      if (!name) return;
      const c = calcPayload();
      if (!c) {
        alert('Проверьте габариты перед сохранением проекта.');
        return;
      }
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
      const dims = getCalcDims();
      if (!dims.ok) {
        alert(dims.reason);
        return;
      }
      if (document.getElementById('btnCreateRequest').disabled) {
        alert('Дождитесь успешного расчёта или исправьте габариты.');
        return;
      }
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
      if (!isValidPhone(phone)) {
        msgEl.textContent = 'Укажите корректный телефон, например +7 (495) 123-45-67';
        msgEl.className = 'msg';
        return;
      }
      const c = calcPayload();
      if (!c) {
        msgEl.textContent = 'Проверьте габариты в калькуляторе (положительные числа в допустимых пределах).';
        msgEl.className = 'msg';
        return;
      }
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
          const line = formatApiDetail(e.detail);
          msgEl.textContent = line || 'Ошибка отправки';
        } catch (_) {
          msgEl.textContent = await r.text() || 'Ошибка отправки';
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

    function closeModal(modal) {
      modal.classList.remove('open');
    }

    document.querySelectorAll('.modal-bg').forEach((modalBg) => {
      modalBg.addEventListener('click', (event) => { 
        if (event.target === modalBg) {
        closeModal(modalBg)}
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        document.querySelectorAll('.modal-bg.open').forEach(closeModal);
      }
    });


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
      const msg = document.getElementById('regMsg');
      const full_name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const password = document.getElementById('regPassword').value;
      if (!full_name || !email || !phone || !password) {
        msg.textContent = 'Заполните все поля';
        msg.className = 'msg';
        return;
      }
      if (!isValidPhone(phone)) {
        msg.textContent = 'Укажите корректный телефон, например +7 (495) 123-45-67';
        msg.className = 'msg';
        return;
      }
      if (password.length < 6) {
        msg.textContent = 'Пароль должен быть не короче 6 символов';
        msg.className = 'msg';
        return;
      }
      const body = { full_name, email, phone, password };
      const r = await fetch(API + '/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { msg.textContent = await readErrorDetail(r); msg.className = 'msg'; return; }
      msg.textContent = 'Аккаунт создан. Войдите.'; msg.className = 'msg ok';
      document.getElementById('modalRegister').classList.remove('open');
      document.getElementById('modalLogin').classList.add('open');
    };

    function showPolicyStub(e) {
      e.preventDefault();
      alert('Текст политики обработки персональных данных и пользовательского соглашения публикуется компанией ООО «РостГидроСтрой» и применяется к взаимодействию пользователя с сервисом.');
    }
    document.querySelectorAll('a[id^="lnkPolicy"], a[id^="lnkTerms"]').forEach(a => {
      a.addEventListener('click', showPolicyStub);
    });

    loadPublicConfig();
    authUi();
    setRequestButtonEnabled(false);
    recalc();

    (function openModalsFromQuery() {
      const p = new URLSearchParams(location.search);
      if (p.get('openLogin') === '1') document.getElementById('modalLogin').classList.add('open');
      if (p.get('openRegister') === '1') document.getElementById('modalRegister').classList.add('open');
    })();
