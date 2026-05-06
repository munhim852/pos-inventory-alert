# Architecture

## Overview

The project uses Azure Functions as a serverless API layer. It receives simulated POS transactions, applies inventory business logic, persists changes to Azure Table Storage, and optionally sends Discord alerts.

## Components

| Component | Purpose |
| --- | --- |
| POS simulator or API test | Sends sales events as JSON |
| Azure Function App | Hosts the HTTP endpoint |
| `HttpReceiveSales` | Validates payloads and updates inventory |
| Azure Table Storage | Stores current stock and reorder thresholds |
| Discord webhook | Sends low-stock operations alerts |

## Request Flow

```text
1. POS sends {"item":"pork_chashu","qty_sold":2}
2. Azure Function validates the request
3. Function reads Inventory row: store-001 / pork_chashu
4. Function calculates new stock
5. Function updates Azure Table Storage
6. Function checks reorder threshold
7. If low stock, Function sends Discord webhook alert
8. API returns updated stock status
```

## Error Handling

- Invalid JSON returns HTTP 400.
- Missing or invalid `item` / `qty_sold` returns HTTP 400.
- Unknown inventory item returns HTTP 404.
- Database or webhook failures are logged and returned in structured response fields where appropriate.

## Security Notes

- Connection strings and webhook URLs are stored in Azure Function App environment variables.
- `local.settings.json` is ignored by Git and should not be committed.
- Discord webhook URLs should be rotated if accidentally exposed.

## Future Improvements

- Add a read-only inventory endpoint for dashboard use.
- Add per-store support using request-provided store IDs.
- Add idempotency keys to avoid double-counting repeated POS events.
- Add Application Insights queries for transaction volume and alert history.
