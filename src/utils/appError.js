export class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.expose = options.expose ?? statusCode < 500;
    this.cause = options.cause;
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error', cause) {
    super(500, message, { cause, expose: true });
    this.name = 'DatabaseError';
  }
}

export class UpstreamServiceError extends AppError {
  constructor(message = 'Upstream enrichment service failed', cause) {
    super(502, message, { cause, expose: true });
    this.name = 'UpstreamServiceError';
  }
}

export class SeedValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SeedValidationError';
  }
}
