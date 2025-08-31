import { asyncQuery } from '../config/database.js';
import { asyncHandler, executeParallel } from '../utils/asyncHandler.js';
import { calculateFare, getSurgeMultiplier } from '../utils/pricing.js';
import { io } from '../server.js';
import axios from 'axios';

// Book a ride with parallel async operations
export const bookRide = asyncHandler(async (req, res) => {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, vehicle_type } = req.body;
    const user_id = req.user.id;
    
    const startTime = Date.now();
    
    try {
        // Parallel async operations (simulating the Uber scenario)
        const operations = [
            // [1] Check wallet balance
            asyncQuery('SELECT wallet_balance FROM users WHERE id = ?', [user_id]),
            
            // [2] Get user trip history
            asyncQuery('SELECT COUNT(*) as trip_count FROM rides WHERE user_id = ? AND status = "completed"', [user_id]),
            
            // [3] Get pricing info
            asyncQuery('SELECT * FROM pricing WHERE vehicle_type = ?', [vehicle_type]),
            
            // [4] Find available drivers nearby
            asyncQuery(`
                SELECT d.*, u.name, u.phone 
                FROM drivers d 
                JOIN users u ON d.user_id = u.id 
                WHERE d.is_available = true 
                AND d.vehicle_type = ?
                AND (6371 * acos(cos(radians(?)) * cos(radians(d.current_lat)) * 
                cos(radians(d.current_lng) - radians(?)) + sin(radians(?)) * 
                sin(radians(d.current_lat)))) < 10
                ORDER BY (6371 * acos(cos(radians(?)) * cos(radians(d.current_lat)) * 
                cos(radians(d.current_lng) - radians(?)) + sin(radians(?)) * 
                sin(radians(d.current_lat))))
                LIMIT 5
            `, [vehicle_type, pickup_lat, pickup_lng, pickup_lat, pickup_lat, pickup_lng, pickup_lat])
        ];
        
        const { results, responseTime: parallelTime } = await executeParallel(operations);
        const [walletResult, tripHistoryResult, pricingResult, availableDrivers] = results;
        
        // [5] External API call - Google Maps for distance/duration
        const mapsResponse = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
            params: {
                origin: `${pickup_lat},${pickup_lng}`,
                destination: `${dropoff_lat},${dropoff_lng}`,
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });
        
        if (!availableDrivers.length) {
            return res.status(400).json({ error: 'No drivers available in your area' });
        }
        
        const distance = mapsResponse.data.routes[0]?.legs[0]?.distance?.value / 1000 || 5; // km
        const duration = mapsResponse.data.routes[0]?.legs[0]?.duration?.value / 60 || 15; // minutes
        
        // Calculate fare with surge pricing
        const baseFare = pricingResult[0].base_fare;
        const surgeMultiplier = getSurgeMultiplier();
        const totalFare = calculateFare(distance, duration, pricingResult[0], surgeMultiplier);
        
        // Check wallet balance
        if (walletResult[0].wallet_balance < totalFare) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }
        
        // Create ride record
        const rideResult = await asyncQuery(`
            INSERT INTO rides 
            (user_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, distance, 
             duration, base_fare, surge_multiplier, total_fare, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested')
        `, [user_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, 
            distance, duration, baseFare, surgeMultiplier, totalFare]);
        
        const rideId = rideResult.insertId;
        
        // [4] Log analytics (parallel)
        const logOperation = asyncQuery(`
            INSERT INTO request_logs (user_id, request_type, request_data, response_time_ms) 
            VALUES (?, 'ride_booking', ?, ?)
        `, [user_id, JSON.stringify({ pickup_lat, pickup_lng, dropoff_lat, dropoff_lng }), parallelTime]);
        
        // Don't wait for logging
        logOperation.catch(console.error);
        
        // Emit to nearest drivers
        availableDrivers.forEach(driver => {
            io.to(`driver_${driver.user_id}`).emit('ride_request', {
                rideId,
                pickup: { lat: pickup_lat, lng: pickup_lng },
                dropoff: { lat: dropoff_lat, lng: dropoff_lng },
                fare: totalFare,
                distance,
                duration
            });
        });
        
        const totalResponseTime = Date.now() - startTime;
        
        res.json({
            success: true,
            rideId,
            estimatedFare: totalFare,
            availableDrivers: availableDrivers.length,
            responseTime: totalResponseTime,
            parallelQueryTime: parallelTime,
            performance: `Response in ${totalResponseTime}ms vs traditional ~${parallelTime * 4}ms`
        });
        
    } catch (error) {
        console.error('Ride booking error:', error);
        res.status(500).json({ error: 'Failed to book ride' });
    }
});

export const acceptRide = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const driverId = req.driver.id;
    
    try {
        // Update ride and driver status in parallel
        const operations = [
            asyncQuery('UPDATE rides SET driver_id = ?, status = "accepted" WHERE id = ? AND status = "requested"', 
                      [driverId, rideId]),
            asyncQuery('UPDATE drivers SET is_available = false WHERE id = ?', [driverId])
        ];
        
        await Promise.all(operations);
        
        // Get ride details
        const ride = await asyncQuery(`
            SELECT r.*, u.name as user_name, u.phone as user_phone 
            FROM rides r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.id = ?
        `, [rideId]);
        
        if (ride.length === 0) {
            return res.status(404).json({ error: 'Ride not found or already accepted' });
        }
        
        // Notify user
        io.to(`user_${ride[0].user_id}`).emit('ride_accepted', {
            rideId,
            driver: req.driver,
            estimatedArrival: 5 // minutes
        });
        
        res.json({ success: true, ride: ride[0] });
        
    } catch (error) {
        console.error('Accept ride error:', error);
        res.status(500).json({ error: 'Failed to accept ride' });
    }
});

export const getRideHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    try {
        const rides = await asyncQuery(`
            SELECT r.*, d.vehicle_type, u.name as driver_name 
            FROM rides r 
            LEFT JOIN drivers d ON r.driver_id = d.id 
            LEFT JOIN users u ON d.user_id = u.id 
            WHERE r.user_id = ? 
            ORDER BY r.created_at DESC 
            LIMIT 20
        `, [userId]);
        
        res.json(rides);
    } catch (error) {
        console.error('Get ride history error:', error);
        res.status(500).json({ error: 'Failed to get ride history' });
    }
});
