import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { addGuardian, getPatientGuardians, removeGuardian } from '../controllers/patientController.js';

const router = express.Router();

router.use(authenticate);

router.post('/add-guardian', addGuardian);
router.get('/guardians', getPatientGuardians);
router.delete('/guardian/:guardianId', removeGuardian);

export default router;