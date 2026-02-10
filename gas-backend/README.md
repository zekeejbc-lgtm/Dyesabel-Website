# Google Apps Script Backend

This folder contains the backend authentication code for Dyesabel PH using Google Apps Script.

## What is Google Apps Script?

Google Apps Script (GAS) is a cloud-based scripting platform that lets you integrate with and automate tasks across Google products (Sheets, Docs, Drive, etc.). It's essentially JavaScript that runs on Google's servers.

## Why Use GAS for Authentication?

- **Free to use** - No hosting costs
- **Serverless** - No server management
- **Integrated with Google Sheets** - Easy database
- **HTTPS by default** - Secure communication
- **Fast deployment** - No complex setup
- **Scalable** - Handles traffic automatically

## File Structure

```
gas-backend/
└── Code.gs          # Main backend script
```

## Features

This GAS backend provides:

1. **User Authentication**
   - Login with username/password
   - Secure session management
   - Role-based access control

2. **Session Management**
   - 24-hour session timeout
   - Automatic cleanup of expired sessions
   - Session validation

3. **User Management**
   - Store users in Google Sheets
   - Three roles: Admin, Chapter Head, Editor
   - Easy user addition via scripts

4. **Security**
   - Server-side validation
   - Session tokens
   - CORS support

## API Endpoints

The script exposes a single Web App URL that handles different actions:

### POST Endpoints

**Login**
```javascript
POST [WEB_APP_URL]
{
  "action": "login",
  "username": "admin",
  "password": "admin123"
}
```

**Logout**
```javascript
POST [WEB_APP_URL]
{
  "action": "logout",
  "sessionToken": "token-here"
}
```

**Validate Session**
```javascript
POST [WEB_APP_URL]
{
  "action": "validateSession",
  "sessionToken": "token-here"
}
```

## Google Sheets Structure

### Users Sheet
| Column | Field       | Description                        |
|--------|-------------|------------------------------------|
| A      | Username    | Login username (unique)            |
| B      | Password    | User password (plain text)         |
| C      | Email       | User email address                 |
| D      | Role        | admin/chapter_head/editor          |
| E      | User ID     | Auto-generated UUID                |
| F      | Chapter ID  | For chapter heads only             |

### Sessions Sheet
| Column | Field        | Description                       |
|--------|--------------|-----------------------------------|
| A      | Session Token| Unique session identifier         |
| B      | User Data    | JSON string of user object        |
| C      | Created At   | ISO timestamp of creation         |
| D      | Expires At   | ISO timestamp of expiration       |

## Setup Instructions

### 1. Create Google Apps Script Project

1. Go to https://script.google.com
2. Click "New Project"
3. Name it "Dyesabel PH Auth API"

### 2. Copy the Code

1. Open `Code.gs` in this folder
2. Copy all content
3. Paste into the GAS editor

### 3. Configure Spreadsheet ID

```javascript
// Line 13 - Update this with your Google Sheets ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

To get your Spreadsheet ID:
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
3. Copy the ID between `/d/` and `/edit`

### 4. Initialize the System

1. In GAS editor, select function `initializeSystem` from dropdown
2. Click Run ▶️
3. Authorize the script when prompted
4. Check "Execution log" to confirm success

This creates:
- Users sheet with default users
- Sessions sheet for session storage

### 5. Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Click gear icon → Select "Web app"
3. Configure:
   - **Description**: "Dyesabel PH Auth API v1"
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click "Deploy"
5. Copy the Web App URL
6. Update `contexts/AuthContext.tsx` with this URL

## Available Functions

### Main Handler Functions
- `doPost(e)` - Handles all POST requests
- `doGet(e)` - Returns API status

### Authentication Functions
- `handleLogin(username, password)` - Authenticates user
- `handleLogout(sessionToken)` - Logs out user
- `handleValidateSession(sessionToken)` - Validates session

### Session Management
- `storeSession(sessionToken, user)` - Creates new session
- `getSession(sessionToken)` - Retrieves session data
- `isSessionExpired(session)` - Checks if session is valid
- `cleanupExpiredSessions()` - Removes old sessions

### Admin Functions (Run from Script Editor)
- `initializeSystem()` - Sets up sheets and default users
- `addUser(username, password, email, role, chapterId)` - Adds new user
- `listUsers()` - Lists all users in logs

## Testing the Backend

### Test in Script Editor

1. Select function `testLogin` (you'll need to create this)
2. Add this test function:

```javascript
function testLogin() {
  var result = handleLogin('admin', 'admin123');
  Logger.log(result.getContent());
}
```

3. Click Run and check logs

### Test via HTTP

Use a tool like Postman or curl:

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"admin","password":"admin123"}'
```

## Security Considerations

### Current Implementation

⚠️ **For Development Only:**
- Passwords stored in plain text
- Simple session tokens
- No rate limiting

### Production Recommendations

1. **Password Security:**
   ```javascript
   // Add password hashing
   function hashPassword(password) {
     return Utilities.computeDigest(
       Utilities.DigestAlgorithm.SHA_256,
       password + SALT
     );
   }
   ```

2. **Rate Limiting:**
   - Track login attempts
   - Implement cooldown periods
   - Block after X failed attempts

3. **Session Security:**
   - Use stronger token generation
   - Implement refresh tokens
   - Add IP validation

4. **Input Validation:**
   - Sanitize all inputs
   - Validate email formats
   - Check for SQL injection patterns

## Maintenance

### Regular Tasks

1. **Clean Up Sessions:**
   - Runs automatically on each login
   - Manual: Run `cleanupExpiredSessions()`

2. **Review Users:**
   - Check Google Sheets regularly
   - Remove inactive users
   - Update permissions

3. **Monitor Logs:**
   - View execution logs in GAS
   - Check for errors
   - Monitor usage patterns

### Updating the Code

1. Make changes in GAS editor
2. Save the script
3. Create new deployment:
   - Deploy → Manage deployments
   - Click Edit (pencil icon)
   - New version
   - Deploy

## Troubleshooting

### Script won't run
- Check authorization status
- Verify SPREADSHEET_ID is correct
- Check execution logs for errors

### Users not found
- Run `initializeSystem()` again
- Check Users sheet exists
- Verify sheet name is "Users"

### Sessions not working
- Check Sessions sheet exists
- Verify SESSION_TIMEOUT value
- Run `cleanupExpiredSessions()`

### CORS errors
- GAS handles CORS automatically
- Verify Web App access is "Anyone"
- Check deployment is active

## Extending the Backend

### Adding New Features

1. **Email Notifications:**
```javascript
function sendWelcomeEmail(email, username) {
  MailApp.sendEmail({
    to: email,
    subject: 'Welcome to Dyesabel PH',
    body: `Hello ${username}!`
  });
}
```

2. **Password Reset:**
```javascript
function handlePasswordReset(email) {
  // Generate reset token
  // Send email with reset link
  // Store token with expiration
}
```

3. **Audit Logging:**
```javascript
function logUserAction(userId, action) {
  var sheet = getAuditSheet();
  sheet.appendRow([
    new Date(),
    userId,
    action
  ]);
}
```

## Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Spreadsheet Service](https://developers.google.com/apps-script/reference/spreadsheet)
- [Web Apps Guide](https://developers.google.com/apps-script/guides/web)

## Support

For issues:
1. Check execution logs in GAS
2. Review this README
3. Check main `AUTH_SETUP_GUIDE.md`
4. Verify Google Sheets structure
