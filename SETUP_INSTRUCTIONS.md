# 🏁 Local Development Setup

Quick start guide for running the Alcovia Intervention Engine on your local machine.

## Prerequisites

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org))
- **npm**: Comes with Node.js
- **Git**: For version control
- **Supabase Account**: Free tier ([Sign up](https://supabase.com))
- **n8n Cloud Account**: Free tier ([Sign up](https://n8n.cloud))

## Quick Start (10 minutes)

### 1. Clone the Repository
```bash
# If you haven't already
cd Alcovia_assign
ls
# You should see: backend/ frontend/ README.md
```

### 2. Setup Database (Supabase)

#### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: `alcovia-local-dev`
4. Set a password
5. Choose region
6. Click "Create"

#### Run Schema
1. Open SQL Editor in Supabase
2. Copy contents from `backend/src/database/schema.sql`
3. Paste and click "Run"

#### Get Credentials
1. Settings → API
2. Copy:
   - Project URL
   - `anon` key
   - `service_role` key

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your favorite editor
nano .env
```

**Update `.env`:**
```env
PORT=3000
NODE_ENV=development

# Paste your Supabase credentials
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# For now, leave this empty (we'll update after n8n setup)
N8N_WEBHOOK_URL=

# Frontend URL for CORS
FRONTEND_URL=http://localhost:19006
```

**Start backend:**
```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║     🚀 ALCOVIA INTERVENTION ENGINE - BACKEND LIVE        ║
║     Server:     http://localhost:3000                    ║
╚═══════════════════════════════════════════════════════════╝
```

**Test it:** Open http://localhost:3000/api/health in your browser.

### 4. Setup n8n Workflow

1. Go to [n8n.cloud](https://n8n.cloud)
2. Create account (free tier)
3. Create new workflow
4. Import `n8n-workflow.json` from this project
5. Configure nodes:
   - **Webhook**: Copy the webhook URL
   - **Gmail**: Connect your Gmail account
   - **HTTP Request**: Update URL to `http://localhost:3000/api/assign-intervention`
     - ⚠️ **Important**: For local testing, you need to expose your local backend. Use:
       - [ngrok](https://ngrok.com): `ngrok http 3000`
       - [localtunnel](https://localtunnel.github.io/www/): `npx localtunnel --port 3000`
       - Then use the provided URL in n8n
6. Activate workflow
7. Copy webhook URL

**Update backend `.env`:**
```env
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/student-intervention
```

**Restart backend** (Ctrl+C then `npm run dev`)

### 5. Setup Frontend

Open a **new terminal window**:

```bash
cd frontend

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli

# Start Expo development server
npm run web
```

Expo will:
1. Build the app
2. Open browser automatically at http://localhost:19006
3. Show the Alcovia Focus Mode app

### 6. Test the System

#### Test 1: Success Flow
1. In the app, click "Start Focus Session"
2. Wait 2 minutes (or edit the code to lower threshold for testing)
3. Click "Stop Session"
4. Enter quiz score: `8`
5. Click "Submit Daily Check-in"
6. ✅ You should see: "Great job! You are on track."

#### Test 2: Intervention Flow
1. Refresh the page
2. Start focus timer for 1 minute
3. Stop timer
4. Enter quiz score: `4`
5. Click "Submit Daily Check-in"
6. 🔒 App should immediately lock
7. Check your email (the mentor email you configured in n8n)
8. Click the approval link in the email
9. Assign a task: "Review Chapter 3"
10. Submit
11. 🔓 App should unlock instantly (WebSocket!)
12. You should see the remedial task
13. Click "Mark as Complete"
14. ✅ Back to normal state

#### Test 3: Tab Detection (Web Only)
1. Start focus timer
2. Switch to another tab
3. Switch back
4. ⚠️ Warning should appear
5. Check the console: you'll see tab switch count incremented

#### Test 4: WebSocket Real-Time Updates
1. Keep the app open in browser
2. Trigger an intervention (low score)
3. Approve in n8n
4. 🎉 Watch the app unlock without refreshing!

## Project Structure

```
Alcovia_assign/
├── backend/
│   ├── src/
│   │   ├── config/          # Supabase configuration
│   │   ├── controllers/     # Business logic
│   │   ├── database/        # SQL schema
│   │   ├── routes/          # API endpoints
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Server entry + WebSocket
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                 # Your environment variables
├── frontend/
│   ├── App.tsx              # Main React Native app
│   ├── package.json
│   ├── app.json             # Expo configuration
│   └── tsconfig.json
├── n8n-workflow.json        # n8n automation workflow
├── README.md                # Main documentation
├── DEPLOYMENT_GUIDE.md      # Production deployment
└── SETUP_INSTRUCTIONS.md    # This file
```

## Development Workflow

### Making Changes

**Backend:**
1. Edit files in `backend/src/`
2. Server auto-restarts (thanks to `ts-node-dev`)
3. Check terminal for TypeScript errors

**Frontend:**
1. Edit `frontend/App.tsx`
2. Expo hot-reloads automatically
3. Check browser console for errors (F12)

**Database:**
1. Make schema changes in Supabase SQL Editor
2. Update `backend/src/database/schema.sql` for documentation

### Debugging

**Backend Logs:**
```bash
# Terminal where backend is running
# Look for console.log outputs
```

**Frontend Logs:**
```bash
# Browser console (F12)
# Or Expo DevTools
```

**Database:**
```bash
# Supabase → Table Editor
# View actual data
```

**n8n:**
```bash
# n8n → Executions tab
# See workflow run history
```

### Common Issues

#### Port already in use
```bash
# Kill process on port 3000
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Can't connect to Supabase
- Check internet connection
- Verify credentials in `.env`
- Check Supabase project status (dashboard)

#### Expo not starting
```bash
# Clear cache
cd frontend
rm -rf node_modules .expo
npm install
npm run web
```

#### WebSocket not connecting
- Ensure backend is running
- Check `SOCKET_URL` in `App.tsx` matches backend
- Look for CORS errors in console

## Testing Different States

### Force Student into "Locked" State
```sql
-- Run in Supabase SQL Editor
UPDATE students 
SET status = 'needs_intervention' 
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

### Force Student into "Remedial" State
```sql
-- First, create an intervention
INSERT INTO interventions (student_id, remedial_task, status)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'Test Task', 'assigned');

-- Update student status
UPDATE students 
SET status = 'remedial_assigned' 
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

### Reset to Normal State
```sql
UPDATE students 
SET status = 'on_track' 
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

## Performance Testing

### Test with Multiple Students
```sql
-- Create additional test students
INSERT INTO students (email, name, status) VALUES
('student1@test.com', 'Test Student 1', 'on_track'),
('student2@test.com', 'Test Student 2', 'on_track'),
('student3@test.com', 'Test Student 3', 'on_track');
```

### Test Concurrent Requests
Use [Postman](https://www.postman.com/) or curl:
```bash
# Success request
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "quiz_score": 8,
    "focus_minutes": 70
  }'

# Failure request
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "quiz_score": 4,
    "focus_minutes": 30,
    "cheating_detected": true,
    "tab_switches": 5
  }'
```

## Next Steps

1. ✅ Get local development working
2. 📖 Read the main [README.md](README.md) for architecture details
3. 🚀 Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) to deploy
4. 💡 Add your own features!

## Need Help?

- **Backend issues**: Check `backend/src/index.ts` and controller files
- **Frontend issues**: Check `frontend/App.tsx` and browser console
- **Database issues**: Check Supabase SQL Editor and logs
- **n8n issues**: Check Executions tab in n8n dashboard

## Tips for Success

1. **Keep terminals organized**: 
   - Terminal 1: Backend (`npm run dev`)
   - Terminal 2: Frontend (`npm run web`)
   - Terminal 3: Git commands

2. **Use browser DevTools**: 
   - Network tab: See API calls
   - Console tab: See logs and errors
   - Application tab: See WebSocket connection

3. **Test incrementally**: 
   - Test backend endpoints first (Postman/curl)
   - Then test frontend connection
   - Finally test full flow

4. **Watch for TypeScript errors**: 
   - Both backend and frontend will show type errors
   - Fix them as you go

Happy coding! 🚀

