const menuRecipes = {
  hakata_shio_tonkotsu: {
    name: '博多鹽味豚骨拉麺',
    ingredients: {
      tonkotsu_broth: 0.35,
      ramen_noodle: 1,
      pork_chashu: 2,
      ajitama_egg: 0.5,
      corn: 1,
      kombu: 1,
      narutomaki: 1
    }
  },
  hakata_black_garlic: {
    name: '博多黑蒜拉麵',
    ingredients: {
      tonkotsu_broth: 0.35,
      ramen_noodle: 1,
      black_garlic_sauce: 1,
      pork_chashu: 2,
      ajitama_egg: 0.5,
      corn: 1,
      kombu: 1,
      narutomaki: 1
    }
  },
  hakata_red_miso: {
    name: '博多赤味噌拉麺',
    ingredients: {
      miso_broth: 0.35,
      ramen_noodle: 1,
      pork_chashu: 2,
      ajitama_egg: 0.5,
      corn: 1,
      kombu: 1,
      narutomaki: 1
    }
  },
  hakata_miso_butter: {
    name: '博多味噌牛油拉麵',
    ingredients: {
      miso_broth: 0.35,
      ramen_noodle: 1,
      butter: 1,
      pork_chashu: 2,
      ajitama_egg: 0.5,
      corn: 1,
      kombu: 1,
      narutomaki: 1
    }
  },
  kagoshima_kurobuta_cartilage: {
    name: '鹿兒島黑豚王軟骨拉麵',
    ingredients: {
      tonkotsu_broth: 0.35,
      ramen_noodle: 1,
      pork_cartilage: 1,
      ajitama_egg: 0.5,
      corn: 1,
      kombu: 1,
      narutomaki: 1
    }
  },
  akaoni_king: {
    name: '赤鬼王拉麵',
    ingredients: {
      spicy_tonkotsu_broth: 0.35,
      ramen_noodle: 1,
      minced_pork: 1,
      bean_sprouts: 1,
      onsen_egg: 1,
      corn: 1,
      kombu: 1,
      narutomaki: 1
    }
  }
};

const ingredientLabels = {
  tonkotsu_broth: '豚骨湯底',
  spicy_tonkotsu_broth: '辣豚骨湯底',
  miso_broth: '味噌湯底',
  black_garlic_sauce: '黑蒜醬',
  pork_chashu: '黑豚叉燒',
  pork_cartilage: '豬肉軟骨',
  minced_pork: '炒豬肉碎',
  ajitama_egg: '溏心蛋',
  onsen_egg: '溫泉蛋',
  ramen_noodle: '拉麵',
  corn: '玉米',
  kombu: '昆布',
  narutomaki: '魚板',
  butter: '牛油',
  bean_sprouts: '豆芽'
};

const form = document.querySelector('#orderForm');
const restockForm = document.querySelector('#restockForm');
const menuItem = document.querySelector('#menuItem');
const quantity = document.querySelector('#quantity');
const submitButton = document.querySelector('#submitButton');
const resultTitle = document.querySelector('#resultTitle');
const statusBadge = document.querySelector('#statusBadge');
const summary = document.querySelector('#summary');
const updatesBody = document.querySelector('#updatesBody');
const rawJson = document.querySelector('#rawJson');
const usageFields = document.querySelector('#usageFields');
const restockItem = document.querySelector('#restockItem');
const restockQuantity = document.querySelector('#restockQuantity');
const restockButton = document.querySelector('#restockButton');
const restockSummary = document.querySelector('#restockSummary');
const refreshInventory = document.querySelector('#refreshInventory');
const inventoryBody = document.querySelector('#inventoryBody');
const dashboardSummary = document.querySelector('#dashboardSummary');
const capacityBody = document.querySelector('#capacityBody');
const ingredientUnits = {
  tonkotsu_broth: 'L',
  spicy_tonkotsu_broth: 'L',
  miso_broth: 'L',
  black_garlic_sauce: 'portion',
  pork_chashu: 'slice',
  pork_cartilage: 'portion',
  minced_pork: 'portion',
  ajitama_egg: 'piece',
  onsen_egg: 'piece',
  ramen_noodle: 'pack',
  corn: 'portion',
  kombu: 'portion',
  narutomaki: 'slice',
  butter: 'portion',
  bean_sprouts: 'portion'
};

function setStatus(label, state) {
  statusBadge.textContent = label;
  statusBadge.className = `badge ${state}`;
}

function ingredientName(id) {
  return ingredientLabels[id] ? `${ingredientLabels[id]} (${id})` : id;
}

function renderUsageFields() {
  const recipe = menuRecipes[menuItem.value];

  usageFields.innerHTML = Object.entries(recipe.ingredients).map(([ingredient, qty]) => `
    <label class="usage-field">
      <span>${ingredientName(ingredient)} / bowl</span>
      <input data-ingredient="${ingredient}" type="number" min="0" step="0.05" value="${qty}">
      <small data-total="${ingredient}"></small>
    </label>
  `).join('');

  updateUsageTotals();
}

function updateUsageTotals() {
  const orderQty = Number(quantity.value) || 0;

  for (const input of usageFields.querySelectorAll('input[data-ingredient]')) {
    const total = Number(input.value) * orderQty;
    const unit = ingredientUnits[input.dataset.ingredient] ?? 'unit';
    const totalNode = usageFields.querySelector(`[data-total="${input.dataset.ingredient}"]`);

    if (totalNode) {
      totalNode.textContent = `total ${Math.round(total * 100) / 100} ${unit}`;
    }
  }
}

function getIngredientOverrides() {
  const overrides = {};

  for (const input of usageFields.querySelectorAll('input[data-ingredient]')) {
    const qty = Number(input.value);

    if (!Number.isFinite(qty) || qty < 0) {
      throw new Error('Ingredient usage must be zero or higher.');
    }

    overrides[input.dataset.ingredient] = qty;
  }

  return overrides;
}

function renderRestockOptions() {
  const options = Object.entries(ingredientLabels)
    .map(([id, label]) => `<option value="${id}">${label} (${id})</option>`)
    .join('');

  restockItem.innerHTML = options;
}

function renderUpdates(updates = []) {
  if (!updates.length) {
    updatesBody.innerHTML = '<tr><td colspan="6" class="empty">No inventory rows returned</td></tr>';
    return;
  }

  updatesBody.innerHTML = updates.map((update) => {
    const status = update.low_stock ? 'Low stock' : 'OK';
    const statusClass = update.low_stock ? 'low' : 'ok';
    const qty = update.qty_sold ?? update.qty_restock;

    return `
      <tr>
        <td>${ingredientName(update.item)}</td>
        <td>${qty}</td>
        <td>${update.previous_stock}</td>
        <td>${update.remaining_stock}</td>
        <td>${update.reorder_level}</td>
        <td><span class="stock ${statusClass}">${status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderShortages(shortages = []) {
  if (!shortages.length) {
    renderUpdates([]);
    return;
  }

  updatesBody.innerHTML = shortages.map((shortage) => `
    <tr>
      <td>${ingredientName(shortage.item)}</td>
      <td>${shortage.required}</td>
      <td>${shortage.available}</td>
      <td>${shortage.available}</td>
      <td>${shortage.reorder_level}</td>
      <td><span class="stock low">Not enough</span></td>
    </tr>
  `).join('');
}

function renderInventory(items = []) {
  if (!items.length) {
    inventoryBody.innerHTML = '<tr><td colspan="7" class="empty">No inventory rows returned</td></tr>';
    return;
  }

  inventoryBody.innerHTML = items.map((item) => {
    const status = item.low_stock ? 'Low stock' : 'OK';
    const statusClass = item.low_stock ? 'low' : 'ok';
    const suggestion = item.reorder_suggestion
      ? `Order ${item.reorder_suggestion.suggested_reorder_qty} ${item.unit}`
      : '-';
    const coverage = item.days_coverage === null ? '-' : `${item.days_coverage} days`;

    return `
      <tr>
        <td>${ingredientName(item.item)}</td>
        <td>${item.stock}</td>
        <td>${item.unit}</td>
        <td>${item.reorder_level}</td>
        <td>${coverage}</td>
        <td>${suggestion}</td>
        <td><span class="stock ${statusClass}">${status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderMenuCapacity(items = []) {
  if (!items.length) {
    capacityBody.innerHTML = '<tr><td colspan="3" class="empty">No capacity rows returned</td></tr>';
    return;
  }

  capacityBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.menu_item}</td>
      <td>${item.available_bowls} bowls</td>
      <td>${ingredientName(item.limiting_ingredient)}</td>
    </tr>
  `).join('');
}

async function loadInventory() {
  refreshInventory.disabled = true;
  dashboardSummary.textContent = 'Loading current inventory...';

  try {
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'inventory' })
    });
    const result = await response.json();

    if (!response.ok || result.status !== 'ok') {
      throw new Error(result.message || 'Unable to load inventory.');
    }

    renderInventory(result.inventory);
    renderMenuCapacity(result.menu_availability);
    const lowStockCount = result.inventory.filter((item) => item.low_stock).length;
    const tightest = result.menu_availability[0];
    dashboardSummary.textContent = `${result.inventory.length} inventory rows loaded. ${lowStockCount} low-stock item(s). Tightest item: ${tightest.menu_item} (${tightest.available_bowls} bowls).`;
  } catch (error) {
    dashboardSummary.textContent = error.message;
    renderInventory([]);
    renderMenuCapacity([]);
  } finally {
    refreshInventory.disabled = false;
  }
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
        qty_ordered: qty,
        ingredient_overrides: getIngredientOverrides()
      })
    });

    const result = await response.json();
    rawJson.textContent = JSON.stringify(result, null, 2);

    if (!response.ok || result.status !== 'ok') {
      if (result.shortages?.length) {
        resultTitle.textContent = 'Order blocked';
        summary.textContent = result.message;
        setStatus('No stock', 'error');
        renderShortages(result.shortages);
      }

      throw new Error(result.message || 'Order failed.');
    }

    resultTitle.textContent = `${result.menu_item} x ${result.qty_ordered}`;
    summary.textContent = `Total $${result.total.toFixed(2)}. Updated ${result.inventory_updates.length} inventory rows.`;
    setStatus(result.low_stock_items.length ? 'Low stock' : 'Success', result.low_stock_items.length ? 'warning' : 'success');
    renderUpdates(result.inventory_updates);
    loadInventory();
  } catch (error) {
    if (!summary.textContent || summary.textContent === 'Calling the Azure Function and updating cloud inventory.') {
      resultTitle.textContent = 'Order failed';
      summary.textContent = error.message;
      setStatus('Error', 'error');
      renderUpdates([]);
    }
  } finally {
    submitButton.disabled = false;
  }
});

restockForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const qty = Number(restockQuantity.value);

  if (!Number.isInteger(qty) || qty <= 0) {
    restockSummary.textContent = 'Restock quantity must be a positive whole number.';
    return;
  }

  restockButton.disabled = true;
  restockSummary.textContent = 'Sending restock update...';

  try {
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'restock',
        item: restockItem.value,
        qty_restock: qty
      })
    });

    const result = await response.json();
    rawJson.textContent = JSON.stringify(result, null, 2);

    if (!response.ok || result.status !== 'ok') {
      throw new Error(result.message || 'Restock failed.');
    }

    resultTitle.textContent = `Restocked ${ingredientName(result.item)}`;
    summary.textContent = `Added ${result.qty_restock}. Stock moved from ${result.previous_stock} to ${result.remaining_stock}.`;
    restockSummary.textContent = `Restocked ${ingredientName(result.item)}: ${result.previous_stock} -> ${result.remaining_stock}.`;
    setStatus('Restocked', 'success');
    renderUpdates([result]);
    loadInventory();
  } catch (error) {
    restockSummary.textContent = error.message;
  } finally {
    restockButton.disabled = false;
  }
});

menuItem.addEventListener('change', renderUsageFields);
quantity.addEventListener('input', updateUsageTotals);
usageFields.addEventListener('input', updateUsageTotals);
refreshInventory.addEventListener('click', loadInventory);
renderUsageFields();
renderRestockOptions();
loadInventory();
