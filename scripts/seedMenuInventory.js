const { TableClient } = require('@azure/data-tables');

const tableName = 'Inventory';
const storeId = 'store-001';

const inventorySeed = [
    { rowKey: 'tonkotsu_broth', displayName: '豚骨湯底', stock: 120, reorderLevel: 25 },
    { rowKey: 'spicy_tonkotsu_broth', displayName: '辣豚骨湯底', stock: 80, reorderLevel: 20 },
    { rowKey: 'miso_broth', displayName: '味噌湯底', stock: 100, reorderLevel: 25 },
    { rowKey: 'black_garlic_sauce', displayName: '黑蒜醬', stock: 80, reorderLevel: 15 },
    { rowKey: 'pork_chashu', displayName: '黑豚叉燒', stock: 120, reorderLevel: 25 },
    { rowKey: 'pork_cartilage', displayName: '豬肉軟骨', stock: 60, reorderLevel: 15 },
    { rowKey: 'minced_pork', displayName: '炒豬肉碎', stock: 80, reorderLevel: 20 },
    { rowKey: 'ajitama_egg', displayName: '溏心蛋', stock: 140, reorderLevel: 30 },
    { rowKey: 'onsen_egg', displayName: '溫泉蛋', stock: 70, reorderLevel: 15 },
    { rowKey: 'corn', displayName: '玉米', stock: 200, reorderLevel: 40 },
    { rowKey: 'kombu', displayName: '昆布', stock: 200, reorderLevel: 40 },
    { rowKey: 'narutomaki', displayName: '魚板', stock: 200, reorderLevel: 40 },
    { rowKey: 'butter', displayName: '牛油', stock: 80, reorderLevel: 15 },
    { rowKey: 'bean_sprouts', displayName: '豆芽', stock: 120, reorderLevel: 25 }
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
                reorderLevel: item.reorderLevel
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
                reorderLevel: item.reorderLevel
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
