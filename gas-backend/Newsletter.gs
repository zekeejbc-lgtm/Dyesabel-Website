/**
 * HANDLER: Newsletter Subscription
 * This function is called by the main Code.gs when action === 'subscribeNewsletter'
 */
function handleNewsletterSubscription(data) {
  try {
    const sheetName = 'Newsletter_Subscribers';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateNewsletterSheet_(ss, sheetName);
    const email = normalizeNewsletterEmail_(data && data.email);

    if (!isValidNewsletterEmail_(email)) {
      return { success: false, error: 'Invalid email address' };
    }

    const source = (data && data.source) ? String(data.source).trim() : 'Website Footer';
    const subscribers = loadNewsletterSubscribers_(sheet);
    const existingIndex = subscribers.findIndex(function(subscriber) {
      return subscriber.emailNormalized === email;
    });
    const now = new Date();

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

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getOrCreateNewsletterSheet_(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  ensureSheetSize(sheet, 7, 2);
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() !== 'SubscriberID') {
    writeNewsletterSubscribers_(sheet, loadNewsletterSubscribers_(sheet));
  }
  return sheet;
}

function normalizeNewsletterEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidNewsletterEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function loadNewsletterSubscribers_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  if (headers[0] === 'SubscriberID') {
    return rows
      .filter(function(row) {
        return row[1] !== '' && row[1] != null;
      })
      .map(function(row) {
        return {
          subscriberId: row[0] || Utilities.getUuid(),
          email: row[1],
          emailNormalized: row[2] || normalizeNewsletterEmail_(row[1]),
          status: row[3] || 'Active',
          source: row[4] || 'Website Footer',
          createdAt: row[5] || new Date(),
          updatedAt: row[6] || row[5] || new Date()
        };
      });
  }

  return rows
    .filter(function(row) {
      return row[1] !== '' && row[1] != null;
    })
    .map(function(row) {
      return {
        subscriberId: Utilities.getUuid(),
        email: row[1],
        emailNormalized: normalizeNewsletterEmail_(row[1]),
        status: row[2] || 'Active',
        source: row[3] || 'Website Footer',
        createdAt: row[0] || new Date(),
        updatedAt: row[0] || new Date()
      };
    });
}

function writeNewsletterSubscribers_(sheet, subscribers) {
  const headers = ['SubscriberID', 'Email', 'EmailNormalized', 'Status', 'Source', 'CreatedAt', 'UpdatedAt'];
  const rows = subscribers.map(function(subscriber) {
    return [
      subscriber.subscriberId || Utilities.getUuid(),
      subscriber.email || '',
      subscriber.emailNormalized || normalizeNewsletterEmail_(subscriber.email),
      subscriber.status || 'Active',
      subscriber.source || 'Website Footer',
      subscriber.createdAt || new Date(),
      subscriber.updatedAt || subscriber.createdAt || new Date()
    ];
  });

  writeSheetRows(sheet, headers, rows);
}
