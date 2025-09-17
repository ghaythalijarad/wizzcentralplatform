"""
Lambda function triggered by DynamoDB streams when a new promotion is created
Automatically sends push notifications to the appropriate audience
"""
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    """
    Handle promotion creation events from DynamoDB
    Triggered when a new promotion is added to the promotions table
    """
    
    try:
        # Process each record in the DynamoDB stream
        for record in event.get('Records', []):
            # Only process INSERT events (new promotions)
            if record['eventName'] == 'INSERT':
                await process_new_promotion(record['dynamodb']['NewImage'])
            elif record['eventName'] == 'MODIFY':
                # Handle promotion updates (e.g., activation)
                await process_promotion_update(
                    record['dynamodb'].get('OldImage', {}),
                    record['dynamodb']['NewImage']
                )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'message': 'Promotion events processed successfully'
            })
        }
        
    except Exception as e:
        print(f"Error processing promotion events: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Failed to process promotion events: {str(e)}'
            })
        }

async def process_new_promotion(promotion_item):
    """Process a newly created promotion"""
    try:
        # Convert DynamoDB item format to regular dict
        promotion = deserialize_dynamodb_item(promotion_item)
        
        print(f"Processing new promotion: {promotion.get('id', 'unknown')}")
        
        # Extract promotion details
        promotion_id = promotion.get('id', promotion.get('promotionId', ''))
        title = promotion.get('title', promotion.get('name', 'New Promotion'))
        description = promotion.get('description', 'A new promotion is available!')
        target_audience = promotion.get('targetAudience', 'all')
        region = promotion.get('region', 'all')
        promotion_type = promotion.get('type', 'general')
        
        # Check if promotion should be auto-activated
        auto_activate = promotion.get('autoActivate', False)
        is_active = promotion.get('isActive', False)
        
        if not (auto_activate or is_active):
            print(f"Promotion {promotion_id} is not set to auto-activate, skipping notification")
            return
        
        # Prepare notification data
        notification_data = {
            'promotionId': promotion_id,
            'type': 'new_promotion',
            'promotionType': promotion_type,
            'validUntil': promotion.get('endDate', promotion.get('validTo', '')),
            'discount': promotion.get('value', promotion.get('discountValue', '')),
            'code': promotion.get('code', '')
        }
        
        # Send notifications based on target audience
        if target_audience == 'drivers' or target_audience == 'all':
            await send_driver_promotion_notification(
                title, description, region, notification_data
            )
        
        if target_audience == 'customers' or target_audience == 'all':
            await send_customer_promotion_notification(
                title, description, region, notification_data
            )
        
        if target_audience == 'merchants' or target_audience == 'all':
            await send_merchant_promotion_notification(
                title, description, region, notification_data
            )
        
        # Log promotion notification
        await log_promotion_notification(promotion_id, target_audience, region)
        
    except Exception as e:
        print(f"Error processing new promotion: {str(e)}")
        raise e

async def process_promotion_update(old_item, new_item):
    """Process promotion updates (e.g., activation)"""
    try:
        old_promotion = deserialize_dynamodb_item(old_item)
        new_promotion = deserialize_dynamodb_item(new_item)
        
        # Check if promotion was just activated
        old_active = old_promotion.get('isActive', False)
        new_active = new_promotion.get('isActive', False)
        
        if not old_active and new_active:
            print(f"Promotion {new_promotion.get('id')} was activated, sending notifications")
            await process_new_promotion(new_item)
        
    except Exception as e:
        print(f"Error processing promotion update: {str(e)}")

async def send_driver_promotion_notification(title, description, region, data):
    """Send promotion notification to drivers"""
    try:
        lambda_client = boto3.client('lambda')
        
        # Invoke the regional promotion function
        payload = {
            'title': f"🚗 {title}",
            'body': description,
            'region': region if region != 'all' else 'Baghdad',  # Default to Baghdad if all regions
            'data': {
                **data,
                'audience': 'drivers'
            }
        }
        
        if region == 'all':
            # Send to all drivers regardless of region
            function_name = 'send_notification_to_drivers'
        else:
            # Send to drivers in specific region
            function_name = 'send_regional_promotion'
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='Event',  # Async invocation
            Payload=json.dumps(payload)
        )
        
        print(f"Invoked {function_name} for driver promotion")
        
    except Exception as e:
        print(f"Error sending driver promotion notification: {str(e)}")

async def send_customer_promotion_notification(title, description, region, data):
    """Send promotion notification to customers"""
    try:
        pinpoint = boto3.client('pinpoint')
        application_id = os.environ.get('PINPOINT_APPLICATION_ID')
        
        # Create customer segment
        segment_dimensions = {
            'Attributes': {
                'role': {
                    'AttributeType': 'INCLUSIVE',
                    'Values': ['customer']
                }
            }
        }
        
        if region != 'all':
            segment_dimensions['Attributes']['region'] = {
                'AttributeType': 'INCLUSIVE',
                'Values': [region]
            }
        
        segment_response = pinpoint.create_segment(
            ApplicationId=application_id,
            WriteSegmentRequest={
                'Name': f'customers_{region}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}',
                'Dimensions': segment_dimensions
            }
        )
        
        # Send notification to customers
        pinpoint.send_messages(
            ApplicationId=application_id,
            MessageRequest={
                'MessageConfiguration': {
                    'APNSMessage': {
                        'Action': 'OPEN_APP',
                        'Body': description,
                        'Title': f"🛍️ {title}",
                        'Data': {**data, 'audience': 'customers'},
                        'Sound': 'default',
                        'Category': 'PROMOTION'
                    },
                    'GCMMessage': {
                        'Action': 'OPEN_APP',
                        'Body': description,
                        'Title': f"🛍️ {title}",
                        'Data': {**data, 'audience': 'customers'},
                        'Sound': 'default',
                        'Priority': 'high'
                    }
                },
                'Endpoints': {}  # Will target the segment
            }
        )
        
        print(f"Sent promotion notification to customers in {region}")
        
    except Exception as e:
        print(f"Error sending customer promotion notification: {str(e)}")

async def send_merchant_promotion_notification(title, description, region, data):
    """Send promotion notification to merchants"""
    try:
        pinpoint = boto3.client('pinpoint')
        application_id = os.environ.get('PINPOINT_APPLICATION_ID')
        
        # Create merchant segment
        segment_dimensions = {
            'Attributes': {
                'role': {
                    'AttributeType': 'INCLUSIVE',
                    'Values': ['merchant']
                }
            }
        }
        
        if region != 'all':
            segment_dimensions['Attributes']['region'] = {
                'AttributeType': 'INCLUSIVE',
                'Values': [region]
            }
        
        segment_response = pinpoint.create_segment(
            ApplicationId=application_id,
            WriteSegmentRequest={
                'Name': f'merchants_{region}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}',
                'Dimensions': segment_dimensions
            }
        )
        
        # Send notification to merchants
        pinpoint.send_messages(
            ApplicationId=application_id,
            MessageRequest={
                'MessageConfiguration': {
                    'APNSMessage': {
                        'Action': 'OPEN_APP',
                        'Body': description,
                        'Title': f"🏪 {title}",
                        'Data': {**data, 'audience': 'merchants'},
                        'Sound': 'default',
                        'Category': 'PROMOTION'
                    },
                    'GCMMessage': {
                        'Action': 'OPEN_APP',
                        'Body': description,
                        'Title': f"🏪 {title}",
                        'Data': {**data, 'audience': 'merchants'},
                        'Sound': 'default',
                        'Priority': 'high'
                    }
                },
                'Endpoints': {}  # Will target the segment
            }
        )
        
        print(f"Sent promotion notification to merchants in {region}")
        
    except Exception as e:
        print(f"Error sending merchant promotion notification: {str(e)}")

async def log_promotion_notification(promotion_id, target_audience, region):
    """Log promotion notification for analytics"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ.get('PROMOTION_LOGS_TABLE', 'WizzCentral_Promotion_Logs')
        table = dynamodb.Table(table_name)
        
        log_item = {
            'promotionId': promotion_id,
            'timestamp': datetime.utcnow().isoformat(),
            'action': 'notification_sent',
            'targetAudience': target_audience,
            'region': region,
            'status': 'completed'
        }
        
        table.put_item(Item=log_item)
        print(f"Logged promotion notification for {promotion_id}")
        
    except Exception as e:
        print(f"Error logging promotion notification: {str(e)}")

def deserialize_dynamodb_item(item):
    """Convert DynamoDB item format to regular Python dict"""
    def deserialize_value(value):
        if 'S' in value:
            return value['S']
        elif 'N' in value:
            return float(value['N']) if '.' in value['N'] else int(value['N'])
        elif 'BOOL' in value:
            return value['BOOL']
        elif 'L' in value:
            return [deserialize_value(v) for v in value['L']]
        elif 'M' in value:
            return {k: deserialize_value(v) for k, v in value['M'].items()}
        elif 'NULL' in value:
            return None
        else:
            return value
    
    return {k: deserialize_value(v) for k, v in item.items()}
