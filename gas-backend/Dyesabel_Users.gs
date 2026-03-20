var USERS_SHEET = 'Users';
var SESSIONS_SHEET = 'Sessions';
var LOGIN_ATTEMPTS_SHEET = 'LoginAttempts';
var SECURITY_EVENTS_SHEET = 'SecurityEvents';
var USER_HEADERS = ['Username', 'Password', 'Email', 'Role', 'UserId', 'ChapterId'];
var LEGACY_SESSION_HEADERS = ['Token', 'UserData', 'ExpiresAt'];
var SESSION_HEADERS = ['SessionId', 'TokenHash', 'UserData', 'ExpiresAt', 'CreatedAt', 'LastSeenAt', 'RotatedFromSessionId'];
var LOGIN_ATTEMPT_HEADERS = ['Scope', 'Key', 'Failures', 'LockedUntil', 'LastFailureAt'];
var SECURITY_EVENT_HEADERS = ['Timestamp', 'EventType', 'Username', 'UserId', 'SessionId', 'Details'];
var ALLOWED_USER_ROLES = { admin: true, editor: true, chapter_head: true, member: true };
var USERS_ON_EDIT_TRIGGER_HANDLER = 'runUsersOnEditTrigger';
var PASSWORD_HASH_VERSION = 'v2';

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
      case 'updateOwnProfile': result = updateOwnProfile_(data); break;
      case 'updatePassword': result = updatePassword_(data); break;
      case 'createUser': result = createUser_(data); break;
      case 'updateUser': result = updateUser_(data); break;
      case 'listUsers': result = listUsers_(data); break;
      case 'deleteUser': result = deleteUser_(data); break;
      case 'revokeUserSessions': result = revokeUserSessionsAction_(data); break;
      case 'revokeAllSessions': result = revokeAllSessionsAction_(data); break;
      case 'getSecurityStatus': result = getSecurityStatusAction_(data); break;
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
  var sheet = dyesabelGetOrCreateSheet_(getUsersSpreadsheet_(), SESSIONS_SHEET);
  ensureSessionsSheetSchema_(sheet);
  return sheet;
}

function getLoginAttemptsSheet_() {
  var sheet = dyesabelGetOrCreateSheet_(getUsersSpreadsheet_(), LOGIN_ATTEMPTS_SHEET);
  ensureSheetHeaders_(sheet, LOGIN_ATTEMPT_HEADERS);
  return sheet;
}

function getSecurityEventsSheet_() {
  var sheet = dyesabelGetOrCreateSheet_(getUsersSpreadsheet_(), SECURITY_EVENTS_SHEET);
  ensureSheetHeaders_(sheet, SECURITY_EVENT_HEADERS);
  return sheet;
}

function getSessionIdleTimeoutMs_() {
  return Number(dyesabelGetScriptProperty_('SESSION_IDLE_TIMEOUT_MS', dyesabelGetScriptProperty_('SESSION_TIMEOUT_MS', 30 * 60 * 1000)));
}

function getSessionAbsoluteTimeoutMs_() {
  return Number(dyesabelGetScriptProperty_('SESSION_ABSOLUTE_TIMEOUT_MS', 8 * 60 * 60 * 1000));
}

function getLoginMaxAttempts_() {
  return Number(dyesabelGetScriptProperty_('LOGIN_MAX_ATTEMPTS', 5));
}

function getLoginLockoutMs_() {
  return Number(dyesabelGetScriptProperty_('LOGIN_LOCKOUT_MS', 15 * 60 * 1000));
}

function getPasswordHashIterations_() {
  return Number(dyesabelGetScriptProperty_('PASSWORD_HASH_ITERATIONS', 12000));
}

function getTokenPepper_() {
  return String(dyesabelGetScriptProperty_('SESSION_TOKEN_PEPPER', ''));
}

function getPasswordPepper_() {
  return String(dyesabelGetScriptProperty_('PASSWORD_HASH_PEPPER', ''));
}

function onEdit(e) {
  handleUsersSheetEdit_(e);
}

function initializeUsersSystem_() {
  var usersSheet = getUsersSheet_();
  ensureSheetHeaders_(usersSheet, USER_HEADERS);
  getSessionsSheet_();
  getLoginAttemptsSheet_();
  getSecurityEventsSheet_();
  return { message: 'Users sheets initialized successfully.' };
}

function login_(data) {
  var username = validateUsernameInput_(data.username);
  var password = validatePasswordInputForLogin_(data.password);
  var fingerprint = getClientFingerprint_(data);
  var rows = getUsersSheet_().getDataRange().getValues();
  var matchedUser = null;
  var matchedRowNumber = 0;

  assertLoginAllowed_(username, fingerprint);

  for (var i = 1; i < rows.length; i++) {
    var normalized = normalizeStoredUserRow_(rows[i], i + 1);
    if (normalized.username === username) {
      matchedUser = normalized;
      matchedRowNumber = i + 1;
      break;
    }
  }

  if (!matchedUser || !verifyPassword_(password, matchedUser.password)) {
    recordLoginFailure_(username, fingerprint);
    logSecurityEvent_('login_failure', {
      username: username,
      userId: matchedUser ? matchedUser.userId : '',
      details: { fingerprint: fingerprint }
    });
    throw new Error('Invalid username or password');
  }

  if (needsPasswordRehash_(matchedUser.password)) {
    matchedUser.password = hashPassword_(password);
    getUsersSheet_().getRange(matchedRowNumber, 2).setValue(matchedUser.password);
  }

  resetLoginFailures_(username, fingerprint);

  var user = buildUserObjectFromRow_(matchedUser);
  var session = createSession_(user, '');
  logSecurityEvent_('login_success', {
    username: user.username,
    userId: user.id,
    sessionId: session.sessionId,
    details: { fingerprint: fingerprint }
  });
  return { sessionToken: session.token, user: user };
}

function register_(data) {
  if (!dyesabelGetBooleanProperty_('ALLOW_PUBLIC_REGISTER', true)) throw new Error('Registration is disabled');
  var username = validateUsernameInput_(data.username);
  var password = validatePasswordStrength_(data.password);
  var email = validateEmailInput_(data.email, true);
  if (!data.chapterId) throw new Error('Chapter ID is required for member registration');
  ensureUniqueUser_(username, email);
  var userId = generateUserId_();
  getUsersSheet_().appendRow([username, hashPassword_(password), email, 'member', userId, data.chapterId]);
  logSecurityEvent_('user_registered', {
    username: username,
    userId: userId,
    details: { chapterId: String(data.chapterId || '') }
  });
  return { message: 'Registration successful' };
}

function validateSession_(data) {
  var session = getSessionOrThrow_(data.sessionToken);
  return { valid: true, user: session.user };
}

function logout_(data) {
  var removedSession = removeSessionByToken_(data.sessionToken);
  if (removedSession) {
    logSecurityEvent_('logout', {
      username: removedSession.user && removedSession.user.username,
      userId: removedSession.user && removedSession.user.id,
      sessionId: removedSession.sessionId
    });
    return { message: 'Logged out' };
  }
  return { message: 'Session not found' };
}

function createUser_(data) {
  var admin = validateAdminOnly_(data.sessionToken);
  var username = validateUsernameInput_(data.username);
  var password = validatePasswordStrength_(data.password);
  var email = validateEmailInput_(data.email, false);
  ensureUniqueUser_(username, email);
  var role = normalizeUserRole_(data.role);
  if ((role === 'chapter_head' || role === 'member') && !data.chapterId) throw new Error('Chapter ID is required for chapter heads and members');
  if (role === 'admin' && data.chapterId) throw new Error('Admin accounts cannot be assigned to a chapter');
  var userId = data.userId || generateUserId_();
  if (!isValidUserId_(userId)) throw new Error('User ID must match format dyesabel-yy-xxxx');
  ensureUniqueUserId_(userId);
  getUsersSheet_().appendRow([username, hashPassword_(password), email, role, userId, role === 'admin' ? '' : (data.chapterId || '')]);
  logSecurityEvent_('user_created', {
    username: username,
    userId: userId,
    sessionId: getSessionIdFromToken_(data.sessionToken),
    details: { actorUserId: admin.id, role: role, chapterId: role === 'admin' ? '' : (data.chapterId || '') }
  });
  return { message: 'User created successfully', user: { username: username, email: email, role: role, id: userId, chapterId: role === 'admin' ? '' : (data.chapterId || '') } };
}

function updateUser_(data) {
  var admin = validateAdminOnly_(data.sessionToken);
  if (!data.userId) throw new Error('User ID is required');
  var username = validateUsernameInput_(data.username);
  var email = validateEmailInput_(data.email, false);

  var role = normalizeUserRole_(data.role);
  var chapterId = role === 'admin' ? '' : String(data.chapterId || '');
  if ((role === 'chapter_head' || role === 'member') && !chapterId) throw new Error('Chapter ID is required for chapter heads and members');
  if (role === 'admin' && data.chapterId) throw new Error('Admin accounts cannot be assigned to a chapter');

  var sheet = getUsersSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][4] || '') === String(data.userId)) {
      ensureUniqueUserForUpdate_(data.userId, username, email);
      var previousRole = normalizeUserRole_(rows[i][3]);
      var previousChapterId = String(rows[i][5] || '');
      sheet.getRange(i + 1, 1, 1, USER_HEADERS.length).setValues([[
        username,
        rows[i][1],
        email,
        role,
        rows[i][4],
        chapterId
      ]]);

      var updatedUser = {
        username: username,
        email: email,
        role: role,
        id: String(rows[i][4] || ''),
        chapterId: chapterId
      };
      var sessionsRevoked = previousRole !== role || previousChapterId !== chapterId;
      if (sessionsRevoked) {
        revokeSessionsForUser_(updatedUser.id, '');
      } else {
        syncSessionsForUser_(updatedUser.id, updatedUser);
      }
      logSecurityEvent_('user_updated', {
        username: updatedUser.username,
        userId: updatedUser.id,
        sessionId: getSessionIdFromToken_(data.sessionToken),
        details: {
          actorUserId: admin.id,
          sessionsRevoked: sessionsRevoked,
          role: role,
          chapterId: chapterId
        }
      });
      return { message: 'User updated successfully', user: updatedUser, sessionsRevoked: sessionsRevoked };
    }
  }

  throw new Error('User not found');
}

function updatePassword_(data) {
  var session = getSessionOrThrow_(data.sessionToken);
  var targetUsername = data.targetUsername || session.user.username;
  var nextPassword = validatePasswordStrength_(data.newPassword);
  if (targetUsername !== session.user.username && session.user.role !== 'admin') throw new Error('Insufficient permissions');
  var sheet = getUsersSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === targetUsername) {
      var targetUser = buildUserObjectFromRow_(normalizeStoredUserRow_(rows[i], i + 1));
      sheet.getRange(i + 1, 2).setValue(hashPassword_(nextPassword));
      revokeSessionsForUser_(targetUser.id, '');
      logSecurityEvent_('password_changed', {
        username: targetUser.username,
        userId: targetUser.id,
        sessionId: session.sessionId,
        details: { actorUserId: session.user.id }
      });
      if (String(targetUser.id) === String(session.user.id)) {
        var rotatedSession = createSession_(targetUser, session.sessionId);
        return {
          message: 'Password updated successfully',
          user: targetUser,
          sessionToken: rotatedSession.token,
          sessionRotated: true
        };
      }
      return { message: 'Password updated successfully', sessionsRevoked: true };
    }
  }
  throw new Error('User not found');
}

function updateOwnProfile_(data) {
  var session = getSessionOrThrow_(data.sessionToken);
  var nextUsername = validateUsernameInput_(data.username);
  var nextEmail = validateEmailInput_(data.email, true);
  var nextPassword = String(data.newPassword || '');

  var sheet = getUsersSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][4] || '') === String(session.user.id || '')) {
      ensureUniqueUserForUpdate_(String(rows[i][4] || ''), nextUsername, nextEmail);
      sheet.getRange(i + 1, 1).setValue(nextUsername);
      sheet.getRange(i + 1, 3).setValue(nextEmail);
      if (nextPassword) {
        sheet.getRange(i + 1, 2).setValue(hashPassword_(validatePasswordStrength_(nextPassword)));
      }

      var updatedUser = {
        username: nextUsername,
        email: nextEmail,
        role: normalizeUserRole_(rows[i][3]),
        id: String(rows[i][4] || ''),
        chapterId: String(rows[i][5] || '')
      };
      if (nextPassword) {
        revokeSessionsForUser_(updatedUser.id, '');
      } else {
        syncSessionsForUser_(updatedUser.id, updatedUser);
      }
      logSecurityEvent_('profile_updated', {
        username: updatedUser.username,
        userId: updatedUser.id,
        sessionId: session.sessionId,
        details: { passwordChanged: !!nextPassword }
      });
      if (nextPassword) {
        var rotatedSession = createSession_(updatedUser, session.sessionId);
        return {
          message: 'Profile updated successfully',
          user: updatedUser,
          sessionToken: rotatedSession.token,
          sessionRotated: true
        };
      }
      return { message: 'Profile updated successfully', user: updatedUser };
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
  var admin = validateAdminOnly_(data.sessionToken);
  var sheet = getUsersSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][4] || '') === String(data.userId || '')) {
      revokeSessionsForUser_(String(rows[i][4] || ''), '');
      sheet.deleteRow(i + 1);
      logSecurityEvent_('user_deleted', {
        username: String(rows[i][0] || ''),
        userId: String(rows[i][4] || ''),
        sessionId: getSessionIdFromToken_(data.sessionToken),
        details: { actorUserId: admin.id }
      });
      return { message: 'User deleted successfully' };
    }
  }
  throw new Error('User not found');
}

function revokeUserSessionsAction_(data) {
  var admin = validateAdminOnly_(data.sessionToken);
  if (!data.userId) throw new Error('User ID is required');
  var removed = revokeSessionsForUser_(String(data.userId), '');
  logSecurityEvent_('sessions_revoked_user', {
    userId: String(data.userId),
    sessionId: getSessionIdFromToken_(data.sessionToken),
    details: { actorUserId: admin.id, removed: removed }
  });
  return { message: 'User sessions revoked.', removed: removed };
}

function revokeAllSessionsAction_(data) {
  var admin = validateAdminOnly_(data.sessionToken);
  var removed = revokeAllSessions_();
  logSecurityEvent_('sessions_revoked_all', {
    userId: admin.id,
    sessionId: getSessionIdFromToken_(data.sessionToken),
    details: { actorUserId: admin.id, removed: removed }
  });
  return { message: 'All sessions revoked.', removed: removed };
}

function getSecurityStatusAction_(data) {
  validateAdminOnly_(data.sessionToken);
  return getSecurityStatus_();
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
  var session = getSession_(token, true);
  if (!session) throw new Error('Unauthorized');
  return session;
}

function createSession_(user, rotatedFromSessionId) {
  var session = generateSessionCredentials_();
  var now = new Date();
  var createdAt = now.toISOString();
  var expiresAt = new Date(now.getTime() + getSessionIdleTimeoutMs_()).toISOString();
  getSessionsSheet_().appendRow([
    session.sessionId,
    hashSessionToken_(session.token),
    JSON.stringify(user),
    expiresAt,
    createdAt,
    createdAt,
    String(rotatedFromSessionId || '')
  ]);
  return { token: session.token, sessionId: session.sessionId };
}

function getSession_(token, touchSession) {
  if (!token) return null;
  var sheet = getSessionsSheet_();
  var rows = sheet.getDataRange().getValues();
  var now = new Date();
  var tokenHash = hashSessionToken_(token);
  for (var i = rows.length - 1; i >= 1; i--) {
    if (!rowHasSessionTokenHash_(rows[i])) continue;
    if (isSessionExpired_(rows[i], now)) {
      sheet.deleteRow(i + 1);
      continue;
    }
    if (String(rows[i][1] || '') !== tokenHash) continue;
    try {
      var user = JSON.parse(rows[i][2] || '{}');
      if (touchSession !== false) {
        var nextExpiresAt = new Date(now.getTime() + getSessionIdleTimeoutMs_()).toISOString();
        sheet.getRange(i + 1, 4, 1, 3).setValues([[nextExpiresAt, rows[i][4] || now.toISOString(), now.toISOString()]]);
        rows[i][3] = nextExpiresAt;
        rows[i][5] = now.toISOString();
      }
      return {
        sessionId: String(rows[i][0] || ''),
        tokenHash: String(rows[i][1] || ''),
        user: user,
        expiresAt: String(rows[i][3] || ''),
        createdAt: String(rows[i][4] || ''),
        lastSeenAt: String(rows[i][5] || '')
      };
    } catch (error) {
      sheet.deleteRow(i + 1);
      return null;
    }
  }
  return null;
}

function syncSessionsForUser_(userId, user) {
  var sheet = getSessionsSheet_();
  var rows = sheet.getDataRange().getValues();
  var now = new Date();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (!rowHasSessionTokenHash_(rows[i])) continue;
    if (isSessionExpired_(rows[i], now)) {
      sheet.deleteRow(i + 1);
      continue;
    }
    try {
      var sessionUser = JSON.parse(rows[i][2] || '{}');
      if (String(sessionUser.id || '') === String(userId)) {
        sheet.getRange(i + 1, 3).setValue(JSON.stringify(user));
      }
    } catch (error) {
      sheet.deleteRow(i + 1);
    }
  }
}

function revokeSessionsForUser_(userId, excludeSessionId) {
  var sheet = getSessionsSheet_();
  var rows = sheet.getDataRange().getValues();
  var removed = 0;
  for (var i = rows.length - 1; i >= 1; i--) {
    try {
      var sessionUser = JSON.parse(rows[i][2] || '{}');
      var sessionId = String(rows[i][0] || '');
      if (String(sessionUser.id || '') === String(userId) && sessionId !== String(excludeSessionId || '')) {
        sheet.deleteRow(i + 1);
        removed++;
      }
    } catch (error) {
      sheet.deleteRow(i + 1);
      removed++;
    }
  }
  return removed;
}

function revokeAllSessions_() {
  var sheet = getSessionsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  var removed = lastRow - 1;
  sheet.getRange(2, 1, removed, SESSION_HEADERS.length).clearContent();
  sheet.deleteRows(2, removed);
  return removed;
}

function removeSessionByToken_(token) {
  if (!token) return null;
  var sheet = getSessionsSheet_();
  var rows = sheet.getDataRange().getValues();
  var tokenHash = hashSessionToken_(token);
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][1] || '') !== tokenHash) continue;
    var result = {
      sessionId: String(rows[i][0] || ''),
      user: safeParseJsonObject_(rows[i][2])
    };
    sheet.deleteRow(i + 1);
    return result;
  }
  return null;
}

function ensureUniqueUser_(username, email) {
  getUsersSheet_().getDataRange().getValues().slice(1).forEach(function(row) {
    if (String(row[0] || '') === String(username || '')) throw new Error('Username already exists');
    if (email && String(row[2] || '').toLowerCase() === String(email || '').toLowerCase()) throw new Error('Email already registered');
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
    if (String(row[0] || '') === String(username || '')) throw new Error('Username already exists');
    if (email && String(row[2] || '').toLowerCase() === String(email || '').toLowerCase()) throw new Error('Email already registered');
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
  var salt = generateRandomBase64Url_(16);
  var iterations = getPasswordHashIterations_();
  return PASSWORD_HASH_VERSION + '$' + iterations + '$' + salt + '$' + slowHashString_(salt + ':' + String(password || ''), iterations, getPasswordPepper_());
}

function verifyPassword_(inputPassword, storedPassword) {
  storedPassword = String(storedPassword || '');
  if (storedPassword.indexOf('$') === -1) return inputPassword === storedPassword;
  var parts = storedPassword.split('$');
  if (parts.length === 4 && parts[0] === PASSWORD_HASH_VERSION) {
    return slowHashString_(parts[2] + ':' + String(inputPassword || ''), Number(parts[1] || 0), getPasswordPepper_()) === parts[3];
  }
  if (parts.length === 2) {
    return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, parts[0] + inputPassword)) === parts[1];
  }
  return false;
}

function needsPasswordRehash_(storedPassword) {
  storedPassword = String(storedPassword || '');
  if (!storedPassword) return true;
  var parts = storedPassword.split('$');
  if (parts.length !== 4) return true;
  if (parts[0] !== PASSWORD_HASH_VERSION) return true;
  return Number(parts[1] || 0) < getPasswordHashIterations_();
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
  if (!sourceSheet || sourceSheet.getLastRow() < 1) {
    ensureSheetHeaders_(targetSheet, SESSION_HEADERS);
    return { message: 'Sessions migrated successfully.', records: 0 };
  }

  var values = sourceSheet.getDataRange().getValues();
  var headers = values[0] || [];
  var migratedRows = [SESSION_HEADERS];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row || !row[0]) continue;
    if (String(headers[0] || '') === SESSION_HEADERS[0]) {
      migratedRows.push([
        row[0] || Utilities.getUuid(),
        row[1] || '',
        row[2] || '{}',
        row[3] || '',
        row[4] || new Date().toISOString(),
        row[5] || new Date().toISOString(),
        row[6] || ''
      ]);
      continue;
    }
    migratedRows.push([
      Utilities.getUuid(),
      hashSessionToken_(String(row[0] || '')),
      row[1] || '{}',
      row[2] || '',
      new Date().toISOString(),
      new Date().toISOString(),
      ''
    ]);
  }
  dyesabelEnsureSheetSize_(targetSheet, SESSION_HEADERS.length, Math.max(migratedRows.length, 2));
  targetSheet.clearContents();
  targetSheet.getRange(1, 1, migratedRows.length, SESSION_HEADERS.length).setValues(migratedRows);
  targetSheet.setFrozenRows(1);
  purgeExpiredSessions_();
  return { message: 'Sessions migrated successfully.', records: Math.max(targetSheet.getLastRow() - 1, 0) };
}

function ensureSessionsSheetSchema_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SESSION_HEADERS);
    return;
  }
  if (dyesabelSheetHasHeaders_(sheet, SESSION_HEADERS)) return;
  if (dyesabelSheetHasHeaders_(sheet, LEGACY_SESSION_HEADERS)) {
    migrateLegacySessionsSheet_(sheet);
    return;
  }
  ensureSheetHeaders_(sheet, SESSION_HEADERS);
}

function ensureSheetHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }
  if (!dyesabelSheetHasHeaders_(sheet, headers)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function migrateLegacySessionsSheet_(sheet) {
  var values = sheet.getDataRange().getValues();
  var migratedRows = [SESSION_HEADERS];
  var nowIso = new Date().toISOString();
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row || !row[0]) continue;
    migratedRows.push([
      Utilities.getUuid(),
      hashSessionToken_(String(row[0] || '')),
      row[1] || '{}',
      row[2] || '',
      nowIso,
      nowIso,
      ''
    ]);
  }
  dyesabelEnsureSheetSize_(sheet, SESSION_HEADERS.length, Math.max(migratedRows.length, 2));
  sheet.clearContents();
  sheet.getRange(1, 1, migratedRows.length, SESSION_HEADERS.length).setValues(migratedRows);
  sheet.setFrozenRows(1);
}

function generateSessionCredentials_() {
  return {
    sessionId: Utilities.getUuid(),
    token: Utilities.getUuid() + '.' + generateRandomBase64Url_(32) + '.' + new Date().getTime()
  };
}

function hashSessionToken_(token) {
  return Utilities.base64Encode(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(token || '') + ':' + getTokenPepper_()
  ));
}

function slowHashString_(value, iterations, pepper) {
  var output = String(value || '') + ':' + String(pepper || '');
  for (var i = 0; i < iterations; i++) {
    output = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, output + ':' + i));
  }
  return output;
}

function generateRandomBase64Url_(numBytes) {
  return Utilities.base64EncodeWebSafe(Utilities.getUuid() + ':' + Utilities.getUuid() + ':' + Math.random() + ':' + numBytes).replace(/=+$/g, '');
}

function isSessionExpired_(row, now) {
  var expiresAt = new Date(String(row[3] || ''));
  var createdAt = new Date(String(row[4] || ''));
  if (String(expiresAt) === 'Invalid Date') return true;
  if (String(createdAt) === 'Invalid Date') return true;
  if (expiresAt.getTime() < now.getTime()) return true;
  return createdAt.getTime() + getSessionAbsoluteTimeoutMs_() < now.getTime();
}

function rowHasSessionTokenHash_(row) {
  return !!String(row[1] || '');
}

function purgeExpiredSessions_() {
  var sheet = getSessionsSheet_();
  var rows = sheet.getDataRange().getValues();
  var now = new Date();
  var removed = 0;
  for (var i = rows.length - 1; i >= 1; i--) {
    if (isSessionExpired_(rows[i], now)) {
      sheet.deleteRow(i + 1);
      removed++;
    }
  }
  return removed;
}

function getSessionIdFromToken_(token) {
  var session = getSession_(token, false);
  return session ? session.sessionId : '';
}

function getClientFingerprint_(data) {
  return String((data && data.clientFingerprint) || '').slice(0, 180);
}

function assertLoginAllowed_(username, fingerprint) {
  var scopes = getLoginAttemptScopes_(username, fingerprint);
  var rows = getLoginAttemptsSheet_().getDataRange().getValues();
  var now = new Date();
  for (var i = 1; i < rows.length; i++) {
    var lockedUntil = String(rows[i][3] || '');
    if (!lockedUntil) continue;
    var matchesScope = scopes.some(function(scope) {
      return String(rows[i][0] || '') === scope.scope && String(rows[i][1] || '') === scope.key;
    });
    if (matchesScope && new Date(lockedUntil).getTime() > now.getTime()) {
      logSecurityEvent_('login_locked', {
        username: username,
        details: { fingerprint: fingerprint, lockedUntil: lockedUntil }
      });
      throw new Error('Too many failed login attempts. Try again later.');
    }
  }
}

function recordLoginFailure_(username, fingerprint) {
  var scopes = getLoginAttemptScopes_(username, fingerprint);
  var sheet = getLoginAttemptsSheet_();
  var rows = sheet.getDataRange().getValues();
  var nowIso = new Date().toISOString();
  for (var s = 0; s < scopes.length; s++) {
    var scope = scopes[s];
    var updated = false;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '') === scope.scope && String(rows[i][1] || '') === scope.key) {
        var failures = Number(rows[i][2] || 0) + 1;
        var lockedUntil = failures >= getLoginMaxAttempts_() ? new Date(new Date().getTime() + getLoginLockoutMs_()).toISOString() : '';
        sheet.getRange(i + 1, 1, 1, LOGIN_ATTEMPT_HEADERS.length).setValues([[scope.scope, scope.key, failures, lockedUntil, nowIso]]);
        updated = true;
        break;
      }
    }
    if (!updated) {
      sheet.appendRow([scope.scope, scope.key, 1, '', nowIso]);
    }
  }
}

function resetLoginFailures_(username, fingerprint) {
  var scopes = getLoginAttemptScopes_(username, fingerprint);
  var sheet = getLoginAttemptsSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    for (var s = 0; s < scopes.length; s++) {
      if (String(rows[i][0] || '') === scopes[s].scope && String(rows[i][1] || '') === scopes[s].key) {
        sheet.getRange(i + 1, 1, 1, LOGIN_ATTEMPT_HEADERS.length).setValues([[scopes[s].scope, scopes[s].key, 0, '', '']]);
        break;
      }
    }
  }
}

function getLoginAttemptScopes_(username, fingerprint) {
  var scopes = [{ scope: 'username', key: String(username || '').toLowerCase() }];
  if (fingerprint) scopes.push({ scope: 'fingerprint', key: fingerprint });
  return scopes;
}

function logSecurityEvent_(eventType, payload) {
  payload = payload || {};
  getSecurityEventsSheet_().appendRow([
    new Date().toISOString(),
    String(eventType || ''),
    String(payload.username || ''),
    String(payload.userId || ''),
    String(payload.sessionId || ''),
    JSON.stringify(payload.details || {})
  ]);
}

function getSecurityStatus_() {
  var sessionRows = getSessionsSheet_().getDataRange().getValues();
  var loginAttemptRows = getLoginAttemptsSheet_().getDataRange().getValues();
  var now = new Date();
  var activeSessions = 0;
  var lockedScopes = 0;
  for (var i = 1; i < sessionRows.length; i++) {
    if (!isSessionExpired_(sessionRows[i], now)) activeSessions++;
  }
  for (var j = 1; j < loginAttemptRows.length; j++) {
    if (String(loginAttemptRows[j][3] || '') && new Date(loginAttemptRows[j][3]).getTime() > now.getTime()) lockedScopes++;
  }
  return {
    activeSessions: activeSessions,
    lockedScopes: lockedScopes,
    securityEvents: Math.max(getSecurityEventsSheet_().getLastRow() - 1, 0)
  };
}

function validateUsernameInput_(username) {
  var normalized = String(username || '').trim();
  if (!normalized) throw new Error('Username is required');
  if (!/^[A-Za-z0-9_.-]{3,40}$/.test(normalized)) throw new Error('Username must be 3-40 characters and use only letters, numbers, dot, underscore, or dash');
  return normalized;
}

function validateEmailInput_(email, required) {
  var normalized = String(email || '').trim();
  if (!normalized) {
    if (required) throw new Error('Email is required');
    return '';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Email address is invalid');
  return normalized.toLowerCase();
}

function validatePasswordStrength_(password) {
  var normalized = String(password || '');
  if (!normalized) throw new Error('Password is required');
  if (normalized.length < 8) throw new Error('Password must be at least 8 characters long');
  if (!/[A-Za-z]/.test(normalized) || !/[0-9]/.test(normalized)) throw new Error('Password must include at least one letter and one number');
  return normalized;
}

function validatePasswordInputForLogin_(password) {
  var normalized = String(password || '');
  if (!normalized) throw new Error('Password is required');
  return normalized;
}

function safeParseJsonObject_(value) {
  try {
    return JSON.parse(value || '{}');
  } catch (error) {
    return {};
  }
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

function runRevokeAllSessions() {
  return { message: 'All sessions revoked.', removed: revokeAllSessions_() };
}
