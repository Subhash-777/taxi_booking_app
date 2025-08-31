import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncQuery } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone, isDriver, vehicleDetails } = req.body;
    
    try {
        // Check if user exists
        const existingUser = await asyncQuery('SELECT id FROM users WHERE email = ?', [email]);
        
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const userResult = await asyncQuery(
            'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, phone]
        );
        
        const userId = userResult.insertId;
        
        // If driver, create driver record
        if (isDriver && vehicleDetails) {
            await asyncQuery(`
                INSERT INTO drivers (user_id, license_number, vehicle_type, vehicle_number, is_available) 
                VALUES (?, ?, ?, ?, true)
            `, [userId, vehicleDetails.licenseNumber, vehicleDetails.vehicleType, vehicleDetails.vehicleNumber]);
        }
        
        // Generate JWT
        const token = jwt.sign({ userId, isDriver }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        res.status(201).json({
            success: true,
            token,
            user: { id: userId, name, email, isDriver }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Get user with driver info in parallel
        const [userResult, driverResult] = await Promise.all([
            asyncQuery('SELECT * FROM users WHERE email = ?', [email]),
            asyncQuery(`
                SELECT d.* FROM drivers d 
                JOIN users u ON d.user_id = u.id 
                WHERE u.email = ?
            `, [email])
        ]);
        
        if (userResult.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const user = userResult[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const isDriver = driverResult.length > 0;
        const token = jwt.sign({ userId: user.id, isDriver }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        res.json({
            success: true,
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                isDriver,
                driverInfo: isDriver ? driverResult[0] : null
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
