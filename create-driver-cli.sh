#!/bin/bash

echo "🚗 Creating Test Driver with Online Status using AWS CLI..."

# Generate unique driver ID
DRIVER_ID="test-driver-online-$(date +%s)"
echo "🆔 Driver ID: $DRIVER_ID"

# Create JSON data for the test driver
cat > test-driver.json << EOF
{
    "driverId": {"S": "$DRIVER_ID"},
    "name": {"S": "Test Driver ONLINE"},
    "email": {"S": "test.online@wizz.com"},
    "city": {"S": "بغداد"},
    "registrationStatus": {"S": "APPROVED"},
    "status": {"S": "online"},
    "availabilityStatus": {"S": "online"},
    "driverStatus": {"S": "online"},
    "activeOrders": {"N": "0"},
    "createdAt": {"S": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"},
    "updatedAt": {"S": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"},
    "statusChangedAt": {"S": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"},
    "lastStatusUpdate": {"S": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"},
    "location": {
        "M": {
            "latitude": {"N": "33.3152"},
            "longitude": {"N": "44.3661"}
        }
    },
    "vehicleType": {"S": "car"},
    "licenseNumber": {"S": "TEST123"},
    "nationalId": {"S": "1234567890"},
    "version": {"N": "1"}
}
EOF

echo "📝 Creating driver in DynamoDB..."

# Insert the driver using AWS CLI
aws dynamodb put-item \
    --table-name WhizzDrivers_dev \
    --item file://test-driver.json \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS! Test driver created!"
    echo "🆔 Driver ID: $DRIVER_ID"
    echo "🟢 Status: online"
    echo "🟢 Availability Status: online" 
    echo "🟢 Driver Status: online"
    echo ""
    echo "🎯 This driver should now appear in your DynamoDB console!"
    echo "🔄 Refresh the table view to see the new online driver."
    echo ""
    
    # Verify by listing all drivers
    echo "📋 Verifying - listing all drivers with status info:"
    aws dynamodb scan \
        --table-name WhizzDrivers_dev \
        --projection-expression "driverId, #name, registrationStatus, #status, availabilityStatus, driverStatus, activeOrders" \
        --expression-attribute-names '{"#name":"name","#status":"status"}' \
        --region us-east-1 \
        --output table
        
else
    echo "❌ FAILED to create driver"
    echo "💡 Check AWS credentials and permissions"
fi

# Clean up
rm -f test-driver.json

echo ""
echo "🏁 Script complete!"
