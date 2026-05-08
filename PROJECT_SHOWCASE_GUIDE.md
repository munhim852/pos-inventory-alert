# POS Inventory Alerting System

## Project Goal

This project is a cloud-based operations and inventory alerting system for a small retail or restaurant environment. It simulates POS sales data, processes each transaction in Azure, updates cloud-hosted inventory, and sends low-stock alerts to an operations channel.

The main showcase is not the programming language. The main showcase is the business logic and cloud workflow:

```text
POS menu order -> recipe deduction logic -> Azure Table Storage -> low-stock alert -> operations visibility
```

## Business Scenario

A store sells operational items such as ramen toppings, noodles, and drinks. Instead of manually checking stock at the end of the day, every POS sale updates cloud inventory in real time. When stock drops below a reorder threshold, the operations team receives an alert before the item runs out.

## Current Architecture

```text
Simulated POS request
    |
    v
Azure Function App: f1
Function: HttpReceiveSales
    |
    v
Azure Table Storage
Storage account: posinventorydemo123
Table: Inventory
    |
    v
Discord webhook alert
```

## Data Model

Azure Table: `Inventory`

| PartitionKey | RowKey | stock | reorderLevel |
| --- | --- | ---: | ---: |
| store-001 | pork_chashu | 100 | 20 |
| store-001 | ramen_noodle | 200 | 50 |
| store-001 | soft_drink | 80 | 15 |

`PartitionKey` represents the store. `RowKey` represents the inventory item.

## Stage 1: Cloud Receiver

Goal: Build a cloud endpoint that can receive simulated POS sales data.

Completed:

- Created Azure Function App using Node.js.
- Created HTTP-triggered function: `HttpReceiveSales`.
- Accepted JSON payloads such as:

```json
{
  "item": "pork_chashu",
  "qty_sold": 2
}
```

- Deployed the function to Azure.
- Verified that the Azure endpoint could receive data and return a response.

Showcase value:

> Built a serverless HTTP endpoint in Azure Functions to receive simulated POS transaction data.

## Stage 2: Cloud Inventory Logic

Goal: Connect the Function App to a cloud database and update inventory in real time.

Completed:

- Created Azure Storage Account: `posinventorydemo123`.
- Created Azure Table: `Inventory`.
- Added starting inventory records.
- Added Function App settings:
  - `AzureWebJobsStorage`
  - `STORAGE_CONNECTION_STRING`
- Installed Node.js package:
  - `@azure/data-tables`
- Updated `HttpReceiveSales` to:
  - Validate incoming JSON.
  - Read the item from Azure Table Storage.
  - Deduct `qty_sold` from `stock`.
  - Update the table record.
  - Return stock status in the API response.

Successful test response:

```json
{
  "status": "ok",
  "item": "pork_chashu",
  "qty_sold": 2,
  "previous_stock": 100,
  "remaining_stock": 98,
  "reorder_level": 20,
  "low_stock": false
}
```

Showcase value:

> Processed simulated POS sales transactions in real time and updated cloud inventory records using Azure Table Storage.

## Stage 3: Low-Stock Alerting

Goal: Notify the operations team when inventory drops below a reorder threshold.

Status: In progress.

Completed:

- Added `DISCORD_WEBHOOK_URL` support to the Function App code.
- Added alert logic:

```text
if remaining_stock <= reorder_level:
    send Discord alert
```

- Added response fields:
  - `low_stock`
  - `alert_sent`
  - `alert_error`

Next setup step:

1. Create a Discord channel such as `inventory-alerts`.
2. Go to channel settings.
3. Open Integrations.
4. Create a webhook.
5. Copy the webhook URL.
6. Add it to Azure Function App environment variables:

```text
DISCORD_WEBHOOK_URL=<your Discord webhook URL>
```

Expected alert:

```text
LOW STOCK ALERT: pork_chashu only has 18 left. Reorder level is 20.
```

Showcase value:

> Automated inventory monitoring by sending webhook alerts when tracked items dropped below predefined reorder thresholds.

## Stage 3.5: Menu Order Recipe Logic

Goal: Make the demo feel like a real ramen POS workflow.

Completed:

- Added menu item handling for six ramen products:
  - 博多鹽味豚骨拉麺
  - 博多黑蒜拉麵
  - 博多赤味噌拉麺
  - 博多味噌牛油拉麵
  - 鹿兒島黑豚王軟骨拉麵
  - 赤鬼王拉麵
- Each menu order now deducts multiple ingredient rows from Azure Table Storage.
- Shared ingredients use one inventory pool. For example, all ramen that use chashu deduct from `pork_chashu`, and common toppings such as `ajitama_egg`, `corn`, `kombu`, `narutomaki`, and `tonkotsu_broth` are shared across menu items.
- Added editable ingredient usage so a test order can override the default quantity per bowl.
- Added restock support for replenishing an inventory item.
- Added stock availability checks. If any required ingredient is unavailable, the order is blocked and no inventory rows are deducted.
- Added a dashboard action to read current inventory from Azure Table Storage.
- Updated seed logic so it no longer resets stock for existing rows.
- Added realistic units and recipe quantities, such as 0.35L broth, 2 chashu slices, 0.5 egg, and 1 noodle pack per ramen.
- Added menu availability analysis. The system calculates how many bowls each menu item can still sell and identifies the limiting ingredient.
- Added reorder suggestions using current stock, suggested reorder quantity, and estimated daily usage.
- Added support for payloads such as:

```json
{
  "menu_item_id": "hakata_black_garlic",
  "qty_ordered": 1,
  "ingredient_overrides": {
    "pork_chashu": 2
  }
}
```

- Kept the direct inventory deduction mode for support/testing:

```json
{
  "item": "corn",
  "qty_sold": 2
}
```

Showcase value:

> Implemented POS-style menu recipe logic where each customer order automatically deducts the correct ingredient-level inventory records.

Restock payload:

```json
{
  "action": "restock",
  "item": "pork_chashu",
  "qty_restock": 20
}
```

## Stage 4: Dashboard

Goal: Build a simple dashboard for interview or portfolio demos.

Planned:

- Create a lightweight dashboard showing current inventory.
- Display item name, stock level, reorder threshold, and low-stock status.
- Optional tools:
  - Streamlit dashboard reading Azure Table Storage.
  - Simple web page calling a read-only Azure Function endpoint.

Showcase value:

> Built a simple operational dashboard to visualize real-time inventory status from cloud storage.

## How To Test The API

Live endpoint:

```text
https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales
```

PowerShell:

```powershell
$body = @{
  item = "pork_chashu"
  qty_sold = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" -Method Post -ContentType "application/json" -Body $body
```

Bash:

```bash
curl -X POST "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" \
  -H "Content-Type: application/json" \
  -d '{"item":"pork_chashu","qty_sold":3}'
```

Expected response fields:

```json
{
  "status": "ok",
  "item": "pork_chashu",
  "qty_sold": 3,
  "previous_stock": 98,
  "remaining_stock": 95,
  "reorder_level": 20,
  "low_stock": false,
  "alert_sent": false,
  "alert_error": null
}
```

## Demo Script

1. Show the business problem: store inventory can run low without manual checking.
2. Show the Azure Function endpoint receiving POS sales JSON.
3. Send a test sale request.
4. Show the API response with previous and remaining stock.
5. Open Azure Table Storage and show the updated stock.
6. Send enough sales to cross the reorder threshold.
7. Show the Discord low-stock alert.
8. Explain how this reduces manual reporting for operations teams.

## Resume Bullets

- Built a serverless API endpoint using Azure Functions to process simulated POS transaction data in real time.
- Configured Azure Table Storage to track operational inventory and update item counts based on incoming sales events.
- Implemented inventory business logic to validate POS payloads, deduct stock, and identify low-stock conditions.
- Automated low-stock notifications through Discord webhooks to alert operations staff when inventory dropped below reorder thresholds.

## Interview Explanation

This project simulates a common operations support problem: a POS system records sales, but inventory checks are often manual and delayed. I built a cloud workflow where every sale is sent to Azure Functions, inventory is updated in Azure Table Storage, and low-stock conditions can trigger an alert. It demonstrates serverless API design, cloud database integration, operational business logic, and webhook-based automation.
