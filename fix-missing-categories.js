/**
 * Add Missing Categories from arabic_products_500.csv
 * 
 * This script adds categories that were used in the CSV but don't exist in the database
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Load AWS config from environment
process.env.AWS_SDK_LOAD_CONFIG = '1';
AWS.config.update({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CATEGORIES_TABLE = 'WhizzMerchants_Categories';

// Categories missing from database (based on CSV analysis)
const MISSING_CATEGORIES = [
    {
        name: 'MainDishes',
        name_ar: 'أطباق رئيسية',
        description: 'Main course dishes and meals',
        description_ar: 'الأطباق الرئيسية والوجبات'
    },
    {
        name: 'Burgers',
        name_ar: 'برغر',
        description: 'Burgers and burger meals',
        description_ar: 'البرغر والوجبات'
    },
    {
        name: 'FastFood',
        name_ar: 'وجبات سريعة',
        description: 'Fast food items',
        description_ar: 'الوجبات السريعة'
    },
    {
        name: 'Seafood',
        name_ar: 'مأكولات بحرية',
        description: 'Seafood dishes',
        description_ar: 'الأطباق البحرية'
    },
    {
        name: 'Breakfast',
        name_ar: 'فطور',
        description: 'Breakfast items',
        description_ar: 'أطعمة الفطور'
    },
    {
        name: 'Bakery',
        name_ar: 'مخبوزات',
        description: 'Baked goods',
        description_ar: 'المخبوزات'
    },
    {
        name: 'Juices',
        name_ar: 'عصائر',
        description: 'Fresh juices and drinks',
        description_ar: 'العصائر والمشروبات الطازجة'
    },
    {
        name: 'Dairy',
        name_ar: 'ألبان',
        description: 'Dairy products',
        description_ar: 'منتجات الألبان'
    },
    {
        name: 'Salads',
        name_ar: 'سلطات',
        description: 'Fresh salads',
        description_ar: 'السلطات الطازجة'
    },
    {
        name: 'Pizza',
        name_ar: 'بيتزا',
        description: 'Pizza varieties',
        description_ar: 'أنواع البيتزا'
    }
];

async function addMissingCategories() {
    console.log('🔧 Adding missing categories from CSV...\n');
    
    let added = 0;
    let errors = 0;
    
    for (const category of MISSING_CATEGORIES) {
        try {
            const categoryId = uuidv4();
            const item = {
                categoryId,
                name: category.name,
                name_ar: category.name_ar,
                description: category.description,
                description_ar: category.description_ar,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await dynamodb.put({
                TableName: CATEGORIES_TABLE,
                Item: item,
                ConditionExpression: 'attribute_not_exists(categoryId)'
            }).promise();
            
            console.log(`✅ Added: ${category.name} (${category.name_ar})`);
            added++;
        } catch (error) {
            if (error.code === 'ConditionalCheckFailedException') {
                console.log(`⏭️  Skipped: ${category.name} (already exists)`);
            } else {
                console.error(`❌ Error adding ${category.name}:`, error.message);
                errors++;
            }
        }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Added: ${added}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${MISSING_CATEGORIES.length}`);
    
    if (added > 0) {
        console.log(`\n✅ Success! You can now re-upload your CSV file.`);
        console.log(`   The products will be properly categorized this time.`);
    }
}

// Run the script
addMissingCategories()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
