
window.DIPSA_STORAGE_KEY = 'dipsaCatalogV3';
window.DIPSA_ADMIN_AUTH_KEY = 'dipsaAdminAuthV1';
window.DIPSA_SUPABASE_CACHE_KEY = 'dipsaSupabaseCatalogCacheV1';
window.DIPSA_LAST_SYNC_KEY = 'dipsaLastSyncV1';

window.deepClone = function(value){
  return JSON.parse(JSON.stringify(value));
};

window.normalizeCatalog = function(raw){
  const catalog = window.deepClone(raw || window.DEFAULT_CATALOG || {});
  catalog.business = catalog.business || {};
  catalog.business.name = catalog.business.name || 'Dipsa';
  catalog.business.tagline = catalog.business.tagline || 'Pizzas, birras y combos al toque';
  catalog.business.whatsapp = catalog.business.whatsapp || '5493405490506';
  catalog.business.deliveryFee = Number(catalog.business.deliveryFee || 0);
  catalog.business.storeOpen = catalog.business.storeOpen !== false;
  catalog.business.logo = catalog.business.logo || 'assets/logo.jpg';
  catalog.business.heroImage = catalog.business.heroImage || 'assets/hero.jpg';
  catalog.business.phoneDisplay = catalog.business.phoneDisplay || '+54 9 3405 49-0506';
  catalog.business.deliveryMessage = catalog.business.deliveryMessage || 'Delivery y pedidos por WhatsApp';

  catalog.categories = Array.isArray(catalog.categories) ? catalog.categories : [];
  catalog.products = catalog.products || {};
  Object.entries(catalog.products).forEach(([category, items]) => {
    catalog.products[category] = (items || [])
      .map((item, index) => {
        const hasPrice = typeof item.price === 'number' && item.price >= 0;
        return {
          id: item.id || `${category}-${index}`,
          name: item.name || `${category} ${index + 1}`,
          price: hasPrice ? item.price : Number(item.price || 0),
          detail: item.detail || '',
          active: item.active !== false,
          inStock: item.inStock !== false,
          image: item.image || '',
          allowHalf: item.allowHalf === true,
          options: Array.isArray(item.options) ? item.options : []
        };
      })
      .filter(item => shouldKeepProduct(category, item));
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

  if (catalog.products.Pizzas) {
    catalog.products.Pizzas = catalog.products.Pizzas.map(item => ({
      ...item,
      allowHalf: true
    }));
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

window.getLocalCatalog = function(){
  const saved = localStorage.getItem(window.DIPSA_STORAGE_KEY);
  const base = saved ? JSON.parse(saved) : window.DEFAULT_CATALOG;
  return window.normalizeCatalog(base);
};

window.getSupabaseConfig = function(){
  const cfg = window.DIPSA_SUPABASE || {};
  return {
    url: String(cfg.url || '').trim(),
    anonKey: String(cfg.anonKey || '').trim(),
    settingsKey: String(cfg.settingsKey || 'catalog').trim() || 'catalog'
  };
};

window.hasSupabaseConfig = function(){
  const cfg = window.getSupabaseConfig();
  return Boolean(cfg.url && cfg.anonKey);
};

let supabasePromise = null;
window.getSupabaseClient = async function(){
  if (!window.hasSupabaseConfig()) return null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    const cfg = window.getSupabaseConfig();
    return window.supabase.createClient(cfg.url, cfg.anonKey);
  }
  if (!supabasePromise) {
    supabasePromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(mod => {
        const cfg = window.getSupabaseConfig();
        return mod.createClient(cfg.url, cfg.anonKey);
      })
      .catch(err => {
        console.warn('No se pudo cargar Supabase', err);
        supabasePromise = null;
        return null;
      });
  }
  return supabasePromise;
};

window.getLastSyncText = function(){
  return localStorage.getItem(window.DIPSA_LAST_SYNC_KEY) || '';
};

window.setLastSyncText = function(value){
  if (!value) {
    localStorage.removeItem(window.DIPSA_LAST_SYNC_KEY);
    return;
  }
  localStorage.setItem(window.DIPSA_LAST_SYNC_KEY, value);
};

window.loadCatalog = async function(){
  const localCatalog = window.getLocalCatalog();
  if (!window.hasSupabaseConfig()) return localCatalog;

  try {
    const client = await window.getSupabaseClient();
    if (!client) return localCatalog;
    const cfg = window.getSupabaseConfig();
    const { data, error } = await client
      .from('settings')
      .select('value')
      .eq('key', cfg.settingsKey)
      .maybeSingle();

    if (error) throw error;
    if (data && data.value) {
      const remoteCatalog = window.normalizeCatalog(data.value);
      localStorage.setItem(window.DIPSA_STORAGE_KEY, JSON.stringify(remoteCatalog));
      localStorage.setItem(window.DIPSA_SUPABASE_CACHE_KEY, JSON.stringify(remoteCatalog));
      window.setLastSyncText(`Sincronizado con Supabase: ${new Date().toLocaleString('es-AR')}`);
      return remoteCatalog;
    }
  } catch (err) {
    console.warn('No se pudo cargar catálogo desde Supabase, sigo con local.', err);
  }

  return localCatalog;
};

window.saveCatalog = async function(catalog){
  const normalized = window.normalizeCatalog(catalog);
  localStorage.setItem(window.DIPSA_STORAGE_KEY, JSON.stringify(normalized));
  localStorage.setItem(window.DIPSA_SUPABASE_CACHE_KEY, JSON.stringify(normalized));

  if (!window.hasSupabaseConfig()) {
    window.setLastSyncText('Guardado solo en este navegador.');
    return { ok:true, remote:false };
  }

  try {
    const client = await window.getSupabaseClient();
    if (!client) throw new Error('Cliente de Supabase no disponible');
    const cfg = window.getSupabaseConfig();
    const payload = { key: cfg.settingsKey, value: normalized };
    const { error } = await client.from('settings').upsert(payload, { onConflict: 'key' });
    if (error) throw error;
    window.setLastSyncText(`Sincronizado con Supabase: ${new Date().toLocaleString('es-AR')}`);
    return { ok:true, remote:true };
  } catch (err) {
    console.warn('No se pudo guardar en Supabase, quedó local.', err);
    window.setLastSyncText('No se pudo sincronizar con Supabase. Quedó guardado localmente.');
    return { ok:false, remote:false, error: err };
  }
};

window.resetCatalog = function(){
  localStorage.removeItem(window.DIPSA_STORAGE_KEY);
};

window.money = function(n){
  return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n || 0));
};

window.fileToDataUrl = function(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
