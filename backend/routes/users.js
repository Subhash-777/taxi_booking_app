import express from 'express';
import { getProfile, updateProfile, addMoney } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/wallet/add-money', authenticate, addMoney);

export default router;
