// ============================================
// Dyesabel Donations Backend
// Separate GAS project / separate Google Sheet
// ============================================

var SHEET_SETTINGS = 'DonationSettings';
var SHEET_RECENT_DONATIONS = 'RecentDonations';
var MAX_QR_UPLOAD_BYTES = 5 * 1024 * 1024;
var MAX_RECENT_DONATIONS = 100;
var DEFAULT_QR_UPLOAD_FOLDER_ID = '1jd8IjdCDku-TKmgrCVBBNpI_yDeIWDuJ';

function doGet(e) {
  return jsonOutput_(handleRequest_(buildRequest_(e)));
}

function doPost(e) {
  return jsonOutput_(handleRequest_(buildRequest_(e)));
}

function handleRequest_(request) {
  try {
    var action = request.action || 'health';

    switch (action) {
      case 'health':
        return {
          success: true,
          message: 'Dyesabel Donations API is online.'
        };

      case 'initializeDonationSheets':
        requireAdminKey_(request);
        initializeDonationSheets_();
        return {
          success: true,
          message: 'Donation sheets initialized successfully.'
        };

      case 'getPublicDonationData':
        initializeDonationSheets_();
        return {
          success: true,
          data: getPublicDonationData_()
        };

      case 'saveDonationContent':
        requireAdminKey_(request);
        initializeDonationSheets_();
        saveDonationContent_(request.content || {});
        return {
          success: true,
          message: 'Donation content saved successfully.',
          data: getPublicDonationData_()
        };

      case 'uploadDonationQr':
        requireAdminKey_(request);
        var uploadResult = uploadDonationQr_(request);
        return {
          success: true,
          fileId: uploadResult.fileId,
          fileUrl: uploadResult.fileUrl,
          thumbnailUrl: uploadResult.thumbnailUrl
        };

      default:
        return {
          success: false,
          error: 'Unknown action: ' + action
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

function buildRequest_(e) {
  var body = {};
  var rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '';

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      body = { rawBody: rawBody };
    }
  }

  var params = e && e.parameter ? e.parameter : {};
  var request = {};
  copyObject_(request, params);
  copyObject_(request, body);
  return request;
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function copyObject_(target, source) {
  if (!source) return target;
  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      target[key] = source[key];
    }
  }
  return target;
}

function requireAdminKey_(request) {
  var adminKey = getRequiredProperty_('ADMIN_API_KEY');

  if (!isConfiguredSecret_(adminKey)) {
    throw new Error('ADMIN_API_KEY is not configured correctly.');
  }

  if (!request || request.adminKey !== adminKey) {
    throw new Error('Unauthorized request.');
  }
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(getRequiredProperty_('SPREADSHEET_ID'));
}

function initializeDonationSheets_() {
  var spreadsheet = getSpreadsheet_();
  var settingsSheet = getOrCreateSheet_(spreadsheet, SHEET_SETTINGS);
  var recentDonationsSheet = getOrCreateSheet_(spreadsheet, SHEET_RECENT_DONATIONS);

  if (settingsSheet.getLastRow() === 0) {
    settingsSheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    writeSettingsMap_(getDefaultSettings_());
  } else if (settingsSheet.getLastRow() === 1) {
    writeSettingsMap_(getDefaultSettings_());
  }

  if (recentDonationsSheet.getLastRow() === 0) {
    recentDonationsSheet.getRange(1, 1, 1, 6).setValues([
      ['id', 'name', 'amount', 'currency', 'method', 'donatedAt']
    ]);
  }
}

function getDefaultSettings_() {
  return {
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankSwiftCode: '',
    bankAddress: '',
    bankCurrency: '',
    referenceNote: '',
    secRegistrationNumber: '',
    localMethodsJson: JSON.stringify([]),
    allocationsJson: JSON.stringify([])
  };
}

function getPublicDonationData_() {
  var settings = readSettingsMap_();
  var recentDonations = readRecentDonations_();

  return {
    localMethods: parseJsonArray_(settings.localMethodsJson),
    bankDetails: {
      bankName: sanitizePublicValue_(settings.bankName),
      accountName: sanitizePublicValue_(settings.bankAccountName),
      accountNumber: sanitizePublicValue_(settings.bankAccountNumber),
      swiftCode: sanitizePublicValue_(settings.bankSwiftCode),
      bankAddress: sanitizePublicValue_(settings.bankAddress),
      currency: sanitizePublicValue_(settings.bankCurrency)
    },
    referenceNote: sanitizePublicValue_(settings.referenceNote),
    secRegistrationNumber: sanitizePublicValue_(settings.secRegistrationNumber),
    allocations: parseJsonArray_(settings.allocationsJson),
    recentDonations: recentDonations
  };
}

function saveDonationContent_(content) {
  validateDonationContent_(content);

  var currentSettings = readSettingsMap_();
  var nextSettings = {
    bankName: normalizeTextValue_(getSafeValue_(content.bankDetails && content.bankDetails.bankName, currentSettings.bankName)),
    bankAccountName: normalizeTextValue_(getSafeValue_(content.bankDetails && content.bankDetails.accountName, currentSettings.bankAccountName)),
    bankAccountNumber: normalizeTextValue_(getSafeValue_(content.bankDetails && content.bankDetails.accountNumber, currentSettings.bankAccountNumber)),
    bankSwiftCode: normalizeTextValue_(getSafeValue_(content.bankDetails && content.bankDetails.swiftCode, currentSettings.bankSwiftCode)),
    bankAddress: normalizeTextValue_(getSafeValue_(content.bankDetails && content.bankDetails.bankAddress, currentSettings.bankAddress)),
    bankCurrency: normalizeTextValue_(getSafeValue_(content.bankDetails && content.bankDetails.currency, currentSettings.bankCurrency)),
    referenceNote: normalizeTextValue_(getSafeValue_(content.referenceNote, currentSettings.referenceNote)),
    secRegistrationNumber: normalizeTextValue_(getSafeValue_(content.secRegistrationNumber, currentSettings.secRegistrationNumber)),
    localMethodsJson: JSON.stringify(normalizeLocalMethods_(Array.isArray(content.localMethods) ? content.localMethods : parseJsonArray_(currentSettings.localMethodsJson))),
    allocationsJson: JSON.stringify(normalizeAllocations_(Array.isArray(content.allocations) ? content.allocations : parseJsonArray_(currentSettings.allocationsJson)))
  };

  writeSettingsMap_(nextSettings);

  if (Array.isArray(content.recentDonations)) {
    writeRecentDonations_(normalizeRecentDonations_(content.recentDonations));
  }
}

function readSettingsMap_() {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_SETTINGS);
  var values = sheet.getDataRange().getValues();
  var map = {};

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var key = row[0];
    if (key) {
      map[String(key)] = row[1];
    }
  }

  return map;
}

function writeSettingsMap_(settingsMap) {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_SETTINGS);
  var rows = [['key', 'value']];

  for (var key in settingsMap) {
    if (Object.prototype.hasOwnProperty.call(settingsMap, key)) {
      rows.push([key, settingsMap[key]]);
    }
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
}

function readRecentDonations_() {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_RECENT_DONATIONS);
  var values = sheet.getDataRange().getValues();
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1]) {
      continue;
    }

    rows.push({
      id: String(row[0] || 'donation-' + i),
      name: String(row[1] || 'Anonymous'),
      amount: Number(row[2] || 0),
      currency: String(row[3] || 'PHP'),
      method: String(row[4] || 'Donation'),
      donatedAt: row[5] ? new Date(row[5]).toISOString() : ''
    });
  }

  rows.sort(function(a, b) {
    return new Date(b.donatedAt || 0).getTime() - new Date(a.donatedAt || 0).getTime();
  });

  return rows;
}

function writeRecentDonations_(donations) {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_RECENT_DONATIONS);
  var rows = [['id', 'name', 'amount', 'currency', 'method', 'donatedAt']];

  for (var i = 0; i < donations.length; i++) {
    var donation = donations[i] || {};
    rows.push([
      donation.id || Utilities.getUuid(),
      donation.name || 'Anonymous',
      Number(donation.amount || 0),
      donation.currency || 'PHP',
      donation.method || 'Donation',
      donation.donatedAt || new Date().toISOString()
    ]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 6).setValues(rows);
}

function parseJsonArray_(value) {
  if (!value) return [];
  try {
    var parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function getSafeValue_(nextValue, fallbackValue) {
  return nextValue === undefined || nextValue === null ? fallbackValue : nextValue;
}

function getOrCreateSheet_(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

function uploadDonationQr_(request) {
  var qrFolderId = getQrUploadFolderId_();

  if (!qrFolderId) {
    throw new Error('QR_UPLOAD_FOLDER_ID is not configured.');
  }

  if (!request.fileData || !request.fileName || !request.fileType) {
    throw new Error('Missing fileData, fileName, or fileType.');
  }

  validateQrUploadRequest_(request);

  var folder = DriveApp.getFolderById(qrFolderId);
  var bytes = Utilities.base64Decode(cleanBase64_(request.fileData));
  var blob = Utilities.newBlob(bytes, request.fileType, request.fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId: file.getId(),
    fileUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view?usp=sharing',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1600'
  };
}

function cleanBase64_(value) {
  return String(value).replace(/^data:.*;base64,/, '');
}

function getScriptProperty_(key, fallbackValue) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (value === null || value === undefined || value === '') {
    return fallbackValue;
  }
  return value;
}

function getRequiredProperty_(key) {
  var value = getScriptProperty_(key, '');
  if (!value) {
    throw new Error('Missing required script property: ' + key);
  }
  return value;
}

function getQrUploadFolderId_() {
  return getScriptProperty_('QR_UPLOAD_FOLDER_ID', DEFAULT_QR_UPLOAD_FOLDER_ID);
}

function isConfiguredSecret_(value) {
  return !!value && String(value).trim().length >= 24;
}

function sanitizePublicValue_(value) {
  if (!value) return '';
  var normalized = String(value).trim();
  if (normalized === '[INSERT_NUMBER]' || normalized === 'REPLACE_WITH_STRONG_ADMIN_KEY') {
    return '';
  }
  return normalized;
}

function normalizeTextValue_(value) {
  return sanitizePublicValue_(value);
}

function validateDonationContent_(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new Error('content must be an object.');
  }

  if (content.bankDetails !== undefined && (!content.bankDetails || typeof content.bankDetails !== 'object' || Array.isArray(content.bankDetails))) {
    throw new Error('bankDetails must be an object.');
  }

  if (content.localMethods !== undefined && !Array.isArray(content.localMethods)) {
    throw new Error('localMethods must be an array.');
  }

  if (content.allocations !== undefined && !Array.isArray(content.allocations)) {
    throw new Error('allocations must be an array.');
  }

  if (content.recentDonations !== undefined && !Array.isArray(content.recentDonations)) {
    throw new Error('recentDonations must be an array.');
  }
}

function normalizeLocalMethods_(methods) {
  var normalized = [];
  for (var i = 0; i < methods.length; i++) {
    var method = methods[i] || {};
    normalized.push({
      id: normalizeTextValue_(method.id || ('method-' + (i + 1))),
      name: normalizeTextValue_(method.name || ('Method ' + (i + 1))),
      accountName: normalizeTextValue_(method.accountName),
      accountNumber: normalizeTextValue_(method.accountNumber),
      qrImageUrl: normalizeTextValue_(method.qrImageUrl),
      color: normalizeTextValue_(method.color),
      isEnabled: method.isEnabled !== false,
      sortOrder: Number(method.sortOrder || i)
    });
  }
  return normalized;
}

function normalizeAllocations_(allocations) {
  var normalized = [];
  for (var i = 0; i < allocations.length; i++) {
    var allocation = allocations[i] || {};
    normalized.push({
      label: normalizeTextValue_(allocation.label || ('Allocation ' + (i + 1))),
      percentage: Number(allocation.percentage || 0),
      color: normalizeTextValue_(allocation.color)
    });
  }
  return normalized;
}

function normalizeRecentDonations_(donations) {
  var normalized = [];
  var limit = Math.min(donations.length, MAX_RECENT_DONATIONS);

  for (var i = 0; i < limit; i++) {
    var donation = donations[i] || {};
    normalized.push({
      id: normalizeTextValue_(donation.id || Utilities.getUuid()),
      name: normalizeTextValue_(donation.name || 'Anonymous'),
      amount: Number(donation.amount || 0),
      currency: normalizeTextValue_(donation.currency || 'PHP'),
      method: normalizeTextValue_(donation.method || 'Donation'),
      donatedAt: donation.donatedAt ? new Date(donation.donatedAt).toISOString() : new Date().toISOString()
    });
  }

  return normalized;
}

function validateQrUploadRequest_(request) {
  var allowedTypes = {
    'image/png': true,
    'image/jpeg': true,
    'image/jpg': true,
    'image/webp': true
  };
  var fileName = String(request.fileName || '').trim();
  var fileType = String(request.fileType || '').trim().toLowerCase();
  var fileData = cleanBase64_(request.fileData);

  if (!allowedTypes[fileType]) {
    throw new Error('Unsupported QR file type.');
  }

  if (!fileName || fileName.length > 120 || /[\\/:*?"<>|]/.test(fileName)) {
    throw new Error('Invalid fileName.');
  }

  if (!fileData) {
    throw new Error('fileData is empty.');
  }

  var estimatedBytes = Math.ceil(fileData.length * 3 / 4);
  if (estimatedBytes > MAX_QR_UPLOAD_BYTES) {
    throw new Error('QR image is too large. Maximum size is 5MB.');
  }
}

// Manual runners so these appear in the Apps Script Run menu during setup.
function runInitializeDonationSheets() {
  initializeDonationSheets_();
}

function runGetPublicDonationData() {
  return getPublicDonationData_();
}

function runValidateDonationConfiguration() {
  return {
    spreadsheetIdConfigured: !!getScriptProperty_('SPREADSHEET_ID', ''),
    adminApiKeyConfigured: isConfiguredSecret_(getScriptProperty_('ADMIN_API_KEY', '')),
    qrUploadFolderId: getQrUploadFolderId_()
  };
}
