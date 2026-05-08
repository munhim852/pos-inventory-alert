const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const tableName = 'Inventory';
const storeId = 'store-001';
const inventoryMeta = {
    tonkotsu_broth: { unit: 'L', suggestedReorderQty: 20, estimatedDailyUsage: 8 },
    spicy_tonkotsu_broth: { unit: 'L', suggestedReorderQty: 12, estimatedDailyUsage: 3 },
    miso_broth: { unit: 'L', suggestedReorderQty: 15, estimatedDailyUsage: 5 },
    black_garlic_sauce: { unit: 'portion', suggestedReorderQty: 60, estimatedDailyUsage: 12 },
    pork_chashu: { unit: 'slice', suggestedReorderQty: 300, estimatedDailyUsage: 80 },
    pork_cartilage: { unit: 'portion', suggestedReorderQty: 50, estimatedDailyUsage: 10 },
    minced_pork: { unit: 'portion', suggestedReorderQty: 60, estimatedDailyUsage: 15 },
    ajitama_egg: { unit: 'piece', suggestedReorderQty: 120, estimatedDailyUsage: 36 },
    onsen_egg: { unit: 'piece', suggestedReorderQty: 60, estimatedDailyUsage: 12 },
    ramen_noodle: { unit: 'pack', suggestedReorderQty: 200, estimatedDailyUsage: 60 },
    corn: { unit: 'portion', suggestedReorderQty: 120, estimatedDailyUsage: 36 },
    kombu: { unit: 'portion', suggestedReorderQty: 120, estimatedDailyUsage: 36 },
    narutomaki: { unit: 'slice', suggestedReorderQty: 150, estimatedDailyUsage: 36 },
    butter: { unit: 'portion', suggestedReorderQty: 50, estimatedDailyUsage: 10 },
    bean_sprouts: { unit: 'portion', suggestedReorderQty: 100, estimatedDailyUsage: 20 }
};
const menuRecipes = {
    hakata_shio_tonkotsu: {
        name: '博多鹽味豚骨拉麺',
        price: 1.50,
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
        price: 1.50,
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
        price: 1.50,
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
        price: 1.50,
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
        price: 1.50,
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
        price: 1.50,
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

const menuNameToId = Object.fromEntries(
    Object.entries(menuRecipes).map(([id, recipe]) => [recipe.name, id])
);

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

async function sendOperationsAlert(message, context) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        context.log('DISCORD_WEBHOOK_URL is not configured. Skipping operations alert.');
        return false;
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord webhook failed with ${response.status}: ${errorText}`);
    }

    return true;
}

function resolveMenuItem(body) {
    const menuItemId = body.menu_item_id;
    const menuItemName = body.menu_item;

    if (menuItemId && menuRecipes[menuItemId]) {
        return { id: menuItemId, ...menuRecipes[menuItemId] };
    }

    if (menuItemName && menuNameToId[menuItemName]) {
        const id = menuNameToId[menuItemName];
        return { id, ...menuRecipes[id] };
    }

    return null;
}

function resolveIngredients(menuItem, ingredientOverrides) {
    if (!ingredientOverrides || typeof ingredientOverrides !== 'object' || Array.isArray(ingredientOverrides)) {
        return menuItem.ingredients;
    }

    const ingredients = {};

    for (const [ingredient, defaultQty] of Object.entries(menuItem.ingredients)) {
        const overrideQty = Number(ingredientOverrides[ingredient] ?? defaultQty);

        if (!Number.isFinite(overrideQty) || overrideQty < 0) {
            throw new Error(`Invalid ingredient usage for ${ingredient}.`);
        }

        if (overrideQty > 0) {
            ingredients[ingredient] = overrideQty;
        }
    }

    return ingredients;
}

function roundQty(value) {
    return Math.round(value * 100) / 100;
}

function buildReorderSuggestion(snapshot) {
    const suggestedQty = Number(snapshot.suggested_reorder_qty ?? 0);
    const dailyUsage = Number(snapshot.estimated_daily_usage ?? 0);

    if (!snapshot.low_stock || suggestedQty <= 0) {
        return null;
    }

    return {
        item: snapshot.item,
        suggested_reorder_qty: suggestedQty,
        unit: snapshot.unit,
        estimated_coverage_days: dailyUsage > 0 ? roundQty(suggestedQty / dailyUsage) : null
    };
}

async function updateInventoryItem(tableClient, item, qtySold, context) {
    const inventorySnapshot = await getInventorySnapshot(tableClient, item);
    const currentStock = inventorySnapshot.stock;
    const reorderLevel = inventorySnapshot.reorder_level;

    if (currentStock < qtySold) {
        const shortage = {
            item,
            required: qtySold,
            available: currentStock,
            shortage: qtySold - currentStock,
            reorder_level: reorderLevel
        };

        await sendInsufficientStockAlert([shortage], context);
        const error = new Error(`Insufficient stock for ${item}. Required ${qtySold}, available ${currentStock}.`);
        error.statusCode = 409;
        error.shortages = [shortage];
        throw error;
    }

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
        item,
        qty_sold: qtySold,
        previous_stock: currentStock,
        remaining_stock: newStock,
        reorder_level: reorderLevel,
        unit: inventorySnapshot.unit,
        low_stock: lowStock,
        alert_sent: alertSent,
        alert_error: alertError
    };
}

async function getInventorySnapshot(tableClient, item) {
    const inventoryItem = await tableClient.getEntity(storeId, item);

    return {
        item,
        display_name: inventoryItem.displayName ?? item,
        stock: Number(inventoryItem.stock),
        reorder_level: Number(inventoryItem.reorderLevel),
        unit: inventoryItem.unit ?? inventoryMeta[item]?.unit ?? 'unit',
        suggested_reorder_qty: Number(inventoryItem.suggestedReorderQty ?? inventoryMeta[item]?.suggestedReorderQty ?? 0),
        estimated_daily_usage: Number(inventoryItem.estimatedDailyUsage ?? inventoryMeta[item]?.estimatedDailyUsage ?? 0),
        low_stock: Number(inventoryItem.stock) <= Number(inventoryItem.reorderLevel)
    };
}

async function listInventory(tableClient) {
    const items = [];

    for await (const entity of tableClient.listEntities({
        queryOptions: { filter: `PartitionKey eq '${storeId}'` }
    })) {
        const snapshot = {
            item: entity.rowKey,
            display_name: entity.displayName ?? entity.rowKey,
            stock: Number(entity.stock),
            reorder_level: Number(entity.reorderLevel),
            unit: entity.unit ?? inventoryMeta[entity.rowKey]?.unit ?? 'unit',
            suggested_reorder_qty: Number(entity.suggestedReorderQty ?? inventoryMeta[entity.rowKey]?.suggestedReorderQty ?? 0),
            estimated_daily_usage: Number(entity.estimatedDailyUsage ?? inventoryMeta[entity.rowKey]?.estimatedDailyUsage ?? 0),
            low_stock: Number(entity.stock) <= Number(entity.reorderLevel)
        };

        items.push({
            ...snapshot,
            days_coverage: snapshot.estimated_daily_usage > 0 ? roundQty(snapshot.stock / snapshot.estimated_daily_usage) : null,
            reorder_suggestion: buildReorderSuggestion(snapshot)
        });
    }

    return items.sort((a, b) => a.item.localeCompare(b.item));
}

async function calculateMenuAvailability(tableClient) {
    const availability = [];

    for (const [menuItemId, recipe] of Object.entries(menuRecipes)) {
        const ingredientCapacity = [];

        for (const [ingredient, qtyPerBowl] of Object.entries(recipe.ingredients)) {
            const snapshot = await getInventorySnapshot(tableClient, ingredient);
            const bowls = qtyPerBowl > 0 ? Math.floor(snapshot.stock / qtyPerBowl) : Number.MAX_SAFE_INTEGER;

            ingredientCapacity.push({
                item: ingredient,
                display_name: snapshot.display_name,
                stock: snapshot.stock,
                unit: snapshot.unit,
                qty_per_bowl: qtyPerBowl,
                available_bowls: bowls
            });
        }

        const limitingIngredient = ingredientCapacity.reduce((lowest, item) =>
            item.available_bowls < lowest.available_bowls ? item : lowest
        );

        availability.push({
            menu_item_id: menuItemId,
            menu_item: recipe.name,
            available_bowls: limitingIngredient.available_bowls,
            limiting_ingredient: limitingIngredient.item,
            limiting_ingredient_name: limitingIngredient.display_name,
            ingredient_capacity: ingredientCapacity
        });
    }

    return availability.sort((a, b) => a.available_bowls - b.available_bowls);
}

async function sendInsufficientStockAlert(shortages, context) {
    const lines = shortages.map((item) =>
        `${item.item}: required ${item.required}, available ${item.available}, shortage ${item.shortage}`
    );

    try {
        return await sendOperationsAlert(`ORDER BLOCKED - INSUFFICIENT STOCK\n${lines.join('\n')}`, context);
    } catch (error) {
        context.error(error);
        return false;
    }
}

async function validateStockAvailability(tableClient, requirements, context) {
    const snapshots = [];
    const shortages = [];

    for (const [item, requiredQty] of Object.entries(requirements)) {
        const snapshot = await getInventorySnapshot(tableClient, item);
        snapshots.push({ ...snapshot, required: requiredQty });

        if (snapshot.stock < requiredQty) {
            shortages.push({
                item,
                display_name: snapshot.display_name,
                required: requiredQty,
                available: snapshot.stock,
                shortage: requiredQty - snapshot.stock,
                reorder_level: snapshot.reorder_level
            });
        }
    }

    if (shortages.length) {
        const alertSent = await sendInsufficientStockAlert(shortages, context);
        const error = new Error('Insufficient stock. Order was not submitted.');
        error.statusCode = 409;
        error.shortages = shortages;
        error.alertSent = alertSent;
        throw error;
    }

    return snapshots;
}

async function restockInventoryItem(tableClient, item, qtyRestock) {
    const inventoryItem = await tableClient.getEntity(storeId, item);
    const currentStock = Number(inventoryItem.stock);
    const reorderLevel = Number(inventoryItem.reorderLevel);
    const unit = inventoryItem.unit ?? inventoryMeta[item]?.unit ?? 'unit';
    const newStock = currentStock + qtyRestock;

    await tableClient.updateEntity({
        partitionKey: storeId,
        rowKey: item,
        stock: newStock,
        reorderLevel
    }, 'Merge');

    return {
        item,
        qty_restock: qtyRestock,
        previous_stock: currentStock,
        remaining_stock: newStock,
        reorder_level: reorderLevel,
        unit,
        low_stock: newStock <= reorderLevel
    };
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
        const menuItem = resolveMenuItem(body);
        const action = body.action ?? 'sale';
        const qtySold = Number(body.qty_sold ?? body.qty_ordered ?? 1);
        const qtyRestock = Number(body.qty_restock ?? body.qty_added ?? 0);

        if (action === 'inventory') {
            // Dashboard read-only request.
        } else if (action === 'restock') {
            if (!item || !Number.isFinite(qtyRestock) || qtyRestock <= 0) {
                return {
                    status: 400,
                    jsonBody: {
                        status: 'error',
                        message: 'Send JSON like { "action": "restock", "item": "pork_chashu", "qty_restock": 20 }.'
                    }
                };
            }
        } else if ((!item && !menuItem) || !Number.isInteger(qtySold) || qtySold <= 0) {
            return {
                status: 400,
                jsonBody: {
                    status: 'error',
                    message: 'Send JSON like { "menu_item_id": "hakata_shio_tonkotsu", "qty_ordered": 2 } or { "item": "corn", "qty_sold": 2 }.'
                }
            };
        }

        const tableClient = getTableClient();

        context.log(`Action: ${action} | Item: ${item ?? menuItem?.id} | Qty sold: ${qtySold} | Qty restock: ${qtyRestock}`);

        try {
            if (action === 'inventory') {
                return {
                    status: 200,
                    jsonBody: {
                        status: 'ok',
                        order_type: 'inventory_dashboard',
                        inventory: await listInventory(tableClient),
                        menu_availability: await calculateMenuAvailability(tableClient)
                    }
                };
            }

            if (action === 'restock') {
                const inventoryUpdate = await restockInventoryItem(tableClient, item, qtyRestock);

                return {
                    status: 200,
                    jsonBody: {
                        status: 'ok',
                        order_type: 'restock',
                        ...inventoryUpdate
                    }
                };
            }

            if (menuItem) {
                const inventoryUpdates = [];
                const ingredients = resolveIngredients(menuItem, body.ingredient_overrides);
                const requirements = Object.fromEntries(
                    Object.entries(ingredients).map(([ingredient, qtyPerOrder]) => [ingredient, qtyPerOrder * qtySold])
                );

                await validateStockAvailability(tableClient, requirements, context);

                for (const [ingredient, qtyPerOrder] of Object.entries(ingredients)) {
                    inventoryUpdates.push(
                        await updateInventoryItem(tableClient, ingredient, qtyPerOrder * qtySold, context)
                    );
                }

                return {
                    status: 200,
                    jsonBody: {
                        status: 'ok',
                        order_type: 'menu_item',
                        menu_item_id: menuItem.id,
                        menu_item: menuItem.name,
                        qty_ordered: qtySold,
                        price: menuItem.price,
                        total: Number((menuItem.price * qtySold).toFixed(2)),
                        ingredient_usage: ingredients,
                        inventory_updates: inventoryUpdates,
                        low_stock_items: inventoryUpdates.filter((update) => update.low_stock).map((update) => update.item)
                    }
                };
            }

            await validateStockAvailability(tableClient, { [item]: qtySold }, context);
            const inventoryUpdate = await updateInventoryItem(tableClient, item, qtySold, context);

            return {
                status: 200,
                jsonBody: {
                    status: 'ok',
                    order_type: 'inventory_item',
                    ...inventoryUpdate
                }
            };
        } catch (error) {
            if (error.statusCode === 404) {
                return {
                    status: 404,
                    jsonBody: { status: 'error', message: `Inventory item not found: ${item ?? 'one or more menu ingredients'}` }
                };
            }

            if (error.statusCode === 409) {
                return {
                    status: 409,
                    jsonBody: {
                        status: 'error',
                        order_type: 'blocked_order',
                        message: error.message,
                        shortages: error.shortages ?? [],
                        alert_sent: error.alertSent ?? false
                    }
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
