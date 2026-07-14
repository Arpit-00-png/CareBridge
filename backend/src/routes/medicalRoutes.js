import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createAppointment, getAppointments } from '../controllers/appointmentController.js';
import { 
  createPrescription, 
  getPrescriptions
} from '../controllers/prescriptionController.js';
import { getPatientPrescriptions, getPatientAppointments } from '../controllers/medicalController.js';

const router = express.Router();

// ✅ Sabse pehle authenticate lagao sab routes ke liye
router.use(authenticate);

// Patient routes (authenticate ke baad)
router.get('/patient/prescriptions', getPatientPrescriptions);
router.get('/patient/appointments', getPatientAppointments);

// Doctor routes (authenticate + authorize)
router.post('/prescription', authorize('DOCTOR'), createPrescription);
router.get('/prescription/:relationId', getPrescriptions);

router.post('/appointment', authorize('DOCTOR'), createAppointment);
router.get('/appointment/:relationId', getAppointments);

export default router;