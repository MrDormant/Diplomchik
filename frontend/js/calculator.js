    const API = '/api/v1';
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
    loadPublicConfig();
