import { MongoServerError } from 'mongodb';

import { AppError, DatabaseError } from '../utils/appError.js';

export function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && error.type === 'entity.parse.failed') {
    res.status(400).json({
      status: 'error',
      message: 'Invalid JSON body'
    });
    return;
  }

  if (error instanceof MongoServerError || error instanceof DatabaseError) {
    res.status(500).json({
      status: 'error',
      message: 'Database error'
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}
