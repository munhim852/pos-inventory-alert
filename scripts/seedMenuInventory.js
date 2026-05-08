const { TableClient } = require('@azure/data-tables');

const tableName = 'Inventory';
const storeId = 'store-001';

const inventorySeed = [
    { rowKey: 'tonkotsu_broth', displayName: '豚骨湯底', stock: 12, reorderLevel: 3, unit: 'L', suggestedReorderQty: 20, estimatedDailyUsage: 8, costPerUnit: 2.20 },
    { rowKey: 'spicy_tonkotsu_broth', displayName: '辣豚骨湯底', stock: 8, reorderLevel: 2, unit: 'L', suggestedReorderQty: 12, estimatedDailyUsage: 3, costPerUnit: 2.50 },
    { rowKey: 'miso_broth', displayName: '味噌湯底', stock: 10, reorderLevel: 3, unit: 'L', suggestedReorderQty: 15, estimatedDailyUsage: 5, costPerUnit: 2.00 },
    { rowKey: 'black_garlic_sauce', displayName: '黑蒜醬', stock: 80, reorderLevel: 15, unit: 'portion', suggestedReorderQty: 60, estimatedDailyUsage: 12, costPerUnit: 0.35 },
    { rowKey: 'pork_chashu', displayName: '黑豚叉燒', stock: 240, reorderLevel: 50, unit: 'slice', suggestedReorderQty: 300, estimatedDailyUsage: 80, costPerUnit: 0.55 },
    { rowKey: 'pork_cartilage', displayName: '豬肉軟骨', stock: 60, reorderLevel: 15, unit: 'portion', suggestedReorderQty: 50, estimatedDailyUsage: 10, costPerUnit: 1.40 },
    { rowKey: 'minced_pork', displayName: '炒豬肉碎', stock: 80, reorderLevel: 20, unit: 'portion', suggestedReorderQty: 60, estimatedDailyUsage: 15, costPerUnit: 0.95 },
    { rowKey: 'ajitama_egg', displayName: '溏心蛋', stock: 70, reorderLevel: 15, unit: 'piece', suggestedReorderQty: 120, estimatedDailyUsage: 36, costPerUnit: 0.70 },
    { rowKey: 'onsen_egg', displayName: '溫泉蛋', stock: 70, reorderLevel: 15, unit: 'piece', suggestedReorderQty: 60, estimatedDailyUsage: 12, costPerUnit: 0.65 },
    { rowKey: 'ramen_noodle', displayName: '拉麵', stock: 200, reorderLevel: 50, unit: 'pack', suggestedReorderQty: 200, estimatedDailyUsage: 60, costPerUnit: 0.80 },
    { rowKey: 'corn', displayName: '玉米', stock: 200, reorderLevel: 40, unit: 'portion', suggestedReorderQty: 120, estimatedDailyUsage: 36, costPerUnit: 0.18 },
    { rowKey: 'kombu', displayName: '昆布', stock: 200, reorderLevel: 40, unit: 'portion', suggestedReorderQty: 120, estimatedDailyUsage: 36, costPerUnit: 0.12 },
    { rowKey: 'narutomaki', displayName: '魚板', stock: 200, reorderLevel: 40, unit: 'slice', suggestedReorderQty: 150, estimatedDailyUsage: 36, costPerUnit: 0.16 },
    { rowKey: 'butter', displayName: '牛油', stock: 80, reorderLevel: 15, unit: 'portion', suggestedReorderQty: 50, estimatedDailyUsage: 10, costPerUnit: 0.40 },
    { rowKey: 'bean_sprouts', displayName: '豆芽', stock: 120, reorderLevel: 25, unit: 'portion', suggestedReorderQty: 100, estimatedDailyUsage: 20, costPerUnit: 0.22 }
];
const legacyRows = ['black_pork_chashu'];

async function main() {
    const connectionString = process.env.STORAGE_CONNECTION_STRING;

    if (!connectionString) {
        throw new Error('Set STORAGE_CONNECTION_STRING before running this script.');
    }

    const tableClient = TableClient.fromConnectionString(connectionString, tableName);
    await tableClient.createTable();

    let created = 0;
    let preserved = 0;
    let removedLegacyRows = 0;

    for (const rowKey of legacyRows) {
        try {
            await tableClient.deleteEntity(storeId, rowKey);
            removedLegacyRows += 1;
        } catch (error) {
            if (error.statusCode !== 404) {
                throw error;
            }
        }
    }

    for (const item of inventorySeed) {
        try {
            const existing = await tableClient.getEntity(storeId, item.rowKey);

            await tableClient.updateEntity({
                partitionKey: storeId,
                rowKey: item.rowKey,
                displayName: item.displayName,
                stock: existing.stock,
                reorderLevel: item.reorderLevel,
                unit: item.unit,
                suggestedReorderQty: item.suggestedReorderQty,
                estimatedDailyUsage: item.estimatedDailyUsage,
                costPerUnit: item.costPerUnit
            }, 'Merge');

            preserved += 1;
        } catch (error) {
            if (error.statusCode !== 404) {
                throw error;
            }

            await tableClient.createEntity({
                partitionKey: storeId,
                rowKey: item.rowKey,
                displayName: item.displayName,
                stock: item.stock,
                reorderLevel: item.reorderLevel,
                unit: item.unit,
                suggestedReorderQty: item.suggestedReorderQty,
                estimatedDailyUsage: item.estimatedDailyUsage,
                costPerUnit: item.costPerUnit
            });

            created += 1;
        }
    }

    console.log(`Seed complete. Created ${created} rows, preserved stock for ${preserved} existing rows, and removed ${removedLegacyRows} legacy rows.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
