import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncQuery } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// Register endpoint
router.post('/register', validate(schemas.register), asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.validatedBody;

  // Check if user already exists
  const existingUser = await asyncQuery('SELECT id FROM users WHERE email = ?', [email]);
  
  if (existingUser.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'User with this email already exists'
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const result = await asyncQuery(
    'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, phone || null]
  );

  // Generate JWT token
  const token = jwt.sign(
    { id: result.insertId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Get the created user (without password)
  const newUser = await asyncQuery(
    'SELECT id, name, email, phone, wallet_balance, created_at FROM users WHERE id = ?',
    [result.insertId]
  );

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    token,
    user: newUser[0]
  });
}));

// Login endpoint
router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  const { email, password } = req.validatedBody;

  // Get user with password
  const users = await asyncQuery('SELECT * FROM users WHERE email = ?', [email]);
  
  if (users.length === 0) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid email or password'
    });
  }

  const user = users[0];

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    return res.status(401).json({
      status: 'error', 
      message: 'Invalid email or password'
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Remove password from user object
  delete user.password;

  res.json({
    status: 'success',
    message: 'Login successful',
    token,
    user
  });
}));

// Logout endpoint (optional - mainly for token blacklisting in production)
router.post('/logout', asyncHandler(async (req, res) => {
  // In a production app, you might want to blacklist the token here
  res.json({
    status: 'success',
    message: 'Logout successful'
  });
}));

// Get current user profile (protected route)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await asyncQuery(
      'SELECT id, name, email, phone, wallet_balance, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (user.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    res.json({
      status: 'success',
      user: user[0]
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
});

export default router;
