var NEWSLETTER_SHEET = 'Newsletter_Subscribers';
var NEWSLETTER_HEADERS = ['SubscriberID', 'Email', 'EmailNormalized', 'Status', 'Source', 'CreatedAt', 'UpdatedAt'];

function doGet() {
  return dyesabelCreateResponse_(true, null, { message: 'Dyesabel Newsletter API is online.' });
}

function doPost(e) {
  try {
    var data = dyesabelParseJsonBody_(e);
    var action = String(data.action || '');
    var result;
    switch (action) {
      case 'subscribeNewsletter':
        dyesabelRequireInternalSecretFromData_(data);
        result = subscribeNewsletter_(data);
        break;
      case 'initializeNewsletterSystem':
        dyesabelRequireInternalSecretFromData_(data);
        result = initializeNewsletterSystem_();
        break;
      case 'migrateNewsletterFromSourceWorkbook':
        dyesabelRequireInternalSecretFromData_(data);
        result = migrateNewsletterFromSourceWorkbook_();
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }
    return dyesabelCreateResponse_(true, null, result);
  } catch (error) {
    return dyesabelCreateResponse_(false, error.message || String(error));
  }
}

function getNewsletterSheet_() {
  return dyesabelGetOrCreateSheet_(dyesabelGetSpreadsheet_(), NEWSLETTER_SHEET);
}

function initializeNewsletterSystem_() {
  var sheet = getNewsletterSheet_();
  if (sheet.getLastRow() === 0) sheet.appendRow(NEWSLETTER_HEADERS);
  return { message: 'Newsletter sheet initialized successfully.' };
}

function subscribeNewsletter_(data) {
  var sheet = getNewsletterSheet_();
  if (sheet.getLastRow() === 0) sheet.appendRow(NEWSLETTER_HEADERS);
  var email = normalizeNewsletterEmail_(data.email);
  if (!isValidNewsletterEmail_(email)) throw new Error('Invalid email address');

  var source = String(data.source || dyesabelGetScriptProperty_('DEFAULT_NEWSLETTER_SOURCE', 'Website Footer')).trim();
  var subscribers = loadNewsletterSubscribers_(sheet);
  var existingIndex = subscribers.findIndex(function(subscriber) { return subscriber.emailNormalized === email; });
  var now = new Date();

  if (existingIndex >= 0) {
    subscribers[existingIndex].status = 'Active';
    subscribers[existingIndex].source = source || subscribers[existingIndex].source;
    subscribers[existingIndex].updatedAt = now;
    writeNewsletterSubscribers_(sheet, subscribers);
    return { success: true, message: 'You are already subscribed!' };
  }

  subscribers.push({
    subscriberId: Utilities.getUuid(),
    email: email,
    emailNormalized: email,
    status: 'Active',
    source: source,
    createdAt: now,
    updatedAt: now
  });
  writeNewsletterSubscribers_(sheet, subscribers);
  return { success: true, message: 'Successfully subscribed!' };
}

function normalizeNewsletterEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidNewsletterEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function loadNewsletterSubscribers_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, NEWSLETTER_HEADERS.length).getValues().filter(function(row) {
    return row[1] !== '' && row[1] != null;
  }).map(function(row) {
    return {
      subscriberId: row[0] || Utilities.getUuid(),
      email: row[1],
      emailNormalized: row[2] || normalizeNewsletterEmail_(row[1]),
      status: row[3] || 'Active',
      source: row[4] || dyesabelGetScriptProperty_('DEFAULT_NEWSLETTER_SOURCE', 'Website Footer'),
      createdAt: row[5] || new Date(),
      updatedAt: row[6] || row[5] || new Date()
    };
  });
}

function writeNewsletterSubscribers_(sheet, subscribers) {
  dyesabelWriteSheetRows_(sheet, NEWSLETTER_HEADERS, subscribers.map(function(subscriber) {
    return [
      subscriber.subscriberId || Utilities.getUuid(),
      subscriber.email || '',
      subscriber.emailNormalized || normalizeNewsletterEmail_(subscriber.email),
      subscriber.status || 'Active',
      subscriber.source || dyesabelGetScriptProperty_('DEFAULT_NEWSLETTER_SOURCE', 'Website Footer'),
      subscriber.createdAt || new Date(),
      subscriber.updatedAt || subscriber.createdAt || new Date()
    ];
  }));
}

function migrateNewsletterFromSourceWorkbook_() {
  var sourceId = dyesabelRequireScriptProperty_('SOURCE_MONOLITH_SPREADSHEET_ID');
  var sourceSheet = SpreadsheetApp.openById(sourceId).getSheetByName(NEWSLETTER_SHEET);
  var targetSheet = getNewsletterSheet_();
  dyesabelCopySheetByHeaders_(sourceSheet, targetSheet, NEWSLETTER_HEADERS);
  return { message: 'Newsletter subscribers migrated successfully.', records: Math.max(targetSheet.getLastRow() - 1, 0) };
}

// Manual runners so these appear in the Apps Script Run menu during setup.
function runInitializeNewsletterSystem() {
  return initializeNewsletterSystem_();
}

function runMigrateNewsletterFromSourceWorkbook() {
  return migrateNewsletterFromSourceWorkbook_();
}
