"""
FastAPI endpoints for promotion management and push notifications
Includes endpoints for creating promotions and triggering notifications
"""
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import boto3
import json
import uuid
from datetime import datetime, timezone
import os

app = FastAPI(title="WizzCentral Promotions API", version="1.0.0")

# Pydantic models
class PromotionCreate(BaseModel):
    title: str = Field(..., description="Promotion title")
    description: str = Field(..., description="Promotion description")
    type: str = Field(..., description="Promotion type (percentage, fixed_amount, etc.)")
    value: float = Field(..., description="Discount value")
    targetAudience: str = Field(..., description="Target audience (driver, customer, merchant, all)")
    region: str = Field(default="all", description="Target region (Baghdad, Basra, etc. or 'all')")
    code: Optional[str] = Field(None, description="Promotion code")
    startDate: str = Field(..., description="Start date in ISO format")
    endDate: str = Field(..., description="End date in ISO format")
    usageLimit: Optional[int] = Field(None, description="Maximum usage limit")
    minOrderValue: Optional[float] = Field(None, description="Minimum order value")
    autoActivate: bool = Field(default=True, description="Auto-activate promotion")
    isActive: bool = Field(default=True, description="Is promotion active")

class PromotionResponse(BaseModel):
    id: str
    title: str
    description: str
    type: str
    value: float
    targetAudience: str
    region: str
    code: Optional[str]
    startDate: str
    endDate: str
    usageLimit: Optional[int]
    minOrderValue: Optional[float]
    isActive: bool
    createdAt: str
    updatedAt: str

class NotificationRequest(BaseModel):
    title: str = Field(..., description="Notification title")
    body: str = Field(..., description="Notification body")
    targetAudience: str = Field(..., description="Target audience")
    region: Optional[str] = Field("all", description="Target region")
    data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional data")

# AWS clients
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

# Environment variables
PROMOTIONS_TABLE = os.environ.get('PROMOTIONS_TABLE', 'WizzCentral_Promotions')
CAMPAIGNS_TABLE = os.environ.get('CAMPAIGNS_TABLE', 'WizzCentral_Campaigns')

@app.post("/create-promotion", response_model=Dict[str, Any])
async def create_promotion(
    promotion: PromotionCreate,
    background_tasks: BackgroundTasks
):
    """
    Create a new promotion and trigger push notifications
    Stores promotion in DynamoDB and triggers Lambda function for notifications
    """
    try:
        # Generate unique promotion ID
        promotion_id = f"promo_{uuid.uuid4().hex[:8]}_{int(datetime.now().timestamp())}"
        
        # Prepare promotion data for DynamoDB
        timestamp = datetime.now(timezone.utc).isoformat()
        
        promotion_data = {
            'id': promotion_id,
            'promotionId': promotion_id,  # For backward compatibility
            'title': promotion.title,
            'name': promotion.title,  # For backward compatibility
            'description': promotion.description,
            'type': promotion.type,
            'value': promotion.value,
            'targetAudience': promotion.targetAudience,
            'region': promotion.region,
            'code': promotion.code or f"PROMO{promotion_id[-6:].upper()}",
            'startDate': promotion.startDate,
            'endDate': promotion.endDate,
            'usageLimit': promotion.usageLimit,
            'minOrderValue': promotion.minOrderValue,
            'autoActivate': promotion.autoActivate,
            'isActive': promotion.isActive,
            'usage': 0,
            'currentUsage': 0,
            'createdAt': timestamp,
            'updatedAt': timestamp,
            'status': 'active' if promotion.isActive else 'draft'
        }
        
        # Store in DynamoDB
        table = dynamodb.Table(PROMOTIONS_TABLE)
        table.put_item(Item=promotion_data)
        
        print(f"Stored promotion {promotion_id} in DynamoDB")
        
        # Trigger push notifications in background
        if promotion.isActive or promotion.autoActivate:
            background_tasks.add_task(
                trigger_promotion_notifications,
                promotion_data
            )
        
        return {
            'success': True,
            'promotionId': promotion_id,
            'message': 'Promotion created successfully',
            'promotion': promotion_data
        }
        
    except Exception as e:
        print(f"Error creating promotion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create promotion: {str(e)}")

@app.get("/get-promotions", response_model=Dict[str, Any])
async def get_promotions(
    audience: Optional[str] = None,
    region: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """
    Get promotions filtered by audience, region, and status
    Returns active promotions for the specified criteria
    """
    try:
        table = dynamodb.Table(PROMOTIONS_TABLE)
        
        # Build filter expression
        filter_expression = None
        expression_attribute_names = {}
        expression_attribute_values = {}
        
        conditions = []
        
        if audience:
            conditions.append("(targetAudience = :audience OR targetAudience = :all)")
            expression_attribute_values[':audience'] = audience
            expression_attribute_values[':all'] = 'all'
        
        if region and region != 'all':
            conditions.append("(#region = :region OR #region = :all_regions)")
            expression_attribute_names['#region'] = 'region'
            expression_attribute_values[':region'] = region
            expression_attribute_values[':all_regions'] = 'all'
        
        if status:
            conditions.append("#status = :status")
            expression_attribute_names['#status'] = 'status'
            expression_attribute_values[':status'] = status
        else:
            # Default to active promotions only
            conditions.append("isActive = :active")
            expression_attribute_values[':active'] = True
        
        if conditions:
            filter_expression = ' AND '.join(conditions)
        
        # Scan table with filters
        scan_kwargs = {
            'Limit': limit
        }
        
        if filter_expression:
            scan_kwargs['FilterExpression'] = filter_expression
        if expression_attribute_names:
            scan_kwargs['ExpressionAttributeNames'] = expression_attribute_names
        if expression_attribute_values:
            scan_kwargs['ExpressionAttributeValues'] = expression_attribute_values
        
        response = table.scan(**scan_kwargs)
        promotions = response.get('Items', [])
        
        # Filter out expired promotions
        current_time = datetime.now(timezone.utc)
        active_promotions = []
        
        for promotion in promotions:
            try:
                end_date = datetime.fromisoformat(promotion['endDate'].replace('Z', '+00:00'))
                if end_date > current_time:
                    active_promotions.append(promotion)
            except:
                # If date parsing fails, include the promotion
                active_promotions.append(promotion)
        
        return {
            'success': True,
            'count': len(active_promotions),
            'promotions': active_promotions
        }
        
    except Exception as e:
        print(f"Error getting promotions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get promotions: {str(e)}")

@app.post("/send-notification")
async def send_notification(
    notification: NotificationRequest,
    background_tasks: BackgroundTasks
):
    """
    Send push notification to specified audience
    Triggers appropriate Lambda function based on audience and region
    """
    try:
        # Determine which Lambda function to invoke
        if notification.targetAudience == 'drivers':
            if notification.region and notification.region != 'all':
                # Send regional promotion to drivers
                function_name = 'send_regional_promotion'
                payload = {
                    'title': notification.title,
                    'body': notification.body,
                    'region': notification.region,
                    'data': notification.data
                }
            else:
                # Send to all drivers
                function_name = 'send_notification_to_drivers'
                payload = {
                    'title': notification.title,
                    'body': notification.body,
                    'data': notification.data
                }
        else:
            # Generic notification
            function_name = 'send_notification_to_drivers'  # Can be extended for other audiences
            payload = {
                'title': notification.title,
                'body': notification.body,
                'data': {
                    **notification.data,
                    'targetAudience': notification.targetAudience,
                    'region': notification.region
                }
            }
        
        # Invoke Lambda function asynchronously
        background_tasks.add_task(
            invoke_lambda_function,
            function_name,
            payload
        )
        
        return {
            'success': True,
            'message': f'Notification sent to {notification.targetAudience}',
            'functionInvoked': function_name
        }
        
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")

@app.get("/promotions/{promotion_id}")
async def get_promotion(promotion_id: str):
    """Get a specific promotion by ID"""
    try:
        table = dynamodb.Table(PROMOTIONS_TABLE)
        
        response = table.get_item(
            Key={'id': promotion_id}
        )
        
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="Promotion not found")
        
        return {
            'success': True,
            'promotion': response['Item']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting promotion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get promotion: {str(e)}")

@app.put("/promotions/{promotion_id}/toggle")
async def toggle_promotion(promotion_id: str, background_tasks: BackgroundTasks):
    """Toggle promotion active status"""
    try:
        table = dynamodb.Table(PROMOTIONS_TABLE)
        
        # Get current promotion
        response = table.get_item(Key={'id': promotion_id})
        
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="Promotion not found")
        
        promotion = response['Item']
        new_status = not promotion.get('isActive', False)
        
        # Update promotion
        table.update_item(
            Key={'id': promotion_id},
            UpdateExpression='SET isActive = :status, updatedAt = :timestamp',
            ExpressionAttributeValues={
                ':status': new_status,
                ':timestamp': datetime.now(timezone.utc).isoformat()
            }
        )
        
        # If activating, send notifications
        if new_status:
            promotion['isActive'] = new_status
            background_tasks.add_task(
                trigger_promotion_notifications,
                promotion
            )
        
        return {
            'success': True,
            'message': f'Promotion {"activated" if new_status else "deactivated"}',
            'isActive': new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error toggling promotion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle promotion: {str(e)}")

# Background task functions
async def trigger_promotion_notifications(promotion_data: Dict[str, Any]):
    """Trigger push notifications for a new/activated promotion"""
    try:
        target_audience = promotion_data.get('targetAudience', 'all')
        region = promotion_data.get('region', 'all')
        
        notification_data = {
            'promotionId': promotion_data['id'],
            'type': 'new_promotion',
            'promotionType': promotion_data.get('type', 'general'),
            'validUntil': promotion_data.get('endDate', ''),
            'discount': str(promotion_data.get('value', '')),
            'code': promotion_data.get('code', '')
        }
        
        # Send to drivers
        if target_audience in ['drivers', 'all']:
            if region != 'all':
                await invoke_lambda_function(
                    'send_regional_promotion',
                    {
                        'title': f"🚗 {promotion_data['title']}",
                        'body': promotion_data['description'],
                        'region': region,
                        'data': notification_data
                    }
                )
            else:
                await invoke_lambda_function(
                    'send_notification_to_drivers',
                    {
                        'title': f"🚗 {promotion_data['title']}",
                        'body': promotion_data['description'],
                        'data': notification_data
                    }
                )
        
        print(f"Triggered notifications for promotion {promotion_data['id']}")
        
    except Exception as e:
        print(f"Error triggering notifications: {str(e)}")

async def invoke_lambda_function(function_name: str, payload: Dict[str, Any]):
    """Invoke AWS Lambda function asynchronously"""
    try:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='Event',  # Async invocation
            Payload=json.dumps(payload)
        )
        print(f"Invoked Lambda function {function_name}")
        return response
    except Exception as e:
        print(f"Error invoking Lambda function {function_name}: {str(e)}")
        raise e

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
