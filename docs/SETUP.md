# Setup Guide

## Prerequisites

- Azure subscription
- Azure Functions Core Tools
- Node.js
- Azure CLI
- Discord account for webhook testing

## Azure Resources

Create or confirm these resources:

- Resource group: `group1`
- Function App: `f1`
- Storage account: `posinventorydemo123`
- Azure Table: `Inventory`

## Inventory Table

Create rows in the `Inventory` table:

| PartitionKey | RowKey | stock | reorderLevel |
| --- | --- | ---: | ---: |
| store-001 | pork_chashu | 100 | 20 |
| store-001 | ramen_noodle | 200 | 50 |
| store-001 | soft_drink | 80 | 15 |

Use integer fields for `stock` and `reorderLevel`.

For ramen menu logic, seed the ingredient rows:

```powershell
$env:STORAGE_CONNECTION_STRING="<storage-account-connection-string>"
npm run seed:menu
```

## Function App Settings

In Azure Portal, open Function App `f1`, then go to Environment variables.

Add:

```text
AzureWebJobsStorage=<storage-account-connection-string>
STORAGE_CONNECTION_STRING=<storage-account-connection-string>
DISCORD_WEBHOOK_URL=<discord-webhook-url>
```

`AzureWebJobsStorage` is required by Azure Functions runtime. `STORAGE_CONNECTION_STRING` is used by the application logic to read and update inventory.

## Deploy

```powershell
cd C:\Users\Him\pos-inventory-alert
func azure functionapp publish f1 --javascript
```

## Verify

```bash
curl -X POST "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" \
  -H "Content-Type: application/json" \
  -d '{"menu_item_id":"hakata_black_garlic","qty_ordered":1}'
```

Check the `Inventory` table afterward to confirm ingredient rows such as `tonkotsu_broth`, `black_garlic_sauce`, `black_pork_chashu`, `corn`, `kombu`, and `narutomaki` were reduced.
