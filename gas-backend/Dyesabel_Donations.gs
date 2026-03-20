// ============================================
// Dyesabel Donations Backend
// Separate GAS project / separate Google Sheet
// ============================================

var SHEET_SETTINGS = 'DonationSettings';
var SHEET_RECENT_DONATIONS = 'RecentDonations';
var SHEET_NATIONAL_METHODS = 'NationalDonationMethods';
var SHEET_INTERNATIONAL_METHODS = 'InternationalDonationMethods';
var SHEET_ALLOCATIONS = 'DonationAllocations';
var MAX_QR_UPLOAD_BYTES = 5 * 1024 * 1024;
var MAX_RECENT_DONATIONS = 100;
var DEFAULT_QR_UPLOAD_FOLDER_ID = '1jd8IjdCDku-TKmgrCVBBNpI_yDeIWDuJ';
var SETTINGS_HEADERS = ['key', 'value'];
var RECENT_DONATION_HEADERS = ['id', 'name', 'amount', 'currency', 'method', 'donatedAt'];
var NATIONAL_METHOD_HEADERS = ['id', 'name', 'accountName', 'accountNumber', 'qrImageUrl', 'qrImageFileId', 'color', 'isEnabled', 'sortOrder'];
var INTERNATIONAL_METHOD_HEADERS = ['id', 'bankName', 'accountName', 'accountNumber', 'swiftCode', 'bankAddress', 'currency', 'isEnabled', 'sortOrder'];
var ALLOCATION_HEADERS = ['id', 'label', 'percentage', 'color', 'sortOrder'];

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

      case 'migrateDonationStorageToMappedSheets':
        requireAdminKey_(request);
        initializeDonationSheets_();
        return migrateDonationStorageToMappedSheets_();

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

      case 'downloadDonationQr':
        initializeDonationSheets_();
        return getDonationQrDownloadData_(request);

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
  var adminKey = getConfiguredAdminKey_();

  if (!isConfiguredSecret_(adminKey)) {
    throw new Error('ADMIN_API_KEY or DONATIONS_ADMIN_API_KEY is not configured correctly.');
  }

  if (!request || request.adminKey !== adminKey) {
    throw new Error('Unauthorized request.');
  }
}

function getConfiguredAdminKey_() {
  return getScriptProperty_('ADMIN_API_KEY', '') || getScriptProperty_('DONATIONS_ADMIN_API_KEY', '');
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(getRequiredProperty_('SPREADSHEET_ID'));
}

function initializeDonationSheets_() {
  var spreadsheet = getSpreadsheet_();
  var settingsSheet = getOrCreateSheet_(spreadsheet, SHEET_SETTINGS);
  var recentDonationsSheet = getOrCreateSheet_(spreadsheet, SHEET_RECENT_DONATIONS);
  var nationalMethodsSheet = getOrCreateSheet_(spreadsheet, SHEET_NATIONAL_METHODS);
  var internationalMethodsSheet = getOrCreateSheet_(spreadsheet, SHEET_INTERNATIONAL_METHODS);
  var allocationsSheet = getOrCreateSheet_(spreadsheet, SHEET_ALLOCATIONS);

  ensureHeaders_(settingsSheet, SETTINGS_HEADERS);
  if (settingsSheet.getLastRow() === 1) {
    writeSettingsMap_(getDefaultSettings_());
  }

  ensureHeaders_(recentDonationsSheet, RECENT_DONATION_HEADERS);
  ensureHeaders_(nationalMethodsSheet, NATIONAL_METHOD_HEADERS);
  ensureHeaders_(internationalMethodsSheet, INTERNATIONAL_METHOD_HEADERS);
  ensureHeaders_(allocationsSheet, ALLOCATION_HEADERS);
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var matches = true;
  for (var i = 0; i < headers.length; i++) {
    if (String(current[i] || '') !== headers[i]) {
      matches = false;
      break;
    }
  }

  if (!matches) {
    sheet.insertRows(1, 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function getDefaultSettings_() {
  return {
    referenceNote: '',
    secRegistrationNumber: ''
  };
}

function getPublicDonationData_() {
  var settings = readSettingsMap_();
  var recentDonations = readRecentDonations_();
  var nationalMethods = readNationalDonationMethods_();
  var internationalMethods = readInternationalDonationMethods_();
  var allocations = readDonationAllocations_();

  if (!nationalMethods.length) {
    nationalMethods = normalizeLocalMethods_(parseJsonArray_(settings.localMethodsJson));
  }

  if (!internationalMethods.length && hasLegacyInternationalSettings_(settings)) {
    internationalMethods = normalizeInternationalMethods_([buildLegacyInternationalMethod_(settings)]);
  }

  if (!allocations.length) {
    allocations = normalizeAllocations_(parseJsonArray_(settings.allocationsJson));
  }

  return {
    localMethods: nationalMethods,
    bankDetails: buildBankDetailsFromInternationalMethods_(internationalMethods),
    referenceNote: sanitizePublicValue_(settings.referenceNote),
    secRegistrationNumber: sanitizePublicValue_(settings.secRegistrationNumber),
    allocations: allocations,
    recentDonations: recentDonations
  };
}

function saveDonationContent_(content) {
  validateDonationContent_(content);

  var currentSettings = readSettingsMap_();
  var currentNationalMethods = readNationalDonationMethods_();
  var currentInternationalMethods = readInternationalDonationMethods_();
  var currentAllocations = readDonationAllocations_();

  if (!currentNationalMethods.length) {
    currentNationalMethods = normalizeLocalMethods_(parseJsonArray_(currentSettings.localMethodsJson));
  }

  if (!currentInternationalMethods.length && hasLegacyInternationalSettings_(currentSettings)) {
    currentInternationalMethods = normalizeInternationalMethods_([buildLegacyInternationalMethod_(currentSettings)]);
  }

  if (!currentAllocations.length) {
    currentAllocations = normalizeAllocations_(parseJsonArray_(currentSettings.allocationsJson));
  }

  writeSettingsMap_({
    referenceNote: normalizeTextValue_(getSafeValue_(content.referenceNote, currentSettings.referenceNote)),
    secRegistrationNumber: normalizeTextValue_(getSafeValue_(content.secRegistrationNumber, currentSettings.secRegistrationNumber))
  });

  writeNationalDonationMethods_(Array.isArray(content.localMethods) ? content.localMethods : currentNationalMethods);
  writeInternationalDonationMethods_(content.bankDetails !== undefined ? [content.bankDetails] : currentInternationalMethods);
  writeDonationAllocations_(Array.isArray(content.allocations) ? content.allocations : currentAllocations);

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
  var rows = [SETTINGS_HEADERS];

  for (var key in settingsMap) {
    if (Object.prototype.hasOwnProperty.call(settingsMap, key)) {
      rows.push([key, settingsMap[key]]);
    }
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, SETTINGS_HEADERS.length).setValues(rows);
}

function readRecentDonations_() {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_RECENT_DONATIONS);
  var values = sheet.getDataRange().getValues();
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1]) continue;

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
  var rows = [RECENT_DONATION_HEADERS];

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
  sheet.getRange(1, 1, rows.length, RECENT_DONATION_HEADERS.length).setValues(rows);
}

function readNationalDonationMethods_() {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_NATIONAL_METHODS);
  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0] : [];
  var headerIndex = createHeaderIndexMap_(headers);
  var methods = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1] && !row[2] && !row[3] && !row[4]) continue;

    methods.push({
      id: String(getRowValueByHeader_(row, headerIndex, 'id', 0) || ('method-' + i)),
      name: String(getRowValueByHeader_(row, headerIndex, 'name', 1) || ('Method ' + i)),
      accountName: String(getRowValueByHeader_(row, headerIndex, 'accountName', 2) || ''),
      accountNumber: String(getRowValueByHeader_(row, headerIndex, 'accountNumber', 3) || ''),
      qrImageUrl: String(getRowValueByHeader_(row, headerIndex, 'qrImageUrl', 4) || ''),
      qrImageFileId: String(getRowValueByHeader_(row, headerIndex, 'qrImageFileId', -1) || ''),
      color: String(getRowValueByHeader_(row, headerIndex, 'color', 5) || 'bg-primary-blue'),
      isEnabled: getRowValueByHeader_(row, headerIndex, 'isEnabled', 6) !== false && String(getRowValueByHeader_(row, headerIndex, 'isEnabled', 6)).toLowerCase() !== 'false',
      sortOrder: Number(getRowValueByHeader_(row, headerIndex, 'sortOrder', 7) || (i - 1))
    });
  }

  return normalizeLocalMethods_(methods);
}

function writeNationalDonationMethods_(methods) {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_NATIONAL_METHODS);
  var normalized = normalizeLocalMethods_(methods);
  var rows = [NATIONAL_METHOD_HEADERS];

  for (var i = 0; i < normalized.length; i++) {
    var method = normalized[i];
    rows.push([
      method.id,
      method.name,
      method.accountName,
      method.accountNumber,
      method.qrImageUrl,
      method.qrImageFileId,
      method.color,
      method.isEnabled,
      method.sortOrder
    ]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, NATIONAL_METHOD_HEADERS.length).setValues(rows);
}

function createHeaderIndexMap_(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    map[String(headers[i] || '')] = i;
  }
  return map;
}

function getRowValueByHeader_(row, headerIndex, headerName, fallbackIndex) {
  if (Object.prototype.hasOwnProperty.call(headerIndex, headerName)) {
    return row[headerIndex[headerName]];
  }
  if (fallbackIndex >= 0) {
    return row[fallbackIndex];
  }
  return '';
}

function readInternationalDonationMethods_() {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_INTERNATIONAL_METHODS);
  var values = sheet.getDataRange().getValues();
  var methods = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1] && !row[2] && !row[3] && !row[4] && !row[5] && !row[6]) continue;

    methods.push({
      id: String(row[0] || ('international-method-' + i)),
      bankName: String(row[1] || ''),
      accountName: String(row[2] || ''),
      accountNumber: String(row[3] || ''),
      swiftCode: String(row[4] || ''),
      bankAddress: String(row[5] || ''),
      currency: String(row[6] || ''),
      isEnabled: row[7] !== false && String(row[7]).toLowerCase() !== 'false',
      sortOrder: Number(row[8] || (i - 1))
    });
  }

  return normalizeInternationalMethods_(methods);
}

function writeInternationalDonationMethods_(methods) {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_INTERNATIONAL_METHODS);
  var normalized = normalizeInternationalMethods_(methods);
  var rows = [INTERNATIONAL_METHOD_HEADERS];

  for (var i = 0; i < normalized.length; i++) {
    var method = normalized[i];
    rows.push([
      method.id,
      method.bankName,
      method.accountName,
      method.accountNumber,
      method.swiftCode,
      method.bankAddress,
      method.currency,
      method.isEnabled,
      method.sortOrder
    ]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, INTERNATIONAL_METHOD_HEADERS.length).setValues(rows);
}

function readDonationAllocations_() {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_ALLOCATIONS);
  var values = sheet.getDataRange().getValues();
  var allocations = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1]) continue;

    allocations.push({
      id: String(row[0] || ('allocation-' + i)),
      label: String(row[1] || ('Allocation ' + i)),
      percentage: Number(row[2] || 0),
      color: String(row[3] || 'bg-primary-blue'),
      sortOrder: Number(row[4] || (i - 1))
    });
  }

  return normalizeAllocations_(allocations);
}

function writeDonationAllocations_(allocations) {
  var sheet = getSpreadsheet_().getSheetByName(SHEET_ALLOCATIONS);
  var normalized = normalizeAllocations_(allocations);
  var rows = [ALLOCATION_HEADERS];

  for (var i = 0; i < normalized.length; i++) {
    var allocation = normalized[i];
    rows.push([
      allocation.id,
      allocation.label,
      allocation.percentage,
      allocation.color,
      allocation.sortOrder
    ]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, ALLOCATION_HEADERS.length).setValues(rows);
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

function hasLegacyInternationalSettings_(settings) {
  return !!(
    settings.bankName ||
    settings.bankAccountName ||
    settings.bankAccountNumber ||
    settings.bankSwiftCode ||
    settings.bankAddress ||
    settings.bankCurrency
  );
}

function buildLegacyInternationalMethod_(settings) {
  return {
    id: 'international-method-1',
    bankName: settings.bankName || '',
    accountName: settings.bankAccountName || '',
    accountNumber: settings.bankAccountNumber || '',
    swiftCode: settings.bankSwiftCode || '',
    bankAddress: settings.bankAddress || '',
    currency: settings.bankCurrency || '',
    isEnabled: true,
    sortOrder: 0
  };
}

function buildBankDetailsFromInternationalMethods_(methods) {
  var normalized = normalizeInternationalMethods_(methods);
  for (var i = 0; i < normalized.length; i++) {
    if (normalized[i].isEnabled !== false) {
      return {
        bankName: normalized[i].bankName,
        accountName: normalized[i].accountName,
        accountNumber: normalized[i].accountNumber,
        swiftCode: normalized[i].swiftCode,
        bankAddress: normalized[i].bankAddress,
        currency: normalized[i].currency
      };
    }
  }

  return {
    bankName: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
    bankAddress: '',
    currency: ''
  };
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

function getDonationQrDownloadData_(request) {
  var fileId = String(request && request.fileId || '').trim();
  if (!fileId) {
    throw new Error('Missing fileId.');
  }

  var file = DriveApp.getFileById(fileId);
  var blob = file.getBlob();
  var fileType = String(blob.getContentType() || file.getMimeType() || 'image/png');
  var extension = getFileExtensionForMimeType_(fileType);
  var baseName = sanitizeDownloadFileName_(file.getName() || 'donation-qr');

  return {
    success: true,
    fileId: fileId,
    fileName: baseName + '.' + extension,
    fileType: fileType,
    fileData: Utilities.base64Encode(blob.getBytes())
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
    var qrImageUrl = normalizeTextValue_(method.qrImageUrl);
    var qrImageFileId = normalizeTextValue_(method.qrImageFileId || extractDriveFileId_(qrImageUrl));
    normalized.push({
      id: normalizeTextValue_(method.id || ('method-' + (i + 1))),
      name: normalizeTextValue_(method.name || ('Method ' + (i + 1))),
      accountName: normalizeTextValue_(method.accountName),
      accountNumber: normalizeTextValue_(method.accountNumber),
      qrImageUrl: qrImageUrl,
      qrImageFileId: qrImageFileId,
      color: normalizeTextValue_(method.color || 'bg-primary-blue'),
      isEnabled: method.isEnabled !== false,
      sortOrder: Number(method.sortOrder || i)
    });
  }
  normalized.sort(function(a, b) { return a.sortOrder - b.sortOrder; });
  return normalized;
}

function normalizeInternationalMethods_(methods) {
  var normalized = [];
  for (var i = 0; i < methods.length; i++) {
    var method = methods[i] || {};
    normalized.push({
      id: normalizeTextValue_(method.id || ('international-method-' + (i + 1))),
      bankName: normalizeTextValue_(method.bankName),
      accountName: normalizeTextValue_(method.accountName),
      accountNumber: normalizeTextValue_(method.accountNumber),
      swiftCode: normalizeTextValue_(method.swiftCode),
      bankAddress: normalizeTextValue_(method.bankAddress),
      currency: normalizeTextValue_(method.currency),
      isEnabled: method.isEnabled !== false,
      sortOrder: Number(method.sortOrder || i)
    });
  }
  normalized.sort(function(a, b) { return a.sortOrder - b.sortOrder; });
  return normalized;
}

function normalizeAllocations_(allocations) {
  var normalized = [];
  for (var i = 0; i < allocations.length; i++) {
    var allocation = allocations[i] || {};
    normalized.push({
      id: normalizeTextValue_(allocation.id || ('allocation-' + (i + 1))),
      label: normalizeTextValue_(allocation.label || ('Allocation ' + (i + 1))),
      percentage: Number(allocation.percentage || 0),
      color: normalizeTextValue_(allocation.color || 'bg-primary-blue'),
      sortOrder: Number(allocation.sortOrder || i)
    });
  }
  normalized.sort(function(a, b) { return a.sortOrder - b.sortOrder; });
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

function migrateDonationStorageToMappedSheets_() {
  var settings = readSettingsMap_();
  var legacyNationalMethods = normalizeLocalMethods_(parseJsonArray_(settings.localMethodsJson));
  var legacyAllocations = normalizeAllocations_(parseJsonArray_(settings.allocationsJson));
  var internationalMethods = hasLegacyInternationalSettings_(settings)
    ? normalizeInternationalMethods_([buildLegacyInternationalMethod_(settings)])
    : readInternationalDonationMethods_();

  if (legacyNationalMethods.length) {
    writeNationalDonationMethods_(legacyNationalMethods);
  }

  if (internationalMethods.length) {
    writeInternationalDonationMethods_(internationalMethods);
  }

  if (legacyAllocations.length) {
    writeDonationAllocations_(legacyAllocations);
  }

  writeSettingsMap_({
    referenceNote: normalizeTextValue_(settings.referenceNote),
    secRegistrationNumber: normalizeTextValue_(settings.secRegistrationNumber)
  });

  return {
    success: true,
    message: 'Donation storage migrated to mapped sheets successfully.',
    migrated: {
      nationalMethods: legacyNationalMethods.length,
      internationalMethods: internationalMethods.length,
      allocations: legacyAllocations.length
    }
  };
}

function extractDriveFileId_(value) {
  var normalized = String(value || '').trim();
  var match = normalized.match(/[-\w]{25,}/);
  return match ? match[0] : '';
}

function sanitizeDownloadFileName_(value) {
  var normalized = String(value || 'donation-qr')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'donation-qr';
}

function getFileExtensionForMimeType_(mimeType) {
  var lookup = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp'
  };
  return lookup[String(mimeType || '').toLowerCase()] || 'png';
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
    adminApiKeyConfigured: isConfiguredSecret_(getConfiguredAdminKey_()),
    adminApiKeySource: getScriptProperty_('ADMIN_API_KEY', '') ? 'ADMIN_API_KEY' : (getScriptProperty_('DONATIONS_ADMIN_API_KEY', '') ? 'DONATIONS_ADMIN_API_KEY' : ''),
    qrUploadFolderId: getQrUploadFolderId_()
  };
}

function runMigrateDonationStorageToMappedSheets() {
  return migrateDonationStorageToMappedSheets_();
}
