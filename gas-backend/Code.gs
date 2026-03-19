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
      case 'saveExecutiveOfficers': result = handleSaveData('ExecutiveOfficers', data.executiveOfficers, data.sessionToken); break;
      case 'loadExecutiveOfficers': result = handleLoadData('ExecutiveOfficers'); break;
      case 'migrateLegacyContent': result = handleMigrateLegacyContent(data); break;

      // ✅ NEWSLETTER HANDLER (Routes to Newsletter.gs)
      case 'subscribeNewsletter': 
        result = handleNewsletterSubscription(data); 
        break;

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
    const storedUsername = rows[i][0];
    const storedPassword = rows[i][1];

    if (storedUsername === data.username) {
      if (verifyPassword(data.password, storedPassword)) {
        
        // Success: Create Session
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
  const securePassword = hashPassword(data.password); // <--- HASHING HERE

  // Default role is 'user'
  sheet.appendRow([data.username, securePassword, data.email, 'user', newId, '']);
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

function buildDriveImageUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

function ensureFileIsPublic(file) {
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    throw new Error('Uploaded image could not be shared publicly. Check Drive sharing settings for the target folder.');
  }

  const sharingAccess = file.getSharingAccess();
  if (sharingAccess !== DriveApp.Access.ANYONE && sharingAccess !== DriveApp.Access.ANYONE_WITH_LINK) {
    throw new Error('Uploaded image is not publicly accessible. Check Drive sharing settings for the target folder.');
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

  // 3. Ensure the uploaded image can be rendered publicly on the site
  ensureFileIsPublic(file);

  // 4. Log
  logUpload(data.sessionToken, file.getId(), file.getName(), folder.getName());

  const publicImageUrl = buildDriveImageUrl(file.getId());

  return {
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: publicImageUrl,
    originalUrl: file.getDownloadUrl(),
    thumbnailUrl: publicImageUrl
  };
}

function handleUploadFromUrl(data) {
  validateSessionOrThrow(data.sessionToken);

  const folder = getTargetFolder(data.customFolderId);

  const response = UrlFetchApp.fetch(data.imageUrl);
  const blob = response.getBlob();
  blob.setName(data.fileName);
  
  const file = folder.createFile(blob);
  ensureFileIsPublic(file);

  const publicImageUrl = buildDriveImageUrl(file.getId());

  return {
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: publicImageUrl 
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
      const safeUrl = buildDriveImageUrl(file.getId());
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

const DATA_SHEET_CONFIG = {
  LandingPage: {
    type: 'object',
    responseKey: 'landingPage',
    sheetName: 'LandingPage',
    fields: ['heroTitle', 'heroSubtitle', 'heroButtonText', 'sloganText', 'aboutText', 'featuredImageUrl']
  },
  Stories: {
    type: 'array',
    responseKey: 'stories',
    sheetName: 'Stories',
    fields: ['id', 'title', 'excerpt', 'imageUrl', 'date']
  },
  Founders: {
    type: 'array',
    responseKey: 'founders',
    sheetName: 'Founders',
    fields: ['id', 'name', 'role', 'bio', 'imageUrl']
  },
  ExecutiveOfficers: {
    type: 'array',
    responseKey: 'executiveOfficers',
    sheetName: 'ExecutiveOfficers',
    fields: ['id', 'name', 'role', 'imageUrl']
  },
  Pillars: {
    type: 'nested',
    responseKey: 'pillars',
    sheetName: 'Pillars',
    childSheetName: 'PillarActivities',
    parentFields: ['id', 'title', 'excerpt', 'description', 'aim', 'imageUrl', 'sortOrder'],
    childFields: ['pillarId', 'id', 'title', 'date', 'description', 'imageUrl', 'sortOrder']
  }
};

function handleSaveData(sheetName, contentData, token) {
  validateAdminOrEditor(token);

  const config = DATA_SHEET_CONFIG[sheetName];
  if (!config) {
    throw new Error('Unsupported mapped sheet: ' + sheetName);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (config.type === 'object') {
    saveMappedObjectData(ss, config, processAndUploadImages(contentData || {}));
  } else if (config.type === 'array') {
    const items = Array.isArray(contentData) ? contentData.map(item => processAndUploadImages(item || {})) : [];
    saveMappedArrayData(ss, config, items);
  } else if (config.type === 'nested') {
    saveMappedNestedData(ss, config, Array.isArray(contentData) ? contentData : []);
  } else {
    throw new Error('Unsupported data config type: ' + config.type);
  }

  return { message: sheetName + ' saved' };
}

function saveMappedObjectData(ss, config, item) {
  const sheet = getOrCreateSheet(ss, config.sheetName);
  const rows = config.fields.map(function(field) {
    return [field, item && item[field] != null ? item[field] : ''];
  });
  writeSheetRows(sheet, ['Key', 'Value'], rows);
}

function saveMappedArrayData(ss, config, items) {
  const sheet = getOrCreateSheet(ss, config.sheetName);
  const rows = items.map(function(item) {
    return config.fields.map(function(field) {
      return item && item[field] != null ? item[field] : '';
    });
  });
  writeSheetRows(sheet, config.fields, rows);
}

function saveMappedNestedData(ss, config, items) {
  const parentSheet = getOrCreateSheet(ss, config.sheetName);
  const childSheet = getOrCreateSheet(ss, config.childSheetName);
  const parentRows = [];
  const childRows = [];

  items.forEach(function(rawItem, itemIndex) {
    const item = processAndUploadImages(rawItem || {});
    const parentId = item.id || Utilities.getUuid();
    parentRows.push([
      parentId,
      item.title || '',
      item.excerpt || '',
      item.description || '',
      item.aim || '',
      item.imageUrl || '',
      itemIndex
    ]);

    const activities = Array.isArray(item.activities) ? item.activities : [];
    activities.forEach(function(rawActivity, activityIndex) {
      const activity = processAndUploadImages(rawActivity || {});
      childRows.push([
        parentId,
        activity.id || Utilities.getUuid(),
        activity.title || '',
        activity.date || '',
        activity.description || '',
        activity.imageUrl || '',
        activityIndex
      ]);
    });
  });

  writeSheetRows(parentSheet, config.parentFields, parentRows);
  writeSheetRows(childSheet, config.childFields, childRows);
}

function getMappedObjectData(ss, config) {
  const sheet = ss.getSheetByName(config.sheetName);
  if (!sheet || sheet.getLastRow() < 2 || !sheetHasHeaders(sheet, ['Key', 'Value'])) {
    return {};
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const item = {};
  rows.forEach(function(row) {
    if (row[0]) {
      item[row[0]] = row[1];
    }
  });
  return item;
}

function getMappedArrayData(ss, config) {
  const sheet = ss.getSheetByName(config.sheetName);
  if (!sheet || sheet.getLastRow() < 2 || !sheetHasHeaders(sheet, config.fields)) {
    return [];
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, config.fields.length).getValues();
  return rows
    .filter(function(row) {
      return row.some(function(cell) { return cell !== ''; });
    })
    .map(function(row) {
      const item = {};
      config.fields.forEach(function(field, index) {
        item[field] = row[index];
      });
      return item;
    });
}

function getMappedNestedData(ss, config) {
  const parentSheet = ss.getSheetByName(config.sheetName);
  if (!parentSheet || parentSheet.getLastRow() < 2 || !sheetHasHeaders(parentSheet, config.parentFields)) {
    return [];
  }

  const parentRows = parentSheet.getRange(2, 1, parentSheet.getLastRow() - 1, config.parentFields.length).getValues();
  const childSheet = ss.getSheetByName(config.childSheetName);
  const activitiesByParent = {};

  if (childSheet && childSheet.getLastRow() >= 2 && sheetHasHeaders(childSheet, config.childFields)) {
    const childRows = childSheet.getRange(2, 1, childSheet.getLastRow() - 1, config.childFields.length).getValues();
    childRows.forEach(function(row) {
      const pillarId = String(row[0] || '');
      if (!pillarId) return;
      if (!activitiesByParent[pillarId]) {
        activitiesByParent[pillarId] = [];
      }
      activitiesByParent[pillarId].push({
        id: row[1],
        title: row[2],
        date: row[3],
        description: row[4],
        imageUrl: row[5],
        sortOrder: Number(row[6] || 0)
      });
    });
  }

  return parentRows
    .filter(function(row) {
      return row.some(function(cell) { return cell !== ''; });
    })
    .sort(function(a, b) {
      return Number(a[6] || 0) - Number(b[6] || 0);
    })
    .map(function(row) {
      const pillarId = String(row[0] || '');
      const activities = (activitiesByParent[pillarId] || [])
        .sort(function(a, b) { return a.sortOrder - b.sortOrder; })
        .map(function(activity) {
          return {
            id: activity.id,
            title: activity.title,
            date: activity.date,
            description: activity.description,
            imageUrl: activity.imageUrl
          };
        });

      return {
        id: row[0],
        title: row[1],
        excerpt: row[2],
        description: row[3],
        aim: row[4],
        imageUrl: row[5],
        activities: activities
      };
    });
}

function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function writeSheetRows(sheet, headers, rows) {
  ensureSheetSize(sheet, Math.max(headers.length, 1), Math.max(rows.length + 1, 2));
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.setFrozenRows(1);
}

function sheetHasHeaders(sheet, expectedHeaders) {
  if (!sheet || sheet.getLastRow() < 1) {
    return false;
  }

  const actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  return expectedHeaders.every(function(header, index) {
    return actualHeaders[index] === header;
  });
}

function ensureSheetSize(sheet, minColumns, minRows) {
  if (sheet.getMaxColumns() < minColumns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), minColumns - sheet.getMaxColumns());
  }
  if (sheet.getMaxRows() < minRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), minRows - sheet.getMaxRows());
  }
}

function loadLegacyJsonSheet(sheet) {
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  const jsonString = sheet.getRange(2, 1).getValue();
  if (!jsonString) {
    return [];
  }

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    Logger.log('Error parsing legacy JSON for ' + sheet.getName() + ': ' + e.toString());
    return [];
  }
}

function getLegacyJsonSheetPayload(sheet) {
  if (!sheet || sheet.getLastRow() < 2) {
    return { hasLegacyFormat: false, value: null };
  }

  if (sheet.getRange(1, 1).getValue() !== 'JSON_DATA') {
    return { hasLegacyFormat: false, value: null };
  }

  const jsonString = sheet.getRange(2, 1).getValue();
  if (!jsonString) {
    return { hasLegacyFormat: true, value: null };
  }

  try {
    return { hasLegacyFormat: true, value: JSON.parse(jsonString) };
  } catch (e) {
    throw new Error('Invalid legacy JSON in sheet "' + sheet.getName() + '": ' + e.toString());
  }
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

        ensureFileIsPublic(file);
        const driveUrl = buildDriveImageUrl(file.getId());
        
        item[key] = driveUrl;
        
      } catch (e) {
        Logger.log('Error auto-uploading base64 image: ' + e.toString());
      }
    }
  }
  return item;
}

const PARTNER_HEADERS = ['CategoryID', 'CategoryTitle', 'PartnerID', 'PartnerName', 'PartnerLogo'];

function saveMappedPartnersData(ss, categories) {
  const sheet = getOrCreateSheet(ss, 'Partners');
  const rows = [];

  (Array.isArray(categories) ? categories : []).forEach(function(rawCategory) {
    const category = rawCategory || {};
    const partners = Array.isArray(category.partners) ? category.partners : [];

    if (partners.length > 0) {
      partners.forEach(function(rawPartner) {
        const partner = processAndUploadImages(rawPartner || {});
        rows.push([
          category.id || '',
          category.title || '',
          partner.id || '',
          partner.name || '',
          partner.logo || ''
        ]);
      });
      return;
    }

    rows.push([
      category.id || '',
      category.title || '',
      '',
      '',
      ''
    ]);
  });

  writeSheetRows(sheet, PARTNER_HEADERS, rows);
}

function handleLoadChapter(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Chapters');
  if (!sheet) return { chapter: null };
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    // ✅ FIX 1: Convert IDs to String for safe comparison
    if (String(rows[i][0]) === String(data.chapterId)) {
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
        // ✅ FIX 2: Explicitly grab logo from Column F (Index 5) if missing in extended
        logo: extended.logo || rows[i][5], 
        ...extended
      };
      return { chapter: chapter };
    }
  }
  return { chapter: null };
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
  saveMappedPartnersData(ss, data.partners || []);
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
  
  // ✅ FIX 1: Convert IDs to String for permission check
  // (Prevents "1" !== 1 errors)
  if (session.user.role !== 'admin' && String(session.user.chapterId) !== String(data.chapterId)) {
    throw new Error('Insufficient permissions for this chapter');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Chapters');
  if (!sheet) {
    sheet = ss.insertSheet('Chapters');
    // Note: Column 6 (Index 5) is labeled 'Members' but you are using it for 'Logo'. 
    // This is fine as long as you are consistent.
    sheet.appendRow(['ChapterID', 'Title', 'Description', 'ImageURL', 'ActivitiesJSON', 'Members', 'ExtendedData']);
  }

  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    // ✅ FIX 2: Convert to String to find the existing row correctly
    if (String(rows[i][0]) === String(data.chapterId)) {
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
    cData.logo || ''  // Saves to Column F (Index 5)                    
  ];

  const extendedData = {
    location: cData.location,
    logo: cData.logo, // Saves to JSON
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
    // Match ID (String conversion is safer)
    if (String(rows[i][0]) === String(data.chapterId)) {
      let activities = [];
      let extended = {};
      try { activities = JSON.parse(rows[i][4]); } catch(e) {}
      try { extended = JSON.parse(rows[i][6]); } catch(e) {}

      // ✅ LOGIC: If extended.logo is broken/empty, use Column F (rows[i][5])
      const finalLogo = (extended.logo && extended.logo !== "") ? extended.logo : rows[i][5];

      const chapter = {
        ...extended, // 1. Spread extended FIRST
        id: rows[i][0],
        name: rows[i][1],
        description: rows[i][2],
        imageUrl: rows[i][3], 
        image: rows[i][3],   
        activities: activities,
        logo: finalLogo // 2. Set logo LAST so it wins
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

const CHAPTER_HEADERS = [
  'ChapterID',
  'Title',
  'Description',
  'ImageURL',
  'LogoURL',
  'Location',
  'HeadName',
  'HeadRole',
  'HeadQuote',
  'HeadImageUrl',
  'Email',
  'Phone',
  'Facebook',
  'Twitter',
  'Instagram',
  'JoinUrl',
  'JoinCtaDescription'
];

const CHAPTER_ACTIVITY_HEADERS = [
  'ChapterID',
  'ActivityID',
  'Title',
  'Description',
  'Date',
  'ImageURL',
  'SortOrder'
];

function normalizeChapterRecord(chapterId, chapterData) {
  const baseChapter = processAndUploadImages({
    id: chapterId,
    name: chapterData.name || chapterData.title || '',
    description: chapterData.description || '',
    image: chapterData.imageUrl || chapterData.image || '',
    imageUrl: chapterData.imageUrl || chapterData.image || '',
    logo: chapterData.logo || '',
    location: chapterData.location || '',
    headName: chapterData.headName || '',
    headRole: chapterData.headRole || '',
    headQuote: chapterData.headQuote || '',
    headImageUrl: chapterData.headImageUrl || '',
    email: chapterData.email || '',
    phone: chapterData.phone || '',
    facebook: chapterData.facebook || '',
    twitter: chapterData.twitter || '',
    instagram: chapterData.instagram || '',
    joinUrl: chapterData.joinUrl || '',
    joinCtaDescription: chapterData.joinCtaDescription || ''
  });

  baseChapter.activities = (Array.isArray(chapterData.activities) ? chapterData.activities : []).map(function(activity) {
    const nextActivity = processAndUploadImages(activity || {});
    return {
      id: nextActivity.id || Utilities.getUuid(),
      title: nextActivity.title || '',
      description: nextActivity.description || '',
      date: nextActivity.date || '',
      imageUrl: nextActivity.imageUrl || ''
    };
  });

  return baseChapter;
}

function createHeaderIndexMap(headers) {
  const indexMap = {};
  headers.forEach(function(header, index) {
    indexMap[header] = index;
  });
  return indexMap;
}

function loadChapterActivitiesByChapterId(ss) {
  const activitySheet = ss.getSheetByName('ChapterActivities');
  const activitiesByChapter = {};
  if (!activitySheet || activitySheet.getLastRow() < 2 || !sheetHasHeaders(activitySheet, CHAPTER_ACTIVITY_HEADERS)) {
    return activitiesByChapter;
  }

  const rows = activitySheet.getRange(2, 1, activitySheet.getLastRow() - 1, CHAPTER_ACTIVITY_HEADERS.length).getValues();
  rows.forEach(function(row) {
    const chapterId = String(row[0] || '');
    if (!chapterId) return;
    if (!activitiesByChapter[chapterId]) {
      activitiesByChapter[chapterId] = [];
    }
    activitiesByChapter[chapterId].push({
      id: row[1],
      title: row[2],
      description: row[3],
      date: row[4],
      imageUrl: row[5],
      sortOrder: Number(row[6] || 0)
    });
  });

  Object.keys(activitiesByChapter).forEach(function(chapterId) {
    activitiesByChapter[chapterId] = activitiesByChapter[chapterId]
      .sort(function(a, b) { return a.sortOrder - b.sortOrder; })
      .map(function(activity) {
        return {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          date: activity.date,
          imageUrl: activity.imageUrl
        };
      });
  });

  return activitiesByChapter;
}

function loadLegacyChapters(rows) {
  return rows.slice(1)
    .filter(function(row) {
      return row[0] !== '' && row[0] != null;
    })
    .map(function(row) {
      let activities = [];
      let extended = {};

      try { activities = JSON.parse(row[4] || '[]'); } catch (e) {}
      try { extended = JSON.parse(row[6] || '{}'); } catch (e) {}

      return {
        id: row[0],
        name: row[1] || '',
        description: row[2] || '',
        imageUrl: row[3] || '',
        image: row[3] || '',
        logo: extended.logo || row[5] || '',
        location: extended.location || '',
        headName: extended.headName || '',
        headRole: extended.headRole || '',
        headQuote: extended.headQuote || '',
        headImageUrl: extended.headImageUrl || '',
        email: extended.email || '',
        phone: extended.phone || '',
        facebook: extended.facebook || '',
        twitter: extended.twitter || '',
        instagram: extended.instagram || '',
        joinUrl: extended.joinUrl || '',
        joinCtaDescription: extended.joinCtaDescription || '',
        activities: Array.isArray(activities) ? activities : []
      };
    });
}

function loadAllChaptersNormalized(ss) {
  const chapterSheet = ss.getSheetByName('Chapters');
  if (!chapterSheet || chapterSheet.getLastRow() < 2) {
    return [];
  }

  const rows = chapterSheet.getDataRange().getValues();
  const headers = rows[0];
  if (headers.indexOf('ActivitiesJSON') >= 0 || headers.indexOf('ExtendedData') >= 0) {
    return loadLegacyChapters(rows);
  }

  const indexMap = createHeaderIndexMap(headers);
  const activitiesByChapter = loadChapterActivitiesByChapterId(ss);

  return rows.slice(1)
    .filter(function(row) {
      const chapterId = row[indexMap.ChapterID];
      return chapterId !== '' && chapterId != null;
    })
    .map(function(row) {
      const chapterId = row[indexMap.ChapterID];
      return {
        id: chapterId,
        name: row[indexMap.Title] || '',
        description: row[indexMap.Description] || '',
        imageUrl: row[indexMap.ImageURL] || '',
        image: row[indexMap.ImageURL] || '',
        logo: row[indexMap.LogoURL] || '',
        location: row[indexMap.Location] || '',
        headName: row[indexMap.HeadName] || '',
        headRole: row[indexMap.HeadRole] || '',
        headQuote: row[indexMap.HeadQuote] || '',
        headImageUrl: row[indexMap.HeadImageUrl] || '',
        email: row[indexMap.Email] || '',
        phone: row[indexMap.Phone] || '',
        facebook: row[indexMap.Facebook] || '',
        twitter: row[indexMap.Twitter] || '',
        instagram: row[indexMap.Instagram] || '',
        joinUrl: row[indexMap.JoinUrl] || '',
        joinCtaDescription: row[indexMap.JoinCtaDescription] || '',
        activities: activitiesByChapter[String(chapterId)] || []
      };
    });
}

function rewriteChaptersSheets(ss, chapters) {
  const chapterSheet = getOrCreateSheet(ss, 'Chapters');
  const activitySheet = getOrCreateSheet(ss, 'ChapterActivities');
  const chapterRows = [];
  const activityRows = [];

  chapters.forEach(function(rawChapter) {
    const chapter = normalizeChapterRecord(rawChapter.id, rawChapter);
    chapterRows.push([
      chapter.id,
      chapter.name || '',
      chapter.description || '',
      chapter.imageUrl || chapter.image || '',
      chapter.logo || '',
      chapter.location || '',
      chapter.headName || '',
      chapter.headRole || '',
      chapter.headQuote || '',
      chapter.headImageUrl || '',
      chapter.email || '',
      chapter.phone || '',
      chapter.facebook || '',
      chapter.twitter || '',
      chapter.instagram || '',
      chapter.joinUrl || '',
      chapter.joinCtaDescription || ''
    ]);

    (chapter.activities || []).forEach(function(activity, index) {
      activityRows.push([
        chapter.id,
        activity.id || Utilities.getUuid(),
        activity.title || '',
        activity.description || '',
        activity.date || '',
        activity.imageUrl || '',
        index
      ]);
    });
  });

  writeSheetRows(chapterSheet, CHAPTER_HEADERS, chapterRows);
  writeSheetRows(activitySheet, CHAPTER_ACTIVITY_HEADERS, activityRows);
}

function handleSaveChapter(data) {
  const session = getSession(data.sessionToken);
  if (!session) throw new Error('Unauthorized');

  if (session.user.role !== 'admin' && String(session.user.chapterId) !== String(data.chapterId)) {
    throw new Error('Insufficient permissions for this chapter');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const chapters = loadAllChaptersNormalized(ss);
  const nextChapter = normalizeChapterRecord(data.chapterId, data.chapterData || {});
  const existingIndex = chapters.findIndex(function(chapter) {
    return String(chapter.id) === String(data.chapterId);
  });

  if (existingIndex >= 0) {
    chapters[existingIndex] = nextChapter;
  } else {
    chapters.push(nextChapter);
  }

  rewriteChaptersSheets(ss, chapters);
  return { message: 'Chapter saved successfully' };
}

function handleLoadChapter(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const chapters = loadAllChaptersNormalized(ss);
  const chapter = chapters.find(function(item) {
    return String(item.id) === String(data.chapterId);
  }) || null;
  return { chapter: chapter };
}

function handleListChapters() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return { chapters: loadAllChaptersNormalized(ss) };
}

function handleDeleteChapter(data) {
  validateAdminOrEditor(data.sessionToken);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const chapters = loadAllChaptersNormalized(ss).filter(function(chapter) {
    return String(chapter.id) !== String(data.chapterId);
  });
  rewriteChaptersSheets(ss, chapters);
  return { message: 'Chapter deleted' };
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
  const securePassword = hashPassword(data.password); // <--- HASHING HERE

  sheet.appendRow([
    data.username, 
    securePassword, 
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
      const securePassword = hashPassword(data.newPassword); // <--- HASHING HERE
      sheet.getRange(i + 1, 2).setValue(securePassword);
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
    Logger.log('Created Users sheet headers. Add users explicitly before enabling login.');
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

  if (!ss.getSheetByName('Founders')) {
    const s = ss.insertSheet('Founders');
    s.appendRow(DATA_SHEET_CONFIG.Founders.fields);
  }

  if (!ss.getSheetByName('ExecutiveOfficers')) {
    const s = ss.insertSheet('ExecutiveOfficers');
    s.appendRow(DATA_SHEET_CONFIG.ExecutiveOfficers.fields);
  }

  Logger.log('Initialization Complete.');
}

function migrateLegacyMappedSheet(ss, sheetKey) {
  const config = DATA_SHEET_CONFIG[sheetKey];
  if (!config) {
    throw new Error('Unsupported mapped sheet: ' + sheetKey);
  }

  const sheet = ss.getSheetByName(config.sheetName);
  const legacy = getLegacyJsonSheetPayload(sheet);

  if (!legacy.hasLegacyFormat) {
    return { sheet: config.sheetName, status: 'skipped', reason: 'already mapped or missing' };
  }

  if (config.type === 'object') {
    const value = legacy.value && typeof legacy.value === 'object' && !Array.isArray(legacy.value) ? legacy.value : {};
    saveMappedObjectData(ss, config, value);
    return { sheet: config.sheetName, status: 'migrated', records: Object.keys(value).length };
  }

  if (config.type === 'array') {
    const items = Array.isArray(legacy.value) ? legacy.value : [];
    saveMappedArrayData(ss, config, items);
    return { sheet: config.sheetName, status: 'migrated', records: items.length };
  }

  if (config.type === 'nested') {
    const items = Array.isArray(legacy.value) ? legacy.value : [];
    saveMappedNestedData(ss, config, items);
    return { sheet: config.sheetName, status: 'migrated', records: items.length };
  }

  return { sheet: config.sheetName, status: 'skipped', reason: 'unsupported type' };
}

function migrateLegacyPartnersSheet(ss) {
  const sheet = ss.getSheetByName('Partners');
  const legacy = getLegacyJsonSheetPayload(sheet);

  if (!legacy.hasLegacyFormat) {
    return { sheet: 'Partners', status: 'skipped', reason: 'already mapped or missing' };
  }

  const categories = Array.isArray(legacy.value) ? legacy.value : [];
  saveMappedPartnersData(ss, categories);
  return { sheet: 'Partners', status: 'migrated', records: categories.length };
}

function migrateLegacyChaptersSheet(ss) {
  const sheet = ss.getSheetByName('Chapters');
  if (!sheet || sheet.getLastRow() < 1) {
    return { sheet: 'Chapters', status: 'skipped', reason: 'missing' };
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('ActivitiesJSON') === -1 && headers.indexOf('ExtendedData') === -1) {
    return { sheet: 'Chapters', status: 'skipped', reason: 'already mapped' };
  }

  const chapters = loadLegacyChapters(sheet.getDataRange().getValues());
  rewriteChaptersSheets(ss, chapters);
  return { sheet: 'Chapters', status: 'migrated', records: chapters.length };
}

function migrateLegacyContentToColumnMappings() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return {
    migratedAt: new Date().toISOString(),
    results: [
      migrateLegacyMappedSheet(ss, 'LandingPage'),
      migrateLegacyMappedSheet(ss, 'Stories'),
      migrateLegacyMappedSheet(ss, 'Founders'),
      migrateLegacyMappedSheet(ss, 'ExecutiveOfficers'),
      migrateLegacyMappedSheet(ss, 'Pillars'),
      migrateLegacyPartnersSheet(ss),
      migrateLegacyChaptersSheet(ss)
    ]
  };
}

function handleMigrateLegacyContent(data) {
  validateAdminOnly(data.sessionToken);
  return migrateLegacyContentToColumnMappings();
}
// ==========================================
// ✅ ADD THIS MISSING FUNCTION
// ==========================================
function handleLoadData(sheetName) {
  const config = DATA_SHEET_CONFIG[sheetName];
  const result = {};

  if (!config) {
    result[sheetName.toLowerCase()] = [];
    return result;
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(config.sheetName);
  const legacyData = loadLegacyJsonSheet(sheet);

  if (config.type === 'object') {
    const mappedObject = getMappedObjectData(ss, config);
    result[config.responseKey] = Object.keys(mappedObject).length > 0
      ? mappedObject
      : (legacyData && typeof legacyData === 'object' && !Array.isArray(legacyData) ? legacyData : {});
    return result;
  }

  if (config.type === 'array') {
    const mappedArray = getMappedArrayData(ss, config);
    result[config.responseKey] = mappedArray.length > 0 ? mappedArray : (Array.isArray(legacyData) ? legacyData : []);
    return result;
  }

  if (config.type === 'nested') {
    const mappedNested = getMappedNestedData(ss, config);
    result[config.responseKey] = mappedNested.length > 0 ? mappedNested : (Array.isArray(legacyData) ? legacyData : []);
    return result;
  }

  result[config.responseKey] = [];
  return result;
}

// ============================================
// 8. SECURITY UTILITIES (HASHING)
// ============================================

/**
 * Generates a salted hash for a password.
 * Format: "SALT$HASH"
 */
function hashPassword(password) {
  // Generate a random salt (UUID is sufficient for this use case)
  const salt = Utilities.getUuid(); 
  const payload = salt + password;
  
  // SHA-256 Hashing
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload);
  const hash = Utilities.base64Encode(digest);
  
  return salt + '$' + hash;
}

/**
 * Verifies an input password against the stored string.
 * Supports both new (Salt$Hash) and legacy (Plaintext) formats.
 */
function verifyPassword(inputPassword, storedPassword) {
  // 1. Legacy Plain Text Check (Backward Compatibility)
  if (storedPassword.indexOf('$') === -1) {
    return inputPassword === storedPassword;
  }

  // 2. Hashed Check
  const parts = storedPassword.split('$');
  const salt = parts[0];
  const originalHash = parts[1];
  
  const payload = salt + inputPassword;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload);
  const newHash = Utilities.base64Encode(digest);
  
  return newHash === originalHash;
}

function migratePasswordsToHash() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  
  // Start loop at 1 to skip headers
  for (let i = 1; i < data.length; i++) {
    const currentPassword = data[i][1]; // Column Index 1 is Password
    
    // Only hash if it's not already hashed (doesn't contain $)
    if (currentPassword && currentPassword.toString().indexOf('$') === -1) {
      const newHash = hashPassword(currentPassword);
      
      // Update the cell (Row is i+1 because sheet is 1-indexed)
      sheet.getRange(i + 1, 2).setValue(newHash);
      Logger.log(`Migrated user: ${data[i][0]}`);
    }
  }
  Logger.log('Password migration complete.');
}

// ============================================
// 9. AUTOMATIC HASHING ON EDIT (SECURE VERSION)
// ============================================

function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;

  // 1. Validation: 'Users' sheet, Column 2 (Password), Row > 1
  if (sheet.getName() === SHEET_USERS && range.getColumn() === 2 && range.getRow() > 1) {
    
    const cellValue = range.getValue().toString();
    
    // 2. Security Regex: Check for UUID format (8-4-4-4-12 hex chars) followed by '$'
    // This strictly identifies a "System Salt", distinguishing it from a user password like "Money$100"
    const isSystemHash = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\$/.test(cellValue);

    // 3. Only hash if it is NOT already a system hash
    if (cellValue && !isSystemHash) {
      
      const salt = Utilities.getUuid(); 
      const payload = salt + cellValue;
      const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload);
      const hash = Utilities.base64Encode(digest);
      
      // The result will look like: "UUID-STRING$BASE64HASH"
      const finalString = salt + '$' + hash;

      range.setValue(finalString);
      Logger.log('Auto-hashed password for row ' + range.getRow());
    }
  }
}
