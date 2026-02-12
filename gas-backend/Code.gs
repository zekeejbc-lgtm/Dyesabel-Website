// ============================================
// 1. CONFIGURATION
// ============================================

// REPLACE THIS with your actual Google Sheet ID
const SPREADSHEET_ID = '18eF1UnLorCRkZPO9mmEZMZMkjFBwLkXiGU-YxUZpkyU'; 

// Sheet Names
const SHEET_USERS = 'Users';
const SHEET_SESSIONS = 'Sessions';
const SHEET_LOGS = 'ImageUploads';
const SHEET_ORG = 'OrgSettings';

// Session Timeout (24 Hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; 

// Default Drive Folder ID (Optional fallback if no folder created)
// If left empty, files go to Root
const DEFAULT_ROOT_FOLDER_ID = ''; 

// ============================================
// 2. MAIN ENTRY POINTS (CORS BYPASS)
// ============================================

function doGet(e) {
  return ContentService.createTextOutput('Dyesabel PH API is Online.');
}

function doPost(e) {
  // Lock to prevent concurrent write issues
  const lock = LockService.getScriptLock();
  
  try {
    // Wait up to 10 seconds for other processes
    lock.waitLock(10000);

    // CRITICAL: Parse text/plain body manually to bypass CORS preflight
    const data = JSON.parse(e.postData.contents);
    let result = {};

    // --- ROUTER ---
    switch (data.action) {
      // Auth
      case 'login':           result = handleLogin(data); break;
      case 'logout':          result = handleLogout(data); break;
      case 'validateSession': result = handleValidateSession(data); break;
      case 'register':        result = handleRegister(data); break;
      case 'updatePassword':  result = handleUpdatePassword(data); break;
      case 'createUser':      result = handleCreateUser(data); break;
      case 'listUsers':       result = handleListUsers(data); break;
      case 'deleteUser':      result = handleDeleteUser(data); break;

      // Drive / Files
      case 'uploadImage':       result = handleUploadImage(data); break;
      case 'uploadImageFromUrl': result = handleUploadFromUrl(data); break;
      case 'createFolder':      result = handleCreateFolder(data); break;
      case 'deleteImage':       result = handleDeleteImage(data); break;
      case 'listImages':        result = handleListImages(data); break;

      // Content / Data
      case 'getOrgSettings':    result = handleGetOrgSettings(data); break;
      case 'updateOrgSettings': result = handleUpdateOrgSettings(data); break;
      case 'savePillars':       result = handleSaveData('Pillars', data.pillars, data.sessionToken); break;
      case 'loadPillars':       result = handleLoadData('Pillars'); break;
      case 'saveChapter':       result = handleSaveChapter(data); break;
      case 'loadChapter':       result = handleLoadChapter(data); break;
      case 'saveLandingPage':   result = handleSaveData('LandingPage', data.landingPage, data.sessionToken); break;
      case 'loadLandingPage':   result = handleLoadData('LandingPage'); break;
      
      // Generic Data Handlers (Partners, Stories, Founders)
      case 'savePartners':      result = handleSaveData('Partners', data.partners, data.sessionToken); break;
      case 'loadPartners':      result = handleLoadData('Partners'); break;
      case 'saveStories':       result = handleSaveData('Stories', data.stories, data.sessionToken); break;
      case 'loadStories':       result = handleLoadData('Stories'); break;
      case 'saveFounders':      result = handleSaveData('Founders', data.founders, data.sessionToken); break;
      case 'loadFounders':      result = handleLoadData('Founders'); break;

      default:
        throw new Error('Unknown action: ' + data.action);
    }

    return createResponse(true, null, result);

  } catch (error) {
    return createResponse(false, error.toString());
  } finally {
    lock.releaseLock();
  }
}

// ============================================
// 3. AUTHENTICATION HANDLERS
// ============================================

function handleLogin(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    // Row: [Username, Password, Email, Role, UserId, ChapterId]
    if (rows[i][0] === data.username && rows[i][1] === data.password) {
      const token = Utilities.getUuid() + '_' + new Date().getTime();
      const user = {
        username: rows[i][0],
        email: rows[i][2],
        role: rows[i][3],
        id: rows[i][4],
        chapterId: rows[i][5]
      };
      
      storeSession(token, user);
      return { sessionToken: token, user: user };
    }
  }
  throw new Error('Invalid credentials');
}

function handleRegister(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();

  // Check duplicates
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.username) throw new Error('Username taken');
    if (rows[i][2] === data.email) throw new Error('Email already registered');
  }

  const newId = Utilities.getUuid();
  // Default role is 'user'
  sheet.appendRow([data.username, data.password, data.email, 'user', newId, '']);
  return { message: 'Registration successful' };
}

function handleValidateSession(data) {
  const session = getSession(data.sessionToken);
  if (!session) throw new Error('Session expired or invalid');
  return { valid: true, user: session.user };
}

function handleLogout(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_SESSIONS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.sessionToken) {
      sheet.deleteRow(i + 1);
      return { message: 'Logged out' };
    }
  }
  return { message: 'Session not found' };
}

// ============================================
// 4. DRIVE & FILE HANDLERS
// ============================================

function handleUploadImage(data) {
  validateSessionOrThrow(data.sessionToken);

  // 1. Determine Folder: Use custom ID if provided, otherwise default
  let folder;
  if (data.customFolderId) {
    folder = DriveApp.getFolderById(data.customFolderId);
  } else if (DEFAULT_ROOT_FOLDER_ID) {
    folder = DriveApp.getFolderById(DEFAULT_ROOT_FOLDER_ID);
  } else {
    folder = DriveApp.getRootFolder();
  }

  // 2. Process File
  const decoded = Utilities.base64Decode(data.fileData);
  const blob = Utilities.newBlob(decoded, data.fileType, data.fileName);
  const file = folder.createFile(blob);

  // 3. Set Public Access (Silent Fail Safe)
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log('Warning: Could not set public permission. ' + e.toString());
  }

  // 4. Log
  logUpload(data.sessionToken, file.getId(), file.getName(), folder.getName());

  return {
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: file.getDownloadUrl(),
    thumbnailUrl: `https://drive.google.com/thumbnail?sz=w1000&id=${file.getId()}`
  };
}

function handleUploadFromUrl(data) {
  validateSessionOrThrow(data.sessionToken);

  let folder;
  if (data.customFolderId) {
    folder = DriveApp.getFolderById(data.customFolderId);
  } else {
    folder = DriveApp.getRootFolder();
  }

  const response = UrlFetchApp.fetch(data.imageUrl);
  const blob = response.getBlob();
  blob.setName(data.fileName);
  
  const file = folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e){}

  return {
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: file.getDownloadUrl()
  };
}

function handleCreateFolder(data) {
  validateSessionOrThrow(data.sessionToken);

  // Parent defaults to Root if not specified (or add a config for a master "Uploads" folder)
  let parentFolder;
  if (data.parentFolderId) {
    parentFolder = DriveApp.getFolderById(data.parentFolderId);
  } else {
    parentFolder = DriveApp.getRootFolder();
  }

  // Check for existing folder with same name
  const existing = parentFolder.getFoldersByName(data.folderName);
  if (existing.hasNext()) {
    const folder = existing.next();
    return { folderId: folder.getId(), folderName: folder.getName(), isNew: false };
  }

  // Create new
  const newFolder = parentFolder.createFolder(data.folderName);
  try { newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e){}

  return { folderId: newFolder.getId(), folderName: newFolder.getName(), isNew: true };
}

function handleListImages(data) {
  // Lists images inside a specific folder ID
  if (!data.customFolderId) throw new Error('Folder ID required to list images');
  
  const folder = DriveApp.getFolderById(data.customFolderId);
  const files = folder.getFiles();
  const list = [];
  
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType().indexOf('image/') > -1) {
      list.push({
        fileId: file.getId(),
        fileName: file.getName(),
        fileUrl: file.getDownloadUrl(),
        thumbnailUrl: `https://drive.google.com/thumbnail?sz=w400&id=${file.getId()}`
      });
    }
  }
  return { files: list };
}

function handleDeleteImage(data) {
  validateSessionOrThrow(data.sessionToken);
  DriveApp.getFileById(data.fileId).setTrashed(true);
  return { status: 'deleted' };
}

// ============================================
// 5. CONTENT / DATA HANDLERS
// ============================================

// Generic handler for Pillars, Partners, Stories, Founders
function handleSaveData(sheetName, contentData, token) {
  validateAdminOrEditor(token);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  
  // Clear old data and rewrite (Simple overwrite strategy)
  sheet.clear();
  
  // Write Headers (assumes first item has all keys)
  if (contentData.length > 0) {
    // We store the raw JSON string of the whole object to be safe and flexible
    sheet.appendRow(['JSON_DATA']);
    const jsonString = JSON.stringify(contentData);
    // Google Sheets cell limit is 50k chars. If huge, we might need chunking, 
    // but for now we'll assume it fits or users are storing references.
    sheet.getRange(2, 1).setValue(jsonString);
  }
  
  return { message: `${sheetName} saved` };
}

function handleLoadData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { [sheetName.toLowerCase()]: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { [sheetName.toLowerCase()]: [] };
  
  // We assume the data is stored in cell A2 as a JSON string
  const jsonString = data[1][0];
  try {
    return { [sheetName.toLowerCase()]: JSON.parse(jsonString) };
  } catch (e) {
    return { [sheetName.toLowerCase()]: [] };
  }
}

// Specific Handler for Chapters (Row-based)
function handleSaveChapter(data) {
  const session = getSession(data.sessionToken);
  if (!session) throw new Error('Unauthorized');
  
  // Permission check
  if (session.user.role !== 'admin' && session.user.chapterId !== data.chapterId) {
    throw new Error('Insufficient permissions for this chapter');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Chapters');
  if (!sheet) {
    sheet = ss.insertSheet('Chapters');
    sheet.appendRow(['ChapterID', 'JSON_Data']);
  }

  const rows = sheet.getDataRange().getValues();
  let found = false;
  const jsonPayload = JSON.stringify(data.chapterData);

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.chapterId) {
      sheet.getRange(i + 1, 2).setValue(jsonPayload);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([data.chapterId, jsonPayload]);
  }
  
  return { message: 'Chapter saved' };
}

function handleLoadChapter(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Chapters');
  if (!sheet) return { chapter: null };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.chapterId) {
      return { chapter: JSON.parse(rows[i][1]) };
    }
  }
  return { chapter: null };
}

function handleGetOrgSettings(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_ORG);
  if (!sheet) return { settings: {} };
  
  const rows = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    settings[rows[i][0]] = rows[i][1];
  }
  return { settings };
}

function handleUpdateOrgSettings(data) {
  validateAdminOrEditor(data.sessionToken);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_ORG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ORG);
    sheet.appendRow(['Key', 'Value']);
  }
  
  // Upsert settings
  const settings = data.settings;
  const rows = sheet.getDataRange().getValues();
  
  for (const key in settings) {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(settings[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, settings[key]]);
    }
  }
  return { message: 'Settings updated' };
}

// ============================================
// 6. HELPER UTILITIES
// ============================================

function storeSession(token, user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_SESSIONS);
  const expires = new Date(new Date().getTime() + SESSION_TIMEOUT).toISOString();
  sheet.appendRow([token, JSON.stringify(user), expires]);
}

function getSession(token) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_SESSIONS);
  const rows = sheet.getDataRange().getValues();
  const now = new Date();

  // Reverse loop to find latest and cleanup
  for (let i = rows.length - 1; i >= 1; i--) {
    // Check expiry
    if (new Date(rows[i][2]) < now) {
      sheet.deleteRow(i + 1); // Cleanup expired
      continue;
    }
    if (rows[i][0] === token) {
      return { token: rows[i][0], user: JSON.parse(rows[i][1]) };
    }
  }
  return null;
}

function validateSessionOrThrow(token) {
  if (!getSession(token)) throw new Error('Unauthorized: Invalid Session');
}

function validateAdminOrEditor(token) {
  const session = getSession(token);
  if (!session) throw new Error('Unauthorized');
  const role = session.user.role;
  if (role !== 'admin' && role !== 'editor') throw new Error('Insufficient permissions');
}

function logUpload(token, fileId, fileName, folderName) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_LOGS);
    if (!sheet) { sheet = ss.insertSheet(SHEET_LOGS); sheet.appendRow(['Date', 'Token', 'FileID', 'Name', 'Folder']); }
    sheet.appendRow([new Date(), token, fileId, fileName, folderName]);
  } catch (e) {
    Logger.log('Log error: ' + e);
  }
}

function createResponse(success, error, data) {
  const result = { success: success };
  if (error) result.error = error;
  if (data) {
    for (const key in data) result[key] = data[key];
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// NEW USER MANAGEMENT HANDLERS
// ============================================

function handleCreateUser(data) {
  validateAdminOnly(data.sessionToken);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  
  // Check duplicates
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.username) throw new Error('Username already exists');
    if (rows[i][2] === data.email) throw new Error('Email already registered');
  }
  
  const newId = Utilities.getUuid();
  // Row: [Username, Password, Email, Role, UserId, ChapterId]
  sheet.appendRow([
    data.username, 
    data.password, 
    data.email, 
    data.role, 
    newId, 
    data.chapterId || ''
  ]);
  
  return { 
    message: 'User created successfully',
    user: {
      username: data.username,
      email: data.email,
      role: data.role,
      id: newId,
      chapterId: data.chapterId
    }
  };
}

function handleUpdatePassword(data) {
  const session = getSession(data.sessionToken);
  if (!session) throw new Error('Unauthorized');
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  
  // Users can only update their own password unless they're admin
  const targetUsername = data.targetUsername || session.user.username;
  
  if (targetUsername !== session.user.username && session.user.role !== 'admin') {
    throw new Error('Insufficient permissions');
  }
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === targetUsername) {
      sheet.getRange(i + 1, 2).setValue(data.newPassword);
      return { message: 'Password updated successfully' };
    }
  }
  throw new Error('User not found');
}

function handleListUsers(data) {
  validateAdminOnly(data.sessionToken);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  
  const users = [];
  for (let i = 1; i < rows.length; i++) {
    users.push({
      username: rows[i][0],
      email: rows[i][2],
      role: rows[i][3],
      id: rows[i][4],
      chapterId: rows[i][5]
      // Note: Password is NOT included for security
    });
  }
  
  return { users: users };
}

function handleDeleteUser(data) {
  validateAdminOnly(data.sessionToken);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][4] === data.userId) {
      sheet.deleteRow(i + 1);
      return { message: 'User deleted successfully' };
    }
  }
  throw new Error('User not found');
}

function validateAdminOnly(token) {
  const session = getSession(token);
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'admin') throw new Error('Admin access required');
}

// ============================================
// 7. SYSTEM INITIALIZATION (Run Once)
// ============================================

function initializeSystem() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Create Users Sheet
  if (!ss.getSheetByName(SHEET_USERS)) {
    const s = ss.insertSheet(SHEET_USERS);
    s.appendRow(['Username', 'Password', 'Email', 'Role', 'UserId', 'ChapterId']);
    s.appendRow(['admin', 'admin123', 'admin@example.com', 'admin', Utilities.getUuid(), '']);
    Logger.log('Created Users sheet with default admin.');
  }

  // 2. Create Sessions Sheet
  if (!ss.getSheetByName(SHEET_SESSIONS)) {
    const s = ss.insertSheet(SHEET_SESSIONS);
    s.appendRow(['Token', 'UserData', 'ExpiresAt']);
  }

  // 3. Create Logs Sheet
  if (!ss.getSheetByName(SHEET_LOGS)) {
    const s = ss.insertSheet(SHEET_LOGS);
    s.appendRow(['Timestamp', 'UserToken', 'FileId', 'FileName', 'Folder']);
  }
  
  // 4. Create Org Settings
  if (!ss.getSheetByName(SHEET_ORG)) {
    const s = ss.insertSheet(SHEET_ORG);
    s.appendRow(['Key', 'Value']);
    s.appendRow(['organizationName', 'Dyesabel PH']);
  }

  Logger.log('Initialization Complete.');
}