import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getGuardianPatients, getPatientDetails } from '../controllers/guardianController.js';

const router = express.Router();

router.use(authenticate);

router.get('/patients', getGuardianPatients);
router.get('/patient/:patientId', getPatientDetails);

export default router;