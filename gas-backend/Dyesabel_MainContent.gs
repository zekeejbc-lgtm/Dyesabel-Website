var MAIN_ORG_SHEET = 'OrgSettings';
var MAIN_LOG_SHEET = 'ImageUploads';
var USER_PROXY_ACTIONS = {
  login: true, logout: true, validateSession: true, register: true,
  updatePassword: true, createUser: true, listUsers: true, deleteUser: true
};
var MAIN_DATA_CONFIG = {
  LandingPage: { type: 'object', responseKey: 'landingPage', sheetName: 'LandingPage', fields: ['heroTitle', 'heroSubtitle', 'heroButtonText', 'sloganText', 'aboutText', 'featuredImageUrl'] },
  Stories: { type: 'array', responseKey: 'stories', sheetName: 'Stories', fields: ['id', 'title', 'excerpt', 'imageUrl', 'date'] },
  Founders: { type: 'array', responseKey: 'founders', sheetName: 'Founders', fields: ['id', 'name', 'role', 'bio', 'imageUrl'] },
  ExecutiveOfficers: { type: 'array', responseKey: 'executiveOfficers', sheetName: 'ExecutiveOfficers', fields: ['id', 'name', 'role', 'imageUrl'] },
  Pillars: {
    type: 'nested',
    responseKey: 'pillars',
    sheetName: 'Pillars',
    childSheetName: 'PillarActivities',
    parentFields: ['id', 'title', 'excerpt', 'description', 'aim', 'imageUrl', 'impactAreas', 'facebookUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl', 'youtubeUrl', 'websiteUrl', 'joinNowOpen', 'joinNowUrl', 'joinNowLabel', 'joinNowDescription', 'sortOrder'],
    childFields: ['pillarId', 'id', 'title', 'date', 'description', 'imageUrl', 'learnMoreUrl', 'applicationOpen', 'applicationUrl', 'applicationLabel', 'applicationNote', 'sortOrder']
  }
};
var PARTNER_HEADERS = ['CategoryID', 'CategoryTitle', 'PartnerID', 'PartnerName', 'PartnerLogo'];
var CHAPTER_HEADERS = ['ChapterID', 'Title', 'Description', 'ImageURL', 'LogoURL', 'Location', 'HeadName', 'HeadRole', 'HeadQuote', 'HeadImageUrl', 'Email', 'Phone', 'Facebook', 'Twitter', 'Instagram', 'WebsiteUrl', 'JoinUrl', 'JoinCtaDescription'];
var CHAPTER_ACTIVITY_HEADERS = ['ChapterID', 'ActivityID', 'Title', 'Description', 'Date', 'ImageURL', 'LearnMoreUrl', 'SortOrder'];

function doGet() {
  return dyesabelCreateResponse_(true, null, { message: dyesabelGetScriptProperty_('APP_NAME', 'Dyesabel Main Content API') + ' is online.' });
}

function doPost(e) {
  try {
    var data = dyesabelParseJsonBody_(e);
    var action = String(data.action || '');
    if (USER_PROXY_ACTIONS[action]) return proxyResponse_(proxyUsers_(data));
    if (action === 'subscribeNewsletter') return proxyResponse_(proxyNewsletter_(data));
    return dispatchMainAction_(action, data);
  } catch (error) {
    return dyesabelCreateResponse_(false, error.message || String(error));
  }
}

function withMainScriptLock_(callback) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function proxyResponse_(result) {
  return dyesabelCreateResponse_(result.success !== false, result.success === false ? result.error : null, result);
}

function proxyUsers_(data) {
  return dyesabelPostJson_(dyesabelRequireScriptProperty_('USERS_API_URL'), data, true);
}

function proxyNewsletter_(data) {
  return dyesabelPostJson_(dyesabelRequireScriptProperty_('NEWSLETTER_API_URL'), data, true);
}

function proxyDonations_(data) {
  return dyesabelPostJson_(dyesabelRequireScriptProperty_('DONATIONS_API_URL'), data, false);
}

function getSessionUser_(sessionToken) {
  var result = dyesabelPostJson_(dyesabelRequireScriptProperty_('USERS_API_URL'), { action: 'getSessionUser', sessionToken: sessionToken }, true);
  if (!result.success) throw new Error(result.error || 'Unauthorized');
  return result.user;
}

function requireSession_(sessionToken) {
  return getSessionUser_(sessionToken);
}

function requireAdminOrEditor_(sessionToken) {
  var user = getSessionUser_(sessionToken);
  if (user.role !== 'admin' && !(user.role === 'editor' && !user.chapterId)) throw new Error('Insufficient permissions');
  return user;
}

function requireAdminOnly_(sessionToken) {
  var user = getSessionUser_(sessionToken);
  if (user.role !== 'admin') throw new Error('Admin access required');
  return user;
}

function requireChapterManager_(sessionToken, chapterId) {
  var user = getSessionUser_(sessionToken);
  var sameChapter = String(user.chapterId || '') === String(chapterId || '');
  var isScopedEditor = user.role === 'editor' && sameChapter;
  var isScopedChapterHead = user.role === 'chapter_head' && sameChapter;
  if (user.role !== 'admin' && !isScopedEditor && !isScopedChapterHead) {
    throw new Error('Insufficient permissions for this chapter');
  }
  return user;
}

function dispatchMainAction_(action, data) {
  var result;
  switch (action) {
    case 'uploadImage': requireSession_(data.sessionToken); result = withMainScriptLock_(function() { return uploadImage_(data); }); break;
    case 'uploadImageFromUrl': requireSession_(data.sessionToken); result = withMainScriptLock_(function() { return uploadFromUrl_(data); }); break;
    case 'createFolder': requireSession_(data.sessionToken); result = withMainScriptLock_(function() { return createFolder_(data); }); break;
    case 'deleteImage': requireSession_(data.sessionToken); result = withMainScriptLock_(function() { return deleteImage_(data); }); break;
    case 'listImages': result = listImages_(data); break;
    case 'getOrgSettings': result = getOrgSettings_(); break;
    case 'updateOrgSettings': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return updateOrgSettings_(data); }); break;
    case 'getDonationContent': requireAdminOrEditor_(data.sessionToken); result = getDonationContent_(); break;
    case 'saveDonationContent': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return saveDonationContentProxy_(data); }); break;
    case 'uploadDonationQr': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return uploadDonationQrProxy_(data); }); break;
    case 'migrateDonationStorageToMappedSheets': requireAdminOnly_(data.sessionToken); result = withMainScriptLock_(function() { return migrateDonationStorageToMappedSheetsProxy_(); }); break;
    case 'saveLandingPage': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return saveData_('LandingPage', data.landingPage); }); break;
    case 'loadLandingPage': result = loadData_('LandingPage'); break;
    case 'saveStories': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return saveData_('Stories', data.stories); }); break;
    case 'loadStories': result = loadData_('Stories'); break;
    case 'listStories': result = loadData_('Stories'); break;
    case 'getStory': result = getMappedItem_('Stories', data.storyId, 'story'); break;
    case 'createStory': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return createMappedItem_('Stories', data.story, 'story'); }); break;
    case 'updateStory': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return updateMappedItem_('Stories', data.story, 'story'); }); break;
    case 'deleteStory': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return deleteMappedItem_('Stories', data.storyId, 'story'); }); break;
    case 'saveFounders': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return saveData_('Founders', data.founders); }); break;
    case 'loadFounders': result = loadData_('Founders'); break;
    case 'listFounders': result = loadData_('Founders'); break;
    case 'getFounder': result = getMappedItem_('Founders', data.founderId, 'founder'); break;
    case 'createFounder': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return createMappedItem_('Founders', data.founder, 'founder'); }); break;
    case 'updateFounder': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return updateMappedItem_('Founders', data.founder, 'founder'); }); break;
    case 'deleteFounder': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return deleteMappedItem_('Founders', data.founderId, 'founder'); }); break;
    case 'saveExecutiveOfficers': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return saveData_('ExecutiveOfficers', data.executiveOfficers); }); break;
    case 'loadExecutiveOfficers': result = loadData_('ExecutiveOfficers'); break;
    case 'listExecutiveOfficers': result = loadData_('ExecutiveOfficers'); break;
    case 'getExecutiveOfficer': result = getMappedItem_('ExecutiveOfficers', data.executiveOfficerId, 'executiveOfficer'); break;
    case 'createExecutiveOfficer': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return createMappedItem_('ExecutiveOfficers', data.executiveOfficer, 'executiveOfficer'); }); break;
    case 'updateExecutiveOfficer': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return updateMappedItem_('ExecutiveOfficers', data.executiveOfficer, 'executiveOfficer'); }); break;
    case 'deleteExecutiveOfficer': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return deleteMappedItem_('ExecutiveOfficers', data.executiveOfficerId, 'executiveOfficer'); }); break;
    case 'savePillars': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return saveData_('Pillars', data.pillars); }); break;
    case 'loadPillars': result = loadData_('Pillars'); break;
    case 'listPillars': result = loadData_('Pillars'); break;
    case 'getPillar': result = getMappedItem_('Pillars', data.pillarId, 'pillar'); break;
    case 'createPillar': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return createMappedItem_('Pillars', data.pillar, 'pillar'); }); break;
    case 'updatePillar': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return updateMappedItem_('Pillars', data.pillar, 'pillar'); }); break;
    case 'deletePillar': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return deleteMappedItem_('Pillars', data.pillarId, 'pillar'); }); break;
    case 'savePartners': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return savePartners_(data.partners); }); break;
    case 'loadPartners': result = loadPartners_(); break;
    case 'listPartnerCategories': result = loadPartners_(); break;
    case 'getPartnerCategory': result = getPartnerCategory_(data.categoryId); break;
    case 'createPartnerCategory': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return createPartnerCategory_(data.category); }); break;
    case 'updatePartnerCategory': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return updatePartnerCategory_(data.category); }); break;
    case 'deletePartnerCategory': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return deletePartnerCategory_(data.categoryId); }); break;
    case 'getPartner': result = getPartner_(data.partnerId, data.categoryId); break;
    case 'createPartner': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return createPartner_(data.categoryId, data.partner); }); break;
    case 'updatePartner': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return updatePartner_(data.categoryId, data.partner); }); break;
    case 'deletePartner': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return deletePartner_(data.categoryId, data.partnerId); }); break;
    case 'saveChapter': result = withMainScriptLock_(function() { return saveChapter_(data); }); break;
    case 'loadChapter': result = loadChapter_(data.chapterId); break;
    case 'listChapters': result = listChapters_(); break;
    case 'deleteChapter': requireAdminOrEditor_(data.sessionToken); result = withMainScriptLock_(function() { return deleteChapter_(data.chapterId); }); break;
    case 'migrateLegacyContent': requireAdminOnly_(data.sessionToken); result = withMainScriptLock_(function() { return migrateLegacyContentToColumnMappings_(); }); break;
    case 'initializeMainContentSystem': result = withMainScriptLock_(function() { return initializeMainContentSystem_(); }); break;
    default: throw new Error('Unknown action: ' + action);
  }
  return dyesabelCreateResponse_(true, null, result);
}

function getMainSpreadsheet_() {
  return dyesabelGetSpreadsheet_();
}

function getTargetFolder_(customId) {
  var rootId = dyesabelRequireScriptProperty_('DEFAULT_ROOT_FOLDER_ID');
  if (customId) {
    try { return DriveApp.getFolderById(customId); } catch (error) {}
  }
  return DriveApp.getFolderById(rootId);
}

function buildDriveImageUrl_(fileId) {
  return 'https://drive.google.com/uc?export=view&id=' + fileId;
}

function ensureFileIsPublic_(file, context) {
  var details = context || {};
  var fileId = details.fileId || (file && typeof file.getId === 'function' ? file.getId() : 'unknown');
  var fileName = details.fileName || (file && typeof file.getName === 'function' ? file.getName() : 'unknown');
  var folderId = details.folderId || 'unknown';
  var folderName = details.folderName || 'unknown';
  var isPublicAccess = function(access) {
    return access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK;
  };

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (error) {
    var reason = error && error.message ? error.message : String(error);
    var sharingAccess = 'unknown';
    try {
      sharingAccess = file.getSharingAccess();
    } catch (innerError) {}

    if (!isPublicAccess(sharingAccess)) {
      throw new Error('Uploaded image could not be shared publicly. Check Drive sharing settings for the target folder. ' +
        'Details: fileId=' + fileId + ', fileName=' + fileName + ', folderId=' + folderId + ', folderName=' + folderName + ', error=' + reason + ', sharingAccess=' + sharingAccess);
    }

    Logger.log('setSharing failed but file is already public. Continuing upload. ' +
      'Details: fileId=' + fileId + ', fileName=' + fileName + ', folderId=' + folderId + ', folderName=' + folderName + ', error=' + reason + ', sharingAccess=' + sharingAccess);
  }

  var finalAccess = file.getSharingAccess();
  if (!isPublicAccess(finalAccess)) {
    throw new Error('Uploaded image is not publicly accessible. Check Drive sharing settings for the target folder. ' +
      'Details: fileId=' + fileId + ', fileName=' + fileName + ', folderId=' + folderId + ', folderName=' + folderName + ', sharingAccess=' + finalAccess);
  }
}

function uploadImage_(data) {
  var folder = getTargetFolder_(data.customFolderId);
  var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.fileData), data.fileType, data.fileName));
  ensureFileIsPublic_(file, {
    fileId: file.getId(),
    fileName: file.getName(),
    folderId: folder.getId(),
    folderName: folder.getName()
  });
  logUpload_(data.sessionToken, file.getId(), file.getName(), folder.getName());
  var publicUrl = buildDriveImageUrl_(file.getId());
  return { fileId: file.getId(), fileName: file.getName(), fileUrl: publicUrl, originalUrl: file.getDownloadUrl(), thumbnailUrl: publicUrl };
}

function uploadFromUrl_(data) {
  var folder = getTargetFolder_(data.customFolderId);
  var blob = UrlFetchApp.fetch(data.imageUrl).getBlob();
  blob.setName(data.fileName);
  var file = folder.createFile(blob);
  ensureFileIsPublic_(file, {
    fileId: file.getId(),
    fileName: file.getName(),
    folderId: folder.getId(),
    folderName: folder.getName()
  });
  return { fileId: file.getId(), fileName: file.getName(), fileUrl: buildDriveImageUrl_(file.getId()) };
}

function createFolder_(data) {
  var parentFolder = data.parentFolderId ? DriveApp.getFolderById(data.parentFolderId) : getTargetFolder_(null);
  var existing = parentFolder.getFoldersByName(data.folderName);
  if (existing.hasNext()) {
    var folder = existing.next();
    return { folderId: folder.getId(), folderName: folder.getName(), isNew: false };
  }
  var created = parentFolder.createFolder(data.folderName);
  try { created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (error) {}
  return { folderId: created.getId(), folderName: created.getName(), isNew: true };
}

function listImages_(data) {
  var folder = data.customFolderId ? DriveApp.getFolderById(data.customFolderId) : getTargetFolder_(null);
  var files = folder.getFiles();
  var list = [];
  while (files.hasNext()) {
    var file = files.next();
    if (file.getMimeType().indexOf('image/') === 0) {
      var safeUrl = buildDriveImageUrl_(file.getId());
      list.push({ fileId: file.getId(), fileName: file.getName(), fileUrl: safeUrl, downloadUrl: file.getDownloadUrl(), thumbnailUrl: safeUrl });
    }
  }
  return { files: list };
}

function deleteImage_(data) {
  DriveApp.getFileById(data.fileId).setTrashed(true);
  return { status: 'deleted' };
}

function logUpload_(token, fileId, fileName, folderName) {
  try {
    var sheet = dyesabelGetOrCreateSheet_(getMainSpreadsheet_(), MAIN_LOG_SHEET);
    var user = null;
    try {
      user = getSessionUser_(token);
    } catch (error) {}
    if (sheet.getLastRow() === 0) sheet.appendRow(['Date', 'UserId', 'Username', 'FileID', 'Name', 'Folder']);
    sheet.appendRow([new Date(), user && user.id ? user.id : '', user && user.username ? user.username : '', fileId, fileName, folderName]);
  } catch (error) {
    Logger.log('Log error: ' + error);
  }
}

function sanitizeUploadFileNameSegment_(value, fallbackValue) {
  var source = value == null ? '' : String(value);
  var cleaned = source.replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^[-_]+|[-_]+$/g, '');
  if (!cleaned) cleaned = fallbackValue || 'Item';
  if (cleaned.length > 48) cleaned = cleaned.substring(0, 48);
  return cleaned;
}

function getUploadFileExtension_(contentType) {
  var raw = String(contentType || '').split('/')[1] || 'jpg';
  var ext = raw.split('+')[0].replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  return ext || 'jpg';
}

function buildStructuredUploadFileName_(fieldKey, contentType, item, options) {
  var context = options || {};
  var contextArea = sanitizeUploadFileNameSegment_(context.area || 'Content', 'Content');
  var contextTitle = sanitizeUploadFileNameSegment_(context.title || (item && (item.title || item.name)) || 'Item', 'Item');
  var contextId = sanitizeUploadFileNameSegment_(context.id || (item && item.id) || 'NoID', 'NoID');
  var contextField = sanitizeUploadFileNameSegment_(fieldKey || 'Image', 'Image');
  var extension = getUploadFileExtension_(contentType);
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss_SSS');
  return [contextArea, contextTitle, contextId, contextField, timestamp].join('-') + '.' + extension;
}

function isBase64ImageDataUrl_(value) {
  return typeof value === 'string' && value.indexOf('data:image/') === 0;
}

function isImageFieldKey_(key) {
  return /image|logo|thumbnail|cover|photo|avatar|banner|featured/i.test(String(key || ''));
}

function extractDriveFileIdFromUrl_(value) {
  var normalized = String(value || '').trim();
  if (!normalized) return '';
  if (/^[a-zA-Z0-9_-]{20,}$/.test(normalized)) return normalized;

  var idMatch =
    normalized.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) ||
    normalized.match(/\/d\/([a-zA-Z0-9_-]{20,})/) ||
    normalized.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (idMatch && idMatch[1]) return idMatch[1];

  if (!/drive\.google\.com|googleusercontent\.com|uc\?export=view/i.test(normalized)) return '';
  var fallback = normalized.match(/[-\w]{25,}/);
  return fallback ? fallback[0] : '';
}

function deleteDriveImageByUrl_(value, reason) {
  var fileId = extractDriveFileIdFromUrl_(value);
  if (!fileId) return;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (error) {
    Logger.log('Unable to trash replaced/removed image. fileId=' + fileId + ', reason=' + (reason || 'n/a') + ', error=' + (error && error.message ? error.message : String(error)));
  }
}

function collectReferencedImageUrlsDeep_(value, urlLookup) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach(function(entry) { collectReferencedImageUrlsDeep_(entry, urlLookup); });
    return;
  }
  if (typeof value !== 'object') return;

  for (var key in value) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    var entryValue = value[key];
    if (typeof entryValue === 'string' && isImageFieldKey_(key)) {
      var normalized = String(entryValue || '').trim();
      if (normalized && !isBase64ImageDataUrl_(normalized)) {
        urlLookup[normalized] = true;
      }
      continue;
    }
    if (entryValue && typeof entryValue === 'object') {
      collectReferencedImageUrlsDeep_(entryValue, urlLookup);
    }
  }
}

function cleanupImageFieldsFromItem_(item, reason, retainedUrlLookup) {
  if (!item || typeof item !== 'object') return;
  var retained = retainedUrlLookup || null;
  for (var key in item) {
    if (!Object.prototype.hasOwnProperty.call(item, key)) continue;
    if (!isImageFieldKey_(key)) continue;
    var value = item[key];
    if (typeof value !== 'string' || !value) continue;
    if (isBase64ImageDataUrl_(value)) continue;
    var normalized = String(value).trim();
    if (retained && retained[normalized]) continue;
    deleteDriveImageByUrl_(value, reason || ('cleanup-' + key));
  }
}

function processAndUploadImages_(item, options, previousItem) {
  if (!item || typeof item !== 'object') return item;
  var previous = previousItem && typeof previousItem === 'object' ? previousItem : null;
  for (var key in item) {
    if (!Object.prototype.hasOwnProperty.call(item, key)) continue;
    var value = item[key];
    var previousValue = previous && previous[key] != null ? String(previous[key]) : '';

    if (isBase64ImageDataUrl_(value)) {
      try {
        var contentType = value.substring(5, value.indexOf(';'));
        var base64Data = value.substring(value.indexOf(',') + 1);
        var fileName = buildStructuredUploadFileName_(key, contentType, item, options);
        var folder = getTargetFolder_(null);
        var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName));
        ensureFileIsPublic_(file, {
          fileId: file.getId(),
          fileName: file.getName(),
          folderId: folder.getId(),
          folderName: folder.getName()
        });
        var uploadedUrl = buildDriveImageUrl_(file.getId());
        item[key] = uploadedUrl;

        if (previousValue && previousValue !== uploadedUrl && !isBase64ImageDataUrl_(previousValue)) {
          deleteDriveImageByUrl_(previousValue, 'replaced-' + key);
        }
      } catch (error) {
        Logger.log('Error auto-uploading base64 image: ' + error);
      }
      continue;
    }

    var valueAsString = value == null ? '' : String(value);
    if (!valueAsString && previousValue && isImageFieldKey_(key) && !isBase64ImageDataUrl_(previousValue)) {
      deleteDriveImageByUrl_(previousValue, 'cleared-' + key);
    }
  }
  return item;
}

function getDonationContent_() {
  var result = proxyDonations_({ action: 'getPublicDonationData' });
  if (!result.success) throw new Error(result.error || 'Unable to load donation content.');
  return { donationContent: result.data || {} };
}

function saveDonationContentProxy_(data) {
  var payload = {
    action: 'saveDonationContent',
    adminKey: dyesabelRequireScriptProperty_('DONATIONS_ADMIN_API_KEY'),
    content: data.content || {}
  };
  var result = proxyDonations_(payload);
  if (!result.success) throw new Error(result.error || 'Unable to save donation content.');
  return { message: result.message || 'Donation content saved successfully.', donationContent: result.data || {} };
}

function uploadDonationQrProxy_(data) {
  if (!data.fileData || !data.fileName || !data.fileType) {
    throw new Error('Missing fileData, fileName, or fileType.');
  }
  var payload = {
    action: 'uploadDonationQr',
    adminKey: dyesabelRequireScriptProperty_('DONATIONS_ADMIN_API_KEY'),
    fileData: data.fileData,
    fileName: data.fileName,
    fileType: data.fileType
  };
  var result = proxyDonations_(payload);
  if (!result.success) throw new Error(result.error || 'Unable to upload donation QR.');
  return {
    fileId: result.fileId || '',
    fileUrl: result.fileUrl || '',
    thumbnailUrl: result.thumbnailUrl || result.fileUrl || ''
  };
}

function migrateDonationStorageToMappedSheetsProxy_() {
  var result = proxyDonations_({
    action: 'migrateDonationStorageToMappedSheets',
    adminKey: dyesabelRequireScriptProperty_('DONATIONS_ADMIN_API_KEY')
  });
  if (!result.success) throw new Error(result.error || 'Unable to migrate donation storage.');
  return result;
}

function saveData_(sheetKey, contentData) {
  var config = MAIN_DATA_CONFIG[sheetKey];
  if (!config) throw new Error('Unsupported mapped sheet: ' + sheetKey);
  var ss = getMainSpreadsheet_();
  var previousData = loadData_(sheetKey)[config.responseKey];

  if (config.type === 'object') {
    var objectData = contentData || {};
    var previousObjectData = previousData && typeof previousData === 'object' && !Array.isArray(previousData) ? previousData : {};
    saveMappedObjectData_(ss, config, processAndUploadImages_(objectData, {
      area: config.sheetName || sheetKey,
      title: objectData.title || objectData.name || sheetKey,
      id: objectData.id || 'object'
    }, previousObjectData));
  } else if (config.type === 'array') {
    var previousItems = Array.isArray(previousData) ? previousData : [];
    var retainedImageUrls = {};
    var previousByLookup = {};
    previousItems.forEach(function(previousItem, previousIndex) {
      var previousLookup = previousItem && previousItem.id ? String(previousItem.id) : ('__index__' + previousIndex);
      previousByLookup[previousLookup] = previousItem;
    });

    var retainedLookup = {};
    var mappedItems = Array.isArray(contentData) ? contentData.map(function(item, index) {
      var currentItem = item || {};
      var lookup = currentItem.id ? String(currentItem.id) : ('__index__' + index);
      retainedLookup[lookup] = true;
      var processedItem = processAndUploadImages_(currentItem, {
        area: config.sheetName || sheetKey,
        title: currentItem.title || currentItem.name || (sheetKey + '-' + (index + 1)),
        id: currentItem.id || ('item-' + (index + 1))
      }, previousByLookup[lookup] || null);
      collectReferencedImageUrlsDeep_(processedItem, retainedImageUrls);
      return processedItem;
    }) : [];

    previousItems.forEach(function(previousItem, previousIndex) {
      var previousLookup = previousItem && previousItem.id ? String(previousItem.id) : ('__index__' + previousIndex);
      if (!retainedLookup[previousLookup]) {
        cleanupImageFieldsFromItem_(previousItem, 'removed-' + (config.sheetName || sheetKey), retainedImageUrls);
      }
    });

    saveMappedArrayData_(ss, config, mappedItems);
  } else if (config.type === 'nested') {
    saveMappedNestedData_(ss, config, Array.isArray(contentData) ? contentData : [], Array.isArray(previousData) ? previousData : []);
  }
  return { message: sheetKey + ' saved' };
}

function loadData_(sheetKey) {
  var config = MAIN_DATA_CONFIG[sheetKey];
  var result = {};
  if (!config) {
    result[String(sheetKey).toLowerCase()] = [];
    return result;
  }
  var ss = getMainSpreadsheet_();
  var sheet = ss.getSheetByName(config.sheetName);
  var legacyData = loadLegacyJsonSheet_(sheet);
  if (config.type === 'object') {
    var mappedObject = getMappedObjectData_(ss, config);
    result[config.responseKey] = Object.keys(mappedObject).length ? mappedObject : (legacyData && typeof legacyData === 'object' && !Array.isArray(legacyData) ? legacyData : {});
  } else if (config.type === 'array') {
    var mappedArray = getMappedArrayData_(ss, config);
    result[config.responseKey] = mappedArray.length ? mappedArray : (Array.isArray(legacyData) ? legacyData : []);
  } else {
    var mappedNested = getMappedNestedData_(ss, config);
    result[config.responseKey] = mappedNested.length ? mappedNested : (Array.isArray(legacyData) ? legacyData : []);
  }
  return result;
}

function getMappedCollectionItems_(sheetKey) {
  var config = MAIN_DATA_CONFIG[sheetKey];
  if (!config || config.type === 'object') throw new Error('Unsupported CRUD collection: ' + sheetKey);
  return loadData_(sheetKey)[config.responseKey] || [];
}

function saveMappedCollectionItems_(sheetKey, items) {
  return saveData_(sheetKey, items);
}

function findMappedItemIndex_(items, itemId) {
  return items.findIndex(function(item) { return String(item && item.id) === String(itemId); });
}

function getMappedItem_(sheetKey, itemId, responseKey) {
  if (!itemId) throw new Error('Missing required id for ' + responseKey);
  var items = getMappedCollectionItems_(sheetKey);
  var item = items.find(function(entry) { return String(entry && entry.id) === String(itemId); }) || null;
  return item ? createKeyedResponse_(responseKey, item) : createKeyedResponse_(responseKey, null);
}

function createMappedItem_(sheetKey, item, responseKey) {
  var items = getMappedCollectionItems_(sheetKey);
  var nextItem = item || {};
  var nextId = nextItem.id || Utilities.getUuid();
  if (findMappedItemIndex_(items, nextId) >= 0) throw new Error(responseKey + ' already exists');
  nextItem.id = nextId;
  items.push(nextItem);
  saveMappedCollectionItems_(sheetKey, items);
  return createMutationResponse_(responseKey, nextItem, 'created');
}

function updateMappedItem_(sheetKey, item, responseKey) {
  var nextItem = item || {};
  if (!nextItem.id) throw new Error('Missing required id for ' + responseKey);
  var items = getMappedCollectionItems_(sheetKey);
  var index = findMappedItemIndex_(items, nextItem.id);
  if (index < 0) throw new Error(responseKey + ' not found');
  items[index] = nextItem;
  saveMappedCollectionItems_(sheetKey, items);
  return createMutationResponse_(responseKey, nextItem, 'updated');
}

function deleteMappedItem_(sheetKey, itemId, responseKey) {
  if (!itemId) throw new Error('Missing required id for ' + responseKey);
  var items = getMappedCollectionItems_(sheetKey);
  var index = findMappedItemIndex_(items, itemId);
  if (index < 0) throw new Error(responseKey + ' not found');
  var removed = items.splice(index, 1)[0];
  saveMappedCollectionItems_(sheetKey, items);
  return createMutationResponse_(responseKey, removed, 'deleted');
}

function createKeyedResponse_(key, value) {
  var result = {};
  result[key] = value;
  return result;
}

function createMutationResponse_(key, value, verb) {
  var result = createKeyedResponse_(key, value);
  result.message = key + ' ' + verb;
  return result;
}

function saveMappedObjectData_(ss, config, item) {
  dyesabelWriteSheetRows_(dyesabelGetOrCreateSheet_(ss, config.sheetName), ['Key', 'Value'], config.fields.map(function(field) {
    return [field, item && item[field] != null ? item[field] : ''];
  }));
}

function saveMappedArrayData_(ss, config, items) {
  dyesabelWriteSheetRows_(dyesabelGetOrCreateSheet_(ss, config.sheetName), config.fields, items.map(function(item) {
    return config.fields.map(function(field) { return item && item[field] != null ? item[field] : ''; });
  }));
}

function parseBooleanLike_(value) {
  if (value === true || value === false) return value;
  var normalized = String(value == null ? '' : value).trim().toLowerCase();
  if (!normalized) return false;
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'open';
}

function sanitizeImpactAreas_(value) {
  var source = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  var seen = {};
  return source.map(function(entry) {
    return String(entry || '').trim().replace(/^#+\s*/, '');
  }).filter(function(entry) {
    if (!entry) return false;
    var key = entry.toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function serializeImpactAreas_(value) {
  var cleaned = sanitizeImpactAreas_(value);
  return cleaned.length ? cleaned.map(function(tag) { return '#' + tag; }).join(', ') : '';
}

function parseImpactAreas_(rawValue) {
  if (Array.isArray(rawValue)) return sanitizeImpactAreas_(rawValue);
  var value = String(rawValue == null ? '' : rawValue).trim();
  if (!value) return [];
  if (value.indexOf('[') === 0) {
    try {
      var parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return sanitizeImpactAreas_(parsed);
    } catch (error) {}
  }
  return sanitizeImpactAreas_(value);
}

function saveMappedNestedData_(ss, config, items, previousItems) {
  var parentRows = [];
  var childRows = [];
  var retainedImageUrls = {};
  var previousParents = Array.isArray(previousItems) ? previousItems : [];
  var previousParentsById = {};
  previousParents.forEach(function(previousParent) {
    if (!previousParent || !previousParent.id) return;
    previousParentsById[String(previousParent.id)] = previousParent;
  });
  var retainedParentIds = {};

  items.forEach(function(rawItem, itemIndex) {
    var incomingParentId = rawItem && rawItem.id ? String(rawItem.id) : '';
    var previousParent = incomingParentId ? (previousParentsById[incomingParentId] || null) : null;
    var item = processAndUploadImages_(rawItem || {}, {
      area: config.sheetName || 'Pillars',
      title: rawItem && (rawItem.title || rawItem.name) ? (rawItem.title || rawItem.name) : ('Parent-' + (itemIndex + 1)),
      id: rawItem && rawItem.id ? rawItem.id : ('parent-' + (itemIndex + 1))
    }, previousParent);
    collectReferencedImageUrlsDeep_(item, retainedImageUrls);
    var parentId = item.id || Utilities.getUuid();
    retainedParentIds[String(parentId)] = true;
    var socialLinks = item.socialLinks && typeof item.socialLinks === 'object' ? item.socialLinks : {};
    var joinNow = item.joinNow && typeof item.joinNow === 'object' ? item.joinNow : {};
    var parentRowItem = {
      id: parentId,
      title: item.title || '',
      excerpt: item.excerpt || '',
      description: item.description || '',
      aim: item.aim || '',
      imageUrl: item.imageUrl || '',
      impactAreas: serializeImpactAreas_(item.impactAreas),
      facebookUrl: socialLinks.facebook || '',
      instagramUrl: socialLinks.instagram || '',
      twitterUrl: socialLinks.twitter || '',
      linkedinUrl: socialLinks.linkedin || '',
      youtubeUrl: socialLinks.youtube || '',
      websiteUrl: socialLinks.website || '',
      joinNowOpen: !!joinNow.isOpen,
      joinNowUrl: joinNow.url || '',
      joinNowLabel: joinNow.label || '',
      joinNowDescription: joinNow.description || '',
      sortOrder: itemIndex
    };
    parentRows.push(config.parentFields.map(function(field) {
      return parentRowItem[field] != null ? parentRowItem[field] : '';
    }));

    var previousActivitiesById = {};
    if (previousParent && Array.isArray(previousParent.activities)) {
      previousParent.activities.forEach(function(previousActivity) {
        if (!previousActivity || !previousActivity.id) return;
        previousActivitiesById[String(previousActivity.id)] = previousActivity;
      });
    }
    var retainedActivityIds = {};

    (Array.isArray(item.activities) ? item.activities : []).forEach(function(rawActivity, activityIndex) {
      var incomingActivityId = rawActivity && rawActivity.id ? String(rawActivity.id) : '';
      var previousActivity = incomingActivityId ? (previousActivitiesById[incomingActivityId] || null) : null;
      var activity = processAndUploadImages_(rawActivity || {}, {
        area: config.childSheetName || ((config.sheetName || 'Pillars') + 'Activities'),
        title: rawActivity && (rawActivity.title || rawActivity.name) ? (rawActivity.title || rawActivity.name) : ((item.title || 'Parent') + '-Activity-' + (activityIndex + 1)),
        id: rawActivity && rawActivity.id ? rawActivity.id : ('activity-' + (activityIndex + 1))
      }, previousActivity);
      collectReferencedImageUrlsDeep_(activity, retainedImageUrls);
      var activityId = activity.id || Utilities.getUuid();
      retainedActivityIds[String(activityId)] = true;
      var childRowItem = {
        pillarId: parentId,
        id: activityId,
        title: activity.title || '',
        date: activity.date || '',
        description: activity.description || '',
        imageUrl: activity.imageUrl || '',
        learnMoreUrl: activity.learnMoreUrl || '',
        applicationOpen: !!activity.applicationOpen,
        applicationUrl: activity.applicationUrl || '',
        applicationLabel: activity.applicationLabel || '',
        applicationNote: activity.applicationNote || '',
        sortOrder: activityIndex
      };
      childRows.push(config.childFields.map(function(field) {
        return childRowItem[field] != null ? childRowItem[field] : '';
      }));
    });

    if (previousParent && Array.isArray(previousParent.activities)) {
      previousParent.activities.forEach(function(previousActivity) {
        var previousActivityId = previousActivity && previousActivity.id ? String(previousActivity.id) : '';
        if (!previousActivityId || retainedActivityIds[previousActivityId]) return;
        cleanupImageFieldsFromItem_(previousActivity, 'removed-' + (config.childSheetName || 'NestedActivity'), retainedImageUrls);
      });
    }
  });

  previousParents.forEach(function(previousParent) {
    var previousParentId = previousParent && previousParent.id ? String(previousParent.id) : '';
    if (!previousParentId || retainedParentIds[previousParentId]) return;
    cleanupImageFieldsFromItem_(previousParent, 'removed-' + (config.sheetName || 'NestedParent'), retainedImageUrls);
    (Array.isArray(previousParent.activities) ? previousParent.activities : []).forEach(function(previousActivity) {
      cleanupImageFieldsFromItem_(previousActivity, 'removed-' + (config.childSheetName || 'NestedActivity'), retainedImageUrls);
    });
  });

  dyesabelWriteSheetRows_(dyesabelGetOrCreateSheet_(ss, config.sheetName), config.parentFields, parentRows);
  dyesabelWriteSheetRows_(dyesabelGetOrCreateSheet_(ss, config.childSheetName), config.childFields, childRows);
}

function getMappedObjectData_(ss, config) {
  var sheet = ss.getSheetByName(config.sheetName);
  if (!sheet || sheet.getLastRow() < 2 || !dyesabelSheetHasHeaders_(sheet, ['Key', 'Value'])) return {};
  var item = {};
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues().forEach(function(row) { if (row[0]) item[row[0]] = row[1]; });
  return item;
}

function getMappedArrayData_(ss, config) {
  var sheet = ss.getSheetByName(config.sheetName);
  if (!sheet || sheet.getLastRow() < 2 || !dyesabelSheetHasHeaders_(sheet, config.fields)) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, config.fields.length).getValues().filter(function(row) {
    return row.some(function(cell) { return cell !== ''; });
  }).map(function(row) {
    var item = {};
    config.fields.forEach(function(field, index) { item[field] = row[index]; });
    return item;
  });
}

function getMappedNestedData_(ss, config) {
  var parentSheet = ss.getSheetByName(config.sheetName);
  if (!parentSheet || parentSheet.getLastRow() < 2) return [];
  var parentHeaders = parentSheet.getRange(1, 1, 1, parentSheet.getLastColumn()).getValues()[0];
  var parentIndexMap = createHeaderIndexMap_(parentHeaders);
  var requiredParentHeaders = ['id', 'title', 'excerpt', 'description', 'aim', 'imageUrl'];
  var hasParentHeaders = requiredParentHeaders.every(function(header) { return parentIndexMap[header] != null; });
  if (!hasParentHeaders) return [];

  var childSheet = ss.getSheetByName(config.childSheetName);
  var activitiesByParent = {};
  if (childSheet && childSheet.getLastRow() >= 2) {
    var childHeaders = childSheet.getRange(1, 1, 1, childSheet.getLastColumn()).getValues()[0];
    var childIndexMap = createHeaderIndexMap_(childHeaders);
    var requiredLegacyHeaders = ['pillarId', 'id', 'title', 'date', 'description', 'imageUrl', 'sortOrder'];
    var hasChildHeaders = requiredLegacyHeaders.every(function(header) {
      return childIndexMap[header] != null;
    });

    if (hasChildHeaders) {
      childSheet.getRange(2, 1, childSheet.getLastRow() - 1, childSheet.getLastColumn()).getValues().forEach(function(row) {
      var parentId = String(row[childIndexMap.pillarId] || '');
      if (!parentId) return;
      if (!activitiesByParent[parentId]) activitiesByParent[parentId] = [];
      activitiesByParent[parentId].push({
        id: row[childIndexMap.id],
        title: row[childIndexMap.title],
        date: row[childIndexMap.date],
        description: row[childIndexMap.description],
        imageUrl: row[childIndexMap.imageUrl],
        learnMoreUrl: childIndexMap.learnMoreUrl != null ? row[childIndexMap.learnMoreUrl] : '',
        applicationOpen: childIndexMap.applicationOpen != null ? parseBooleanLike_(row[childIndexMap.applicationOpen]) : false,
        applicationUrl: childIndexMap.applicationUrl != null ? row[childIndexMap.applicationUrl] : '',
        applicationLabel: childIndexMap.applicationLabel != null ? row[childIndexMap.applicationLabel] : '',
        applicationNote: childIndexMap.applicationNote != null ? row[childIndexMap.applicationNote] : '',
        sortOrder: Number(row[childIndexMap.sortOrder] || 0)
      });
    });
    }
  }
  return parentSheet.getRange(2, 1, parentSheet.getLastRow() - 1, parentSheet.getLastColumn()).getValues().filter(function(row) {
    return row.some(function(cell) { return cell !== ''; });
  }).sort(function(a, b) {
    var aSortOrder = parentIndexMap.sortOrder != null ? Number(a[parentIndexMap.sortOrder] || 0) : 0;
    var bSortOrder = parentIndexMap.sortOrder != null ? Number(b[parentIndexMap.sortOrder] || 0) : 0;
    return aSortOrder - bSortOrder;
  }).map(function(row) {
    var parentId = String(row[parentIndexMap.id] || '');
    var impactAreas = parentIndexMap.impactAreas != null ? parseImpactAreas_(row[parentIndexMap.impactAreas]) : [];
    var socialLinks = {
      facebook: parentIndexMap.facebookUrl != null ? row[parentIndexMap.facebookUrl] : '',
      instagram: parentIndexMap.instagramUrl != null ? row[parentIndexMap.instagramUrl] : '',
      twitter: parentIndexMap.twitterUrl != null ? row[parentIndexMap.twitterUrl] : '',
      linkedin: parentIndexMap.linkedinUrl != null ? row[parentIndexMap.linkedinUrl] : '',
      youtube: parentIndexMap.youtubeUrl != null ? row[parentIndexMap.youtubeUrl] : '',
      website: parentIndexMap.websiteUrl != null ? row[parentIndexMap.websiteUrl] : ''
    };
    var joinNow = {
      isOpen: parentIndexMap.joinNowOpen != null ? parseBooleanLike_(row[parentIndexMap.joinNowOpen]) : false,
      url: parentIndexMap.joinNowUrl != null ? row[parentIndexMap.joinNowUrl] : '',
      label: parentIndexMap.joinNowLabel != null ? row[parentIndexMap.joinNowLabel] : '',
      description: parentIndexMap.joinNowDescription != null ? row[parentIndexMap.joinNowDescription] : ''
    };
    return {
      id: row[parentIndexMap.id],
      title: row[parentIndexMap.title],
      excerpt: row[parentIndexMap.excerpt],
      description: row[parentIndexMap.description],
      aim: row[parentIndexMap.aim],
      imageUrl: row[parentIndexMap.imageUrl],
      impactAreas: impactAreas,
      socialLinks: socialLinks,
      joinNow: joinNow,
      activities: (activitiesByParent[parentId] || []).sort(function(a, b) { return a.sortOrder - b.sortOrder; }).map(function(activity) {
        return {
          id: activity.id,
          title: activity.title,
          date: activity.date,
          description: activity.description,
          imageUrl: activity.imageUrl,
          learnMoreUrl: activity.learnMoreUrl || '',
          applicationOpen: !!activity.applicationOpen,
          applicationUrl: activity.applicationUrl || '',
          applicationLabel: activity.applicationLabel || '',
          applicationNote: activity.applicationNote || ''
        };
      })
    };
  });
}

function loadLegacyJsonSheet_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  var jsonString = sheet.getRange(2, 1).getValue();
  if (!jsonString) return [];
  try { return JSON.parse(jsonString); } catch (error) { Logger.log('Error parsing legacy JSON for ' + sheet.getName() + ': ' + error); return []; }
}

function getLegacyJsonSheetPayload_(sheet) {
  if (!sheet || sheet.getLastRow() < 2 || sheet.getRange(1, 1).getValue() !== 'JSON_DATA') return { hasLegacyFormat: false, value: null };
  var jsonString = sheet.getRange(2, 1).getValue();
  if (!jsonString) return { hasLegacyFormat: true, value: null };
  return { hasLegacyFormat: true, value: JSON.parse(jsonString) };
}

function savePartners_(partners, previousPartners) {
  var rows = [];
  var existingPartners = Array.isArray(previousPartners) ? previousPartners : (loadPartners_().partners || []);
  var retainedImageUrls = {};
  var existingByCategoryAndPartner = {};

  existingPartners.forEach(function(existingCategory) {
    var categoryId = String(existingCategory && existingCategory.id || '');
    var partnersById = {};
    (Array.isArray(existingCategory && existingCategory.partners) ? existingCategory.partners : []).forEach(function(existingPartner) {
      if (!existingPartner || !existingPartner.id) return;
      partnersById[String(existingPartner.id)] = existingPartner;
    });
    existingByCategoryAndPartner[categoryId] = partnersById;
  });

  var retainedPartnerKeys = {};

  (Array.isArray(partners) ? partners : []).forEach(function(rawCategory) {
    var category = rawCategory || {};
    var categoryId = String(category.id || '');
    var existingPartnersForCategory = existingByCategoryAndPartner[categoryId] || {};
    var categoryPartners = Array.isArray(category.partners) ? category.partners : [];
    if (categoryPartners.length) {
      categoryPartners.forEach(function(rawPartner, partnerIndex) {
        var incomingPartnerId = rawPartner && rawPartner.id ? String(rawPartner.id) : '';
        var existingPartner = incomingPartnerId ? (existingPartnersForCategory[incomingPartnerId] || null) : null;
        var partner = processAndUploadImages_(rawPartner || {}, {
          area: 'Partners',
          title: rawPartner && (rawPartner.name || rawPartner.title) ? (rawPartner.name || rawPartner.title) : (category.title || ('Partner-' + (partnerIndex + 1))),
          id: rawPartner && rawPartner.id ? rawPartner.id : (category.id || ('partner-' + (partnerIndex + 1)))
        }, existingPartner);
        collectReferencedImageUrlsDeep_(partner, retainedImageUrls);
        if (partner && partner.id) {
          retainedPartnerKeys[categoryId + '::' + String(partner.id)] = true;
        }
        rows.push([category.id || '', category.title || '', partner.id || '', partner.name || '', partner.logo || '']);
      });
    } else {
      rows.push([category.id || '', category.title || '', '', '', '']);
    }
  });

  existingPartners.forEach(function(existingCategory) {
    var categoryId = String(existingCategory && existingCategory.id || '');
    (Array.isArray(existingCategory && existingCategory.partners) ? existingCategory.partners : []).forEach(function(existingPartner) {
      var partnerId = existingPartner && existingPartner.id ? String(existingPartner.id) : '';
      if (!partnerId) return;
      if (!retainedPartnerKeys[categoryId + '::' + partnerId]) {
        cleanupImageFieldsFromItem_(existingPartner, 'removed-Partners', retainedImageUrls);
      }
    });
  });

  dyesabelWriteSheetRows_(dyesabelGetOrCreateSheet_(getMainSpreadsheet_(), 'Partners'), PARTNER_HEADERS, rows);
  return { message: 'Partners saved successfully' };
}

function loadPartners_() {
  var sheet = getMainSpreadsheet_().getSheetByName('Partners');
  if (!sheet || sheet.getLastRow() < 2) return { partners: [] };
  var categoryMap = {};
  var categories = [];
  sheet.getDataRange().getValues().slice(1).forEach(function(row) {
    if (!categoryMap[row[0]]) {
      categoryMap[row[0]] = { id: row[0], title: row[1], partners: [] };
      categories.push(categoryMap[row[0]]);
    }
    if (row[2]) categoryMap[row[0]].partners.push({ id: row[2], name: row[3], logo: row[4] });
  });
  return { partners: categories };
}

function getPartnerCategories_() {
  return loadPartners_().partners || [];
}

function savePartnerCategories_(categories) {
  return savePartners_(categories);
}

function findPartnerCategoryIndex_(categories, categoryId) {
  return categories.findIndex(function(category) { return String(category && category.id) === String(categoryId); });
}

function findPartnerIndex_(partners, partnerId) {
  return partners.findIndex(function(partner) { return String(partner && partner.id) === String(partnerId); });
}

function getPartnerCategory_(categoryId) {
  if (!categoryId) throw new Error('Missing required categoryId');
  var category = getPartnerCategories_().find(function(entry) { return String(entry && entry.id) === String(categoryId); }) || null;
  return { category: category };
}

function createPartnerCategory_(category) {
  var categories = getPartnerCategories_();
  var nextCategory = category || {};
  var nextId = nextCategory.id || Utilities.getUuid();
  if (findPartnerCategoryIndex_(categories, nextId) >= 0) throw new Error('category already exists');
  nextCategory.id = nextId;
  nextCategory.partners = Array.isArray(nextCategory.partners) ? nextCategory.partners : [];
  savePartnerCategories_(categories.concat([nextCategory]));
  return { message: 'category created', category: nextCategory };
}

function updatePartnerCategory_(category) {
  var nextCategory = category || {};
  if (!nextCategory.id) throw new Error('Missing required categoryId');
  var categories = getPartnerCategories_();
  var index = findPartnerCategoryIndex_(categories, nextCategory.id);
  if (index < 0) throw new Error('category not found');
  nextCategory.partners = Array.isArray(nextCategory.partners) ? nextCategory.partners : (categories[index].partners || []);
  categories[index] = nextCategory;
  savePartnerCategories_(categories);
  return { message: 'category updated', category: nextCategory };
}

function deletePartnerCategory_(categoryId) {
  if (!categoryId) throw new Error('Missing required categoryId');
  var categories = getPartnerCategories_();
  var index = findPartnerCategoryIndex_(categories, categoryId);
  if (index < 0) throw new Error('category not found');
  var removed = categories.splice(index, 1)[0];
  savePartnerCategories_(categories);
  return { message: 'category deleted', category: removed };
}

function getPartner_(partnerId, categoryId) {
  if (!partnerId) throw new Error('Missing required partnerId');
  var categories = getPartnerCategories_();
  var foundCategory = null;
  var foundPartner = null;
  categories.some(function(category) {
    if (categoryId && String(category.id) !== String(categoryId)) return false;
    var partners = Array.isArray(category.partners) ? category.partners : [];
    var index = findPartnerIndex_(partners, partnerId);
    if (index < 0) return false;
    foundCategory = category;
    foundPartner = partners[index];
    return true;
  });
  return { partner: foundPartner, categoryId: foundCategory ? foundCategory.id : null };
}

function createPartner_(categoryId, partner) {
  if (!categoryId) throw new Error('Missing required categoryId');
  var nextPartner = partner || {};
  var categories = getPartnerCategories_();
  var categoryIndex = findPartnerCategoryIndex_(categories, categoryId);
  if (categoryIndex < 0) throw new Error('category not found');
  var partners = Array.isArray(categories[categoryIndex].partners) ? categories[categoryIndex].partners : [];
  var nextId = nextPartner.id || Utilities.getUuid();
  if (findPartnerIndex_(partners, nextId) >= 0) throw new Error('partner already exists');
  nextPartner.id = nextId;
  partners.push(nextPartner);
  categories[categoryIndex].partners = partners;
  savePartnerCategories_(categories);
  return { message: 'partner created', partner: nextPartner, categoryId: categoryId };
}

function updatePartner_(categoryId, partner) {
  if (!categoryId) throw new Error('Missing required categoryId');
  var nextPartner = partner || {};
  if (!nextPartner.id) throw new Error('Missing required partnerId');
  var categories = getPartnerCategories_();
  var categoryIndex = findPartnerCategoryIndex_(categories, categoryId);
  if (categoryIndex < 0) throw new Error('category not found');
  var partners = Array.isArray(categories[categoryIndex].partners) ? categories[categoryIndex].partners : [];
  var partnerIndex = findPartnerIndex_(partners, nextPartner.id);
  if (partnerIndex < 0) throw new Error('partner not found');
  partners[partnerIndex] = nextPartner;
  categories[categoryIndex].partners = partners;
  savePartnerCategories_(categories);
  return { message: 'partner updated', partner: nextPartner, categoryId: categoryId };
}

function deletePartner_(categoryId, partnerId) {
  if (!categoryId) throw new Error('Missing required categoryId');
  if (!partnerId) throw new Error('Missing required partnerId');
  var categories = getPartnerCategories_();
  var categoryIndex = findPartnerCategoryIndex_(categories, categoryId);
  if (categoryIndex < 0) throw new Error('category not found');
  var partners = Array.isArray(categories[categoryIndex].partners) ? categories[categoryIndex].partners : [];
  var partnerIndex = findPartnerIndex_(partners, partnerId);
  if (partnerIndex < 0) throw new Error('partner not found');
  var removed = partners.splice(partnerIndex, 1)[0];
  categories[categoryIndex].partners = partners;
  savePartnerCategories_(categories);
  return { message: 'partner deleted', partner: removed, categoryId: categoryId };
}

function normalizeChapterRecord_(chapterId, chapterData, previousChapterData) {
  var previousChapter = previousChapterData && typeof previousChapterData === 'object' ? previousChapterData : null;
  var retainedImageUrls = {};
  var chapter = processAndUploadImages_({
    id: chapterId,
    name: chapterData.name || chapterData.title || '',
    description: chapterData.description || '',
    imageUrl: chapterData.imageUrl || chapterData.image || '',
    image: chapterData.imageUrl || chapterData.image || '',
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
    websiteUrl: chapterData.websiteUrl || '',
    joinUrl: chapterData.joinUrl || '',
    joinCtaDescription: chapterData.joinCtaDescription || ''
  }, {
    area: 'Chapters',
    title: chapterData.name || chapterData.title || chapterId || 'Chapter',
    id: chapterId || 'chapter'
  }, previousChapter);
  collectReferencedImageUrlsDeep_(chapter, retainedImageUrls);

  var previousActivitiesById = {};
  if (previousChapter && Array.isArray(previousChapter.activities)) {
    previousChapter.activities.forEach(function(previousActivity) {
      if (!previousActivity || !previousActivity.id) return;
      previousActivitiesById[String(previousActivity.id)] = previousActivity;
    });
  }
  var retainedActivityIds = {};

  chapter.activities = (Array.isArray(chapterData.activities) ? chapterData.activities : []).map(function(activity, activityIndex) {
    var activityId = activity && activity.id ? String(activity.id) : '';
    var previousActivity = activityId ? (previousActivitiesById[activityId] || null) : null;
    var nextActivity = processAndUploadImages_(activity || {}, {
      area: 'ChapterActivities',
      title: activity && (activity.title || activity.name) ? (activity.title || activity.name) : ((chapter.name || chapterId || 'Chapter') + '-Activity-' + (activityIndex + 1)),
      id: activity && activity.id ? activity.id : ((chapterId || 'chapter') + '-activity-' + (activityIndex + 1))
    }, previousActivity);
    collectReferencedImageUrlsDeep_(nextActivity, retainedImageUrls);
    if (nextActivity && nextActivity.id) retainedActivityIds[String(nextActivity.id)] = true;
    return {
      id: nextActivity.id || Utilities.getUuid(),
      title: nextActivity.title || '',
      description: nextActivity.description || '',
      date: nextActivity.date || '',
      imageUrl: nextActivity.imageUrl || '',
      learnMoreUrl: nextActivity.learnMoreUrl || ''
    };
  });

  if (previousChapter && Array.isArray(previousChapter.activities)) {
    previousChapter.activities.forEach(function(previousActivity) {
      var previousActivityId = previousActivity && previousActivity.id ? String(previousActivity.id) : '';
      if (!previousActivityId || retainedActivityIds[previousActivityId]) return;
      cleanupImageFieldsFromItem_(previousActivity, 'removed-ChapterActivities', retainedImageUrls);
    });
  }

  return chapter;
}

function createHeaderIndexMap_(headers) {
  var indexMap = {};
  headers.forEach(function(header, index) { indexMap[header] = index; });
  return indexMap;
}

function loadChapterActivitiesByChapterId_(ss) {
  var activitySheet = ss.getSheetByName('ChapterActivities');
  var activitiesByChapter = {};
  if (!activitySheet || activitySheet.getLastRow() < 2) return activitiesByChapter;
  var headers = activitySheet.getRange(1, 1, 1, activitySheet.getLastColumn()).getValues()[0];
  var indexMap = createHeaderIndexMap_(headers);
  var requiredHeaders = ['ChapterID', 'ActivityID', 'Title', 'Description', 'Date', 'ImageURL', 'SortOrder'];
  var hasHeaders = requiredHeaders.every(function(header) { return indexMap[header] != null; });
  if (!hasHeaders) return activitiesByChapter;

  activitySheet.getRange(2, 1, activitySheet.getLastRow() - 1, activitySheet.getLastColumn()).getValues().forEach(function(row) {
    var chapterId = String(row[indexMap.ChapterID] || '');
    if (!chapterId) return;
    if (!activitiesByChapter[chapterId]) activitiesByChapter[chapterId] = [];
    activitiesByChapter[chapterId].push({
      id: row[indexMap.ActivityID],
      title: row[indexMap.Title],
      description: row[indexMap.Description],
      date: row[indexMap.Date],
      imageUrl: row[indexMap.ImageURL],
      learnMoreUrl: indexMap.LearnMoreUrl != null ? row[indexMap.LearnMoreUrl] : '',
      sortOrder: Number(row[indexMap.SortOrder] || 0)
    });
  });
  Object.keys(activitiesByChapter).forEach(function(chapterId) {
    activitiesByChapter[chapterId] = activitiesByChapter[chapterId].sort(function(a, b) { return a.sortOrder - b.sortOrder; }).map(function(activity) {
      return {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        date: activity.date,
        imageUrl: activity.imageUrl,
        learnMoreUrl: activity.learnMoreUrl || ''
      };
    });
  });
  return activitiesByChapter;
}

function loadLegacyChapters_(rows) {
  return rows.slice(1).filter(function(row) { return row[0] !== '' && row[0] != null; }).map(function(row) {
    var activities = [];
    var extended = {};
    try { activities = JSON.parse(row[4] || '[]'); } catch (error) {}
    try { extended = JSON.parse(row[6] || '{}'); } catch (error) {}
    return {
      id: row[0], name: row[1] || '', description: row[2] || '', imageUrl: row[3] || '', image: row[3] || '', logo: extended.logo || row[5] || '',
      location: extended.location || '', headName: extended.headName || '', headRole: extended.headRole || '', headQuote: extended.headQuote || '',
      headImageUrl: extended.headImageUrl || '', email: extended.email || '', phone: extended.phone || '', facebook: extended.facebook || '',
      twitter: extended.twitter || '', instagram: extended.instagram || '', websiteUrl: extended.websiteUrl || '', joinUrl: extended.joinUrl || '', joinCtaDescription: extended.joinCtaDescription || '',
      activities: Array.isArray(activities) ? activities : []
    };
  });
}

function isLikelyUrl_(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function extractDriveIdFromUrlForLog_(value) {
  var normalized = String(value || '').trim();
  if (!normalized) return '';
  var idMatch =
    normalized.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) ||
    normalized.match(/\/d\/([a-zA-Z0-9_-]{20,})/) ||
    normalized.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (idMatch && idMatch[1]) return idMatch[1];
  var fallback = normalized.match(/[-\w]{25,}/);
  return fallback ? fallback[0] : '';
}

function buildChapterLogoDiagnostic_(chapter) {
  var item = chapter || {};
  var chapterId = String(item.id || '');
  var logoRaw = String(item.logo || item.logoUrl || '').trim();
  var isMissing = !logoRaw;
  var equalsChapterId = logoRaw !== '' && logoRaw === chapterId;
  var isUrl = isLikelyUrl_(logoRaw);
  return {
    chapterId: chapterId,
    chapterName: String(item.name || item.title || ''),
    logoRaw: logoRaw,
    isMissing: isMissing,
    equalsChapterId: equalsChapterId,
    isUrl: isUrl,
    driveFileId: isUrl ? extractDriveIdFromUrlForLog_(logoRaw) : '',
    isSuspicious: isMissing || equalsChapterId || !isUrl
  };
}

function logChapterLogoDiagnostics_(contextLabel, chapters) {
  var chapterList = Array.isArray(chapters) ? chapters : [];
  var diagnostics = chapterList.map(function(chapter) {
    return buildChapterLogoDiagnostic_(chapter);
  });
  var suspicious = diagnostics.filter(function(entry) { return entry.isSuspicious; });
  if (!suspicious.length) {
    Logger.log('[ChapterLogoDiagnostics][' + contextLabel + '] all clear. total=' + diagnostics.length);
    return;
  }
  Logger.log('[ChapterLogoDiagnostics][' + contextLabel + '] suspicious count=' + suspicious.length + ', details=' + JSON.stringify(suspicious));
}

function loadAllChaptersNormalized_(ss) {
  var chapterSheet = ss.getSheetByName('Chapters');
  if (!chapterSheet || chapterSheet.getLastRow() < 2) return [];
  var rows = chapterSheet.getDataRange().getValues();
  var headers = rows[0];
  if (headers.indexOf('ActivitiesJSON') >= 0 || headers.indexOf('ExtendedData') >= 0) {
    var legacyChapters = loadLegacyChapters_(rows);
    logChapterLogoDiagnostics_('loadAllChaptersNormalized-legacy', legacyChapters);
    return legacyChapters;
  }
  var indexMap = createHeaderIndexMap_(headers);
  var activitiesByChapter = loadChapterActivitiesByChapterId_(ss);
  var normalizedChapters = rows.slice(1).filter(function(row) {
    return row[indexMap.ChapterID] !== '' && row[indexMap.ChapterID] != null;
  }).map(function(row) {
    var chapterId = row[indexMap.ChapterID];
    return {
      id: chapterId, name: row[indexMap.Title] || '', description: row[indexMap.Description] || '', imageUrl: row[indexMap.ImageURL] || '', image: row[indexMap.ImageURL] || '',
      logo: row[indexMap.LogoURL] || '', location: row[indexMap.Location] || '', headName: row[indexMap.HeadName] || '', headRole: row[indexMap.HeadRole] || '',
      headQuote: row[indexMap.HeadQuote] || '', headImageUrl: row[indexMap.HeadImageUrl] || '', email: row[indexMap.Email] || '', phone: row[indexMap.Phone] || '',
      facebook: row[indexMap.Facebook] || '', twitter: row[indexMap.Twitter] || '', instagram: row[indexMap.Instagram] || '', websiteUrl: row[indexMap.WebsiteUrl] || '', joinUrl: row[indexMap.JoinUrl] || '',
      joinCtaDescription: row[indexMap.JoinCtaDescription] || '', activities: activitiesByChapter[String(chapterId)] || []
    };
  });
  logChapterLogoDiagnostics_('loadAllChaptersNormalized-mapped', normalizedChapters);
  return normalizedChapters;
}

function rewriteChaptersSheets_(ss, chapters) {
  var chapterRows = [];
  var activityRows = [];
  chapters.forEach(function(rawChapter) {
    var chapter = normalizeChapterRecord_(rawChapter.id, rawChapter);
    chapterRows.push([chapter.id, chapter.name || '', chapter.description || '', chapter.imageUrl || chapter.image || '', chapter.logo || '', chapter.location || '', chapter.headName || '', chapter.headRole || '', chapter.headQuote || '', chapter.headImageUrl || '', chapter.email || '', chapter.phone || '', chapter.facebook || '', chapter.twitter || '', chapter.instagram || '', chapter.websiteUrl || '', chapter.joinUrl || '', chapter.joinCtaDescription || '']);
    (chapter.activities || []).forEach(function(activity, index) {
      activityRows.push([chapter.id, activity.id || Utilities.getUuid(), activity.title || '', activity.description || '', activity.date || '', activity.imageUrl || '', activity.learnMoreUrl || '', index]);
    });
  });
  dyesabelWriteSheetRows_(dyesabelGetOrCreateSheet_(ss, 'Chapters'), CHAPTER_HEADERS, chapterRows);
  dyesabelWriteSheetRows_(dyesabelGetOrCreateSheet_(ss, 'ChapterActivities'), CHAPTER_ACTIVITY_HEADERS, activityRows);
}

function saveChapter_(data) {
  requireChapterManager_(data.sessionToken, data.chapterId);
  var ss = getMainSpreadsheet_();
  var chapters = loadAllChaptersNormalized_(ss);
  var index = chapters.findIndex(function(chapter) { return String(chapter.id) === String(data.chapterId); });
  var previousChapter = index >= 0 ? chapters[index] : null;
  Logger.log('[saveChapter_] incoming payload diagnostics=' + JSON.stringify({
    chapterId: String(data.chapterId || ''),
    chapterName: String(data.chapterData && (data.chapterData.name || data.chapterData.title) || ''),
    logo: String(data.chapterData && (data.chapterData.logo || data.chapterData.logoUrl) || ''),
    image: String(data.chapterData && (data.chapterData.image || data.chapterData.imageUrl) || ''),
    hasActivities: Array.isArray(data.chapterData && data.chapterData.activities)
  }));
  var nextChapter = normalizeChapterRecord_(data.chapterId, data.chapterData || {}, previousChapter);
  Logger.log('[saveChapter_] normalized chapter diagnostics=' + JSON.stringify(buildChapterLogoDiagnostic_(nextChapter)));
  if (index >= 0) chapters[index] = nextChapter; else chapters.push(nextChapter);
  rewriteChaptersSheets_(ss, chapters);
  return { message: 'Chapter saved successfully' };
}

function loadChapter_(chapterId) {
  var chapter = loadAllChaptersNormalized_(getMainSpreadsheet_()).find(function(item) { return String(item.id) === String(chapterId); }) || null;
  if (!chapter) {
    Logger.log('[loadChapter_] chapter not found for chapterId=' + String(chapterId || ''));
    return { chapter: null };
  }
  Logger.log('[loadChapter_] chapter diagnostics=' + JSON.stringify(buildChapterLogoDiagnostic_(chapter)));
  return { chapter: chapter };
}

function listChapters_() {
  var chapters = loadAllChaptersNormalized_(getMainSpreadsheet_());
  logChapterLogoDiagnostics_('listChapters', chapters);
  return { chapters: chapters };
}

function deleteChapter_(chapterId) {
  var ss = getMainSpreadsheet_();
  var allChapters = loadAllChaptersNormalized_(ss);
  var remainingChapters = allChapters.filter(function(chapter) { return String(chapter.id) !== String(chapterId); });
  var retainedImageUrls = {};
  remainingChapters.forEach(function(chapter) {
    collectReferencedImageUrlsDeep_(chapter, retainedImageUrls);
  });
  var removedChapters = allChapters.filter(function(chapter) { return String(chapter.id) === String(chapterId); });
  removedChapters.forEach(function(removedChapter) {
    cleanupImageFieldsFromItem_(removedChapter, 'removed-Chapters', retainedImageUrls);
    (Array.isArray(removedChapter.activities) ? removedChapter.activities : []).forEach(function(removedActivity) {
      cleanupImageFieldsFromItem_(removedActivity, 'removed-ChapterActivities', retainedImageUrls);
    });
  });
  rewriteChaptersSheets_(ss, remainingChapters);
  return { message: 'Chapter deleted' };
}

function getOrgSettings_() {
  var sheet = getMainSpreadsheet_().getSheetByName(MAIN_ORG_SHEET);
  var settings = {};
  if (!sheet) return { settings: settings };
  sheet.getDataRange().getValues().slice(1).forEach(function(row) { settings[row[0]] = row[1]; });
  return { settings: settings };
}

function updateOrgSettings_(data) {
  var sheet = dyesabelGetOrCreateSheet_(getMainSpreadsheet_(), MAIN_ORG_SHEET);
  if (sheet.getLastRow() === 0) sheet.appendRow(['Key', 'Value']);
  var rows = sheet.getDataRange().getValues();
  var settings = data.settings || {};
  for (var key in settings) {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) continue;
    var found = false;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(settings[key]);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([key, settings[key]]);
  }
  return { message: 'Settings updated' };
}

function initializeMainContentSystem_() {
  var ss = getMainSpreadsheet_();
  var orgSheet = dyesabelGetOrCreateSheet_(ss, MAIN_ORG_SHEET);
  if (orgSheet.getLastRow() === 0) {
    orgSheet.appendRow(['Key', 'Value']);
    orgSheet.appendRow(['organizationName', 'Dyesabel PH']);
  }
  var logSheet = dyesabelGetOrCreateSheet_(ss, MAIN_LOG_SHEET);
  if (logSheet.getLastRow() === 0) logSheet.appendRow(['Timestamp', 'UserId', 'Username', 'FileId', 'FileName', 'Folder']);
  Object.keys(MAIN_DATA_CONFIG).forEach(function(key) {
    var config = MAIN_DATA_CONFIG[key];
    var sheet = dyesabelGetOrCreateSheet_(ss, config.sheetName);
    if (sheet.getLastRow() === 0) sheet.appendRow(config.type === 'object' ? ['Key', 'Value'] : (config.fields || config.parentFields));
    if (config.type === 'nested') {
      var childSheet = dyesabelGetOrCreateSheet_(ss, config.childSheetName);
      if (childSheet.getLastRow() === 0) childSheet.appendRow(config.childFields);
    }
  });
  var partnersSheet = dyesabelGetOrCreateSheet_(ss, 'Partners');
  if (partnersSheet.getLastRow() === 0) partnersSheet.appendRow(PARTNER_HEADERS);
  var chaptersSheet = dyesabelGetOrCreateSheet_(ss, 'Chapters');
  if (chaptersSheet.getLastRow() === 0) chaptersSheet.appendRow(CHAPTER_HEADERS);
  var chapterActivitiesSheet = dyesabelGetOrCreateSheet_(ss, 'ChapterActivities');
  if (chapterActivitiesSheet.getLastRow() === 0) chapterActivitiesSheet.appendRow(CHAPTER_ACTIVITY_HEADERS);
  return { message: 'Main content sheets initialized successfully.' };
}

function migrateLegacyMappedSheet_(ss, sheetKey) {
  var config = MAIN_DATA_CONFIG[sheetKey];
  var legacy = getLegacyJsonSheetPayload_(ss.getSheetByName(config.sheetName));
  if (!legacy.hasLegacyFormat) return { sheet: config.sheetName, status: 'skipped', reason: 'already mapped or missing' };
  if (config.type === 'object') saveMappedObjectData_(ss, config, legacy.value && typeof legacy.value === 'object' && !Array.isArray(legacy.value) ? legacy.value : {});
  if (config.type === 'array') saveMappedArrayData_(ss, config, Array.isArray(legacy.value) ? legacy.value : []);
  if (config.type === 'nested') saveMappedNestedData_(ss, config, Array.isArray(legacy.value) ? legacy.value : []);
  return { sheet: config.sheetName, status: 'migrated' };
}

function migrateLegacyPartnersSheet_(ss) {
  var legacy = getLegacyJsonSheetPayload_(ss.getSheetByName('Partners'));
  if (!legacy.hasLegacyFormat) return { sheet: 'Partners', status: 'skipped', reason: 'already mapped or missing' };
  savePartners_(Array.isArray(legacy.value) ? legacy.value : []);
  return { sheet: 'Partners', status: 'migrated' };
}

function migrateLegacyChaptersSheet_(ss) {
  var sheet = ss.getSheetByName('Chapters');
  if (!sheet || sheet.getLastRow() < 1) return { sheet: 'Chapters', status: 'skipped', reason: 'missing' };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('ActivitiesJSON') === -1 && headers.indexOf('ExtendedData') === -1) return { sheet: 'Chapters', status: 'skipped', reason: 'already mapped' };
  var chapters = loadLegacyChapters_(sheet.getDataRange().getValues());
  rewriteChaptersSheets_(ss, chapters);
  return { sheet: 'Chapters', status: 'migrated', records: chapters.length };
}

function migrateLegacyContentToColumnMappings_() {
  var ss = getMainSpreadsheet_();
  return {
    migratedAt: new Date().toISOString(),
    results: [
      migrateLegacyMappedSheet_(ss, 'LandingPage'),
      migrateLegacyMappedSheet_(ss, 'Stories'),
      migrateLegacyMappedSheet_(ss, 'Founders'),
      migrateLegacyMappedSheet_(ss, 'ExecutiveOfficers'),
      migrateLegacyMappedSheet_(ss, 'Pillars'),
      migrateLegacyPartnersSheet_(ss),
      migrateLegacyChaptersSheet_(ss)
    ]
  };
}

function copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, sheetName) {
  var sourceSheet = sourceSpreadsheet.getSheetByName(sheetName);
  if (!sourceSheet || sourceSheet.getLastRow() < 1 || sourceSheet.getLastColumn() < 1) {
    return { sheet: sheetName, status: 'skipped', reason: 'missing in source' };
  }

  var targetSheet = dyesabelGetOrCreateSheet_(targetSpreadsheet, sheetName);
  var numRows = sourceSheet.getLastRow();
  var numCols = sourceSheet.getLastColumn();
  var values = sourceSheet.getRange(1, 1, numRows, numCols).getValues();

  dyesabelEnsureSheetSize_(targetSheet, numCols, Math.max(numRows, 2));
  targetSheet.clearContents();
  targetSheet.getRange(1, 1, numRows, numCols).setValues(values);
  targetSheet.setFrozenRows(1);

  return { sheet: sheetName, status: 'copied', rows: numRows - 1 };
}

function importAndMigrateMainContentFromSourceWorkbook_() {
  var sourceId = dyesabelRequireScriptProperty_('SOURCE_MONOLITH_SPREADSHEET_ID');
  var sourceSpreadsheet = SpreadsheetApp.openById(sourceId);
  var targetSpreadsheet = getMainSpreadsheet_();
  var copyResults = [
    copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, 'LandingPage'),
    copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, 'Stories'),
    copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, 'Founders'),
    copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, 'ExecutiveOfficers'),
    copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, 'Pillars'),
    copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, 'Partners'),
    copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, 'Chapters'),
    copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, 'OrgSettings'),
    copySheetValuesByName_(sourceSpreadsheet, targetSpreadsheet, 'ImageUploads')
  ];

  return {
    importedAt: new Date().toISOString(),
    copyResults: copyResults,
    migration: migrateLegacyContentToColumnMappings_()
  };
}

// Manual runners so these appear in the Apps Script Run menu during setup.
function runInitializeMainContentSystem() {
  return initializeMainContentSystem_();
}

function runMigrateLegacyContentToColumnMappings() {
  return migrateLegacyContentToColumnMappings_();
}

function runImportAndMigrateMainContentFromSourceWorkbook() {
  return importAndMigrateMainContentFromSourceWorkbook_();
}
