# POS Inventory Alerting System

A cloud-based operations showcase that simulates POS sales transactions, updates inventory in Azure Table Storage, and sends low-stock alerts through a Discord webhook.

## Why This Project Exists

Small retail and restaurant teams often know what was sold through the POS, but inventory follow-up can still be manual. This project demonstrates how a lightweight cloud workflow can turn each sale into an inventory update and notify operations staff before an item runs out.

## Architecture

```text
POS simulator / API test
    |
    v
Azure Function App: f1
HTTP trigger: HttpReceiveSales
    |
    v
Azure Table Storage: Inventory
    |
    v
Discord low-stock alert
```

## Current Status

- Stage 1 complete: Azure Function HTTP endpoint receives simulated POS sales JSON.
- Stage 2 complete: Azure Table Storage inventory records update in real time.
- Stage 3 in progress: Discord webhook alert logic is implemented and ready for webhook configuration.
- Stage 4 planned: dashboard for viewing inventory status.

## Tech Stack

- Azure Functions
- Node.js
- Azure Table Storage
- Discord webhooks
- Azure Functions Core Tools

## API Endpoint

```text
POST /api/httpreceivesales
```

Example payload:

```json
{
  "menu_item_id": "hakata_shio_tonkotsu",
  "qty_ordered": 2
}
```

Example response:

```json
{
  "status": "ok",
  "order_type": "menu_item",
  "menu_item_id": "hakata_shio_tonkotsu",
  "menu_item": "博多鹽味豚骨拉麺",
  "qty_ordered": 2,
  "price": 1.5,
  "total": 3,
  "inventory_updates": []
}
```

## Azure Table Data Model

Table name: `Inventory`

| PartitionKey | RowKey | stock | reorderLevel |
| --- | --- | ---: | ---: |
| store-001 | pork_chashu | 100 | 20 |
| store-001 | ramen_noodle | 200 | 50 |
| store-001 | soft_drink | 80 | 15 |

## Menu Order Logic

The API supports two modes:

1. Direct inventory deduction:

```json
{
  "item": "corn",
  "qty_sold": 2
}
```

2. Menu item order deduction:

```json
{
  "menu_item_id": "hakata_black_garlic",
  "qty_ordered": 1
}
```

Supported menu items:

| menu_item_id | Menu item | Inventory deducted per bowl |
| --- | --- | --- |
| `hakata_shio_tonkotsu` | 博多鹽味豚骨拉麺 | 豚骨湯底, 黑豚叉燒, 溏心蛋, 玉米, 昆布, 魚板 |
| `hakata_black_garlic` | 博多黑蒜拉麵 | 豚骨湯底, 黑蒜醬, 黑豚叉燒, 溏心蛋, 玉米, 昆布, 魚板 |
| `hakata_red_miso` | 博多赤味噌拉麺 | 味噌湯底, 黑豚叉燒, 溏心蛋, 玉米, 昆布, 魚板 |
| `hakata_miso_butter` | 博多味噌牛油拉麵 | 味噌湯底, 牛油, 黑豚叉燒, 溏心蛋, 玉米, 昆布, 魚板 |
| `kagoshima_kurobuta_cartilage` | 鹿兒島黑豚王軟骨拉麵 | 豚骨湯底, 豬肉軟骨, 溏心蛋, 玉米, 昆布, 魚板 |
| `akaoni_king` | 赤鬼王拉麵 | 辣豚骨湯底, 炒豬肉碎, 豆芽, 溫泉蛋, 玉米, 昆布, 魚板 |

## Required App Settings

```text
AzureWebJobsStorage=<storage-account-connection-string>
STORAGE_CONNECTION_STRING=<storage-account-connection-string>
DISCORD_WEBHOOK_URL=<discord-webhook-url>
```

`DISCORD_WEBHOOK_URL` is optional until Stage 3 testing. If it is missing, inventory updates still work and low-stock alerts are skipped.

## Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm start
```

Run the local test UI:

```bash
npm run ui
```

Then open:

```text
http://localhost:5173
```

The UI lets you choose a ramen menu item, enter quantity sold, submit the order, and review the ingredient-level inventory updates returned by the Azure Function.

Validate JavaScript syntax:

```bash
npm test
```

Seed ramen menu inventory rows:

```bash
npm run seed:menu
```

## Test The Deployed Function

Bash:

```bash
curl -X POST "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" \
  -H "Content-Type: application/json" \
  -d '{"menu_item_id":"hakata_black_garlic","qty_ordered":1}'
```

PowerShell:

```powershell
$body = @{
  menu_item_id = "hakata_black_garlic"
  qty_ordered = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" -Method Post -ContentType "application/json" -Body $body
```

## Portfolio Talking Points

- Built a serverless API endpoint with Azure Functions to process simulated POS transactions.
- Connected Azure Functions to Azure Table Storage for cloud-hosted inventory tracking.
- Implemented business logic to validate sales payloads, deduct stock, and detect low-stock conditions.
- Added webhook-based alerting for operations notifications.

More detail is available in [PROJECT_SHOWCASE_GUIDE.md](PROJECT_SHOWCASE_GUIDE.md).
