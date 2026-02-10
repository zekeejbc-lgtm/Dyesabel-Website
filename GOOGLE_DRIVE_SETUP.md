# Google Drive Integration Setup Guide

## Overview
This system uses Google Drive as a database for storing all images (pillar images, partner logos, story images, founder photos, organization logo, and chapter images). All uploads are automatically organized in folders and made publicly accessible.

## Benefits of Using Google Drive

✅ **Free Storage** - Google provides 15GB free storage
✅ **Reliable** - Google's infrastructure ensures high availability
✅ **Fast** - Images load quickly from Google's CDN
✅ **Easy Management** - View and manage all images in Google Drive
✅ **Automatic Organization** - Images are organized in folders by type
✅ **Public URLs** - Direct, shareable links for all images
✅ **Version Control** - Keep track of image uploads and changes

## Setup Instructions

### Step 1: Update Your Google Apps Script

1. Open your Google Apps Script project
2. Create a new file named `DriveUpload.gs`
3. Copy the entire content from `gas-backend/DriveUpload.gs` into this file
4. Update your existing `Code.gs` file's `doPost` function:

```javascript
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createResponse(false, 'No data provided');
    }

    const data = JSON.parse(e.postData.contents);
    
    switch(data.action) {
      // Existing cases
      case 'login':
        return handleLogin(data.username, data.password);
      case 'logout':
        return handleLogout(data.sessionToken);
      case 'validateSession':
        return handleValidateSession(data.sessionToken);
      
      // NEW: Image Upload Cases
      case 'uploadImage':
        return handleUploadImage(data.sessionToken, data.fileName, data.mimeType, data.base64Data, data.folder);
      case 'deleteImage':
        return handleDeleteImage(data.sessionToken, data.fileId);
      
      // NEW: Organization Settings Cases
      case 'getOrgSettings':
        return handleGetOrgSettings(data.sessionToken);
      case 'updateOrgSettings':
        return handleUpdateOrgSettings(data.sessionToken, data.settings);
      
      // NEW: Content Management Cases
      case 'savePillars':
        return handleSavePillars(data.sessionToken, data.pillars);
      case 'loadPillars':
        return handleLoadPillars();
      case 'savePartners':
        return handleSavePartners(data.sessionToken, data.partners);
      case 'loadPartners':
        return handleLoadPartners();
      case 'saveStories':
        return handleSaveStories(data.sessionToken, data.stories);
      case 'loadStories':
        return handleLoadStories();
      case 'saveFounders':
        return handleSaveFounders(data.sessionToken, data.founders);
      case 'loadFounders':
        return handleLoadFounders();
      case 'saveChapter':
        return handleSaveChapter(data.sessionToken, data.chapterId, data.chapterData);
      case 'loadChapter':
        return handleLoadChapter(data.chapterId);
      
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createResponse(false, 'Server error: ' + error.toString());
  }
}
```

### Step 2: Deploy the Updated Script

1. Click **Deploy** → **New deployment**
2. Select type: **Web app**
3. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Copy the new deployment URL
6. Update the URL in your frontend code (`utils/driveUpload.ts`)

### Step 3: Google Drive Folder Structure

After the first image upload, the script will automatically create this folder structure in your Google Drive:

```
My Drive/
└── Dyesabel Images/
    ├── logo/               (Organization logo)
    ├── pillars/            (Pillar cover images)
    ├── pillar-activities/  (Activity images)
    ├── partners/           (Partner logos)
    ├── stories/            (Story images)
    ├── founders/           (Founder photos)
    └── chapters/           (Chapter images)
```

You can view and manage all uploaded images directly in Google Drive.

### Step 4: Google Sheets Structure

The script creates these new sheets in your spreadsheet:

#### **OrgSettings Sheet**
Stores organization-wide settings:

| Setting | Value |
|---------|-------|
| organizationName | Dyesabel PH |
| logoUrl | https://drive.google.com/... |
| logoFileId | abc123xyz... |

#### **ImageUploads Sheet** (Log)
Tracks all image uploads:

| Timestamp | User | File ID | File Name | Folder | URL |
|-----------|------|---------|-----------|--------|-----|
| 2024-02-11... | admin | xyz... | logo.png | logo | https://... |

#### **Pillars Sheet**
| ID | Title | Excerpt | Description | Aim | ImageURL | ActivitiesJSON |
|----|-------|---------|-------------|-----|----------|----------------|

#### **Partners Sheet**
| CategoryID | CategoryTitle | PartnersJSON |
|------------|---------------|--------------|

#### **Stories Sheet**
| ID | Title | Excerpt | Date | ImageURL |
|----|-------|---------|------|----------|

#### **Founders Sheet**
| ID | Name | Role | Bio | ImageURL |
|----|------|------|-----|----------|

#### **Chapters Sheet**
| ChapterID | Title | Description | ImageURL | ActivitiesJSON | Members |
|-----------|-------|-------------|----------|----------------|---------|

## How It Works

### Image Upload Flow

1. **User selects image** in editor
2. **Frontend converts to base64** (client-side)
3. **Send to Google Apps Script** via POST request
4. **Script creates/finds folder** in Google Drive
5. **Upload image to folder**
6. **Set sharing to public** (anyone with link can view)
7. **Return public URL** to frontend
8. **Frontend displays image** immediately
9. **Save URL to database** when user clicks "Save Changes"

### Public URL Format

Google Drive images use this URL format:
```
https://drive.google.com/uc?export=view&id=FILE_ID
```

This format:
- Works in `<img>` tags
- Doesn't require authentication
- Loads quickly via Google's CDN
- Is reliable and permanent (unless you delete the file)

## Features Enabled

### 1. Logo Editor
- Upload organization logo to Google Drive
- Preview before saving
- Update organization name
- Stored permanently in Drive

### 2. Pillar Images
- Upload cover image for each pillar
- Upload images for each activity
- Organized in separate folders
- Easy to find and replace

### 3. Partner Logos
- Upload logo for each partner
- Circular display in frontend
- Organized by category

### 4. Story Images
- Upload cover image for each story
- High-quality image storage
- Fast loading

### 5. Founder Photos
- Professional profile photos
- Consistent quality
- Easy updates

### 6. Chapter Images
- Chapter heads upload their own images
- Chapter cover photos
- Activity images

## Testing the Integration

### Test 1: Logo Upload
1. Log in as admin or editor
2. Go to Admin Dashboard
3. Click "Logo & Branding"
4. Select an image file
5. Click "Upload to Google Drive"
6. Wait for success message
7. Click "Save Changes"
8. Check your Google Drive for the image in "Dyesabel Images/logo/"

### Test 2: Pillar Image Upload
1. Go to Admin Dashboard
2. Click "Edit Pillars"
3. Select a pillar
4. Click on the cover image
5. Select an image file
6. Wait for upload confirmation
7. Verify image appears immediately
8. Save changes

### Test 3: Check Google Drive
1. Open Google Drive
2. Navigate to "Dyesabel Images" folder
3. Verify images are organized in subfolders
4. Try opening an image URL directly in browser
5. Confirm public access works

## Troubleshooting

### Issue: "Upload failed" error

**Solutions:**
- Check file size (must be under 5MB)
- Verify file type (JPG, PNG, GIF, WebP only)
- Ensure you're logged in
- Check session hasn't expired
- Verify GAS deployment is active

### Issue: Images not appearing

**Solutions:**
- Check browser console for errors
- Verify URL format is correct
- Ensure file is publicly shared in Drive
- Try opening URL directly in new tab
- Check Google Apps Script logs

### Issue: "Insufficient permissions" error

**Solutions:**
- Verify user role (admin or editor for most content)
- Check session token is valid
- Re-login and try again
- Verify user has correct role in Users sheet

### Issue: Google Drive folder not created

**Solutions:**
- Check Google Apps Script execution log
- Verify script has Drive permissions
- Try uploading manually to create folder
- Check Drive API is enabled

## Security & Privacy

### Access Control
- Only authenticated users can upload
- Uploads are logged with username and timestamp
- Chapter heads can only upload to their chapter
- Admins and editors have full access

### Image Sharing
- All uploaded images are set to "Anyone with link can view"
- No authentication needed to view images
- URLs are permanent (unless file is deleted)
- You can change sharing settings manually in Drive if needed

### Data Privacy
- Images are stored in YOUR Google Drive
- You own all the data
- Can delete anytime
- Can download all images from Drive

## Backup & Recovery

### Automatic Backup
Google Drive automatically backs up your files. No additional setup needed.

### Manual Backup
1. Go to Google Drive
2. Select "Dyesabel Images" folder
3. Right-click → Download
4. Save the ZIP file locally
5. Store in a safe location

### Recovery
If images are accidentally deleted:
1. Check Google Drive Trash
2. Restore files from trash
3. Update URLs in database if needed

## Maintenance

### Regular Tasks
- **Monthly**: Review image uploads log
- **Quarterly**: Check Drive storage usage
- **Annually**: Clean up unused images

### Storage Management
- Monitor your 15GB Google Drive limit
- Delete old/unused images
- Compress images before upload
- Use appropriate image formats

## Migration from Base64

If you're currently storing images as base64 in the code:

1. Upload all images to Google Drive via editors
2. Copy the new URLs
3. Update your data
4. Remove base64 data from code
5. Redeploy

Benefits:
- Smaller code files
- Faster page loads
- Easier image management
- Better performance

## Advanced Features

### Batch Upload (Future)
Could be implemented to upload multiple images at once.

### Image Optimization (Future)
Could automatically resize/compress images on upload.

### CDN Integration (Future)
Could use Google Cloud CDN for even faster loading.

## Support

For issues or questions:
1. Check Google Apps Script execution logs
2. Review browser console for errors
3. Verify Google Drive permissions
4. Check this documentation
5. Contact your technical administrator

---

**Last Updated**: February 2026
**Version**: 2.0 (Google Drive Integration)
