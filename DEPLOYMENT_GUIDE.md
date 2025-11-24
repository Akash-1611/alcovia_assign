# 🚀 Deployment Guide - Alcovia Intervention Engine

Follow these steps to deploy the entire system from scratch in under 30 minutes.

## Step 1: Supabase Database Setup (5 minutes)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `alcovia-intervention`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait ~2 minutes

### 1.2 Run Database Schema
1. In your project, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `backend/src/database/schema.sql`
4. Paste and click "Run"
5. You should see: "Success. No rows returned"

### 1.3 Get API Credentials
1. Go to **Settings** → **API** (left sidebar)
2. Copy these values (you'll need them later):
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc... (click "Reveal" first)
   ```

✅ **Checkpoint**: Your database is ready with tables created!

---

## Step 2: Backend Deployment on Railway (10 minutes)

### 2.1 Prepare Backend Code
1. Make sure you have a GitHub account
2. Create a new repository: `alcovia-backend`
3. Push the `backend/` folder contents to your repo:
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial backend setup"
   git remote add origin https://github.com/YOUR_USERNAME/alcovia-backend.git
   git push -u origin main
   ```

### 2.2 Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `alcovia-backend` repository
4. Click "Deploy"

### 2.3 Add Environment Variables
1. In Railway project, click "Variables" tab
2. Add these variables (use values from Supabase Step 1.3):
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_KEY=eyJhbGc...
   PORT=3000
   NODE_ENV=production
   N8N_WEBHOOK_URL=https://placeholder.com
   FRONTEND_URL=https://placeholder.com
   ```
   *(We'll update the placeholder URLs later)*

3. Click "Deploy" to redeploy with new variables

### 2.4 Get Backend URL
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy your URL: `https://your-app.up.railway.app`

✅ **Checkpoint**: Test backend health at `https://your-app.up.railway.app/api/health`

---

## Step 3: n8n Workflow Setup (10 minutes)

### 3.1 Create n8n Cloud Account
1. Go to [n8n.cloud](https://n8n.cloud) and sign up
2. Choose free tier (sufficient for this project)
3. Wait for your instance to initialize

### 3.2 Import Workflow
1. Click "Workflows" → "Add Workflow"
2. Click "..." menu → "Import from File"
3. Upload `n8n-workflow.json` from this project
4. Workflow will open with several nodes

### 3.3 Configure Gmail Node
1. Click on "Send Email to Mentor" node
2. Click "Create New Credential"
3. Follow OAuth2 flow to connect your Gmail
4. Update `toEmail` parameter to your mentor email (use your own for testing)
5. Repeat for "Notify Student (Success)" node (use same credential)

### 3.4 Configure HTTP Request Node
1. Click on "Assign Intervention (Call Backend)" node
2. Update URL to your Railway backend:
   ```
   https://your-app.up.railway.app/api/assign-intervention
   ```

### 3.5 Activate Webhook
1. Click on "Webhook - Student Failed" node
2. Click "Listen for Test Event"
3. Copy the **Production URL** (looks like: `https://your-instance.app.n8n.cloud/webhook/student-intervention`)

### 3.6 Activate Workflow
1. Click the toggle switch in top-right to "Active"
2. Workflow status should show "Active"

### 3.7 Update Backend with Webhook URL
1. Go back to Railway
2. Update `N8N_WEBHOOK_URL` variable with your webhook URL from 3.5
3. Redeploy backend

✅ **Checkpoint**: Your n8n workflow is live and connected!

---

## Step 4: Frontend Deployment on Vercel (5 minutes)

### 4.1 Update API Configuration
1. Open `frontend/App.tsx`
2. Update line 11:
   ```typescript
   const API_URL = 'https://your-app.up.railway.app/api';
   ```
3. Update line 12:
   ```typescript
   const SOCKET_URL = 'https://your-app.up.railway.app';
   ```

### 4.2 Push to GitHub
1. Create new repository: `alcovia-frontend`
2. Push frontend code:
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial frontend setup"
   git remote add origin https://github.com/YOUR_USERNAME/alcovia-frontend.git
   git push -u origin main
   ```

### 4.3 Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project"
3. Import your `alcovia-frontend` repository
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `web-build`
   - **Install Command**: `npm install`
5. Click "Deploy"
6. Wait 2-3 minutes for deployment

### 4.4 Get Frontend URL
1. Copy your deployment URL: `https://your-app.vercel.app`

### 4.5 Update Backend CORS
1. Go back to Railway
2. Update `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Redeploy

✅ **Checkpoint**: Your frontend is live!

---

## Step 5: Final Testing (5 minutes)

### 5.1 Test Normal Flow
1. Open your frontend URL: `https://your-app.vercel.app`
2. Start focus timer for 2 minutes (for testing)
3. Stop timer
4. Enter quiz score: 8
5. Click "Submit Daily Check-in"
6. Expected: "Great job! You are on track." ✅

### 5.2 Test Intervention Flow
1. Refresh the page
2. Start focus timer for 1 minute
3. Stop timer
4. Enter quiz score: 4
5. Click "Submit Daily Check-in"
6. Expected: App immediately locks 🔒
7. Check your email (mentor email)
8. You should receive intervention notification
9. Click "Review & Assign Task" in email
10. Fill in remedial task: "Review the material and retake the quiz"
11. Submit form
12. Expected: Student app unlocks instantly (WebSocket magic!) 🔓
13. You should see the remedial task
14. Click "Mark as Complete"
15. Expected: Return to normal state ✅

### 5.3 Test Tab Detection (Bonus #1)
1. Start focus timer
2. Switch to another browser tab
3. Return to the app
4. Expected: Warning message appears ⚠️
5. Submit check-in (will include tab switch count)

---

## 🎉 Deployment Complete!

Your system is now live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.up.railway.app`
- **Database**: Supabase (managed)
- **Automation**: n8n Cloud (active)

## 📝 Submit to Alcovia

When submitting your assignment, provide:
1. **Live App URL**: Your Vercel frontend URL
2. **API Documentation**: Link to deployed backend + `/api/health` endpoint
3. **GitHub Repositories**: Both frontend and backend repos (make them public)
4. **Video Demo**: Optional but recommended - record a 2-minute demo showing:
   - Normal flow (success)
   - Intervention flow (failure → lock → mentor → unlock)
   - Bonus features (tab detection + real-time WebSocket)
5. **README**: Include this deployment guide

## 🐛 Troubleshooting

### Backend not responding
- Check Railway logs: Project → "Deployments" → Click latest → "View Logs"
- Verify environment variables are set correctly
- Ensure Supabase database is accessible

### Frontend can't connect to backend
- Check CORS: Ensure `FRONTEND_URL` is set in Railway
- Verify `API_URL` in `App.tsx` matches Railway URL
- Check browser console for errors (F12)

### n8n webhook not triggering
- Ensure workflow is "Active" (toggle in top-right)
- Check webhook URL is correctly set in Railway `N8N_WEBHOOK_URL`
- View execution logs: n8n → "Executions" tab

### WebSocket not connecting
- Verify `SOCKET_URL` in `App.tsx` matches Railway URL
- Check Railway allows WebSocket connections (it does by default)
- Look for WebSocket errors in browser console

### Email not sending
- Verify Gmail OAuth2 is connected in n8n
- Check spam folder
- Try sending test email from n8n directly

---

## 💡 Pro Tips

1. **Custom Domain**: Add your own domain in Vercel for a more professional URL
2. **Environment Variables**: Never commit `.env` files to GitHub
3. **Monitoring**: Enable Railway metrics to track API performance
4. **Scaling**: Railway auto-scales, but monitor your Supabase usage
5. **Security**: In production, add proper authentication and rate limiting

---

## 🎓 What You've Built

- ✅ Full-stack TypeScript application
- ✅ Real-time WebSocket communication
- ✅ Human-in-the-loop automation workflow
- ✅ SQL database with proper schema design
- ✅ RESTful API with state management
- ✅ Production-ready deployment
- ✅ Bonus features: Tab detection + Live updates

**Total Time**: ~30 minutes (after practicing once)

You're ready to impress Alcovia! 🚀

