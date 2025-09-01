import { asyncQuery } from '../config/database.js';
import { asyncHandler, executeParallel } from '../utils/asyncHandler.js';
import { calculateFare, getSurgeMultiplier } from '../utils/pricing.js';
import { io } from '../server.js';
import axios from 'axios';

// Book a ride with parallel async operations and driver details
export const bookRide = asyncHandler(async (req, res) => {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, vehicle_type, pickup_address, dropoff_address } = req.body;
    const user_id = req.user.id;
    
    const startTime = Date.now();
    
    try {
        // Parallel async operations (enhanced Uber-like scenario)
        const operations = [
            // [1] Check wallet balance
            asyncQuery('SELECT wallet_balance FROM users WHERE id = ?', [user_id]),
            
            // [2] Get user trip history
            asyncQuery('SELECT COUNT(*) as trip_count FROM rides WHERE user_id = ? AND status = "completed"', [user_id]),
            
            // [3] Get pricing info
            asyncQuery('SELECT * FROM pricing WHERE vehicle_type = ?', [vehicle_type]),
            
            // [4] Find available drivers nearby with detailed information
            asyncQuery(`
                SELECT d.*, u.name, u.phone,
                (6371 * acos(cos(radians(?)) * cos(radians(d.current_lat)) * 
                cos(radians(d.current_lng) - radians(?)) + sin(radians(?)) * 
                sin(radians(d.current_lat)))) as distance
                FROM drivers d 
                JOIN users u ON d.user_id = u.id 
                WHERE d.is_available = true 
                AND d.vehicle_type = ?
                HAVING distance < 10
                ORDER BY distance
                LIMIT 10
            `, [pickup_lat, pickup_lng, pickup_lat, vehicle_type])
        ];
        
        const { results, responseTime: parallelTime } = await executeParallel(operations);
        const [walletResult, tripHistoryResult, pricingResult, availableDriversRaw] = results;
        
        // [5] External API call - Google Maps for distance/duration
        let distance = 5; // Default fallback
        let duration = 15; // Default fallback
        
        if (process.env.GOOGLE_MAPS_API_KEY) {
            try {
                const mapsResponse = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
                    params: {
                        origin: `${pickup_lat},${pickup_lng}`,
                        destination: `${dropoff_lat},${dropoff_lng}`,
                        key: process.env.GOOGLE_MAPS_API_KEY
                    }
                });
                
                if (mapsResponse.data.routes && mapsResponse.data.routes.length > 0) {
                    distance = mapsResponse.data.routes[0]?.legs[0]?.distance?.value / 1000 || 5; // km
                    duration = mapsResponse.data.routes[0]?.legs[0]?.duration?.value / 60 || 15; // minutes
                }
            } catch (mapsError) {
                console.error('Google Maps API error:', mapsError);
                // Continue with fallback values
            }
        }
        
        if (!availableDriversRaw.length) {
            return res.status(400).json({ 
                error: 'No drivers available in your area',
                message: 'Please try again in a few minutes or check a different location'
            });
        }
        
        // Enhance driver data with additional details
        const availableDrivers = availableDriversRaw.map(driver => ({
            id: driver.id,
            user_id: driver.user_id,
            name: driver.name,
            phone: driver.phone,
            license_number: driver.license_number,
            vehicle_type: driver.vehicle_type,
            vehicle_number: driver.vehicle_number,
            rating: parseFloat(driver.rating) || 4.9,
            distance: Math.round(driver.distance * 100) / 100, // Round to 2 decimal places
            eta: Math.ceil(driver.distance * 2.5), // Estimate: 2.5 minutes per km in city traffic
            current_lat: driver.current_lat,
            current_lng: driver.current_lng,
            // Add some dynamic data for better UX
            trips_completed: Math.floor(Math.random() * 500) + 100, // Simulated data
            years_experience: Math.floor(Math.random() * 8) + 2 // Simulated data
        }));
        
        // Calculate fare with surge pricing
        const baseFare = pricingResult[0]?.base_fare || 50;
        const surgeMultiplier = getSurgeMultiplier();
        const totalFare = calculateFare(distance, duration, pricingResult[0], surgeMultiplier);
        
        // Check wallet balance
        if (walletResult[0]?.wallet_balance < totalFare) {
            return res.status(400).json({ 
                error: 'Insufficient wallet balance',
                currentBalance: walletResult[0]?.wallet_balance || 0,
                requiredAmount: totalFare,
                shortfall: totalFare - (walletResult[0]?.wallet_balance || 0)
            });
        }
        
        // Create ride record with additional details
        const rideResult = await asyncQuery(`
            INSERT INTO rides 
            (user_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, 
             pickup_address, dropoff_address, distance, duration, base_fare, 
             surge_multiplier, total_fare, vehicle_type, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested')
        `, [user_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, 
            pickup_address, dropoff_address, distance, duration, baseFare, 
            surgeMultiplier, totalFare, vehicle_type]);
        
        const rideId = rideResult.insertId;
        
        // [6] Log analytics (non-blocking)
        const logOperation = asyncQuery(`
            INSERT INTO request_logs (user_id, request_type, request_data, response_time_ms) 
            VALUES (?, 'ride_booking', ?, ?)
        `, [user_id, JSON.stringify({ 
            pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, 
            vehicle_type, distance, total_fare: totalFare 
        }), parallelTime]);
        
        // Don't wait for logging
        logOperation.catch(console.error);
        
        // Emit ride request to nearest drivers
        availableDrivers.forEach(driver => {
            io.to(`driver_${driver.user_id}`).emit('ride_request', {
                rideId,
                pickup: { lat: pickup_lat, lng: pickup_lng },
                dropoff: { lat: dropoff_lat, lng: dropoff_lng },
                pickup_address,
                dropoff_address,
                fare: totalFare,
                distance,
                duration,
                vehicle_type,
                user_name: req.user.name,
                surge_multiplier: surgeMultiplier
            });
        });
        
        const totalResponseTime = Date.now() - startTime;
        
        res.json({
            success: true,
            rideId,
            estimatedFare: totalFare,
            distance: Math.round(distance * 100) / 100,
            duration: Math.ceil(duration),
            surgeMultiplier,
            availableDrivers, // Include full driver details for selection
            driversCount: availableDrivers.length,
            responseTime: totalResponseTime,
            parallelQueryTime: parallelTime,
            performance: `Response in ${totalResponseTime}ms vs traditional ~${parallelTime * 4}ms`
        });
        
    } catch (error) {
        console.error('Ride booking error:', error);
        res.status(500).json({ 
            error: 'Failed to book ride',
            message: 'Please try again or contact support if the problem persists'
        });
    }
});

// Accept ride (for driver interface, if needed later)
export const acceptRide = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const { driverId } = req.body; // Get driver ID from request body
    
    try {
        // Check if ride is still available
        const rideCheck = await asyncQuery('SELECT * FROM rides WHERE id = ? AND status = "requested"', [rideId]);
        
        if (rideCheck.length === 0) {
            return res.status(404).json({ 
                error: 'Ride not found or already accepted',
                message: 'This ride may have been taken by another driver'
            });
        }
        
        // Update ride and driver status in parallel
        const operations = [
            asyncQuery('UPDATE rides SET driver_id = ?, status = "accepted", updated_at = NOW() WHERE id = ? AND status = "requested"', 
                      [driverId, rideId]),
            asyncQuery('UPDATE drivers SET is_available = false WHERE id = ?', [driverId])
        ];
        
        const [rideUpdate] = await Promise.all(operations);
        
        if (rideUpdate.affectedRows === 0) {
            return res.status(409).json({ 
                error: 'Ride already accepted by another driver',
                message: 'Someone else got there first!'
            });
        }
        
        // Get complete ride details with user and driver info
        const ride = await asyncQuery(`
            SELECT r.*, 
                   u.name as user_name, u.phone as user_phone,
                   d.vehicle_type, d.vehicle_number, d.license_number,
                   du.name as driver_name, du.phone as driver_phone
            FROM rides r 
            JOIN users u ON r.user_id = u.id 
            JOIN drivers d ON r.driver_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE r.id = ?
        `, [rideId]);
        
        // Notify user about driver acceptance
        io.to(`user_${ride[0].user_id}`).emit('ride_accepted', {
            rideId,
            driver: {
                id: driverId,
                name: ride[0].driver_name,
                phone: ride[0].driver_phone,
                vehicle_type: ride[0].vehicle_type,
                vehicle_number: ride[0].vehicle_number,
                rating: 4.9 // Could be fetched from driver stats
            },
            estimatedArrival: 5, // minutes
            message: `${ride[0].driver_name} is on the way!`
        });
        
        res.json({ 
            success: true, 
            ride: ride[0],
            message: 'Ride accepted successfully'
        });
        
    } catch (error) {
        console.error('Accept ride error:', error);
        res.status(500).json({ 
            error: 'Failed to accept ride',
            message: 'Please try again'
        });
    }
});

// Update ride status (for various ride states)
export const updateRideStatus = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const { status, driver_id } = req.body;
    const userId = req.user.id;
    
    const validStatuses = ['requested', 'accepted', 'picked_up', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: 'Invalid status',
            validStatuses 
        });
    }
    
    try {
        // Update ride status
        const updateResult = await asyncQuery(
            'UPDATE rides SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
            [status, rideId, userId]
        );
        
        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ 
                error: 'Ride not found or unauthorized' 
            });
        }
        
        // If ride is completed, make driver available again
        if (status === 'completed' && driver_id) {
            await asyncQuery('UPDATE drivers SET is_available = true WHERE id = ?', [driver_id]);
        }
        
        // If ride is cancelled, make driver available again
        if (status === 'cancelled' && driver_id) {
            await asyncQuery('UPDATE drivers SET is_available = true WHERE id = ?', [driver_id]);
        }
        
        // Get updated ride details
        const updatedRide = await asyncQuery(`
            SELECT r.*, 
                   d.vehicle_type, d.vehicle_number,
                   u.name as driver_name
            FROM rides r 
            LEFT JOIN drivers d ON r.driver_id = d.id 
            LEFT JOIN users u ON d.user_id = u.id 
            WHERE r.id = ?
        `, [rideId]);
        
        // Emit status update to relevant parties
        io.to(`user_${userId}`).emit('ride_status_updated', {
            rideId,
            status,
            ride: updatedRide[0]
        });
        
        if (driver_id) {
            io.to(`driver_${driver_id}`).emit('ride_status_updated', {
                rideId,
                status,
                ride: updatedRide[0]
            });
        }
        
        res.json({ 
            success: true, 
            ride: updatedRide[0],
            message: `Ride status updated to ${status}`
        });
        
    } catch (error) {
        console.error('Update ride status error:', error);
        res.status(500).json({ 
            error: 'Failed to update ride status' 
        });
    }
});

// Get ride history with enhanced details
export const getRideHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 20, offset = 0, status } = req.query;
    
    try {
        let query = `
            SELECT r.*, 
                   d.vehicle_type, d.vehicle_number,
                   u.name as driver_name,
                   CASE 
                       WHEN r.status = 'completed' THEN 'success'
                       WHEN r.status = 'cancelled' THEN 'error'
                       ELSE 'warning'
                   END as status_type
            FROM rides r 
            LEFT JOIN drivers d ON r.driver_id = d.id 
            LEFT JOIN users u ON d.user_id = u.id 
            WHERE r.user_id = ?
        `;
        
        const params = [userId];
        
        // Add status filter if provided
        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const rides = await asyncQuery(query, params);
        
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM rides WHERE user_id = ?';
        const countParams = [userId];
        
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        
        const [countResult] = await asyncQuery(countQuery, countParams);
        
        res.json({
            success: true,
            rides: rides.map(ride => ({
                ...ride,
                created_at: new Date(ride.created_at).toISOString(),
                updated_at: new Date(ride.updated_at).toISOString(),
                // Add computed fields for better frontend experience
                duration_text: `${ride.duration} mins`,
                distance_text: `${ride.distance} km`,
                fare_text: `₹${ride.total_fare}`,
                status_display: ride.status.charAt(0).toUpperCase() + ride.status.slice(1)
            })),
            pagination: {
                total: countResult.total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + rides.length) < countResult.total
            }
        });
        
    } catch (error) {
        console.error('Get ride history error:', error);
        res.status(500).json({ 
            error: 'Failed to get ride history',
            message: 'Please try again later'
        });
    }
});

// Get single ride details
export const getRideDetails = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const userId = req.user.id;
    
    try {
        const ride = await asyncQuery(`
            SELECT r.*, 
                   d.vehicle_type, d.vehicle_number, d.license_number, d.rating as driver_rating,
                   u.name as driver_name, u.phone as driver_phone
            FROM rides r 
            LEFT JOIN drivers d ON r.driver_id = d.id 
            LEFT JOIN users u ON d.user_id = u.id 
            WHERE r.id = ? AND r.user_id = ?
        `, [rideId, userId]);
        
        if (ride.length === 0) {
            return res.status(404).json({ 
                error: 'Ride not found' 
            });
        }
        
        res.json({
            success: true,
            ride: {
                ...ride[0],
                created_at: new Date(ride[0].created_at).toISOString(),
                updated_at: new Date(ride[0].updated_at).toISOString()
            }
        });
        
    } catch (error) {
        console.error('Get ride details error:', error);
        res.status(500).json({ 
            error: 'Failed to get ride details' 
        });
    }
});

// Cancel ride
export const cancelRide = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;
    
    try {
        // Check if ride can be cancelled
        const ride = await asyncQuery(
            'SELECT * FROM rides WHERE id = ? AND user_id = ? AND status IN ("requested", "accepted")',
            [rideId, userId]
        );
        
        if (ride.length === 0) {
            return res.status(400).json({ 
                error: 'Ride cannot be cancelled',
                message: 'Ride not found or already in progress'
            });
        }
        
        // Update ride status to cancelled
        await asyncQuery(
            'UPDATE rides SET status = "cancelled", updated_at = NOW() WHERE id = ?',
            [rideId]
        );
        
        // Make driver available again if assigned
        if (ride[0].driver_id) {
            await asyncQuery('UPDATE drivers SET is_available = true WHERE id = ?', [ride[0].driver_id]);
            
            // Notify driver about cancellation
            io.to(`driver_${ride[0].driver_id}`).emit('ride_cancelled', {
                rideId,
                reason: reason || 'Cancelled by user',
                message: 'The ride has been cancelled'
            });
        }
        
        // Notify user about successful cancellation
        io.to(`user_${userId}`).emit('ride_cancelled', {
            rideId,
            message: 'Ride cancelled successfully'
        });
        
        res.json({ 
            success: true,
            message: 'Ride cancelled successfully'
        });
        
    } catch (error) {
        console.error('Cancel ride error:', error);
        res.status(500).json({ 
            error: 'Failed to cancel ride' 
        });
    }
});
