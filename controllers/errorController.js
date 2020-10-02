const ErrorResponse = require('../utils/appError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  // eslint-disable-next-line no-console
  // console.log(err);
  error.message = err.message;

  if (process.env.NODE_ENV === 'production') {
    if (err.message.startsWith('Cannot read property')) {
      const message = `No document found, please check again!!`;
      error = new ErrorResponse(message, 404);
    }

    if (err.name === 'CastError') {
      const message = `Resource not found!`;
      error = new ErrorResponse(message, 404);
    }

    if (error.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.message.match(/(["'])(\\?.)*?\1/)[0];

      const message = `${field} with value ${value} already exists! Please enter another value!`;
      error = new ErrorResponse(message, 400);
    }

    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      error = new ErrorResponse(message, 400);
    }

    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid token. Please log in again!';
      error = new ErrorResponse(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
      const message = 'Your token has expired! Please log in again.';
      error = new ErrorResponse(message, 401);
    }

    res.status(error.statusCode || 500).json({
      status: error.status || 'fail',
      error: error.message || 'Internal server Error'
      //
    });
  } else if (process.env.NODE_ENV === 'development') {
    return res.status(error.statusCode || 500).json({
      status: error.status,
      error: error,
      message: err.message,
      stack: err.stack
    });
  }
};

module.exports = errorHandler;
