const App = {
  qrInstance: null,

  init() {
    Menu.init();
    this.applySettings();
    this.renderMenu();
    this.renderCart();
    this.bindViewTabs();
    this.bindCartActions();
    this.bindPayModal();
    this.bindMobileCartBar();

    Admin.init(() => {
      this.applySettings();
      this.renderMenu();
    });
  },

  applySettings() {
    const settings = Storage.getSettings();
    document.getElementById('restaurant-name').textContent = settings.name;
    document.title = settings.name + ' - Billing';
  },

  bindViewTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => {
          v.classList.remove('active', 'view-enter');
        });
        tab.classList.add('active');
        const view = document.getElementById(tab.dataset.view + '-view');
        view.classList.add('active', 'view-enter');
        if (tab.dataset.view === 'billing') {
          this.renderMenu();
        }
      });
    });
  },

  renderMenu() {
    const grid = document.getElementById('menu-grid');
    const items = Menu.getActive();

    if (!items.length) {
      grid.innerHTML = '<p class="empty-msg">No active menu items. Add items in Admin.</p>';
      return;
    }

    grid.innerHTML = items.map((item, index) => `
      <button type="button" class="menu-card animate-in" data-id="${item.id}" style="animation-delay: ${index * 0.07}s">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.src='images/placeholder.svg'">
        <span class="menu-card-name">${escapeHtml(item.name)}</span>
        <span class="menu-card-price">${formatLKR(item.price)}</span>
      </button>
    `).join('');

    grid.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', () => {
        const item = Menu.getById(card.dataset.id);
        if (item) {
          Cart.add(item);
          card.classList.remove('added');
          void card.offsetWidth;
          card.classList.add('added');
          this.renderCart(true);
        }
      });
    });
  },

  renderCart(animateTotal) {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const mobileBar = document.getElementById('mobile-cart-bar');
    const mobileCount = document.getElementById('mobile-cart-count');
    const mobileTotal = document.getElementById('mobile-cart-total');

    if (Cart.isEmpty()) {
      container.innerHTML = '<p class="empty-msg">Cart is empty. Click a menu item to add.</p>';
      totalEl.textContent = formatLKR(0);
      totalEl.classList.remove('total-bump');
      if (mobileBar) mobileBar.hidden = true;
      return;
    }

    container.innerHTML = Cart.items.map((line, index) => `
      <div class="cart-line animate-in" data-id="${line.id}" style="animation-delay: ${index * 0.05}s">
        <div class="cart-line-info">
          <span class="cart-line-name">${escapeHtml(line.name)}</span>
          <span class="cart-line-price">${formatLKR(line.price * line.qty)}</span>
        </div>
        <div class="cart-line-qty">
          <button type="button" class="qty-btn" data-action="dec" data-id="${line.id}">−</button>
          <span>${line.qty}</span>
          <button type="button" class="qty-btn" data-action="inc" data-id="${line.id}">+</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.action === 'inc' ? 1 : -1;
        Cart.updateQty(btn.dataset.id, delta);
        this.renderCart(true);
      });
    });

    const total = Cart.getTotal();
    const itemCount = Cart.items.reduce((sum, line) => sum + line.qty, 0);

    totalEl.textContent = formatLKR(total);
    if (animateTotal) {
      totalEl.classList.remove('total-bump');
      void totalEl.offsetWidth;
      totalEl.classList.add('total-bump');
    }

    if (mobileBar) {
      const wasHidden = mobileBar.hidden;
      mobileBar.hidden = false;
      if (wasHidden) {
        mobileBar.classList.remove('bar-enter');
        void mobileBar.offsetWidth;
        mobileBar.classList.add('bar-enter');
      }
      mobileCount.textContent = itemCount === 1 ? '1 item' : itemCount + ' items';
      mobileTotal.textContent = formatLKR(total);
    }
  },

  bindMobileCartBar() {
    const btn = document.getElementById('btn-mobile-cart-scroll');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const cartPanel = document.getElementById('cart-panel');
      if (cartPanel) {
        cartPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  },

  bindCartActions() {
    document.getElementById('btn-clear-cart').addEventListener('click', () => {
      if (Cart.isEmpty()) return;
      if (confirm('Clear all items from cart?')) {
        Cart.clear();
        this.renderCart();
      }
    });

    document.getElementById('btn-print-bill').addEventListener('click', () => {
      if (Cart.isEmpty()) {
        alert('Cart is empty. Add items before printing.');
        return;
      }
      this.printBill();
    });

    document.getElementById('btn-pay-now').addEventListener('click', () => {
      if (Cart.isEmpty()) {
        alert('Cart is empty. Add items before paying.');
        return;
      }
      this.openPayModal();
    });
  },

  printBill() {
    const settings = Storage.getSettings();
    const now = new Date();

    document.getElementById('print-restaurant-name').textContent = settings.name;
    document.getElementById('print-date').textContent =
      now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const tbody = document.getElementById('print-items-body');
    tbody.innerHTML = Cart.getSnapshot().map(line => `
      <tr>
        <td>${escapeHtml(line.name)}</td>
        <td>${line.qty}</td>
        <td>${formatLKR(line.price)}</td>
        <td>${formatLKR(line.subtotal)}</td>
      </tr>
    `).join('');

    document.getElementById('print-total').textContent = formatLKR(Cart.getTotal());
    window.print();
  },

  openPayModal() {
    const settings = Storage.getSettings();
    const total = Cart.getTotal();
    const modal = document.getElementById('pay-modal');
    const summary = document.getElementById('pay-modal-summary');

    if (!settings.paymentId) {
      alert('Please set a Payment ID in Admin → Payment Settings first.');
      return;
    }

    summary.innerHTML = Cart.getSnapshot().map(line =>
      `<div class="pay-line"><span>${escapeHtml(line.name)} x${line.qty}</span><span>${formatLKR(line.subtotal)}</span></div>`
    ).join('') + `<div class="pay-line pay-total"><span>Total</span><span>${formatLKR(total)}</span></div>`;

    document.getElementById('pay-modal-note').textContent = settings.paymentNote;

    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = '';
    qrContainer.classList.remove('qr-pulse');
    const payload = `Pay Rs. ${total.toFixed(2)} to ${settings.paymentId} - ${settings.name}`;

    if (typeof QRCode !== 'undefined') {
      this.qrInstance = new QRCode(qrContainer, {
        text: payload,
        width: 200,
        height: 200,
        colorDark: '#165747',
        colorLight: '#fffcf7',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      qrContainer.textContent = payload;
    }

    qrContainer.classList.add('qr-pulse');

    modal.hidden = false;
    modal.classList.remove('modal-open');
    void modal.offsetWidth;
    modal.classList.add('modal-open');
  },

  closePayModal() {
    const modal = document.getElementById('pay-modal');
    const qrContainer = document.getElementById('qr-code');
    modal.classList.remove('modal-open');
    modal.hidden = true;
    qrContainer.innerHTML = '';
    qrContainer.classList.remove('qr-pulse');
    this.qrInstance = null;
  },

  confirmPayment() {
    const sale = {
      id: generateId(),
      dateISO: new Date().toISOString(),
      items: Cart.getSnapshot(),
      total: Cart.getTotal()
    };

    Storage.addSale(sale);
    Cart.clear();
    this.renderCart();
    this.closePayModal();
    alert('Payment recorded. Thank you!');
  },

  bindPayModal() {
    document.getElementById('pay-modal-close').addEventListener('click', () => this.closePayModal());
    document.getElementById('btn-cancel-payment').addEventListener('click', () => this.closePayModal());
    document.getElementById('btn-confirm-payment').addEventListener('click', () => this.confirmPayment());

    document.getElementById('pay-modal').addEventListener('click', (e) => {
      if (e.target.id === 'pay-modal') this.closePayModal();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
