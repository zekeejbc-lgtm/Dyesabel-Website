/**
 * Google Apps Script Backend for Dyesabel PH Authentication
 * * SETUP:
 * 1. Update SPREADSHEET_ID with your sheet ID.
 * 2. Run 'initializeSystem' once from the toolbar to setup sheets.
 * 3. Deploy as Web App (Execute as: Me, Access: Anyone).
 */

// ============================================
// CONFIGURATION
// ============================================

const SPREADSHEET_ID = '18eF1UnLorCRkZPO9mmEZMZMkjFBwLkXiGU-YxUZpkyU';
const USERS_SHEET_NAME = 'Users';
const SESSIONS_SHEET_NAME = 'Sessions';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 Hours

// ============================================
// MAIN HANDLERS
// ============================================

function doGet(e) {
  return ContentService.createTextOutput('Dyesabel PH Authentication API is running');
}

function doPost(e) {
  try {
    // Handle potential preflight or empty requests
    if (!e.postData || !e.postData.contents) {
      return createResponse(false, 'No data provided');
    }

    const data = JSON.parse(e.postData.contents);
    
    switch(data.action) {
      case 'login':
        return handleLogin(data.username, data.password);
      case 'logout':
        return handleLogout(data.sessionToken);
      case 'validateSession':
        return handleValidateSession(data.sessionToken);
      case 'register':
        return handleRegister(data.username, data.password, data.email);
      case 'updatePassword':
        return handleUpdatePassword(data.sessionToken, data.oldPassword, data.newPassword);
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createResponse(false, 'Server error: ' + error.toString());
  }
}

// ============================================
// AUTHENTICATION LOGIC
// ============================================

function handleLogin(username, password) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
  const data = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === username && row[1] === password) {
      const sessionToken = generateSessionToken();
      const user = {
        id: row[4] || Utilities.getUuid(),
        username: row[0],
        email: row[2],
        role: row[3],
        chapterId: row[5] || null
      };
      
      storeSession(sessionToken, user);
      return createResponse(true, 'Login successful', { user, sessionToken });
    }
  }
  return createResponse(false, 'Invalid username or password');
}

function handleRegister(username, password, email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
  const data = usersSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) return createResponse(false, 'Username already exists');
    if (data[i][2] === email) return createResponse(false, 'Email already registered');
  }

  const userId = Utilities.getUuid();
  usersSheet.appendRow([username, password, email, 'user', userId, '']);
  return createResponse(true, 'Registration successful');
}

function handleUpdatePassword(sessionToken, oldPassword, newPassword) {
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) return createResponse(false, 'Unauthorized');

  const userData = JSON.parse(session.userData);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
  const data = usersSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userData.username && data[i][1] === oldPassword) {
      usersSheet.getRange(i + 1, 2).setValue(newPassword);
      return createResponse(true, 'Password updated');
    }
  }
  return createResponse(false, 'Old password incorrect');
}

function handleLogout(sessionToken) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sessionsSheet = ss.getSheetByName(SESSIONS_SHEET_NAME);
  if (sessionsSheet) {
    const data = sessionsSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sessionToken) {
        sessionsSheet.deleteRow(i + 1);
        break;
      }
    }
  }
  return createResponse(true, 'Logged out');
}

function handleValidateSession(sessionToken) {
  const session = getSession(sessionToken);
  if (session && !isSessionExpired(session)) {
    return createResponse(true, 'Session valid', { user: JSON.parse(session.userData) });
  }
  return createResponse(false, 'Session expired');
}

// ============================================
// SESSION & UTILS
// ============================================

function storeSession(token, user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SESSIONS_SHEET_NAME);
  const expiresAt = new Date(new Date().getTime() + SESSION_TIMEOUT);
  sheet.appendRow([token, JSON.stringify(user), new Date().toISOString(), expiresAt.toISOString()]);
  cleanupExpiredSessions();
}

function getSession(token) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SESSIONS_SHEET_NAME);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      return { sessionToken: data[i][0], userData: data[i][1], expiresAt: data[i][3] };
    }
  }
  return null;
}

function isSessionExpired(session) {
  return new Date(session.expiresAt) < new Date();
}

function cleanupExpiredSessions() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SESSIONS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  for (let i = data.length - 1; i >= 1; i--) {
    if (new Date(data[i][3]) < now) sheet.deleteRow(i + 1);
  }
}

function generateSessionToken() {
  return Utilities.getUuid() + '_' + new Date().getTime();
}

function createResponse(success, message, data = null) {
  const res = { success, message, ...data };
  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// INITIALIZATION
// ============================================

function initializeSystem() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss.getSheetByName(USERS_SHEET_NAME)) {
    const sheet = ss.insertSheet(USERS_SHEET_NAME);
    sheet.appendRow(['Username', 'Password', 'Email', 'Role', 'User ID', 'Chapter ID']);
    sheet.appendRow(['admin', 'admin123', 'admin@dyesabel.org', 'admin', Utilities.getUuid(), '']);
  }
  if (!ss.getSheetByName(SESSIONS_SHEET_NAME)) {
    const sheet = ss.insertSheet(SESSIONS_SHEET_NAME);
    sheet.appendRow(['Token', 'UserData', 'Created', 'Expires']);
  }
}
