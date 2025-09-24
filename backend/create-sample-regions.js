// Create sample regions data for WizzCentral_Regions table
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, CreateTableCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ 
  region: 'us-east-1',
  endpoint: 'http://localhost:8000'
});
const docClient = DynamoDBDocumentClient.from(client);

// Sample Iraqi regions data based on the expected structure
const sampleRegions = [
  // Iraq (Country)
  {
    id: 'iraq',
    name: 'Iraq',
    name_ar: 'العراق',
    level: 'country',
    parent_id: null,
    governorate_id: null,
    coordinates: {
      lat: 33.2232,
      lng: 43.6793,
      radius: 500000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: true,
      standard: true
    },
    statistics: {
      population: 40372771,
      area_km2: 438317,
      total_orders: 125000,
      active_drivers: 3500
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  // Baghdad Governorate
  {
    id: 'baghdad-gov',
    name: 'Baghdad',
    name_ar: 'بغداد',
    level: 'governorate',
    parent_id: 'iraq',
    governorate_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3152,
      lng: 44.3661,
      radius: 50000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: true,
      standard: true
    },
    statistics: {
      population: 8126755,
      area_km2: 4555,
      total_orders: 45000,
      active_drivers: 1200
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  // Baghdad Districts
  {
    id: 'karada-district',
    name: 'Al-Karada',
    name_ar: 'الكرادة',
    level: 'district',
    parent_id: 'baghdad-gov',
    governorate_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3089,
      lng: 44.4205,
      radius: 5000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: true,
      standard: true
    },
    statistics: {
      population: 180000,
      area_km2: 15.5,
      total_orders: 8500,
      active_drivers: 85
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  {
    id: 'mansour-district',
    name: 'Al-Mansour',
    name_ar: 'المنصور',
    level: 'district',
    parent_id: 'baghdad-gov',
    governorate_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3061,
      lng: 44.3451,
      radius: 5000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: true,
      standard: true
    },
    statistics: {
      population: 220000,
      area_km2: 18.2,
      total_orders: 9200,
      active_drivers: 95
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  // Basra Governorate
  {
    id: 'basra-gov',
    name: 'Basra',
    name_ar: 'البصرة',
    level: 'governorate',
    parent_id: 'iraq',
    governorate_id: 'basra-gov',
    coordinates: {
      lat: 30.5085,
      lng: 47.7804,
      radius: 40000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: false,
      standard: true
    },
    statistics: {
      population: 2750000,
      area_km2: 19070,
      total_orders: 18500,
      active_drivers: 320
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  // Erbil Governorate  
  {
    id: 'erbil-gov',
    name: 'Erbil',
    name_ar: 'أربيل',
    level: 'governorate',
    parent_id: 'iraq',
    governorate_id: 'erbil-gov',
    coordinates: {
      lat: 36.1911,
      lng: 44.0093,
      radius: 35000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: true,
      standard: true
    },
    statistics: {
      population: 1612700,
      area_km2: 15074,
      total_orders: 12800,
      active_drivers: 285
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  // More districts for variety
  {
    id: 'adhamiya-district',
    name: 'Al-Adhamiya',
    name_ar: 'الأعظمية',
    level: 'district',
    parent_id: 'baghdad-gov',
    governorate_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3756,
      lng: 44.3831,
      radius: 4000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: true,
      standard: true
    },
    statistics: {
      population: 165000,
      area_km2: 12.8,
      total_orders: 6800,
      active_drivers: 72
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  {
    id: 'sadr-city-district',
    name: 'Sadr City',
    name_ar: 'مدينة الصدر',
    level: 'district',
    parent_id: 'baghdad-gov',
    governorate_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3739,
      lng: 44.4644,
      radius: 6000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: false,
      standard: true
    },
    statistics: {
      population: 2400000,
      area_km2: 95.0,
      total_orders: 15600,
      active_drivers: 185
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  // Neighborhoods 
  {
    id: 'jadriya-neighborhood',
    name: 'Al-Jadriya',
    name_ar: 'الجادرية',
    level: 'neighborhood',
    parent_id: 'karada-district',
    governorate_id: 'baghdad-gov',
    coordinates: {
      lat: 33.2875,
      lng: 44.3969,
      radius: 2000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: true,
      standard: true
    },
    statistics: {
      population: 45000,
      area_km2: 3.2,
      total_orders: 2100,
      active_drivers: 25
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  {
    id: 'karrada-center-neighborhood',
    name: 'Karrada Center',
    name_ar: 'مركز الكرادة',
    level: 'neighborhood',
    parent_id: 'karada-district',
    governorate_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3106,
      lng: 44.4207,
      radius: 1500
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: true,
      standard: true
    },
    statistics: {
      population: 62000,
      area_km2: 2.8,
      total_orders: 3200,
      active_drivers: 35
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  // Mosul Governorate
  {
    id: 'mosul-gov',
    name: 'Nineveh',
    name_ar: 'نينوى',
    level: 'governorate',
    parent_id: 'iraq',
    governorate_id: 'mosul-gov',
    coordinates: {
      lat: 36.335,
      lng: 43.1182,
      radius: 45000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: false,
      standard: true
    },
    statistics: {
      population: 3270000,
      area_km2: 37323,
      total_orders: 8900,
      active_drivers: 156
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  },
  
  // Najaf Governorate
  {
    id: 'najaf-gov',
    name: 'Najaf',
    name_ar: 'النجف',
    level: 'governorate',
    parent_id: 'iraq',
    governorate_id: 'najaf-gov',
    coordinates: {
      lat: 32.0258,
      lng: 44.3236,
      radius: 30000
    },
    is_active: true,
    service_config: {
      delivery: true,
      pickup: true,
      express: false,
      standard: true
    },
    statistics: {
      population: 1285500,
      area_km2: 28824,
      total_orders: 6700,
      active_drivers: 125
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }
  }
];

// Table creation schema (if needed)
const TABLE_SCHEMA = {
  TableName: 'WizzCentral_Regions',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'level', AttributeType: 'S' },
    { AttributeName: 'parent_id', AttributeType: 'S' },
    { AttributeName: 'governorate_id', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'LevelIndex',
      KeySchema: [
        { AttributeName: 'level', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'ParentIndex',
      KeySchema: [
        { AttributeName: 'parent_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'GovernorateIndex',
      KeySchema: [
        { AttributeName: 'governorate_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST',
  Tags: [
    { Key: 'Environment', Value: 'development' },
    { Key: 'Service', Value: 'WizzCentral' },
    { Key: 'Component', Value: 'Regions' }
  ]
};

async function createTable() {
  try {
    console.log('🔧 Creating WizzCentral_Regions table...');
    const createCommand = new CreateTableCommand(TABLE_SCHEMA);
    await client.send(createCommand);
    console.log('✅ Table created successfully');
    
    // Wait a bit for table to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  Table already exists');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

async function insertSampleData() {
  try {
    console.log('📍 Inserting sample regions data...');
    
    for (const region of sampleRegions) {
      const command = new PutCommand({
        TableName: 'WizzCentral_Regions',
        Item: region
      });
      
      await docClient.send(command);
      console.log(`✅ Inserted: ${region.name} (${region.level})`);
    }
    
    console.log(`🎉 Successfully inserted ${sampleRegions.length} regions!`);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${sampleRegions.filter(r => r.level === 'country').length} countries`);
    console.log(`   • ${sampleRegions.filter(r => r.level === 'governorate').length} governorates`);
    console.log(`   • ${sampleRegions.filter(r => r.level === 'district').length} districts`);
    console.log(`   • ${sampleRegions.filter(r => r.level === 'neighborhood').length} neighborhoods`);
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    throw error;
  }
}

async function main() {
  try {
    await createTable();
    await insertSampleData();
    console.log('');
    console.log('🏆 Setup complete! You can now test the regions page.');
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  sampleRegions,
  createTable,
  insertSampleData
};
