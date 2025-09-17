"""
Condition Evaluator Lambda Function
Processes SQS messages for condition evaluation
"""
import json
import boto3
import os
from decimal import Decimal
from datetime import datetime, timezone
import uuid

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Table references
conditions_table = dynamodb.Table(os.environ['CONDITIONS_TABLE'])
evaluations_table = dynamodb.Table(os.environ['EVALUATIONS_TABLE'])
campaigns_table = dynamodb.Table(os.environ['CAMPAIGNS_TABLE'])

def lambda_handler(event, context):
    """
    Process SQS messages for condition evaluation
    """
    try:
        # Process each SQS record
        results = []
        for record in event.get('Records', []):
            try:
                # Parse message body
                message = json.loads(record['body'])
                
                # Extract evaluation parameters
                condition_id = message.get('conditionId')
                user_data = message.get('userData', {})
                campaign_id = message.get('campaignId')
                
                if not condition_id:
                    print(f"Missing conditionId in message: {message}")
                    continue
                
                # Evaluate condition
                result = evaluate_condition(condition_id, user_data, campaign_id)
                results.append(result)
                
            except Exception as e:
                print(f"Error processing record {record}: {str(e)}")
                continue
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Evaluations processed successfully',
                'results': len(results),
                'processed': results
            })
        }
        
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def evaluate_condition(condition_id, user_data, campaign_id=None):
    """
    Evaluate a specific condition against user data
    """
    try:
        # Get condition details
        condition_response = conditions_table.get_item(
            Key={'conditionId': condition_id}
        )
        
        if 'Item' not in condition_response:
            return {
                'conditionId': condition_id,
                'result': False,
                'error': 'Condition not found'
            }
        
        condition = condition_response['Item']
        
        # Check if condition is active
        if condition.get('isActive', 0) != 1:
            return {
                'conditionId': condition_id,
                'result': False,
                'reason': 'Condition is not active'
            }
        
        # Evaluate condition logic
        condition_type = condition.get('type', 'simple')
        criteria = condition.get('criteria', {})
        
        if condition_type == 'location_based':
            result = evaluate_location_condition(criteria, user_data)
        elif condition_type == 'time_based':
            result = evaluate_time_condition(criteria, user_data)
        elif condition_type == 'user_attribute':
            result = evaluate_user_attribute_condition(criteria, user_data)
        elif condition_type == 'spending_threshold':
            result = evaluate_spending_condition(criteria, user_data)
        else:
            result = evaluate_simple_condition(criteria, user_data)
        
        # Store evaluation result
        evaluation_id = str(uuid.uuid4())
        evaluation_record = {
            'evaluationId': evaluation_id,
            'conditionId': condition_id,
            'campaignId': campaign_id or 'unknown',
            'result': result,
            'userData': user_data,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'ttl': int(datetime.now(timezone.utc).timestamp()) + 2592000  # 30 days
        }
        
        evaluations_table.put_item(Item=evaluation_record)
        
        return {
            'evaluationId': evaluation_id,
            'conditionId': condition_id,
            'result': result
        }
        
    except Exception as e:
        print(f"Error evaluating condition {condition_id}: {str(e)}")
        return {
            'conditionId': condition_id,
            'result': False,
            'error': str(e)
        }

def evaluate_simple_condition(criteria, user_data):
    """Evaluate simple key-value conditions"""
    for key, expected_value in criteria.items():
        if key not in user_data:
            return False
        if user_data[key] != expected_value:
            return False
    return True

def evaluate_location_condition(criteria, user_data):
    """Evaluate location-based conditions"""
    user_lat = user_data.get('latitude')
    user_lng = user_data.get('longitude')
    
    if not user_lat or not user_lng:
        return False
    
    # Simple radius check
    center_lat = criteria.get('latitude')
    center_lng = criteria.get('longitude')
    radius = criteria.get('radius', 5)  # Default 5km radius
    
    if not center_lat or not center_lng:
        return False
    
    # Calculate distance (simplified)
    lat_diff = abs(float(user_lat) - float(center_lat))
    lng_diff = abs(float(user_lng) - float(center_lng))
    
    # Rough distance calculation (not exact but sufficient for demo)
    distance = (lat_diff ** 2 + lng_diff ** 2) ** 0.5 * 111  # Approximate km per degree
    
    return distance <= radius

def evaluate_time_condition(criteria, user_data):
    """Evaluate time-based conditions"""
    current_time = datetime.now(timezone.utc)
    
    start_time = criteria.get('startTime')
    end_time = criteria.get('endTime')
    
    if start_time:
        start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if current_time < start_dt:
            return False
    
    if end_time:
        end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        if current_time > end_dt:
            return False
    
    return True

def evaluate_user_attribute_condition(criteria, user_data):
    """Evaluate user attribute conditions"""
    for attribute, condition in criteria.items():
        user_value = user_data.get(attribute)
        
        if user_value is None:
            return False
        
        operator = condition.get('operator', 'equals')
        expected_value = condition.get('value')
        
        if operator == 'equals' and user_value != expected_value:
            return False
        elif operator == 'greater_than' and float(user_value) <= float(expected_value):
            return False
        elif operator == 'less_than' and float(user_value) >= float(expected_value):
            return False
        elif operator == 'contains' and expected_value not in str(user_value):
            return False
    
    return True

def evaluate_spending_condition(criteria, user_data):
    """Evaluate spending threshold conditions"""
    user_spending = user_data.get('totalSpending', 0)
    min_spending = criteria.get('minAmount', 0)
    max_spending = criteria.get('maxAmount', float('inf'))
    
    return min_spending <= float(user_spending) <= max_spending
