import logger from '../utils/logger.js';

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle database errors
const handleDatabaseError = (error) => {
  let message = 'Database error occurred';
  let statusCode = 500;

  if (error.code === 'ER_DUP_ENTRY') {
    message = 'Duplicate entry. Resource already exists.';
    statusCode = 409;
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    message = 'Referenced resource does not exist.';
    statusCode = 400;
  } else if (error.code === 'ER_BAD_FIELD_ERROR') {
    message = 'Invalid field in query.';
    statusCode = 400;
  }

  return new AppError(message, statusCode);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const handleValidationError = (error) => {
  const errors = Object.values(error.details).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    
    logger.error('ERROR 💥', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.code?.startsWith('ER_')) error = handleDatabaseError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'ValidationError') error = handleValidationError(error);

    sendErrorProd(error, req, res);
  }
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { AppError, errorHandler, asyncHandler };
