# Quick Start Guide - Dyesabel PH Authentication

## 🚀 Quick Setup (5 minutes)

### 1️⃣ Create Google Sheet
1. Go to sheets.google.com
2. Create new spreadsheet: "Dyesabel PH Authentication"
3. Copy the ID from URL: `https://docs.google.com/spreadsheets/d/[THIS-IS-THE-ID]/edit`

### 2️⃣ Deploy Google Apps Script
1. Go to script.google.com
2. New Project → Paste code from `gas-backend/Code.gs`
3. Line 13: Replace `YOUR_SPREADSHEET_ID_HERE` with your Sheet ID
4. Select `initializeSystem` function → Run (authorize when prompted)
5. Deploy → New deployment → Web app:
   - Execute as: Me
   - Who has access: Anyone
   - Deploy → Copy the Web App URL

### 3️⃣ Configure React App
1. Open `contexts/AuthContext.tsx`
2. Line 21: Replace `YOUR_GAS_WEB_APP_URL_HERE` with your Web App URL
3. Save file

### 4️⃣ Run Application
```bash
npm install
npm run dev
```

### 5️⃣ Test Login
- Admin: `admin` / `admin123`
- Chapter Head: `chapter1` / `chapter123`
- Editor: `editor` / `editor123`

## 📊 What Each Role Can Do

| Role         | User Mgmt | All Chapters | Own Chapter | Landing Page | Settings |
|--------------|-----------|--------------|-------------|--------------|----------|
| Admin        | ✅        | ✅           | ✅          | ✅           | ✅       |
| Chapter Head | ❌        | ❌           | ✅          | ❌           | ❌       |
| Editor       | ❌        | ❌           | ❌          | ✅           | ❌       |

## 🔐 Default Credentials

**⚠️ CHANGE THESE IN PRODUCTION!**

```
Admin Account:
  Username: admin
  Password: admin123
  
Chapter Head Account:
  Username: chapter1
  Password: chapter123
  Chapter: quezon-city
  
Editor Account:
  Username: editor
  Password: editor123
```

## ➕ Adding New Users

### Option 1: Via Google Apps Script
1. Open your GAS project
2. Select function `addUser`
3. Edit the function call:
```javascript
addUser('username', 'password', 'email@example.com', 'role', 'chapterId');
```
4. Click Run

### Option 2: Directly in Google Sheets
1. Open your Google Sheet
2. Go to "Users" tab
3. Add new row:
   - A: username
   - B: password
   - C: email
   - D: role (admin/chapter_head/editor)
   - E: [auto-generated UUID]
   - F: chapterId (for chapter heads only)

## 🔧 Configuration Files

### Must Configure:
1. `contexts/AuthContext.tsx` - Line 21 (GAS_API_URL)
2. `gas-backend/Code.gs` - Line 13 (SPREADSHEET_ID)

## 📁 Important Files

```
Project/
├── contexts/AuthContext.tsx        ← Auth logic
├── components/
│   ├── LoginModal.tsx             ← Login UI
│   ├── AdminDashboard.tsx         ← Admin interface
│   ├── ChapterEditor.tsx          ← Chapter head interface
│   └── LandingPageEditor.tsx      ← Editor interface
├── gas-backend/Code.gs            ← Backend API
└── AUTH_SETUP_GUIDE.md            ← Full documentation
```

## 🐛 Quick Troubleshooting

**Login not working?**
- Check GAS_API_URL in `AuthContext.tsx`
- Verify GAS Web App is deployed
- Check browser console for errors

**"Invalid credentials"?**
- Verify user exists in Google Sheets
- Check username is exact match
- Run `initializeSystem()` if Users sheet is empty

**Session expires immediately?**
- Check `SESSION_TIMEOUT` in Code.gs
- Default is 24 hours (86400000 ms)

## 🌐 Deployment Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Implement password hashing
- [ ] Review user permissions
- [ ] Enable HTTPS
- [ ] Test all roles thoroughly
- [ ] Set up error monitoring
- [ ] Configure CORS if needed
- [ ] Review security settings
- [ ] Set up backup for Google Sheets
- [ ] Document custom changes

## 📞 Need Help?

1. Check `AUTH_SETUP_GUIDE.md` for detailed docs
2. Review GAS execution logs
3. Check browser console errors
4. Verify Google Sheets structure

## 🎯 Next Steps

After basic setup:
1. Customize dashboard interfaces
2. Connect to real data sources
3. Implement actual save functionality
4. Add password reset feature
5. Set up email notifications
6. Add audit logging
7. Implement 2FA (optional)

---

**Ready to start?** Follow steps 1-5 above! 🚀
