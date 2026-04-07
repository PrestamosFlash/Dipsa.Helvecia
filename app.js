(function(){
  const $ = function(selector){ return document.querySelector(selector); };
  const DEFAULT_CUSTOMER = {
    name: '',
    phone: '',
    address: '',
    zone: '',
    payment: '',
    notes: '',
    birthdate: ''
  };

  const state = {
    screen: 'home',
    store: null,
    cart: window.DIPSA.loadLocalCart(),
    delivery: true,
    promoTab: 'daily',
    menuFilter: 'all',
    customer: Object.assign({}, DEFAULT_CUSTOMER, window.DIPSA.loadLocalProfile()),
    birthdayActive: false,
    lookupTimer: null,
    carouselTimer: null,
    carouselIndex: 0
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init(){
    bindNavigation();
    bindCheckout();
    bindStaticActions();
    registerServiceWorker();
    setupInstallPrompt();
    await refreshStorefront();
    startPromoCarousel();
    syncForm();
    hydrateKnownCustomer();
    renderCart();
    switchScreen('home');
    window.addEventListener('focus', refreshStorefront);
    setInterval(function(){
      if (document.visibilityState === 'visible') refreshStorefront();
    }, 60000);
  }

  async function refreshStorefront(){
    state.store = await window.DIPSA.getStorefrontData();
    renderBrand();
    renderBirthdayBanner();
    renderHome();
    renderPromos();
    renderMenu();
  }

  function bindNavigation(){
    document.querySelectorAll('[data-screen]').forEach(function(button){
      button.addEventListener('click', function(){
        const screen = button.dataset.screen;
        if (screen === 'menu') state.menuFilter = 'all';
        switchScreen(screen);
      });
    });

    const promoDaily = $('#promoChipDaily');
    const promoGeneral = $('#promoChipGeneral');
    if (promoDaily) promoDaily.addEventListener('click', function(){ setPromoTab('daily'); });
    if (promoGeneral) promoGeneral.addEventListener('click', function(){ setPromoTab('general'); });
  }

  function bindStaticActions(){
    $('#deliveryToggle').addEventListener('click', function(){ state.delivery = true; updateDeliveryToggle(); renderCart(); });
    $('#pickupToggle').addEventListener('click', function(){ state.delivery = false; updateDeliveryToggle(); renderCart(); });
    $('#sendWhatsApp').addEventListener('click', submitOrder);
    const installBtn = $('#installBtn');
    const dismissInstall = $('#dismissInstall');
    if (installBtn) installBtn.addEventListener('click', promptInstall);
    if (dismissInstall) dismissInstall.addEventListener('click', dismissInstallBanner);
  }



  function registerServiceWorker(){
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    navigator.serviceWorker.register('./service-worker.js').catch(function(error){
      console.warn('No se pudo registrar el service worker:', error.message);
    });
  }

  function setupInstallPrompt(){
    window.addEventListener('beforeinstallprompt', function(event){
      event.preventDefault();
      state.installPrompt = event;
      showInstallBanner();
    });

    window.addEventListener('appinstalled', function(){
      state.installPrompt = null;
      hideInstallBanner(true);
    });
  }

  function showInstallBanner(){
    const banner = $('#installBanner');
    if (!banner) return;
    if (window.localStorage.getItem('dipsa_install_banner_closed') === '1') return;
    banner.classList.remove('hidden');
  }

  function hideInstallBanner(persist){
    const banner = $('#installBanner');
    if (!banner) return;
    banner.classList.add('hidden');
    if (persist) window.localStorage.setItem('dipsa_install_banner_closed', '1');
  }

  function dismissInstallBanner(){
    hideInstallBanner(true);
  }

  async function promptInstall(){
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    try {
      await state.installPrompt.userChoice;
    } catch (error) {
      console.warn('No se pudo completar la instalación:', error.message);
    }
    state.installPrompt = null;
    hideInstallBanner(true);
  }

  function bindCheckout(){
    bindField('#customerName', 'name');
    bindField('#customerPhone', 'phone', function(){
      scheduleCustomerLookup($('#customerPhone').value);
    });
    bindField('#customerAddress', 'address');
    bindField('#customerZone', 'zone');
    bindField('#customerPayment', 'payment');
    bindField('#customerNotes', 'notes');
    bindField('#customerBirthdate', 'birthdate', function(){
      refreshBirthdayState();
        renderCart();
    });
  }

  function bindField(selector, key, extra){
    const field = $(selector);
    field.addEventListener('input', function(){
      state.customer[key] = field.value;
      persistCustomer();
      if (typeof extra === 'function') extra();
    });
    field.addEventListener('change', function(){
      state.customer[key] = field.value;
      persistCustomer();
      if (typeof extra === 'function') extra();
    });
  }

  function scheduleCustomerLookup(phone){
    clearTimeout(state.lookupTimer);
    const cleanPhone = window.DIPSA.normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 8) return;
    state.lookupTimer = setTimeout(async function(){
      try {
        const profile = await window.DIPSA.getCustomerProfile(cleanPhone);
        if (!profile) return;
        mergeCustomer(profile);
        syncForm();
        refreshBirthdayState();
            renderCart();
      } catch (error) {
        console.warn('No se pudo buscar el cliente:', error.message);
      }
    }, 500);
  }

  function hydrateKnownCustomer(){
    const local = window.DIPSA.loadLocalProfile();
    if (local && local.phone) {
      mergeCustomer(local);
      syncForm();
      refreshBirthdayState();
      }
  }

  function mergeCustomer(profile){
    state.customer = Object.assign({}, state.customer, {
      name: profile.full_name || profile.name || state.customer.name,
      phone: profile.phone || state.customer.phone,
      address: profile.address || state.customer.address,
      zone: profile.zone || state.customer.zone,
      notes: profile.notes || state.customer.notes,
      birthdate: profile.birthdate || state.customer.birthdate
    });
    persistCustomer();
  }

  function persistCustomer(){
    window.DIPSA.saveLocalProfile(state.customer);
  }

  function syncForm(){
    $('#customerName').value = state.customer.name || '';
    $('#customerPhone').value = state.customer.phone || '';
    $('#customerAddress').value = state.customer.address || '';
    $('#customerZone').value = state.customer.zone || '';
    $('#customerPayment').value = state.customer.payment || '';
    $('#customerNotes').value = state.customer.notes || '';
    $('#customerBirthdate').value = state.customer.birthdate || '';
    updateBirthdateFieldState();
    refreshBirthdayState();
    updateDeliveryToggle();
  }

  function renderBrand(){
    if (!state.store) return;
    $('#brandLogo').src = state.store.business.logo || 'assets/logo.jpg';
    $('#brandName').textContent = (state.store.business.name || 'Dipsa').toUpperCase();
    $('#brandTagline').textContent = state.store.business.tagline || '';
    $('#heroImage').src = state.store.business.heroImage || 'assets/hero.jpg';
    $('#heroTitle').textContent = 'Pedí fácil desde tu celu';
    $('#heroSubtitle').textContent = '';
    $('#deliveryText').textContent = 'Delivery y pedidos por WhatsApp';
    $('#deliveryPhone').textContent = state.store.business.phoneDisplay || state.store.business.whatsapp || '';
    const heroEyebrow = document.querySelector('.hero-copy .eyebrow');
    if (heroEyebrow) heroEyebrow.textContent = 'DIPSA HELVECIA';
    $('#storeStatus').textContent = state.store.business.storeOpen === false ? 'Cerrado' : 'Abierto ahora';
    $('#promoHeadline').textContent = state.store.business.promoHeadline || 'Promos destacadas';
  }

  function formatBirthdayNames(names){
    if (!names.length) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + ' y ' + names[1];
    return names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
  }

  function renderBirthdayBanner(){
    const wrap = $('#birthdayBannerWrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    const names = (((state.store || {}).birthdayPeopleToday) || []).map(function(name){
      return String(name || '').trim();
    }).filter(Boolean);
    if (!names.length) return;

    const box = document.createElement('section');
    box.className = 'birthday-banner';
    box.innerHTML = [
      '<span class="eyebrow gold">Feliz cumpleaños</span>',
      '<strong>Dipsa les desea feliz cumpleaños a ' + escapeHtml(formatBirthdayNames(names)) + '.</strong>'
    ].join('');
    wrap.appendChild(box);
  }

  function renderHome(){
    if (!state.store) return;
    const promoWrap = $('#dailyPromos');
    promoWrap.innerHTML = '';
    state.store.promotionsDaily.filter(isActivePromo).forEach(function(promo){
      promoWrap.appendChild(createPromoCard(promo, 'Promo del día'));
    });
    state.carouselIndex = 0;
    promoWrap.scrollTo({ left: 0, behavior: 'auto' });

    const grid = $('#categoryGrid');
    grid.innerHTML = '';
    state.store.categories.forEach(function(category){
      const button = document.createElement('button');
      button.className = 'cat';
      button.textContent = category;
      button.addEventListener('click', function(){
        state.menuFilter = category;
        switchScreen('menu');
      });
      grid.appendChild(button);
    });
  }

  function renderPromos(){
    if (!state.store) return;
    const daily = $('#promoDailyList');
    const general = $('#promoGeneralList');
    daily.innerHTML = '';
    general.innerHTML = '';

    state.store.promotionsDaily.filter(isActivePromo).forEach(function(promo){
      daily.appendChild(createPromoRow(promo, true));
    });
    state.store.promotionsGeneral.filter(isActivePromo).forEach(function(promo){
      general.appendChild(createPromoRow(promo, false));
    });

    setPromoTab(state.promoTab);
  }

  function isActivePromo(item){
    return item.active !== false;
  }

  function setPromoTab(tab){
    state.promoTab = tab;
    $('#promoChipDaily').classList.toggle('active', tab === 'daily');
    $('#promoChipGeneral').classList.toggle('active', tab === 'general');
    $('#promoDailyBlock').classList.toggle('hidden-block', tab !== 'daily');
    $('#promoGeneralBlock').classList.toggle('hidden-block', tab !== 'general');
  }

  function createPromoCard(promo, label){
    const article = document.createElement('article');
    article.className = 'card';
    article.innerHTML = [
      '<img src="' + escapeAttribute(promo.image_url) + '" alt="' + escapeAttribute(promo.name) + '">',
      '<div class="promo-top"><div class="promo-title">' + escapeHtml(promo.name) + '</div><span class="badge daily">' + escapeHtml(label) + '</span></div>',
      '<div class="promo-desc">' + escapeHtml(promo.description || '') + '</div>',
      '<div class="price-row"><div>' + (promo.normal_price ? '<div class="old">' + window.DIPSA.money(promo.normal_price) + '</div>' : '') + '<div class="new">' + window.DIPSA.money(promo.promo_price) + '</div></div><button class="add-btn">Agregar</button></div>'
    ].join('');
    article.querySelector('.add-btn').addEventListener('click', function(){
      addToCart({ id: promo.id, name: promo.name, price: promo.promo_price, note: 'Promo' });
    });
    return article;
  }

  function createPromoRow(promo, isDaily){
    const row = document.createElement('article');
    row.className = 'promo-row';
    row.innerHTML = [
      '<img class="promo-thumb" src="' + escapeAttribute(promo.image_url) + '" alt="' + escapeAttribute(promo.name) + '">',
      '<div><div class="promo-top"><div class="promo-title">' + escapeHtml(promo.name) + '</div><span class="badge ' + (isDaily ? 'daily' : 'general') + '">' + (isDaily ? 'Hoy' : 'General') + '</span></div>',
      '<div class="promo-desc">' + escapeHtml(promo.description || '') + '</div>',
      '<div class="price-row"><div>' + (promo.normal_price ? '<div class="old">' + window.DIPSA.money(promo.normal_price) + '</div>' : '') + '<div class="new">' + window.DIPSA.money(promo.promo_price) + '</div></div><button class="add-btn">Agregar</button></div></div>'
    ].join('');
    row.querySelector('.add-btn').addEventListener('click', function(){
      addToCart({ id: promo.id, name: promo.name, price: promo.promo_price, note: isDaily ? 'Promo del día' : 'Promo general' });
    });
    return row;
  }

  function renderMenu(){
    if (!state.store) return;
    const chips = $('#menuFilterChips');
    chips.innerHTML = '';
    createMenuChip('Todo', 'all');
    state.store.categories.forEach(function(category){ createMenuChip(category, category); });

    const sections = $('#menuSections');
    sections.innerHTML = '';
    const categories = state.menuFilter === 'all' ? state.store.categories : [state.menuFilter];
    categories.forEach(function(category){
      const items = (state.store.products[category] || []).filter(function(item){ return item.active !== false; });
      if (!items.length) return;
      const section = document.createElement('section');
      section.className = 'menu-section';
      section.innerHTML = '<div class="menu-banner compact"><img src="' + escapeAttribute(window.DIPSA.getCategoryImage(category)) + '" alt="' + escapeAttribute(category) + '"><div class="copy"><strong class="menu-banner-title">' + escapeHtml(category) + '</strong><span class="menu-banner-subtitle">' + escapeHtml(categorySubtitle(category)) + '</span></div></div><div class="menu-items"></div>';
      const itemsWrap = section.querySelector('.menu-items');
      items.forEach(function(item){ itemsWrap.appendChild(createProductCard(item)); });
      sections.appendChild(section);
    });
  }

  function createMenuChip(label, key){
    const button = document.createElement('button');
    button.className = 'chip';
    button.textContent = label;
    button.classList.toggle('active', state.menuFilter === key);
    button.addEventListener('click', function(){
      state.menuFilter = key;
      renderMenu();
    });
    $('#menuFilterChips').appendChild(button);
  }

  function createProductCard(item){
    const article = document.createElement('article');
    article.className = 'product-card' + (item.in_stock === false ? ' is-out' : '');
    article.innerHTML = [
      '<div class="product-head"><div><div class="product-name">' + escapeHtml(item.name) + '</div>' + (item.detail ? '<div class="product-detail">' + escapeHtml(item.detail) + '</div>' : '') + '</div><span class="stock-badge ' + (item.in_stock === false ? 'out' : '') + '">' + (item.in_stock === false ? 'Sin stock' : 'Disponible') + '</span></div>',
      '<div class="product-actions"><div><div class="product-price">' + window.DIPSA.money(item.price) + '</div>' + (item.allow_half ? '<div class="product-subprice">Media pizza: ' + window.DIPSA.money(Math.round(item.price / 2)) + '</div>' : '') + '</div><div class="product-buttons"></div></div>'
    ].join('');
    const buttons = article.querySelector('.product-buttons');
    if (item.in_stock === false) {
      const disabled = document.createElement('button');
      disabled.className = 'add-btn disabled';
      disabled.textContent = 'Sin stock';
      disabled.disabled = true;
      buttons.appendChild(disabled);
      return article;
    }

    if (item.category === 'Pizzas' && item.allow_half) {
      const fullButton = document.createElement('button');
      fullButton.className = 'add-btn';
      fullButton.textContent = 'Entera';
      fullButton.addEventListener('click', function(){ addToCart({ id:item.id, name:'Pizza ' + item.name + ' entera', price:item.price, note:'' }); });
      const halfButton = document.createElement('button');
      halfButton.className = 'add-btn secondary-mini';
      halfButton.textContent = '1/2';
      halfButton.addEventListener('click', function(){ addToCart({ id:item.id + '-half', name:'Pizza ' + item.name + ' media', price:Math.round(item.price / 2), note:'' }); });
      buttons.appendChild(fullButton);
      buttons.appendChild(halfButton);
      return article;
    }

    const addButton = document.createElement('button');
    addButton.className = 'add-btn';
    addButton.textContent = 'Agregar';
    addButton.addEventListener('click', function(){
      if (item.category === 'Panchos') {
        const panchoName = String(item.name || '').toLowerCase().trim();
        if (panchoName === 'pancho simple' || panchoName === 'pancho pizza') return openPanchoDialog(item);
        return addToCart({ id:item.id, name:item.name, price:item.price, note:'' });
      }
      if (item.category === 'Empanadas') return openEmpanadaDialog(item);
      addToCart({ id:item.id, name:item.name, price:item.price, note:'' });
    });
    buttons.appendChild(addButton);
    return article;
  }

  function openPanchoDialog(item){
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-card"><div class="modal-head"><div><div class="eyebrow">Panchos</div><strong>' + escapeHtml(item.name) + '</strong></div><button class="modal-close" type="button">×</button></div><p class="modal-copy">Marcá opciones y escribí aclaraciones.</p><div class="emp-grid">' + (item.options || []).map(function(option){ return '<label class="switch-row emp-check"><input type="checkbox" value="' + escapeAttribute(option) + '"><span>' + escapeHtml(option) + '</span></label>'; }).join('') + '</div><label class="emp-note-wrap"><span>Gustos o aderezos</span><textarea id="panchoCustomNote" rows="3" placeholder="Ej: con cheddar, sin cebolla, con papas pay"></textarea></label><div class="modal-actions"><button class="chip" data-action="cancel" type="button">Cancelar</button><button class="add-btn" data-action="confirm" type="button">Agregar</button></div></div>';
    bindModalClose(overlay);
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', function(){
      const checks = Array.from(overlay.querySelectorAll('input[type="checkbox"]:checked')).map(function(node){ return node.value; });
      const note = overlay.querySelector('#panchoCustomNote').value.trim();
      const parts = [];
      if (checks.length) parts.push('Opciones: ' + checks.join(', '));
      if (note) parts.push(note);
      addToCart({ id:item.id, name:item.name, price:item.price, note:parts.join(' · ') });
      overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  function openEmpanadaDialog(item){
    const flavors = String(item.detail || '')
      .replace(/^sabores:\s*/i, '')
      .split(',')
      .map(function(value){ return value.trim(); })
      .filter(Boolean);
    const expected = window.DIPSA.detectEmpanadaTarget(item.name);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-card"><div class="modal-head"><div><div class="eyebrow">Empanadas</div><strong>' + escapeHtml(item.name) + '</strong></div><button class="modal-close" type="button">×</button></div><p class="modal-copy">Elegí cantidades por sabor' + (expected ? ' para completar ' + expected : '') + '.</p><div class="emp-grid">' + flavors.map(function(flavor){ return '<label class="emp-row"><span>' + escapeHtml(flavor) + '</span><input type="number" min="0" step="1" value="0" data-flavor="' + escapeAttribute(flavor) + '"></label>'; }).join('') + '</div><div class="small-note" id="empHint"></div><label class="emp-note-wrap"><span>Fritas / al horno / notas</span><textarea rows="2" id="empNote" placeholder="Ej: fritas, 2 bien cocidas"></textarea></label><div class="modal-actions"><button class="chip" data-action="cancel" type="button">Cancelar</button><button class="add-btn" data-action="confirm" type="button">Agregar</button></div></div>';
    bindModalClose(overlay);
    const hint = overlay.querySelector('#empHint');
    const inputs = Array.from(overlay.querySelectorAll('input[data-flavor]'));
    function refreshHint(){
      if (!expected) { hint.textContent = ''; return; }
      const total = inputs.reduce(function(sum, input){ return sum + Number(input.value || 0); }, 0);
      if (total === expected) hint.textContent = 'Perfecto: elegiste ' + total + '.';
      else if (total < expected) hint.textContent = 'Te faltan ' + (expected - total) + ' para completar ' + expected + '.';
      else hint.textContent = 'Te pasaste por ' + (total - expected) + '.';
    }
    inputs.forEach(function(input){ input.addEventListener('input', refreshHint); });
    refreshHint();
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', function(){
      const selected = inputs.map(function(input){
        return { flavor: input.dataset.flavor, qty: Number(input.value || 0) };
      }).filter(function(entry){ return entry.qty > 0; });
      const note = overlay.querySelector('#empNote').value.trim();
      const detailParts = [];
      if (selected.length) detailParts.push(selected.map(function(entry){ return entry.qty + ' ' + entry.flavor; }).join(' · '));
      if (note) detailParts.push(note);
      addToCart({ id:item.id, name:item.name, price:item.price, note:detailParts.join(' · ') });
      overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  function bindModalClose(overlay){
    overlay.addEventListener('click', function(event){ if (event.target === overlay) overlay.remove(); });
    overlay.querySelector('.modal-close').addEventListener('click', function(){ overlay.remove(); });
    overlay.querySelector('[data-action="cancel"]').addEventListener('click', function(){ overlay.remove(); });
  }

  function addToCart(item){
    state.cart.push({
      id: item.id || window.DIPSA.uid('cart'),
      name: item.name,
      price: Number(item.price || 0),
      note: item.note || ''
    });
    window.DIPSA.saveLocalCart(state.cart);
    renderCart();
  }


  function updateBirthdateFieldState(){
    const field = $('#customerBirthdate');
    if (!field) return;
    const locked = !!state.customer.birthdate;
    field.disabled = locked;
    field.readOnly = locked;
    field.classList.toggle('is-locked', locked);
    if (locked) {
      field.setAttribute('title', 'La fecha de cumpleaños ya quedó registrada y no se puede editar.');
    } else {
      field.removeAttribute('title');
    }
  }

  function startPromoCarousel(){
    if (state.carouselTimer) clearInterval(state.carouselTimer);
    state.carouselTimer = setInterval(advancePromoCarousel, 4500);
  }

  function advancePromoCarousel(){
    const wrap = $('#dailyPromos');
    if (!wrap || state.screen !== 'home' || document.visibilityState !== 'visible') return;
    const cards = Array.prototype.slice.call(wrap.children || []);
    if (cards.length < 2) return;
    state.carouselIndex = (state.carouselIndex + 1) % cards.length;
    const target = cards[state.carouselIndex];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }

  function renderCart(){
    const wrap = $('#cartItems');
    wrap.innerHTML = '';
    if (!state.cart.length) wrap.innerHTML = '<div class="empty-cart">Todavía no agregaste productos.</div>';
    state.cart.forEach(function(item, index){
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = '<div><div class="cart-name">' + escapeHtml(item.name) + '</div>' + (item.note ? '<div class="cart-note">' + escapeHtml(item.note) + '</div>' : '') + '</div><div class="cart-side"><strong style="color:#5a1ea3">' + window.DIPSA.money(item.price) + '</strong><button class="qty-btn" type="button">+</button><button class="remove-item" type="button">×</button></div>';
      row.querySelector('.qty-btn').addEventListener('click', function(){
        state.cart.splice(index + 1, 0, Object.assign({}, item));
        window.DIPSA.saveLocalCart(state.cart);
        renderCart();
      });
      row.querySelector('.remove-item').addEventListener('click', function(){
        state.cart.splice(index, 1);
        window.DIPSA.saveLocalCart(state.cart);
        renderCart();
      });
      wrap.appendChild(row);
    });

    refreshBirthdayState();
    const subtotal = state.cart.reduce(function(sum, item){ return sum + Number(item.price || 0); }, 0);
    const delivery = state.delivery ? Number((state.store && state.store.business.deliveryFee) || 0) : 0;
    const birthdayDiscount = state.birthdayActive ? Math.round(subtotal * Number((state.store && state.store.business.birthdayDiscountPercent) || 20) / 100) : 0;
    const total = subtotal + delivery - birthdayDiscount;

    $('#subtotal').textContent = window.DIPSA.money(subtotal);
    $('#deliveryCost').textContent = window.DIPSA.money(delivery);
    $('#birthdayDiscount').textContent = birthdayDiscount ? '-' + window.DIPSA.money(birthdayDiscount) : window.DIPSA.money(0);
    $('#total').textContent = window.DIPSA.money(total);
  }

  function updateDeliveryToggle(){
    $('#deliveryToggle').classList.toggle('active', state.delivery);
    $('#pickupToggle').classList.toggle('active', !state.delivery);
    document.querySelectorAll('.delivery-only').forEach(function(node){
      node.classList.toggle('hidden-block', !state.delivery);
    });
    $('#customerAddress').disabled = !state.delivery;
  }

  function refreshBirthdayState(){
    state.birthdayActive = window.DIPSA.isBirthdayToday(state.customer.birthdate);
    updateBirthdateFieldState();
    const birthdayHelp = $('#birthdayHelp');
    if (birthdayHelp) birthdayHelp.style.display = 'none';
  }

  async function submitOrder(){
    if (!state.store) return;
    collectCustomer();
    if (!state.cart.length) return alert('Agregá al menos un producto antes de enviar el pedido.');
    if (!state.customer.name.trim()) return focusError('#customerName', 'Completá tu nombre y apellido.');
    if (!state.customer.phone.trim()) return focusError('#customerPhone', 'Completá tu teléfono.');
    if (state.delivery && !state.customer.address.trim()) return focusError('#customerAddress', 'Completá la dirección para el delivery.');

    refreshBirthdayState();
    const subtotal = state.cart.reduce(function(sum, item){ return sum + Number(item.price || 0); }, 0);
    const delivery = state.delivery ? Number(state.store.business.deliveryFee || 0) : 0;
    const birthdayDiscount = state.birthdayActive ? Math.round(subtotal * Number(state.store.business.birthdayDiscountPercent || 20) / 100) : 0;
    const total = subtotal + delivery - birthdayDiscount;

    const orderPayload = {
      business: state.store.business.name,
      created_at: new Date().toISOString(),
      delivery: state.delivery,
      customer: {
        name: state.customer.name,
        phone: window.DIPSA.normalizePhone(state.customer.phone),
        address: state.delivery ? state.customer.address : '',
        zone: state.customer.zone,
        payment: state.customer.payment,
        notes: state.customer.notes,
        birthdate: state.customer.birthdate
      },
      items: state.cart,
      totals: {
        subtotal: subtotal,
        delivery: delivery,
        birthday_discount: birthdayDiscount,
        total: total
      }
    };

    try {
      const savedProfile = await window.DIPSA.registerCustomerProfile(state.customer);
      if (savedProfile) {
        mergeCustomer(savedProfile);
        syncForm();
      }
      await window.DIPSA.saveOrder(orderPayload);
    } catch (error) {
      console.warn('No se pudo guardar el pedido en Supabase:', error.message);
    }

    window.DIPSA.saveLocalProfile(state.customer);
    window.DIPSA.saveLocalCart(state.cart);

    const message = [
      'Hola ' + (state.store.business.name || 'Dipsa') + ', quiero hacer este pedido:',
      '',
      state.cart.map(function(item){ return '- ' + item.name + (item.note ? ' (' + item.note + ')' : '') + ' — ' + window.DIPSA.money(item.price); }).join('\n'),
      '',
      'Modalidad: ' + (state.delivery ? 'Delivery' : 'Retiro'),
      'Subtotal: ' + window.DIPSA.money(subtotal),
      'Delivery: ' + window.DIPSA.money(delivery),
      'Descuento cumpleaños: -' + window.DIPSA.money(birthdayDiscount),
      'Total final: ' + window.DIPSA.money(total),
      '',
      'Nombre: ' + state.customer.name,
      'Teléfono: ' + state.customer.phone,
      'Zona: ' + (state.customer.zone || '-'),
      'Dirección: ' + (state.delivery ? (state.customer.address || '-') : 'Retira en el local'),
      'Pago: ' + (state.customer.payment || '-'),
      'Fecha de nacimiento: ' + (state.customer.birthdate || '-'),
      'Observaciones: ' + (state.customer.notes || '-')
    ].join('\n');

    const phone = (state.store.business.whatsapp || '').replace(/\D+/g, '');
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank');
  }

  function collectCustomer(){
    state.customer = {
      name: $('#customerName').value.trim(),
      phone: $('#customerPhone').value.trim(),
      address: $('#customerAddress').value.trim(),
      zone: $('#customerZone').value.trim(),
      payment: $('#customerPayment').value.trim(),
      notes: $('#customerNotes').value.trim(),
      birthdate: $('#customerBirthdate').value
    };
    persistCustomer();
  }

  function focusError(selector, message){
    alert(message);
    $(selector).focus();
  }

  function openBusinessWhatsApp(){
    if (!state.store) return;
    const phone = (state.store.business.whatsapp || '').replace(/\D+/g, '');
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent('Hola ' + state.store.business.name + ', quiero hacer un pedido.'), '_blank');
  }

  function switchScreen(screen){
    state.screen = screen;
    document.querySelectorAll('.screen').forEach(function(node){ node.classList.remove('active'); });
    document.querySelectorAll('.nav-btn').forEach(function(node){ node.classList.toggle('active', node.dataset.screen === screen); });
    const target = document.getElementById(screen);
    if (target) target.classList.add('active');
    if (screen === 'menu') renderMenu();
    if (screen === 'promos') setPromoTab(state.promoTab);
  }

  function categorySubtitle(category){
    const map = {
      Pizzas: 'Elegí entera o media',
      Panchos: 'Con gustos y aderezos',
      Empanadas: 'Fritas o al horno',
      Milanesas: 'Pollo o carne',
      Hamburguesas: 'Con medallón casero',
      Papas: 'Papas fritas y especiales',
      Bebidas: 'Frías para acompañar',
      Cervezas: 'Latas y botellas'
    };
    return map[category] || 'Menú';
  }

  function escapeHtml(value){
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value){
    return escapeHtml(value);
  }
})();
