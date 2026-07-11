import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getGroupByRelation, getMessages } from '../controllers/chatController.js';

const router = express.Router();

router.use(authenticate);

router.get('/group/:relationId', getGroupByRelation);
router.get('/messages/:relationId', getMessages);

export default router;