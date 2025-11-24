# 🔧 TROUBLESHOOTING: Tab Switch Not Saving

## ⚠️ CRITICAL CHECKLIST:

Before testing, make sure **ALL** of these are true:

### ✅ **1. Backend Server is Running**
```powershell
# In one terminal (keep it open):
cd backend
npm run dev
```

**You should see:**
```
🚀 Server is running on port 3000
✅ Connected to Supabase
```

❌ **If backend is NOT running**, the frontend cannot save data!

### ✅ **2. Frontend is Running**
```powershell
# In another terminal (keep it open):
cd frontend
npm run web
```

**You should see:**
```
Metro waiting on exp://192.168...
Web Bundled successfully
```

### ✅ **3. Browser Cache Cleared**
```
Hard refresh: Ctrl + Shift + R (Windows)
              Cmd + Shift + R (Mac)
```

### ✅ **4. Console is Open**
```
Press F12 → Console tab
```

---

## 🧪 **STEP-BY-STEP TEST:**

### **1. Open Browser Console (F12)**
- Click on **Console** tab
- Clear any old logs

### **2. Start Focus Timer**
- Click "Start Focus Session"
- Wait for timer to start (00:01, 00:02...)

### **3. Switch Tab (After 20 Seconds)**
- At 00:20, switch to another tab
- Switch back immediately
- **Check console** for:
```
Tab switching detected!
```

### **4. Enter Quiz Score**
- Type: **8**
- **Check console** - should show no errors yet

### **5. Click Submit**
- Click "Submit Daily Check-in"
- **WATCH THE CONSOLE CAREFULLY!**

---

## 📊 **WHAT TO LOOK FOR IN CONSOLE:**

### **✅ SUCCESSFUL FLOW (What you SHOULD see):**

```javascript
🚀 SUBMIT CLICKED!
Current State: {
  quizScore: "8",
  focusMinutes: 0,
  timerSeconds: 20,
  tabSwitches: 1,
  cheatingDetected: true,
  isTimerRunning: false
}

Should block submission? false {
  focusMinutes_is_0: true,
  timerSeconds_is_0: false,    ← KEY: This should be FALSE
  not_cheatingDetected: false   ← KEY: This should be FALSE
}

✅ PROCEEDING with submission...

📤 Submitting check-in: {
  quiz_score: 8,
  focus_minutes: 0.3333...,
  timer_seconds: 20,
  tab_switches: 1,
  cheating_detected: true
}

📡 Fetching: http://localhost:3000/api/daily-checkin
📡 Response status: 200
📡 Response ok: true

📥 Response data: {
  "status": "Pending Mentor Review",
  "message": "Performance below threshold...",
  "student_status": "needs_intervention"
}

❌ FAILURE PATH - Showing intervention alert
```

### **❌ PROBLEM SCENARIOS:**

#### **Scenario A: Backend Not Running**
```javascript
🚀 SUBMIT CLICKED!
...
❌ ERROR: Failed to fetch
❌ Error: Network request failed
```

**Solution:** Start backend server!
```powershell
cd backend
npm run dev
```

#### **Scenario B: Timer State Wrong**
```javascript
Should block submission? true {
  focusMinutes_is_0: true,
  timerSeconds_is_0: true,    ← PROBLEM: Should be false!
  not_cheatingDetected: false
}

❌ BLOCKED: Please start a focus session first
```

**Solution:** Code might not be updated. Hard refresh!

#### **Scenario C: Cheating Not Detected**
```javascript
Current State: {
  ...
  cheatingDetected: false    ← PROBLEM: Should be true!
}
```

**Solution:** Tab detection not working. Check if you actually switched tabs.

---

## 🔍 **DETAILED DEBUGGING:**

### **Step 1: Verify Backend is Accessible**

Open new browser tab and go to:
```
http://localhost:3000/api/student/123e4567-e89b-12d3-a456-426614174000/status
```

**Should return:**
```json
{
  "student": {...},
  "active_intervention": null
}
```

**If you get error:** Backend is not running or wrong URL!

### **Step 2: Check Network Tab**

In browser (F12):
1. Click **Network** tab
2. Click Submit
3. Look for `/daily-checkin` request
4. Click on it to see:
   - **Request Payload** (what was sent)
   - **Response** (what came back)
   - **Status Code** (should be 200)

### **Step 3: Check Supabase**

Go to Supabase dashboard:
1. Open `daily_logs` table
2. Click **Refresh**
3. Look for new entry with:
   - `quiz_score: 8`
   - `focus_minutes: 0.33`
   - `cheating_detected: true`

**If entry exists:** Frontend issue showing response  
**If no entry:** Backend not receiving or processing

---

## 🐛 **COMMON ISSUES & FIXES:**

### **Issue 1: "Failed to fetch"**
**Cause:** Backend not running  
**Fix:**
```powershell
cd backend
npm run dev
```
Keep this terminal open!

### **Issue 2: Nothing happens when clicking Submit**
**Cause:** Browser cache  
**Fix:**
```
1. Ctrl + Shift + R (hard refresh)
2. Or clear browser cache
3. Or try incognito mode
```

### **Issue 3: "Please start a focus session first"**
**Cause:** `timerSeconds === 0` (state issue)  
**Fix:**
1. Hard refresh
2. Start timer properly
3. Wait at least 1 second before tab switch

### **Issue 4: 404 Not Found**
**Cause:** Demo student deleted from database  
**Fix:**
Run this in Supabase SQL editor:
```sql
INSERT INTO students (id, name, email, status)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Demo Student',
  'student@alcovia.com',
  'on_track'
);
```

### **Issue 5: CORS Error**
**Cause:** Backend CORS not configured  
**Fix:** Check `backend/src/index.ts` has:
```javascript
app.use(cors());
```

---

## ✅ **VERIFICATION STEPS:**

### **After Submit, Check ALL of These:**

1. **Console** ✅
   - See "📤 Submitting check-in"
   - See "📥 Response data"
   - See "Showing intervention alert"

2. **UI** ✅
   - Error banner appears
   - "Intervention Required" message
   - Account shows locked state

3. **Supabase** ✅
   - New entry in `daily_logs`
   - Student status = "needs_intervention"
   - Intervention record created

4. **Email** ✅
   - Mentor receives email
   - Contains correct stats
   - Has form link

---

## 🚨 **STILL NOT WORKING?**

### **Send me these details:**

1. **Console output** (copy all logs)
2. **Network tab** (screenshot of /daily-checkin request)
3. **Backend terminal** (what does it show?)
4. **Exact steps** you followed

### **Quick Debug Command:**

Paste this in browser console:
```javascript
console.log('DEBUG INFO:');
console.log('API_URL:', 'http://localhost:3000/api');
console.log('Current state:', {
  quizScore: document.querySelector('input[placeholder*="8"]')?.value,
  timerVisible: !!document.querySelector('text[children*="00:"]'),
  submitButtonVisible: !!document.querySelector('text[children*="Submit"]')
});

fetch('http://localhost:3000/api/student/123e4567-e89b-12d3-a456-426614174000/status')
  .then(r => r.json())
  .then(d => console.log('Backend response:', d))
  .catch(e => console.error('Backend error:', e));
```

---

## 📝 **EXPECTED FLOW:**

```
1. Start timer (00:00)
   ↓
2. Timer runs (00:01, 00:02... 00:20)
   ↓
3. Switch tab at 00:20
   ↓ (cheatingDetected = true, timerSeconds = 20)
4. Tab detection triggers
   ↓ (timer stops)
5. Enter score: 8
   ↓
6. Click Submit
   ↓ (validation passes because timerSeconds > 0)
7. POST /daily-checkin
   ↓ (backend receives data)
8. Backend processes (logic gate fails)
   ↓ (creates DB entries)
9. Returns failure response
   ↓ (triggers n8n webhook)
10. Frontend shows error
   ↓ (displays locked state)
11. Email sent to mentor
   ↓ (workflow paused)
12. Wait for mentor approval
```

---

## ⚡ **QUICK FIX CHECKLIST:**

- [ ] Backend running? (`cd backend; npm run dev`)
- [ ] Frontend running? (`cd frontend; npm run web`)
- [ ] Hard refreshed? (Ctrl + Shift + R)
- [ ] Console open? (F12 → Console)
- [ ] Actually switched tab? (during timer)
- [ ] Timer ran at least 1 second?
- [ ] Entered valid score? (8, 9, or 10)
- [ ] Clicked submit button?
- [ ] Checked console for logs?
- [ ] Checked network tab?
- [ ] Demo student exists in DB?

---

**If ALL checkboxes are checked and it STILL doesn't work, copy ALL console output and send it to me!** 🔍

