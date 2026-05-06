const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const tableName = 'Inventory';
const storeId = 'store-001';

function getTableClient() {
    const connectionString = process.env.STORAGE_CONNECTION_STRING;

    if (!connectionString) {
        throw new Error('Missing STORAGE_CONNECTION_STRING app setting.');
    }

    return TableClient.fromConnectionString(connectionString, tableName);
}

async function sendDiscordAlert(item, remainingStock, reorderLevel, context) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        context.log('DISCORD_WEBHOOK_URL is not configured. Skipping low-stock alert.');
        return false;
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `LOW STOCK ALERT: ${item} only has ${remainingStock} left. Reorder level is ${reorderLevel}.`
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord webhook failed with ${response.status}: ${errorText}`);
    }

    return true;
}

app.http('HttpReceiveSales', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        let body;

        try {
            body = await request.json();
        } catch {
            return {
                status: 400,
                jsonBody: { status: 'error', message: 'Request body must be valid JSON.' }
            };
        }

        const item = body.item;
        const qtySold = Number(body.qty_sold);

        if (!item || !Number.isInteger(qtySold) || qtySold <= 0) {
            return {
                status: 400,
                jsonBody: {
                    status: 'error',
                    message: 'Send JSON like { "item": "pork_chashu", "qty_sold": 2 }.'
                }
            };
        }

        const tableClient = getTableClient();

        context.log(`Item: ${item} | Qty sold: ${qtySold}`);

        try {
            const inventoryItem = await tableClient.getEntity(storeId, item);
            const currentStock = Number(inventoryItem.stock);
            const reorderLevel = Number(inventoryItem.reorderLevel);
            const newStock = Math.max(currentStock - qtySold, 0);

            await tableClient.updateEntity({
                partitionKey: storeId,
                rowKey: item,
                stock: newStock,
                reorderLevel
            }, 'Merge');

            const lowStock = newStock <= reorderLevel;
            let alertSent = false;
            let alertError = null;

            if (lowStock) {
                try {
                    alertSent = await sendDiscordAlert(item, newStock, reorderLevel, context);
                } catch (error) {
                    alertError = error.message;
                    context.error(error);
                }
            }

            return {
                status: 200,
                jsonBody: {
                    status: 'ok',
                    item,
                    qty_sold: qtySold,
                    previous_stock: currentStock,
                    remaining_stock: newStock,
                    reorder_level: reorderLevel,
                    low_stock: lowStock,
                    alert_sent: alertSent,
                    alert_error: alertError
                }
            };
        } catch (error) {
            if (error.statusCode === 404) {
                return {
                    status: 404,
                    jsonBody: { status: 'error', message: `Inventory item not found: ${item}` }
                };
            }

            context.error(error);

            return {
                status: 500,
                jsonBody: { status: 'error', message: 'Failed to update inventory.' }
            };
        }
    }
});
