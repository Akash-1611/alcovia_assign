# 🔧 Troubleshooting Guide

Common issues and their solutions.

---

## Frontend Issues

### Error: Cannot run `npm run web`

**Possible causes and solutions:**

#### Solution 1: Install Dependencies First
```bash
cd frontend
npm install
```

Wait for all packages to install, then try:
```bash
npm run web
```

#### Solution 2: Clear Cache
```bash
cd frontend
rm -rf node_modules
rm -rf .expo
rm package-lock.json
npm install
npm run web
```

#### Solution 3: Install Expo CLI Globally
```bash
npm install -g expo-cli
```

Then try:
```bash
npx expo start --web
```

#### Solution 4: Check Node Version
Expo requires Node.js 18+

```bash
node --version
```

If below 18, update Node.js from [nodejs.org](https://nodejs.org)

#### Solution 5: Port Already in Use
If port 19006 is busy:
```bash
# Kill process on port 19006
# Windows:
netstat -ano | findstr :19006
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:19006 | xargs kill -9
```

Then try again:
```bash
npm run web
```

---

## Backend Issues

### Error: Cannot run `npm run dev`

#### Solution 1: Install Dependencies
```bash
cd backend
npm install
npm run dev
```

#### Solution 2: Missing .env File
```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Supabase credentials.

#### Solution 3: Port 3000 Already in Use
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

---

## Database Issues

### Error: Cannot connect to Supabase

#### Check 1: Credentials
Verify in `.env`:
- `SUPABASE_URL` is correct (from Supabase Settings → API)
- `SUPABASE_ANON_KEY` is correct
- `SUPABASE_SERVICE_KEY` is correct

#### Check 2: Database Tables
1. Go to Supabase → SQL Editor
2. Run: `SELECT * FROM students;`
3. If error, re-run `schema.sql`

---

## Specific Error Messages

### "Module not found: Can't resolve 'react-native-web'"

**Solution:**
```bash
cd frontend
npm install react-native-web react-dom
npm run web
```

### "Uncaught Error: Objects are not valid as a React child"

**Solution:** Check that API_URL in `App.tsx` is correct:
```typescript
const API_URL = 'http://localhost:3000/api';
```

### "CORS Error" in browser console

**Solution:** 
1. Check backend `.env` has `FRONTEND_URL=http://localhost:19006`
2. Restart backend: `npm run dev`

### "Cannot find module 'typescript'"

**Solution:**
```bash
cd backend  # or frontend
npm install --save-dev typescript
```

---

## Quick Fixes

### Complete Reset (Frontend)
```bash
cd frontend
rm -rf node_modules .expo package-lock.json
npm install
npm run web
```

### Complete Reset (Backend)
```bash
cd backend
rm -rf node_modules dist package-lock.json
npm install
npm run dev
```

### Complete Reset (Both)
```bash
# Backend
cd backend
rm -rf node_modules dist package-lock.json
npm install

# Frontend
cd ../frontend
rm -rf node_modules .expo package-lock.json
npm install

# Start backend (terminal 1)
cd ../backend
npm run dev

# Start frontend (terminal 2)
cd ../frontend
npm run web
```

---

## Still Having Issues?

### Check Logs

**Backend logs:**
- Terminal where you ran `npm run dev`
- Look for error messages

**Frontend logs:**
- Browser console (F12 → Console tab)
- Terminal where you ran `npm run web`

**Database logs:**
- Supabase → Logs section

### Common Error Patterns

**"EADDRINUSE"** → Port already in use (see port solutions above)

**"MODULE_NOT_FOUND"** → Run `npm install`

**"ENOENT"** → File not found, check you're in correct directory

**TypeScript errors** → Run `npm install --save-dev typescript ts-node`

---

## Need More Help?

1. Copy the exact error message
2. Check which file/line it's coming from
3. Search for that error in this guide
4. If not found, check the relevant documentation:
   - Backend issues → [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
   - Frontend issues → Expo docs
   - Database issues → Supabase docs

