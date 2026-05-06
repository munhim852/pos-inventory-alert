# Codex Handoff Notes

## Project

POS Inventory Alerting System. This is a portfolio / cloud showcase project focused on operations support, POS-style transaction processing, Azure serverless logic, cloud database updates, and low-stock alerting.

## Current Goal

Show business logic and cloud ability, not just coding language skill.

Main demo flow:

```text
Simulated POS sale -> Azure Function -> Azure Table Storage inventory update -> Discord low-stock alert
```

## Important Azure Resources

- Azure Function App: `f1`
- Resource group: `group1`
- Region: Canada Central
- Storage account: `posinventorydemo123`
- Azure Table: `Inventory`
- HTTP function: `HttpReceiveSales`
- Live endpoint:

```text
https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales
```

## Important Files

- `src/functions/HttpReceiveSales.js` - main Azure Function logic
- `README.md` - GitHub-facing project overview
- `PROJECT_SHOWCASE_GUIDE.md` - full project/stage writeup
- `docs/ARCHITECTURE.md` - architecture details
- `docs/SETUP.md` - setup and deploy steps
- `docs/DEMO_SCRIPT.md` - interview/demo script
- `.env.example` - example env vars only, no real secrets

## Current Implementation

`HttpReceiveSales`:

- Accepts POST JSON payloads:

```json
{
  "item": "pork_chashu",
  "qty_sold": 2
}
```

- Validates JSON and required fields.
- Reads inventory item from Azure Table Storage.
- Uses:
  - `PartitionKey = store-001`
  - `RowKey = item`
- Deducts `qty_sold` from `stock`.
- Updates the table row.
- Returns:
  - `previous_stock`
  - `remaining_stock`
  - `reorder_level`
  - `low_stock`
  - `alert_sent`
  - `alert_error`
- Sends Discord webhook alert when `remaining_stock <= reorder_level`, if `DISCORD_WEBHOOK_URL` is configured.

## Required Function App Settings

Do not commit real values.

```text
AzureWebJobsStorage=<storage-account-connection-string>
STORAGE_CONNECTION_STRING=<storage-account-connection-string>
DISCORD_WEBHOOK_URL=<discord-webhook-url>
```

Notes:

- `AzureWebJobsStorage` is required by the Azure Functions runtime.
- `STORAGE_CONNECTION_STRING` is used by app logic to access Azure Table Storage.
- `DISCORD_WEBHOOK_URL` is optional until Phase 3 alert testing.

## Inventory Seed Data

Azure Table: `Inventory`

| PartitionKey | RowKey | stock | reorderLevel |
| --- | --- | ---: | ---: |
| store-001 | pork_chashu | 100 | 20 |
| store-001 | ramen_noodle | 200 | 50 |
| store-001 | soft_drink | 80 | 15 |

## Commands

Install dependencies:

```powershell
npm install
```

Run locally:

```powershell
npm start
```

Syntax check:

```powershell
node --check src\functions\HttpReceiveSales.js
```

Deploy:

```powershell
func azure functionapp publish f1 --javascript
```

Test with PowerShell:

```powershell
$body = @{
  item = "pork_chashu"
  qty_sold = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" -Method Post -ContentType "application/json" -Body $body
```

Test with Bash:

```bash
curl -X POST "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" \
  -H "Content-Type: application/json" \
  -d '{"item":"pork_chashu","qty_sold":3}'
```

## GitHub

Repository:

```text
https://github.com/munhim852/pos-inventory-alert
```

Current branch:

```text
main
```

## Completed Stages

Stage 1: Cloud receiver

- Azure Function receives POS-style JSON.
- Function deployed and visible in Azure Portal.

Stage 2: Cloud database logic

- Azure Table Storage configured.
- Function deducts inventory stock and updates cloud table.
- Tested successful response with `remaining_stock`.

Stage 3: Low-stock alerting

- Code support added for Discord webhook alerting.
- Still needs real `DISCORD_WEBHOOK_URL` configured and final low-stock alert test.

Stage 4: Dashboard

- Planned, not built yet.

## Next Best Tasks

1. Configure `DISCORD_WEBHOOK_URL` in Azure Function App `f1`.
2. Deploy if code changed.
3. Test a sale that drops stock below reorder level.
4. Confirm Discord alert.
5. Add a dashboard or read-only inventory endpoint.

## Safety

- Do not commit `local.settings.json`.
- Do not commit real Discord webhook URLs or Azure connection strings.
- `.gitignore` already excludes common secret files and `node_modules`.
