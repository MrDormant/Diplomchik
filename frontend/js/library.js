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
        const cover = escapeHtml(s.cover_image || '/assets/library-covers/ALUDAR.jpg');
        el.innerHTML =
          '<img class="solution-cover" src="' + cover + '" alt="Обложка: ' + escapeHtml(s.name) + '">' +
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
      const comment = document.getElementById('comment').value || null;
      const r = await fetch(API + '/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
        body: JSON.stringify({ solution_id: solutionId, source: 'library', comment }),
      });
      if (!r.ok) { alert('Ошибка: ' + await r.text()); return; }
      alert('Заявка отправлена. Проверьте почту в Mailpit и личный кабинет.');
      location.href = '/cabinet.html';
    }

    cfg();
    load();
