import { asyncQuery } from '../config/database.js';
import { asyncHandler, executeParallel } from '../utils/asyncHandler.js';
import { io } from '../server.js';

export const updateLocation = asyncHandler(async (req, res) => {
    const { lat, lng } = req.body;
    const driverId = req.driver.id;
    
    try {
        await asyncQuery(
            'UPDATE drivers SET current_lat = ?, current_lng = ? WHERE id = ?',
            [lat, lng, driverId]
        );
        
        // Broadcast location to nearby users
        io.emit('driver_moved', {
            driverId,
            location: { lat, lng }
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

export const toggleAvailability = asyncHandler(async (req, res) => {
    const driverId = req.driver.id;
    
    try {
        const driver = await asyncQuery('SELECT is_available FROM drivers WHERE id = ?', [driverId]);
        const newStatus = !driver[0].is_available;
        
        await asyncQuery('UPDATE drivers SET is_available = ? WHERE id = ?', [newStatus, driverId]);
        
        res.json({ success: true, isAvailable: newStatus });
    } catch (error) {
        console.error('Toggle availability error:', error);
        res.status(500).json({ error: 'Failed to toggle availability' });
    }
});

export const getActiveRides = asyncHandler(async (req, res) => {
    const driverId = req.driver.id;
    
    try {
        const rides = await asyncQuery(`
            SELECT r.*, u.name as user_name, u.phone as user_phone 
            FROM rides r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.driver_id = ? AND r.status IN ('accepted', 'picked_up')
            ORDER BY r.created_at DESC
        `, [driverId]);
        
        res.json(rides);
    } catch (error) {
        console.error('Get active rides error:', error);
        res.status(500).json({ error: 'Failed to get active rides' });
    }
});

export const completeRide = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const driverId = req.driver.id;
    
    try {
        // Parallel operations for ride completion
        const operations = [
            asyncQuery('UPDATE rides SET status = "completed" WHERE id = ? AND driver_id = ?', [rideId, driverId]),
            asyncQuery('UPDATE drivers SET is_available = true WHERE id = ?', [driverId])
        ];
        
        await Promise.all(operations);
        
        // Get ride details for final calculations
        const ride = await asyncQuery('SELECT * FROM rides WHERE id = ?', [rideId]);
        
        if (ride.length > 0) {
            // Update user wallet (deduct fare)
            await asyncQuery(
                'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
                [ride[0].total_fare, ride[0].user_id]
            );
            
            // Notify user
            io.to(`user_${ride[0].user_id}`).emit('ride_completed', {
                rideId,
                totalFare: ride[0].total_fare
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Complete ride error:', error);
        res.status(500).json({ error: 'Failed to complete ride' });
    }
});
