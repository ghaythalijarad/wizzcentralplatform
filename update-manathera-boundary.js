#!/usr/bin/env node

/**
 * Update boundary for najaf_al_manathera region in DynamoDB
 * Sets proper GeoJSON Polygon coordinates for Al-Manathera district
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    }
});

const docClient = DynamoDBDocumentClient.from(client);

// Al-Manathera boundary coordinates
const manatheraBoundary = {
    type: 'Polygon',
    coordinates: [
        [
            [44.4642, 31.9322],
            [44.4686, 31.8885],
            [44.4734, 31.8692],
            [44.4848, 31.8472],
            [44.5198, 31.787],
            [44.5192, 31.753],
            [44.4949, 31.6699],
            [44.4816, 31.6021],
            [44.4201, 31.6099],
            [44.4034, 31.6821],
            [44.378, 31.7481],
            [44.3344, 31.8061],
            [44.2895, 31.8186],
            [44.2588, 31.8566],
            [44.2699, 31.892],
            [44.285, 31.9113],
            [44.3266, 31.915],
            [44.3872, 31.9352],
            [44.4544, 31.9357],
            [44.4642, 31.9322] // Closing point
        ]
    ]
};

async function updateManatheraBoundary() {
    const regionId = 'najaf_al_manathera';
    
    console.log('🔄 Updating boundary for Al-Manathera...');
    console.log('Region ID:', regionId);
    console.log('Polygon points:', manatheraBoundary.coordinates[0].length);
    
    try {
        const command = new UpdateCommand({
            TableName: 'WizzCentral_Regions',
            Key: { regionId },
            UpdateExpression: 'SET boundary = :boundary, updated_at = :updatedAt',
            ExpressionAttributeValues: {
                ':boundary': manatheraBoundary,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        });
        
        const result = await docClient.send(command);
        
        console.log('✅ Successfully updated Al-Manathera boundary!');
        console.log('\n📍 Updated region details:');
        console.log('  Region ID:', result.Attributes.regionId);
        console.log('  Name:', result.Attributes.name);
        console.log('  Name (Arabic):', result.Attributes.name_ar);
        console.log('  Level:', result.Attributes.level);
        console.log('  Parent:', result.Attributes.parent_id);
        console.log('  Boundary type:', result.Attributes.boundary?.type);
        console.log('  Polygon points:', result.Attributes.boundary?.coordinates?.[0]?.length || 0);
        console.log('  Updated at:', result.Attributes.updated_at);
        
        // Calculate approximate area (rough estimate)
        const coords = result.Attributes.boundary.coordinates[0];
        let minLat = coords[0][1], maxLat = coords[0][1];
        let minLng = coords[0][0], maxLng = coords[0][0];
        
        coords.forEach(([lng, lat]) => {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });
        
        console.log('\n📊 Bounding box:');
        console.log('  Latitude:', minLat.toFixed(4), 'to', maxLat.toFixed(4));
        console.log('  Longitude:', minLng.toFixed(4), 'to', maxLng.toFixed(4));
        console.log('  Approx dimensions:', 
            ((maxLat - minLat) * 111).toFixed(2), 'km (N-S) x',
            ((maxLng - minLng) * 111 * Math.cos(minLat * Math.PI / 180)).toFixed(2), 'km (E-W)');
        
    } catch (error) {
        console.error('❌ Failed to update boundary:', error.message);
        
        if (error.name === 'ResourceNotFoundException') {
            console.error('Table or region not found. Please check:');
            console.error('  1. Table name: WizzCentral_Regions');
            console.error('  2. Region ID:', regionId);
        } else if (error.name === 'ValidationException') {
            console.error('Invalid data format:', error.message);
        } else if (error.message?.includes('credentials')) {
            console.error('\n🔐 AWS credentials issue. Please run:');
            console.error('  aws sso login --profile wizz-drivers-ghayth-dev');
        }
        
        process.exit(1);
    }
}

// Run the update
updateManatheraBoundary()
    .then(() => {
        console.log('\n✨ Update complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
