/**
 * Google Apps Script Backend - Extended with Google Drive Image Upload
 * 
 * NEW FEATURES:
 * - Upload images to Google Drive
 * - Create organized folder structure
 * - Make images publicly accessible
 * - Store organization settings (logo, name)
 * - Delete images from Drive
 * 
 * SETUP:
 * 1. This code extends the existing Code.gs
 * 2. Add these functions to your existing Code.gs file
 * 3. No additional configuration needed - uses same SPREADSHEET_ID
 */

// ============================================
// GOOGLE DRIVE IMAGE UPLOAD
// ============================================

/**
 * Upload image to Google Drive
 * Creates folder structure: Dyesabel Images / {folder} /
 */
function handleUploadImage(sessionToken, fileName, mimeType, base64Data, folder) {
  // Validate session
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) {
    return createResponse(false, 'Unauthorized');
  }

  try {
    // Create or get root folder
    const rootFolder = getOrCreateFolder('Dyesabel Images');
    
    // Create or get subfolder
    const subFolder = getOrCreateFolder(folder, rootFolder);
    
    // Decode base64 and create blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      mimeType,
      fileName
    );
    
    // Create file in Drive
    const file = subFolder.createFile(blob);
    
    // Make file publicly accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get public URL
    const fileId = file.getId();
    const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    // Log the upload
    logImageUpload(session, fileId, fileName, folder, publicUrl);
    
    return createResponse(true, 'Image uploaded successfully', {
      url: publicUrl,
      fileId: fileId,
      fileName: fileName
    });
    
  } catch (error) {
    Logger.log('Upload error: ' + error.toString());
    return createResponse(false, 'Upload failed: ' + error.toString());
  }
}

/**
 * Get or create a folder in Google Drive
 */
function getOrCreateFolder(folderName, parentFolder) {
  const parent = parentFolder || DriveApp.getRootFolder();
  const folders = parent.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parent.createFolder(folderName);
  }
}

/**
 * Delete image from Google Drive
 */
function handleDeleteImage(sessionToken, fileId) {
  // Validate session
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) {
    return createResponse(false, 'Unauthorized');
  }

  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    
    return createResponse(true, 'Image deleted successfully');
  } catch (error) {
    Logger.log('Delete error: ' + error.toString());
    return createResponse(false, 'Delete failed: ' + error.toString());
  }
}

/**
 * Log image uploads for tracking
 */
function logImageUpload(session, fileId, fileName, folder, url) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let logSheet = ss.getSheetByName('ImageUploads');
  
  if (!logSheet) {
    logSheet = ss.insertSheet('ImageUploads');
    logSheet.appendRow(['Timestamp', 'User', 'File ID', 'File Name', 'Folder', 'URL']);
  }
  
  const userData = JSON.parse(session.userData);
  logSheet.appendRow([
    new Date().toISOString(),
    userData.username,
    fileId,
    fileName,
    folder,
    url
  ]);
}

// ============================================
// ORGANIZATION SETTINGS (Logo, Name, etc.)
// ============================================

/**
 * Get organization settings
 */
function handleGetOrgSettings(sessionToken) {
  // Validate session
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) {
    return createResponse(false, 'Unauthorized');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let settingsSheet = ss.getSheetByName('OrgSettings');
  
  if (!settingsSheet) {
    // Create sheet with defaults
    settingsSheet = ss.insertSheet('OrgSettings');
    settingsSheet.appendRow(['Setting', 'Value']);
    settingsSheet.appendRow(['organizationName', 'Dyesabel PH']);
    settingsSheet.appendRow(['logoUrl', '']);
    settingsSheet.appendRow(['logoFileId', '']);
  }
  
  const data = settingsSheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }
  
  return createResponse(true, 'Settings loaded', settings);
}

/**
 * Update organization settings
 */
function handleUpdateOrgSettings(sessionToken, settings) {
  // Validate session and admin role
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) {
    return createResponse(false, 'Unauthorized');
  }
  
  const userData = JSON.parse(session.userData);
  if (userData.role !== 'admin' && userData.role !== 'editor') {
    return createResponse(false, 'Insufficient permissions');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let settingsSheet = ss.getSheetByName('OrgSettings');
  
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet('OrgSettings');
    settingsSheet.appendRow(['Setting', 'Value']);
  }
  
  // Update each setting
  for (let key in settings) {
    updateSetting(settingsSheet, key, settings[key]);
  }
  
  return createResponse(true, 'Settings updated successfully');
}

/**
 * Update a specific setting in the OrgSettings sheet
 */
function updateSetting(sheet, key, value) {
  const data = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([key, value]);
  }
}

// ============================================
// CONTENT STORAGE FUNCTIONS
// ============================================

/**
 * Save Pillars data
 */
function handleSavePillars(sessionToken, pillars) {
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) {
    return createResponse(false, 'Unauthorized');
  }
  
  const userData = JSON.parse(session.userData);
  if (userData.role !== 'admin' && userData.role !== 'editor') {
    return createResponse(false, 'Insufficient permissions');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Pillars');
  
  if (!sheet) {
    sheet = ss.insertSheet('Pillars');
  }
  
  sheet.clear();
  sheet.appendRow(['ID', 'Title', 'Excerpt', 'Description', 'Aim', 'ImageURL', 'ActivitiesJSON']);
  
  pillars.forEach(pillar => {
    sheet.appendRow([
      pillar.id,
      pillar.title,
      pillar.excerpt,
      pillar.description,
      pillar.aim,
      pillar.imageUrl,
      JSON.stringify(pillar.activities)
    ]);
  });
  
  return createResponse(true, 'Pillars saved successfully');
}

/**
 * Load Pillars data
 */
function handleLoadPillars() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Pillars');
  
  if (!sheet) {
    return createResponse(false, 'No pillars data found');
  }
  
  const data = sheet.getDataRange().getValues();
  const pillars = [];
  
  for (let i = 1; i < data.length; i++) {
    pillars.push({
      id: data[i][0],
      title: data[i][1],
      excerpt: data[i][2],
      description: data[i][3],
      aim: data[i][4],
      imageUrl: data[i][5],
      activities: JSON.parse(data[i][6])
    });
  }
  
  return createResponse(true, 'Pillars loaded', { pillars });
}

/**
 * Save Partners data
 */
function handleSavePartners(sessionToken, partners) {
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) {
    return createResponse(false, 'Unauthorized');
  }
  
  const userData = JSON.parse(session.userData);
  if (userData.role !== 'admin' && userData.role !== 'editor') {
    return createResponse(false, 'Insufficient permissions');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Partners');
  
  if (!sheet) {
    sheet = ss.insertSheet('Partners');
  }
  
  sheet.clear();
  sheet.appendRow(['CategoryID', 'CategoryTitle', 'PartnersJSON']);
  
  partners.forEach(category => {
    sheet.appendRow([
      category.id,
      category.title,
      JSON.stringify(category.partners)
    ]);
  });
  
  return createResponse(true, 'Partners saved successfully');
}

/**
 * Load Partners data
 */
function handleLoadPartners() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Partners');
  
  if (!sheet) {
    return createResponse(false, 'No partners data found');
  }
  
  const data = sheet.getDataRange().getValues();
  const partners = [];
  
  for (let i = 1; i < data.length; i++) {
    partners.push({
      id: data[i][0],
      title: data[i][1],
      partners: JSON.parse(data[i][2])
    });
  }
  
  return createResponse(true, 'Partners loaded', { partners });
}

/**
 * Save Stories data
 */
function handleSaveStories(sessionToken, stories) {
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) {
    return createResponse(false, 'Unauthorized');
  }
  
  const userData = JSON.parse(session.userData);
  if (userData.role !== 'admin' && userData.role !== 'editor') {
    return createResponse(false, 'Insufficient permissions');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Stories');
  
  if (!sheet) {
    sheet = ss.insertSheet('Stories');
  }
  
  sheet.clear();
  sheet.appendRow(['ID', 'Title', 'Excerpt', 'Date', 'ImageURL']);
  
  stories.forEach(story => {
    sheet.appendRow([
      story.id,
      story.title,
      story.excerpt,
      story.date,
      story.imageUrl
    ]);
  });
  
  return createResponse(true, 'Stories saved successfully');
}

/**
 * Load Stories data
 */
function handleLoadStories() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Stories');
  
  if (!sheet) {
    return createResponse(false, 'No stories data found');
  }
  
  const data = sheet.getDataRange().getValues();
  const stories = [];
  
  for (let i = 1; i < data.length; i++) {
    stories.push({
      id: data[i][0],
      title: data[i][1],
      excerpt: data[i][2],
      date: data[i][3],
      imageUrl: data[i][4]
    });
  }
  
  return createResponse(true, 'Stories loaded', { stories });
}

/**
 * Save Founders data
 */
function handleSaveFounders(sessionToken, founders) {
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) {
    return createResponse(false, 'Unauthorized');
  }
  
  const userData = JSON.parse(session.userData);
  if (userData.role !== 'admin' && userData.role !== 'editor') {
    return createResponse(false, 'Insufficient permissions');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Founders');
  
  if (!sheet) {
    sheet = ss.insertSheet('Founders');
  }
  
  sheet.clear();
  sheet.appendRow(['ID', 'Name', 'Role', 'Bio', 'ImageURL']);
  
  founders.forEach(founder => {
    sheet.appendRow([
      founder.id,
      founder.name,
      founder.role,
      founder.bio,
      founder.imageUrl
    ]);
  });
  
  return createResponse(true, 'Founders saved successfully');
}

/**
 * Load Founders data
 */
function handleLoadFounders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Founders');
  
  if (!sheet) {
    return createResponse(false, 'No founders data found');
  }
  
  const data = sheet.getDataRange().getValues();
  const founders = [];
  
  for (let i = 1; i < data.length; i++) {
    founders.push({
      id: data[i][0],
      name: data[i][1],
      role: data[i][2],
      bio: data[i][3],
      imageUrl: data[i][4]
    });
  }
  
  return createResponse(true, 'Founders loaded', { founders });
}

/**
 * Save Chapter data
 */
function handleSaveChapter(sessionToken, chapterId, chapterData) {
  const session = getSession(sessionToken);
  if (!session || isSessionExpired(session)) {
    return createResponse(false, 'Unauthorized');
  }
  
  const userData = JSON.parse(session.userData);
  // Admin can edit any chapter, chapter head can only edit their own
  if (userData.role !== 'admin' && 
      (userData.role !== 'chapter_head' || userData.chapterId !== chapterId)) {
    return createResponse(false, 'Insufficient permissions');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Chapters');
  
  if (!sheet) {
    sheet = ss.insertSheet('Chapters');
    sheet.appendRow(['ChapterID', 'Title', 'Description', 'ImageURL', 'ActivitiesJSON', 'Members']);
  }
  
  // Find and update or append
  const data = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === chapterId) {
      sheet.getRange(i + 1, 1, 1, 6).setValues([[
        chapterId,
        chapterData.title,
        chapterData.description,
        chapterData.imageUrl,
        JSON.stringify(chapterData.activities),
        chapterData.members
      ]]);
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([
      chapterId,
      chapterData.title,
      chapterData.description,
      chapterData.imageUrl,
      JSON.stringify(chapterData.activities),
      chapterData.members
    ]);
  }
  
  return createResponse(true, 'Chapter saved successfully');
}

/**
 * Load Chapter data
 */
function handleLoadChapter(chapterId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Chapters');
  
  if (!sheet) {
    return createResponse(false, 'No chapters data found');
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === chapterId) {
      return createResponse(true, 'Chapter loaded', {
        chapter: {
          id: data[i][0],
          title: data[i][1],
          description: data[i][2],
          imageUrl: data[i][3],
          activities: JSON.parse(data[i][4]),
          members: data[i][5]
        }
      });
    }
  }
  
  return createResponse(false, 'Chapter not found');
}

// ============================================
// UPDATE doPost TO HANDLE NEW ACTIONS
// ============================================

/**
 * Add these cases to your existing doPost function's switch statement:
 * 
 * case 'uploadImage':
 *   return handleUploadImage(data.sessionToken, data.fileName, data.mimeType, data.base64Data, data.folder);
 * case 'deleteImage':
 *   return handleDeleteImage(data.sessionToken, data.fileId);
 * case 'getOrgSettings':
 *   return handleGetOrgSettings(data.sessionToken);
 * case 'updateOrgSettings':
 *   return handleUpdateOrgSettings(data.sessionToken, data.settings);
 * case 'savePillars':
 *   return handleSavePillars(data.sessionToken, data.pillars);
 * case 'loadPillars':
 *   return handleLoadPillars();
 * case 'savePartners':
 *   return handleSavePartners(data.sessionToken, data.partners);
 * case 'loadPartners':
 *   return handleLoadPartners();
 * case 'saveStories':
 *   return handleSaveStories(data.sessionToken, data.stories);
 * case 'loadStories':
 *   return handleLoadStories();
 * case 'saveFounders':
 *   return handleSaveFounders(data.sessionToken, data.founders);
 * case 'loadFounders':
 *   return handleLoadFounders();
 * case 'saveChapter':
 *   return handleSaveChapter(data.sessionToken, data.chapterId, data.chapterData);
 * case 'loadChapter':
 *   return handleLoadChapter(data.chapterId);
 */
