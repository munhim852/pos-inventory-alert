(function initOwnerDashboard(root) {
  const demoDailySales = [
    { menu_item_id: 'hakata_black_garlic', menu_item: '博多黑蒜拉麵', bowls_sold: 18 },
    { menu_item_id: 'akaoni_king', menu_item: '赤鬼王拉麵', bowls_sold: 14 },
    { menu_item_id: 'hakata_shio_tonkotsu', menu_item: '博多鹽味豚骨拉麺', bowls_sold: 12 },
    { menu_item_id: 'hakata_miso_butter', menu_item: '博多味噌牛油拉麵', bowls_sold: 9 },
    { menu_item_id: 'kagoshima_kurobuta_cartilage', menu_item: '鹿兒島黑豚王軟骨拉麵', bowls_sold: 7 },
    { menu_item_id: 'hakata_red_miso', menu_item: '博多赤味噌拉麺', bowls_sold: 6 }
  ];

  function bestSellingMenuItem(sales = demoDailySales) {
    return [...sales].sort((a, b) => b.bowls_sold - a.bowls_sold)[0] ?? null;
  }

  function ingredientCoverage(menuAvailability = []) {
    return [...menuAvailability]
      .map((item) => ({
        menu_item_id: item.menu_item_id,
        menu_item: item.menu_item,
        available_bowls: item.available_bowls,
        limiting_ingredient: item.limiting_ingredient,
        limiting_ingredient_name: item.limiting_ingredient_name,
        message: `${item.menu_item} 最多可賣 ${item.available_bowls} 碗，限制食材是 ${item.limiting_ingredient_name}。`
      }))
      .sort((a, b) => a.available_bowls - b.available_bowls);
  }

  function stockoutRisks(inventory = []) {
    return [...inventory]
      .filter((item) => item.days_coverage !== null && item.days_coverage < 3)
      .sort((a, b) => a.days_coverage - b.days_coverage)
      .map((item) => ({
        item: item.item,
        display_name: item.display_name,
        days_coverage: item.days_coverage,
        message: item.days_coverage < 1
          ? `${item.display_name} 預計今晚可能用完。`
          : `${item.display_name} 預計 ${Math.ceil(item.days_coverage)} 日內可能用完。`
      }));
  }

  function reorderRecommendations(inventory = []) {
    return inventory
      .filter((item) => item.days_coverage !== null && item.days_coverage < 2)
      .map((item) => ({
        item: item.item,
        display_name: item.display_name,
        suggested_reorder_qty: item.suggested_reorder_qty,
        unit: item.unit,
        message: `建議今日補 ${item.display_name}：${item.suggested_reorder_qty} ${item.unit}。`
      }));
  }

  function promotionRecommendations(inventory = [], menuAvailability = []) {
    const overstocked = inventory.filter((item) => item.days_coverage !== null && item.days_coverage >= 7);

    return overstocked.flatMap((ingredient) =>
      menuAvailability
        .filter((menu) => menu.available_bowls > 0)
        .filter((menu) => menu.ingredient_capacity?.some((item) => item.item === ingredient.item))
        .slice(0, 1)
        .map((menu) => ({
          ingredient: ingredient.item,
          display_name: ingredient.display_name,
          menu_item: menu.menu_item,
          message: `建議推廣 ${menu.menu_item}，因為 ${ingredient.display_name} 庫存充足。`
        }))
    ).slice(0, 4);
  }

  function decisionMessages({ inventory = [], menuAvailability = [], sales = demoDailySales }) {
    const bestSeller = bestSellingMenuItem(sales);
    const coverage = ingredientCoverage(menuAvailability);
    const risks = stockoutRisks(inventory);
    const reorders = reorderRecommendations(inventory);
    const promotions = promotionRecommendations(inventory, menuAvailability);
    const tightestMenu = coverage[0] ?? null;
    const todayDecision = reorders[0]?.message
      ?? promotions[0]?.message
      ?? (bestSeller ? `今日可以主力推 ${bestSeller.menu_item}，因為今日已售出 ${bestSeller.bowls_sold} 碗。` : '今日未有足夠銷售資料，先留意庫存風險。');

    return {
      best_seller: bestSeller,
      coverage,
      risks,
      reorders,
      promotions,
      today_focus: {
        stock_risk: risks[0]?.message ?? '未見 3 日內即時缺貨風險。',
        reorder: reorders[0]?.message ?? '今日未有緊急補貨項目。',
        bestseller: bestSeller ? `今日最好賣：${bestSeller.menu_item}，已售出 ${bestSeller.bowls_sold} 碗。` : '今日暫未有銷售資料。',
        ingredient_coverage: tightestMenu ? tightestMenu.message : '暫未有食材可支撐銷售量資料。',
        decision: todayDecision
      },
      chart_data: {
        top_sales: [...sales].sort((a, b) => b.bowls_sold - a.bowls_sold).slice(0, 5),
        menu_capacity: coverage.slice(0, 6),
        low_stock_risks: risks.slice(0, 5)
      }
    };
  }

  const api = {
    demoDailySales,
    bestSellingMenuItem,
    ingredientCoverage,
    stockoutRisks,
    reorderRecommendations,
    promotionRecommendations,
    decisionMessages
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.OwnerDashboard = api;
})(typeof window !== 'undefined' ? window : globalThis);
