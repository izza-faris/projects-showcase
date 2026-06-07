const Admin = {
  editingId: null,

  init(onMenuChange) {
    this.onMenuChange = onMenuChange;
    this.bindAdminTabs();
    this.bindMenuForm();
    this.bindPaymentForm();
    this.bindReports();
    this.renderMenuTable();
    this.loadPaymentSettings();
  },

  bindAdminTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('admin-' + tab.dataset.admin).classList.add('active');
      });
    });
  },

  bindMenuForm() {
    const form = document.getElementById('menu-form');
    const cancelBtn = document.getElementById('menu-cancel-btn');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('menu-name').value,
        price: document.getElementById('menu-price').value,
        image: document.getElementById('menu-image').value,
        active: document.getElementById('menu-active').checked
      };

      if (this.editingId) {
        Menu.update(this.editingId, data);
      } else {
        Menu.create(data);
      }

      this.resetMenuForm();
      this.renderMenuTable();
      this.onMenuChange();
    });

    cancelBtn.addEventListener('click', () => this.resetMenuForm());
  },

  resetMenuForm() {
    this.editingId = null;
    document.getElementById('menu-form').reset();
    document.getElementById('menu-item-id').value = '';
    document.getElementById('menu-active').checked = true;
    document.getElementById('menu-submit-btn').textContent = 'Add Item';
    document.getElementById('menu-cancel-btn').hidden = true;
  },

  renderMenuTable() {
    const tbody = document.getElementById('menu-table-body');
    const items = Menu.getAll();

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No menu items yet.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map((item, index) => `
      <tr class="animate-in" style="animation-delay: ${index * 0.05}s">
        <td><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="table-thumb" onerror="this.src='images/placeholder.svg'"></td>
        <td>${escapeHtml(item.name)}</td>
        <td>${formatLKR(item.price)}</td>
        <td>${item.active ? 'Yes' : 'No'}</td>
        <td class="table-actions">
          <button type="button" class="btn btn-sm btn-secondary" data-edit="${item.id}">Edit</button>
          <button type="button" class="btn btn-sm btn-danger" data-delete="${item.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => this.startEdit(btn.dataset.edit));
    });

    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this menu item?')) {
          Menu.delete(btn.dataset.delete);
          this.renderMenuTable();
          this.onMenuChange();
        }
      });
    });
  },

  startEdit(id) {
    const item = Menu.getById(id);
    if (!item) return;

    this.editingId = id;
    document.getElementById('menu-item-id').value = id;
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-image').value = item.image;
    document.getElementById('menu-active').checked = item.active;
    document.getElementById('menu-submit-btn').textContent = 'Update Item';
    document.getElementById('menu-cancel-btn').hidden = false;
    document.getElementById('menu-name').focus();
  },

  bindPaymentForm() {
    document.getElementById('payment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const settings = {
        name: document.getElementById('setting-restaurant-name').value.trim(),
        paymentId: document.getElementById('setting-payment-id').value.trim(),
        paymentNote: document.getElementById('setting-payment-note').value.trim() || 'Scan to pay'
      };
      Storage.saveSettings(settings);
      this.onMenuChange();
      alert('Payment settings saved.');
    });
  },

  loadPaymentSettings() {
    const settings = Storage.getSettings();
    document.getElementById('setting-restaurant-name').value = settings.name;
    document.getElementById('setting-payment-id').value = settings.paymentId;
    document.getElementById('setting-payment-note').value = settings.paymentNote;
  },

  bindReports() {
    const monthInput = document.getElementById('report-month');
    const now = new Date();
    monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    document.getElementById('btn-generate-report').addEventListener('click', () => {
      this.generateReport();
    });

    this.generateReport();
  },

  generateReport() {
    const monthVal = document.getElementById('report-month').value;
    if (!monthVal) return;

    const [year, month] = monthVal.split('-').map(Number);
    const sales = Reports.getSalesForMonth(year, month);
    const summary = Reports.buildSummary(sales);

    Reports.renderSummary(document.getElementById('report-summary'), summary);
    Reports.renderTable(document.getElementById('report-table-body'), sales);
  }
};
