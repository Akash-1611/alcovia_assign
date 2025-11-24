# ✅ Deployment Checklist

Use this checklist to deploy the Alcovia Intervention Engine to production.

---

## Pre-Deployment

### Local Testing
- [ ] Backend runs locally without errors (`npm run dev`)
- [ ] Frontend loads in browser
- [ ] Successful check-in works (score: 8, time: 70)
- [ ] Failed check-in triggers lock (score: 4, time: 30)
- [ ] Database tables exist in Supabase
- [ ] Demo student exists in database

---

## 1. Database Deployment (Supabase)

**Estimated Time**: 5 minutes

- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Project name: `alcovia-intervention`
- [ ] Choose region (closest to users)
- [ ] Save database password securely
- [ ] Wait for project initialization (~2 min)
- [ ] Open SQL Editor
- [ ] Copy entire `backend/src/database/schema.sql`
- [ ] Paste and execute
- [ ] Verify tables created: `students`, `daily_logs`, `interventions`
- [ ] Verify demo student exists (query: `SELECT * FROM students;`)
- [ ] Go to Settings → API
- [ ] Copy and save:
  - [ ] Project URL
  - [ ] `anon` (public) key
  - [ ] `service_role` key

**Deliverable**: Supabase credentials ready

---

## 2. Backend Deployment (Railway)

**Estimated Time**: 10 minutes

### 2.1 Prepare Code
- [ ] Push backend code to GitHub repository
- [ ] Repository is public or Railway has access
- [ ] `.env` is in `.gitignore` (don't commit secrets!)
- [ ] `railway.json` exists in backend folder

### 2.2 Deploy to Railway
- [ ] Go to [railway.app](https://railway.app)
- [ ] Sign up/login with GitHub
- [ ] Click "New Project"
- [ ] Choose "Deploy from GitHub repo"
- [ ] Select your backend repository
- [ ] Railway detects Node.js automatically
- [ ] Click "Deploy"

### 2.3 Configure Environment Variables
In Railway project → Variables tab:

- [ ] `PORT` = `3000`
- [ ] `NODE_ENV` = `production`
- [ ] `SUPABASE_URL` = (from Supabase Step 1)
- [ ] `SUPABASE_ANON_KEY` = (from Supabase Step 1)
- [ ] `SUPABASE_SERVICE_KEY` = (from Supabase Step 1)
- [ ] `N8N_WEBHOOK_URL` = (placeholder for now, will update after Step 3)
- [ ] `FRONTEND_URL` = (placeholder for now, will update after Step 4)

### 2.4 Generate Domain
- [ ] Go to Settings → Networking
- [ ] Click "Generate Domain"
- [ ] Copy domain: `https://your-app.up.railway.app`
- [ ] Test health endpoint: `https://your-app.up.railway.app/api/health`
- [ ] Should return: `{"status":"ok",...}`

**Deliverable**: Backend URL working

---

## 3. n8n Workflow Deployment

**Estimated Time**: 10 minutes

### 3.1 Setup n8n
- [ ] Go to [n8n.cloud](https://n8n.cloud)
- [ ] Sign up (free tier)
- [ ] Wait for instance initialization
- [ ] Click "Workflows" → "Add Workflow"

### 3.2 Import Workflow
- [ ] Click "..." menu (top-right)
- [ ] Select "Import from File"
- [ ] Upload `n8n-workflow.json` from project
- [ ] Workflow opens with 6 nodes

### 3.3 Configure Nodes

#### Node 1: Webhook
- [ ] Click "Webhook - Student Failed" node
- [ ] Click "Listen for Test Event"
- [ ] Copy **Production URL** (looks like: `https://your-n8n.app.n8n.cloud/webhook/student-intervention`)
- [ ] Save this URL for backend config

#### Node 2: Send Email to Mentor
- [ ] Click node
- [ ] Click "Create New Credential"
- [ ] Choose Gmail OAuth2
- [ ] Click "Connect my account"
- [ ] Follow Google OAuth flow
- [ ] Grant permissions
- [ ] Update `toEmail` field to your mentor email (use your own for testing)

#### Node 3: Wait for Mentor Approval
- [ ] Click node
- [ ] Verify settings:
  - Resume: "form"
  - Approval Mode: "manual"
- [ ] No changes needed (pre-configured)

#### Node 4: Assign Intervention
- [ ] Click "Assign Intervention (Call Backend)" node
- [ ] Update URL to your Railway backend:
  ```
  https://your-app.up.railway.app/api/assign-intervention
  ```
- [ ] Verify body parameters are set

#### Node 5: Check API Response
- [ ] No changes needed (pre-configured)

#### Node 6: Notify Student
- [ ] Click "Notify Student (Success)" node
- [ ] Select same Gmail credential from Node 2
- [ ] No other changes needed

### 3.4 Activate Workflow
- [ ] Click toggle switch (top-right) to "Active"
- [ ] Status should show green "Active"

### 3.5 Update Backend
- [ ] Go back to Railway
- [ ] Update `N8N_WEBHOOK_URL` variable with webhook URL from Step 3.3
- [ ] Railway will auto-redeploy

**Deliverable**: n8n workflow active and connected

---

## 4. Frontend Deployment (Vercel)

**Estimated Time**: 10 minutes

### 4.1 Update Configuration
- [ ] Open `frontend/App.tsx`
- [ ] Line 11: Update `API_URL`:
  ```typescript
  const API_URL = 'https://your-app.up.railway.app/api';
  ```
- [ ] Line 12: Update `SOCKET_URL`:
  ```typescript
  const SOCKET_URL = 'https://your-app.up.railway.app';
  ```
- [ ] Save file
- [ ] Commit changes to git

### 4.2 Push to GitHub
- [ ] Create new repository: `alcovia-frontend`
- [ ] Make it public
- [ ] Push code:
  ```bash
  cd frontend
  git init
  git add .
  git commit -m "Initial frontend"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/alcovia-frontend.git
  git push -u origin main
  ```

### 4.3 Deploy to Vercel
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up/login with GitHub
- [ ] Click "New Project"
- [ ] Import your `alcovia-frontend` repository
- [ ] Configure build settings:
  - Framework Preset: **Other**
  - Build Command: `npm run build:web`
  - Output Directory: `web-build`
  - Install Command: `npm install`
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for build

### 4.4 Get Frontend URL
- [ ] Deployment completes
- [ ] Copy URL: `https://your-app.vercel.app`
- [ ] Open in browser
- [ ] Verify app loads

### 4.5 Update Backend CORS
- [ ] Go back to Railway
- [ ] Update `FRONTEND_URL` variable:
  ```
  FRONTEND_URL=https://your-app.vercel.app
  ```
- [ ] Railway will auto-redeploy
- [ ] Wait 1 minute for redeploy

**Deliverable**: Frontend live and connected to backend

---

## 5. End-to-End Testing

**Estimated Time**: 10 minutes

### Test 1: Normal Flow
- [ ] Open frontend URL
- [ ] Click "Start Focus Session"
- [ ] Wait 2 minutes (or lower threshold for testing)
- [ ] Click "Stop Session"
- [ ] Enter quiz score: `8`
- [ ] Click "Submit Daily Check-in"
- [ ] ✅ Should show: "Great job! You are on track."

### Test 2: Intervention Flow
- [ ] Refresh page
- [ ] Start timer for 1 minute
- [ ] Stop timer
- [ ] Enter quiz score: `4`
- [ ] Click "Submit Daily Check-in"
- [ ] 🔒 App should lock immediately
- [ ] Check mentor email (within 30 seconds)
- [ ] Email should arrive with student details
- [ ] Click "Review & Assign Task" in email
- [ ] Enter task: "Test remedial task"
- [ ] Submit form
- [ ] Go back to app (don't refresh!)
- [ ] 🔓 App should unlock instantly (WebSocket magic!)
- [ ] Should show remedial task
- [ ] Click "Mark as Complete"
- [ ] ✅ Should return to normal state

### Test 3: Tab Detection (Bonus #1)
- [ ] Start focus timer
- [ ] Switch to another browser tab
- [ ] Return to app
- [ ] ⚠️ Warning should appear
- [ ] Tab switch count incremented

### Test 4: WebSocket (Bonus #2)
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Filter by "WS" (WebSocket)
- [ ] Should see active WebSocket connection
- [ ] Trigger intervention
- [ ] Approve from mentor email
- [ ] Should see WebSocket message received
- [ ] App unlocks without refresh

---

## 6. Documentation

### 6.1 Update URLs in Documentation
- [ ] Update `SUBMISSION.md` with your actual URLs
- [ ] Update `README.md` if needed
- [ ] Commit changes

### 6.2 Create Video Demo (Optional but Recommended)
- [ ] Record 2-3 minute screen recording
- [ ] Show: Normal flow → Intervention flow → Tab detection → WebSocket unlock
- [ ] Upload to YouTube/Loom
- [ ] Add link to SUBMISSION.md

### 6.3 Final Checks
- [ ] All links in README work
- [ ] GitHub repositories are public
- [ ] No `.env` files committed
- [ ] All documentation files present

---

## 7. Submission

### 7.1 Prepare Submission Package
- [ ] Live frontend URL
- [ ] Live backend URL (health check endpoint)
- [ ] GitHub repository links (both frontend and backend)
- [ ] Optional: Video demo link
- [ ] `SUBMISSION.md` filled out completely

### 7.2 Submit to Alcovia
- [ ] Email/form submission with all links
- [ ] Include brief note about bonus features implemented
- [ ] Mention fail-safe mechanism design in README

---

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Check Railway logs for errors
- [ ] Check Vercel deployment logs
- [ ] Test from different devices/browsers
- [ ] Monitor Supabase usage (should be well under free tier)
- [ ] Check n8n execution history

### Common Issues & Fixes

**Backend 500 errors**:
- Check Railway logs
- Verify Supabase credentials
- Check environment variables

**Frontend can't connect**:
- Verify CORS: `FRONTEND_URL` in Railway matches Vercel URL
- Check API_URL in frontend code
- Look for errors in browser console

**n8n not triggering**:
- Verify workflow is "Active"
- Check Railway logs for webhook call
- Test webhook URL directly with curl

**WebSocket not connecting**:
- Check SOCKET_URL in frontend
- Verify Railway allows WebSocket (it does)
- Check browser console for connection errors

---

## Success Criteria

✅ **Core Functionality**:
- [ ] Backend API responds to health check
- [ ] Frontend loads without errors
- [ ] Successful check-in works end-to-end
- [ ] Failed check-in locks app
- [ ] n8n sends email to mentor
- [ ] Mentor can assign task
- [ ] Student receives task
- [ ] Task completion returns to normal state

✅ **Bonus Features**:
- [ ] Tab switching detected and logged
- [ ] WebSocket connection established
- [ ] Instant unlock without page refresh

✅ **Production Ready**:
- [ ] All services deployed and accessible
- [ ] HTTPS on all endpoints
- [ ] Error handling works
- [ ] Database constraints prevent bad data
- [ ] Logs available for debugging

---

## Estimated Total Time

| Phase | Time |
|-------|------|
| Database Setup | 5 min |
| Backend Deployment | 10 min |
| n8n Configuration | 10 min |
| Frontend Deployment | 10 min |
| Testing | 10 min |
| Documentation | 5 min |
| **Total** | **50 minutes** |

---

## Need Help?

**Stuck on deployment?**
- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed steps
- Review [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for local testing
- Use [TESTING_GUIDE.md](TESTING_GUIDE.md) for validation

**Everything deployed but not working?**
- Check Railway logs: Project → Deployments → View Logs
- Check Vercel logs: Project → Deployments → Function Logs
- Check n8n logs: Executions tab
- Verify all URLs are updated in code

---

## 🎉 You're Done!

Once all checkboxes are checked, your Alcovia Intervention Engine is **LIVE** and ready for submission!

**Final checklist before submitting**:
- [ ] Frontend URL works
- [ ] Backend health check returns OK
- [ ] Full intervention flow tested successfully
- [ ] Both bonus features working
- [ ] Documentation complete
- [ ] GitHub repos public
- [ ] Video demo recorded (optional)
- [ ] SUBMISSION.md filled out

**Go get that internship!** 🚀

