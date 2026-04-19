# ABUNDAPP — PRD & Plan de Ejecución Completo para Claude Code

> **Documento maestro del proyecto. Contiene TODO el contexto necesario para que Claude Code ejecute autónomamente.**

---

## 1. RESUMEN EJECUTIVO

### ¿Qué es Abundapp?
Abundapp (Aplicación de Abundancia Financiera) es un tracker de gastos familiares para Juan David Gómez y Nicolle (su esposa). Permite registrar gastos diarios desde el celular en ~15 segundos y visualizar dashboards de presupuesto vs gasto real con alertas de color/emojis.

### Stack Técnico Confirmado
```
📱 Usuario (celular iOS/Android)
    ↓ abre como app instalada
💎 PWA Custom (HTML/CSS/JS estático — hospedado gratis en GitHub Pages)
    ↓ fetch() requests
⚡ Google Apps Script (backend API gratuito — desplegado como Web App)
    ↓ lectura/escritura directa
📊 Google Sheets (base de datos — archivo .xlsx ya creado)
```

| Componente | Herramienta | Costo mensual |
|-----------|-------------|---------------|
| Frontend | PWA (HTML/CSS/JS vanilla) | $0 |
| Backend | Google Apps Script | $0 |
| Base de datos | Google Sheets | $0 |
| Hosting | GitHub Pages | $0 |
| **TOTAL** | | **$0/mes** |

### Usuarios
- **Juan David** — Registra gastos, administra presupuesto, ve reportes
- **Nicolle** — Registra gastos, ve reportes

### Principios de Diseño
- Mobile-first (480px max-width)
- Dark theme (bg: #0f172a)
- Registro de gasto en ≤15 segundos
- Emojis + colores como sistema de alertas (🟢🟡🟠🔴)
- Zero login — la PWA es de acceso directo

---

## 2. ARQUITECTURA DETALLADA DEL GOOGLE SHEET

El archivo `Abundapp_Gastos_Familia_2026_v2.xlsx` tiene **8 tabs**. A continuación la documentación completa de cada una.

### 2.1 Tab "Catálogo" (color: azul)
**Propósito:** Lista maestra de todas las categorías y subcategorías. Es la fuente de verdad para dropdowns.

**Estructura:**
| Fila | Col A: Tipo | Col B: Categoría | Col C: Subcategoría |
|------|-------------|-----------------|-------------------|
| 3 | Header | Header | Header |
| 4+ | "Fijo" o "Variable" | Nombre categoría | Nombre subcategoría |

**Total de registros:** 80 subcategorías agrupadas en 17 categorías.

**Las 17 categorías son:**
1. Inversiones & Ahorro (5 subcategorías)
2. Comer Fuera (3 subcategorías)
3. Compras Supermercado (1 subcategoría)
4. Hogar (11 subcategorías)
5. Ropa y Calzado (2 subcategorías)
6. Carro (8 subcategorías)
7. Transporte (2 subcategorías)
8. Entretenimiento (8 subcategorías)
9. Salud (5 subcategorías)
10. Belleza (4 subcategorías)
11. Mascotas (5 subcategorías)
12. Tarjetas de Crédito (5 subcategorías)
13. Finanzas (3 subcategorías)
14. Crecimiento Personal (3 subcategorías)
15. Infantiles (5 subcategorías)
16. Viajes (5 subcategorías)
17. Varios (5 subcategorías)

**Subcategorías completas por categoría:**

| Categoría | Subcategorías |
|-----------|--------------|
| Inversiones & Ahorro | Ahorro Fondo Emergencia, Ahorro familiar, Inversión Fondo Fideval Educación Hijos, Jubilación Fondo ANEFI, Préstamo Depar Ónix |
| Comer Fuera | Cafeterías y Snacks, Delivery de Comida, Restaurantes |
| Compras Supermercado | Compras supermercado |
| Hogar | Agua, Arriendo, Artículos del hogar, Celulares, Empleada Doméstica, Ferretería & Reformas, Internet, Luz Eléctrica, Mantenimiento, Muebles, Parqueadero |
| Ropa y Calzado | Accesorios, Ropa |
| Carro | Accesorios, Gasolina, Lavado de coches, Mantenimiento Carro, Multas de tráfico, Parqueaderos, Peajes, Seguro de carro Sweaden |
| Transporte | Transporte público, Uber |
| Entretenimiento | Cines, teatros, conciertos, Clubes y bares, Exposiciones y museos, Libros, Música y video, Pasatiempos, Recreación activa, Software y juegos |
| Salud | Gimnasio & Deporte, Medicinas, Odontología, Seguro Confiamed, Servicios médicos |
| Belleza | Cremas y menjurges, Peluquerías, Productos de belleza, Salón de belleza |
| Mascotas | Accesorios y juguetes, Alimento para mascotas, Peces, Servicios para mascotas, Servicios veterinarios |
| Tarjetas de Crédito | JD Black MasterCard 5401, JD Produ Visa Infinite 0562, JD Pacifico Visa Infinite 4802, Nico Black MasterCard 6811, Nico Diners 8109 |
| Finanzas | Contapp Juan David, Contapp Nicolle, Impuestos y Trámites |
| Crecimiento Personal | Coaching, Educación, Psicólogo |
| Infantiles | Alimentos para Bebé, Atención médica Bebé, Juguetes, Productos para niños / Pañales, Ropa para bebés |
| Viajes | Alquiler de coches, Entradas, Hotel, Servicios, Souvenirs |
| Varios | IESS JD y Nico, Ofrendas y Diezmos, Regalos, Varios, Colchón Margen Error Mes 5% |

**Filas fijas:** Encabezado en fila 3. Datos comienzan en fila 4. Última fila de datos: 83.
**Frozen panes:** A4

---

### 2.2 Tab "Transacciones" (color: verde)
**Propósito:** Registro crudo de cada gasto. Cada fila = un gasto. Los datos llegan desde la PWA vía Apps Script.

**Estructura:**
| Columna | Campo | Tipo | Fuente | Notas |
|---------|-------|------|--------|-------|
| A | ID | Número auto | Fórmula `=IF(B{row}="","",ROW()-3)` | Auto-incremental |
| B | Fecha | Date | PWA form | Formato fecha |
| C | Monto ($) | Number | PWA form | Formato `$#,##0.00` |
| D | Tipo | String | PWA form | "Fijo" o "Variable" |
| E | Categoría | String | PWA form | Debe existir en Catálogo col B |
| F | Subcategoría | String | PWA form | Debe existir en Catálogo col C |
| G | Nota | String | PWA form | Opcional, texto libre |
| H | Método de Pago | String | PWA form | Ver lista en Config |
| I | Registrado Por | String | PWA form | "Juan David" o "Nicolle" |
| J | Mes | String auto | Fórmula `=IF(B{row}="","",TEXT(B{row},"YYYY-MM"))` | Formato "2026-03" |

**Datos de ejemplo:** 10 transacciones de muestra en filas 4-13 (DEBEN ELIMINARSE antes de uso real).
**Fórmulas de auto-ID y auto-Mes:** Pre-llenadas en filas 14-499.
**Frozen panes:** A4

**IMPORTANTE para Apps Script:** Al escribir una nueva transacción, el script debe:
1. Encontrar la primera fila vacía (donde col B está vacía)
2. Escribir los datos en columnas B-I
3. Las columnas A (ID) y J (Mes) se calculan automáticamente por fórmula
4. NO escribir en columnas A ni J

---

### 2.3 Tab "Plantilla Presupuesto" (color: índigo)
**Propósito:** Presupuesto BASE mensual. Los montos default que se usan la mayoría de meses. Se copia a "Presupuesto Mes Activo" al iniciar cada mes.

**Estructura:**
| Columna | Campo | Tipo | Editable |
|---------|-------|------|----------|
| A | Tipo | String | No (viene de Catálogo) |
| B | Categoría | String | No |
| C | Subcategoría | String | No |
| D | Presupuesto Base ($) | Number | **SÍ — AZUL** (el usuario llena estos montos) |
| E | Notas | String | **SÍ — AZUL ITÁLICA** |

**Datos comienzan en fila 5.** Fila 4 = headers. Fila 85 = TOTAL con `=SUM(D5:D84)`.
**Total de filas de datos:** 80 (una por subcategoría).
**Frozen panes:** A5

**Lógica:** El usuario llena esta plantilla UNA VEZ con su presupuesto mensual típico. Luego cada mes, el "Presupuesto Mes Activo" arranca copiando estos valores. Si un mes específico necesita ajustes, el usuario los hace directamente en "Presupuesto Mes Activo" sin tocar la plantilla.

---

### 2.4 Tab "Presupuesto Mes Activo" (color: púrpura)
**Propósito:** El mes que se está viviendo AHORA. Contiene presupuesto proyectado, gasto real calculado automáticamente, varianza, % ejecución y alertas.

**Control de mes:**
- Celda B2 = Mes activo en formato "YYYY-MM" (ej: "2026-03")
- Celda E2 = Fórmula de días restantes del mes

**Estructura:**
| Columna | Campo | Fórmula / Tipo | Notas |
|---------|-------|----------------|-------|
| A | Tipo | Dato estático | "Fijo" o "Variable" |
| B | Categoría | Dato estático | Nombre de categoría |
| C | Subcategoría | Dato estático | Nombre de subcategoría |
| D | Presupuesto ($) | `='Plantilla Presupuesto'!D{row}` | **EDITABLE** — inicialmente copia la plantilla, pero el usuario puede sobreescribir con un número directo para ajustar ESTE mes |
| E | Real ($) | `=SUMIFS(Transacciones!C:C, Transacciones!J:J, $B$2, Transacciones!E:E, B{row}, Transacciones!F:F, C{row})` | Calcula automático sumando transacciones del mes activo que matchean categoría + subcategoría |
| F | Varianza ($) | `=D{row}-E{row}` | Positivo = bajo presupuesto, Negativo = sobregiro |
| G | % Ejecución | `=IF(D{row}=0, IF(E{row}>0,1,0), E{row}/D{row})` | Safe division para evitar #DIV/0! |
| H | Estado | Fórmula emoji (ver abajo) | Visual de semáforo |
| I | Barra | `=REPT("█",MIN(ROUND(G{row}*10,0),15))&REPT("░",MAX(10-ROUND(G{row}*10,0),0))` | Progress bar de texto |
| J | Notas Mes | Texto libre | **EDITABLE** — azul itálica |

**Fórmula de Estado (col H):**
```
=IF(D{row}=0,
    IF(E{row}>0, "🔴 Sin presupuesto", "⚪ —"),
    IF(G{row}<=0.5, "🟢 OK",
        IF(G{row}<=0.8, "🟡 Atención",
            IF(G{row}<=1, "🟠 Límite", "🔴 Sobregiro"))))
```

**Sistema de alertas de color:**
| Emoji | Rango % | Significado | Color condicional fondo |
|-------|---------|-------------|------------------------|
| 🟢 OK | 0-50% | Todo bien | Verde claro (#ECFDF5) |
| 🟡 Atención | 51-80% | Ponle ojo | Amarillo claro (#FFFBEB) |
| 🟠 Límite | 81-100% | Casi al máximo | Naranja claro (#FFF3E0) |
| 🔴 Sobregiro | >100% | Excedido | Rojo claro (#FEF2F2) |
| ⚪ — | Sin presupuesto ni gasto | Inactivo | Sin color |

**Conditional formatting aplicado en:**
- Columna G (% Ejecución): colores de fondo según el rango
- Columna F (Varianza): texto rojo + bold si es negativo

**Datos comienzan en fila 5.** Fila 4 = headers. Fila 85 = TOTAL.
**Frozen panes:** A5

---

### 2.5 Tab "Historial Mensual" (color: naranja)
**Propósito:** Archivo permanente de meses cerrados. Cada mes que termina, Apps Script copia el resumen aquí.

**Estructura:**
| Columna | Campo |
|---------|-------|
| A | Mes (formato "YYYY-MM") |
| B | Categoría |
| C | Subcategoría |
| D | Presupuesto ($) |
| E | Real ($) |
| F | Varianza ($) |
| G | % Ejecución |
| H | Estado (emoji) |

**Datos de ejemplo:** Febrero 2026 (5 filas + 1 total) como muestra.
**Estructura de cierre:** Cada mes agrega ~80 filas (subcategorías) + 1 fila de total mensual marcada con "📌 TOTAL [MES]".
**Frozen panes:** A5

**IMPORTANTE para Apps Script — Función de cierre de mes:**
1. Leer TODAS las filas de "Presupuesto Mes Activo" (5 a 84)
2. Para cada fila, capturar: mes, categoría, subcategoría, presupuesto, real, varianza, %, estado
3. Appendear al final de "Historial Mensual"
4. Agregar fila de TOTAL del mes
5. Luego resetear "Presupuesto Mes Activo": cambiar B2 al mes siguiente y reconectar columna D a la Plantilla

---

### 2.6 Tab "Dashboard" (color: amarillo)
**Propósito:** Vista ejecutiva con KPIs, resumen por categoría y gráficos.

**KPIs (filas 4-6):**
| KPI | Fórmula | Formato |
|-----|---------|---------|
| 💰 Presupuesto Total | `='Presupuesto Mes Activo'!D85` | $#,##0 |
| 💳 Gasto Real | `='Presupuesto Mes Activo'!E85` | $#,##0 |
| 📊 % Ejecutado | `='Presupuesto Mes Activo'!G85` | 0% |
| 💵 Disponible | `='Presupuesto Mes Activo'!F85` | $#,##0 |

**Resumen por Categoría (filas 9+):**
17 filas (una por categoría), con columnas: Categoría, Presupuesto, Real, Varianza, % Ejec., Estado emoji, Barra visual.
Las fórmulas usan SUMIFS agrupando por nombre de categoría contra "Presupuesto Mes Activo".

**Gráficos:**
1. BarChart: Presupuesto vs Real por Categoría (barras azules vs verdes)
2. PieChart: Distribución del Gasto Real (con % labels)

**Conditional formatting:** Igual que en Presupuesto Mes Activo.

---

### 2.7 Tab "Notas" (color: rosa)
**Propósito:** Espacio para apuntes manuales, reflexiones financieras y recordatorios.

**Estructura:**
| Col A | Col B | Col C | Col D |
|-------|-------|-------|-------|
| Fecha | Categoría/Tema | Nota | Prioridad |

**Prioridades:** 🔴 Alta, 🟡 Media, 🟢 Normal

---

### 2.8 Tab "Config" (color: gris)
**Propósito:** Listas de configuración y flujo de trabajo documentado.

**Contenido:**
- **Col A:** Métodos de Pago: Efectivo, Transferencia, Débito, TC JD Black MasterCard 5401, TC JD Produ Visa Infinite 0562, TC JD Pacifico Visa Infinite 4802, TC Nico Black MasterCard 6811, TC Nico Diners 8109
- **Col C:** Usuarios: Juan David, Nicolle
- **Col E:** Flujo mensual documentado (5 pasos)

---

## 3. FLUJO MENSUAL COMPLETO

```
INICIO DE MES (1ro de cada mes)
    │
    ├─ Apps Script: cerrarMes()
    │   ├─ 1. Lee "Presupuesto Mes Activo" completo
    │   ├─ 2. Copia todas las filas al "Historial Mensual"
    │   ├─ 3. Agrega fila TOTAL del mes cerrado
    │   ├─ 4. Cambia B2 al nuevo mes (ej: "2026-03" → "2026-04")
    │   └─ 5. Reconecta col D a Plantilla (reset fórmulas)
    │
    ├─ Usuario: Ajusta presupuestos del nuevo mes en col D (si necesita)
    │
DURANTE EL MES (diario)
    │
    ├─ Usuario: Abre Abundapp PWA desde el celular
    ├─ Usuario: Toca "+" → Llena form (monto, categoría, subcategoría, nota, método, quién)
    ├─ PWA: fetch POST a Apps Script URL
    ├─ Apps Script: Escribe fila en "Transacciones"
    ├─ Google Sheets: Fórmulas SUMIFS recalculan "Presupuesto Mes Activo" automáticamente
    └─ Usuario: Ve Dashboard actualizado en la PWA o en Google Sheets app
    
FIN DE MES
    │
    └─ Apps Script: cerrarMes() de nuevo → el ciclo se repite
```

---

## 4. DISEÑO DE LA PWA

### 4.1 Pantallas

| Pantalla | Secciones | Datos desde |
|----------|-----------|-------------|
| **Home** | Balance disponible, progress bar del mes, 3 KPIs (🟢🟡🔴 counts), carrusel de categorías top, últimos 5 gastos | Apps Script → GET getDashboard |
| **Reportes** | Gasto total, barras presupuesto vs real por categoría, alertas de sobregiro | Apps Script → GET getDashboard |
| **Historial** | Lista de transacciones agrupadas por día, búsqueda, filtros | Apps Script → GET getTransactions |
| **Notas** | Lista de notas con prioridades, formulario para agregar nota | Apps Script → GET/POST notas |
| **Modal Nuevo Gasto** | Form bottom-sheet: monto, fecha, categoría (dropdown), subcategoría (dependiente), nota, método pago, quién | Apps Script → POST addExpense |

### 4.2 Estilo Visual
- **Colores:** Dark theme — `--bg-deep: #0f172a`, `--accent: #38bdf8`, `--accent-green: #34d399`, `--accent-rose: #fb7185`
- **Fonts:** DM Sans (body) + Instrument Serif (títulos) — via Google Fonts
- **Layout:** Max-width 480px, centered, bottom nav con 4 tabs + FAB button
- **Efectos:** Noise texture overlay, ambient gradient glows, stagger animations on load

### 4.3 PWA Features
- `manifest.json` con name: "Abundapp", display: "standalone", theme_color: "#0f172a"
- Service worker básico para cache de assets estáticos
- Installable en home screen iOS/Android

### 4.4 Prototipo existente
Ya existe un archivo `Abundapp_PWA.html` con la UI completa en HTML/CSS/JS estático. Tiene datos de ejemplo hardcoded. Claude Code debe reemplazar los datos hardcoded con fetch() requests reales al Apps Script.

---

## 5. API DEL GOOGLE APPS SCRIPT

### 5.1 Endpoints necesarios

**POST requests (doPost):**

| Action | Campos JSON | Qué hace | Retorna |
|--------|------------|----------|---------|
| `addExpense` | date, amount, type, category, subcategory, note, paymentMethod, registeredBy | Escribe nueva fila en Transacciones (cols B-I) | `{ success: true, id: N }` |
| `addNote` | date, theme, note, priority | Escribe nueva fila en Notas | `{ success: true }` |
| `closeMonth` | (ninguno) | Ejecuta cierre de mes completo (ver flujo sección 3) | `{ success: true, closedMonth: "2026-03", newMonth: "2026-04" }` |

**GET requests (doGet):**

| Action | Parámetros | Qué retorna |
|--------|-----------|-------------|
| `getDashboard` | month (ej: "2026-03") | `{ budget: { total, spent, available, percent, daysLeft }, categories: [{ name, budget, spent, variance, percent, status }], alerts: [{ name, percent, message }], recentTransactions: [last 5] }` |
| `getTransactions` | month | `{ transactions: [{ id, date, amount, type, category, subcategory, note, payment, who }] }` |
| `getCategories` | (ninguno) | `{ categories: { "Comer Fuera": ["Cafeterías y Snacks", "Delivery de Comida", "Restaurantes"], ... } }` |
| `getNotes` | (ninguno) | `{ notes: [{ date, theme, note, priority }] }` |
| `getBudgetStatus` | month | `{ rows: [{ type, category, subcategory, budget, spent, variance, percent, status }] }` (todas las filas del Presupuesto Mes Activo) |

### 5.2 CORS y respuesta
Todas las respuestas deben incluir:
```javascript
ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
```

El doGet y doPost deben manejar CORS automáticamente (Apps Script Web Apps lo hacen nativo cuando se despliegan como "Anyone with the link").

### 5.3 Constante necesaria
```javascript
const SPREADSHEET_ID = 'XXXXX'; // El usuario llena esto con su Sheet ID real
```

---

## 6. SECURITY & RISK TIERS

| Item | Tier | Acción |
|------|------|--------|
| Crear archivos de código | 0 | Proceder |
| Google Sheet (lectura/escritura en Drive personal) | 1 | Proceder |
| Apps Script deployment como Web App ("Anyone with link") | 1 | Proceder — es solo para su uso personal |
| GitHub Pages deployment | 1 | Proceder |
| OAuth / API keys / secrets | 3 | NO APLICABLE — esta arquitectura no usa ninguno |
| Email automation | 3 | NO implementar sin aprobación |
| Borrar datos | 3 | Nunca borrar — siempre archivar |

---

## 7. PROMPTS DE EJECUCIÓN PARA CLAUDE CODE

### Prompt 1 — "Apps Script Backend"

```
Eres un experto en Google Apps Script. Necesito que crees el backend completo para "Abundapp", 
un tracker de gastos familiares.

LEE PRIMERO el archivo PRD_ABUNDAPP.md que contiene toda la documentación del proyecto,
incluyendo la estructura exacta del Google Sheet (8 tabs, 80 categorías, 1565 fórmulas).

CONTEXTO CLAVE:
- El Google Sheet se llama "Abundapp Gastos Familia 2026"
- SPREADSHEET_ID: [EL USUARIO PEGARÁ SU ID AQUÍ]
- El Sheet tiene 8 tabs: Catálogo, Transacciones, Plantilla Presupuesto, 
  Presupuesto Mes Activo, Historial Mensual, Dashboard, Notas, Config
- Tab "Transacciones": headers en fila 3, datos desde fila 4
  - Al escribir, solo escribir en columnas B-I (A y J son fórmulas auto)
  - Buscar primera fila vacía checando columna B
- Tab "Presupuesto Mes Activo": celda B2 = mes activo (formato "YYYY-MM")
  - Columna D = presupuesto, E = real (SUMIFS auto), G = % ejecución
  - 80 filas de datos (filas 5-84), fila 85 = totales
- Tab "Historial Mensual": se appendean filas al cerrar cada mes
- Tab "Catálogo": 80 subcategorías en 17 categorías (fila 4-83)

CREA el archivo Code.gs con:

1. CONSTANTES:
   - SPREADSHEET_ID (placeholder para que el usuario llene)
   - TAB_NAMES object con los nombres exactos de cada tab

2. doPost(e):
   Parsea e.postData.contents como JSON. Switch por action:
   
   a) "addExpense": 
      - Validar campos requeridos: date, amount, category, subcategory, paymentMethod, registeredBy
      - Type se determina por lookup en Catálogo (buscar la subcategoría y devolver col A)
      - Escribir en Transacciones cols B-I en la primera fila vacía
      - NO escribir en col A ni J (son fórmulas)
      - Retornar { success, id: número_de_fila - 3 }
   
   b) "addNote":
      - Escribir en Notas: date, theme, note, priority
      - Retornar { success }
   
   c) "closeMonth":
      - Leer "Presupuesto Mes Activo" filas 5-84 (todas las columnas A-H)
      - Leer el mes activo de B2
      - Appendear todas las filas en "Historial Mensual" con el mes en col A
      - Calcular y appendear fila total: "📌 TOTAL [MES_NOMBRE]"
      - Calcular el siguiente mes (ej: "2026-03" → "2026-04")
      - Actualizar B2 con el nuevo mes
      - Reconectar columna D con fórmulas apuntando a Plantilla (='Plantilla Presupuesto'!D{row})
      - Limpiar columna J (Notas Mes)
      - Retornar { success, closedMonth, newMonth }

3. doGet(e):
   Parsea e.parameter.action. Switch:
   
   a) "getDashboard" + month parameter:
      - Verificar que B2 del Presupuesto Mes Activo coincide con el month pedido
      - Leer fila 85 (totales): presupuesto total, real total, varianza, %
      - Calcular días restantes del mes
      - Leer filas 5-84: agrupar por categoría (col B) sumando presupuesto y real
      - Generar array de categorías con: name, budget, spent, variance, percent, status emoji
      - Identificar alertas: categorías con % > 80%
      - Leer últimas 5 transacciones de tab Transacciones (filtrar por mes)
      - Retornar JSON completo del dashboard
   
   b) "getTransactions" + month:
      - Leer tab Transacciones
      - Filtrar por columna J == month
      - Ordenar por fecha descendente
      - Retornar array de transacciones
   
   c) "getCategories":
      - Leer tab Catálogo completa
      - Agrupar por categoría: { "Comer Fuera": ["Cafeterías y Snacks", ...], ... }
      - Retornar objeto
   
   d) "getNotes":
      - Leer tab Notas
      - Retornar array de notas
   
   e) "getBudgetStatus" + month:
      - Leer "Presupuesto Mes Activo" filas 5-84 completas
      - Retornar todas las filas con todos los campos

4. HELPERS:
   - getSheet(tabName) — SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(tabName)
   - findFirstEmptyRow(sheet, column) — busca primera fila vacía en columna dada
   - lookupType(category, subcategory) — busca en Catálogo el tipo (Fijo/Variable)
   - getStatusEmoji(percent) — retorna el emoji correcto según el %
   - calculateNextMonth(currentMonth) — "2026-03" → "2026-04", "2026-12" → "2027-01"

5. ERROR HANDLING:
   - Try/catch en doPost y doGet
   - Si algo falla: { success: false, error: "mensaje descriptivo" }
   - Loggear errores con Logger.log()

TAMBIÉN CREA:
- SETUP_APPS_SCRIPT.md: Instrucciones PASO A PASO para que un no-developer configure esto en Google Apps Script editor
  1. Abrir el Sheet en Google Sheets
  2. Extensions > Apps Script
  3. Borrar el código default
  4. Pegar Code.gs
  5. Reemplazar SPREADSHEET_ID con el ID real
  6. Deploy > New deployment > Web app > "Anyone" > Deploy
  7. Copiar la URL del deployment
  8. Probar con curl

- TEST_COMMANDS.md: Curl commands para probar cada endpoint

⚠️ SAFETY: Tier 0-1 solamente. No secrets, no OAuth, no email.
ACCEPTANCE: Todos los endpoints retornan JSON correcto. addExpense crea fila en Transacciones.
```

---

### Prompt 2 — "Conectar PWA al Backend"

```
Tengo una PWA de tracking de gastos (Abundapp) y un Google Apps Script backend.
Necesito conectarlos para que la PWA funcione con datos reales.

LEE PRIMERO el archivo PRD_ABUNDAPP.md para entender toda la arquitectura.

El Apps Script Web App URL es: [PEGAR URL AQUÍ]
La PWA base está en Abundapp_PWA.html (ya tiene toda la UI, solo necesita conectar datos).

TAREAS:

1. REEMPLAZAR datos hardcoded con fetch() calls reales:
   - Home: cargar dashboard data al abrir (getDashboard)
   - Reportes: cargar datos de todas las categorías
   - Historial: cargar transacciones del mes agrupadas por día
   - Notas: cargar notas existentes

2. IMPLEMENTAR submitExpense():
   - POST a Apps Script con los datos del form
   - Spinner mientras envía
   - Toast "✓ Gasto registrado" al completar
   - Recargar dashboard después de registrar

3. IMPLEMENTAR dropdowns dinámicos:
   - Al cargar, fetch getCategories del Sheet
   - Poblar dropdown de categoría
   - On change categoría → filtrar subcategorías

4. LOADING STATES:
   - Skeleton screens mientras carga data
   - Spinner en botón submit
   - Error state con retry button

5. CREAR manifest.json para PWA installable

6. CREAR service-worker.js básico

7. CREAR icons placeholder (SVG simples)

ARCHIVOS A PRODUCIR:
- index.html (PWA completa conectada)
- manifest.json
- service-worker.js
- /icons/icon-192.svg
- /icons/icon-512.svg
- README.md (instrucciones de deployment)

TIER 0-1. No secrets, no OAuth.
```

---

### Prompt 3 — "Deploy en GitHub Pages"

```
Tengo los archivos de Abundapp PWA listos para deployment.

Crea instrucciones EXACTAS paso a paso para un no-developer para:

1. Crear cuenta en GitHub (si no tiene)
2. Crear repo "abundapp" 
3. Subir todos los archivos (index.html, manifest.json, service-worker.js, icons/)
4. Activar GitHub Pages en Settings > Pages > Deploy from main branch
5. Verificar en https://USERNAME.github.io/abundapp/
6. Agregar como app en:
   - iPhone: Safari > Share > Add to Home Screen
   - Android: Chrome > 3 dots > Add to Home Screen

Incluye screenshots descriptivos de cada paso.
TIER 0.
```

---

### Prompt 4 — "QA & Hardening"

```
Ejecuta QA completo del proyecto Abundapp.

LEE PRD_ABUNDAPP.md para contexto completo.

TESTS FUNCIONALES:
1. Submit 5 gastos diferentes → verificar aparecen en Google Sheet tab Transacciones
2. Dashboard carga y muestra datos reales del Sheet
3. Dropdown categoría → subcategoría se filtra correctamente (17 categorías, 80 subcategorías)
4. Monto $0 → validación impide envío
5. Monto negativo → validación impide envío
6. Campos obligatorios vacíos → error visual
7. Cargar Reportes → barras de presupuesto vs real correctas
8. Cargar Historial → transacciones agrupadas por día, orden descendente
9. Registrar gasto → dashboard se actualiza automáticamente
10. Abrir en Safari iOS → layout correcto, installable
11. Abrir en Chrome Android → layout correcto, installable

TESTS DE DATOS:
- SUMIFS en "Presupuesto Mes Activo" coinciden con suma manual de transacciones
- % ejecución = 0 cuando presupuesto es $0 (no #DIV/0!)
- Emojis de estado correctos según rangos definidos
- closeMonth archiva correctamente y resetea el mes

SEGURIDAD:
- Apps Script URL no expone datos sin action parameter
- No hay API keys ni secrets en el HTML
- Sheet no está compartido públicamente (solo Drive personal)

Documenta en QA_RESULTS.md.
TIER 0 — Solo lectura y verificación.
```

---

### Prompt 5 — "Mejoras V1.5"

```
Mejoras para Abundapp V1.5. Lee PRD_ABUNDAPP.md primero.

1. FILTROS en Historial: por categoría, por persona, por método de pago, por rango de fechas
2. BADGE de notificación en tab Reportes cuando hay categorías 🔴
3. GRÁFICO simple de gasto diario acumulado vs presupuesto lineal (canvas o SVG)
4. AGREGAR NOTA desde la PWA
5. ACCESO RÁPIDO: botón "Repetir último gasto" + top 3 gastos frecuentes
6. COMPARACIÓN MENSUAL: si hay datos en Historial Mensual, mostrar vs mes anterior

NO implementar email notifications (Tier 3).
TIER 0-2 solamente.
```

---

## 8. ARCHIVOS DEL PROYECTO

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `Abundapp_Gastos_Familia_2026_v2.xlsx` | Google Sheet completo (8 tabs, 1565 fórmulas) | ✅ Creado |
| `Abundapp_PWA.html` | Prototipo frontend con UI completa (datos estáticos) | ✅ Creado |
| `PRD_ABUNDAPP.md` | Este documento — contexto completo del proyecto | ✅ Este archivo |
| `Code.gs` | Google Apps Script backend | ⏳ Claude Code crea |
| `index.html` | PWA final conectada al backend | ⏳ Claude Code crea |
| `manifest.json` | PWA manifest | ⏳ Claude Code crea |
| `service-worker.js` | Cache de assets | ⏳ Claude Code crea |
| `SETUP_APPS_SCRIPT.md` | Guía de setup del backend | ⏳ Claude Code crea |
| `TEST_COMMANDS.md` | Curl para testing | ⏳ Claude Code crea |
| `QA_RESULTS.md` | Resultados de QA | ⏳ Claude Code crea |

---

## 9. TIMELINE

| Fase | Qué | Prompt | Tiempo estimado |
|------|-----|--------|----------------|
| 1 | Setup Sheet en Google Drive + llenar presupuesto | (usuario manual) | 20 min |
| 2 | Apps Script Backend | Prompt 1 | 1-2 hrs |
| 3 | Conectar PWA + pulir | Prompt 2 | 2-3 hrs |
| 4 | Deploy GitHub Pages | Prompt 3 | 10 min |
| 5 | QA | Prompt 4 | 30 min |
| 6 | Mejoras V1.5 | Prompt 5 | 2-3 hrs |

---

## 10. DEFINICIÓN DE ÉXITO (DONE)

- [ ] Registrar gasto desde celular en ≤15 segundos
- [ ] Gasto aparece en Google Sheet automáticamente
- [ ] Dashboard muestra presupuesto vs real con emojis y colores
- [ ] Alertas visuales cuando una categoría supera 80% o 100%
- [ ] Historial de transacciones navegable
- [ ] Notas manuales funcionan
- [ ] Cierre de mes archiva correctamente
- [ ] $0/mes de costo operativo
- [ ] Funciona en iPhone Y Android como app installable
- [ ] Juan David Y Nicolle pueden registrar gastos independientemente
