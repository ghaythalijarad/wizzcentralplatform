"""
Lambda function to send targeted promotions to drivers in specific regions
Uses Amazon Pinpoint segments to filter by region and role
"""
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    """
    Send targeted promotion to drivers in specific region
    Expected event structure:
    {
        "title": "Special Promotion in Baghdad",
        "body": "Earn 25% more on rides in Baghdad today!",
        "region": "Baghdad",
        "data": {
            "promotionId": "promo_123",
            "type": "regional_promotion",
            "discount": "25%",
            "validUntil": "2025-09-20T23:59:59Z"
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
        title = body.get('title', 'WizzDriver Promotion')
        message_body = body.get('body', 'Special promotion available!')
        region = body.get('region', 'Baghdad')
        data = body.get('data', {})
        
        # Initialize Pinpoint client
        pinpoint = boto3.client('pinpoint')
        
        # Create segment for drivers in specific region
        segment_name = f'drivers_{region.lower()}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}'
        
        segment_response = pinpoint.create_segment(
            ApplicationId=application_id,
            WriteSegmentRequest={
                'Name': segment_name,
                'Dimensions': {
                    'Attributes': {
                        'role': {
                            'AttributeType': 'INCLUSIVE',
                            'Values': ['driver']
                        },
                        'region': {
                            'AttributeType': 'INCLUSIVE',
                            'Values': [region]
                        }
                    }
                }
            }
        )
        
        segment_id = segment_response['SegmentResponse']['Id']
        print(f"Created segment {segment_id} for drivers in {region}")
        
        # Create campaign for regional promotion
        campaign_name = f'regional_promo_{region.lower()}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}'
        
        campaign_response = pinpoint.create_campaign(
            ApplicationId=application_id,
            WriteCampaignRequest={
                'Name': campaign_name,
                'Description': f'Regional promotion for drivers in {region}',
                'MessageConfiguration': {
                    'APNSMessage': {
                        'Action': 'OPEN_APP',
                        'Body': message_body,
                        'Title': title,
                        'Data': {
                            **data,
                            'region': region,
                            'campaignType': 'regional_promotion'
                        },
                        'Sound': 'default',
                        'Badge': 1,
                        'Category': 'PROMOTION'
                    },
                    'GCMMessage': {
                        'Action': 'OPEN_APP',
                        'Body': message_body,
                        'Title': title,
                        'Data': {
                            **data,
                            'region': region,
                            'campaignType': 'regional_promotion'
                        },
                        'Sound': 'default',
                        'CollapseKey': 'promotion',
                        'Priority': 'high'
                    },
                    'DefaultMessage': {
                        'Body': message_body,
                        'Title': title
                    }
                },
                'Schedule': {
                    'StartTime': datetime.utcnow().isoformat(),
                    'Timezone': 'Asia/Baghdad'
                },
                'SegmentId': segment_id,
                'TreatmentName': f'regional_promotion_{region}'
            }
        )
        
        campaign_id = campaign_response['CampaignResponse']['Id']
        print(f"Created campaign {campaign_id} for regional promotion")
        
        # Send the campaign
        send_response = pinpoint.send_messages(
            ApplicationId=application_id,
            MessageRequest={
                'MessageConfiguration': {
                    'APNSMessage': {
                        'Action': 'OPEN_APP',
                        'Body': message_body,
                        'Title': title,
                        'Data': {
                            **data,
                            'region': region,
                            'campaignType': 'regional_promotion'
                        },
                        'Sound': 'default',
                        'Badge': 1,
                        'Category': 'PROMOTION'
                    },
                    'GCMMessage': {
                        'Action': 'OPEN_APP',
                        'Body': message_body,
                        'Title': title,
                        'Data': {
                            **data,
                            'region': region,
                            'campaignType': 'regional_promotion'
                        },
                        'Sound': 'default',
                        'CollapseKey': 'promotion',
                        'Priority': 'high'
                    }
                },
                'Endpoints': await get_regional_driver_endpoints(pinpoint, application_id, region)
            }
        )
        
        message_id = send_response['MessageResponse']['RequestId']
        
        # Store promotion analytics
        await store_promotion_analytics(campaign_id, segment_id, region, data)
        
        print(f"Successfully sent regional promotion to drivers in {region}. Message ID: {message_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'messageId': message_id,
                'campaignId': campaign_id,
                'segmentId': segment_id,
                'region': region,
                'message': f'Regional promotion sent to drivers in {region} successfully'
            })
        }
        
    except Exception as e:
        print(f"Error sending regional promotion: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Failed to send regional promotion: {str(e)}'
            })
        }

async def get_regional_driver_endpoints(pinpoint, application_id, region):
    """Get all driver endpoints in specific region"""
    try:
        endpoints = {}
        
        # Get endpoints that match our criteria
        # This is a simplified approach - in production, segments handle this automatically
        paginator = pinpoint.get_paginator('get_endpoints')
        page_iterator = paginator.paginate(ApplicationId=application_id)
        
        for page in page_iterator:
            for endpoint_id, endpoint in page.get('EndpointsResponse', {}).get('Item', {}).items():
                # Check if this endpoint belongs to a driver in the target region
                attributes = endpoint.get('Attributes', {})
                endpoint_role = attributes.get('role', [''])[0]
                endpoint_region = attributes.get('region', [''])[0]
                
                if endpoint_role == 'driver' and endpoint_region == region:
                    endpoints[endpoint_id] = {}
        
        print(f"Found {len(endpoints)} driver endpoints in {region}")
        return endpoints
        
    except Exception as e:
        print(f"Error getting regional driver endpoints: {str(e)}")
        return {}

async def store_promotion_analytics(campaign_id, segment_id, region, promotion_data):
    """Store promotion analytics in DynamoDB for tracking"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ.get('PROMOTIONS_ANALYTICS_TABLE', 'WizzCentral_Promotion_Analytics')
        table = dynamodb.Table(table_name)
        
        analytics_record = {
            'promotionId': promotion_data.get('promotionId', campaign_id),
            'campaignId': campaign_id,
            'segmentId': segment_id,
            'region': region,
            'sentAt': datetime.utcnow().isoformat(),
            'type': 'regional_promotion',
            'status': 'sent',
            'targetAudience': 'drivers',
            'promotionData': promotion_data
        }
        
        table.put_item(Item=analytics_record)
        print(f"Stored analytics for promotion {campaign_id}")
        
    except Exception as e:
        print(f"Error storing promotion analytics: {str(e)}")
        # Don't fail the main function if analytics storage fails
