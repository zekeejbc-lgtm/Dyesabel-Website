var USERS_SHEET = 'Users';
var SESSIONS_SHEET = 'Sessions';
var USER_HEADERS = ['Username', 'Password', 'Email', 'Role', 'UserId', 'ChapterId'];
var SESSION_HEADERS = ['Token', 'UserData', 'ExpiresAt'];
var ALLOWED_USER_ROLES = { admin: true, editor: true, chapter_head: true, member: true };
var USERS_ON_EDIT_TRIGGER_HANDLER = 'runUsersOnEditTrigger';

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
      case 'updateUser': result = updateUser_(data); break;
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

function onEdit(e) {
  handleUsersSheetEdit_(e);
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
    var normalized = normalizeStoredUserRow_(rows[i], i + 1);
    if (normalized.username === data.username && verifyPassword_(data.password, normalized.password)) {
      var token = Utilities.getUuid() + '_' + new Date().getTime();
      var user = buildUserObjectFromRow_(normalized);
      storeSession_(token, user);
      return { sessionToken: token, user: user };
    }
  }
  throw new Error('Invalid credentials');
}

function register_(data) {
  if (!dyesabelGetBooleanProperty_('ALLOW_PUBLIC_REGISTER', true)) throw new Error('Registration is disabled');
  if (!data.chapterId) throw new Error('Chapter ID is required for member registration');
  ensureUniqueUser_(data.username, data.email);
  var userId = generateUserId_();
  getUsersSheet_().appendRow([data.username, hashPassword_(data.password), data.email, 'member', userId, data.chapterId]);
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
  var email = String(data.email || '');
  ensureUniqueUser_(data.username, email);
  var role = normalizeUserRole_(data.role);
  if ((role === 'chapter_head' || role === 'member') && !data.chapterId) throw new Error('Chapter ID is required for chapter heads and members');
  if (role === 'admin' && data.chapterId) throw new Error('Admin accounts cannot be assigned to a chapter');
  var userId = data.userId || generateUserId_();
  if (!isValidUserId_(userId)) throw new Error('User ID must match format dyesabel-yy-xxxx');
  ensureUniqueUserId_(userId);
  getUsersSheet_().appendRow([data.username, hashPassword_(data.password), email, role, userId, role === 'admin' ? '' : (data.chapterId || '')]);
  return { message: 'User created successfully', user: { username: data.username, email: email, role: role, id: userId, chapterId: role === 'admin' ? '' : (data.chapterId || '') } };
}

function updateUser_(data) {
  validateAdminOnly_(data.sessionToken);
  if (!data.userId) throw new Error('User ID is required');
  if (!data.username) throw new Error('Username is required');
  var email = String(data.email || '');

  var role = normalizeUserRole_(data.role);
  var chapterId = role === 'admin' ? '' : String(data.chapterId || '');
  if ((role === 'chapter_head' || role === 'member') && !chapterId) throw new Error('Chapter ID is required for chapter heads and members');
  if (role === 'admin' && data.chapterId) throw new Error('Admin accounts cannot be assigned to a chapter');

  var sheet = getUsersSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][4] || '') === String(data.userId)) {
      ensureUniqueUserForUpdate_(data.userId, data.username, email);
      sheet.getRange(i + 1, 1, 1, USER_HEADERS.length).setValues([[
        data.username,
        rows[i][1],
        email,
        role,
        rows[i][4],
        chapterId
      ]]);

      var updatedUser = {
        username: data.username,
        email: email,
        role: role,
        id: String(rows[i][4] || ''),
        chapterId: chapterId
      };
      syncSessionsForUser_(updatedUser.id, updatedUser);
      return { message: 'User updated successfully', user: updatedUser };
    }
  }

  throw new Error('User not found');
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
  var rows = getUsersSheet_().getDataRange().getValues();
  return {
    users: rows.slice(1).filter(function(row) { return row[0]; }).map(function(row, index) {
      return buildUserObjectFromRow_(normalizeStoredUserRow_(row, index + 2));
    })
  };
}

function deleteUser_(data) {
  validateAdminOnly_(data.sessionToken);
  var sheet = getUsersSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][4] === data.userId) {
      removeSessionsForUser_(String(rows[i][4] || ''));
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
  if (user.role !== 'admin' && !(user.role === 'editor' && !user.chapterId)) throw new Error('Insufficient permissions');
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

function syncSessionsForUser_(userId, user) {
  var sheet = getSessionsSheet_();
  var rows = sheet.getDataRange().getValues();
  var now = new Date();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (new Date(rows[i][2]) < now) {
      sheet.deleteRow(i + 1);
      continue;
    }
    try {
      var sessionUser = JSON.parse(rows[i][1] || '{}');
      if (String(sessionUser.id || '') === String(userId)) {
        sheet.getRange(i + 1, 2).setValue(JSON.stringify(user));
      }
    } catch (error) {
      sheet.deleteRow(i + 1);
    }
  }
}

function removeSessionsForUser_(userId) {
  var sheet = getSessionsSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    try {
      var sessionUser = JSON.parse(rows[i][1] || '{}');
      if (String(sessionUser.id || '') === String(userId)) {
        sheet.deleteRow(i + 1);
      }
    } catch (error) {
      sheet.deleteRow(i + 1);
    }
  }
}

function ensureUniqueUser_(username, email) {
  getUsersSheet_().getDataRange().getValues().slice(1).forEach(function(row) {
    if (row[0] === username) throw new Error('Username already exists');
    if (email && row[2] === email) throw new Error('Email already registered');
  });
}

function ensureUniqueUserId_(userId) {
  getUsersSheet_().getDataRange().getValues().slice(1).forEach(function(row) {
    if (String(row[4] || '') === String(userId)) throw new Error('User ID already exists');
  });
}

function ensureUniqueUserForUpdate_(userId, username, email) {
  getUsersSheet_().getDataRange().getValues().slice(1).forEach(function(row) {
    var existingUserId = String(row[4] || '');
    if (existingUserId === String(userId)) return;
    if (row[0] === username) throw new Error('Username already exists');
    if (email && row[2] === email) throw new Error('Email already registered');
  });
}

function buildUserObjectFromRow_(row) {
  return {
    username: row.username,
    email: row.email,
    role: row.role,
    id: row.userId,
    chapterId: row.chapterId
  };
}

function normalizeStoredUserRow_(row, rowNumber) {
  var normalized = {
    username: String(row[0] || ''),
    password: String(row[1] || ''),
    email: String(row[2] || ''),
    role: normalizeUserRole_(row[3]),
    userId: String(row[4] || ''),
    chapterId: String(row[5] || '')
  };
  var sheet = getUsersSheet_();

  if (!normalized.password) throw new Error('User record has no password for username: ' + normalized.username);

  if (normalized.password.indexOf('$') === -1) {
    normalized.password = hashPassword_(normalized.password);
    sheet.getRange(rowNumber, 2).setValue(normalized.password);
  }

  if (!normalized.userId || !isValidUserId_(normalized.userId)) {
    normalized.userId = generateUniqueUserId_();
    sheet.getRange(rowNumber, 5).setValue(normalized.userId);
  }

  if (normalized.role === 'admin' && normalized.chapterId) {
    normalized.chapterId = '';
    sheet.getRange(rowNumber, 6).setValue('');
  }

  if (String(row[3] || '') !== normalized.role) {
    sheet.getRange(rowNumber, 4).setValue(normalized.role);
  }

  if ((normalized.role === 'chapter_head' || normalized.role === 'member') && !normalized.chapterId) {
    throw new Error('Chapter-bound role missing chapter assignment for username: ' + normalized.username);
  }

  return normalized;
}

function normalizeUserRole_(role) {
  var normalized = String(role || 'member').toLowerCase();
  if (normalized === 'user') normalized = 'member';
  if (!ALLOWED_USER_ROLES[normalized]) throw new Error('Unsupported role: ' + role);
  return normalized;
}

function generateUserId_() {
  var yearSuffix = String(new Date().getFullYear()).slice(-2);
  var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var code = '';
  for (var i = 0; i < 4; i++) {
    code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return 'dyesabel-' + yearSuffix + '-' + code;
}

function generateUniqueUserId_() {
  var userId = generateUserId_();
  while (doesUserIdExist_(userId)) {
    userId = generateUserId_();
  }
  return userId;
}

function doesUserIdExist_(userId) {
  return getUsersSheet_().getDataRange().getValues().slice(1).some(function(row) {
    return String(row[4] || '') === String(userId);
  });
}

function isValidUserId_(userId) {
  return /^dyesabel-\d{2}-[a-z0-9]{4}$/.test(String(userId || ''));
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

function normalizeAllUsers_() {
  var sheet = getUsersSheet_();
  var rows = sheet.getDataRange().getValues();
  var updated = 0;
  for (var i = 1; i < rows.length; i++) {
    var before = JSON.stringify(rows[i]);
    normalizeStoredUserRow_(rows[i], i + 1);
    var after = JSON.stringify(sheet.getRange(i + 1, 1, 1, USER_HEADERS.length).getValues()[0]);
    if (before !== after) updated++;
  }
  return { message: 'Users normalized successfully.', updated: updated };
}

function handleUsersSheetEdit_(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (!sheet || sheet.getName() !== USERS_SHEET) return;
  if (e.range.getRow() <= 1) return;

  var editedColumn = e.range.getColumn();
  var rowNumber = e.range.getRow();
  if (editedColumn < 1 || editedColumn > USER_HEADERS.length) return;

  var rowValues = sheet.getRange(rowNumber, 1, 1, USER_HEADERS.length).getValues()[0];
  if (!rowValues[0]) return;
  normalizeStoredUserRow_(rowValues, rowNumber);
}

function ensureUsersOnEditTrigger_() {
  var spreadsheet = getUsersSpreadsheet_();
  var spreadsheetId = spreadsheet.getId();
  var triggers = ScriptApp.getProjectTriggers();
  var created = false;

  for (var i = 0; i < triggers.length; i++) {
    var trigger = triggers[i];
    if (trigger.getHandlerFunction() === USERS_ON_EDIT_TRIGGER_HANDLER && trigger.getTriggerSourceId() === spreadsheetId) {
      return { message: 'Users on-edit trigger already exists.' };
    }
  }

  ScriptApp.newTrigger(USERS_ON_EDIT_TRIGGER_HANDLER)
    .forSpreadsheet(spreadsheetId)
    .onEdit()
    .create();
  created = true;

  return { message: created ? 'Users on-edit trigger created successfully.' : 'Users on-edit trigger already exists.' };
}

function removeUsersOnEditTriggers_() {
  var spreadsheetId = getUsersSpreadsheet_().getId();
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    var trigger = triggers[i];
    if (trigger.getHandlerFunction() === USERS_ON_EDIT_TRIGGER_HANDLER && trigger.getTriggerSourceId() === spreadsheetId) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  }
  return { message: 'Users on-edit triggers removed.', removed: removed };
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

function runNormalizeAllUsers() {
  return normalizeAllUsers_();
}

function runUsersOnEditTrigger(e) {
  handleUsersSheetEdit_(e);
}

function runSetupUsersOnEditTrigger() {
  return ensureUsersOnEditTrigger_();
}

function runRemoveUsersOnEditTriggers() {
  return removeUsersOnEditTriggers_();
}
