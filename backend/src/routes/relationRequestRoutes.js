import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  createRequest,
  getPendingRequests,
  handleRequest,
  getDoctorRequests
} from '../controllers/relationRequestController.js';

const router = express.Router();

router.use(authenticate);

router.post('/request', createRequest);
router.get('/doctor/requests', getDoctorRequests);

router.get('/pending', authorize('ADMIN'), getPendingRequests);
router.put('/handle/:requestId', authorize('ADMIN'), handleRequest);

export default router;