const Menu = {
  DEFAULT_ITEMS: [
    { id: 'idly', name: 'Idly', price: 80, image: 'images/idly.jpg', active: true },
    { id: 'poori', name: 'Poori', price: 120, image: 'images/poori.jpg', active: true },
    { id: 'dhosa', name: 'Dhosa', price: 150, image: 'images/dhosa.jpg', active: true },
    { id: 'coffee', name: 'Coffee', price: 60, image: 'images/coffee.jpg', active: true },
    { id: 'wada', name: 'Wada', price: 40, image: 'images/wada.jpg', active: true },
    { id: 'phalampoori', name: 'Phalampoori', price: 180, image: 'images/phalampoori.jpg', active: true }
  ],

  DEFAULT_IMAGE_MAP: {
    idly: 'images/idly.jpg',
    poori: 'images/poori.jpg',
    dhosa: 'images/dhosa.jpg',
    coffee: 'images/coffee.jpg',
    wada: 'images/wada.jpg',
    phalampoori: 'images/phalampoori.jpg'
  },

  init() {
    const existing = Storage.getMenu();
    if (!existing.length) {
      Storage.saveMenu(this.DEFAULT_ITEMS);
      return;
    }
    this.syncDefaultImages(existing);
  },

  syncDefaultImages(menu) {
    let changed = false;
    const updated = menu.map(item => {
      const newImage = this.DEFAULT_IMAGE_MAP[item.id];
      if (newImage && item.image !== newImage && item.image.endsWith('.svg')) {
        changed = true;
        return { ...item, image: newImage };
      }
      return item;
    });
    if (changed) Storage.saveMenu(updated);
  },

  getAll() {
    return Storage.getMenu();
  },

  getActive() {
    return this.getAll().filter(item => item.active);
  },

  getById(id) {
    return this.getAll().find(item => item.id === id);
  },

  create(data) {
    const menu = this.getAll();
    const item = {
      id: generateId(),
      name: data.name.trim(),
      price: Number(data.price),
      image: data.image.trim() || 'images/placeholder.svg',
      active: data.active !== false
    };
    menu.push(item);
    Storage.saveMenu(menu);
    return item;
  },

  update(id, data) {
    const menu = this.getAll();
    const index = menu.findIndex(item => item.id === id);
    if (index === -1) return null;

    menu[index] = {
      ...menu[index],
      name: data.name.trim(),
      price: Number(data.price),
      image: data.image.trim() || menu[index].image,
      active: data.active !== false
    };
    Storage.saveMenu(menu);
    return menu[index];
  },

  delete(id) {
    const menu = this.getAll().filter(item => item.id !== id);
    Storage.saveMenu(menu);
  }
};
