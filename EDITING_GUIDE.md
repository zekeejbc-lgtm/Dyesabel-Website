# Content Editing System - User Guide

## Overview
The Dyesabel PH website now includes a comprehensive content management system that allows authorized users to edit various sections of the website based on their role and permissions.

## User Roles & Permissions

### 1. Admin
**Full Access** - Can edit everything on the website:
- ✅ Pillars (all 5 pillars and their activities)
- ✅ Partners (all partner categories)
- ✅ Stories (success stories and updates)
- ✅ Founders (founder profiles)
- ✅ Landing Page (hero, slogan sections)
- ✅ All Chapters (any chapter page)

### 2. Editor
**Content Editor Access** - Can edit main content sections:
- ✅ Pillars (all 5 pillars and their activities)
- ✅ Partners (all partner categories)
- ✅ Stories (success stories and updates)
- ✅ Founders (founder profiles)
- ✅ Landing Page (hero, slogan sections)
- ❌ Cannot edit chapters

### 3. Chapter Head
**Chapter-Specific Access** - Can only edit their assigned chapter:
- ❌ Cannot edit pillars, partners, stories, or founders
- ❌ Cannot edit landing page
- ✅ Can edit ONLY their assigned chapter page
  - Chapter title
  - Chapter description
  - Chapter cover image
  - Chapter activities
  - Member count

## Editing Features

### For Admins & Editors

#### 1. **Pillars Editor**
Located in Admin Dashboard → "Edit Pillars"

**Features:**
- Edit all 5 core pillars (Research, Governance, Livelihood, Health, Arts)
- For each pillar:
  - Update cover image (upload or URL)
  - Edit title
  - Edit short excerpt
  - Edit full description
  - Edit aim/goal statement
  - Manage activities:
    - Add new activities
    - Remove activities
    - Edit activity images
    - Edit activity titles, dates, and descriptions

**How to use:**
1. Click "Edit Pillars" in the Admin Dashboard
2. Select a pillar from the sidebar
3. Make your changes
4. Upload images by clicking on any image and selecting a file
5. Click "Save Changes" when done

#### 2. **Partners Editor**
Located in Admin Dashboard → "Edit Partners"

**Features:**
- Manage partners across 4 categories:
  - Coalitions
  - Government Partners
  - Non-Government Partners (National)
  - Non-Government Partners (International)
- For each category:
  - Edit category name
  - Add new partners
  - Remove partners
  - Upload partner logos
  - Edit partner names

**How to use:**
1. Click "Edit Partners" in the Admin Dashboard
2. Select a category from the sidebar
3. Add partners with the "Add Partner" button
4. Click on partner logos to upload new images
5. Edit partner names directly
6. Click "Save Changes" when done

#### 3. **Stories Editor**
Located in Admin Dashboard → "Edit Stories"

**Features:**
- Add new success stories and updates
- Remove old stories
- For each story:
  - Upload story image
  - Edit title
  - Edit date
  - Edit excerpt/description

**How to use:**
1. Click "Edit Stories" in the Admin Dashboard
2. Click "Add Story" to create a new story
3. Click on story images to upload new photos
4. Edit story details
5. Use the trash icon to remove stories
6. Click "Save Changes" when done

#### 4. **Founders Editor**
Located in Admin Dashboard → "Edit Founders"

**Features:**
- Add new founders/leadership members
- Remove founders
- For each founder:
  - Upload profile photo
  - Edit name
  - Edit role/position
  - Edit biography

**How to use:**
1. Click "Edit Founders" in the Admin Dashboard
2. Click "Add Founder" to add a new founder
3. Click on profile photos to upload new images
4. Edit founder details
5. Use the trash icon to remove founders
6. Click "Save Changes" when done

### For Chapter Heads

#### **Chapter Editor**
Accessible after login (Chapter Heads are automatically redirected to their chapter editor)

**Features:**
- Edit your chapter page:
  - Chapter title
  - Chapter description
  - Chapter cover image (upload or URL)
  - Chapter activities (add, edit, remove)
  - Member count

**How to use:**
1. Log in with your chapter head credentials
2. You'll be taken directly to your chapter editor
3. Edit your chapter information
4. Click on the cover image to upload a new photo
5. Add activities with "Add Activity"
6. Remove activities with the trash icon
7. Click "Save Changes" to save your updates

## Image Upload Guidelines

### Supported Formats
- JPG/JPEG
- PNG
- GIF
- WebP

### Recommended Sizes
- **Pillar Cover Images**: 600x400px (3:2 ratio)
- **Activity Images**: 500x300px (5:3 ratio)
- **Partner Logos**: 200x200px (square, will be displayed as circle)
- **Founder Photos**: 400x400px (square)
- **Story Images**: 600x400px (3:2 ratio)
- **Chapter Cover**: 800x450px (16:9 ratio)

### Tips for Best Results
- Use high-quality images
- Optimize images before uploading (keep file size under 2MB)
- Use relevant, clear photos
- Ensure images are properly cropped
- Test on both light and dark themes

## Saving Changes

### Auto-Save
Currently, changes are NOT auto-saved. You must click the "Save Changes" button.

### Confirmation
After clicking "Save Changes", you'll see:
- A "Saving..." indicator while the data is being saved
- A success message when completed
- An error message if something went wrong

### Data Persistence
All changes are saved to Google Sheets via the Google Apps Script backend. The data persists across sessions and browser refreshes.

## Accessing the Editors

### For Admins & Editors
1. Log in to your account
2. Click your profile icon in the top-right corner
3. Select "Admin Dashboard"
4. Choose the section you want to edit

### For Chapter Heads
1. Log in with your chapter head credentials
2. You'll automatically be taken to your chapter editor
3. Alternatively, navigate to your chapter page and click "Edit Chapter"

## Security & Permissions

- All editing functions are protected by role-based authentication
- Users can only access editors appropriate to their role
- Chapter Heads can ONLY edit their assigned chapter
- Session tokens expire after 24 hours for security
- All changes are logged with user information

## Troubleshooting

### Images not uploading?
- Check file size (should be under 5MB)
- Ensure the file is a supported image format
- Try using a URL instead of uploading

### Changes not saving?
- Check your internet connection
- Ensure you're still logged in (sessions expire after 24 hours)
- Try refreshing the page and logging in again

### Can't see edit buttons?
- Verify you're logged in
- Check that your account has the correct role/permissions
- Contact an administrator to verify your account settings

### Editor not loading?
- Clear your browser cache
- Try a different browser
- Check browser console for errors

## Backend Integration

### Google Apps Script Setup
The editors integrate with Google Apps Script to save data to Google Sheets. Ensure:
- The GAS Web App is deployed and accessible
- The correct GAS URL is set in `AuthContext.tsx`
- The spreadsheet has the necessary sheets for storing data

### Required Sheets
- **Users** - User authentication data
- **Sessions** - Active session tokens
- **Pillars** - Pillar content (optional, can store in code)
- **Partners** - Partner organizations (optional)
- **Stories** - Success stories (optional)
- **Founders** - Founder profiles (optional)
- **Chapters** - Chapter data (optional)

*Note: Content can be stored either in Google Sheets or directly in the code. The current implementation uses in-code storage with the option to integrate with Sheets.*

## Support

For technical issues or questions:
- Contact the website administrator
- Check the GitHub repository for updates
- Review the code documentation in the project files

---

**Last Updated**: February 2026
**Version**: 1.0
