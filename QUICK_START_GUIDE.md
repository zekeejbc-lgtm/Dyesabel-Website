# Quick Start Guide - Content Editing System with Google Drive

## 🎯 What's New

Your Dyesabel PH website now has a complete content management system with Google Drive integration for image storage!

### Key Features Added:

✅ **Pillar Editor** - Edit all 5 core pillars and their activities
✅ **Partner Editor** - Manage partner organizations with logos
✅ **Stories Editor** - Add and edit success stories
✅ **Founders Editor** - Manage founder profiles
✅ **Logo Editor** - Upload and manage organization logo
✅ **Chapter Editor** - Enhanced for chapter heads
✅ **Google Drive Storage** - All images stored in your Google Drive
✅ **Role-Based Access** - Different permissions for admin, editor, and chapter heads

## 🚀 Quick Setup (5 Steps)

### Step 1: Update Google Apps Script (5 minutes)

1. Open your Google Apps Script project
2. Create a new file: `DriveUpload.gs`
3. Copy content from `gas-backend/DriveUpload.gs`
4. Update `doPost` function in `Code.gs` with new cases (see GOOGLE_DRIVE_SETUP.md)
5. Deploy as Web App

### Step 2: Update Frontend Files (2 minutes)

1. Copy all files from the updated package to your project
2. Replace `AdminDashboard.tsx` with `AdminDashboard_NEW.tsx`
3. Ensure all new components are in the `components/` folder
4. Add the `utils/` folder with `driveUpload.ts`

### Step 3: Test the System (5 minutes)

1. Log in as admin
2. Open Admin Dashboard
3. Click "Logo & Branding"
4. Upload a test image
5. Verify it appears in Google Drive under "Dyesabel Images/logo/"

### Step 4: Add Content (15 minutes)

1. Upload your organization logo
2. Update pillar images and content
3. Add partner logos
4. Upload founder photos
5. Add success stories

### Step 5: Train Your Team (10 minutes)

1. Share the EDITING_GUIDE.md with content editors
2. Give each user their login credentials
3. Assign appropriate roles (admin, editor, or chapter_head)
4. Show them how to access their editors

**Total Setup Time: ~35 minutes**

## 👥 User Roles Quick Reference

### Admin
- **Can Access**: Everything
- **Main Use**: Full site management, user management
- **Dashboard**: Full Admin Dashboard with all editors

### Editor  
- **Can Access**: All content editors (NOT chapters)
- **Main Use**: Update content, images, and text
- **Dashboard**: Admin Dashboard (content sections only)

### Chapter Head
- **Can Access**: Only their assigned chapter
- **Main Use**: Update chapter page, activities, images
- **Dashboard**: Automatically redirected to Chapter Editor

## 📁 File Structure

```
your-project/
├── components/
│   ├── AdminDashboard.tsx        (NEW - use AdminDashboard_NEW.tsx)
│   ├── PillarsEditor.tsx         (NEW - with Google Drive)
│   ├── PartnersEditor.tsx        (NEW)
│   ├── StoriesEditor.tsx         (NEW)
│   ├── FoundersEditor.tsx        (NEW)
│   ├── LogoEditor.tsx            (NEW)
│   ├── ChapterEditor.tsx         (UPDATED)
│   └── ... (other components)
│
├── utils/
│   └── driveUpload.ts            (NEW - Google Drive functions)
│
├── gas-backend/
│   ├── Code.gs                   (EXISTING - update doPost)
│   └── DriveUpload.gs            (NEW - add this file)
│
└── Documentation/
    ├── EDITING_GUIDE.md          (User guide)
    ├── IMPLEMENTATION_GUIDE.md   (Developer guide)
    └── GOOGLE_DRIVE_SETUP.md     (Drive setup)
```

## 🎨 Editing Content

### For Admins & Editors:

1. **Log in** to your account
2. **Click profile icon** → "Admin Dashboard"
3. **Choose what to edit**:
   - Core Pillars → Edit pillar content and images
   - Partner Organizations → Manage partners and logos
   - Success Stories → Add/edit stories
   - Founders & Leadership → Update founder profiles
   - Logo & Branding → Upload organization logo

### For Chapter Heads:

1. **Log in** with chapter head credentials
2. **Automatically redirected** to Chapter Editor
3. **Edit your chapter**: title, description, image, activities

## 🖼️ Uploading Images

All images are stored in Google Drive automatically!

### Best Practices:

- **File Size**: Under 5MB
- **Formats**: JPG, PNG, GIF, WebP
- **Recommended Sizes**:
  - Logo: 400x400px (square)
  - Pillar covers: 600x400px
  - Partner logos: 200x200px (circular)
  - Founder photos: 400x400px
  - Story images: 600x400px
  - Chapter covers: 800x450px

### How to Upload:

1. Click on any image in an editor
2. Select your file
3. Wait for "Upload to Google Drive" confirmation
4. Image appears immediately
5. Click "Save Changes" to persist

## 🗂️ Google Drive Organization

Your images are auto-organized in:

```
My Drive/
└── Dyesabel Images/
    ├── logo/              (Organization logo)
    ├── pillars/           (Pillar images)
    ├── pillar-activities/ (Activity images)
    ├── partners/          (Partner logos)
    ├── stories/           (Story images)
    ├── founders/          (Founder photos)
    └── chapters/          (Chapter images)
```

## ✅ Checklist for Going Live

- [ ] Google Apps Script deployed with new functions
- [ ] All editor components added to project
- [ ] AdminDashboard replaced with new version
- [ ] Logo uploaded and saved
- [ ] All 5 pillars have images and content
- [ ] Partner logos uploaded
- [ ] Founder photos uploaded
- [ ] At least 2-3 stories published
- [ ] Tested on both desktop and mobile
- [ ] All users have accounts and correct roles
- [ ] Team trained on editing system
- [ ] Backup of Google Drive images created

## 🆘 Common Issues & Solutions

### "Upload failed"
- ✓ Check file size (under 5MB)
- ✓ Verify file format (JPG, PNG, GIF, WebP)
- ✓ Ensure you're logged in
- ✓ Check internet connection

### "Changes not saving"
- ✓ Click "Save Changes" button
- ✓ Wait for confirmation message
- ✓ Check session hasn't expired
- ✓ Verify internet connection

### "Cannot access editor"
- ✓ Verify you're logged in
- ✓ Check your user role
- ✓ Ask admin to verify permissions
- ✓ Try logging out and back in

### Images not showing
- ✓ Verify image uploaded successfully
- ✓ Check Google Drive for file
- ✓ Try refreshing the page
- ✓ Check browser console for errors

## 📊 Data Storage

### Where is data stored?

- **Images**: Google Drive (your account)
- **Content**: Google Sheets (your spreadsheet)
- **User accounts**: Google Sheets (Users sheet)
- **Sessions**: Google Sheets (Sessions sheet)

### Backup Strategy:

1. **Google Drive**: Automatically backed up by Google
2. **Google Sheets**: Download as Excel monthly
3. **Code**: Keep in version control (Git)

## 🔒 Security Features

- ✅ Role-based access control
- ✅ Session-based authentication
- ✅ 24-hour session timeout
- ✅ Action logging (who uploaded what)
- ✅ Permission checks on every action
- ✅ Chapter heads restricted to own chapter

## 📱 Mobile Support

All editors are mobile-responsive:
- ✅ Works on tablets and phones
- ✅ Touch-friendly interfaces
- ✅ Optimized layouts
- ✅ Image upload from camera or gallery

## 🎓 Training Resources

1. **EDITING_GUIDE.md** - Complete user guide for editors
2. **IMPLEMENTATION_GUIDE.md** - Technical implementation details
3. **GOOGLE_DRIVE_SETUP.md** - Drive integration setup
4. **This file** - Quick reference guide

## 📈 Next Steps

After initial setup:

1. **Week 1**: Add all content and images
2. **Week 2**: Train all editors
3. **Week 3**: Monitor usage and gather feedback
4. **Week 4**: Optimize based on feedback

## 💡 Pro Tips

1. **Compress images** before uploading for faster loading
2. **Use consistent naming** for easy organization
3. **Regular backups** - download Drive folder monthly
4. **Monitor storage** - check your Google Drive space
5. **Update content regularly** - keep site fresh
6. **Test on mobile** - ensure images look good on phones
7. **Use high-quality images** - represents your organization

## 🌟 Key Benefits

- ✅ **No coding needed** - Edit content through visual editors
- ✅ **Free storage** - 15GB free with Google Drive
- ✅ **Fast loading** - Images served from Google's CDN
- ✅ **Easy management** - All files visible in Drive
- ✅ **Team collaboration** - Multiple editors can work
- ✅ **Mobile friendly** - Edit from anywhere
- ✅ **Secure** - Role-based permissions
- ✅ **Scalable** - Grows with your organization

## 📞 Support

For help:
1. Check the documentation files
2. Review browser console for errors
3. Check Google Apps Script logs
4. Contact your technical administrator

---

**Ready to get started?** Follow the 5-step setup above!

**Questions?** Read the detailed guides in the Documentation folder.

**Need help?** Contact your administrator or technical support.

---

**Version**: 2.0 with Google Drive Integration
**Last Updated**: February 2026
