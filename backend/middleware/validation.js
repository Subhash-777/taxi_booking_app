import joi from 'joi';
import { AppError } from './errorHandler.js';

const schemas = {
  register: joi.object({
    name: joi.string().min(2).max(50).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 50 characters',
      'any.required': 'Name is required'
    }),
    email: joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    phone: joi.string().pattern(new RegExp('^[+]?[(]?\\d{10,15}$')).messages({
      'string.pattern.base': 'Please provide a valid phone number'
    })
  }),

  login: joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
  }),

  bookRide: joi.object({
    pickup_lat: joi.number().min(-90).max(90).required().messages({
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Pickup latitude is required'
    }),
    pickup_lng: joi.number().min(-180).max(180).required().messages({
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Pickup longitude is required'
    }),
    dropoff_lat: joi.number().min(-90).max(90).required(),
    dropoff_lng: joi.number().min(-180).max(180).required(),
    vehicle_type: joi.string().valid('hatchback', 'sedan', 'suv').required().messages({
      'any.only': 'Vehicle type must be one of: hatchback, sedan, suv'
    }),
    pickup_address: joi.string().max(200),
    dropoff_address: joi.string().max(200)
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }

    req.validatedBody = value;
    next();
  };
};

export { schemas, validate };