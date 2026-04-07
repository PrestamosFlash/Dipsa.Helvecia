const $ = s => document.querySelector(s);

let pendingFiles = {
  logo: '',
  hero: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  window.catalog = await window.loadCatalog();
  if (!guardAdminAccess()) return;
  fillGeneral();
  renderPromoEditor();
  renderGeneralPromoEditor();
  renderProductEditor();
  bindAdmin();
  updateStoreButtons();
});

function guardAdminAccess(){
  const password = String(catalog.admin?.password || '').trim();
  if (!password) return true;

  const cached = sessionStorage.getItem(window.DIPSA_ADMIN_AUTH_KEY);
  if (cached === password) return true;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const entered = window.prompt('Ingresá la contraseña del panel admin:');
    if (entered === null) {
      window.location.href = 'index.html';
      return false;
    }
    if (entered === password) {
      sessionStorage.setItem(window.DIPSA_ADMIN_AUTH_KEY, password);
      return true;
    }
    alert('Contraseña incorrecta.');
  }

  window.location.href = 'index.html';
  return false;
}

function fillGeneral(){
  const syncStatus = document.querySelector('#syncStatus');
  if (syncStatus) syncStatus.textContent = window.getLastSyncText() || (window.hasSupabaseConfig() ? 'Supabase conectado.' : 'Sin Supabase configurado.');
  $('#businessName').value = catalog.business.name || '';
  $('#businessTagline').value = catalog.business.tagline || '';
  $('#businessWhatsapp').value = catalog.business.whatsapp || '';
  $('#businessPhoneDisplay').value = catalog.business.phoneDisplay || '';
  $('#deliveryMessage').value = catalog.business.deliveryMessage || '';
  $('#deliveryFee').value = catalog.business.deliveryFee || 0;
  $('#logoUrl').value = catalog.business.logo || '';
  $('#heroUrl').value = catalog.business.heroImage || '';
  $('#adminPassword').value = catalog.admin?.password || '';
}

function bindAdmin(){
  $('#storeOpenBtn').addEventListener('click', () => { catalog.business.storeOpen = true; updateStoreButtons(); });
  $('#storeClosedBtn').addEventListener('click', () => { catalog.business.storeOpen = false; updateStoreButtons(); });
  $('#saveAdmin').addEventListener('click', saveAll);
  $('#resetAdmin').addEventListener('click', () => {
    window.resetCatalog();
    window.catalog = window.loadCatalog();
    pendingFiles = { logo:'', hero:'' };
    fillGeneral();
    renderPromoEditor();
    renderGeneralPromoEditor();
    renderProductEditor();
    updateStoreButtons();
    alert('Se restauró la base.');
  });
  $('#addDailyPromo').addEventListener('click', () => {
    catalog.promosDaily.push(createEmptyPromo('daily', catalog.promosDaily.length + 1));
    renderPromoEditor();
  });
  $('#addGeneralPromo').addEventListener('click', () => {
    catalog.promosGeneral.push(createEmptyPromo('general', catalog.promosGeneral.length + 1));
    renderGeneralPromoEditor();
  });
  $('#logoFile').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFiles.logo = await window.fileToDataUrl(file);
    $('#logoUrl').value = pendingFiles.logo;
  });
  $('#heroFile').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFiles.hero = await window.fileToDataUrl(file);
    $('#heroUrl').value = pendingFiles.hero;
  });
}

function createEmptyPromo(type, count){
  return {
    id: `${type}-${Date.now()}-${count}`,
    name: type === 'daily' ? `Promo del día ${count}` : `Promo general ${count}`,
    desc: '',
    normal: 0,
    price: 0,
    image: 'assets/pizza.jpg',
    active: true
  };
}

function updateStoreButtons(){
  $('#storeOpenBtn').classList.toggle('active', catalog.business.storeOpen !== false);
  $('#storeClosedBtn').classList.toggle('active', catalog.business.storeOpen === false);
}

function renderPromoEditor(){
  const wrap = $('#dailyPromoEditor');
  wrap.innerHTML = '';
  catalog.promosDaily.forEach((p, i) => {
    const box = document.createElement('div');
    box.className = 'admin-item cardish';
    box.innerHTML = `
      <div class="admin-row-head"><strong>${p.name}</strong><div class="admin-row-actions"><label class="switch-row"><input data-kind="promo-active" data-promo-type="daily" data-index="${i}" type="checkbox" ${p.active !== false ? 'checked' : ''}> Activa</label><button class="small-btn ghost tiny-btn" type="button" data-action="remove-promo" data-promo-type="daily" data-index="${i}">Eliminar</button></div></div>
      <label>Título<input data-kind="promo-title" data-promo-type="daily" data-index="${i}" value="${escapeHtmlAttr(p.name)}"></label>
      <label>Descripción<input data-kind="promo-desc" data-promo-type="daily" data-index="${i}" value="${escapeHtmlAttr(p.desc)}"></label>
      <label>Precio normal<input data-kind="promo-normal" data-promo-type="daily" data-index="${i}" type="number" value="${p.normal}"></label>
      <label>Precio promo<input data-kind="promo-price" data-promo-type="daily" data-index="${i}" type="number" value="${p.price}"></label>
      <label>Imagen URL<input data-kind="promo-image" data-promo-type="daily" data-index="${i}" value="${escapeHtmlAttr(p.image)}"></label>
      <label>Subir imagen<input data-kind="promo-file" data-promo-type="daily" data-index="${i}" type="file" accept="image/*"></label>
    `;
    wrap.appendChild(box);
  });
  bindPromoControls();
}

function renderGeneralPromoEditor(){
  const wrap = $('#generalPromoEditor');
  wrap.innerHTML = '';
  catalog.promosGeneral.forEach((p, i) => {
    const box = document.createElement('div');
    box.className = 'admin-item cardish';
    box.innerHTML = `
      <div class="admin-row-head"><strong>${p.name}</strong><div class="admin-row-actions"><label class="switch-row"><input data-kind="promo-active" data-promo-type="general" data-index="${i}" type="checkbox" ${p.active !== false ? 'checked' : ''}> Activa</label><button class="small-btn ghost tiny-btn" type="button" data-action="remove-promo" data-promo-type="general" data-index="${i}">Eliminar</button></div></div>
      <label>Título<input data-kind="promo-title" data-promo-type="general" data-index="${i}" value="${escapeHtmlAttr(p.name)}"></label>
      <label>Descripción<input data-kind="promo-desc" data-promo-type="general" data-index="${i}" value="${escapeHtmlAttr(p.desc)}"></label>
      <label>Precio normal<input data-kind="promo-normal" data-promo-type="general" data-index="${i}" type="number" value="${p.normal || 0}"></label>
      <label>Precio promo<input data-kind="promo-price" data-promo-type="general" data-index="${i}" type="number" value="${p.price}"></label>
      <label>Imagen URL<input data-kind="promo-image" data-promo-type="general" data-index="${i}" value="${escapeHtmlAttr(p.image || '')}"></label>
      <label>Subir imagen<input data-kind="promo-file" data-promo-type="general" data-index="${i}" type="file" accept="image/*"></label>
    `;
    wrap.appendChild(box);
  });
  bindPromoControls();
}

function bindPromoControls(){
  document.querySelectorAll('[data-kind="promo-file"]').forEach(input => {
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const value = await window.fileToDataUrl(file);
      const type = input.dataset.promoType;
      const index = Number(input.dataset.index);
      document.querySelector(`[data-kind="promo-image"][data-promo-type="${type}"][data-index="${index}"]`).value = value;
    };
  });
  document.querySelectorAll('[data-action="remove-promo"]').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.promoType;
      const index = Number(btn.dataset.index);
      const list = type === 'daily' ? catalog.promosDaily : catalog.promosGeneral;
      list.splice(index, 1);
      if (type === 'daily') renderPromoEditor(); else renderGeneralPromoEditor();
    };
  });
}

function renderProductEditor(){
  const wrap = $('#productEditor');
  wrap.innerHTML = '';
  Object.entries(catalog.products).forEach(([cat, items]) => {
    const title = document.createElement('div');
    title.className = 'admin-item section-label';
    title.innerHTML = `<strong>${cat}</strong>`;
    wrap.appendChild(title);

    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'admin-item cardish';
      row.innerHTML = `
        <div class="admin-row-head"><strong>${item.name}</strong></div>
        <label>Precio<input data-kind="product-price" data-category="${cat}" data-index="${idx}" type="number" value="${Number(item.price || 0)}"></label>
        <label>Detalle<input data-kind="product-detail" data-category="${cat}" data-index="${idx}" value="${escapeHtmlAttr(item.detail || '')}"></label>
        <div class="toggle-grid">
          <label class="switch-row"><input data-kind="product-active" data-category="${cat}" data-index="${idx}" type="checkbox" ${item.active !== false ? 'checked' : ''}> Visible</label>
          <label class="switch-row"><input data-kind="product-stock" data-category="${cat}" data-index="${idx}" type="checkbox" ${item.inStock !== false ? 'checked' : ''}> En stock</label>
        </div>
      `;
      wrap.appendChild(row);
    });
  });
}

async function saveAll(){
  catalog.business.name = $('#businessName').value.trim();
  catalog.business.tagline = $('#businessTagline').value.trim();
  catalog.business.whatsapp = $('#businessWhatsapp').value.trim();
  catalog.business.phoneDisplay = $('#businessPhoneDisplay').value.trim();
  catalog.business.deliveryMessage = $('#deliveryMessage').value.trim();
  catalog.business.deliveryFee = Number($('#deliveryFee').value || 0);
  catalog.business.logo = $('#logoUrl').value.trim() || 'assets/logo.jpg';
  catalog.business.heroImage = $('#heroUrl').value.trim() || 'assets/hero.jpg';
  catalog.admin = catalog.admin || {};
  catalog.admin.password = $('#adminPassword').value.trim();

  applyPromoValues('daily', catalog.promosDaily);
  applyPromoValues('general', catalog.promosGeneral);

  document.querySelectorAll('[data-kind="product-price"]').forEach(input => {
    const cat = input.dataset.category;
    const idx = Number(input.dataset.index);
    catalog.products[cat][idx].price = Number(input.value || 0);
  });
  document.querySelectorAll('[data-kind="product-detail"]').forEach(input => {
    const cat = input.dataset.category;
    const idx = Number(input.dataset.index);
    catalog.products[cat][idx].detail = input.value.trim();
  });
  document.querySelectorAll('[data-kind="product-active"]').forEach(input => {
    const cat = input.dataset.category;
    const idx = Number(input.dataset.index);
    catalog.products[cat][idx].active = input.checked;
  });
  document.querySelectorAll('[data-kind="product-stock"]').forEach(input => {
    const cat = input.dataset.category;
    const idx = Number(input.dataset.index);
    catalog.products[cat][idx].inStock = input.checked;
  });

  const result = await window.saveCatalog(catalog);
  fillGeneral();
  if (result.ok && result.remote) {
    alert('Cambios guardados y sincronizados con Supabase.');
  } else if (result.ok) {
    alert('Cambios guardados solo en este navegador.');
  } else {
    alert('Se guardó localmente, pero falló la sincronización con Supabase.');
  }
}

function applyPromoValues(type, list){
  document.querySelectorAll(`[data-kind="promo-title"][data-promo-type="${type}"]`).forEach(input => {
    list[Number(input.dataset.index)].name = input.value.trim();
  });
  document.querySelectorAll(`[data-kind="promo-desc"][data-promo-type="${type}"]`).forEach(input => {
    list[Number(input.dataset.index)].desc = input.value.trim();
  });
  document.querySelectorAll(`[data-kind="promo-normal"][data-promo-type="${type}"]`).forEach(input => {
    list[Number(input.dataset.index)].normal = Number(input.value || 0);
  });
  document.querySelectorAll(`[data-kind="promo-price"][data-promo-type="${type}"]`).forEach(input => {
    list[Number(input.dataset.index)].price = Number(input.value || 0);
  });
  document.querySelectorAll(`[data-kind="promo-image"][data-promo-type="${type}"]`).forEach(input => {
    list[Number(input.dataset.index)].image = input.value.trim() || 'assets/pizza.jpg';
  });
  document.querySelectorAll(`[data-kind="promo-active"][data-promo-type="${type}"]`).forEach(input => {
    list[Number(input.dataset.index)].active = input.checked;
  });
}

function escapeHtmlAttr(value){
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
