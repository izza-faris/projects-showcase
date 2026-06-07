const Cart = {
  items: [],

  add(menuItem) {
    const existing = this.items.find(line => line.id === menuItem.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty: 1
      });
    }
  },

  updateQty(id, delta) {
    const line = this.items.find(item => item.id === id);
    if (!line) return;

    line.qty += delta;
    if (line.qty <= 0) {
      this.remove(id);
    }
  },

  remove(id) {
    this.items = this.items.filter(item => item.id !== id);
  },

  clear() {
    this.items = [];
  },

  getTotal() {
    return this.items.reduce((sum, line) => sum + line.price * line.qty, 0);
  },

  isEmpty() {
    return this.items.length === 0;
  },

  getSnapshot() {
    return this.items.map(line => ({
      id: line.id,
      name: line.name,
      price: line.price,
      qty: line.qty,
      subtotal: line.price * line.qty
    }));
  }
};
