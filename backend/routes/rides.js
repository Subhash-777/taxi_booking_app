import express from 'express';
import { bookRide, acceptRide, getRideHistory } from '../controllers/rideController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/book', authenticate, bookRide);
router.post('/:rideId/accept', authenticate, acceptRide);
router.get('/history', authenticate, getRideHistory);

export default router;
