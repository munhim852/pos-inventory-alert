const form = document.querySelector('#orderForm');
const menuItem = document.querySelector('#menuItem');
const quantity = document.querySelector('#quantity');
const submitButton = document.querySelector('#submitButton');
const resultTitle = document.querySelector('#resultTitle');
const statusBadge = document.querySelector('#statusBadge');
const summary = document.querySelector('#summary');
const updatesBody = document.querySelector('#updatesBody');
const rawJson = document.querySelector('#rawJson');

function setStatus(label, state) {
  statusBadge.textContent = label;
  statusBadge.className = `badge ${state}`;
}

function renderUpdates(updates = []) {
  if (!updates.length) {
    updatesBody.innerHTML = '<tr><td colspan="6" class="empty">No inventory rows returned</td></tr>';
    return;
  }

  updatesBody.innerHTML = updates.map((update) => {
    const status = update.low_stock ? 'Low stock' : 'OK';
    const statusClass = update.low_stock ? 'low' : 'ok';

    return `
      <tr>
        <td>${update.item}</td>
        <td>${update.qty_sold}</td>
        <td>${update.previous_stock}</td>
        <td>${update.remaining_stock}</td>
        <td>${update.reorder_level}</td>
        <td><span class="stock ${statusClass}">${status}</span></td>
      </tr>
    `;
  }).join('');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const qty = Number(quantity.value);

  if (!Number.isInteger(qty) || qty <= 0) {
    setStatus('Invalid', 'error');
    summary.textContent = 'Quantity must be a positive whole number.';
    return;
  }

  submitButton.disabled = true;
  setStatus('Sending', 'loading');
  resultTitle.textContent = 'Submitting order...';
  summary.textContent = 'Calling the Azure Function and updating cloud inventory.';

  try {
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_item_id: menuItem.value,
        qty_ordered: qty
      })
    });

    const result = await response.json();
    rawJson.textContent = JSON.stringify(result, null, 2);

    if (!response.ok || result.status !== 'ok') {
      throw new Error(result.message || 'Order failed.');
    }

    resultTitle.textContent = `${result.menu_item} x ${result.qty_ordered}`;
    summary.textContent = `Total $${result.total.toFixed(2)}. Updated ${result.inventory_updates.length} inventory rows.`;
    setStatus(result.low_stock_items.length ? 'Low stock' : 'Success', result.low_stock_items.length ? 'warning' : 'success');
    renderUpdates(result.inventory_updates);
  } catch (error) {
    resultTitle.textContent = 'Order failed';
    summary.textContent = error.message;
    setStatus('Error', 'error');
    renderUpdates([]);
  } finally {
    submitButton.disabled = false;
  }
});
