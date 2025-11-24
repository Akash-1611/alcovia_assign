# ⚡ Quick Start - 5 Minutes to Running

Get the Alcovia Intervention Engine running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (sign up free at supabase.com)

---

## Step 1: Database (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **SQL Editor**
3. Copy the entire contents of `backend/src/database/schema.sql`
4. Paste and click **Run**
5. Go to **Settings → API** and copy:
   - Project URL
   - `anon` key
   - `service_role` key

---

## Step 2: Backend (1 minute)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your Supabase credentials from Step 1:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

Start the backend:
```bash
npm run dev
```

✅ Backend running at http://localhost:3000

---

## Step 3: Frontend (1 minute)

**Open a new terminal:**

```bash
cd frontend
npm install
npm run web
```

✅ Frontend opens automatically in your browser at http://localhost:19006

---

## Step 4: Test It (1 minute)

### Test Success Flow:
1. Click "Start Focus Session"
2. Let it run for 2 minutes (or edit threshold to 1 minute for faster testing)
3. **IMPORTANT: Don't switch tabs during the timer!**
4. Click "Stop Session"
5. Enter quiz score: **8** (must be 8, 9, or 10 - NOT 7!)
6. Click "Submit Daily Check-in"
7. ✅ You should see: "Great job! You are on track."

### Test Intervention Flow:
1. Refresh the page
2. Start focus timer for 1 minute
3. Stop timer
4. Enter quiz score: **4** (below threshold)
5. Click "Submit Daily Check-in"
6. 🔒 App should lock immediately

### Test Tab Detection (Bonus):
1. Start focus timer
2. Switch to another tab
3. ❌ Timer should STOP immediately and show "Session Failed"
4. This will automatically trigger intervention when submitted

---

## Optional: n8n Setup (5 minutes)

To test the full mentor workflow:

1. Go to [n8n.cloud](https://n8n.cloud) and sign up (free)
2. Create new workflow → Import `n8n-workflow.json`
3. Configure Gmail node (connect your account)
4. Update HTTP Request node URL to `http://localhost:3000/api/assign-intervention`
   - For local testing, use [ngrok](https://ngrok.com): `ngrok http 3000`
5. Activate the workflow
6. Copy webhook URL and add to backend `.env`:
   ```env
   N8N_WEBHOOK_URL=https://your-n8n-url/webhook/student-intervention
   ```
7. Restart backend

Now the full flow works: fail check-in → email → mentor approves → app unlocks!

---

## Next Steps

- **Full Documentation**: See [README.md](README.md)
- **Deploy to Production**: Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Test Everything**: Use [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **API Reference**: Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## Troubleshooting

**Backend won't start:**
- Check Node.js version: `node --version` (need 18+)
- Verify Supabase credentials in `.env`

**Frontend won't load:**
```bash
cd frontend
rm -rf node_modules .expo
npm install
npm run web
```

**Can't connect to backend:**
- Make sure backend is running in another terminal
- Check http://localhost:3000/api/health in browser

---

**That's it! You're running.** 🎉

For deployment and production setup, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

