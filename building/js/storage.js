const Storage = {
  KEYS: {
    MENU: 'restaurant_menu',
    SETTINGS: 'restaurant_settings',
    SALES: 'restaurant_sales'
  },

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getMenu() {
    return this.get(this.KEYS.MENU, []);
  },

  saveMenu(menu) {
    this.set(this.KEYS.MENU, menu);
  },

  getSettings() {
    const defaults = {
      name: 'The Heritage Plate',
      paymentId: '',
      paymentNote: 'Scan to pay'
    };
    const settings = this.get(this.KEYS.SETTINGS, defaults);
    const legacyNames = ['My Restaurant', "Izza's Kitchen"];
    if (legacyNames.includes(settings.name)) {
      settings.name = defaults.name;
      this.saveSettings(settings);
    }
    return settings;
  },

  saveSettings(settings) {
    this.set(this.KEYS.SETTINGS, settings);
  },

  getSales() {
    return this.get(this.KEYS.SALES, []);
  },

  saveSales(sales) {
    this.set(this.KEYS.SALES, sales);
  },

  addSale(sale) {
    const sales = this.getSales();
    sales.push(sale);
    this.saveSales(sales);
  }
};

function formatLKR(amount) {
  return 'Rs. ' + Number(amount).toFixed(2);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
