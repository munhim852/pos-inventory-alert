(function initOwnerDashboard(root) {
  const demoDailySales = [
    { menu_item_id: 'hakata_black_garlic', menu_item: '博多黑蒜拉麵', bowls_sold: 18 },
    { menu_item_id: 'akaoni_king', menu_item: '赤鬼王拉麵', bowls_sold: 14 },
    { menu_item_id: 'hakata_shio_tonkotsu', menu_item: '博多鹽味豚骨拉麺', bowls_sold: 12 },
    { menu_item_id: 'hakata_miso_butter', menu_item: '博多味噌牛油拉麵', bowls_sold: 9 },
    { menu_item_id: 'kagoshima_kurobuta_cartilage', menu_item: '鹿兒島黑豚王軟骨拉麵', bowls_sold: 7 },
    { menu_item_id: 'hakata_red_miso', menu_item: '博多赤味噌拉麺', bowls_sold: 6 }
  ];

  const defaultMenuFinance = {
    hakata_shio_tonkotsu: { menu_item: '博多鹽味豚骨拉麺', price: 17.99, ingredient_cost: 4.45 },
    hakata_black_garlic: { menu_item: '博多黑蒜拉麵', price: 18.49, ingredient_cost: 4.80 },
    hakata_red_miso: { menu_item: '博多赤味噌拉麺', price: 17.99, ingredient_cost: 4.38 },
    hakata_miso_butter: { menu_item: '博多味噌牛油拉麵', price: 18.49, ingredient_cost: 4.78 },
    kagoshima_kurobuta_cartilage: { menu_item: '鹿兒島黑豚王軟骨拉麵', price: 19.99, ingredient_cost: 4.92 },
    akaoni_king: { menu_item: '赤鬼王拉麵', price: 18.99, ingredient_cost: 4.48 }
  };

  function roundMoney(value) {
    return Math.round(value * 100) / 100;
  }

  function riskLevel(availableBowls) {
    if (availableBowls < 10) {
      return { level: '高', penalty: 45, message: '缺貨風險高' };
    }

    if (availableBowls < 20) {
      return { level: '中', penalty: 18, message: '要留意庫存' };
    }

    return { level: '低', penalty: 0, message: '缺貨風險較低' };
  }

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
        stockout_risk: riskLevel(item.available_bowls).level,
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

  function calculateMenuProfit(item) {
    const price = Number(item.price ?? 0);
    const ingredientCost = Number(item.ingredient_cost ?? 0);
    const profitPerBowl = roundMoney(price - ingredientCost);
    const grossMarginPercent = price > 0 ? roundMoney((profitPerBowl / price) * 100) : 0;

    return {
      price: roundMoney(price),
      ingredient_cost: roundMoney(ingredientCost),
      profit_per_bowl: profitPerBowl,
      gross_margin_percent: grossMarginPercent
    };
  }

  function profitAnalysis(menuAvailability = [], menuProfitability = [], sales = demoDailySales) {
    const coverageById = Object.fromEntries(ingredientCoverage(menuAvailability).map((item) => [item.menu_item_id, item]));
    const backendProfitById = Object.fromEntries(menuProfitability.map((item) => [item.menu_item_id, item]));
    const salesById = Object.fromEntries(sales.map((item) => [item.menu_item_id, item.bowls_sold]));
    const menuIds = new Set([
      ...Object.keys(defaultMenuFinance),
      ...Object.keys(coverageById),
      ...Object.keys(backendProfitById)
    ]);

    return [...menuIds].map((menuItemId) => {
      const financeSource = backendProfitById[menuItemId] ?? defaultMenuFinance[menuItemId] ?? {};
      const coverage = coverageById[menuItemId] ?? {};
      const profit = calculateMenuProfit(financeSource);
      const availableBowls = Number(coverage.available_bowls ?? 0);
      const risk = riskLevel(availableBowls);
      const recentSales = Number(salesById[menuItemId] ?? 0);
      const profitPotential = roundMoney(profit.profit_per_bowl * availableBowls);
      const recommendationScore = roundMoney(
        profit.profit_per_bowl * 3
        + profit.gross_margin_percent * 0.35
        + Math.min(availableBowls, 50) * 0.7
        + recentSales * 0.45
        - risk.penalty
      );

      return {
        menu_item_id: menuItemId,
        menu_item: financeSource.menu_item ?? coverage.menu_item ?? menuItemId,
        price: profit.price,
        ingredient_cost: profit.ingredient_cost,
        profit_per_bowl: profit.profit_per_bowl,
        gross_margin_percent: profit.gross_margin_percent,
        available_bowls: availableBowls,
        limiting_ingredient: coverage.limiting_ingredient,
        limiting_ingredient_name: coverage.limiting_ingredient_name ?? '未有資料',
        stockout_risk: risk.level,
        recent_sales: recentSales,
        profit_potential: profitPotential,
        recommendation_score: recommendationScore
      };
    }).sort((a, b) => b.recommendation_score - a.recommendation_score);
  }

  function bestPromotionTonight(menuAvailability = [], menuProfitability = [], sales = demoDailySales) {
    const analysis = profitAnalysis(menuAvailability, menuProfitability, sales);
    const promotableItems = analysis.filter((item) => item.available_bowls >= 10);
    const best = promotableItems[0] ?? analysis[0] ?? null;

    if (!best) {
      return null;
    }

    const reasons = [
      `每碗預計毛利 $${best.profit_per_bowl.toFixed(2)}`,
      `目前最多可支撐 ${best.available_bowls} 碗`,
      `${best.limiting_ingredient_name} 是限制食材`,
      `缺貨風險：${best.stockout_risk}`,
      best.recent_sales > 0 ? `今日已售出 ${best.recent_sales} 碗，有銷售動力` : '今日未有銷售資料，先用庫存同毛利判斷'
    ];

    return {
      ...best,
      title: `今晚建議主推：${best.menu_item}`,
      reasons,
      message: `建議今晚主推 ${best.menu_item}，因為毛利及可支撐銷售量較理想。`
    };
  }

  function avoidPromotionMessages(coverage = []) {
    return coverage
      .filter((item) => item.available_bowls < 10)
      .slice(0, 3)
      .map((item) => `${item.menu_item} 暫時不要主力推廣，因為 ${item.limiting_ingredient_name} coverage 較低。`);
  }

  function decisionMessages({ inventory = [], menuAvailability = [], menuProfitability = [], sales = demoDailySales }) {
    const bestSeller = bestSellingMenuItem(sales);
    const coverage = ingredientCoverage(menuAvailability);
    const risks = stockoutRisks(inventory);
    const reorders = reorderRecommendations(inventory);
    const promotions = promotionRecommendations(inventory, menuAvailability);
    const profit = profitAnalysis(menuAvailability, menuProfitability, sales);
    const tonightPromotion = bestPromotionTonight(menuAvailability, menuProfitability, sales);
    const avoidPromotions = avoidPromotionMessages(coverage);
    const tightestMenu = coverage[0] ?? null;
    const todayDecision = tonightPromotion?.message
      ?? reorders[0]?.message
      ?? promotions[0]?.message
      ?? (bestSeller ? `今日可以主力推 ${bestSeller.menu_item}，因為今日已售出 ${bestSeller.bowls_sold} 碗。` : '今日未有足夠銷售資料，先留意庫存風險。');

    return {
      best_seller: bestSeller,
      coverage,
      risks,
      reorders,
      promotions,
      profit,
      tonight_promotion: tonightPromotion,
      avoid_promotions: avoidPromotions,
      today_focus: {
        stock_risk: risks[0]?.message ?? '未見 3 日內即時缺貨風險。',
        reorder: reorders[0]?.message ?? '今日未有緊急補貨項目。',
        bestseller: bestSeller ? `今日最好賣：${bestSeller.menu_item}，已售出 ${bestSeller.bowls_sold} 碗。` : '今日暫未有銷售資料。',
        ingredient_coverage: tightestMenu ? tightestMenu.message : '暫未有食材可支撐銷售量資料。',
        tonight_promotion: tonightPromotion?.title ?? '今晚未有足夠資料推薦主打餐點。',
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
    calculateMenuProfit,
    profitAnalysis,
    bestPromotionTonight,
    decisionMessages
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.OwnerDashboard = api;
})(typeof window !== 'undefined' ? window : globalThis);
