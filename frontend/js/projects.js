    const API = '/api/v1';
    let managerTelHref = 'tel:+74951234567';

    async function cfg() {
      try {
        const j = await (await fetch(API + '/public/config')).json();
        managerTelHref = j.manager_phone_tel || managerTelHref;
        const a = document.getElementById('managerTel');
        a.href = managerTelHref;
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

    function formatRub(value) {
      const n = Number(value || 0);
      if (!n) return '—';
      return n.toLocaleString('ru-RU') + ' ₽';
    }

    async function load() {
      const r = await fetch(API + '/showcase-projects');
      document.getElementById('load').style.display = 'none';
      const grid = document.getElementById('grid');
      grid.innerHTML = '';
      if (!r.ok) {
        grid.innerHTML = '<p class="lead" style="color:var(--muted);">Не удалось загрузить готовые проекты.</p>';
        return;
      }
      const list = await r.json();
      if (!list.length) {
        grid.innerHTML = '<p class="lead" style="color:var(--muted);">Готовых проектов пока нет.</p>';
        return;
      }
      list.forEach(p => {
        const el = document.createElement('div');
        el.className = 'sol';
        const cover = escapeHtml(coverSrc(p.cover_image));
        const address = p.address ? escapeHtml(p.address) : 'Адрес уточняется';
        const cost = formatRub(p.project_cost);
        el.innerHTML =
          '<img class="solution-cover" src="' + cover + '" alt="Проект: ' + escapeHtml(p.name) + '" onerror="this.onerror=null;this.src=\'/assets/library-covers/ALUDAR.jpg\'">' +
          '<div class="code-tag">PROJECT · ' + p.id + '</div>' +
          '<h4>' + escapeHtml(p.name) + '</h4>' +
          '<p>' + escapeHtml(p.description || '') + '</p>' +
          '<div class="specs"><span>' + address + '</span><span class="price mono">' + cost + '</span></div>' +
          '<a class="btn primary" href="' + managerTelHref + '">Связаться</a>';
        grid.appendChild(el);
      });
    }

    cfg();
    load();
