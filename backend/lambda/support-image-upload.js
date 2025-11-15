/**
 * Support Chat Image Upload Handler
 * Handles image uploads for merchant support chat
 * Author: WizzCentral Dev Team
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.SUPPORT_IMAGES_BUCKET || 'whizz-support-chat-images';
const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

/**
 * Lambda handler for image upload
 */
exports.handler = async (event) => {
    console.log('📤 Image Upload Request:', JSON.stringify(event, null, 2));

    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: 'CORS preflight successful' })
            };
        }

        // Handle GET request for presigned URL generation
        if (event.httpMethod === 'GET') {
            return await generatePresignedUrl(event);
        }

        // Handle POST request for direct image upload
        if (event.httpMethod === 'POST') {
            return await handleDirectUpload(event);
        }

        return {
            statusCode: 405,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('❌ Image Upload Error:', error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

/**
 * Generate presigned URL for image upload
 */
async function generatePresignedUrl(event) {
    try {
        const queryParams = event.queryStringParameters || {};
        const { sessionId, merchantId, fileName } = queryParams;

        if (!sessionId || !merchantId || !fileName) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    error: 'Missing required parameters: sessionId, merchantId, fileName' 
                })
            };
        }

        // Generate unique S3 key
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const s3Key = `support-chat/${sessionId}/${merchantId}/${timestamp}-${fileName}`;
        
        // Create presigned URL for PUT operation
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
            Metadata: {
                sessionId,
                merchantId,
                uploadedAt: new Date().toISOString()
            }
        });

        const presignedUrl = await getSignedUrl(s3Client, putCommand, { 
            expiresIn: 300 // 5 minutes
        });

        const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

        console.log('✅ Generated presigned URL for:', s3Key);

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                presignedUrl,
                imageUrl,
                expiresIn: 300
            })
        };

    } catch (error) {
        console.error('❌ Error generating presigned URL:', error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ 
                error: 'Failed to generate presigned URL',
                message: error.message 
            })
        };
    }
}

/**
 * Handle direct image upload (POST)
 */
async function handleDirectUpload(event) {
    try {
        // Parse request body
        let body;
        if (event.body) {
            // Handle base64 encoded body (for API Gateway)
            const bodyString = event.isBase64Encoded 
                ? Buffer.from(event.body, 'base64').toString('utf-8')
                : event.body;
            
            try {
                body = JSON.parse(bodyString);
            } catch (e) {
                // If not JSON, it might be multipart form data
                // For simplicity, we'll use presigned URLs instead
                body = { error: 'Invalid request format' };
            }
        }

        const sessionId = body?.sessionId || event.queryStringParameters?.sessionId;
        const merchantId = body?.merchantId || event.queryStringParameters?.merchantId;
        const fileName = body?.fileName || 'uploaded-image.jpg';
        const imageData = body?.imageData; // Base64 encoded image

        if (!sessionId || !merchantId || !imageData) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    error: 'Missing required parameters: sessionId, merchantId, imageData' 
                })
            };
        }

        // Generate unique S3 key
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const s3Key = `support-chat/${sessionId}/${merchantId}/${timestamp}-${fileName}`;

        // Decode base64 image data
        const imageBuffer = Buffer.from(imageData, 'base64');
        const contentType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

        // Upload directly to S3
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: imageBuffer,
            ContentType: contentType,
            Metadata: {
                sessionId,
                merchantId,
                uploadedAt: new Date().toISOString()
            }
        });

        await s3Client.send(putCommand);
        
        const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
        
        console.log('✅ Image uploaded successfully:', s3Key);

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                imageUrl,
                s3Key
            })
        };

    } catch (error) {
        console.error('❌ Error uploading image:', error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ 
                error: 'Failed to upload image',
                message: error.message 
            })
        };
    }
}
        const merchantId = body?.merchantId || event.queryStringParameters?.merchantId;
        const fileName = body?.fileName || event.queryStringParameters?.fileName || 
                        `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

        if (!sessionId || !merchantId) {
            return createResponse(400, { 
                error: 'Missing required parameters: sessionId and merchantId' 
            });
        }

        // Generate S3 key
        const s3Key = `support-chat/${sessionId}/${fileName}`;

        // Determine content type from file extension
        const extension = fileName.split('.').pop().toLowerCase();
        const contentType = extension === 'png' ? 'image/png' : 
                           extension === 'gif' ? 'image/gif' :
                           extension === 'webp' ? 'image/webp' : 'image/jpeg';

        // Method 1: Return presigned URL for client-side upload
        if (event.httpMethod === 'GET' || body?.requestPresignedUrl) {
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: s3Key,
                ContentType: contentType,
                Metadata: {
                    sessionId,
                    merchantId,
                    uploadedAt: new Date().toISOString()
                }
            });

            // Generate presigned URL valid for 5 minutes
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

            return createResponse(200, {
                success: true,
                presignedUrl,
                imageUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`,
                s3Key,
                expiresIn: 300
            });
        }

        // Method 2: Direct upload (for base64 image data)
        if (body?.imageData) {
            const imageBuffer = Buffer.from(body.imageData, 'base64');

            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: imageBuffer,
                ContentType: contentType,
                Metadata: {
                    sessionId,
                    merchantId,
                    uploadedAt: new Date().toISOString()
                }
            });

            await s3Client.send(command);

            const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

            console.log(`✅ Image uploaded successfully: ${imageUrl}`);

            return createResponse(200, {
                success: true,
                imageUrl,
                s3Key,
                size: imageBuffer.length
            });
        }

        // If neither method is specified, return presigned URL by default
        return createResponse(400, {
            error: 'Invalid request: either request presigned URL or provide imageData'
        });

    } catch (error) {
        console.error('❌ Image Upload Error:', error);
        return createResponse(500, {
            error: 'Failed to process image upload',
            message: error.message
        });
    }
};

/**
 * Create HTTP response
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body)
    };
}
