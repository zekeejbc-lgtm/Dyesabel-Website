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

// ============================================
// 👇 PASTE YOUR GOOGLE DRIVE FOLDER ID BELOW 👇
// ============================================
// All uploaded images will go here automatically unless a specific folder is requested.
const DEFAULT_ROOT_FOLDER_ID = '10lelZpBdOsEwRAEFixArC6djAC0osJT-'; 

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
      case 'uploadImage':        result = handleUploadImage(data); break;
      case 'uploadImageFromUrl': result = handleUploadFromUrl(data); break;
      case 'createFolder':       result = handleCreateFolder(data); break;
      case 'deleteImage':        result = handleDeleteImage(data); break;
      case 'listImages':         result = handleListImages(data); break;

      // Content / Data
      case 'getOrgSettings':    result = handleGetOrgSettings(data); break;
      case 'updateOrgSettings': result = handleUpdateOrgSettings(data); break;
      case 'savePillars':       result = handleSaveData('Pillars', data.pillars, data.sessionToken); break;
      case 'loadPillars':       result = handleLoadData('Pillars'); break;
      
      // ✅ CHAPTERS HANDLERS
      case 'saveChapter':       result = handleSaveChapter(data); break;
      case 'loadChapter':       result = handleLoadChapter(data); break;
      case 'listChapters':      result = handleListChapters(data); break;
      case 'deleteChapter':     result = handleDeleteChapter(data); break;
      
      case 'saveLandingPage':   result = handleSaveData('LandingPage', data.landingPage, data.sessionToken); break;
      case 'loadLandingPage':   result = handleLoadData('LandingPage'); break;
      
      // ✅ PARTNERS HANDLERS (New Column Mapping)
      case 'savePartners':      result = handleSavePartners(data); break;
      case 'loadPartners':      result = handleLoadPartners(data); break;

      // Generic Data Handlers (Stories, Founders)
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

/**
 * Helper to get the correct folder based on priority:
 * 1. Request-specific Custom ID
 * 2. Script-level Default ID
 * 3. Root Folder
 */
function getTargetFolder(customId) {
  if (customId) {
    try {
      return DriveApp.getFolderById(customId);
    } catch(e) {
      // Fallback logic if customId is just a string name like "chapters"
      return DEFAULT_ROOT_FOLDER_ID ? DriveApp.getFolderById(DEFAULT_ROOT_FOLDER_ID) : DriveApp.getRootFolder();
    }
  } else if (DEFAULT_ROOT_FOLDER_ID) {
    return DriveApp.getFolderById(DEFAULT_ROOT_FOLDER_ID);
  } else {
    return DriveApp.getRootFolder();
  }
}

function handleUploadImage(data) {
  validateSessionOrThrow(data.sessionToken);

  // 1. Determine Folder
  const folder = getTargetFolder(data.customFolderId);

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

  // Use the "thumbnail" hack with size w4000 (high res) to bypass CORS issues
  const corsFreeUrl = `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w4000`;

  return {
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: corsFreeUrl,
    originalUrl: file.getDownloadUrl(),
    thumbnailUrl: corsFreeUrl
  };
}

function handleUploadFromUrl(data) {
  validateSessionOrThrow(data.sessionToken);

  const folder = getTargetFolder(data.customFolderId);

  const response = UrlFetchApp.fetch(data.imageUrl);
  const blob = response.getBlob();
  blob.setName(data.fileName);
  
  const file = folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e){}

  const corsFreeUrl = `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w4000`;

  return {
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: corsFreeUrl 
  };
}

function handleCreateFolder(data) {
  validateSessionOrThrow(data.sessionToken);

  // Parent defaults to Configured Default or Root
  let parentFolder;
  if (data.parentFolderId) {
    parentFolder = DriveApp.getFolderById(data.parentFolderId);
  } else if (DEFAULT_ROOT_FOLDER_ID) {
    parentFolder = DriveApp.getFolderById(DEFAULT_ROOT_FOLDER_ID);
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
  let folder;
  if (data.customFolderId) {
    folder = DriveApp.getFolderById(data.customFolderId);
  } else if (DEFAULT_ROOT_FOLDER_ID) {
    folder = DriveApp.getFolderById(DEFAULT_ROOT_FOLDER_ID);
  } else {
    folder = DriveApp.getRootFolder();
  }
  
  const files = folder.getFiles();
  const list = [];
  
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType().indexOf('image/') > -1) {
      const safeUrl = `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w4000`;
      list.push({
        fileId: file.getId(),
        fileName: file.getName(),
        fileUrl: safeUrl, 
        downloadUrl: file.getDownloadUrl(),
        thumbnailUrl: safeUrl
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

// Generic handler for Landing Page, Stories, Founders
function handleSaveData(sheetName, contentData, token) {
  validateAdminOrEditor(token);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  
  // --- Process Images before saving ---
  if (Array.isArray(contentData)) {
    contentData = contentData.map(item => processAndUploadImages(item));
  }
  
  // Clear old data and rewrite
  sheet.clear();
  
  if (contentData.length > 0) {
    sheet.appendRow(['JSON_DATA']);
    const jsonString = JSON.stringify(contentData);
    sheet.getRange(2, 1).setValue(jsonString);
  }
  
  return { message: `${sheetName} saved` };
}

/**
 * HELPER: Scans an object for Base64 image strings, uploads them,
 * and replaces the Base64 string with the new Google Drive URL.
 */
function processAndUploadImages(item) {
  if (!item || typeof item !== 'object') return item;

  for (const key in item) {
    const value = item[key];
    
    // Check if the value is a string starting with 'data:image' (Base64)
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      try {
        Logger.log(`Found base64 image in key: ${key}. Uploading...`);
        
        const contentType = value.substring(5, value.indexOf(';'));
        const base64Data = value.substring(value.indexOf(',') + 1);
        const fileExt = contentType.split('/')[1] || 'jpg';
        const fileName = `auto_upload_${key}_${new Date().getTime()}.${fileExt}`;
        
        const folder = getTargetFolder(null); 
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
        const file = folder.createFile(blob);
        
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const driveUrl = `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w4000`;
        
        item[key] = driveUrl;
        
      } catch (e) {
        Logger.log('Error auto-uploading base64 image: ' + e.toString());
      }
    }
  }
  return item;
}

function handleLoadData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { [sheetName.toLowerCase()]: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { [sheetName.toLowerCase()]: [] };
  
  const jsonString = data[1][0];
  try {
    return { [sheetName.toLowerCase()]: JSON.parse(jsonString) };
  } catch (e) {
    return { [sheetName.toLowerCase()]: [] };
  }
}

// ==========================================
// ✅ PARTNERS HANDLERS (Column Mapped)
// ==========================================

function handleSavePartners(data) {
  const session = getSession(data.sessionToken);
  if (!session) throw new Error('Unauthorized');
  
  // Permission check
  if (session.user.role !== 'admin' && session.user.role !== 'editor') {
    throw new Error('Insufficient permissions');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Partners');
  if (!sheet) {
    sheet = ss.insertSheet('Partners');
    // Create Headers
    sheet.appendRow(['CategoryID', 'CategoryTitle', 'PartnerID', 'PartnerName', 'PartnerLogo']);
    sheet.setFrozenRows(1);
  }

  // 1. Process Images (Handle Base64 uploads nested inside partners)
  let categories = data.partners || [];
  categories.forEach(cat => {
    if (cat.partners && Array.isArray(cat.partners)) {
      cat.partners = cat.partners.map(p => processAndUploadImages(p));
    }
  });

  // 2. Clear existing data (preserve headers)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  }

  // 3. Flatten Data for Sheet
  const rows = [];
  categories.forEach(cat => {
    if (cat.partners && cat.partners.length > 0) {
      // If category has partners, add a row for each
      cat.partners.forEach(p => {
        rows.push([
          cat.id,
          cat.title,
          p.id,
          p.name,
          p.logo || ''
        ]);
      });
    } else {
      // If category is empty, add a placeholder row so we don't lose the category
      rows.push([
        cat.id,
        cat.title,
        '', // No Partner ID
        '', // No Name
        ''  // No Logo
      ]);
    }
  });

  // 4. Write to Sheet
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  
  return { message: 'Partners saved successfully' };
}

function handleLoadPartners(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Partners');
  
  // If sheet doesn't exist, return empty
  if (!sheet) return { partners: [] };

  const rows = sheet.getDataRange().getValues();
  // If only header row exists
  if (rows.length < 2) return { partners: [] };

  const categoryMap = {};
  const categories = [];

  // Skip header (i=1)
  for (let i = 1; i < rows.length; i++) {
    const [catId, catTitle, pId, pName, pLogo] = rows[i];

    // Initialize category if not exists
    if (!categoryMap[catId]) {
      const newCat = {
        id: catId,
        title: catTitle,
        partners: []
      };
      categoryMap[catId] = newCat;
      categories.push(newCat);
    }

    // Add partner if valid (pId exists)
    if (pId) {
      categoryMap[catId].partners.push({
        id: pId,
        name: pName,
        logo: pLogo
      });
    }
  }

  return { partners: categories };
}

// ==========================================
// CHAPTER HANDLERS
// ==========================================

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
    sheet.appendRow(['ChapterID', 'Title', 'Description', 'ImageURL', 'ActivitiesJSON', 'Members', 'ExtendedData']);
  }

  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.chapterId) {
      rowIndex = i + 1; 
      break;
    }
  }

  const cData = data.chapterData;
  const activitiesJson = JSON.stringify(cData.activities || []);
  
  const rowData = [
    data.chapterId,                        
    cData.name || cData.title,             
    cData.description,                     
    cData.imageUrl || cData.image,         
    activitiesJson,                        
    cData.logo || ''                       
  ];

  const extendedData = {
    location: cData.location,
    logo: cData.logo,
    headName: cData.headName,
    headRole: cData.headRole,
    headImageUrl: cData.headImageUrl,
    email: cData.email,
    phone: cData.phone,
    facebook: cData.facebook
  };

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 6).setValues([rowData]);
    sheet.getRange(rowIndex, 7).setValue(JSON.stringify(extendedData));
  } else {
    sheet.appendRow([...rowData, JSON.stringify(extendedData)]);
  }
  
  return { message: 'Chapter saved successfully' };
}

function handleLoadChapter(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Chapters');
  if (!sheet) return { chapter: null };

  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.chapterId) {
      let activities = [];
      let extended = {};
      try { activities = JSON.parse(rows[i][4]); } catch(e) {}
      try { extended = JSON.parse(rows[i][6]); } catch(e) {}

      const chapter = {
        id: rows[i][0],
        name: rows[i][1],
        description: rows[i][2],
        imageUrl: rows[i][3], 
        image: rows[i][3],   
        activities: activities,
        ...extended
      };
      return { chapter: chapter };
    }
  }
  return { chapter: null };
}

function handleListChapters() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Chapters');
  if (!sheet) return { chapters: [] };
  
  const rows = sheet.getDataRange().getValues();
  const chapters = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    let extended = {};
    if (row[6]) {
       try { extended = JSON.parse(row[6]); } catch(e) {}
    }

    chapters.push({
      id: row[0],
      name: row[1],
      description: row[2],
      image: row[3],
      logo: row[5],
      location: extended.location || '',
      email: extended.email || '',
      phone: extended.phone || '',
      facebook: extended.facebook || ''
    });
  }
  
  return { chapters: chapters };
}

function handleDeleteChapter(data) {
  validateAdminOrEditor(data.sessionToken);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Chapters');
  if (!sheet) throw new Error('Chapters sheet not found');
  
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.chapterId) {
      sheet.deleteRow(i + 1);
      return { message: 'Chapter deleted' };
    }
  }
  throw new Error('Chapter not found');
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

  for (let i = rows.length - 1; i >= 1; i--) {
    if (new Date(rows[i][2]) < now) {
      sheet.deleteRow(i + 1); 
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
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================
// NEW USER MANAGEMENT HANDLERS
// ============================================

function handleCreateUser(data) {
  validateAdminOnly(data.sessionToken);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.username) throw new Error('Username already exists');
    if (rows[i][2] === data.email) throw new Error('Email already registered');
  }
  
  const newId = Utilities.getUuid();
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
// 7. SYSTEM INITIALIZATION
// ============================================

function initializeSystem() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  if (!ss.getSheetByName(SHEET_USERS)) {
    const s = ss.insertSheet(SHEET_USERS);
    s.appendRow(['Username', 'Password', 'Email', 'Role', 'UserId', 'ChapterId']);
    s.appendRow(['admin', 'admin123', 'admin@example.com', 'admin', Utilities.getUuid(), '']);
    Logger.log('Created Users sheet with default admin.');
  }

  if (!ss.getSheetByName(SHEET_SESSIONS)) {
    const s = ss.insertSheet(SHEET_SESSIONS);
    s.appendRow(['Token', 'UserData', 'ExpiresAt']);
  }

  if (!ss.getSheetByName(SHEET_LOGS)) {
    const s = ss.insertSheet(SHEET_LOGS);
    s.appendRow(['Timestamp', 'UserToken', 'FileId', 'FileName', 'Folder']);
  }
  
  if (!ss.getSheetByName(SHEET_ORG)) {
    const s = ss.insertSheet(SHEET_ORG);
    s.appendRow(['Key', 'Value']);
    s.appendRow(['organizationName', 'Dyesabel PH']);
  }

  Logger.log('Initialization Complete.');
}