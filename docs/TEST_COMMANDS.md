# Abundapp — Test Commands

> Reemplaza `YOUR_APPS_SCRIPT_URL` con la URL real del deployment de Apps Script.
> La API key por defecto es `abundapp-familia-2026` (cámbiala en Code.gs).

## Variables

```bash
URL="YOUR_APPS_SCRIPT_URL"
KEY="abundapp-familia-2026"
```

---

## POST — Registrar Gasto (formato nuevo)

### Happy path
```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{
    "key": "'$KEY'",
    "action": "addExpense",
    "data": {
      "date": "2026-03-16",
      "amount": 25.50,
      "category": "Comer Fuera",
      "subcategory": "Restaurantes",
      "note": "Almuerzo test",
      "paymentMethod": "Efectivo",
      "registeredBy": "Juan David"
    }
  }'
```
**Esperado:** `{"success":true,"id":...,"message":"Gasto registrado"}`

### Error: monto = 0
```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{"key":"'$KEY'","action":"addExpense","data":{"date":"2026-03-16","amount":0,"category":"Hogar","subcategory":"Agua","registeredBy":"Juan David"}}'
```
**Esperado:** `{"success":false,"error":"Monto debe ser mayor a 0"}`

### Error: categoría inexistente
```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{"key":"'$KEY'","action":"addExpense","data":{"date":"2026-03-16","amount":10,"category":"FAKE","subcategory":"FAKE","registeredBy":"Juan David"}}'
```
**Esperado:** `{"success":false,"error":"Categoría/subcategoría no encontrada..."}`

### Error: API key incorrecta
```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{"key":"wrong-key","action":"addExpense","data":{}}'
```
**Esperado:** `{"success":false,"error":"No autorizado"}`

### Error: campo requerido faltante
```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{"key":"'$KEY'","action":"addExpense","data":{"date":"2026-03-16","amount":10}}'
```
**Esperado:** `{"success":false,"error":"Campo requerido: category"}`

---

## POST — Registrar Nota

```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{
    "key": "'$KEY'",
    "action": "addNote",
    "data": {
      "theme": "Test",
      "note": "Esta es una nota de prueba",
      "priority": "🟡 Media"
    }
  }'
```
**Esperado:** `{"success":true,"message":"Nota guardada"}`

---

## POST — Actualizar Presupuesto

### En Presupuesto Mes Activo
```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{
    "key": "'$KEY'",
    "action": "setBudget",
    "data": {
      "subcategory": "Restaurantes",
      "amount": 350
    }
  }'
```
**Esperado:** `{"success":true,"message":"Presupuesto actualizado: Restaurantes = $350"}`

### En Plantilla Base (permanente)
```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{
    "key": "'$KEY'",
    "action": "setBudget",
    "data": {
      "subcategory": "Restaurantes",
      "amount": 350,
      "template": true
    }
  }'
```

---

## POST — Cerrar Mes

```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{"key":"'$KEY'","action":"closeMonth"}'
```
**Esperado:** `{"success":true,"closedMonth":"2026-03","newMonth":"2026-04",...}`

### Idempotencia (correr 2 veces)
```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '{"key":"'$KEY'","action":"closeMonth"}'
```
**Esperado 2da vez:** `{"success":false,"error":"El mes 2026-03 ya fue archivado..."}`

---

## GET — Dashboard

```bash
curl -L "$URL?key=$KEY&action=getDashboard&month=2026-03"
```
**Esperado:** JSON con `budget`, `categories`, `alerts`, `recentTransactions`

---

## GET — Transacciones

```bash
curl -L "$URL?key=$KEY&action=getTransactions&month=2026-03"
```
**Esperado:** JSON con `transactions` array ordenado por fecha DESC

---

## GET — Categorías

```bash
curl -L "$URL?key=$KEY&action=getCategories"
```
**Esperado:** JSON con `categories` object (17 keys) y `typeMap`

---

## GET — Notas

```bash
curl -L "$URL?key=$KEY&action=getNotes"
```

---

## GET — Estado del Presupuesto (detalle subcategorías)

```bash
curl -L "$URL?key=$KEY&action=getBudgetStatus&month=2026-03"
```
**Esperado:** JSON con `rows` (80 subcategorías), `totals`, `daysLeft`

---

## GET — Config (métodos de pago y usuarios)

```bash
curl -L "$URL?key=$KEY&action=getConfig"
```

---

## Legacy — Formato app existente

### Pull (GET sin params)
```bash
curl -L "$URL"
```
**Esperado:** `{"status":"ok","gastos":[...]}`

### Push (POST array de gastos)
```bash
curl -L -X POST "$URL" \
  -H "Content-Type: text/plain" \
  -d '[{"id":"test-1","fecha":"2026-03-16","usuario":"Juan David","categoria":"Comer Fuera","subcategoria":"Restaurantes","monto":15,"nota":"Test legacy","tipo":"Gasto"}]'
```
**Esperado:** `{"status":"ok","escritos":1}`

---

## QA Checklist Manual (PWA)

- [ ] Abrir app → dashboard carga con datos reales
- [ ] Registrar gasto → toast "Gasto registrado" → aparece en historial
- [ ] Seleccionar categoría → subcategorías se filtran
- [ ] Monto $0 → error visual, no se envía
- [ ] Sin categoría → error visual
- [ ] Ver Reportes → barras presupuesto vs real
- [ ] Ver Historial → gastos agrupados por día
- [ ] Buscar en Historial → filtros funcionan
- [ ] Ver Presupuestos → barras con semáforo 🟢🟡🟠🔴
- [ ] Verificar en Google Sheet que el gasto aparece en Transacciones
- [ ] Offline → mensaje de error claro
- [ ] Instalar como PWA en iPhone (Safari → Add to Home Screen)
- [ ] Instalar como PWA en Android (Chrome → Add to Home Screen)
