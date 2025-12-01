const crypto = require('crypto');

/**
 * Signs a request for QZ Tray using a private key.
 * This is required for silent printing without popups.
 * 
 * @param {Object} event - The Lambda event object
 * @returns {Object} - The Lambda response object containing the signature
 */
exports.signRequest = async (event) => {
  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const request = body.request;

    if (!request) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Missing request parameter' }),
      };
    }

    // Get the private key from environment variables
    // In a real production environment, this should be fetched from AWS Secrets Manager
    // For now, we'll use a placeholder or expect it in ENV
    const privateKey = process.env.QZ_PRIVATE_KEY;

    if (!privateKey) {
      console.error('QZ_PRIVATE_KEY is not defined in environment variables');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Server configuration error' }),
      };
    }

    // Create the signature
    const signer = crypto.createSign('SHA512');
    signer.update(request);
    const signature = signer.sign(privateKey, 'base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ signature }),
    };
  } catch (error) {
    console.error('Error signing QZ Tray request:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};
