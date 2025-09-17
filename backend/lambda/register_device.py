"""
Lambda function to register device tokens in Amazon Pinpoint
Receives device token and role (driver, customer, merchant) and registers endpoint
"""
import json
import boto3
import os
import uuid
from datetime import datetime

def lambda_handler(event, context):
    """
    Register device endpoint in Pinpoint
    Expected event structure:
    {
        "deviceToken": "fcm_or_apns_token_here",
        "role": "driver|customer|merchant",
        "userId": "user_unique_id",
        "platform": "ios|android",
        "region": "Baghdad|Basra|Erbil|etc",
        "appVersion": "1.0.0"
    }
    """
    
    try:
        # Get Pinpoint application ID from environment
        application_id = os.environ.get('PINPOINT_APPLICATION_ID')
        if not application_id:
            raise ValueError("PINPOINT_APPLICATION_ID environment variable not set")
        
        # Parse event body if it's a string (API Gateway)
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event
        
        # Extract required fields
        device_token = body.get('deviceToken')
        role = body.get('role')
        user_id = body.get('userId')
        platform = body.get('platform', 'android').lower()
        region = body.get('region', 'Baghdad')
        app_version = body.get('appVersion', '1.0.0')
        
        # Validate required fields
        if not device_token or not role or not user_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required fields: deviceToken, role, userId'
                })
            }
        
        # Validate role
        valid_roles = ['driver', 'customer', 'merchant']
        if role not in valid_roles:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
                })
            }
        
        # Initialize Pinpoint client
        pinpoint = boto3.client('pinpoint')
        
        # Create unique endpoint ID
        endpoint_id = f"{role}_{user_id}_{platform}"
        
        # Determine channel type based on platform
        channel_type = 'APNS' if platform == 'ios' else 'GCM'
        
        # Prepare endpoint request
        endpoint_request = {
            'ChannelType': channel_type,
            'Address': device_token,
            'OptOut': 'NONE',
            'Attributes': {
                'role': [role],
                'region': [region],
                'platform': [platform],
                'appVersion': [app_version]
            },
            'User': {
                'UserId': user_id,
                'UserAttributes': {
                    'role': [role],
                    'region': [region],
                    'lastActive': [datetime.utcnow().isoformat()]
                }
            },
            'Location': {
                'Country': 'IQ',  # Iraq
                'City': region
            }
        }
        
        # Update endpoint in Pinpoint
        response = pinpoint.update_endpoint(
            ApplicationId=application_id,
            EndpointId=endpoint_id,
            EndpointRequest=endpoint_request
        )
        
        print(f"Successfully registered endpoint {endpoint_id} for user {user_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'endpointId': endpoint_id,
                'message': 'Device token registered successfully'
            })
        }
        
    except Exception as e:
        print(f"Error registering device: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Failed to register device: {str(e)}'
            })
        }
