# Dyesabel PH Authentication System - Setup Guide

This guide will help you set up the authentication system with Google Apps Script (GAS) backend and role-based access control.

## Features

- **Three User Roles:**
  - **Admin**: Full access to everything (users, chapters, landing page, settings)
  - **Chapter Heads**: Can edit only their assigned chapter pages
  - **Editor**: Can edit only the main landing page

- **Secure Authentication** using Google Apps Script
- **Session Management** with 24-hour timeout
- **Role-Based Dashboards** with different interfaces for each role
- **Persistent User Data** stored in Google Sheets

## Architecture

```
┌─────────────────┐
│   React App     │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTP Requests
         │
┌────────▼────────┐
│  Google Apps    │
│    Script       │
│   (Backend)     │
└────────┬────────┘
         │
         │
┌────────▼────────┐
│  Google Sheets  │
│   (Database)    │
│  - Users Sheet  │
│  - Sessions     │
└─────────────────┘
```

## Setup Instructions

### Step 1: Set Up Google Sheets Database

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Dyesabel PH Authentication"
4. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
5. Save this ID - you'll need it in the next step

### Step 2: Deploy Google Apps Script Backend

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Name your project "Dyesabel PH Auth API"
4. Copy the entire content from `gas-backend/Code.gs` into the script editor
5. **Update the Configuration:**
   - Find line 13: `const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';`
   - Replace `'YOUR_SPREADSHEET_ID_HERE'` with your actual Spreadsheet ID from Step 1
6. **Initialize the System:**
   - In the script editor, select the function `initializeSystem` from the dropdown
   - Click "Run" (you'll need to authorize the script)
   - Check the "Execution log" to confirm it created the Users and Sessions sheets
7. **Deploy as Web App:**
   - Click "Deploy" > "New deployment"
   - Click the gear icon and select "Web app"
   - Configure:
     - Description: "Dyesabel PH Auth API v1"
     - Execute as: "Me"
     - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the Web App URL (it will look like: `https://script.google.com/macros/s/[SCRIPT_ID]/exec`)
   - **IMPORTANT:** Save this URL - you'll need it in Step 3

### Step 3: Configure the React App

1. Open `contexts/AuthContext.tsx`
2. Find line 21: `const GAS_API_URL = 'YOUR_GAS_WEB_APP_URL_HERE';`
3. Replace `'YOUR_GAS_WEB_APP_URL_HERE'` with the Web App URL from Step 2

### Step 4: Install Dependencies and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Default Users

The system comes with three demo users:

| Username  | Password    | Role          | Access                           |
|-----------|-------------|---------------|----------------------------------|
| admin     | admin123    | Admin         | Full access to everything        |
| chapter1  | chapter123  | Chapter Head  | Can edit Quezon City chapter     |
| editor    | editor123   | Editor        | Can edit landing page only       |

**⚠️ IMPORTANT:** Change these passwords in production!

## Managing Users

### Adding a New User (via Google Apps Script)

1. Go to your Google Apps Script project
2. In the script editor, select the function `addUser` from the dropdown
3. Modify the function call with your user details:
   ```javascript
   addUser('newuser', 'password123', 'user@email.com', 'chapter_head', 'manila');
   ```
4. Click "Run"

### User Roles Explained

- **admin**: Use for administrators who need full control
- **chapter_head**: Use for chapter leaders (requires `chapterId` parameter)
- **editor**: Use for content editors who only manage the landing page

### Editing Users Manually in Google Sheets

1. Go to your Google Sheets
2. Open the "Users" sheet
3. Edit user information directly:
   - Column A: Username
   - Column B: Password (plain text - consider hashing in production)
   - Column C: Email
   - Column D: Role (admin | chapter_head | editor)
   - Column E: User ID (auto-generated UUID)
   - Column F: Chapter ID (for chapter heads only)

## Dashboard Features

### Admin Dashboard
- User Management: Add, edit, delete users
- Chapter Content: Edit all chapters
- Landing Page: Edit main page content
- Settings: Configure site settings

### Chapter Editor (Chapter Heads)
- Edit chapter title and description
- Upload/change chapter image
- Manage chapter activities
- Update member count

### Landing Page Editor (Editors)
- Edit hero section (title, subtitle, button text)
- Update slogan
- Modify about section
- Change featured image

## Security Considerations

### Production Recommendations:

1. **Password Hashing:**
   - Current implementation stores passwords in plain text
   - Implement password hashing (bcrypt) for production
   - Modify the GAS code to hash passwords before storage

2. **HTTPS Only:**
   - Always use HTTPS for your deployed site
   - Google Apps Script automatically uses HTTPS

3. **Session Security:**
   - Current session timeout: 24 hours
   - Adjust `SESSION_TIMEOUT` in Code.gs if needed
   - Sessions are stored server-side in Google Sheets

4. **Access Control:**
   - GAS Web App is set to "Anyone" for public access
   - Consider implementing IP whitelisting if needed
   - Add rate limiting for production

5. **Regular Cleanup:**
   - Expired sessions are cleaned up automatically
   - Review user access regularly
   - Remove inactive users

## Testing the Authentication

### Test Flow:

1. **Login as Admin:**
   - Username: `admin`
   - Password: `admin123`
   - Should see Admin Dashboard with all features

2. **Login as Chapter Head:**
   - Username: `chapter1`
   - Password: `chapter123`
   - Should see Chapter Editor for Quezon City chapter only

3. **Login as Editor:**
   - Username: `editor`
   - Password: `editor123`
   - Should see Landing Page Editor only

## Troubleshooting

### "Network error" when logging in:
- Check that you've updated `GAS_API_URL` in `AuthContext.tsx`
- Verify the GAS Web App is deployed and URL is correct
- Check browser console for CORS errors

### "Invalid credentials" with correct password:
- Check Google Sheets Users sheet for user data
- Verify username matches exactly (case-sensitive)
- Run `initializeSystem()` again if Users sheet is empty

### Session expires immediately:
- Check `SESSION_TIMEOUT` constant in Code.gs
- Verify system time is correct
- Check Sessions sheet in Google Sheets for stored sessions

### GAS script not running:
- Reauthorize the script in Google Apps Script
- Check execution logs for errors
- Verify `SPREADSHEET_ID` is correct

## API Reference

### GAS Backend Endpoints

The backend supports these actions via POST requests:

#### Login
```json
{
  "action": "login",
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@dyesabel.org",
    "role": "admin",
    "chapterId": null
  },
  "sessionToken": "uuid_timestamp"
}
```

#### Logout
```json
{
  "action": "logout",
  "sessionToken": "uuid_timestamp"
}
```

#### Validate Session
```json
{
  "action": "validateSession",
  "sessionToken": "uuid_timestamp"
}
```

## Next Steps

1. **Customize the Dashboards:**
   - Modify `AdminDashboard.tsx`, `ChapterEditor.tsx`, `LandingPageEditor.tsx`
   - Connect to your actual data storage
   - Implement save functionality

2. **Add More Features:**
   - Password reset functionality
   - Email verification
   - Two-factor authentication
   - Audit logs

3. **Production Deployment:**
   - Build for production: `npm run build`
   - Deploy to hosting service (Vercel, Netlify, etc.)
   - Set up environment variables
   - Implement password hashing

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Google Apps Script execution logs
3. Check browser console for frontend errors
4. Verify Google Sheets data structure

## File Structure

```
Dyesabel-PH-Web-main/
├── contexts/
│   └── AuthContext.tsx          # Authentication context and logic
├── components/
│   ├── LoginModal.tsx           # Login interface
│   ├── AdminDashboard.tsx       # Admin dashboard
│   ├── ChapterEditor.tsx        # Chapter head dashboard
│   └── LandingPageEditor.tsx    # Editor dashboard
├── gas-backend/
│   └── Code.gs                  # Google Apps Script backend
└── App.tsx                      # Main app with auth integration
```

## License

This authentication system is part of the Dyesabel PH project.
