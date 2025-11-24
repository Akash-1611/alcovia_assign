import express from 'express';
import { dailyCheckin } from '../controllers/checkinController';
import { 
  assignIntervention, 
  completeRemedialTask, 
  getStudentStatus 
} from '../controllers/interventionController';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Alcovia Intervention Engine is running' });
});

// Core endpoints
router.post('/daily-checkin', dailyCheckin);
router.post('/assign-intervention', assignIntervention);
router.post('/complete-task', completeRemedialTask);
router.get('/student/:student_id/status', getStudentStatus);

export default router;

