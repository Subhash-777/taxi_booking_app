import express from 'express';
import { 
    bookRide, 
    acceptRide, 
    getRideHistory, 
    getRideDetails,
    updateRideStatus,
    cancelRide 
} from '../controllers/rideController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// Book a new ride
router.post('/book', authenticate, validate(schemas.bookRide), bookRide);

// Accept a ride (for driver functionality if needed)
router.post('/:rideId/accept', authenticate, acceptRide);

// Update ride status
router.put('/:rideId/status', authenticate, updateRideStatus);

// Cancel a ride
router.put('/:rideId/cancel', authenticate, cancelRide);

// Get ride history
router.get('/history', authenticate, getRideHistory);

// Get single ride details
router.get('/:rideId', authenticate, getRideDetails);

export default router;
