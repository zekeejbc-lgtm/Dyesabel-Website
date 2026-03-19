var USERS_SHEET = 'Users';
var SESSIONS_SHEET = 'Sessions';
var USER_HEADERS = ['Username', 'Password', 'Email', 'Role', 'UserId', 'ChapterId'];
var SESSION_HEADERS = ['Token', 'UserData', 'ExpiresAt'];

function doGet() {
  return dyesabelCreateResponse_(true, null, { message: 'Dyesabel Users API is online.' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var data = dyesabelParseJsonBody_(e);
    var action = String(data.action || '');
    var result;
    switch (action) {
      case 'login': result = login_(data); break;
      case 'logout': result = logout_(data); break;
      case 'validateSession': result = validateSession_(data); break;
      case 'register': result = register_(data); break;
      case 'updatePassword': result = updatePassword_(data); break;
      case 'createUser': result = createUser_(data); break;
      case 'listUsers': result = listUsers_(data); break;
      case 'deleteUser': result = deleteUser_(data); break;
      case 'getSessionUser': dyesabelRequireInternalSecretFromData_(data); result = getSessionUserAction_(data); break;
      case 'validateAdminOrEditor': dyesabelRequireInternalSecretFromData_(data); result = validateAdminOrEditorAction_(data); break;
      case 'validateAdminOnly': dyesabelRequireInternalSecretFromData_(data); result = validateAdminOnlyAction_(data); break;
      case 'initializeUsersSystem': dyesabelRequireInternalSecretFromData_(data); result = initializeUsersSystem_(); break;
      case 'migrateUsersFromSourceWorkbook': dyesabelRequireInternalSecretFromData_(data); result = migrateUsersFromSourceWorkbook_(); break;
      case 'migrateSessionsFromSourceWorkbook': dyesabelRequireInternalSecretFromData_(data); result = migrateSessionsFromSourceWorkbook_(); break;
      default: throw new Error('Unknown action: ' + action);
    }
    return dyesabelCreateResponse_(true, null, result);
  } catch (error) {
    return dyesabelCreateResponse_(false, error.message || String(error));
  } finally {
    lock.releaseLock();
  }
}

function getUsersSpreadsheet_() {
  return dyesabelGetSpreadsheet_();
}

function getUsersSheet_() {
  return dyesabelGetOrCreateSheet_(getUsersSpreadsheet_(), USERS_SHEET);
}

function getSessionsSheet_() {
  return dyesabelGetOrCreateSheet_(getUsersSpreadsheet_(), SESSIONS_SHEET);
}

function getSessionTimeoutMs_() {
  return Number(dyesabelRequireScriptProperty_('SESSION_TIMEOUT_MS'));
}

function initializeUsersSystem_() {
  var usersSheet = getUsersSheet_();
  if (usersSheet.getLastRow() === 0) usersSheet.appendRow(USER_HEADERS);
  var sessionsSheet = getSessionsSheet_();
  if (sessionsSheet.getLastRow() === 0) sessionsSheet.appendRow(SESSION_HEADERS);
  return { message: 'Users sheets initialized successfully.' };
}

function login_(data) {
  var rows = getUsersSheet_().getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.username && verifyPassword_(data.password, rows[i][1])) {
      var token = Utilities.getUuid() + '_' + new Date().getTime();
      var user = { username: rows[i][0], email: rows[i][2], role: rows[i][3], id: rows[i][4], chapterId: rows[i][5] };
      storeSession_(token, user);
      return { sessionToken: token, user: user };
    }
  }
  throw new Error('Invalid credentials');
}

function register_(data) {
  if (!dyesabelGetBooleanProperty_('ALLOW_PUBLIC_REGISTER', true)) throw new Error('Registration is disabled');
  ensureUniqueUser_(data.username, data.email);
  getUsersSheet_().appendRow([data.username, hashPassword_(data.password), data.email, 'user', Utilities.getUuid(), '']);
  return { message: 'Registration successful' };
}

function validateSession_(data) {
  var session = getSession_(data.sessionToken);
  if (!session) throw new Error('Session expired or invalid');
  return { valid: true, user: session.user };
}

function logout_(data) {
  var sheet = getSessionsSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.sessionToken) {
      sheet.deleteRow(i + 1);
      return { message: 'Logged out' };
    }
  }
  return { message: 'Session not found' };
}

function createUser_(data) {
  validateAdminOnly_(data.sessionToken);
  ensureUniqueUser_(data.username, data.email);
  var userId = Utilities.getUuid();
  getUsersSheet_().appendRow([data.username, hashPassword_(data.password), data.email, data.role, userId, data.chapterId || '']);
  return { message: 'User created successfully', user: { username: data.username, email: data.email, role: data.role, id: userId, chapterId: data.chapterId || '' } };
}

function updatePassword_(data) {
  var session = getSessionOrThrow_(data.sessionToken);
  var targetUsername = data.targetUsername || session.user.username;
  if (targetUsername !== session.user.username && session.user.role !== 'admin') throw new Error('Insufficient permissions');
  var rows = getUsersSheet_().getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === targetUsername) {
      getUsersSheet_().getRange(i + 1, 2).setValue(hashPassword_(data.newPassword));
      return { message: 'Password updated successfully' };
    }
  }
  throw new Error('User not found');
}

function listUsers_(data) {
  validateAdminOnly_(data.sessionToken);
  return {
    users: getUsersSheet_().getDataRange().getValues().slice(1).filter(function(row) { return row[0]; }).map(function(row) {
      return { username: row[0], email: row[2], role: row[3], id: row[4], chapterId: row[5] };
    })
  };
}

function deleteUser_(data) {
  validateAdminOnly_(data.sessionToken);
  var sheet = getUsersSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][4] === data.userId) {
      sheet.deleteRow(i + 1);
      return { message: 'User deleted successfully' };
    }
  }
  throw new Error('User not found');
}

function getSessionUserAction_(data) {
  return { user: getSessionOrThrow_(data.sessionToken).user };
}

function validateAdminOrEditorAction_(data) {
  return { user: validateAdminOrEditor_(data.sessionToken) };
}

function validateAdminOnlyAction_(data) {
  return { user: validateAdminOnly_(data.sessionToken) };
}

function validateAdminOrEditor_(sessionToken) {
  var user = getSessionOrThrow_(sessionToken).user;
  if (user.role !== 'admin' && user.role !== 'editor') throw new Error('Insufficient permissions');
  return user;
}

function validateAdminOnly_(sessionToken) {
  var user = getSessionOrThrow_(sessionToken).user;
  if (user.role !== 'admin') throw new Error('Admin access required');
  return user;
}

function getSessionOrThrow_(token) {
  var session = getSession_(token);
  if (!session) throw new Error('Unauthorized');
  return session;
}

function storeSession_(token, user) {
  getSessionsSheet_().appendRow([token, JSON.stringify(user), new Date(new Date().getTime() + getSessionTimeoutMs_()).toISOString()]);
}

function getSession_(token) {
  var sheet = getSessionsSheet_();
  var rows = sheet.getDataRange().getValues();
  var now = new Date();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (new Date(rows[i][2]) < now) {
      sheet.deleteRow(i + 1);
      continue;
    }
    if (rows[i][0] === token) return { token: rows[i][0], user: JSON.parse(rows[i][1]) };
  }
  return null;
}

function ensureUniqueUser_(username, email) {
  getUsersSheet_().getDataRange().getValues().slice(1).forEach(function(row) {
    if (row[0] === username) throw new Error('Username already exists');
    if (row[2] === email) throw new Error('Email already registered');
  });
}

function hashPassword_(password) {
  var salt = Utilities.getUuid();
  return salt + '$' + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password));
}

function verifyPassword_(inputPassword, storedPassword) {
  storedPassword = String(storedPassword || '');
  if (storedPassword.indexOf('$') === -1) return inputPassword === storedPassword;
  var parts = storedPassword.split('$');
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, parts[0] + inputPassword)) === parts[1];
}

function migrateUsersFromSourceWorkbook_() {
  var sourceId = dyesabelRequireScriptProperty_('SOURCE_MONOLITH_SPREADSHEET_ID');
  var sourceSheet = SpreadsheetApp.openById(sourceId).getSheetByName(USERS_SHEET);
  var targetSheet = getUsersSheet_();
  dyesabelCopySheetByHeaders_(sourceSheet, targetSheet, USER_HEADERS);
  return { message: 'Users migrated successfully.', records: Math.max(targetSheet.getLastRow() - 1, 0) };
}

function migrateSessionsFromSourceWorkbook_() {
  var sourceId = dyesabelRequireScriptProperty_('SOURCE_MONOLITH_SPREADSHEET_ID');
  var sourceSheet = SpreadsheetApp.openById(sourceId).getSheetByName(SESSIONS_SHEET);
  var targetSheet = getSessionsSheet_();
  dyesabelCopySheetByHeaders_(sourceSheet, targetSheet, SESSION_HEADERS);
  var rows = targetSheet.getDataRange().getValues();
  var now = new Date();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (new Date(rows[i][2]) < now) targetSheet.deleteRow(i + 1);
  }
  return { message: 'Sessions migrated successfully.', records: Math.max(targetSheet.getLastRow() - 1, 0) };
}

// Manual runners so these appear in the Apps Script Run menu during setup.
function runInitializeUsersSystem() {
  return initializeUsersSystem_();
}

function runMigrateUsersFromSourceWorkbook() {
  return migrateUsersFromSourceWorkbook_();
}

function runMigrateSessionsFromSourceWorkbook() {
  return migrateSessionsFromSourceWorkbook_();
}
