# 📡 API Documentation - Alcovia Intervention Engine

Complete reference for all backend API endpoints.

## Base URL

**Local Development**: `http://localhost:3000/api`  
**Production**: `https://your-app.railway.app/api`

## Authentication

Currently, no authentication is required (demo/MVP). In production, add JWT tokens.

---

## Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint**: `GET /api/health`

**Parameters**: None

**Response**:
```json
{
  "status": "ok",
  "message": "Alcovia Intervention Engine is running"
}
```

**Status Codes**:
- `200 OK`: API is running

**Example**:
```bash
curl http://localhost:3000/api/health
```

---

### 2. Daily Check-in

Submit daily quiz score and focus time. Triggers intervention if thresholds not met.

**Endpoint**: `POST /api/daily-checkin`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```typescript
{
  student_id: string;         // UUID of student (required)
  quiz_score: number;         // 0-10 (required)
  focus_minutes: number;      // Minutes focused (required)
  tab_switches?: number;      // Number of tab switches (optional)
  cheating_detected?: boolean; // Whether cheating detected (optional)
}
```

**Success Response (On Track)**:
```json
{
  "status": "On Track",
  "message": "Great job! You are on track.",
  "student_status": "on_track"
}
```

**Success Response (Intervention Needed)**:
```json
{
  "status": "Pending Mentor Review",
  "message": "Your performance needs attention. A mentor will review your progress.",
  "student_status": "needs_intervention",
  "intervention_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses**:

Missing fields (400):
```json
{
  "error": "Missing required fields: student_id, quiz_score, focus_minutes"
}
```

Invalid quiz score (400):
```json
{
  "error": "quiz_score must be between 0 and 10"
}
```

Invalid focus minutes (400):
```json
{
  "error": "focus_minutes must be >= 0"
}
```

Student not found (404):
```json
{
  "error": "Student not found"
}
```

**Status Codes**:
- `200 OK`: Check-in processed successfully
- `400 Bad Request`: Invalid input
- `404 Not Found`: Student doesn't exist
- `500 Internal Server Error`: Server error

**Logic Gate**:
- **Success**: `quiz_score > 7 AND focus_minutes > 60 AND !cheating_detected`
- **Failure**: Any condition not met → Intervention triggered

**Side Effects (on failure)**:
1. Student status → `needs_intervention`
2. Daily log created with `status: 'failed'`
3. Intervention record created
4. n8n webhook triggered
5. WebSocket event emitted

**Examples**:

Success:
```bash
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "quiz_score": 8,
    "focus_minutes": 70
  }'
```

Failure:
```bash
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "quiz_score": 4,
    "focus_minutes": 30
  }'
```

With cheating detection:
```bash
curl -X POST http://localhost:3000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "quiz_score": 8,
    "focus_minutes": 70,
    "tab_switches": 3,
    "cheating_detected": true
  }'
```

---

### 3. Assign Intervention

Called by n8n workflow after mentor approves remedial task. Unlocks student with assigned task.

**Endpoint**: `POST /api/assign-intervention`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```typescript
{
  student_id: string;        // UUID of student (required)
  intervention_id: string;   // UUID of intervention (required)
  remedial_task: string;     // Task description (required)
}
```

**Success Response**:
```json
{
  "message": "Intervention assigned successfully. Student unlocked with remedial task.",
  "intervention": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "remedial_task": "Read Chapter 4 and complete exercises",
    "status": "assigned",
    "mentor_responded_at": "2024-01-15T10:30:00Z"
  },
  "student_status": "remedial_assigned"
}
```

**Error Responses**:

Missing fields (400):
```json
{
  "error": "Missing required fields: student_id, intervention_id, remedial_task"
}
```

Intervention not found (404):
```json
{
  "error": "Intervention not found"
}
```

**Status Codes**:
- `200 OK`: Intervention assigned
- `400 Bad Request`: Missing fields
- `404 Not Found`: Intervention doesn't exist
- `500 Internal Server Error`: Server error

**Side Effects**:
1. Intervention status → `assigned`
2. Student status → `remedial_assigned`
3. `mentor_responded_at` timestamp set
4. WebSocket event emitted (instant unlock)

**Example**:
```bash
curl -X POST http://localhost:3000/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "intervention_id": "550e8400-e29b-41d4-a716-446655440000",
    "remedial_task": "Read Chapter 4 on Focus Techniques and complete the practice exercises at the end."
  }'
```

---

### 4. Complete Remedial Task

Student marks assigned remedial task as complete. Returns student to normal state.

**Endpoint**: `POST /api/complete-task`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```typescript
{
  student_id: string;        // UUID of student (required)
  intervention_id: string;   // UUID of intervention (required)
}
```

**Success Response**:
```json
{
  "message": "Remedial task completed. Student returned to normal state.",
  "student_status": "on_track"
}
```

**Error Responses**:

Missing fields (400):
```json
{
  "error": "Missing required fields: student_id, intervention_id"
}
```

Intervention not found (404):
```json
{
  "error": "Intervention not found"
}
```

**Status Codes**:
- `200 OK`: Task completed
- `400 Bad Request`: Missing fields
- `404 Not Found`: Intervention doesn't exist
- `500 Internal Server Error`: Server error

**Side Effects**:
1. Intervention status → `completed`
2. Student status → `on_track`
3. `task_completed` → `true`
4. `task_completed_at` timestamp set
5. WebSocket event emitted

**Example**:
```bash
curl -X POST http://localhost:3000/api/complete-task \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "intervention_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

### 5. Get Student Status

Retrieve current student status and active intervention (if any).

**Endpoint**: `GET /api/student/:student_id/status`

**Parameters**:
- `student_id` (path parameter): UUID of student

**Response**:
```json
{
  "student": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "student@alcovia.com",
    "name": "Demo Student",
    "status": "on_track",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "active_intervention": null
}
```

**With Active Intervention**:
```json
{
  "student": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "student@alcovia.com",
    "name": "Demo Student",
    "status": "remedial_assigned",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "active_intervention": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "student_id": "123e4567-e89b-12d3-a456-426614174000",
    "remedial_task": "Read Chapter 4",
    "status": "assigned",
    "mentor_notified_at": "2024-01-15T09:00:00Z",
    "mentor_responded_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T09:00:00Z"
  }
}
```

**Error Responses**:

Missing student_id (400):
```json
{
  "error": "Missing student_id parameter"
}
```

Student not found (404):
```json
{
  "error": "Student not found"
}
```

**Status Codes**:
- `200 OK`: Status retrieved
- `400 Bad Request`: Missing parameter
- `404 Not Found`: Student doesn't exist
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl http://localhost:3000/api/student/123e4567-e89b-12d3-a456-426614174000/status
```

---

## WebSocket Events

**Connection URL**: `ws://localhost:3000` or `wss://your-app.railway.app`

### Client → Server Events

#### `join_student_room`
Join a student-specific room for targeted updates.

```javascript
socket.emit('join_student_room', 'student-uuid-here');
```

### Server → Client Events

#### `status_update`
Emitted when student status changes to `needs_intervention`.

```javascript
socket.on('status_update', (data) => {
  console.log(data);
  // {
  //   status: 'needs_intervention',
  //   message: 'Your performance needs attention...'
  // }
});
```

#### `intervention_assigned`
Emitted when mentor assigns a remedial task (instant unlock).

```javascript
socket.on('intervention_assigned', (data) => {
  console.log(data);
  // {
  //   status: 'remedial_assigned',
  //   remedial_task: 'Read Chapter 4',
  //   intervention_id: 'uuid',
  //   message: 'Your mentor has assigned a remedial task...'
  // }
});
```

#### `task_completed`
Emitted when student completes remedial task.

```javascript
socket.on('task_completed', (data) => {
  console.log(data);
  // {
  //   status: 'on_track',
  //   message: 'Great! You have completed your remedial task...'
  // }
});
```

---

## Data Models

### Student
```typescript
interface Student {
  id: string;                    // UUID
  email: string;                 // Unique email
  name: string;                  // Full name
  status: 'on_track' | 'needs_intervention' | 'remedial_assigned';
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

### Daily Log
```typescript
interface DailyLog {
  id: string;                    // UUID
  student_id: string;            // Foreign key
  quiz_score: number;            // 0-10
  focus_minutes: number;         // Minutes
  status: 'success' | 'failed';
  tab_switches?: number;         // Optional
  cheating_detected?: boolean;   // Optional
  logged_at: string;             // ISO timestamp
  notes?: string;                // Optional
}
```

### Intervention
```typescript
interface Intervention {
  id: string;                    // UUID
  student_id: string;            // Foreign key
  daily_log_id?: string;         // Foreign key (optional)
  mentor_notified_at: string;    // ISO timestamp
  mentor_responded_at?: string;  // ISO timestamp (optional)
  remedial_task?: string;        // Task description (optional)
  task_completed: boolean;       // Default: false
  task_completed_at?: string;    // ISO timestamp (optional)
  status: 'pending' | 'assigned' | 'completed' | 'auto_resolved';
  n8n_execution_id?: string;     // Optional
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

---

## Error Codes

| Status Code | Meaning | Common Causes |
|------------|---------|---------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Missing or invalid parameters |
| 404 | Not Found | Student or intervention doesn't exist |
| 500 | Internal Server Error | Database error, network issue, etc. |

---

## Rate Limiting

Currently not implemented. In production, consider:
- Max 100 requests per minute per IP
- Max 20 check-ins per day per student

---

## Testing with Postman

Import this Postman collection:

**Postman Collection JSON**:
```json
{
  "info": {
    "name": "Alcovia Intervention Engine",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Daily Check-in (Success)",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/daily-checkin",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"student_id\": \"{{student_id}}\",\n  \"quiz_score\": 8,\n  \"focus_minutes\": 70\n}"
        }
      }
    }
  ],
  "variable": [
    {"key": "base_url", "value": "http://localhost:3000/api"},
    {"key": "student_id", "value": "123e4567-e89b-12d3-a456-426614174000"}
  ]
}
```

---

## Support

For API issues:
- Check backend logs
- Verify Supabase connection
- Test with curl first
- Check CORS headers

---

**Next**: [Testing Guide](TESTING_GUIDE.md) for complete testing scenarios

