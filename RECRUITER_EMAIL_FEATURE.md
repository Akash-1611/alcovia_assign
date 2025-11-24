# 📧 Recruiter Email Testing Feature

## ✅ **IMPLEMENTED!**

I've added a **Mentor Email Input** field to the frontend so recruiters can test the full intervention flow by entering their own email!

---

## 🎯 **WHAT THIS DOES:**

When the recruiter (or anyone testing) enters their email in the app:
1. ✅ They trigger an intervention (low score / tab switch)
2. ✅ **Their email** receives the intervention notification
3. ✅ They click the link in the email
4. ✅ They assign a remedial task
5. ✅ The student gets unlocked
6. ✅ **Full flow tested!** 🎉

---

## 📱 **FRONTEND CHANGES:**

### **New Email Input Card:**
```
┌────────────────────────────────────────────┐
│ 📧 Mentor Email (For Testing)             │
│                                            │
│ Enter your email to receive intervention  │
│ notifications:                             │
│                                            │
│ [your-email@example.com]                   │
│                                            │
│ 💡 This lets you (the recruiter) test the │
│    full intervention flow by receiving the│
│    mentor email yourself!                  │
└────────────────────────────────────────────┘
```

**Location:** Between "Daily Quiz" and "Submit" button

**Styling:** 
- Teal border (stands out!)
- Light cyan background
- Clear instructions

---

## 🔧 **BACKEND CHANGES:**

### **Now Accepts `mentor_email`:**
```typescript
// In daily-checkin endpoint:
const { 
  student_id, 
  quiz_score, 
  focus_minutes, 
  mentor_email  // ← NEW!
} = req.body;

// Passes to n8n webhook:
{
  student_id: "123...",
  student_name: "Demo Student",
  quiz_score: 8,
  focus_minutes: 0.33,
  mentor_email: "recruiter@company.com"  // ← NEW!
}
```

---

## 📧 **N8N CHANGES NEEDED:**

### **Step 1: Update Email "To" Field**

In your n8n **"Send Email to Mentor"** node:

**Change the "To Email" field from:**
```
mentor@alcovia.com
```

**To:**
```
={{ $node["Webhook - Student Failed"].json.body.mentor_email || 'mentor@alcovia.com' }}
```

This will:
- Use the recruiter's email if provided ✅
- Fall back to default if empty ✅

---

### **Step 2: Update Subject Line**

**Change from:**
```
🚨 Student Intervention Required - {{ $json.student_name }}
```

**To:**
```
🚨 Intervention - {{ $node["Webhook - Student Failed"].json.body.student_name }}
```

---

## 🎯 **HOW TO UPDATE YOUR N8N:**

### **1. Open Your Workflow**
- Go to n8n dashboard
- Click "Alcovia Mentor Dispatcher"

### **2. Update "Send Email to Mentor" Node**

Click on the node, then:

**"To Email" field:**
```
={{ $node["Webhook - Student Failed"].json.body.mentor_email || 'mentor@alcovia.com' }}
```

**"Subject" field:**
```
🚨 Intervention - {{ $node["Webhook - Student Failed"].json.body.student_name }}
```

**"Message" field:**
Use this complete template (copy all):

```html
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <h1 style="color: #ef4444; margin-top: 0;">🚨 Student Intervention Required</h1>
    
    <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px;">
      <strong style="color: #991b1b;">⚠️ ALERT: Student Performance Below Threshold</strong><br>
      <span style="color: #7f1d1d;">Immediate mentor review required to unlock student access.</span>
    </div>
    
    <h2 style="color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Student Information</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: bold; color: #666;">Name:</td>
        <td style="padding: 10px; color: #ef4444; font-weight: bold;">{{ $node["Webhook - Student Failed"].json.body.student_name }}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: bold; color: #666;">Email:</td>
        <td style="padding: 10px; color: #1f2937;">{{ $node["Webhook - Student Failed"].json.body.student_email }}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; color: #666;">Student ID:</td>
        <td style="padding: 10px; color: #6b7280; font-size: 12px;">{{ $node["Webhook - Student Failed"].json.body.student_id }}</td>
      </tr>
    </table>
    
    <h2 style="color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Performance Metrics</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: bold; color: #666;">Quiz Score:</td>
        <td style="padding: 10px; color: #ef4444; font-weight: bold;">
          {{ $node["Webhook - Student Failed"].json.body.quiz_score }}/10 
          <span style="color: #9ca3af; font-size: 12px; font-weight: normal;">(Required: &gt;7)</span>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: bold; color: #666;">Focus Time:</td>
        <td style="padding: 10px; color: #ef4444; font-weight: bold;">
          {{ $node["Webhook - Student Failed"].json.body.focus_minutes }} minutes 
          <span style="color: #9ca3af; font-size: 12px; font-weight: normal;">(Required: &gt;60)</span>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: bold; color: #666;">Tab Switches:</td>
        <td style="padding: 10px; color: #f59e0b; font-weight: bold;">{{ $node["Webhook - Student Failed"].json.body.tab_switches }}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; color: #666;">Cheating Detected:</td>
        <td style="padding: 10px; color: #dc2626; font-weight: bold;">
          {{ $node["Webhook - Student Failed"].json.body.cheating_detected ? 'YES ⚠️' : 'NO ✅' }}
        </td>
      </tr>
    </table>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #92400e;">🔒 The student's app is currently LOCKED.</p>
      <p style="margin: 5px 0 0 0; color: #78350f;">They cannot proceed until you assign a remedial task.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ $execution.resumeFormUrl }}" 
         style="display: inline-block; background: #6366f1; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        📝 Review & Assign Remedial Task
      </a>
    </div>
    
    <p style="text-align: center; color: #f59e0b; font-weight: bold; margin: 20px 0;">
      ⏱️ Student is waiting. Please respond within 12 hours.
    </p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.6;">
      <strong>Intervention ID:</strong> {{ $node["Webhook - Student Failed"].json.body.intervention_id }}<br>
      <strong>Daily Log ID:</strong> {{ $node["Webhook - Student Failed"].json.body.daily_log_id }}<br>
      <strong>Timestamp:</strong> {{ $now }}<br>
      <em>Alcovia Intervention Engine</em>
    </p>
  </div>
</body>
</html>
```

### **3. Save the Workflow**
Click **"Save"** in n8n

---

## 🧪 **HOW TO TEST:**

### **For Recruiters:**

1. **Open the app** (frontend)
2. **Enter your email** in the "📧 Mentor Email" field
   ```
   Example: recruiter@company.com
   ```
3. **Start focus timer**
4. **Switch tabs** (or submit low score)
5. **Submit daily check-in**
6. **Check your email!** 📧
   - You should receive the intervention email
   - Click the "Review & Assign Task" button
   - Fill in a remedial task
   - Submit
7. **Student gets unlocked!** ✅

---

## 🎯 **BENEFITS:**

### **For You (Developer):**
✅ **No hardcoded emails** - Anyone can test  
✅ **Easy demo** - Recruiter tests themselves  
✅ **Professional** - Shows product thinking  
✅ **Flexible** - Works for any tester  

### **For Recruiter:**
✅ **Self-service testing** - No setup needed  
✅ **Full experience** - See complete flow  
✅ **Immediate feedback** - Get email right away  
✅ **Interactive** - Actually assign tasks  

### **For Alcovia:**
✅ **Easy evaluation** - They can test it themselves  
✅ **Shows UX thinking** - User-friendly for testing  
✅ **Professional approach** - Production-ready mindset  

---

## 📊 **DATA FLOW:**

```
Frontend (Student App)
  ↓
Enter Email: recruiter@company.com
  ↓
Submit Check-in (fails)
  ↓
Backend /daily-checkin
  ↓
{
  student_id: "123...",
  quiz_score: 8,
  mentor_email: "recruiter@company.com"  ← Passed along
}
  ↓
n8n Webhook Triggered
  ↓
{
  body: {
    student_name: "Demo Student",
    quiz_score: 8,
    mentor_email: "recruiter@company.com"  ← Available!
  }
}
  ↓
Email Node: To = {{ $node["Webhook - Student Failed"].json.body.mentor_email }}
  ↓
📧 Email sent to: recruiter@company.com ✅
  ↓
Recruiter receives email!
  ↓
Recruiter clicks link & assigns task
  ↓
Student unlocked! 🎉
```

---

## 💡 **OPTIONAL ENHANCEMENTS:**

You could also add:

1. **Email validation** in frontend:
```typescript
if (mentorEmail && !mentorEmail.includes('@')) {
  Alert.alert('Invalid email format');
}
```

2. **Save email to localStorage:**
```typescript
useEffect(() => {
  AsyncStorage.setItem('mentor_email', mentorEmail);
}, [mentorEmail]);
```

3. **Pre-fill with saved email:**
```typescript
useEffect(() => {
  AsyncStorage.getItem('mentor_email').then(setMentorEmail);
}, []);
```

---

## ✅ **FILES CHANGED:**

1. ✅ `frontend/App.tsx` - Added email input, state, and UI
2. ✅ `backend/src/controllers/checkinController.ts` - Accepts & passes mentor_email
3. ⏳ `n8n workflow` - YOU NEED TO UPDATE (see above)

---

## 🚀 **READY TO USE:**

**After updating n8n:**
1. Restart backend (if running)
2. Refresh frontend (Ctrl + Shift + R)
3. Enter your email in the new field
4. Test the flow!

---

## 🎯 **WHAT RECRUITERS WILL SEE:**

**In your app:**
```
┌────────────────────────────────────────────┐
│ Daily Quiz 📝                              │
│ Enter your quiz score (0-10):              │
│ [8]                                        │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 📧 Mentor Email (For Testing)             │  ← NEW!
│                                            │
│ Enter your email to receive intervention  │
│ notifications:                             │
│                                            │
│ [recruiter@alcovia.com]                    │
│                                            │
│ 💡 This lets you (the recruiter) test the │
│    full intervention flow!                 │
└────────────────────────────────────────────┘

[🟡 SUBMIT DAILY CHECK-IN]
```

**In their inbox:**
```
From: Alcovia Intervention Engine
To: recruiter@alcovia.com  ← Their email!
Subject: 🚨 Intervention - Demo Student

[Email with student stats and assign task button]
```

---

## ✨ **THIS SHOWS:**

✅ **Product thinking** - Making testing easy  
✅ **User empathy** - Consider recruiter's needs  
✅ **Professional approach** - Self-service demo  
✅ **Technical skill** - Full-stack integration  

**Perfect for your Alcovia submission!** 🎉

---

**Just update the n8n "To Email" field and you're done!** 📧✨

