const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

async function addRegion(region) {
    await dynamoDB.send(new PutCommand({
        TableName: 'WizzCentral_Regions',
        Item: region
    }));
    console.log(`✅ Added: ${region.name}`);
}

async function populate() {
    console.log('📝 Adding test regions...');
    
    await addRegion({
        regionId: 'iraq',
        name: 'Iraq',
        name_ar: 'العراق',
        level: 'country',
        parent_id: null,
        is_active: true,
        coordinates: { lat: 33.2232, lng: 43.6793, radius: 1000000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    await addRegion({
        regionId: 'baghdad',
        name: 'Baghdad',
        name_ar: 'بغداد',
        level: 'governorate',
        parent_id: 'iraq',
        is_active: true,
        coordinates: { lat: 33.3152, lng: 44.3661, radius: 50000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    await addRegion({
        regionId: 'basra',
        name: 'Basra',
        name_ar: 'البصرة',
        level: 'governorate',
        parent_id: 'iraq',
        is_active: false,
        coordinates: { lat: 30.5085, lng: 47.7804, radius: 45000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    console.log('🎉 Test regions added successfully!');
}

populate().catch(console.error);
