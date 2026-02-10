# Quick Reference: New Features

## 🎉 What's New

### ✅ Google Drive Integration
All images are now stored in Google Drive instead of being embedded in code:
- **Better Performance**: Faster page loads
- **Unlimited Storage**: No size limits on repositories
- **Easy Management**: View/delete images directly in Drive
- **CDN-Ready**: Can integrate with CDN for global delivery

### ✅ Logo Editor (Admin Only)
Admins can now edit organization logos:
- **Primary Logo**: Main site logo
- **Secondary Logo**: Alternative for dark backgrounds
- **Favicon**: Browser tab icon
- **Social Media Logo**: For og:image tags

## 📸 Image Upload Features

### All Editors Now Support:
- ✅ **Drag & Drop Upload** - Upload images to Google Drive
- ✅ **URL Input** - Paste existing image URLs
- ✅ **Real-time Preview** - See images immediately
- ✅ **Automatic Organization** - Files sorted into folders

### Supported Formats:
- JPG/JPEG
- PNG
- GIF
- WebP

## 🎨 Editors Available

### For Admin & Editor Roles:
1. **Pillars Editor** - Edit all 5 core pillars
   - Upload pillar cover images
   - Manage activities
   - Upload activity images

2. **Partners Editor** - Manage partner organizations
   - Upload partner logos
   - Organize by category

3. **Stories Editor** - Success stories & updates
   - Upload story images
   - Add/edit/remove stories

4. **Founders Editor** - Team profiles
   - Upload profile photos
   - Edit bios and roles

5. **Landing Page Editor** - Homepage content
   - Hero section
   - Slogan and messaging

### For Admin Only:
6. **Logo Editor** - Organization branding
   - Upload all organizational logos
   - Manage brand assets

### For Chapter Heads:
7. **Chapter Editor** - Own chapter only
   - Upload chapter cover image
   - Edit chapter details
   - Manage activities

## 🚀 Quick Start

### For Admins/Editors:
1. Log in
2. Click your profile → "Admin Dashboard"
3. Choose what to edit
4. Upload images by clicking on them
5. Save changes

### For Chapter Heads:
1. Log in
2. Automatically taken to chapter editor
3. Upload chapter image
4. Edit your chapter info
5. Save changes

## 💾 Data Storage

### Images:
- **Stored in**: Google Drive
- **Organized by**: Folder (Pillars, Partners, Stories, etc.)
- **Access**: Public (anyone with link)
- **Backup**: Automatic via Google Drive

### Content Data:
- **Stored in**: Google Sheets
- **Sheets Used**:
  - Pillars
  - Partners
  - Founders
  - Stories
  - Chapters
  - Settings (for logos)

## 🔧 Common Tasks

### Upload an Image:
1. Click on any image in an editor
2. Select file from computer
3. Wait for upload to complete
4. Image automatically saved to Drive

### Change Organization Logo:
1. Log in as admin
2. Go to Admin Dashboard
3. Click "Organization Logos"
4. Upload new logo(s)
5. Save changes
6. Refresh page to see new logo

### Add a New Story:
1. Go to Stories Editor
2. Click "Add Story"
3. Upload image
4. Fill in title, date, excerpt
5. Save

### Edit Chapter Page:
1. Log in as chapter head
2. Upload chapter cover image
3. Edit description
4. Add/remove activities
5. Save

## 📊 File Organization in Google Drive

```
📁 Dyesabel PH Images/
  ├── 📁 Pillars/          (pillar-{id}-{timestamp}.jpg)
  ├── 📁 Activities/       (activity-{id}-{timestamp}.jpg)
  ├── 📁 Partners/         (partner-{id}-{timestamp}.jpg)
  ├── 📁 Founders/         (founder-{id}-{timestamp}.jpg)
  ├── 📁 Stories/          (story-{id}-{timestamp}.jpg)
  ├── 📁 Chapters/         (chapter-{id}-{timestamp}.jpg)
  ├── 📁 Logos/            (primaryLogo-{timestamp}.png)
  └── 📁 Landing/          (landing-{section}-{timestamp}.jpg)
```

## ⚡ Performance Tips

### For Best Results:
- **Optimize images** before upload (<500KB)
- **Use correct dimensions**:
  - Logos: 200-400px wide
  - Pillars: 600x400px
  - Stories: 600x400px
  - Founders: 400x400px (square)
- **Compress images** to 80-90% quality
- **Use PNG** for logos (transparency)
- **Use JPG** for photos

## 🔐 Security

### Who Can Do What:
| Action | Admin | Editor | Chapter Head |
|--------|-------|--------|--------------|
| Edit Pillars | ✅ | ✅ | ❌ |
| Edit Partners | ✅ | ✅ | ❌ |
| Edit Stories | ✅ | ✅ | ❌ |
| Edit Founders | ✅ | ✅ | ❌ |
| Edit Logos | ✅ | ❌ | ❌ |
| Edit Own Chapter | ✅ | ❌ | ✅ |
| Edit Any Chapter | ✅ | ❌ | ❌ |

## 🆘 Troubleshooting

### Images not uploading?
- Check file size (<5MB)
- Check internet connection
- Try again in a few minutes
- Contact admin if persists

### Changes not saving?
- Check if logged in
- Check session hasn't expired
- Refresh and try again

### Can't see new logo?
- Hard refresh page (Ctrl+F5)
- Clear browser cache
- Wait a few minutes for propagation

## 📞 Get Help

### For Technical Issues:
- Check GDRIVE_SETUP_GUIDE.md
- Check IMPLEMENTATION_GUIDE.md
- Contact system administrator

### For Usage Questions:
- Check EDITING_GUIDE.md
- Ask your team admin
- Contact support

---

**Quick Tip**: Always optimize images before upload to ensure fast page load times!

**Remember**: All uploads are stored in Google Drive, so you can always access them there if needed.

**Pro Tip**: Use the Logo Editor to maintain consistent branding across your entire website!
