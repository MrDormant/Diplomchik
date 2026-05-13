    const API = '/api/v1';
    const token = () => localStorage.getItem('access_token');

    async function cfg() {
      try {
        const j = await (await fetch(API + '/public/config')).json();
        const a = document.getElementById('managerTel');
        a.href = j.manager_phone_tel || 'tel:+74951234567';
        a.textContent = j.manager_phone || '+7 (495) 123-45-67';
      } catch (e) {}
    }

    function escapeHtml(s) {
      return (s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    function coverSrc(url) {
      let u = (url || '').trim() || '/assets/library-covers/ALUDAR.jpg';
      if (/^https?:\/\//i.test(u)) return u;
      if (!u.startsWith('/')) u = '/' + u.replace(/^\/+/, '');
      return u;
    }

    async function load() {
      const r = await fetch(API + '/solutions');
      const list = await r.json();
      document.getElementById('load').style.display = 'none';
      const grid = document.getElementById('grid');
      grid.innerHTML = '';
      list.forEach(s => {
        const el = document.createElement('div');
        el.className = 'sol';
        const code = s.code ? ('<div class="code-tag">' + escapeHtml(s.code) + '</div>') : '';
        const material = s.material_type ? escapeHtml(s.material_type) : 'Типовое решение';
        const total = Number(s.base_material_cost || 0) + Number(s.base_work_cost || 0);
        const price = total ? ('от ' + total.toLocaleString('ru-RU') + ' ₽') : '—';
        const cover = escapeHtml(coverSrc(s.cover_image));
        el.innerHTML =
          '<img class="solution-cover" src="' + cover + '" alt="Обложка: ' + escapeHtml(s.name) + '" onerror="this.onerror=null;this.src=\'/assets/library-covers/ALUDAR.jpg\'">' +
          code +
          '<h4>' + escapeHtml(s.name) + '</h4>' +
          '<p>' + escapeHtml(s.short_description || '') + '</p>' +
          '<div class="specs"><span>' + material + '</span><span class="price mono">' + price + '</span></div>' +
          '<button type="button" class="btn primary" data-id="' + s.id + '">Оформить заявку</button>';
        grid.appendChild(el);
      });
      grid.querySelectorAll('button[data-id]').forEach(btn => {
        btn.addEventListener('click', () => submitRequest(parseInt(btn.dataset.id, 10)));
      });
    }

    async function submitRequest(solutionId) {
      if (!token()) {
        alert('Войдите или зарегистрируйтесь на главной странице.');
        location.href = '/';
        return;
      }
      const commentEl = document.getElementById('comment');
      const comment = commentEl && commentEl.value ? commentEl.value.trim() || null : null;
      const r = await fetch(API + '/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
        body: JSON.stringify({ solution_id: solutionId, source: 'library', comment }),
      });
      if (!r.ok) { alert('Ошибка: ' + await r.text()); return; }
      alert('Заявка отправлена. Проверьте почту в Mailpit и личный кабинет.');
      location.href = '/cabinet.html';
    }

    function showPolicyStub(e) {
      e.preventDefault();
      alert('Текст политики обработки персональных данных и пользовательского соглашения публикуется компанией ООО «РостГидроСтрой» и применяется к взаимодействию пользователя с сервисом.');
    }
    document.querySelectorAll('a[id^="lnkLibPolicy"], a[id^="lnkLibTerms"]').forEach(a => {
      a.addEventListener('click', showPolicyStub);
    });

    cfg();
    load();
