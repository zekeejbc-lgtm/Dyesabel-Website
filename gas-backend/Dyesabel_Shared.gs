var DYESABEL_INTERNAL_SECRET_HEADER = 'X-Dyesabel-Internal-Secret';

function dyesabelCreateResponse_(success, error, data) {
  var result = { success: success };
  if (error) result.error = error;
  if (data) {
    for (var key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = data[key];
      }
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function dyesabelGetScriptProperty_(key, fallbackValue) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (value === null || value === undefined || value === '') {
    return fallbackValue;
  }
  return value;
}

function dyesabelRequireScriptProperty_(key) {
  var value = dyesabelGetScriptProperty_(key, '');
  if (!value) {
    throw new Error('Missing required script property: ' + key);
  }
  return value;
}

function dyesabelGetSpreadsheet_() {
  return SpreadsheetApp.openById(dyesabelRequireScriptProperty_('SPREADSHEET_ID'));
}

function dyesabelGetOrCreateSheet_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function dyesabelEnsureSheetSize_(sheet, minColumns, minRows) {
  if (sheet.getMaxColumns() < minColumns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), minColumns - sheet.getMaxColumns());
  }
  if (sheet.getMaxRows() < minRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), minRows - sheet.getMaxRows());
  }
}

function dyesabelWriteSheetRows_(sheet, headers, rows) {
  dyesabelEnsureSheetSize_(sheet, Math.max(headers.length, 1), Math.max(rows.length + 1, 2));
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.setFrozenRows(1);
}

function dyesabelSheetHasHeaders_(sheet, expectedHeaders) {
  if (!sheet || sheet.getLastRow() < 1) {
    return false;
  }
  var actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  return expectedHeaders.every(function(header, index) {
    return actualHeaders[index] === header;
  });
}

function dyesabelParseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }
  return JSON.parse(e.postData.contents);
}

function dyesabelReadInternalSecretHeader_(e) {
  if (!e || !e.parameter) {
    return '';
  }
  return String(
    e.parameter.internalSecret ||
    e.parameter.x_dyesabel_internal_secret ||
    e.parameter.xDyesabelInternalSecret ||
    ''
  );
}

function dyesabelRequireInternalSecretFromEvent_(e) {
  var expected = dyesabelRequireScriptProperty_('INTERNAL_SHARED_SECRET');
  var actual = dyesabelReadInternalSecretHeader_(e);
  if (actual !== expected) {
    throw new Error('Unauthorized internal request.');
  }
}

function dyesabelRequireInternalSecretFromData_(data) {
  var expected = dyesabelRequireScriptProperty_('INTERNAL_SHARED_SECRET');
  var actual = String((data && data.internalSecret) || '');
  if (actual !== expected) {
    throw new Error('Unauthorized internal request.');
  }
}

function dyesabelPostJson_(url, payload, includeInternalSecret) {
  var requestPayload = {};
  for (var key in payload) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      requestPayload[key] = payload[key];
    }
  }

  if (includeInternalSecret) {
    requestPayload.internalSecret = dyesabelRequireScriptProperty_('INTERNAL_SHARED_SECRET');
  }

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'text/plain;charset=utf-8',
    payload: JSON.stringify(requestPayload),
    muteHttpExceptions: true
  });

  var rawText = response.getContentText();
  var parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new Error('Invalid JSON response from downstream API: ' + rawText);
  }

  return parsed;
}

function dyesabelGetBooleanProperty_(key, defaultValue) {
  var value = dyesabelGetScriptProperty_(key, '');
  if (value === '') {
    return defaultValue;
  }
  return String(value).toLowerCase() === 'true';
}

function dyesabelCopySheetByHeaders_(sourceSheet, targetSheet, headers) {
  var rows = [headers];
  if (sourceSheet && sourceSheet.getLastRow() > 1) {
    var values = sourceSheet.getRange(2, 1, sourceSheet.getLastRow() - 1, headers.length).getValues();
    rows = rows.concat(values);
  }
  dyesabelEnsureSheetSize_(targetSheet, headers.length, Math.max(rows.length, 2));
  targetSheet.clearContents();
  targetSheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  targetSheet.setFrozenRows(1);
}
