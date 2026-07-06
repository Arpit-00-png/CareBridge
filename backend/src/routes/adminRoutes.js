import express from 'express';
import { 
  getUnverifiedUsers, 
  verifyUser, 
  createRelation,
  getRelations,
  revokeRelation 
} from '../controllers/adminController.js';

import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users', getUnverifiedUsers);

router.put('/verify/:userId', verifyUser);
router.post('/relation', createRelation);
router.get('/relations', getRelations);         
router.put('/relation/revoke/:relationId', revokeRelation);

export default router;