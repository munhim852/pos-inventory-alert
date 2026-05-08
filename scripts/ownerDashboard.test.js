const assert = require('assert');
const {
    bestSellingMenuItem,
    ingredientCoverage,
    calculateMenuProfit,
    profitAnalysis,
    bestPromotionTonight,
    reorderRecommendations,
    decisionMessages
} = require('../ui/ownerDashboard');

const sales = [
    { menu_item_id: 'hakata_black_garlic', menu_item: '博多黑蒜拉麵', bowls_sold: 18 },
    { menu_item_id: 'akaoni_king', menu_item: '赤鬼王拉麵', bowls_sold: 12 }
];

const menuAvailability = [
    {
        menu_item_id: 'hakata_black_garlic',
        menu_item: '博多黑蒜拉麵',
        available_bowls: 18,
        limiting_ingredient: 'pork_chashu',
        limiting_ingredient_name: '黑豚叉燒',
        ingredient_capacity: [{ item: 'pork_chashu' }, { item: 'black_garlic_sauce' }]
    },
    {
        menu_item_id: 'akaoni_king',
        menu_item: '赤鬼王拉麵',
        available_bowls: 12,
        limiting_ingredient: 'spicy_tonkotsu_broth',
        limiting_ingredient_name: '辣豚骨湯底',
        ingredient_capacity: [{ item: 'spicy_tonkotsu_broth' }]
    }
];

const inventory = [
    {
        item: 'pork_chashu',
        display_name: '黑豚叉燒',
        days_coverage: 1.2,
        suggested_reorder_qty: 300,
        unit: 'slice'
    },
    {
        item: 'black_garlic_sauce',
        display_name: '黑蒜醬',
        days_coverage: 8,
        suggested_reorder_qty: 60,
        unit: 'portion'
    },
    {
        item: 'spicy_tonkotsu_broth',
        display_name: '辣豚骨湯底',
        days_coverage: 2.5,
        suggested_reorder_qty: 12,
        unit: 'L'
    }
];

const menuProfitability = [
    {
        menu_item_id: 'hakata_black_garlic',
        menu_item: '博多黑蒜拉麵',
        price: 18.49,
        ingredient_cost: 4.8
    },
    {
        menu_item_id: 'akaoni_king',
        menu_item: '赤鬼王拉麵',
        price: 18.99,
        ingredient_cost: 4.48
    }
];

assert.deepStrictEqual(bestSellingMenuItem(sales), sales[0]);

const coverage = ingredientCoverage(menuAvailability);
assert.strictEqual(coverage[0].menu_item, '赤鬼王拉麵');
assert.strictEqual(coverage[0].limiting_ingredient, 'spicy_tonkotsu_broth');
assert.match(coverage[0].message, /最多可賣 12 碗/);
assert.strictEqual(coverage[0].stockout_risk, '中');

const profit = calculateMenuProfit(menuProfitability[0]);
assert.strictEqual(profit.profit_per_bowl, 13.69);
assert.strictEqual(profit.gross_margin_percent, 74.04);

const profitRows = profitAnalysis(menuAvailability, menuProfitability, sales);
const blackGarlicProfit = profitRows.find((item) => item.menu_item_id === 'hakata_black_garlic');
assert.strictEqual(blackGarlicProfit.profit_potential, 246.42);
assert.ok(blackGarlicProfit.recommendation_score > 0);

const promotion = bestPromotionTonight(menuAvailability, menuProfitability, sales);
assert.strictEqual(promotion.menu_item, '博多黑蒜拉麵');
assert.match(promotion.message, /建議今晚主推 博多黑蒜拉麵/);
assert.ok(promotion.reasons.some((reason) => reason.includes('每碗預計毛利')));

const reorders = reorderRecommendations(inventory);
assert.strictEqual(reorders.length, 1);
assert.match(reorders[0].message, /建議今日補 黑豚叉燒/);

const decisions = decisionMessages({ inventory, menuAvailability, menuProfitability, sales });
assert.match(decisions.today_focus.bestseller, /今日最好賣：博多黑蒜拉麵/);
assert.match(decisions.today_focus.reorder, /建議今日補 黑豚叉燒/);
assert.match(decisions.today_focus.ingredient_coverage, /赤鬼王拉麵 最多可賣 12 碗/);
assert.match(decisions.today_focus.tonight_promotion, /今晚建議主推：博多黑蒜拉麵/);
assert.match(decisions.today_focus.decision, /建議今晚主推 博多黑蒜拉麵/);
assert.strictEqual(decisions.tonight_promotion.menu_item, '博多黑蒜拉麵');
assert.ok(decisions.profit.length >= 2);

console.log('Owner dashboard tests passed.');
