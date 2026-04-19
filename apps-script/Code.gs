// ============================================================
// ABUNDAPP — Google Apps Script Backend
// Sheet v3 MASTER: 1yk_KJ-aaNhOy2bENo_-QBPSmSZk2eW5qSK3rIRX4p58
// ============================================================

// ⚠️ CONFIGURAR ESTOS VALORES
const SPREADSHEET_ID = '1yk_KJ-aaNhOy2bENo_-QBPSmSZk2eW5qSK3rIRX4p58';
const API_KEY = 'abundapp-familia-2026'; // Cambiar por algo más seguro

const TAB = {
  CATALOGO: 'Catálogo',
  TRANSACCIONES: 'Transacciones',
  PLANTILLA: 'Plantilla Presupuesto',
  PRESUPUESTO: 'Presupuesto Mes Activo',
  HISTORIAL: 'Historial Mensual',
  DASHBOARD: 'Dashboard',
  NOTAS: 'Notas',
  CONFIG: 'Config'
};

// ============================================================
// doPost — Recibe POST requests
// ============================================================
function doPost(e) {
  try {
    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ success: false, error: 'JSON inválido en el body' });
    }

    if (body.key !== API_KEY) {
      return jsonResponse({ success: false, error: 'No autorizado' });
    }

    switch (body.action) {
      case 'addExpense':
        return jsonResponse(addExpense(body.data));
      case 'addNote':
        return jsonResponse(addNote(body.data));
      case 'closeMonth':
        return jsonResponse(closeMonth());
      case 'setBudget':
        return jsonResponse(setBudget(body.data));
      case 'deleteExpense':
        return jsonResponse(deleteExpense(body.data));
      default:
        return jsonResponse({ success: false, error: 'Acción no reconocida: ' + body.action });
    }
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return jsonResponse({ success: false, error: 'Error del servidor: ' + err.message });
  }
}

// ============================================================
// doGet — Recibe GET requests
// ============================================================
function doGet(e) {
  try {
    var p = e.parameter;

    if (p.key !== API_KEY) {
      return jsonResponse({ success: false, error: 'No autorizado' });
    }

    switch (p.action) {
      case 'getDashboard':
        return jsonResponse(getDashboard(p.month));
      case 'getTransactions':
        return jsonResponse(getTransactions(p.month));
      case 'getCategories':
        return jsonResponse(getCategories());
      case 'getNotes':
        return jsonResponse(getNotes());
      case 'getBudgetStatus':
        return jsonResponse(getBudgetStatus(p.month));
      case 'getConfig':
        return jsonResponse(getConfig());
      case 'checkMonth':
        return jsonResponse(checkMonth());
      default:
        return jsonResponse({ success: false, error: 'Acción no reconocida: ' + p.action });
    }
  } catch (err) {
    Logger.log('doGet error: ' + err.message);
    return jsonResponse({ success: false, error: 'Error del servidor: ' + err.message });
  }
}

// ============================================================
// ACTION HANDLERS — POST
// ============================================================

function addExpense(data) {
  // Validar campos requeridos
  var required = ['date', 'amount', 'category', 'subcategory', 'registeredBy'];
  for (var i = 0; i < required.length; i++) {
    if (!data[required[i]]) {
      return { success: false, error: 'Campo requerido: ' + required[i] };
    }
  }

  var amount = parseFloat(data.amount);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Monto debe ser mayor a 0' };
  }
  if (amount > 99999) {
    return { success: false, error: 'Monto excede el límite ($99,999)' };
  }

  // Validar que categoría existe en Catálogo
  var tipo = lookupType(data.category, data.subcategory);
  if (!tipo) {
    return { success: false, error: 'Categoría/subcategoría no encontrada en Catálogo: ' + data.category + ' / ' + data.subcategory };
  }

  // Adquirir lock para evitar race condition
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    return { success: false, error: 'Servidor ocupado, intenta de nuevo en unos segundos' };
  }

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(TAB.TRANSACCIONES);
    var emptyRow = findFirstEmptyRow(sheet, 2); // Col B = Fecha

    if (emptyRow > 499) {
      return { success: false, error: 'Hoja de transacciones llena. Contacta al administrador.' };
    }

    // Escribir en columnas B-I (A y J son fórmulas auto)
    sheet.getRange(emptyRow, 2, 1, 8).setValues([[
      new Date(data.date),           // B: Fecha
      amount,                         // C: Monto
      tipo,                           // D: Tipo (Fijo/Variable)
      data.category,                  // E: Categoría
      data.subcategory,               // F: Subcategoría
      data.note || '',                // G: Nota
      data.paymentMethod || '',       // H: Método de Pago
      data.registeredBy               // I: Registrado Por
    ]]);

    var id = emptyRow - 3;
    Logger.log('Gasto registrado: ID=' + id + ', $' + amount + ', ' + data.category);

    return { success: true, id: id, message: 'Gasto registrado' };
  } finally {
    lock.releaseLock();
  }
}

function deleteExpense(data) {
  if (!data.id) {
    return { success: false, error: 'Campo requerido: id' };
  }

  var targetId = String(data.id).replace('sheet-', ''); // Acepta 'sheet-5' o '5'

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    return { success: false, error: 'Servidor ocupado, intenta de nuevo' };
  }

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(TAB.TRANSACCIONES);
    var lastRow = sheet.getLastRow();

    if (lastRow < 4) {
      return { success: false, error: 'No hay transacciones' };
    }

    // Buscar fila por ID (columna A)
    var ids = sheet.getRange(4, 1, lastRow - 3, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === targetId) {
        var row = i + 4;
        // Limpiar columnas B-I (dejar A y J como fórmulas)
        sheet.getRange(row, 2, 1, 8).clearContent();
        Logger.log('Gasto eliminado: ID=' + targetId + ' fila=' + row);
        return { success: true, message: 'Gasto eliminado', id: targetId };
      }
    }

    return { success: false, error: 'Gasto no encontrado con ID: ' + targetId };
  } finally {
    lock.releaseLock();
  }
}

function addNote(data) {
  if (!data.theme || !data.note) {
    return { success: false, error: 'Campos requeridos: theme, note' };
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TAB.NOTAS);
  var emptyRow = findFirstEmptyRow(sheet, 1); // Col A = Fecha

  sheet.getRange(emptyRow, 1, 1, 4).setValues([[
    data.date ? new Date(data.date) : new Date(),
    data.theme,
    data.note,
    data.priority || '🟢 Normal'
  ]]);

  return { success: true, message: 'Nota guardada' };
}

function setBudget(data) {
  if (!data.subcategory || data.amount === undefined) {
    return { success: false, error: 'Campos requeridos: subcategory, amount' };
  }

  var amount = parseFloat(data.amount);
  if (isNaN(amount) || amount < 0) {
    return { success: false, error: 'Monto de presupuesto inválido' };
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Determinar en qué tab escribir
  var targetTab = data.template ? TAB.PLANTILLA : TAB.PRESUPUESTO;
  var sheet = ss.getSheetByName(targetTab);
  var dataRange = sheet.getRange(5, 3, 80, 1).getValues(); // Col C = Subcategoría

  for (var i = 0; i < dataRange.length; i++) {
    if (dataRange[i][0] === data.subcategory) {
      var row = i + 5;
      sheet.getRange(row, 4).setValue(amount); // Col D = Presupuesto
      Logger.log('Presupuesto actualizado: ' + data.subcategory + ' = $' + amount + ' en ' + targetTab);
      return { success: true, message: 'Presupuesto actualizado: ' + data.subcategory + ' = $' + amount };
    }
  }

  return { success: false, error: 'Subcategoría no encontrada: ' + data.subcategory };
}

function closeMonth() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var presupSheet = ss.getSheetByName(TAB.PRESUPUESTO);
  var histSheet = ss.getSheetByName(TAB.HISTORIAL);

  // Leer mes activo
  var mesActivo = presupSheet.getRange('B2').getValue();
  if (!mesActivo) {
    return { success: false, error: 'No hay mes activo definido en B2' };
  }
  mesActivo = String(mesActivo);

  // Idempotencia: verificar si ya fue archivado
  var histData = histSheet.getDataRange().getValues();
  for (var i = histData.length - 1; i >= 4; i--) {
    if (String(histData[i][0]).indexOf('TOTAL') > -1) {
      // Encontramos la última fila TOTAL — verificar si es de este mes
      if (String(histData[i][0]).indexOf(mesActivo) > -1 ||
          (i > 0 && String(histData[i-1][0]) === mesActivo)) {
        return { success: false, error: 'El mes ' + mesActivo + ' ya fue archivado. No se duplica.' };
      }
      break;
    }
  }

  // Leer Presupuesto Mes Activo filas 5-84 (80 subcategorías) incluyendo Notas (col J)
  var budgetData = presupSheet.getRange(5, 1, 80, 10).getValues(); // A-J

  // Escribir en Historial Mensual (ahora con 9 columnas: incluye Notas)
  var lastHistRow = findFirstEmptyRow(histSheet, 1);
  var rowsToWrite = [];

  for (var j = 0; j < budgetData.length; j++) {
    var row = budgetData[j];
    // Solo archivar filas que tengan presupuesto > 0 o gasto real > 0
    var presup = parseFloat(row[3]) || 0;
    var real = parseFloat(row[4]) || 0;
    if (presup > 0 || real > 0) {
      rowsToWrite.push([
        mesActivo,          // A: Mes
        row[1],             // B: Categoría
        row[2],             // C: Subcategoría
        presup,             // D: Presupuesto
        real,               // E: Real
        presup - real,      // F: Varianza
        presup > 0 ? real / presup : (real > 0 ? 1 : 0), // G: %
        row[7],             // H: Estado
        row[9] || ''        // I: Notas del mes (col J del Presupuesto)
      ]);
    }
  }

  // Agregar fila total
  var totalPresup = presupSheet.getRange('D85').getValue() || 0;
  var totalReal = presupSheet.getRange('E85').getValue() || 0;
  var totalPct = totalPresup > 0 ? totalReal / totalPresup : 0;
  var mesNombre = getMonthName(mesActivo);

  rowsToWrite.push([
    '📌 TOTAL ' + mesNombre.toUpperCase(),
    '', '',
    totalPresup,
    totalReal,
    totalPresup - totalReal,
    totalPct,
    getStatusEmoji(totalPct),
    ''
  ]);

  if (rowsToWrite.length > 0) {
    histSheet.getRange(lastHistRow, 1, rowsToWrite.length, 9).setValues(rowsToWrite);
  }

  // Calcular siguiente mes
  var nextMonth = calculateNextMonth(mesActivo);

  // Actualizar B2 al nuevo mes
  presupSheet.getRange('B2').setValue(nextMonth);

  // Reconectar columna D con Plantilla (reset fórmulas)
  for (var k = 5; k <= 84; k++) {
    presupSheet.getRange(k, 4).setFormula("='Plantilla Presupuesto'!D" + k);
  }

  // Limpiar columna J (Notas Mes)
  presupSheet.getRange(5, 10, 80, 1).clearContent();

  Logger.log('Mes cerrado: ' + mesActivo + ' → nuevo mes: ' + nextMonth);

  return {
    success: true,
    closedMonth: mesActivo,
    newMonth: nextMonth,
    archivedRows: rowsToWrite.length,
    message: 'Mes ' + mesActivo + ' cerrado. Nuevo mes activo: ' + nextMonth
  };
}

// ============================================================
// ACTION HANDLERS — GET
// ============================================================

function getDashboard(month) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Leer KPIs del Dashboard tab (filas 4-5)
  var dashSheet = ss.getSheetByName(TAB.DASHBOARD);
  var kpiRow = dashSheet.getRange(5, 1, 1, 7).getValues()[0];

  var budget = {
    total: parseFloat(kpiRow[0]) || 0,
    spent: parseFloat(kpiRow[2]) || 0,
    percent: parseFloat(kpiRow[4]) || 0,
    available: parseFloat(kpiRow[6]) || 0
  };

  // Leer mes activo y días restantes del Presupuesto tab
  var presupSheet = ss.getSheetByName(TAB.PRESUPUESTO);
  var mesActivo = String(presupSheet.getRange('B2').getValue());
  var daysLeft = presupSheet.getRange('E2').getValue() || 0;

  budget.month = mesActivo;
  budget.daysLeft = daysLeft;

  // Leer resumen por categoría del Dashboard tab (filas 10-26)
  var catData = dashSheet.getRange(10, 1, 17, 7).getValues();
  var categories = [];
  var alerts = [];

  for (var i = 0; i < catData.length; i++) {
    var row = catData[i];
    var catBudget = parseFloat(row[1]) || 0;
    var catSpent = parseFloat(row[2]) || 0;
    var catVariance = parseFloat(row[3]) || 0;
    var catPercent = parseFloat(row[4]) || 0;
    var catStatus = row[5] || '';

    if (catBudget > 0 || catSpent > 0) {
      var cat = {
        name: row[0],
        budget: catBudget,
        spent: catSpent,
        variance: catVariance,
        percent: catPercent,
        status: catStatus
      };
      categories.push(cat);

      // Alertas: categorías > 80%
      if (catPercent > 0.8) {
        alerts.push({
          name: row[0],
          percent: catPercent,
          status: catStatus,
          message: catPercent > 1
            ? row[0] + ' — Sobregiro ' + Math.round((catPercent - 1) * 100) + '%'
            : row[0] + ' — ' + Math.round(catPercent * 100) + '% usado'
        });
      }
    }
  }

  // Últimas 5 transacciones
  var txSheet = ss.getSheetByName(TAB.TRANSACCIONES);
  var txData = txSheet.getRange(4, 1, txSheet.getLastRow() - 3, 10).getValues();
  var recentTx = [];

  // Filtrar por mes activo y tomar las últimas 5
  for (var t = txData.length - 1; t >= 0 && recentTx.length < 5; t--) {
    var txRow = txData[t];
    if (txRow[1] && String(txRow[9]) === mesActivo) {
      recentTx.push({
        id: txRow[0],
        date: formatDate(txRow[1]),
        amount: parseFloat(txRow[2]) || 0,
        type: txRow[3],
        category: txRow[4],
        subcategory: txRow[5],
        note: txRow[6],
        payment: txRow[7],
        who: txRow[8]
      });
    }
  }

  return {
    success: true,
    budget: budget,
    categories: categories,
    alerts: alerts,
    recentTransactions: recentTx
  };
}

function getTransactions(month) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TAB.TRANSACCIONES);
  var lastRow = sheet.getLastRow();

  if (lastRow < 4) {
    return { success: true, transactions: [] };
  }

  var data = sheet.getRange(4, 1, lastRow - 3, 10).getValues();
  var transactions = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (!row[1]) continue; // Skip empty rows
    var rowMonth = String(row[9]);
    if (month && rowMonth !== month) continue;

    transactions.push({
      id: row[0],
      date: formatDate(row[1]),
      amount: parseFloat(row[2]) || 0,
      type: row[3],
      category: row[4],
      subcategory: row[5],
      note: row[6],
      payment: row[7],
      who: row[8],
      month: rowMonth
    });
  }

  // Ordenar por fecha descendente
  transactions.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  return { success: true, transactions: transactions, count: transactions.length };
}

function getCategories() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TAB.CATALOGO);
  var data = sheet.getRange(4, 1, 80, 3).getValues(); // Fila 4-83, cols A-C

  var categories = {};
  var typeMap = {};

  for (var i = 0; i < data.length; i++) {
    var tipo = data[i][0];
    var cat = data[i][1];
    var sub = data[i][2];
    if (!cat || !sub) continue;

    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(sub);
    typeMap[cat + '|' + sub] = tipo;
  }

  return { success: true, categories: categories, typeMap: typeMap };
}

function getNotes() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TAB.NOTAS);
  var lastRow = sheet.getLastRow();

  if (lastRow < 5) {
    return { success: true, notes: [] };
  }

  var data = sheet.getRange(5, 1, lastRow - 4, 4).getValues();
  var notes = [];

  for (var i = 0; i < data.length; i++) {
    if (!data[i][0]) continue;
    notes.push({
      date: formatDate(data[i][0]),
      theme: data[i][1],
      note: data[i][2],
      priority: data[i][3]
    });
  }

  return { success: true, notes: notes };
}

function getBudgetStatus(month) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TAB.PRESUPUESTO);

  var mesActivo = String(sheet.getRange('B2').getValue());
  if (month && month !== mesActivo) {
    return { success: false, error: 'El mes solicitado (' + month + ') no coincide con el mes activo (' + mesActivo + ')' };
  }

  var data = sheet.getRange(5, 1, 80, 10).getValues();
  var rows = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    rows.push({
      type: r[0],
      category: r[1],
      subcategory: r[2],
      budget: parseFloat(r[3]) || 0,
      spent: parseFloat(r[4]) || 0,
      variance: parseFloat(r[5]) || 0,
      percent: parseFloat(r[6]) || 0,
      status: r[7],
      bar: r[8],
      notes: r[9] || ''
    });
  }

  // Totales (fila 85)
  var totals = sheet.getRange(85, 1, 1, 8).getValues()[0];

  return {
    success: true,
    month: mesActivo,
    daysLeft: sheet.getRange('E2').getValue() || 0,
    rows: rows,
    totals: {
      budget: parseFloat(totals[3]) || 0,
      spent: parseFloat(totals[4]) || 0,
      variance: parseFloat(totals[5]) || 0,
      percent: parseFloat(totals[6]) || 0,
      status: totals[7]
    }
  };
}

function getConfig() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TAB.CONFIG);
  var data = sheet.getRange(4, 1, 8, 3).getValues();

  var paymentMethods = [];
  var users = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i][0]) paymentMethods.push(data[i][0]);
    if (data[i][2]) users.push(data[i][2]);
  }

  return { success: true, paymentMethods: paymentMethods, users: users };
}

// ============================================================
// AUTO-CIERRE DE MES
// La app llama checkMonth() al cargar. Si el mes activo ya pasó,
// cierra automáticamente todos los meses pendientes hasta llegar
// al mes actual.
// ============================================================

function checkMonth() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var presupSheet = ss.getSheetByName(TAB.PRESUPUESTO);
  var mesActivo = String(presupSheet.getRange('B2').getValue());

  // Calcular mes actual (zona horaria Ecuador = America/Guayaquil)
  var now = new Date();
  var currentYear = now.getFullYear();
  var currentMonth = ('0' + (now.getMonth() + 1)).slice(-2);
  var mesActual = currentYear + '-' + currentMonth;

  if (mesActivo >= mesActual) {
    // El mes activo es el actual o futuro — no hay que cerrar nada
    return { success: true, action: 'none', activeMonth: mesActivo, currentMonth: mesActual };
  }

  // El mes activo está atrasado — cerrar meses pendientes
  var closedMonths = [];
  var maxIterations = 12; // Seguridad: máximo 12 cierres (1 año)

  while (mesActivo < mesActual && maxIterations > 0) {
    var result = closeMonth();
    if (!result.success) {
      // Si falla (ej: ya archivado), forzar avance al siguiente mes
      presupSheet.getRange('B2').setValue(calculateNextMonth(mesActivo));
      mesActivo = String(presupSheet.getRange('B2').getValue());
    } else {
      closedMonths.push(result.closedMonth);
      mesActivo = result.newMonth;
    }
    maxIterations--;
  }

  return {
    success: true,
    action: 'auto_closed',
    closedMonths: closedMonths,
    newActiveMonth: mesActivo,
    currentMonth: mesActual,
    message: 'Se cerraron ' + closedMonths.length + ' mes(es) automáticamente'
  };
}

// ============================================================
// HELPERS
// ============================================================

function findFirstEmptyRow(sheet, column) {
  var data = sheet.getRange(1, column, sheet.getMaxRows(), 1).getValues();
  for (var i = 3; i < data.length; i++) { // Start from row 4 (index 3)
    if (!data[i][0] || data[i][0] === '') {
      return i + 1; // Convert to 1-based row number
    }
  }
  return data.length + 1;
}

function lookupType(category, subcategory) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TAB.CATALOGO);
  var data = sheet.getRange(4, 1, 80, 3).getValues();

  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === category && data[i][2] === subcategory) {
      return data[i][0]; // "Fijo" o "Variable"
    }
  }
  return null;
}

function getStatusEmoji(percent) {
  if (percent <= 0.5) return '🟢 OK';
  if (percent <= 0.8) return '🟡 Atención';
  if (percent <= 1) return '🟠 Límite';
  return '🔴 Sobregiro';
}

function calculateNextMonth(currentMonth) {
  var parts = currentMonth.split('-');
  var year = parseInt(parts[0]);
  var month = parseInt(parts[1]);

  month++;
  if (month > 12) {
    month = 1;
    year++;
  }
  return year + '-' + (month < 10 ? '0' + month : month);
}

function getMonthName(monthStr) {
  var months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var m = parseInt(monthStr.split('-')[1]);
  return months[m] + ' ' + monthStr.split('-')[0];
}

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  var d = new Date(date);
  var year = d.getFullYear();
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// COMPATIBILIDAD — Endpoints de la app existente
// La app actual envía gastos con formato diferente.
// Estos wrappers traducen el formato viejo al nuevo.
// ============================================================

// La app existente hace POST con array de gastos:
// [{id, fecha, usuario, categoria, subcategoria, monto, nota, tipo:'Gasto'}]
// Y GET sin action para listar gastos.
//
// El doPost ya maneja el formato nuevo (con action).
// Si el body NO tiene "action", asumimos formato legacy de la app existente.

function doPostLegacy(body) {
  // La app envía un array de gastos directamente
  if (Array.isArray(body)) {
    return syncLegacyExpenses(body);
  }
  // O un objeto con array
  if (body.gastos && Array.isArray(body.gastos)) {
    return syncLegacyExpenses(body.gastos);
  }
  return { success: false, error: 'Formato no reconocido' };
}

function syncLegacyExpenses(gastos) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (lockErr) {
    return { status: 'error', error: 'Servidor ocupado' };
  }

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(TAB.TRANSACCIONES);
    var escritos = 0;

    // Leer IDs existentes para evitar duplicados
    var existingData = sheet.getRange(4, 1, sheet.getLastRow() - 3, 10).getValues();
    var existingNotes = {};
    for (var e = 0; e < existingData.length; e++) {
      if (existingData[e][6]) { // Col G = Nota
        // Usar fecha+monto+categoria como key de dedup
        var key = String(existingData[e][1]) + '|' + existingData[e][2] + '|' + existingData[e][4];
        existingNotes[key] = true;
      }
    }

    for (var i = 0; i < gastos.length; i++) {
      var g = gastos[i];
      if (!g.fecha || !g.monto || !g.categoria) continue;

      // Dedup check
      var dupKey = g.fecha + '|' + g.monto + '|' + g.categoria;
      if (existingNotes[dupKey]) continue;

      var tipo = lookupType(g.categoria, g.subcategoria) || 'Variable';
      var emptyRow = findFirstEmptyRow(sheet, 2);

      if (emptyRow > 499) break;

      sheet.getRange(emptyRow, 2, 1, 8).setValues([[
        new Date(g.fecha),
        parseFloat(g.monto),
        tipo,
        g.categoria,
        g.subcategoria || '',
        g.nota || '',
        '', // Método de pago (legacy no lo envía)
        g.usuario || ''
      ]]);

      existingNotes[dupKey] = true;
      escritos++;
    }

    Logger.log('Legacy sync: ' + escritos + ' gastos escritos de ' + gastos.length + ' recibidos');
    return { status: 'ok', escritos: escritos };
  } finally {
    lock.releaseLock();
  }
}

// Override doPost para manejar ambos formatos
var _originalDoPost = doPost;
doPost = function(e) {
  try {
    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ success: false, error: 'JSON inválido' });
    }

    // Si tiene "action" y "key", es formato nuevo
    if (body.action && body.key) {
      return _originalDoPost(e);
    }

    // Si no, es formato legacy de la app existente
    return jsonResponse(doPostLegacy(body));
  } catch (err) {
    Logger.log('doPost router error: ' + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
};

// Override doGet para manejar ambos formatos
var _originalDoGet = doGet;
doGet = function(e) {
  var p = e.parameter || {};

  // Si tiene "action" y "key", formato nuevo
  if (p.action && p.key) {
    return _originalDoGet(e);
  }

  // Legacy: GET sin params devuelve todos los gastos (para pullFromSheets)
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(TAB.TRANSACCIONES);
    var lastRow = sheet.getLastRow();

    if (lastRow < 4) {
      return jsonResponse({ status: 'ok', gastos: [] });
    }

    var data = sheet.getRange(4, 1, lastRow - 3, 10).getValues();
    var gastos = [];

    for (var i = 0; i < data.length; i++) {
      if (!data[i][1]) continue;
      gastos.push({
        id: 'sheet-' + data[i][0],
        fecha: formatDate(data[i][1]),
        monto: parseFloat(data[i][2]) || 0,
        tipo: 'Gasto',
        categoria: data[i][4],
        subcategoria: data[i][5],
        nota: data[i][6],
        usuario: data[i][8],
        synced: true
      });
    }

    return jsonResponse({ status: 'ok', gastos: gastos });
  } catch (err) {
    Logger.log('Legacy doGet error: ' + err.message);
    return jsonResponse({ status: 'error', error: err.message });
  }
};
