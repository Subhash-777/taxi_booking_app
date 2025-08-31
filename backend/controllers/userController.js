import { asyncQuery } from '../config/database.js';
import { asyncHandler, executeParallel } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    try {
        // Parallel queries for user dashboard
        const operations = [
            asyncQuery('SELECT * FROM users WHERE id = ?', [userId]),
            asyncQuery('SELECT COUNT(*) as total_rides FROM rides WHERE user_id = ? AND status = "completed"', [userId]),
            asyncQuery('SELECT AVG(total_fare) as avg_fare FROM rides WHERE user_id = ? AND status = "completed"', [userId]),
            asyncQuery('SELECT * FROM rides WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId])
        ];
        
        const { results } = await executeParallel(operations);
        const [userResult, ridesCountResult, avgFareResult, recentRidesResult] = results;
        
        res.json({
            user: userResult[0],
            totalRides: ridesCountResult[0].total_rides,
            averageFare: avgFareResult[0].avg_fare || 0,
            recentRides: recentRidesResult
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

export const updateProfile = asyncHandler(async (req, res) => {
    const { name, phone } = req.body;
    const userId = req.user.id;
    
    try {
        await asyncQuery(
            'UPDATE users SET name = ?, phone = ? WHERE id = ?',
            [name, phone, userId]
        );
        
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export const addMoney = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id;
    
    try {
        await asyncQuery(
            'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
            [amount, userId]
        );
        
        const updatedUser = await asyncQuery('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
        
        res.json({ 
            success: true, 
            newBalance: updatedUser[0].wallet_balance 
        });
    } catch (error) {
        console.error('Add money error:', error);
        res.status(500).json({ error: 'Failed to add money' });
    }
});
