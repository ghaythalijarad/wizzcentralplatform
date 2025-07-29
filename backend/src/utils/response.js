// HTTP response utilities for Lambda functions

class ResponseHelper {
  static success(statusCode = 200, data = null, message = null) {
    const response = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
    
    if (message) {
      response.message = message;
    }
    
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
      },
      body: JSON.stringify(response)
    };
  }

  static error(statusCode = 400, message = 'An error occurred', details = null) {
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
    return this.error(422, 'Validation failed', errors);
  }

  static badRequest(message = 'Bad request') {
    return this.error(400, message);
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return this.error(403, message);
  }

  static notFound(message = 'Resource not found') {
    return this.error(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return this.error(409, message);
  }

  static serverError(message = 'Internal server error') {
    return this.error(500, message);
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
