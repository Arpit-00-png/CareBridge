import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getDoctorPatients, getPatientDoctors } from '../controllers/dashboardController.js';

const router = express.Router();

router.use(authenticate);

router.get('/doctor/patients', getDoctorPatients);
router.get('/patient/doctors', getPatientDoctors);

export default router;