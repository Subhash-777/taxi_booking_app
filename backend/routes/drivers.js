import express from 'express';
import { updateLocation, toggleAvailability, getActiveRides, completeRide } from '../controllers/driversController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/location', authenticate, updateLocation);
router.post('/toggle-availability', authenticate, toggleAvailability);
router.get('/rides/active', authenticate, getActiveRides);
router.post('/rides/:rideId/complete', authenticate, completeRide);

export default router;
