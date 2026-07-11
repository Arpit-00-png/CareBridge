import express from 'express';
import { 
  getUnverifiedUsers, 
  verifyUser, 
  createRelation,
  getRelations,
  revokeRelation,
  getAllUsers,
  getAllVerifiedUsers,
  getAllVerifiedPatients
} from '../controllers/adminController.js';

import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/verified-patients', authenticate, getAllVerifiedPatients);

router.use(authorize('ADMIN'));

router.get('/users', getUnverifiedUsers);
router.get('/all-users', getAllVerifiedUsers);
router.put('/verify/:userId', verifyUser);
router.post('/relation', createRelation);
router.get('/relations', getRelations);         
router.put('/relation/revoke/:relationId', revokeRelation);


export default router;