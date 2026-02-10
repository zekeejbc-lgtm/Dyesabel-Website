# Google Drive Integration Setup Guide

## Overview
This guide will help you set up Google Drive as the image storage backend for the Dyesabel PH website. All images uploaded through the admin dashboard will be stored in Google Drive and served from there.

## Prerequisites
- Google Account with access to Google Drive
- Google Apps Script knowledge (basic)
- Access to the Dyesabel PH Google Spreadsheet

---

## Step 1: Create Google Drive Folder Structure

### 1.1 Create Main Folder
1. Go to [Google Drive](https://drive.google.com)
2. Click "New" → "New folder"
3. Name it: **Dyesabel PH Images**
4. Right-click the folder → "Get link"
5. **Copy the folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
                                          ↑ Copy this part
   ```
   Example: If URL is `https://drive.google.com/drive/folders/1AbC2DeF3GhI4JkL5MnO6PqR7StU8VwX9YzA`
   The FOLDER_ID is: `1AbC2DeF3GhI4JkL5MnO6PqR7StU8VwX9YzA`

### 1.2 Create Subfolders
Inside the main folder, create these subfolders:
- **Pillars** - For pillar cover images
- **Activities** - For pillar activity images
- **Partners** - For partner logos
- **Founders** - For founder photos
- **Stories** - For success story images
- **Chapters** - For chapter cover images
- **Logos** - For organization logos
- **Landing** - For landing page images

Your folder structure should look like:
```
📁 Dyesabel PH Images/
  ├── 📁 Pillars/
  ├── 📁 Activities/
  ├── 📁 Partners/
  ├── 📁 Founders/
  ├── 📁 Stories/
  ├── 📁 Chapters/
  ├── 📁 Logos/
  └── 📁 Landing/
```

---

## Step 2: Update Google Apps Script

### 2.1 Replace Code.gs
1. Open your Google Spreadsheet
2. Go to **Extensions → Apps Script**
3. Delete the old `Code.gs` content
4. Copy and paste the entire content from `gas-backend/Code_Enhanced.gs`

### 2.2 Update Configuration
In the new `Code.gs`, find this line (around line 13):
```javascript
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';
```

Replace `YOUR_DRIVE_FOLDER_ID` with the folder ID you copied in Step 1.1.

Example:
```javascript
const DRIVE_FOLDER_ID = '1AbC2DeF3GhI4JkL5MnO6PqR7StU8VwX9YzA';
```

### 2.3 Run Setup Functions
1. In Apps Script editor, select **initializeSystem** from the function dropdown
2. Click ▶️ Run
3. Authorize the script when prompted
4. Then select **setupDriveFolders** from the dropdown
5. Click ▶️ Run

This will create all necessary sheets and verify Drive folder access.

### 2.4 Deploy Web App
1. Click **Deploy → New deployment**
2. Click gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Settings:
   - **Description:** "Dyesabel PH API with Drive Integration"
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy**
6. Copy the **Web app URL**
7. Click **Done**

---

## Step 3: Update Frontend Configuration

### 3.1 Update API URL
In your project, open `services/DriveService.ts` and update line 6:
```typescript
const GAS_API_URL = 'YOUR_DEPLOYED_WEB_APP_URL';
```

Paste the Web app URL you copied in Step 2.4.

### 3.2 Update AuthContext
Also update the GAS_API_URL in `contexts/AuthContext.tsx` (line 25):
```typescript
const GAS_API_URL = 'YOUR_DEPLOYED_WEB_APP_URL';
```

---

## Step 4: Set Folder Permissions

### 4.1 Make Folders Publicly Accessible
For each subfolder (Pillars, Activities, etc.):
1. Right-click the folder
2. Click "Share"
3. Click "Change" under "General access"
4. Select "Anyone with the link"
5. Make sure "Viewer" is selected
6. Click "Done"

### 4.2 Verify Permissions
The script will automatically set uploaded images to be publicly viewable, but the folders need to allow this.

---

## Step 5: Test the Integration

### 5.1 Test Image Upload
1. Log in as admin
2. Go to Admin Dashboard
3. Click "Edit Pillars"
4. Try uploading an image
5. Check if:
   - Upload completes successfully
   - Image appears in preview
   - Image is saved in Google Drive
   - Image URL starts with `https://drive.google.com/uc?export=view&id=...`

### 5.2 Verify Drive Storage
1. Go to your Google Drive
2. Navigate to **Dyesabel PH Images → Pillars**
3. You should see the uploaded image
4. Click on it to verify it's publicly accessible

### 5.3 Test Other Editors
Test uploading in:
- Partners Editor (partner logos)
- Stories Editor (story images)
- Founders Editor (profile photos)
- Chapter Editor (chapter covers)
- Logo Editor (organization logos)

---

## Step 6: Monitor and Maintain

### 6.1 Check Storage Usage
- Google Drive free tier: 15 GB
- Monitor usage in [Google Drive Storage](https://drive.google.com/settings/storage)
- Each image should be optimized to <500KB before upload

### 6.2 Backup Strategy
1. Regularly backup your Drive folder
2. Download a local copy monthly
3. Consider Google Workspace for automatic backups

### 6.3 Clean Up Old Images
Periodically check for:
- Duplicate images
- Unused images (replaced logos, etc.)
- Delete from Drive to save space

---

## Troubleshooting

### Issue: "Upload failed: Drive folder not configured"
**Solution:** 
- Verify DRIVE_FOLDER_ID is correct in Code.gs
- Redeploy the Apps Script
- Make sure you ran setupDriveFolders()

### Issue: "Upload failed: Permission denied"
**Solution:**
- Re-authorize the script
- Check folder sharing settings
- Verify the script is running as "Me" (your account)

### Issue: Images not displaying
**Solution:**
- Check if image URL is correct
- Verify folder is set to "Anyone with the link"
- Try accessing the Drive URL directly in browser
- Check browser console for CORS errors

### Issue: "Upload is slow"
**Solution:**
- Optimize images before upload (use tools like TinyPNG)
- Keep images under 500KB
- Use appropriate image dimensions
- Compress images to 80-90% quality

### Issue: "Quota exceeded"
**Solution:**
- Check Google Apps Script quotas
- Daily upload limit: 50 MB per day
- Spread large batch uploads over multiple days
- Consider Google Workspace for higher limits

---

## Advanced Configuration

### Custom Domain for Images
If you have a custom domain, you can use Google Drive as backend but serve through a CDN:
1. Set up Cloudflare or similar CDN
2. Create rewrites from your domain to Drive URLs
3. Update image URLs in the database

### Automatic Image Optimization
Add to Google Apps Script:
```javascript
function optimizeImage(blob) {
  // Use Google's image services to resize/optimize
  var thumbnail = DriveApp.createFile(blob).getThumbnail();
  return thumbnail;
}
```

### Image Versioning
Keep old versions when images are replaced:
1. Don't delete old files immediately
2. Move to "Archive" folder
3. Keep for 30 days before deletion

---

## Security Considerations

### 1. File Access Control
- ✅ Images are public (required for website display)
- ✅ Upload is protected by authentication
- ✅ Only admins/editors can upload
- ❌ Never store sensitive documents in these folders

### 2. Script Security
- ✅ Script runs as your account
- ✅ Session tokens expire after 24 hours
- ✅ Rate limiting prevents abuse
- ⚠️ Keep Apps Script URL private (don't commit to public repos)

### 3. Content Moderation
- Implement manual review for uploaded images
- Set up alerts for new uploads
- Regular audits of Drive content

---

## Performance Tips

1. **Image Optimization**
   - Use WebP format when possible
   - Resize images to exact display size
   - Compress before upload

2. **Caching**
   - Drive URLs are cacheable
   - Set proper cache headers
   - Use CDN for better performance

3. **Lazy Loading**
   - Implement lazy loading for images
   - Use loading="lazy" attribute
   - Progressive image loading

---

## Migration from Old System

If you have existing images:

### Manual Migration
1. Download all existing images
2. Upload through the new editors
3. Update references in database

### Bulk Migration Script
```javascript
function migrateImages() {
  // Get old image URLs from sheets
  // Download each image
  // Upload to Drive
  // Update URLs in sheets
}
```

---

## Cost Considerations

### Free Tier (Google Drive)
- 15 GB storage
- Sufficient for ~30,000 optimized images
- No bandwidth limits for public links

### Upgrade Options
- Google One (100 GB): $1.99/month
- Google Workspace (30 GB per user): $6/month
- Unlimited storage needs: Google Workspace Business Plus

---

## Support Resources

- [Google Drive API Documentation](https://developers.google.com/drive)
- [Apps Script Best Practices](https://developers.google.com/apps-script/guides/best-practices)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)

---

## Checklist

- [ ] Created Google Drive folder structure
- [ ] Copied folder ID
- [ ] Updated DRIVE_FOLDER_ID in Code.gs
- [ ] Ran initializeSystem() function
- [ ] Ran setupDriveFolders() function
- [ ] Deployed Apps Script as web app
- [ ] Updated GAS_API_URL in DriveService.ts
- [ ] Updated GAS_API_URL in AuthContext.tsx
- [ ] Set all folders to "Anyone with the link"
- [ ] Tested image upload in each editor
- [ ] Verified images appear in Drive
- [ ] Verified images display on website
- [ ] Set up monitoring/backup strategy

---

**Version:** 1.0  
**Last Updated:** February 2026  
**Maintained By:** Dyesabel PH Development Team
