import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createPrescription, getPrescriptions } from '../controllers/prescriptionController.js';
import { createAppointment, getAppointments } from '../controllers/appointmentController.js';

const router = express.Router();

router.use(authenticate);

router.post('/prescription', authorize('DOCTOR'), createPrescription);
router.get('/prescription/:relationId', getPrescriptions);

router.post('/appointment', authorize('DOCTOR'), createAppointment);
router.get('/appointment/:relationId', getAppointments);

export default router;