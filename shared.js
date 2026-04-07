(function(){
  const CONFIG = window.DIPSA_CONFIG || {};
  const API_BASE = CONFIG.supabaseUrl ? CONFIG.supabaseUrl.replace(/\/$/, '') + '/rest/v1' : '';
  const LOCAL_PROFILE_KEY = 'dipsa_profile_v4';
  const LOCAL_CART_KEY = 'dipsa_cart_v4';
  const DEFAULT_CATEGORIES = ['Pizzas','Panchos','Empanadas','Milanesas','Hamburguesas','Papas','Bebidas','Cervezas'];
  const CATEGORY_IMAGES = {
    Pizzas: 'assets/pizza.jpg',
    Panchos: 'assets/pancho.jpg',
    Empanadas: 'assets/empanadas.jpg',
    Milanesas: 'assets/mila.jpg',
    Hamburguesas: 'assets/burger.jpg',
    Papas: 'assets/papas.jpg',
    Bebidas: 'assets/hero.jpg',
    Cervezas: 'assets/hero.jpg'
  };

  const DEFAULT_DATA = {
    business: {
      name: 'Dipsa',
      tagline: 'Pizzas, birras y combos al toque',
      whatsapp: '5493405490506',
      phoneDisplay: '+54 9 3405 49-0506',
      deliveryMessage: 'Delivery y pedidos por WhatsApp',
      deliveryFee: 2000,
      storeOpen: true,
      logo: 'assets/logo.jpg',
      heroImage: 'assets/hero.jpg',
      birthdayDiscountPercent: 20,
      birthdayBannerText: 'Si es tu cumpleaños, cargá tu fecha y te damos descuento por ese día.',
      promoHeadline: 'Promos destacadas',
      currency: 'ARS'
    },
    products: [
      { id:'pizza-1', category:'Pizzas', name:'Mozzarella', price:10000, detail:'Pizza clásica de muzza', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:1, options:[] },
      { id:'pizza-2', category:'Pizzas', name:'Mozzarella y huevo rayado', price:11000, detail:'Muzzarella y huevo', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:2, options:[] },
      { id:'pizza-3', category:'Pizzas', name:'Mozzarella con jamón y huevo', price:14000, detail:'Muzzarella, jamón y huevo', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:3, options:[] },
      { id:'pizza-4', category:'Pizzas', name:'Calabrese', price:15500, detail:'Calabresa y muzzarella', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:4, options:[] },
      { id:'pizza-5', category:'Pizzas', name:'Peperoni', price:15500, detail:'Peperoni y muzzarella', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:5, options:[] },
      { id:'pizza-6', category:'Pizzas', name:'Napolitana', price:12500, detail:'Tomate, ajo y muzzarella', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:6, options:[] },
      { id:'pizza-7', category:'Pizzas', name:'Choclo y verdeo', price:12500, detail:'Choclo y verdeo', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:7, options:[] },
      { id:'pizza-8', category:'Pizzas', name:'Roquefort', price:14000, detail:'Roquefort y muzzarella', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:8, options:[] },
      { id:'pizza-9', category:'Pizzas', name:'Roquefort y cherrys', price:17000, detail:'Roquefort con tomate cherry', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:9, options:[] },
      { id:'pizza-10', category:'Pizzas', name:'Provenzal y huevo rayado', price:12000, detail:'Provenzal con huevo', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:10, options:[] },
      { id:'pizza-11', category:'Pizzas', name:'Especial completa', price:16500, detail:'Jamón, morrón y huevo', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:11, options:[] },
      { id:'pizza-12', category:'Pizzas', name:'Panceta y verdeo', price:18000, detail:'Panceta crocante y verdeo', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:12, options:[] },
      { id:'pizza-13', category:'Pizzas', name:'Panceta y roquefort', price:19000, detail:'Panceta con roquefort', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:13, options:[] },
      { id:'pizza-14', category:'Pizzas', name:'Panceta y cheddar', price:19000, detail:'Panceta con cheddar', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:14, options:[] },
      { id:'pizza-15', category:'Pizzas', name:'Champiñones y cherrys', price:18000, detail:'Champiñones y tomate cherry', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:15, options:[] },
      { id:'pizza-16', category:'Pizzas', name:'Jamón y palmitos con salsa golf', price:19000, detail:'Jamón, palmitos y salsa golf', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:16, options:[] },
      { id:'pizza-17', category:'Pizzas', name:'Anchoas', price:15000, detail:'Pizza con anchoas', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:17, options:[] },
      { id:'pizza-18', category:'Pizzas', name:'Cebollada', price:12500, detail:'Muzzarella y cebolla', allow_half:true, image_url:'assets/pizza.jpg', active:true, in_stock:true, sort_order:18, options:[] },

      { id:'pancho-1', category:'Panchos', name:'Pancho simple', price:3000, detail:'Elegí aderezos al agregar', allow_half:false, image_url:'assets/pancho.jpg', active:true, in_stock:true, sort_order:1, options:['Mostaza','Mayonesa','Salsa picante','Salsa criolla','Lluvia de papas pay'] },
      { id:'pancho-2', category:'Panchos', name:'Pancho pizza', price:6000, detail:'Elegí gusto estilo pizza', allow_half:false, image_url:'assets/pancho.jpg', active:true, in_stock:true, sort_order:2, options:['Mozzarella','Mozzarella y jamón','Calabresa','Peperoni','Roquefort','Panceta y cheddar'] },
      { id:'pancho-3', category:'Panchos', name:'Papas extra', price:2500, detail:'Extra para acompañar', allow_half:false, image_url:'assets/papas.jpg', active:true, in_stock:true, sort_order:3, options:[] },

      { id:'emp-1', category:'Empanadas', name:'Unidad', price:1500, detail:'Sabores: Carne, Capresse, Choclo, Jamón y Queso', allow_half:false, image_url:'assets/empanadas.jpg', active:true, in_stock:true, sort_order:1, options:[] },
      { id:'emp-2', category:'Empanadas', name:'Media docena', price:8000, detail:'Sabores: Carne, Capresse, Choclo, Jamón y Queso', allow_half:false, image_url:'assets/empanadas.jpg', active:true, in_stock:true, sort_order:2, options:[] },
      { id:'emp-3', category:'Empanadas', name:'Docena', price:16000, detail:'Sabores: Carne, Capresse, Choclo, Jamón y Queso', allow_half:false, image_url:'assets/empanadas.jpg', active:true, in_stock:true, sort_order:3, options:[] },

      { id:'mila-1', category:'Milanesas', name:'Simple con papas (pollo o carne)', price:16000, detail:'Milanesa simple con papas', allow_half:false, image_url:'assets/mila.jpg', active:true, in_stock:true, sort_order:1, options:[] },
      { id:'mila-2', category:'Milanesas', name:'Completo con papas (pollo o carne)', price:20000, detail:'Tomate, lechuga, queso, jamón y huevo', allow_half:false, image_url:'assets/mila.jpg', active:true, in_stock:true, sort_order:2, options:[] },

      { id:'burger-1', category:'Hamburguesas', name:'Gratinadas', price:10000, detail:'Medallón de carne y queso cheddar o ahumado', allow_half:false, image_url:'assets/burger.jpg', active:true, in_stock:true, sort_order:1, options:[] },
      { id:'burger-2', category:'Hamburguesas', name:'Simples', price:11000, detail:'Medallón de carne + queso a elección + lechuga y tomate', allow_half:false, image_url:'assets/burger.jpg', active:true, in_stock:true, sort_order:2, options:[] },
      { id:'burger-3', category:'Hamburguesas', name:'Completas', price:12000, detail:'Medallón de carne + queso + lechuga y tomate + jamón + huevo', allow_half:false, image_url:'assets/burger.jpg', active:true, in_stock:true, sort_order:3, options:[] },
      { id:'burger-4', category:'Hamburguesas', name:'Medallón extra', price:3000, detail:'Sumale un medallón', allow_half:false, image_url:'assets/burger.jpg', active:true, in_stock:true, sort_order:4, options:[] },

      { id:'papas-1', category:'Papas', name:'Papas simples', price:7000, detail:'Porción clásica', allow_half:false, image_url:'assets/papas.jpg', active:true, in_stock:true, sort_order:1, options:[] },
      { id:'papas-2', category:'Papas', name:'Papas cheddar', price:10000, detail:'Con salsa cheddar', allow_half:false, image_url:'assets/papas.jpg', active:true, in_stock:true, sort_order:2, options:[] },
      { id:'papas-3', category:'Papas', name:'Papas salsa brava', price:10000, detail:'Con salsa brava', allow_half:false, image_url:'assets/papas.jpg', active:true, in_stock:true, sort_order:3, options:[] },
      { id:'papas-4', category:'Papas', name:'Papas provenzal', price:10000, detail:'Con provenzal', allow_half:false, image_url:'assets/papas.jpg', active:true, in_stock:true, sort_order:4, options:[] },
      { id:'papas-5', category:'Papas', name:'Papas con huevos revueltos', price:10000, detail:'Con huevo revuelto', allow_half:false, image_url:'assets/papas.jpg', active:true, in_stock:true, sort_order:5, options:[] },
      { id:'papas-6', category:'Papas', name:'Super papas 3 salsas', price:16000, detail:'Salsa brava, salsa provenzal y salsa cheddar', allow_half:false, image_url:'assets/papas.jpg', active:true, in_stock:true, sort_order:6, options:[] },

      { id:'bebida-1', category:'Bebidas', name:'Coca Cola 500cc', price:2000, detail:'Fría', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:1, options:[] },
      { id:'bebida-2', category:'Bebidas', name:'Sprite 500cc', price:2000, detail:'Fría', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:2, options:[] },
      { id:'bebida-3', category:'Bebidas', name:'Agua 500cc', price:1500, detail:'Fría', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:3, options:[] },
      { id:'bebida-4', category:'Bebidas', name:'Coca Cola 2.25L', price:5000, detail:'Botella grande', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:4, options:[] },
      { id:'bebida-5', category:'Bebidas', name:'Sprite 2.25L', price:5000, detail:'Botella grande', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:5, options:[] },

      { id:'beer-1', category:'Cervezas', name:'Budweiser 1L', price:4500, detail:'Botella', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:1, options:[] },
      { id:'beer-2', category:'Cervezas', name:'Artesanales', price:8000, detail:'Consultar estilos', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:2, options:[] },
      { id:'beer-3', category:'Cervezas', name:'Stella 1L', price:6500, detail:'Botella', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:3, options:[] },
      { id:'beer-4', category:'Cervezas', name:'Heineken 1L', price:7000, detail:'Botella', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:4, options:[] },
      { id:'beer-5', category:'Cervezas', name:'Latas cerveza', price:2500, detail:'Consultar marcas', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:5, options:[] },
      { id:'beer-6', category:'Cervezas', name:'Lata Heineken', price:4000, detail:'Lata fría', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:6, options:[] },
      { id:'beer-7', category:'Cervezas', name:'Latas Ley Primera', price:5000, detail:'Línea clásica', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:7, options:[] },
      { id:'beer-8', category:'Cervezas', name:'Latas Ley Primera premium', price:6000, detail:'Línea premium', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:8, options:[] },
      { id:'beer-9', category:'Cervezas', name:'Lata Cannabis artesanal', price:6000, detail:'Artesanal', allow_half:false, image_url:'assets/hero.jpg', active:true, in_stock:true, sort_order:9, options:[] }
    ],
    promotions: [
      { id:'promo-d-1', promo_type:'daily', name:'Pizza + Empanadas', description:'1 pizza mozzarella con jamón y huevo + 1 docena de empanadas', normal_price:30000, promo_price:27000, image_url:'assets/pizza.jpg', active:true, sort_order:1 },
      { id:'promo-d-2', promo_type:'daily', name:'Especial + Empanadas', description:'1 pizza especial completa + 1 docena de empanadas', normal_price:32500, promo_price:29250, image_url:'assets/hero.jpg', active:true, sort_order:2 },
      { id:'promo-d-3', promo_type:'daily', name:'Panceta y Verdeo + Empanadas', description:'1 pizza panceta y verdeo + 1 docena de empanadas', normal_price:34000, promo_price:30600, image_url:'assets/pizza.jpg', active:true, sort_order:3 },
      { id:'promo-d-4', promo_type:'daily', name:'Doble Burger + Papas Cheddar', description:'2 hamburguesas completas + papas cheddar', normal_price:34000, promo_price:30600, image_url:'assets/burger.jpg', active:true, sort_order:4 },
      { id:'promo-d-5', promo_type:'daily', name:'Panchos Full', description:'4 panchos simples + papas cheddar', normal_price:23200, promo_price:20900, image_url:'assets/pancho.jpg', active:true, sort_order:5 },
      { id:'promo-d-6', promo_type:'daily', name:'Doble Mila', description:'2 sánguches de milanesa simples con papas', normal_price:32000, promo_price:30400, image_url:'assets/mila.jpg', active:true, sort_order:6 },
      { id:'promo-g-1', promo_type:'general', name:'Doble Burger', description:'2 hamburguesas completas con papas', normal_price:0, promo_price:22800, image_url:'assets/burger.jpg', active:true, sort_order:1 },
      { id:'promo-g-2', promo_type:'general', name:'Pizza para Compartir', description:'Pizza napolitana + papas simples + 2 gaseosas 500cc', normal_price:0, promo_price:22300, image_url:'assets/pizza.jpg', active:true, sort_order:2 },
      { id:'promo-g-3', promo_type:'general', name:'Especial + Papas', description:'1 pizza especial completa + papas simples', normal_price:0, promo_price:22300, image_url:'assets/pizza.jpg', active:true, sort_order:3 },
      { id:'promo-g-4', promo_type:'general', name:'Empanadas y Gaseosa', description:'1 docena + gaseosa 2.25L', normal_price:0, promo_price:20000, image_url:'assets/empanadas.jpg', active:true, sort_order:4 },
      { id:'promo-g-5', promo_type:'general', name:'Panchos para Compartir', description:'4 panchos pizza', normal_price:0, promo_price:22800, image_url:'assets/pancho.jpg', active:true, sort_order:5 }
    ]
  };

  function commonHeaders(extra){
    return Object.assign({
      apikey: CONFIG.supabaseAnonKey || '',
      Authorization: 'Bearer ' + (CONFIG.supabaseAnonKey || ''),
      'Content-Type': 'application/json'
    }, extra || {});
  }

  async function apiFetch(path, options){
    if (!API_BASE) throw new Error('Falta configurar Supabase en config.js');
    const response = await fetch(API_BASE + path, options);
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch (error) { payload = text; }
    if (!response.ok) {
      const message = payload && payload.message ? payload.message : (payload && payload.error_description) ? payload.error_description : text || 'Error de Supabase';
      throw new Error(message);
    }
    return payload;
  }

  async function rpc(name, params){
    return apiFetch('/rpc/' + name, {
      method: 'POST',
      headers: commonHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(params || {})
    });
  }

  function deepClone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function normalizePhone(value){
    return String(value || '').replace(/\D+/g, '');
  }

  function uid(prefix){
    const random = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
    return (prefix || 'id') + '-' + random;
  }

  function money(value){
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function saveLocalProfile(profile){
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile || {}));
  }

  function loadLocalProfile(){
    try {
      return JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY) || '{}');
    } catch (error) {
      return {};
    }
  }

  function saveLocalCart(cart){
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(Array.isArray(cart) ? cart : []));
  }

  function loadLocalCart(){
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function isBirthdayToday(value){
    if (!value) return false;
    const date = new Date(value + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return now.getMonth() === date.getMonth() && now.getDate() === date.getDate();
  }

  function detectEmpanadaTarget(name){
    const lower = String(name || '').toLowerCase();
    if (lower.includes('docena')) return 12;
    if (lower.includes('media')) return 6;
    if (lower.includes('unidad')) return 1;
    return 0;
  }

  function getCategoryImage(category){
    return CATEGORY_IMAGES[category] || 'assets/hero.jpg';
  }

  function groupProducts(items){
    const grouped = {};
    DEFAULT_CATEGORIES.forEach(function(category){ grouped[category] = []; });
    (items || []).forEach(function(item){
      const category = item.category || 'Otros';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(Object.assign({ image_url: getCategoryImage(category) }, item));
    });
    Object.keys(grouped).forEach(function(category){
      grouped[category].sort(function(a, b){ return Number(a.sort_order || 0) - Number(b.sort_order || 0); });
    });
    return grouped;
  }

  function normalizeBusiness(business){
    const base = deepClone(DEFAULT_DATA.business);
    return Object.assign(base, business || {}, {
      deliveryFee: Number((business || {}).deliveryFee != null ? business.deliveryFee : base.deliveryFee),
      birthdayDiscountPercent: Number((business || {}).birthdayDiscountPercent != null ? business.birthdayDiscountPercent : base.birthdayDiscountPercent),
      storeOpen: (business || {}).storeOpen !== false
    });
  }

  function normalizeStorefront(raw){
    const source = raw || {};
    const business = normalizeBusiness(source.business);
    const products = Array.isArray(source.products) ? source.products.map(function(item){
      const category = item.category || 'Otros';
      return {
        id: item.id || uid('product'),
        category: category,
        name: item.name || 'Sin nombre',
        detail: item.detail || '',
        price: Number(item.price || 0),
        image_url: item.image_url || getCategoryImage(category),
        active: item.active !== false,
        in_stock: item.in_stock !== false,
        allow_half: item.allow_half === true,
        options: Array.isArray(item.options) ? item.options : [],
        sort_order: Number(item.sort_order || 0)
      };
    }) : deepClone(DEFAULT_DATA.products);

    const promotions = Array.isArray(source.promotions) ? source.promotions.map(function(item){
      return {
        id: item.id || uid('promo'),
        promo_type: item.promo_type === 'general' ? 'general' : 'daily',
        name: item.name || 'Promo',
        description: item.description || '',
        normal_price: Number(item.normal_price || 0),
        promo_price: Number(item.promo_price || 0),
        image_url: item.image_url || 'assets/pizza.jpg',
        active: item.active !== false,
        sort_order: Number(item.sort_order || 0)
      };
    }) : deepClone(DEFAULT_DATA.promotions);

    promotions.sort(function(a, b){ return Number(a.sort_order || 0) - Number(b.sort_order || 0); });

    return {
      business: business,
      products: groupProducts(products),
      productsFlat: products,
      promotionsDaily: promotions.filter(function(item){ return item.promo_type === 'daily'; }),
      promotionsGeneral: promotions.filter(function(item){ return item.promo_type === 'general'; }),
      categories: DEFAULT_CATEGORIES.slice()
    };
  }

  async function getStorefrontData(){
    try {
      const data = await rpc('get_storefront_data');
      return normalizeStorefront(data);
    } catch (error) {
      console.warn('Usando datos base por un problema con Supabase:', error.message);
      return normalizeStorefront(DEFAULT_DATA);
    }
  }

  async function getCustomerProfile(phone){
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) return null;
    const data = await rpc('get_customer_profile', { p_phone: cleanPhone });
    return data || null;
  }

  async function registerCustomerProfile(profile){
    const payload = {
      p_phone: normalizePhone(profile.phone),
      p_full_name: String(profile.name || '').trim(),
      p_birthdate: profile.birthdate || null,
      p_address: String(profile.address || '').trim(),
      p_zone: String(profile.zone || '').trim(),
      p_notes: String(profile.notes || '').trim()
    };
    if (!payload.p_phone) throw new Error('Falta teléfono');
    const result = await rpc('register_customer_profile', payload);
    return result || null;
  }

  async function saveOrder(order){
    return rpc('save_order', { p_payload: order });
  }

  async function adminLogin(password){
    return rpc('admin_login', { p_password: String(password || '') });
  }

  async function adminSaveAll(password, payload){
    return rpc('admin_save_all', { p_password: String(password || ''), p_payload: payload });
  }

  function createEmptyProduct(category){
    return {
      id: uid('product'),
      category: category,
      name: '',
      detail: '',
      price: 0,
      image_url: getCategoryImage(category),
      active: true,
      in_stock: true,
      allow_half: category === 'Pizzas',
      options: [],
      sort_order: 999
    };
  }

  function createEmptyPromotion(type){
    return {
      id: uid('promo'),
      promo_type: type,
      name: '',
      description: '',
      normal_price: 0,
      promo_price: 0,
      image_url: type === 'general' ? 'assets/pizza.jpg' : 'assets/pizza.jpg',
      active: true,
      sort_order: 999
    };
  }

  function fileToDataUrl(file){
    return new Promise(function(resolve, reject){
      const reader = new FileReader();
      reader.onload = function(){ resolve(String(reader.result)); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  window.DIPSA = {
    config: CONFIG,
    apiBase: API_BASE,
    categories: DEFAULT_CATEGORIES,
    defaults: deepClone(DEFAULT_DATA),
    categoryImages: CATEGORY_IMAGES,
    money: money,
    deepClone: deepClone,
    uid: uid,
    fileToDataUrl: fileToDataUrl,
    normalizePhone: normalizePhone,
    detectEmpanadaTarget: detectEmpanadaTarget,
    isBirthdayToday: isBirthdayToday,
    getCategoryImage: getCategoryImage,
    normalizeStorefront: normalizeStorefront,
    getStorefrontData: getStorefrontData,
    getCustomerProfile: getCustomerProfile,
    registerCustomerProfile: registerCustomerProfile,
    saveOrder: saveOrder,
    adminLogin: adminLogin,
    adminSaveAll: adminSaveAll,
    saveLocalProfile: saveLocalProfile,
    loadLocalProfile: loadLocalProfile,
    saveLocalCart: saveLocalCart,
    loadLocalCart: loadLocalCart,
    createEmptyProduct: createEmptyProduct,
    createEmptyPromotion: createEmptyPromotion
  };
})();
