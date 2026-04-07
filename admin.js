(function(){
  const $ = function(selector){ return document.querySelector(selector); };
  const state = {
    store: null
  };

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    bindTopActions();
    loadStore().catch(function(error){
      console.error(error);
      alert('No se pudo cargar el panel desde Supabase. Revisá config.js y el SQL.');
    });
  }


  function bindTopActions(){
    $('#saveAdmin').addEventListener('click', saveAll);
    $('#reloadAdmin').addEventListener('click', async function(){
      await loadStore();
      alert('Panel recargado con los datos guardados en Supabase.');
    });
    $('#addDailyPromo').addEventListener('click', function(){
      state.store.promotionsDaily.push(window.DIPSA.createEmptyPromotion('daily'));
      renderPromotions();
    });
    $('#addGeneralPromo').addEventListener('click', function(){
      state.store.promotionsGeneral.push(window.DIPSA.createEmptyPromotion('general'));
      renderPromotions();
    });
  }

  async function loadStore(){
    state.store = await window.DIPSA.getStorefrontData();
    fillGeneral();
    renderPromotions();
    renderProducts();
  }

  function fillGeneral(){
    const business = state.store.business;
    $('#businessName').value = business.name || '';
    $('#businessTagline').value = business.tagline || '';
    $('#businessWhatsapp').value = business.whatsapp || '';
    $('#businessPhoneDisplay').value = business.phoneDisplay || '';
    $('#deliveryMessage').value = business.deliveryMessage || '';
    $('#deliveryFee').value = Number(business.deliveryFee || 0);
    $('#logoUrl').value = business.logo || '';
    $('#heroUrl').value = business.heroImage || '';
    $('#promoHeadlineInput').value = business.promoHeadline || '';
    $('#storeOpenBtn').classList.toggle('active', business.storeOpen !== false);
    $('#storeClosedBtn').classList.toggle('active', business.storeOpen === false);

    $('#storeOpenBtn').onclick = function(){ state.store.business.storeOpen = true; fillGeneral(); };
    $('#storeClosedBtn').onclick = function(){ state.store.business.storeOpen = false; fillGeneral(); };

    bindImageUploader('#logoFile', '#logoUrl');
    bindImageUploader('#heroFile', '#heroUrl');
  }

  function bindImageUploader(fileSelector, targetSelector){
    const input = $(fileSelector);
    input.onchange = async function(event){
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const dataUrl = await window.DIPSA.fileToDataUrl(file);
      $(targetSelector).value = dataUrl;
    };
  }

  function renderPromotions(){
    renderPromotionList('#dailyPromoEditor', state.store.promotionsDaily, 'daily');
    renderPromotionList('#generalPromoEditor', state.store.promotionsGeneral, 'general');
  }

  function renderPromotionList(selector, list, type){
    const wrap = $(selector);
    wrap.innerHTML = '';
    list.sort(function(a, b){ return Number(a.sort_order || 0) - Number(b.sort_order || 0); });
    list.forEach(function(promo, index){
      const box = document.createElement('div');
      box.className = 'admin-item cardish';
      box.innerHTML = [
        '<div class="admin-row-head"><strong>' + escapeHtml(promo.name || 'Promo sin título') + '</strong><div class="admin-row-actions"><label class="switch-row"><input type="checkbox" data-type="promo-active" data-promo-type="' + type + '" data-index="' + index + '" ' + (promo.active !== false ? 'checked' : '') + '> Activa</label><button class="small-btn ghost tiny-btn" type="button" data-action="remove-promo" data-promo-type="' + type + '" data-index="' + index + '">Eliminar</button></div></div>',
        '<label>Título<input data-type="promo-name" data-promo-type="' + type + '" data-index="' + index + '" value="' + escapeAttribute(promo.name || '') + '"></label>',
        '<label>Descripción<textarea data-type="promo-description" data-promo-type="' + type + '" data-index="' + index + '" rows="2">' + escapeHtml(promo.description || '') + '</textarea></label>',
        '<div class="form-grid"><label>Precio normal<input type="number" data-type="promo-normal" data-promo-type="' + type + '" data-index="' + index + '" value="' + Number(promo.normal_price || 0) + '"></label><label>Precio promo<input type="number" data-type="promo-price" data-promo-type="' + type + '" data-index="' + index + '" value="' + Number(promo.promo_price || 0) + '"></label><label>Orden<input type="number" data-type="promo-order" data-promo-type="' + type + '" data-index="' + index + '" value="' + Number(promo.sort_order || 0) + '"></label></div>',
        '<label>Imagen URL o dataURL<input data-type="promo-image" data-promo-type="' + type + '" data-index="' + index + '" value="' + escapeAttribute(promo.image_url || '') + '"></label>',
        '<label>Subir imagen<input type="file" accept="image/*" data-type="promo-file" data-promo-type="' + type + '" data-index="' + index + '"></label>'
      ].join('');
      wrap.appendChild(box);
    });

    wrap.querySelectorAll('[data-action="remove-promo"]').forEach(function(button){
      button.addEventListener('click', function(){
        const index = Number(button.dataset.index);
        const targetList = button.dataset.promoType === 'daily' ? state.store.promotionsDaily : state.store.promotionsGeneral;
        targetList.splice(index, 1);
        renderPromotions();
      });
    });

    wrap.querySelectorAll('[data-type="promo-file"]').forEach(function(input){
      input.addEventListener('change', async function(event){
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const dataUrl = await window.DIPSA.fileToDataUrl(file);
        const index = Number(input.dataset.index);
        const targetList = input.dataset.promoType === 'daily' ? state.store.promotionsDaily : state.store.promotionsGeneral;
        targetList[index].image_url = dataUrl;
        renderPromotions();
      });
    });
  }

  function renderProducts(){
    const wrap = $('#productEditor');
    wrap.innerHTML = '';
    state.store.categories.forEach(function(category){
      const section = document.createElement('section');
      section.className = 'admin-group';
      section.innerHTML = '<div class="admin-section-head"><h3 class="admin-subtitle">' + escapeHtml(category) + '</h3><button class="small-btn" type="button" data-action="add-product" data-category="' + escapeAttribute(category) + '">Agregar producto</button></div><div class="admin-list" data-product-list="' + escapeAttribute(category) + '"></div>';
      wrap.appendChild(section);
      const listWrap = section.querySelector('[data-product-list="' + category + '"]');
      const items = (state.store.products[category] || []).slice().sort(function(a, b){ return Number(a.sort_order || 0) - Number(b.sort_order || 0); });
      items.forEach(function(item){
        const box = document.createElement('div');
        box.className = 'admin-item cardish';
        box.dataset.productId = item.id;
        box.innerHTML = [
          '<div class="admin-row-head"><strong>' + escapeHtml(item.name || 'Producto nuevo') + '</strong><div class="admin-row-actions"><label class="switch-row"><input type="checkbox" data-field="active" ' + (item.active !== false ? 'checked' : '') + '> Visible</label><label class="switch-row"><input type="checkbox" data-field="in_stock" ' + (item.in_stock !== false ? 'checked' : '') + '> En stock</label><button class="small-btn ghost tiny-btn" type="button" data-action="remove-product">Eliminar</button></div></div>',
          '<div class="form-grid"><label>Nombre<input data-field="name" value="' + escapeAttribute(item.name || '') + '"></label><label>Precio<input type="number" data-field="price" value="' + Number(item.price || 0) + '"></label><label>Orden<input type="number" data-field="sort_order" value="' + Number(item.sort_order || 0) + '"></label></div>',
          '<label>Detalle<textarea rows="2" data-field="detail">' + escapeHtml(item.detail || '') + '</textarea></label>',
          '<div class="form-grid"><label>Imagen URL o dataURL<input data-field="image_url" value="' + escapeAttribute(item.image_url || '') + '"></label><label>Opciones separadas por coma<input data-field="options" value="' + escapeAttribute((item.options || []).join(', ')) + '"></label><label class="switch-row" style="margin-top:30px"><input type="checkbox" data-field="allow_half" ' + (item.allow_half === true ? 'checked' : '') + '> Permitir 1/2</label></div>',
          '<label>Subir imagen<input type="file" accept="image/*" data-action="upload-product-image"></label>'
        ].join('');
        listWrap.appendChild(box);
      });
    });

    wrap.querySelectorAll('[data-action="add-product"]').forEach(function(button){
      button.addEventListener('click', function(){
        const category = button.dataset.category;
        state.store.products[category].push(window.DIPSA.createEmptyProduct(category));
        renderProducts();
      });
    });

    wrap.querySelectorAll('[data-action="remove-product"]').forEach(function(button){
      button.addEventListener('click', function(){
        const card = button.closest('[data-product-id]');
        const id = card.dataset.productId;
        Object.keys(state.store.products).forEach(function(category){
          state.store.products[category] = state.store.products[category].filter(function(item){ return item.id !== id; });
        });
        renderProducts();
      });
    });

    wrap.querySelectorAll('[data-action="upload-product-image"]').forEach(function(input){
      input.addEventListener('change', async function(event){
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const card = input.closest('[data-product-id]');
        const dataUrl = await window.DIPSA.fileToDataUrl(file);
        card.querySelector('[data-field="image_url"]').value = dataUrl;
      });
    });
  }

  function collectBusiness(){
    state.store.business = Object.assign({}, state.store.business, {
      name: $('#businessName').value.trim(),
      tagline: $('#businessTagline').value.trim(),
      whatsapp: $('#businessWhatsapp').value.trim(),
      phoneDisplay: $('#businessPhoneDisplay').value.trim(),
      deliveryMessage: $('#deliveryMessage').value.trim(),
      deliveryFee: Number($('#deliveryFee').value || 0),
      logo: $('#logoUrl').value.trim(),
      heroImage: $('#heroUrl').value.trim(),
      promoHeadline: $('#promoHeadlineInput').value.trim(),
      storeOpen: state.store.business.storeOpen !== false
    });
    return state.store.business;
  }

  function collectPromotions(){
    collectPromotionList(state.store.promotionsDaily, 'daily');
    collectPromotionList(state.store.promotionsGeneral, 'general');
    return state.store.promotionsDaily.concat(state.store.promotionsGeneral);
  }

  function collectPromotionList(list, type){
    document.querySelectorAll('[data-promo-type="' + type + '"]').forEach(function(field){
      const index = Number(field.dataset.index);
      const target = list[index];
      if (!target) return;
      const role = field.dataset.type;
      if (role === 'promo-name') target.name = field.value.trim();
      if (role === 'promo-description') target.description = field.value.trim();
      if (role === 'promo-normal') target.normal_price = Number(field.value || 0);
      if (role === 'promo-price') target.promo_price = Number(field.value || 0);
      if (role === 'promo-order') target.sort_order = Number(field.value || 0);
      if (role === 'promo-image') target.image_url = field.value.trim();
      if (role === 'promo-active') target.active = field.checked;
    });
  }

  function collectProducts(){
    const products = [];
    document.querySelectorAll('[data-product-id]').forEach(function(card){
      const category = card.closest('.admin-group').querySelector('[data-action="add-product"]').dataset.category;
      const product = {
        id: card.dataset.productId,
        category: category,
        name: card.querySelector('[data-field="name"]').value.trim(),
        price: Number(card.querySelector('[data-field="price"]').value || 0),
        sort_order: Number(card.querySelector('[data-field="sort_order"]').value || 0),
        detail: card.querySelector('[data-field="detail"]').value.trim(),
        image_url: card.querySelector('[data-field="image_url"]').value.trim() || window.DIPSA.getCategoryImage(category),
        options: card.querySelector('[data-field="options"]').value.split(',').map(function(value){ return value.trim(); }).filter(Boolean),
        active: card.querySelector('[data-field="active"]').checked,
        in_stock: card.querySelector('[data-field="in_stock"]').checked,
        allow_half: card.querySelector('[data-field="allow_half"]').checked
      };
      if (product.name) products.push(product);
    });
    return products;
  }

  async function saveAll(){
    const saveButton = $('#saveAdmin');
    saveButton.disabled = true;
    saveButton.textContent = 'Guardando...';
    try {
      const payload = {
        business: collectBusiness(),
        products: collectProducts(),
        promotions: collectPromotions()
      };
      const result = await window.DIPSA.adminSaveAll('', payload);
      if (!result || result.ok !== true) throw new Error('No se pudieron guardar los cambios.');
      await loadStore();
      alert('Todo quedó guardado en Supabase.');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Error al guardar.');
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = 'Guardar cambios';
    }
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
