#!/usr/bin/env node
/**
 * Add missing food categories to WhizzMerchants_Categories table
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

console.log('🔧 Starting script...');
console.log('AWS_REGION:', process.env.AWS_REGION);

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = DynamoDBDocumentClient.from(client);
const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || 'WhizzMerchants_Categories';

// Categories to add
const newCategories = [
    { name: 'Pizza', name_ar: 'بيتزا', businessType: 'Restaurant' },
    { name: 'Burgers', name_ar: 'برجر', businessType: 'Restaurant' },
    { name: 'Chicken', name_ar: 'دجاج', businessType: 'Restaurant' },
    { name: 'Salads', name_ar: 'سلطات', businessType: 'Restaurant' }
];

async function checkIfCategoryExists(categoryName) {
    const result = await dynamodb.send(new ScanCommand({
        TableName: CATEGORIES_TABLE,
        FilterExpression: '#name = :name',
        ExpressionAttributeNames: {
            '#name': 'name'
        },
        ExpressionAttributeValues: {
            ':name': categoryName
        }
    }));
    
    return result.Items && result.Items.length > 0;
}

async function addCategory(category) {
    const categoryId = uuidv4();
    const item = {
        categoryId,
        name: category.name,
        name_ar: category.name_ar,
        businessType: category.businessType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await dynamodb.send(new PutCommand({
        TableName: CATEGORIES_TABLE,
        Item: item
    }));
    
    return item;
}

async function main() {
    console.log('🍕 Adding Missing Food Categories');
    console.log('==================================\n');
    console.log(`📋 Table: ${CATEGORIES_TABLE}\n`);
    
    let added = 0;
    let skipped = 0;
    
    for (const category of newCategories) {
        const exists = await checkIfCategoryExists(category.name);
        
        if (exists) {
            console.log(`⏭️  Skipped: ${category.name} (already exists)`);
            skipped++;
        } else {
            const item = await addCategory(category);
            console.log(`✅ Added: ${category.name} (${item.categoryId})`);
            added++;
        }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Added: ${added}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log('\n✅ Done!\n');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
