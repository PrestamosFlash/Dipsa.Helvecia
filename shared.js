
window.DIPSA_STORAGE_KEY = 'dipsaCatalogV4';
window.DIPSA_ADMIN_AUTH_KEY = 'dipsaAdminAuthV2';
window.DIPSA_LAST_SYNC_KEY = 'dipsaLastSyncV2';

window.deepClone = function(value){
  return JSON.parse(JSON.stringify(value));
};

window.slugify = function(value){
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

window.getSupabaseConfig = function(catalogOverride){
  const localCatalog = catalogOverride || window.DEFAULT_CATALOG || {};
  const defaultConfig = window.DIPSA_SUPABASE_CONFIG || {};
  return {
    enabled: localCatalog.supabase?.enabled !== false && defaultConfig.enabled !== false,
    url: String(localCatalog.supabase?.url || defaultConfig.url || '').trim().replace(/\/$/, ''),
    anonKey: String(localCatalog.supabase?.anonKey || defaultConfig.anonKey || '').trim()
  };
};

window.isSupabaseReady = function(catalogOverride){
  const cfg = window.getSupabaseConfig(catalogOverride);
  return Boolean(cfg.enabled && cfg.url && cfg.anonKey);
};

window.normalizeCatalog = function(raw){
  const defaults = window.deepClone(window.DEFAULT_CATALOG || {});
  const catalog = window.deepClone(raw || defaults || {});

  catalog.business = { ...(defaults.business || {}), ...(catalog.business || {}) };
  catalog.business.name = catalog.business.name || 'Dipsa';
  catalog.business.tagline = catalog.business.tagline || 'Pizzas, birras y combos al toque';
  catalog.business.whatsapp = catalog.business.whatsapp || '5493405490506';
  catalog.business.deliveryFee = Number(catalog.business.deliveryFee || 0);
  catalog.business.storeOpen = catalog.business.storeOpen !== false;
  catalog.business.logo = catalog.business.logo || 'assets/logo.jpg';
  catalog.business.heroImage = catalog.business.heroImage || 'assets/hero.jpg';
  catalog.business.phoneDisplay = catalog.business.phoneDisplay || '+54 9 3405 49-0506';
  catalog.business.deliveryMessage = catalog.business.deliveryMessage || 'Delivery y pedidos por WhatsApp';

  catalog.admin = { ...(defaults.admin || {}), ...(catalog.admin || {}) };
  catalog.admin.password = String(catalog.admin.password || '');

  catalog.supabase = {
    ...(defaults.supabase || {}),
    ...(catalog.supabase || {}),
    url: String(catalog.supabase?.url || defaults.supabase?.url || '').trim().replace(/\/$/, ''),
    anonKey: String(catalog.supabase?.anonKey || defaults.supabase?.anonKey || '').trim(),
    enabled: catalog.supabase?.enabled !== false
  };

  catalog.categories = Array.isArray(catalog.categories) ? catalog.categories : (defaults.categories || []);
  catalog.products = catalog.products || {};

  Object.entries(catalog.products).forEach(([category, items]) => {
    catalog.products[category] = (items || []).map((item, index) => {
      const hasPrice = typeof item.price === 'number' || typeof item.price === 'string';
      return {
        id: item.id || `${category}-${index}`,
        name: item.name || `${category} ${index + 1}`,
        price: hasPrice ? Number(item.price || 0) : 0,
        detail: item.detail || '',
        active: item.active !== false,
        inStock: item.inStock !== false,
        image: item.image || '',
        allowHalf: item.allowHalf === true,
        options: Array.isArray(item.options) ? item.options : []
      };
    }).filter(item => shouldKeepProduct(category, item));
  });

  catalog.promosDaily = (catalog.promosDaily || []).map((promo, index) => ({
    id: promo.id || `daily-${index}`,
    name: promo.name || `Promo del día ${index + 1}`,
    desc: promo.desc || '',
    normal: Number(promo.normal || 0),
    price: Number(promo.price || 0),
    image: promo.image || 'assets/pizza.jpg',
    active: promo.active !== false
  }));

  catalog.promosGeneral = (catalog.promosGeneral || []).map((promo, index) => ({
    id: promo.id || `general-${index}`,
    name: promo.name || `Promo general ${index + 1}`,
    desc: promo.desc || '',
    normal: Number(promo.normal || 0),
    price: Number(promo.price || 0),
    image: promo.image || inferPromoImage(promo.name || ''),
    active: promo.active !== false
  }));

  catalog.panchos = { ...(defaults.panchos || {}), ...(catalog.panchos || {}) };

  if (catalog.products.Pizzas) {
    catalog.products.Pizzas = catalog.products.Pizzas.map(item => ({ ...item, allowHalf: true }));
  }

  if (catalog.products.Panchos) {
    catalog.products.Panchos = catalog.products.Panchos.map(item => {
      if (item.name.toLowerCase().includes('pancho simple')) {
        return { ...item, options: window.deepClone(catalog.panchos?.simpleSauces || []) };
      }
      if (item.name.toLowerCase().includes('pancho pizza')) {
        return { ...item, options: window.deepClone(catalog.panchos?.pizzaFlavors || []) };
      }
      return item;
    });
  }

  return catalog;
};

function shouldKeepProduct(category, item){
  const name = String(item?.name || '').trim();
  const detail = String(item?.detail || '').trim();
  if (!name) return false;
  if (category === 'Empanadas') {
    if (/^sabores?$/i.test(name) && Number(item.price || 0) === 0) return false;
    if (/^sabores?:/i.test(detail) && /^sabores?$/i.test(name)) return false;
  }
  return true;
}

function inferPromoImage(name){
  const text = String(name || '').toLowerCase();
  if (text.includes('pancho')) return 'assets/pancho.jpg';
  if (text.includes('mila')) return 'assets/mila.jpg';
  if (text.includes('burger') || text.includes('hamburg')) return 'assets/burger.jpg';
  if (text.includes('empanada')) return 'assets/empanadas.jpg';
  if (text.includes('papa')) return 'assets/papas.jpg';
  return 'assets/pizza.jpg';
}

function setLastSyncInfo(status, details){
  try {
    localStorage.setItem(window.DIPSA_LAST_SYNC_KEY, JSON.stringify({
      status,
      details: details || '',
      at: new Date().toISOString()
    }));
  } catch (err) {
    console.warn('No se pudo guardar el estado de sincronización', err);
  }
}

window.getLastSyncInfo = function(){
  try {
    const raw = localStorage.getItem(window.DIPSA_LAST_SYNC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

async function supabaseFetch(path, options = {}, catalogOverride){
  const cfg = window.getSupabaseConfig(catalogOverride);
  const response = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

async function loadRemoteCatalog(localCatalog){
  const rows = await supabaseFetch('settings?select=key,value&key=eq.app_catalog', {}, localCatalog);
  const remote = Array.isArray(rows) && rows[0]?.value ? rows[0].value : null;
  if (!remote) {
    return localCatalog;
  }
  return window.normalizeCatalog(remote);
}

window.loadCatalog = async function(){
  const saved = localStorage.getItem(window.DIPSA_STORAGE_KEY);
  const localCatalog = window.normalizeCatalog(saved ? JSON.parse(saved) : window.DEFAULT_CATALOG);

  if (!window.isSupabaseReady(localCatalog)) {
    window.catalog = localCatalog;
    return localCatalog;
  }

  try {
    const remoteCatalog = await loadRemoteCatalog(localCatalog);
    localStorage.setItem(window.DIPSA_STORAGE_KEY, JSON.stringify(remoteCatalog));
    window.catalog = remoteCatalog;
    setLastSyncInfo('online', 'Catálogo cargado desde Supabase');
    return remoteCatalog;
  } catch (error) {
    console.warn('Fallo la carga remota, se usa copia local', error);
    window.catalog = localCatalog;
    setLastSyncInfo('offline', String(error.message || error));
    return localCatalog;
  }
};

window.saveCatalog = async function(catalog){
  const normalized = window.normalizeCatalog(catalog);
  localStorage.setItem(window.DIPSA_STORAGE_KEY, JSON.stringify(normalized));
  window.catalog = normalized;

  if (!window.isSupabaseReady(normalized)) {
    setLastSyncInfo('local', 'Guardado solo en este navegador');
    return { ok: true, mode: 'local' };
  }

  try {
    await supabaseFetch('settings?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: [{ key: 'app_catalog', value: normalized }]
    }, normalized);
    setLastSyncInfo('online', 'Guardado en Supabase');
    return { ok: true, mode: 'supabase' };
  } catch (error) {
    console.error('No se pudo guardar en Supabase', error);
    setLastSyncInfo('offline', String(error.message || error));
    return { ok: false, mode: 'local', error };
  }
};

window.resetCatalog = function(){
  localStorage.removeItem(window.DIPSA_STORAGE_KEY);
};

window.money = function(n){
  return new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(Number(n || 0));
};

window.fileToDataUrl = function(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

window.disableOldServiceWorkers = async function(){
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(reg => reg.unregister()));
  } catch (err) {
    console.warn('No se pudieron limpiar service workers viejos', err);
  }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('dipsa')).map(key => caches.delete(key)));
  } catch (err) {
    console.warn('No se pudieron limpiar caches viejos', err);
  }
};
