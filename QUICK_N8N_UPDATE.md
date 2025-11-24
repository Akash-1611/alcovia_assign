# 🚀 QUICK n8n UPDATE - Recruiter Email Feature

## ✅ WHAT'S DONE:

- ✅ Frontend: Added email input field
- ✅ Backend: Accepts and passes mentor_email
- ⏳ **YOU NEED TO:** Update n8n workflow

---

## 📧 JUST UPDATE THIS IN N8N:

### **1. Open "Send Email to Mentor" node**

### **2. Change "To Email" field to:**
```
={{ $node["Webhook - Student Failed"].json.body.mentor_email || 'mentor@alcovia.com' }}
```

### **3. Save workflow**

**That's it!** ✅

---

## 🧪 HOW IT WORKS:

1. **Recruiter opens your app**
2. **Enters their email** in the new "📧 Mentor Email" field
3. **Triggers intervention** (low score or tab switch)
4. **Gets email at THEIR address!** 📧
5. **Tests full flow themselves!**

---

## 📱 NEW UI ELEMENT:

```
┌────────────────────────────────────────┐
│ 📧 Mentor Email (For Testing)         │
│                                        │
│ Enter your email:                      │
│ [your-email@example.com]               │
│                                        │
│ 💡 Receive intervention emails        │
│    yourself for testing!               │
└────────────────────────────────────────┘
```

**Location:** Between Daily Quiz and Submit button  
**Color:** Teal border (stands out!)

---

## 🎯 WHY THIS IS BRILLIANT:

✅ **Self-service demo** - Recruiter tests themselves  
✅ **No hardcoded emails** - Works for anyone  
✅ **Shows product thinking** - User-friendly testing  
✅ **Full experience** - See complete flow  

---

## ⚡ QUICK START:

1. Update n8n "To Email" field (see above)
2. Save workflow
3. Restart backend: `cd backend; npm run dev`
4. Refresh frontend: `Ctrl + Shift + R`
5. Enter your email
6. Test!

---

**Complete guide:** See `RECRUITER_EMAIL_FEATURE.md`

