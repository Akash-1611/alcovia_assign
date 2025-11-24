# Alcovia Intervention Engine 🚀

A **Closed-Loop Intervention System** that detects when students are falling behind and automatically triggers a mentorship workflow. Built for the Alcovia Full Stack Engineering Intern assignment.

## 🎯 System Overview

This system implements a **three-state intervention model**:

1. **Normal State (on_track)**: Student sees Focus Timer and Daily Quiz interface
2. **Locked State (needs_intervention)**: All features disabled, waiting for mentor review
3. **Remedial State (remedial_assigned)**: Only remedial task visible until completion

### Key Features
- ✅ SQL-based state management with PostgreSQL (Supabase)
- ✅ Real-time WebSocket updates (Bonus #2)
- ✅ Tab switching detection for cheating prevention (Bonus #1)
- ✅ n8n automation workflow with human-in-the-loop
- ✅ Deployed web app (no local setup required)

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Student   │─────▶│   Backend   │─────▶│   n8n       │
│   App       │◀─────│   API       │◀─────│   Workflow  │
│  (React)    │ WS   │  (Express)  │ Hook │  (Mentor)   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Supabase   │
                     │  PostgreSQL │
                     └─────────────┘
```

## 📊 Database Schema

### Students Table
```sql
- id: UUID (Primary Key)
- email: VARCHAR(255)
- name: VARCHAR(255)
- status: ENUM('on_track', 'needs_intervention', 'remedial_assigned')
- created_at, updated_at: TIMESTAMP
```

### Daily_Logs Table
```sql
- id: UUID (Primary Key)
- student_id: UUID (Foreign Key)
- quiz_score: INTEGER (0-10)
- focus_minutes: INTEGER
- status: ENUM('success', 'failed')
- tab_switches: INTEGER (Bonus #1)
- cheating_detected: BOOLEAN (Bonus #1)
- logged_at: TIMESTAMP
- notes: TEXT
```

### Interventions Table
```sql
- id: UUID (Primary Key)
- student_id: UUID (Foreign Key)
- daily_log_id: UUID (Foreign Key)
- mentor_notified_at: TIMESTAMP
- mentor_responded_at: TIMESTAMP
- remedial_task: TEXT
- task_completed: BOOLEAN
- task_completed_at: TIMESTAMP
- status: ENUM('pending', 'assigned', 'completed', 'auto_resolved')
- n8n_execution_id: VARCHAR(255)
```

## 🔧 Tech Stack

- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Database**: Supabase (PostgreSQL)
- **Frontend**: React Native (Expo Web)
- **Automation**: n8n Cloud
- **Deployment**: 
  - Backend: Railway/Render
  - Frontend: Vercel/Netlify
  - Database: Supabase (hosted)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier)
- n8n Cloud account (free tier)
- Gmail account for email notifications

### 1. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema:
   ```bash
   # Copy the contents of backend/src/database/schema.sql
   ```
3. Get your credentials from Settings > API:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Update .env with your Supabase credentials
nano .env

# Run locally
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Update API_URL in App.tsx (line 11)
# For local: http://localhost:3000/api
# For deployed: your-backend-url.com/api

# Run web version
npm run web
```

Frontend will open at `http://localhost:19006`

### 4. n8n Workflow Setup

1. Create account at [n8n.cloud](https://n8n.cloud)
2. Import the workflow from `n8n-workflow.json`
3. Configure nodes:
   - **Webhook Node**: Copy the webhook URL
   - **Gmail Node**: Connect your Gmail account
   - **Wait Node**: Set approval link configuration
   - **HTTP Request Node**: Set to your backend `/assign-intervention` endpoint
4. Activate the workflow
5. Update `N8N_WEBHOOK_URL` in backend `.env`

## 📡 API Endpoints

### POST /api/daily-checkin
Submits daily check-in and triggers intervention if needed.

**Request:**
```json
{
  "student_id": "123e4567-e89b-12d3-a456-426614174000",
  "quiz_score": 4,
  "focus_minutes": 30,
  "tab_switches": 2,
  "cheating_detected": true
}
```

**Response (Success):**
```json
{
  "status": "On Track",
  "message": "Great job! You are on track.",
  "student_status": "on_track"
}
```

**Response (Failure):**
```json
{
  "status": "Pending Mentor Review",
  "message": "Your performance needs attention...",
  "student_status": "needs_intervention",
  "intervention_id": "uuid"
}
```

### POST /api/assign-intervention
Called by n8n after mentor approves remedial task.

**Request:**
```json
{
  "student_id": "uuid",
  "intervention_id": "uuid",
  "remedial_task": "Read Chapter 4 and complete exercises"
}
```

### POST /api/complete-task
Student marks remedial task as complete.

**Request:**
```json
{
  "student_id": "uuid",
  "intervention_id": "uuid"
}
```

### GET /api/student/:student_id/status
Get current student status and active intervention.

## 🎮 How It Works

### 1. Normal Flow (Success)
```
1. Student starts focus timer
2. Student completes 65 minutes
3. Student enters quiz score of 8
4. ✅ Submit → Status: "On Track"
```

### 2. Intervention Flow (Failure)
```
1. Student completes 30 minutes (< 60 threshold)
2. Student enters quiz score of 4 (< 7 threshold)
3. ❌ Submit → Status: "Pending Mentor Review"
4. 🔒 App immediately locks
5. 📧 Email sent to mentor via n8n
6. ⏳ n8n workflow pauses, waiting for mentor click
7. 👨‍🏫 Mentor clicks approval link with task
8. 🔓 n8n calls /assign-intervention endpoint
9. 📱 Student's app unlocks via WebSocket (real-time!)
10. 📚 Student sees only remedial task
11. ✅ Student completes task
12. 🎉 Return to normal state
```

## 🎁 Bonus Features Implemented

### Bonus #1: Tab Switching Detection
- Listens to `visibilitychange` and `blur` events (Web only)
- Automatically fails session if student switches tabs during focus timer
- Logs `tab_switches` count in database
- Mentor receives notification about cheating

**Implementation**: `frontend/App.tsx` lines 77-101

### Bonus #2: Real-Time WebSocket Updates
- Student app connects via Socket.io
- No manual refresh needed - mentor approval instantly unlocks the app
- Events: `status_update`, `intervention_assigned`, `task_completed`

**Implementation**:
- Backend: `backend/src/index.ts` (Socket.io server)
- Frontend: `frontend/App.tsx` (Socket.io client)

## 🛡️ Fail-Safe Mechanism (System Design Answer)

### The Problem
If a mentor doesn't respond for 12+ hours, the student remains locked indefinitely, unable to access the app.

### Proposed Solution: Multi-Layer Fail-Safe System

#### 1. **Auto-Unlock Timer** (Primary)
```sql
-- Cron job runs every hour
UPDATE students 
SET status = 'on_track' 
WHERE status = 'needs_intervention' 
  AND id IN (
    SELECT student_id FROM interventions 
    WHERE status = 'pending' 
      AND mentor_notified_at < NOW() - INTERVAL '12 hours'
  );

-- Mark intervention as auto-resolved
UPDATE interventions 
SET status = 'auto_resolved' 
WHERE status = 'pending' 
  AND mentor_notified_at < NOW() - INTERVAL '12 hours';
```

**Implementation**: PostgreSQL scheduled job (pg_cron) or backend cron service

#### 2. **Escalation Chain** (Secondary)
- **6 hours**: Send reminder email to primary mentor
- **12 hours**: Escalate to Head Mentor or backup mentor
- **18 hours**: Auto-unlock with generic remedial task ("Review today's material")

#### 3. **Grace Period After Auto-Unlock** (Tertiary)
- Student unlocked but marked with "auto_unlocked" flag
- When mentor eventually responds, task is still assigned
- Student sees: "You have a pending task from your mentor"

#### 4. **Smart Scheduling** (Preventive)
- Don't lock students outside mentor working hours
- If intervention triggered at 11 PM, delay lock until 8 AM next day
- Queue for next available mentor shift

### Implementation Priority
1. **Immediate**: Auto-unlock after 12 hours (prevents indefinite lockout)
2. **Phase 2**: Escalation chain with backup mentors
3. **Phase 3**: Smart scheduling based on mentor availability

### Database Changes Needed
```sql
ALTER TABLE interventions ADD COLUMN auto_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE interventions ADD COLUMN escalation_level INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN mentor_id UUID REFERENCES mentors(id);
```

## 🌐 Deployment Instructions

### Deploy Backend (Railway)

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your backend repository
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `N8N_WEBHOOK_URL`
   - `FRONTEND_URL` (add after frontend deployment)
5. Railway will auto-detect Node.js and deploy
6. Copy the deployed URL (e.g., `https://your-app.railway.app`)

### Deploy Frontend (Vercel)

1. Update `API_URL` in `frontend/App.tsx` to your Railway backend URL
2. Build for web:
   ```bash
   cd frontend
   npm run build:web
   ```
3. Deploy to Vercel:
   ```bash
   npx vercel --prod
   ```
4. Copy deployed URL and update `FRONTEND_URL` in Railway backend

### Update n8n
Update the HTTP Request node with your deployed backend URL.

## 🧪 Testing the System

### Test Case 1: Success Path
```
Quiz Score: 8
Focus Minutes: 70
Expected: "On Track" status
```

### Test Case 2: Intervention Path
```
Quiz Score: 4
Focus Minutes: 30
Expected: App locks, email sent to mentor
```

### Test Case 3: Tab Switching (Bonus)
```
1. Start focus timer
2. Switch to different tab
3. Return to app
Expected: Warning shown, cheating logged
```

### Test Case 4: Real-Time Unlock (Bonus)
```
1. Trigger intervention (lock app)
2. Mentor clicks email link
3. Student's screen should unlock instantly (no refresh)
```

## 📁 Project Structure

```
alcovia-intervention-engine/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.ts          # Supabase client
│   │   ├── controllers/
│   │   │   ├── checkinController.ts  # Daily check-in logic
│   │   │   └── interventionController.ts
│   │   ├── database/
│   │   │   └── schema.sql           # Database schema
│   │   ├── routes/
│   │   │   └── index.ts             # API routes
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   └── index.ts                 # Server entry + WebSocket
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── App.tsx                      # Main React Native app
│   ├── package.json
│   ├── app.json                     # Expo config
│   └── tsconfig.json
├── n8n-workflow.json                # n8n workflow export
└── README.md                        # This file
```

## 🎓 Learning Outcomes

This project demonstrates:
- ✅ Product-first engineering (solving human problems)
- ✅ State machine design (three-state system)
- ✅ Human-in-the-loop automation
- ✅ Real-time communication (WebSockets)
- ✅ Event-driven architecture
- ✅ SQL database design with constraints
- ✅ RESTful API design
- ✅ Full-stack TypeScript
- ✅ Production deployment
- ✅ System design thinking (fail-safe mechanisms)

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Email: student@alcovia.com

## 📜 License

MIT License - Built for Alcovia Full Stack Engineering Intern Assignment

---

**Built with ❤️ for Alcovia by a Product-First Engineer**

