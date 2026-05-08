const menuRecipes = {
  hakata_shio_tonkotsu: {
    name: '博多鹽味豚骨拉麺',
    price: 17.99,
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
    price: 18.49,
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
    price: 17.99,
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
    price: 18.49,
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
    price: 19.99,
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
    price: 18.99,
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
const portionPreset = document.querySelector('#portionPreset');
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
const profitBody = document.querySelector('#profitBody');
const todayDecision = document.querySelector('#todayDecision');
const stockoutAnswer = document.querySelector('#stockoutAnswer');
const reorderAnswer = document.querySelector('#reorderAnswer');
const tonightPromotionAnswer = document.querySelector('#tonightPromotionAnswer');
const bestSellerAnswer = document.querySelector('#bestSellerAnswer');
const riskAnswer = document.querySelector('#riskAnswer');
const promotionTitle = document.querySelector('#promotionTitle');
const promotionReasons = document.querySelector('#promotionReasons');
const salesChart = document.querySelector('#salesChart');
const capacityChart = document.querySelector('#capacityChart');
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

function statusLabel(isLowStock) {
  return isLowStock ? '需要補貨' : '庫存正常';
}

function unitLabel(unit) {
  const labels = {
    L: 'L',
    slice: '片',
    piece: '隻',
    pack: '包',
    portion: '份',
    unit: '單位'
  };

  return labels[unit] ?? unit;
}

function ingredientName(id) {
  return ingredientLabels[id] ? `${ingredientLabels[id]} (${id})` : id;
}

function renderUsageFields() {
  const recipe = menuRecipes[menuItem.value];
  const ingredientUsage = PortionPresets.applyPortionPreset(recipe.ingredients, portionPreset.value);

  usageFields.innerHTML = Object.entries(ingredientUsage).map(([ingredient, qty]) => {
    const allowedValues = PortionPresets.allowedPortionsFor(ingredient);

    return `
    <label class="usage-field">
      <span>${ingredientName(ingredient)} / 每碗</span>
      <select data-ingredient="${ingredient}">
        ${allowedValues.map((value) => `<option value="${value}"${value === qty ? ' selected' : ''}>${value}</option>`).join('')}
      </select>
      <small data-total="${ingredient}"></small>
    </label>
  `;
  }).join('');

  updateUsageTotals();
}

function updateUsageTotals() {
  const orderQty = Number(quantity.value) || 0;

  for (const input of usageFields.querySelectorAll('[data-ingredient]')) {
    const total = Number(input.value) * orderQty;
    const unit = ingredientUnits[input.dataset.ingredient] ?? 'unit';
    const totalNode = usageFields.querySelector(`[data-total="${input.dataset.ingredient}"]`);

    if (totalNode) {
      totalNode.textContent = `合共 ${Math.round(total * 100) / 100} ${unit}`;
    }
  }
}

function getIngredientOverrides() {
  const overrides = {};

  for (const input of usageFields.querySelectorAll('[data-ingredient]')) {
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
    updatesBody.innerHTML = '<tr><td colspan="6" class="empty">沒有庫存更新</td></tr>';
    return;
  }

  updatesBody.innerHTML = updates.map((update) => {
    const status = statusLabel(update.low_stock);
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
      <td><span class="stock low">不夠貨</span></td>
    </tr>
  `).join('');
}

function renderInventory(items = []) {
  if (!items.length) {
    inventoryBody.innerHTML = '<tr><td colspan="7" class="empty">沒有庫存資料</td></tr>';
    return;
  }

  inventoryBody.innerHTML = items.map((item) => {
    const status = statusLabel(item.low_stock);
    const statusClass = item.low_stock ? 'low' : 'ok';
    const suggestion = item.reorder_suggestion
      ? `建議補 ${item.reorder_suggestion.suggested_reorder_qty} ${unitLabel(item.unit)}`
      : '暫不需要補貨';
    const coverage = item.days_coverage === null ? '-' : `${item.days_coverage} 日`;

    return `
      <tr>
        <td>${ingredientName(item.item)}</td>
        <td>${item.stock}</td>
        <td>${unitLabel(item.unit)}</td>
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
    capacityBody.innerHTML = '<tr><td colspan="4" class="empty">沒有可支撐銷售量資料</td></tr>';
    return;
  }

  capacityBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.menu_item}</td>
      <td>${item.available_bowls} 碗</td>
      <td>${ingredientName(item.limiting_ingredient)}</td>
      <td>${item.stockout_risk}</td>
    </tr>
  `).join('');
}

function renderOwnerDecision(decision) {
  if (!decision?.today_focus) {
    todayDecision.textContent = '未有決策建議';
    stockoutAnswer.textContent = '-';
    reorderAnswer.textContent = '-';
    tonightPromotionAnswer.textContent = '-';
    bestSellerAnswer.textContent = '-';
    riskAnswer.textContent = '-';
    return;
  }

  todayDecision.textContent = decision.today_focus.decision;
  stockoutAnswer.textContent = decision.today_focus.stock_risk;
  reorderAnswer.textContent = decision.today_focus.reorder;
  tonightPromotionAnswer.textContent = decision.today_focus.tonight_promotion;
  bestSellerAnswer.textContent = decision.today_focus.bestseller;
  riskAnswer.textContent = decision.today_focus.ingredient_coverage;
}

function renderPromotionCard(promotion) {
  if (!promotion) {
    promotionTitle.textContent = '未有推薦';
    promotionReasons.innerHTML = '<li>暫時未有足夠資料。</li>';
    return;
  }

  promotionTitle.textContent = promotion.title;
  promotionReasons.innerHTML = promotion.reasons.map((reason) => `<li>${reason}</li>`).join('');
}

function renderProfitability(items = []) {
  if (!items.length) {
    profitBody.innerHTML = '<tr><td colspan="6" class="empty">沒有毛利資料</td></tr>';
    return;
  }

  profitBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.menu_item}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>$${item.ingredient_cost.toFixed(2)}</td>
      <td>$${item.profit_per_bowl.toFixed(2)}</td>
      <td>${item.gross_margin_percent}%</td>
      <td>$${item.profit_potential.toFixed(2)}</td>
    </tr>
  `).join('');
}

function renderBarList(container, items, valueKey, labelKey, suffix = '') {
  if (!items.length) {
    container.innerHTML = '<div class="empty">沒有資料</div>';
    return;
  }

  const maxValue = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);

  container.innerHTML = items.map((item) => {
    const value = Number(item[valueKey]) || 0;
    const width = Math.max((value / maxValue) * 100, 4);

    return `
      <div class="bar-row">
        <div class="bar-label">
          <span>${item[labelKey]}</span>
          <strong>${value}${suffix}</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
      </div>
    `;
  }).join('');
}

async function loadInventory() {
  refreshInventory.disabled = true;
  dashboardSummary.textContent = '正在載入庫存資料...';

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

    const ownerView = OwnerDashboard.decisionMessages({
      inventory: result.inventory,
      menuAvailability: result.menu_availability,
      menuProfitability: result.owner_decision?.menu_profitability ?? []
    });

    renderInventory(result.inventory);
    renderMenuCapacity(ownerView.coverage);
    renderOwnerDecision(ownerView);
    renderPromotionCard(ownerView.tonight_promotion);
    renderProfitability(ownerView.profit);
    const lowStockCount = result.inventory.filter((item) => item.low_stock).length;
    const tightest = ownerView.coverage[0];
    const tightestText = tightest ? `最緊張餐點：${tightest.menu_item}，最多可賣 ${tightest.available_bowls} 碗。` : '暫未有餐點 coverage 資料。';
    const promotionText = ownerView.tonight_promotion ? `今晚建議主推：${ownerView.tonight_promotion.menu_item}。` : '';
    dashboardSummary.textContent = `已載入 ${result.inventory.length} 個食材。${lowStockCount} 個需要補貨。${tightestText}${promotionText}`;
    renderBarList(salesChart, ownerView.chart_data.top_sales, 'bowls_sold', 'menu_item', ' 碗');
    renderBarList(capacityChart, ownerView.chart_data.menu_capacity, 'available_bowls', 'menu_item', ' 碗');
  } catch (error) {
    dashboardSummary.textContent = error.message;
    renderInventory([]);
    renderMenuCapacity([]);
    renderOwnerDecision(null);
    renderPromotionCard(null);
    renderProfitability([]);
    renderBarList(salesChart, [], 'bowls_sold', 'menu_item');
    renderBarList(capacityChart, [], 'available_bowls', 'menu_item');
  } finally {
    refreshInventory.disabled = false;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const qty = Number(quantity.value);

  if (!Number.isInteger(qty) || qty <= 0) {
    setStatus('輸入錯誤', 'error');
    summary.textContent = '售出碗數必須是正整數。';
    return;
  }

  submitButton.disabled = true;
  setStatus('提交中', 'loading');
  resultTitle.textContent = '正在提交訂單...';
  summary.textContent = '正在更新雲端庫存。';

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
        resultTitle.textContent = '訂單已阻止';
        summary.textContent = '有食材不夠，系統沒有扣減任何庫存。';
        setStatus('不夠貨', 'error');
        renderShortages(result.shortages);
      }

      throw new Error(result.message || 'Order failed.');
    }

    resultTitle.textContent = `${result.menu_item} x ${result.qty_ordered}`;
    summary.textContent = `總額 $${result.total.toFixed(2)}。已更新 ${result.inventory_updates.length} 個食材庫存。`;
    setStatus(result.low_stock_items.length ? '需要補貨' : '成功', result.low_stock_items.length ? 'warning' : 'success');
    renderUpdates(result.inventory_updates);
    loadInventory();
  } catch (error) {
    if (!summary.textContent || summary.textContent === 'Calling the Azure Function and updating cloud inventory.') {
      resultTitle.textContent = '訂單失敗';
      summary.textContent = error.message;
      setStatus('錯誤', 'error');
      renderUpdates([]);
    }
  } finally {
    submitButton.disabled = false;
  }
});

restockForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const qty = Number(restockQuantity.value);

  if (!Number.isFinite(qty) || qty <= 0) {
    restockSummary.textContent = '補貨數量必須是正數。';
    return;
  }

  restockButton.disabled = true;
  restockSummary.textContent = '正在提交補貨...';

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

    resultTitle.textContent = `已補貨：${ingredientName(result.item)}`;
    summary.textContent = `新增 ${result.qty_restock} ${unitLabel(result.unit)}。庫存由 ${result.previous_stock} 變成 ${result.remaining_stock}。`;
    restockSummary.textContent = `已補 ${ingredientName(result.item)}：${result.previous_stock} -> ${result.remaining_stock}`;
    setStatus('已補貨', 'success');
    renderUpdates([result]);
    loadInventory();
  } catch (error) {
    restockSummary.textContent = error.message;
  } finally {
    restockButton.disabled = false;
  }
});

menuItem.addEventListener('change', renderUsageFields);
portionPreset.addEventListener('change', renderUsageFields);
quantity.addEventListener('input', updateUsageTotals);
usageFields.addEventListener('input', updateUsageTotals);
usageFields.addEventListener('change', updateUsageTotals);
refreshInventory.addEventListener('click', loadInventory);
renderUsageFields();
renderRestockOptions();
loadInventory();
