# Demo Script

## 1. Introduce The Problem

In many small operations, POS systems record what was sold, but inventory follow-up is still manual. This can delay reordering and cause stockouts.

## 2. Show The Cloud Flow

Explain the workflow:

```text
POS sale -> Azure Function -> Azure Table Storage -> Discord alert
```

## 3. Send A Test Sale

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

## 4. Explain The Response

Point out:

- `previous_stock`
- `remaining_stock`
- `reorder_level`
- `low_stock`
- `alert_sent`

For a menu order, explain that one customer order creates several ingredient-level inventory updates.

## 5. Confirm Cloud Database Update

Open Azure Portal:

```text
Storage account -> posinventorydemo123 -> Storage browser -> Tables -> Inventory
```

Show that the item stock changed.

## 6. Trigger Low Stock

Send a larger sale that drops an item below the reorder threshold.

Example:

```bash
curl -X POST "https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales" \
  -H "Content-Type: application/json" \
  -d '{"menu_item_id":"akaoni_king","qty_ordered":70}'
```

Expected result:

```json
{
  "low_stock": true,
  "alert_sent": true
}
```

## 7. Show Discord Alert

Open the Discord alert channel and show the low-stock message.

## 8. Close With Business Value

This project shows how cloud automation can reduce manual inventory checks and give operations staff faster visibility into stock risk.
