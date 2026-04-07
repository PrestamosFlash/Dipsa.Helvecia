window.DIPSA_STORAGE_KEY = 'dipsaCatalogV3';

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
    catalog.products[category] = (items || []).map((item, index) => {
      const hasPrice = typeof item.price === 'number' && item.price >= 0;
      return {
        id: item.id || `${category}-${index}`,
        name: item.name || `${category} ${index + 1}`,
        price: hasPrice ? item.price : 0,
        detail: item.detail || '',
        active: item.active !== false,
        inStock: item.inStock !== false,
        image: item.image || '',
        allowHalf: item.allowHalf === true,
        options: Array.isArray(item.options) ? item.options : []
      };
    });
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

function inferPromoImage(name){
  const text = String(name || '').toLowerCase();
  if (text.includes('pancho')) return 'assets/pancho.jpg';
  if (text.includes('mila')) return 'assets/mila.jpg';
  if (text.includes('burger') || text.includes('hamburg')) return 'assets/burger.jpg';
  if (text.includes('empanada')) return 'assets/empanadas.jpg';
  if (text.includes('papa')) return 'assets/papas.jpg';
  return 'assets/pizza.jpg';
}

window.loadCatalog = function(){
  const saved = localStorage.getItem(window.DIPSA_STORAGE_KEY);
  const base = saved ? JSON.parse(saved) : window.DEFAULT_CATALOG;
  return window.normalizeCatalog(base);
};
window.saveCatalog = function(catalog){
  localStorage.setItem(window.DIPSA_STORAGE_KEY, JSON.stringify(window.normalizeCatalog(catalog)));
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
