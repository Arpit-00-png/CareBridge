import express from 'express';
import { getUnverifiedUsers, verifyUser } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users', getUnverifiedUsers);

router.put('/verify/:userId', verifyUser);

export default router;