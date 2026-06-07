const Reports = {
  getSalesForMonth(year, month) {
    const sales = Storage.getSales();
    return sales.filter(sale => {
      const date = new Date(sale.dateISO);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });
  },

  buildSummary(sales) {
    const totalOrders = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const itemBreakdown = {};

    sales.forEach(sale => {
      sale.items.forEach(line => {
        if (!itemBreakdown[line.name]) {
          itemBreakdown[line.name] = { qty: 0, revenue: 0 };
        }
        itemBreakdown[line.name].qty += line.qty;
        itemBreakdown[line.name].revenue += line.subtotal;
      });
    });

    return { totalOrders, totalRevenue, itemBreakdown };
  },

  renderSummary(container, summary) {
    const breakdownRows = Object.entries(summary.itemBreakdown)
      .map(([name, data]) =>
        `<tr><td>${escapeHtml(name)}</td><td>${data.qty}</td><td>${formatLKR(data.revenue)}</td></tr>`
      )
      .join('');

    container.innerHTML = `
      <div class="summary-cards">
        <div class="summary-card animate-in" style="animation-delay: 0.05s">
          <span class="summary-label">Total Orders</span>
          <span class="summary-value">${summary.totalOrders}</span>
        </div>
        <div class="summary-card animate-in" style="animation-delay: 0.15s">
          <span class="summary-label">Total Revenue</span>
          <span class="summary-value">${formatLKR(summary.totalRevenue)}</span>
        </div>
      </div>
      ${breakdownRows ? `
        <h3>Item Breakdown</h3>
        <table class="admin-table">
          <thead><tr><th>Item</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
          <tbody>${breakdownRows}</tbody>
        </table>
      ` : '<p class="empty-msg">No sales for this month.</p>'}
    `;
  },

  renderTable(tbody, sales) {
    if (!sales.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">No sales recorded for this month.</td></tr>';
      return;
    }

    tbody.innerHTML = sales
      .slice()
      .sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO))
      .map((sale, index) => {
        const date = new Date(sale.dateISO);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const itemsStr = sale.items.map(l => `${l.name} x${l.qty}`).join(', ');
        return `<tr class="animate-in" style="animation-delay: ${index * 0.04}s">
          <td>${escapeHtml(dateStr)}</td>
          <td>${escapeHtml(itemsStr)}</td>
          <td>${formatLKR(sale.total)}</td>
        </tr>`;
      })
      .join('');
  }
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
