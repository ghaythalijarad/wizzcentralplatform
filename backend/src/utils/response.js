// HTTP response utilities for Lambda functions

class ResponseHelper {
  static success(data, statusCode = 200) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    };
  }

  static error(message, statusCode = 400, details = null) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: {
          message,
          details,
          statusCode
        },
        timestamp: new Date().toISOString()
      })
    };
  }

  static validation(errors) {
    return this.error('Validation failed', 422, errors);
  }

  static badRequest(message = 'Bad request') {
    return this.error(message, 400);
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return this.error(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return this.error(message, 404);
  }

  static conflict(message = 'Resource already exists') {
    return this.error(message, 409);
  }

  static serverError(message = 'Internal server error') {
    return this.error(message, 500);
  }

  static cors() {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
      },
      body: ''
    };
  }
}

module.exports = ResponseHelper;
