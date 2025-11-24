# 🧪 Testing Guide - Alcovia Intervention Engine

Comprehensive testing scenarios to validate all features.

## Test Environment Setup

Before testing, ensure:
- ✅ Backend is running (local or deployed)
- ✅ Frontend is accessible (local or deployed)
- ✅ Supabase database has demo student
- ✅ n8n workflow is active
- ✅ Gmail is connected to n8n

## Test Scenarios

### 🟢 Test 1: Normal Flow (Success Path)

**Objective**: Verify that meeting thresholds results in "On Track" status.

**Steps**:
1. Open the frontend app
2. Click "Start Focus Session"
3. Let timer run for 65+ minutes (or modify threshold for testing)
4. Click "Stop Session"
5. Enter quiz score: `8` (>7 threshold)
6. Click "Submit Daily Check-in"

**Expected Results**:
- ✅ Success message: "Great job! You are on track."
- ✅ Student status remains `on_track` in database
- ✅ Daily log created with `status: 'success'`
- ✅ No intervention created
- ✅ No email sent to mentor
- ✅ Form resets for next check-in

**Database Verification**:
```sql
-- Check student status
SELECT * FROM students WHERE id = '123e4567-e89b-12d3-a456-426614174000';
-- Should show: status = 'on_track'

-- Check daily log
SELECT * FROM daily_logs 
WHERE student_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY logged_at DESC LIMIT 1;
-- Should show: status = 'success', quiz_score = 8, focus_minutes >= 61
```

---

### 🔴 Test 2: Intervention Flow (Failure Path)

**Objective**: Verify that failing thresholds triggers full intervention workflow.

**Steps**:
1. Refresh the app
2. Click "Start Focus Session"
3. Let timer run for 30 minutes (< 60 threshold)
4. Click "Stop Session"
5. Enter quiz score: `4` (< 7 threshold)
6. Click "Submit Daily Check-in"

**Expected Results - Phase 1 (Immediate)**:
- ✅ Message: "Your performance needs attention..."
- ✅ App immediately locks (shows lock icon 🔒)
- ✅ Message: "Analysis in progress. Waiting for Mentor..."
- ✅ All features disabled
- ✅ If WebSocket connected, shows "Live Connection Active"

**Expected Results - Phase 2 (Backend)**:
- ✅ Student status updated to `needs_intervention`
- ✅ Daily log created with `status: 'failed'`
- ✅ Intervention record created with `status: 'pending'`
- ✅ n8n webhook triggered

**Expected Results - Phase 3 (Email)**:
- ✅ Mentor receives email within 30 seconds
- ✅ Email subject: "🚨 Student Intervention Required - Demo Student"
- ✅ Email contains:
  - Student name and email
  - Quiz score: 4/10 (Required: >7)
  - Focus time: 30 min (Required: >60)
  - "Review & Assign Task" button

**Database Verification**:
```sql
-- Check student status
SELECT * FROM students WHERE id = '123e4567-e89b-12d3-a456-426614174000';
-- Should show: status = 'needs_intervention'

-- Check intervention
SELECT * FROM interventions 
WHERE student_id = '123e4567-e89b-12d3-a456-426614174000'
AND status = 'pending'
ORDER BY created_at DESC LIMIT 1;
-- Should exist with mentor_notified_at set

-- Check daily log
SELECT * FROM daily_logs 
WHERE student_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY logged_at DESC LIMIT 1;
-- Should show: status = 'failed'
```

---

### 🔓 Test 3: Mentor Approval & Unlock

**Objective**: Verify mentor can assign task and unlock student.

**Prerequisites**: Test 2 must be completed (student is locked).

**Steps**:
1. Check mentor email inbox
2. Open the intervention email
3. Click "Review & Assign Task" button
4. In the n8n form, enter remedial task:
   ```
   Read Chapter 4: Advanced Focus Techniques and complete the practice exercises. Take notes on key concepts.
   ```
5. Click "Submit"

**Expected Results - Phase 1 (n8n)**:
- ✅ n8n shows "✅ Task assigned! The student will be notified immediately."
- ✅ n8n execution shows all nodes completed successfully
- ✅ HTTP Request node called backend API

**Expected Results - Phase 2 (Backend)**:
- ✅ `/assign-intervention` endpoint called
- ✅ Intervention updated with remedial task
- ✅ Student status changed to `remedial_assigned`
- ✅ WebSocket event emitted to student

**Expected Results - Phase 3 (Frontend)**:
- ✅ **Student's screen unlocks INSTANTLY** (no refresh needed!)
- ✅ Lock icon disappears
- ✅ Shows book icon 📚
- ✅ Title: "Remedial Task Assigned"
- ✅ Displays the exact task mentor entered
- ✅ Shows "Mark as Complete" button
- ✅ All other features still disabled (only task visible)

**Expected Results - Phase 4 (Student Email)**:
- ✅ Student receives email: "✅ Your Access Has Been Restored"
- ✅ Email contains the remedial task
- ✅ Instructions to log back in

**Database Verification**:
```sql
-- Check student status
SELECT * FROM students WHERE id = '123e4567-e89b-12d3-a456-426614174000';
-- Should show: status = 'remedial_assigned'

-- Check intervention
SELECT * FROM interventions 
WHERE student_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY created_at DESC LIMIT 1;
-- Should show: 
--   status = 'assigned'
--   remedial_task = (your task text)
--   mentor_responded_at = (timestamp)
```

---

### ✅ Test 4: Task Completion & Return to Normal

**Objective**: Verify student can complete task and return to normal state.

**Prerequisites**: Test 3 must be completed (task is assigned).

**Steps**:
1. In the frontend (should already show remedial task)
2. Read the task (simulate completion)
3. Click "Mark as Complete"

**Expected Results**:
- ✅ Success message: "Great! You have completed your remedial task..."
- ✅ App returns to normal state
- ✅ Shows focus timer and quiz input again
- ✅ Form is reset (empty)
- ✅ Status badge shows "On Track"

**Database Verification**:
```sql
-- Check student status
SELECT * FROM students WHERE id = '123e4567-e89b-12d3-a456-426614174000';
-- Should show: status = 'on_track'

-- Check intervention
SELECT * FROM interventions 
WHERE student_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY created_at DESC LIMIT 1;
-- Should show: 
--   status = 'completed'
--   task_completed = true
--   task_completed_at = (timestamp)
```

---

### 🎁 Test 5: Tab Switching Detection (Bonus #1)

**Objective**: Verify tab switching is detected and reported.

**Note**: This only works on web browsers, not mobile.

**Steps**:
1. Ensure you're on a web browser (not mobile)
2. Click "Start Focus Session"
3. Wait 5 seconds
4. **Switch to a different tab** (e.g., open a new tab)
5. Wait 2 seconds
6. Return to the app tab
7. **Switch to a different tab again**
8. Return to the app
9. Click "Stop Session"
10. Enter quiz score: `8`
11. Click "Submit Daily Check-in"

**Expected Results**:
- ✅ Warning appears after each tab switch: "⚠️ Tab switching detected..."
- ✅ Counter shows: "⚠️ Tab switches detected: 2"
- ✅ Text is red/warning color
- ✅ Even with good score (8), check-in may fail due to cheating
- ✅ Daily log records:
  - `tab_switches: 2`
  - `cheating_detected: true`
- ✅ Mentor email includes: "⚠️ Cheating Detected: YES - 2 tab switches"

**Database Verification**:
```sql
SELECT tab_switches, cheating_detected, status 
FROM daily_logs 
WHERE student_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY logged_at DESC LIMIT 1;
-- Should show: tab_switches = 2, cheating_detected = true
```

**Testing Edge Cases**:
- Minimize window → Should trigger
- Alt+Tab to different app → Should trigger
- Click outside browser → Should trigger
- Clicking within same browser tab → Should NOT trigger

---

### 🎁 Test 6: Real-Time WebSocket Updates (Bonus #2)

**Objective**: Verify instant updates without page refresh.

**Setup**: Use two browser windows side-by-side.

**Steps**:
1. **Window 1**: Open student app at frontend URL
2. **Window 2**: Keep email client open
3. In Window 1: Trigger intervention (low score + low time)
4. Window 1 should lock immediately
5. In Window 2: Open mentor email
6. Click "Review & Assign Task"
7. Enter task and submit
8. **Watch Window 1** (student app) - DO NOT REFRESH

**Expected Results**:
- ✅ **Window 1 unlocks INSTANTLY** (within 1-2 seconds)
- ✅ No manual refresh needed
- ✅ Smooth transition from locked → remedial state
- ✅ Task appears without any user action
- ✅ Browser console shows: "📡 Intervention assigned: ..."

**Technical Verification**:
Open browser DevTools (F12) → Network tab:
- ✅ WebSocket connection established on page load
- ✅ Connection shows "101 Switching Protocols"
- ✅ Message received when mentor approves
- ✅ Connection stays alive (doesn't disconnect)

**Testing Connection Resilience**:
1. Start with app open and WebSocket connected
2. Restart backend server
3. Wait 5 seconds
4. WebSocket should auto-reconnect
5. Trigger intervention → Should still work

---

### 🔒 Test 7: Locked State Persistence

**Objective**: Verify locked state survives page refresh.

**Steps**:
1. Trigger intervention (student is locked)
2. Close browser tab
3. Open new tab and navigate to frontend URL
4. Check student status

**Expected Results**:
- ✅ App still shows locked state
- ✅ Message: "Analysis in progress. Waiting for Mentor..."
- ✅ No access to focus timer or quiz
- ✅ "Refresh Status" button visible

---

### 🔄 Test 8: Multiple Check-ins

**Objective**: Verify system handles multiple daily check-ins.

**Steps**:
1. Submit successful check-in (score: 8, time: 70)
2. Immediately submit another successful check-in
3. Submit a failed check-in (score: 4, time: 30)
4. Complete intervention cycle
5. Submit another successful check-in

**Expected Results**:
- ✅ Each check-in creates a new daily_logs entry
- ✅ Student status changes appropriately
- ✅ No data corruption or conflicts
- ✅ History is maintained (all logs visible in DB)

**Database Verification**:
```sql
SELECT logged_at, quiz_score, focus_minutes, status
FROM daily_logs
WHERE student_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY logged_at DESC
LIMIT 5;
-- Should show all 5 entries in order
```

---

### 🌐 Test 9: API Endpoint Testing

**Objective**: Test backend API directly (bypassing frontend).

**Tools**: Postman, curl, or Thunder Client (VS Code extension)

#### Test 9.1: Health Check
```bash
curl http://localhost:3000/api/health
```
Expected: `{"status":"ok","message":"Alcovia Intervention Engine is running"}`

#### Test 9.2: Get Student Status
```bash
curl http://localhost:3000/api/student/123e4567-e89b-12d3-a456-426614174000/status
```
Expected: JSON with student info and active intervention (if any)

#### Test 9.3: Daily Check-in (Success)
```bash
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "quiz_score": 8,
    "focus_minutes": 70
  }'
```
Expected: `{"status":"On Track",...}`

#### Test 9.4: Daily Check-in (Failure)
```bash
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "quiz_score": 4,
    "focus_minutes": 30,
    "tab_switches": 3,
    "cheating_detected": true
  }'
```
Expected: `{"status":"Pending Mentor Review",...}`

#### Test 9.5: Assign Intervention (Simulating n8n)
```bash
curl -X POST http://localhost:3000/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "intervention_id": "<get from previous response>",
    "remedial_task": "API Test Task"
  }'
```
Expected: `{"message":"Intervention assigned successfully",...}`

#### Test 9.6: Complete Task
```bash
curl -X POST http://localhost:3000/api/complete-task \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "intervention_id": "<get from intervention>"
  }'
```
Expected: `{"message":"Remedial task completed",...}`

---

### 🚨 Test 10: Error Handling

**Objective**: Verify system handles errors gracefully.

#### Test 10.1: Invalid Student ID
```bash
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "invalid-uuid",
    "quiz_score": 8,
    "focus_minutes": 70
  }'
```
Expected: `{"error":"Student not found"}` with 404 status

#### Test 10.2: Missing Fields
```bash
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```
Expected: `{"error":"Missing required fields..."}` with 400 status

#### Test 10.3: Out of Range Quiz Score
```bash
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "quiz_score": 15,
    "focus_minutes": 70
  }'
```
Expected: `{"error":"quiz_score must be between 0 and 10"}` with 400 status

#### Test 10.4: Frontend - Network Failure
1. Stop the backend server
2. Try to submit check-in from frontend
3. Expected: Error message displayed to user

#### Test 10.5: Frontend - WebSocket Disconnect
1. Start with app open
2. Stop backend
3. Restart backend
4. Expected: WebSocket auto-reconnects (check console logs)

---

## Performance Testing

### Load Test: Concurrent Check-ins

**Tool**: Apache Bench (ab) or Artillery

```bash
# Install Apache Bench (comes with Apache)
# Mac: brew install httpd
# Ubuntu: apt-get install apache2-utils

# Test 100 concurrent requests
ab -n 100 -c 10 -p checkin.json -T application/json \
   http://localhost:3000/api/daily-checkin
```

**checkin.json**:
```json
{
  "student_id": "123e4567-e89b-12d3-a456-426614174000",
  "quiz_score": 8,
  "focus_minutes": 70
}
```

**Expected**: 
- 95%+ success rate
- Response time < 500ms
- No database conflicts

---

## Test Checklist

Use this checklist when testing:

### Core Functionality
- [ ] Backend health check responds
- [ ] Frontend loads without errors
- [ ] Supabase connection works
- [ ] Demo student exists in database

### Normal Flow
- [ ] Focus timer starts and counts correctly
- [ ] Quiz score input accepts 0-10
- [ ] Successful check-in (score >7, time >60) works
- [ ] Success message displays
- [ ] Form resets after submission

### Intervention Flow
- [ ] Failed check-in triggers lock
- [ ] App shows locked state immediately
- [ ] n8n webhook receives data
- [ ] Mentor email sent within 30 seconds
- [ ] Email contains correct student data

### Mentor Approval
- [ ] Email link opens n8n form
- [ ] Form accepts remedial task text
- [ ] Backend API called after submission
- [ ] Student app unlocks (without refresh if WebSocket works)
- [ ] Remedial task displays correctly
- [ ] Only remedial task visible (other features hidden)

### Task Completion
- [ ] "Mark as Complete" button works
- [ ] Returns student to normal state
- [ ] Form is reset and ready for next check-in

### Bonus #1: Tab Detection
- [ ] Tab switch is detected (web only)
- [ ] Warning message appears
- [ ] Counter increments correctly
- [ ] Data logged in database
- [ ] Included in mentor notification

### Bonus #2: WebSockets
- [ ] WebSocket connects on page load
- [ ] "Live" badge shows when connected
- [ ] Student unlocks instantly when mentor approves
- [ ] No page refresh needed
- [ ] Connection survives backend restart

### Error Handling
- [ ] Invalid inputs rejected with clear messages
- [ ] Network errors handled gracefully
- [ ] Database errors don't crash server
- [ ] Frontend shows user-friendly error messages

### Data Integrity
- [ ] All check-ins logged in daily_logs table
- [ ] Student status always reflects actual state
- [ ] Interventions tracked completely
- [ ] No orphaned records
- [ ] Timestamps are accurate

---

## Automated Testing Script

Save this as `test-flow.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"
STUDENT_ID="123e4567-e89b-12d3-a456-426614174000"

echo "🧪 Testing Alcovia Intervention Engine"
echo "======================================"

# Test 1: Health check
echo -e "\n1️⃣  Testing health endpoint..."
curl -s $API_URL/health | jq

# Test 2: Get student status
echo -e "\n2️⃣  Getting student status..."
curl -s $API_URL/student/$STUDENT_ID/status | jq

# Test 3: Successful check-in
echo -e "\n3️⃣  Submitting successful check-in..."
curl -s -X POST $API_URL/daily-checkin \
  -H "Content-Type: application/json" \
  -d "{\"student_id\":\"$STUDENT_ID\",\"quiz_score\":8,\"focus_minutes\":70}" | jq

# Test 4: Failed check-in
echo -e "\n4️⃣  Submitting failed check-in..."
curl -s -X POST $API_URL/daily-checkin \
  -H "Content-Type: application/json" \
  -d "{\"student_id\":\"$STUDENT_ID\",\"quiz_score\":4,\"focus_minutes\":30}" | jq

echo -e "\n✅ API tests complete! Check n8n for workflow execution."
```

Run with: `bash test-flow.sh`

---

## Success Criteria

The system is working correctly when:

✅ **All core flows work end-to-end**:
   - Success check-in → On track
   - Failed check-in → Lock → Email → Unlock → Complete → On track

✅ **Real-time features work**:
   - WebSocket connects
   - Instant unlocking without refresh

✅ **Bonus features work**:
   - Tab switching detected and logged
   - WebSocket events received immediately

✅ **Error handling is robust**:
   - Invalid inputs rejected
   - Network failures handled
   - User sees clear error messages

✅ **Data integrity maintained**:
   - All events logged correctly
   - State transitions are atomic
   - No data loss or corruption

---

**Ready to deploy? Follow the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)!**

