let installPrompt = null;
let carouselInterval = null;
const STORAGE_KEY = 'dipsa_storefront_state_v3';
const DEFAULT_CUSTOMER = {
  name:'',
  phone:'',
  address:'',
  zone:'',
  payment:'',
  notes:'',
  birthdate:''
};
let state = {
  screen:'home',
  cart:[],
  delivery:true,
  birthday:false,
  promoTab:'daily',
  menuFilter:'all',
  customer:{ ...DEFAULT_CUSTOMER }
};
const $ = s => document.querySelector(s);
const MENU_ORDER = ['Pizzas','Panchos','Empanadas','Milanesas','Hamburguesas','Papas','Bebidas','Cervezas'];
const HOME_CATEGORIES = [
  { label:'Pizzas', key:'Pizzas' },
  { label:'Panchos', key:'Panchos' },
  { label:'Empanadas', key:'Empanadas' },
  { label:'Milanesas', key:'Milanesas' },
  { label:'Hamburguesas', key:'Hamburguesas' },
  { label:'Bebidas', key:'Bebidas' },
  { label:'Papas', key:'Papas' }
];

window.addEventListener('storage', async () => {
  window.catalog = await window.loadCatalog();
  restoreState();
  renderAll();
  renderCart();
});

document.addEventListener('DOMContentLoaded', async () => {
  window.catalog = await window.loadCatalog();
  restoreState();
  bindEvents();
  renderAll();
  renderCart();
  syncFormFromState();
  registerSW();
  startPromoCarousel();
  initHistory();
});

function bindEvents(){
  document.querySelectorAll('[data-screen]').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.screen === 'menu') state.menuFilter = 'all';
    switchScreen(btn.dataset.screen, { pushHistory:true });
  }));

  $('#deliveryToggle').addEventListener('click', () => { state.delivery = true; updateToggles(); renderCart(); persistState(); });
  $('#pickupToggle').addEventListener('click', () => { state.delivery = false; updateToggles(); renderCart(); persistState(); });
  $('#sendWhatsApp').addEventListener('click', sendWhatsApp);
  $('#dismissInstall').addEventListener('click', () => $('#installBanner').classList.add('hidden'));
  $('#installBtn').addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $('#installBanner').classList.add('hidden');
  });
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    $('#installBanner').classList.remove('hidden');
  });

  const heroMenuBtn = $('#heroMenuBtn');
  if (heroMenuBtn) {
    heroMenuBtn.addEventListener('click', () => {
      state.menuFilter = 'all';
      switchScreen('menu', { pushHistory:true });
    });
  }
  const heroWhatsAppBtn = $('#heroWhatsAppBtn');
  if (heroWhatsAppBtn) heroWhatsAppBtn.addEventListener('click', openBusinessWhatsApp);
  const deliveryBadgeBtn = $('#deliveryBadgeBtn');
  if (deliveryBadgeBtn) deliveryBadgeBtn.addEventListener('click', openBusinessWhatsApp);
  $('#promoChipDaily').addEventListener('click', () => setPromoTab('daily'));
  $('#promoChipGeneral').addEventListener('click', () => setPromoTab('general'));

  bindCustomerField('#customerName', 'name');
  bindCustomerField('#customerPhone', 'phone');
  bindCustomerField('#customerAddress', 'address');
  bindCustomerField('#customerZone', 'zone');
  bindCustomerField('#customerPayment', 'payment');
  bindCustomerField('#customerNotes', 'notes');
  bindCustomerField('#customerBirthdate', 'birthdate');

  updateToggles();
  setPromoTab(state.promoTab);
}

function bindCustomerField(selector, key){
  const field = $(selector);
  if (!field) return;
  field.addEventListener('input', () => {
    state.customer[key] = field.value;
    persistState();
  });
  field.addEventListener('change', () => {
    state.customer[key] = field.value;
    persistState();
  });
}

function restoreState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    state = {
      ...state,
      ...saved,
      customer: { ...DEFAULT_CUSTOMER, ...(saved.customer || {}) },
      cart: Array.isArray(saved.cart) ? saved.cart : []
    };
  } catch (err) {
    console.warn('No se pudo restaurar el estado guardado', err);
  }
}

function persistState(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      screen: state.screen,
      cart: state.cart,
      delivery: state.delivery,
      birthday: state.birthday,
      promoTab: state.promoTab,
      menuFilter: state.menuFilter,
      customer: state.customer
    }));
  } catch (err) {
    console.warn('No se pudo guardar el estado', err);
  }
}

function syncFormFromState(){
  $('#customerName').value = state.customer.name || '';
  $('#customerPhone').value = state.customer.phone || '';
  $('#customerAddress').value = state.customer.address || '';
  $('#customerZone').value = state.customer.zone || '';
  $('#customerPayment').value = state.customer.payment || '';
  $('#customerNotes').value = state.customer.notes || '';
  const birth = $('#customerBirthdate');
  if (birth) birth.value = state.customer.birthdate || '';
  state.birthday = isBirthdayToday(state.customer.birthdate);
}

function initHistory(){
  const initial = { screen: state.screen, menuFilter: state.menuFilter };
  window.history.replaceState(initial, '', `#${state.screen}`);
  window.addEventListener('popstate', (event) => {
    const target = event.state?.screen || 'home';
    if (event.state?.menuFilter) state.menuFilter = event.state.menuFilter;
    switchScreen(target, { pushHistory:false });
  });
}

function renderAll(){
  updateBrand();
  updateStoreStatus();
  renderHome();
  renderPromos();
  renderMenu();
}

function registerSW(){
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js');
}

function updateBrand(){
  $('#brandName').textContent = (catalog.business.name || 'Dipsa').toUpperCase();
  $('#brandTagline').textContent = catalog.business.tagline || '';
  $('#brandLogo').src = catalog.business.logo || 'assets/logo.jpg';
  $('#heroImage').src = catalog.business.heroImage || 'assets/hero.jpg';
  $('#deliveryPhone').textContent = catalog.business.phoneDisplay || catalog.business.whatsapp || '';
  $('#deliveryText').textContent = catalog.business.deliveryMessage || 'Pedidos por WhatsApp';
}

function updateStoreStatus(){
  $('#storeStatus').textContent = catalog.business.storeOpen === false ? 'Cerrado' : 'Abierto ahora';
}

function switchScreen(screen, options = {}){
  const { pushHistory = false } = options;
  state.screen = screen;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screen);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === screen));
  if (screen === 'promos') setPromoTab(state.promoTab);
  if (screen === 'menu') {
    renderMenu();
    if (state.menuFilter !== 'all') {
      const section = document.querySelector(`[data-menu-section="${state.menuFilter}"]`);
      if (section) section.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  }
  if (screen === 'cart') syncFormFromState();
  if (pushHistory) {
    window.history.pushState({ screen, menuFilter: state.menuFilter }, '', `#${screen}`);
  }
  persistState();
}

function renderHome(){
  const dailyWrap = $('#dailyPromos');
  dailyWrap.innerHTML = '';
  getActivePromos('daily').forEach((p) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="promo-top">
        <div class="promo-title">${p.name}</div>
        <span class="badge daily">10% OFF</span>
      </div>
      <div class="promo-desc">${p.desc}</div>
      <div class="price-row">
        <div><div class="old">${money(p.normal)}</div><div class="new">${money(p.price)}</div></div>
        <button class="add-btn">Agregar</button>
      </div>
    `;
    article.querySelector('.add-btn').addEventListener('click', () => addToCart({name:p.name, price:p.price, note:'Promo del día'}));
    dailyWrap.appendChild(article);
  });

  const grid = $('#categoryGrid');
  grid.innerHTML = '';
  HOME_CATEGORIES.forEach(({ label, key }) => {
    const btn = document.createElement('button');
    btn.className = 'cat';
    btn.textContent = label;
    btn.addEventListener('click', () => openMenuSection(key));
    grid.appendChild(btn);
  });
}

function renderPromos(){
  const daily = $('#promoDailyList');
  const general = $('#promoGeneralList');
  daily.innerHTML = '';
  general.innerHTML = '';
  getActivePromos('daily').forEach(p => daily.appendChild(createPromoRow(p, true)));
  getActivePromos('general').forEach(p => general.appendChild(createPromoRow(p, false)));
}

function setPromoTab(tab){
  state.promoTab = tab;
  $('#promoChipDaily').classList.toggle('active', tab === 'daily');
  $('#promoChipGeneral').classList.toggle('active', tab === 'general');
  $('#promoDailyBlock').classList.toggle('hidden-block', tab !== 'daily');
  $('#promoGeneralBlock').classList.toggle('hidden-block', tab !== 'general');
  persistState();
}

function createPromoRow(promo, daily){
  const article = document.createElement('article');
  article.className = 'promo-row';
  article.innerHTML = `
    <img class="promo-thumb" src="${promo.image}" alt="${promo.name}">
    <div>
      <div class="promo-top">
        <div class="promo-title">${promo.name}</div>
        <span class="badge ${daily ? 'daily':'general'}">${daily ? '10% OFF':'Activa'}</span>
      </div>
      <div class="promo-desc">${promo.desc}</div>
      <div class="price-row">
        <div>${promo.normal ? `<div class="old">${money(promo.normal)}</div>` : ''}<div class="new">${money(promo.price)}</div></div>
        <button class="add-btn">Agregar</button>
      </div>
    </div>
  `;
  article.querySelector('.add-btn').addEventListener('click', () => addToCart({name:promo.name, price:promo.price, note: daily ? 'Promo del día' : 'Promo general'}));
  return article;
}

function renderMenu(){
  const menu = $('#menuSections');
  const chips = $('#menuFilterChips');
  menu.innerHTML = '';
  chips.innerHTML = '';

  createMenuChip('Todo', 'all');
  MENU_ORDER.forEach(category => createMenuChip(category, category));

  const categoriesToRender = state.menuFilter === 'all' ? MENU_ORDER : [state.menuFilter];
  categoriesToRender.forEach(category => {
    const items = (catalog.products[category] || []).filter(item => item.active !== false);
    if (!items.length) return;
    const wrap = document.createElement('section');
    wrap.className = 'menu-section';
    wrap.dataset.menuSection = category;
    const subtitle = categorySubtitle(category);
    wrap.innerHTML = `
      <div class="menu-banner compact ${subtitle ? '' : 'no-subtitle'}">
        <img src="${categoryImage(category)}" alt="${category}">
        <div class="copy">
          <strong class="menu-banner-title">${category}</strong>
          ${subtitle ? `<span class="menu-banner-subtitle">${subtitle}</span>` : ''}
        </div>
      </div>
      <div class="menu-items"></div>
    `;
    const itemsWrap = wrap.querySelector('.menu-items');
    items.forEach(item => itemsWrap.appendChild(createProductCard(category, item)));
    menu.appendChild(wrap);
  });
}

function createMenuChip(label, key){
  const btn = document.createElement('button');
  btn.className = 'chip';
  btn.textContent = label;
  btn.classList.toggle('active', state.menuFilter === key);
  btn.addEventListener('click', () => {
    state.menuFilter = key;
    renderMenu();
    persistState();
  });
  $('#menuFilterChips').appendChild(btn);
}

function createProductCard(category, item){
  const article = document.createElement('article');
  article.className = `product-card ${item.active === false ? 'is-hidden-product' : ''} ${item.inStock === false ? 'is-out' : ''}`;
  const stockLabel = item.inStock === false ? '<span class="stock-badge out">Sin stock</span>' : '<span class="stock-badge">Disponible</span>';
  const detail = item.detail ? `<div class="product-detail">${item.detail}</div>` : '';
  article.innerHTML = `
    <div class="product-head">
      <div>
        <div class="product-name">${item.name}</div>
        ${detail}
      </div>
      ${stockLabel}
    </div>
    <div class="product-actions">
      <div>
        <div class="product-price">${money(item.price)}</div>
        ${item.allowHalf ? `<div class="product-subprice">Media pizza: ${money(Math.round(item.price / 2))}</div>` : ''}
      </div>
      <div class="product-buttons"></div>
    </div>
  `;

  const buttons = article.querySelector('.product-buttons');
  if (item.active === false) {
    article.classList.add('visually-muted');
    buttons.innerHTML = '<span class="small-note">Oculto en admin</span>';
    return article;
  }

  if (item.inStock === false) {
    const disabled = document.createElement('button');
    disabled.className = 'add-btn disabled';
    disabled.textContent = 'Sin stock';
    disabled.disabled = true;
    buttons.appendChild(disabled);
    return article;
  }

  if (category === 'Pizzas' && item.allowHalf) {
    const fullBtn = document.createElement('button');
    fullBtn.className = 'add-btn';
    fullBtn.textContent = 'Entera';
    fullBtn.addEventListener('click', () => addToCart({ name:`Pizza ${item.name} entera`, price:item.price }));
    const halfBtn = document.createElement('button');
    halfBtn.className = 'add-btn secondary-mini';
    halfBtn.textContent = '1/2';
    halfBtn.addEventListener('click', () => addToCart({ name:`Pizza ${item.name} media`, price:Math.round(item.price / 2) }));
    buttons.append(fullBtn, halfBtn);
    return article;
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'add-btn';
  addBtn.textContent = 'Agregar';
  addBtn.addEventListener('click', () => handleAddProduct(category, item));
  buttons.appendChild(addBtn);
  return article;
}

function handleAddProduct(category, item){
  if (category === 'Panchos') {
    openPanchosDialog(item);
    return;
  }

  if (category === 'Empanadas') {
    openEmpanadasDialog(item);
    return;
  }

  addToCart({ name:item.name, price:item.price });
}

function openMenuSection(category){
  state.menuFilter = category;
  switchScreen('menu', { pushHistory:true });
}

function addToCart(item){
  const cleanItem = {
    name: item.name,
    price: Number(item.price || 0),
    note: item.note || ''
  };
  state.cart.push(cleanItem);
  renderCart();
  persistState();
}

function openPanchosDialog(item){
  const options = Array.isArray(item.options) ? item.options : [];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card emp-modal" role="dialog" aria-modal="true" aria-label="Elegir aderezos y gustos">
      <div class="modal-head">
        <div>
          <div class="eyebrow">Panchos</div>
          <strong>${item.name}</strong>
        </div>
        <button class="modal-close" aria-label="Cerrar">×</button>
      </div>
      <p class="modal-copy">Marcá opciones y escribí los gustos o aderezos para que salgan claros en el pedido.</p>
      <div class="emp-grid">
        ${options.length ? options.map(option => `
          <label class="switch-row emp-check">
            <input type="checkbox" value="${option}">
            <span>${option}</span>
          </label>
        `).join('') : '<div class="small-note">Sin opciones precargadas.</div>'}
      </div>
      <label class="emp-note-wrap">
        <span>Gustos y aderezos</span>
        <textarea id="panchoCustomNote" rows="3" placeholder="Ej: con cheddar y papas pay, sin cebolla, sabor pizza, etc."></textarea>
      </label>
      <div class="modal-actions">
        <button class="chip" data-action="cancel">Cancelar</button>
        <button class="add-btn" data-action="confirm">Agregar</button>
      </div>
    </div>
  `;
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.querySelector('[data-action="cancel"]').addEventListener('click', close);
  overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
    const selected = Array.from(overlay.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value);
    const custom = overlay.querySelector('#panchoCustomNote').value.trim();
    const detailParts = [];
    if (selected.length) detailParts.push(`Opciones: ${selected.join(', ')}`);
    if (custom) detailParts.push(custom);
    addToCart({ name:item.name, price:item.price, note:detailParts.join(' · ') });
    close();
  });
  document.body.appendChild(overlay);
}

function openEmpanadasDialog(item){
  const flavorSource = (catalog.products.Empanadas || []).find(x => (x.detail || '').length);
  const flavors = (flavorSource?.detail || '')
    .replace(/^sabores:\s*/i, '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

  const expectedQty = detectEmpanadaTarget(item.name);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card emp-modal" role="dialog" aria-modal="true" aria-label="Elegir sabores de empanadas">
      <div class="modal-head">
        <div>
          <div class="eyebrow">Empanadas</div>
          <strong>${item.name}</strong>
        </div>
        <button class="modal-close" aria-label="Cerrar">×</button>
      </div>
      <p class="modal-copy">Indicá cuántas querés de cada sabor${expectedQty ? ` (total sugerido: ${expectedQty})` : ''}.</p>
      <div class="emp-grid">
        ${flavors.length ? flavors.map((flavor, idx) => `
          <label class="emp-row">
            <span>${flavor}</span>
            <input type="number" min="0" step="1" value="0" data-flavor="${flavor}" ${idx===0 ? 'autofocus' : ''}>
          </label>
        `).join('') : '<div class="small-note">No hay sabores cargados en datos.</div>'}
      </div>
      <div id="empCountHint" class="small-note${expectedQty ? '' : ' hidden-block'}"></div>
      <label class="emp-note-wrap">
        <span>Fritas o al horno / aclaraciones</span>
        <textarea id="empExtraNote" rows="2" placeholder="Ej: fritas, 2 bien cocidas, 1 sin aceitunas, salsa aparte, etc."></textarea>
      </label>
      <div class="modal-actions">
        <button class="chip" data-action="cancel">Cancelar</button>
        <button class="add-btn" data-action="confirm">Agregar</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  const inputs = Array.from(overlay.querySelectorAll('input[data-flavor]'));
  const hint = overlay.querySelector('#empCountHint');
  const refreshHint = () => {
    if (!expectedQty || !hint) return;
    const totalSelected = inputs.reduce((acc, input) => acc + Number(input.value || 0), 0);
    if (totalSelected === expectedQty) {
      hint.textContent = `Perfecto: elegiste ${totalSelected} empanadas.`;
    } else if (totalSelected < expectedQty) {
      hint.textContent = `Te faltan ${expectedQty - totalSelected} para completar ${expectedQty}.`;
    } else {
      hint.textContent = `Elegiste ${totalSelected}. Te pasaste por ${totalSelected - expectedQty}.`;
    }
  };
  refreshHint();
  inputs.forEach(input => input.addEventListener('input', refreshHint));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.querySelector('[data-action="cancel"]').addEventListener('click', close);
  overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
    const selected = inputs
      .map(input => ({ flavor: input.dataset.flavor, qty: Number(input.value || 0) }))
      .filter(entry => entry.qty > 0);
    const extra = overlay.querySelector('#empExtraNote').value.trim();
    const detailParts = [];
    if (selected.length) detailParts.push(selected.map(entry => `${entry.qty} ${entry.flavor}`).join(' · '));
    if (extra) detailParts.push(extra);
    addToCart({ name:item.name, price:item.price, note: detailParts.join(' · ') });
    close();
  });

  document.body.appendChild(overlay);
}

function detectEmpanadaTarget(name){
  const lower = (name || '').toLowerCase();
  if (lower.includes('docena')) return 12;
  if (lower.includes('media')) return 6;
  if (lower.includes('unidad')) return 1;
  return 0;
}

function updateToggles(){
  $('#deliveryToggle').classList.toggle('active', state.delivery);
  $('#pickupToggle').classList.toggle('active', !state.delivery);
  document.querySelectorAll('.delivery-only').forEach(el => el.classList.toggle('hidden-block', !state.delivery));
  const address = $('#customerAddress');
  if (address) address.disabled = !state.delivery;
}

function renderCart(){
  const wrap = $('#cartItems');
  wrap.innerHTML = '';
  if (!state.cart.length) {
    wrap.innerHTML = '<div class="empty-cart">Todavía no agregaste productos.</div>';
  }
  state.cart.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <div class="cart-name">${item.name}</div>
        ${item.note ? `<div class="cart-note">${item.note}</div>` : ''}
      </div>
      <div class="cart-side">
        <strong style="color:#5a1ea3">${money(item.price)}</strong>
        <button class="qty-btn" aria-label="Agregar uno igual">+</button>
        <button class="remove-item" aria-label="Quitar producto">×</button>
      </div>
    `;
    row.querySelector('.remove-item').addEventListener('click', () => {
      state.cart.splice(index, 1);
      renderCart();
      persistState();
    });
    row.querySelector('.qty-btn').addEventListener('click', () => {
      state.cart.splice(index + 1, 0, { ...item });
      renderCart();
      persistState();
    });
    wrap.appendChild(row);
  });
  const subtotal = state.cart.reduce((a,b) => a + b.price, 0);
  const delivery = state.delivery ? catalog.business.deliveryFee : 0;
  state.birthday = isBirthdayToday(state.customer.birthdate);
  const birthday = state.birthday ? Math.round(subtotal * 0.2) : 0;
  const total = subtotal + delivery - birthday;
  $('#subtotal').textContent = money(subtotal);
  $('#deliveryCost').textContent = money(delivery);
  $('#birthdayDiscount').textContent = birthday ? '-' + money(birthday) : money(0);
  $('#total').textContent = money(total);
}

function sendWhatsApp(){
  const customer = collectCustomerData();
  if (!state.cart.length) {
    alert('Agregá al menos un producto antes de enviar el pedido.');
    return;
  }
  if (!customer.name.trim()) {
    alert('Completá tu nombre y apellido.');
    $('#customerName').focus();
    return;
  }
  if (!customer.phone.trim()) {
    alert('Completá tu teléfono.');
    $('#customerPhone').focus();
    return;
  }
  if (state.delivery && !customer.address.trim()) {
    alert('Completá la dirección para el delivery.');
    $('#customerAddress').focus();
    return;
  }
  const subtotal = state.cart.reduce((a,b) => a + b.price, 0);
  const delivery = state.delivery ? catalog.business.deliveryFee : 0;
  state.birthday = isBirthdayToday(state.customer.birthdate);
  const birthday = state.birthday ? Math.round(subtotal * 0.2) : 0;
  const total = subtotal + delivery - birthday;
  const items = state.cart.map(i => `- ${i.name}${i.note ? ` (${i.note})` : ''} — ${money(i.price)}`).join('\n');
  const msg = [
    `Hola ${catalog.business.name || 'Dipsa'}, quiero hacer este pedido:`,
    '',
    items,
    '',
    `Modalidad: ${state.delivery ? 'Delivery' : 'Retiro'}`,
    `Subtotal: ${money(subtotal)}`,
    `Delivery: ${money(delivery)}`,
    `Descuento cumpleaños: -${money(birthday)}`,
    `Total final: ${money(total)}`,
    '',
    `Nombre: ${customer.name}`,
    `Teléfono: ${customer.phone}`,
    `Zona: ${customer.zone || '-'}`,
    `Dirección: ${state.delivery ? (customer.address || '-') : 'Retira en el local'}`,
    `Pago: ${customer.payment || '-'}`,
    `Fecha de nacimiento: ${customer.birthdate || '-'}`,
    `Observaciones: ${customer.notes || '-'}`
  ].join('\n');
  persistState();
  window.open(`https://wa.me/${catalog.business.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
}

function isBirthdayToday(value){
  if (!value) return false;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return match[2] === month && match[3] === day;
}

function collectCustomerData(){
  state.customer = {
    name: $('#customerName')?.value?.trim() || '',
    phone: $('#customerPhone')?.value?.trim() || '',
    address: $('#customerAddress')?.value?.trim() || '',
    zone: $('#customerZone')?.value || '',
    payment: $('#customerPayment')?.value || '',
    notes: $('#customerNotes')?.value?.trim() || '',
    birthdate: $('#customerBirthdate')?.value || ''
  };
  persistState();
  return state.customer;
}

function openBusinessWhatsApp(){
  const msg = encodeURIComponent(`Hola ${catalog.business.name || 'Dipsa'}, quiero hacer un pedido.`);
  window.open(`https://wa.me/${catalog.business.whatsapp}?text=${msg}`, '_blank');
}

function getActivePromos(type){
  const list = type === 'general' ? catalog.promosGeneral : catalog.promosDaily;
  return list.filter(promo => promo.active !== false);
}

function startPromoCarousel(){
  const wrap = $('#dailyPromos');
  if (!wrap) return;
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    if (state.screen !== 'home') return;
    const first = wrap.querySelector('.card');
    if (!first || wrap.children.length < 2) return;
    wrap.appendChild(first);
    wrap.scrollTo({ left:0, behavior:'smooth' });
  }, 4000);
}

function categoryImage(category){
  return {
    Pizzas:'assets/pizza.jpg',
    Panchos:'assets/pancho.jpg',
    Empanadas:'assets/empanadas.jpg',
    Milanesas:'assets/mila.jpg',
    Hamburguesas:'assets/burger.jpg',
    Papas:'assets/papas.jpg',
    Bebidas:'assets/hero.jpg',
    Cervezas:'assets/hero.jpg'
  }[category] || 'assets/hero.jpg';
}

function categorySubtitle(category){
  return {
    Pizzas:'Elegí entera o 1/2 para sumar al carrito',
    Panchos:'Sabores y aderezos a elección',
    Empanadas:'Fritas o al horno',
    Milanesas:'Pollo o carne',
    Hamburguesas:'Todas salen con papas',
    Papas:'Papas fritas y especiales',
    Bebidas:'',
    Cervezas:'Latas y botellas'
  }[category] ?? 'Menú';
}
