"""
Lambda function to send push notifications to all drivers
Uses Amazon Pinpoint to send targeted messages to driver endpoints
"""
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    """
    Send push notification to all drivers
    Expected event structure:
    {
        "title": "New Order Available",
        "body": "A customer is requesting a ride in your area",
        "data": {
            "orderId": "order_123",
            "type": "new_order",
            "priority": "high"
        }
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
        
        # Extract message details
        title = body.get('title', 'WizzDriver Notification')
        message_body = body.get('body', 'You have a new notification')
        data = body.get('data', {})
        
        # Initialize Pinpoint client
        pinpoint = boto3.client('pinpoint')
        
        # Create message request for all drivers
        message_request = {
            'MessageConfiguration': {
                'APNSMessage': {
                    'Action': 'OPEN_APP',
                    'Body': message_body,
                    'Title': title,
                    'Data': data,
                    'Sound': 'default',
                    'Badge': 1
                },
                'GCMMessage': {
                    'Action': 'OPEN_APP',
                    'Body': message_body,
                    'Title': title,
                    'Data': data,
                    'Sound': 'default'
                },
                'DefaultMessage': {
                    'Body': message_body,
                    'Title': title
                }
            },
            'Endpoints': {}
        }
        
        # Get all driver endpoints
        try:
            # First, get all endpoints for the application
            endpoints_response = pinpoint.get_application_settings(
                ApplicationId=application_id
            )
            
            # Use segment targeting to send to all drivers
            segment_id = await create_driver_segment(pinpoint, application_id)
            
            # Send message using campaign
            campaign_response = pinpoint.create_campaign(
                ApplicationId=application_id,
                WriteCampaignRequest={
                    'Name': f'driver_notification_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}',
                    'Description': f'Push notification to all drivers: {title}',
                    'MessageConfiguration': {
                        'APNSMessage': {
                            'Action': 'OPEN_APP',
                            'Body': message_body,
                            'Title': title,
                            'Data': data,
                            'Sound': 'default',
                            'Badge': 1
                        },
                        'GCMMessage': {
                            'Action': 'OPEN_APP',
                            'Body': message_body,
                            'Title': title,
                            'Data': data,
                            'Sound': 'default'
                        }
                    },
                    'Schedule': {
                        'StartTime': datetime.utcnow().isoformat(),
                        'Timezone': 'UTC'
                    },
                    'SegmentId': segment_id
                }
            )
            
            campaign_id = campaign_response['CampaignResponse']['Id']
            
            # Execute the campaign
            execution_response = pinpoint.send_messages(
                ApplicationId=application_id,
                MessageRequest={
                    'MessageConfiguration': {
                        'APNSMessage': {
                            'Action': 'OPEN_APP',
                            'Body': message_body,
                            'Title': title,
                            'Data': data,
                            'Sound': 'default',
                            'Badge': 1
                        },
                        'GCMMessage': {
                            'Action': 'OPEN_APP',
                            'Body': message_body,
                            'Title': title,
                            'Data': data,
                            'Sound': 'default'
                        }
                    },
                    'Endpoints': await get_driver_endpoints(pinpoint, application_id)
                }
            )
            
            message_id = execution_response['MessageResponse']['RequestId']
            
            print(f"Successfully sent notification to all drivers. Message ID: {message_id}")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'messageId': message_id,
                    'message': 'Notification sent to all drivers successfully'
                })
            }
            
        except Exception as e:
            print(f"Error sending notification: {str(e)}")
            raise e
        
    except Exception as e:
        print(f"Error in send_notification_to_drivers: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Failed to send notification: {str(e)}'
            })
        }

async def get_driver_endpoints(pinpoint, application_id):
    """Get all endpoints with role=driver"""
    try:
        endpoints = {}
        
        # Get endpoints using segments API
        # Note: In a real implementation, you'd use the segments API
        # For now, we'll use a direct approach
        
        # This is a simplified approach - in production, you'd use segments
        # to efficiently target drivers
        paginator = pinpoint.get_paginator('get_endpoints')
        page_iterator = paginator.paginate(ApplicationId=application_id)
        
        for page in page_iterator:
            for endpoint_id, endpoint in page.get('EndpointsResponse', {}).get('Item', {}).items():
                # Check if this endpoint belongs to a driver
                if endpoint.get('Attributes', {}).get('role', [''])[0] == 'driver':
                    endpoints[endpoint_id] = {}
        
        return endpoints
        
    except Exception as e:
        print(f"Error getting driver endpoints: {str(e)}")
        return {}

async def create_driver_segment(pinpoint, application_id):
    """Create a segment for all drivers"""
    try:
        segment_response = pinpoint.create_segment(
            ApplicationId=application_id,
            WriteSegmentRequest={
                'Name': f'drivers_segment_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}',
                'Dimensions': {
                    'Attributes': {
                        'role': {
                            'AttributeType': 'INCLUSIVE',
                            'Values': ['driver']
                        }
                    }
                }
            }
        )
        return segment_response['SegmentResponse']['Id']
    except Exception as e:
        print(f"Error creating driver segment: {str(e)}")
        return None
