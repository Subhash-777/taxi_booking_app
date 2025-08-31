import jwt from 'jsonwebtoken';
import { asyncQuery } from '../config/database.js';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await asyncQuery('SELECT * FROM users WHERE id = ?', [decoded.userId]);
        
        if (user.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        req.user = user[0];
        
        // If driver, get driver info
        if (decoded.isDriver) {
            const driver = await asyncQuery('SELECT * FROM drivers WHERE user_id = ?', [decoded.userId]);
            req.driver = driver[0];
        }
        
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
