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
  "item": "pork_chashu",
  "qty_sold": 2
}
```

Example response:

```json
{
  "status": "ok",
  "item": "pork_chashu",
  "qty_sold": 2,
  "previous_stock": 100,
  "remaining_stock": 98,
  "reorder_level": 20,
  "low_stock": false,
  "alert_sent": false,
  "alert_error": null
}
```

## Azure Table Data Model

Table name: `Inventory`

| PartitionKey | RowKey | stock | reorderLevel |
| --- | --- | ---: | ---: |
| store-001 | pork_chashu | 100 | 20 |
| store-001 | ramen_noodle | 200 | 50 |
| store-001 | soft_drink | 80 | 15 |

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

Validate JavaScript syntax:

```bash
node --check src/functions/HttpReceiveSales.js
```

## Test The Deployed Function

Bash:

```bash
curl -X POST "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" \
  -H "Content-Type: application/json" \
  -d '{"item":"pork_chashu","qty_sold":3}'
```

PowerShell:

```powershell
$body = @{
  item = "pork_chashu"
  qty_sold = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" -Method Post -ContentType "application/json" -Body $body
```

## Portfolio Talking Points

- Built a serverless API endpoint with Azure Functions to process simulated POS transactions.
- Connected Azure Functions to Azure Table Storage for cloud-hosted inventory tracking.
- Implemented business logic to validate sales payloads, deduct stock, and detect low-stock conditions.
- Added webhook-based alerting for operations notifications.

More detail is available in [PROJECT_SHOWCASE_GUIDE.md](PROJECT_SHOWCASE_GUIDE.md).
