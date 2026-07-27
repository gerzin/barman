#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjFhNTViNWMtOWU1MC00OWU1LThkOGYtYmUwYzYxMTc4MjBkIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzg1MjM3MDkzLCJpYXQiOjE3ODUxNTA2OTN9.WLG6KyTcCroxEHpai1Lnm0KtAZ8cMPyFYObeeyNB_Vs"
PRODUCT_ID="3d8ee3af-8218-4a2b-a99b-591743195ad7"

echo "=== Step 4: Create table ==="
TABLE_RESP=$(curl -s -i -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Table 1"}' http://localhost:8080/api/v1/tables)
echo "$TABLE_RESP"

TABLE_ID=$(echo "$TABLE_RESP" | jq -r '.id // empty')
if [ -z "$TABLE_ID" ]; then
  TABLE_ID=$(echo "$TABLE_RESP" | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4)
fi
QR_TOKEN=$(echo "$TABLE_RESP" | jq -r '.qr_token // empty')
if [ -z "$QR_TOKEN" ]; then
  QR_TOKEN=$(echo "$TABLE_RESP" | grep -o '"qr_token":"[^"]*' | head -n 1 | cut -d'"' -f4)
fi

echo "Table ID: $TABLE_ID"
echo "QR Token: $QR_TOKEN"

echo "=== Step 5: Add an order to the table ==="
curl -i -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"quantity\":2,\"note\":\"no ice\"}" \
  http://localhost:8080/api/v1/tables/$TABLE_ID/orders

echo -e "\n=== Step 6: Get table bill ==="
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/tables/$TABLE_ID/bill

echo -e "\n=== Step 7: Get order logs ==="
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/tables/$TABLE_ID/logs

echo -e "\n=== Step 8: Test public QR view (no auth) ==="
curl -i http://localhost:8080/api/v1/public/tables/$QR_TOKEN

echo -e "\n=== Step 9: Test placing a public order (no auth) ==="
curl -i -X POST -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"quantity\":1,\"note\":\"customer self order\"}" \
  http://localhost:8080/api/v1/public/tables/$QR_TOKEN/orders

echo -e "\n=== Step 10: Close table ==="
curl -i -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/tables/$TABLE_ID/close

echo -e "\n=== Confirm closed table ==="
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/tables/$TABLE_ID

echo -e "\n=== Step 11: Test adding order to closed table fails ==="
curl -i -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"quantity\":1}" \
  http://localhost:8080/api/v1/tables/$TABLE_ID/orders

echo -e "\n=== Backend logs ==="
docker compose logs backend --tail 50
