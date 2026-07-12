import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getLogsByRelation } from '../controllers/logController.js';

const router = express.Router();

router.use(authenticate);
router.get('/:relationId', getLogsByRelation);

export default router;