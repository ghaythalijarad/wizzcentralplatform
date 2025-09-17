import json
import boto3
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from typing import Dict, List, Any, Optional
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
campaigns_table = dynamodb.Table(os.environ.get('CAMPAIGNS_TABLE', 'wizzcentral-campaigns'))
conditions_table = dynamodb.Table(os.environ.get('CONDITIONS_TABLE', 'wizzcentral-conditions'))
analytics_table = dynamodb.Table(os.environ.get('ANALYTICS_TABLE', 'wizzcentral-analytics'))
evaluations_table = dynamodb.Table(os.environ.get('EVALUATIONS_TABLE', 'wizzcentral-evaluations'))

class ConditionEngineAPI:
    """
    WizzCentral Campaign Condition Engine API
    Handles campaign condition creation, evaluation, and analytics
    """
    
    def __init__(self):
        self.condition_types = {
            'location': ['within_radius', 'in_city', 'in_state', 'specific_restaurant'],
            'time': ['time_range', 'day_of_week', 'date_range', 'peak_hours'],
            'customer': ['new_customer', 'loyalty_tier', 'order_count', 'total_spent'],
            'order': ['minimum_amount', 'specific_items', 'order_type', 'delivery_method'],
            'behavior': ['frequency', 'recency', 'preferences', 'engagement_score'],
            'business': ['revenue_target', 'capacity', 'inventory_level', 'staff_availability']
        }

    def lambda_handler(self, event, context):
        """Main Lambda handler for condition engine API"""
        try:
            # Handle warmup requests
            if event.get('warmup'):
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Function warmed up',
                        'timestamp': datetime.now().isoformat()
                    })
                }
            
            # Extract HTTP method and path
            http_method = event.get('httpMethod', '')
            path = event.get('path', '')
            path_parameters = event.get('pathParameters') or {}
            query_parameters = event.get('queryStringParameters') or {}
            body = json.loads(event.get('body', '{}')) if event.get('body') else {}
            
            # Add CORS headers
            headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            }
            
            # Handle preflight requests
            if http_method == 'OPTIONS':
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': ''
                }
            
            # Route requests
            if path.startswith('/conditions'):
                return self.handle_conditions_request(http_method, path_parameters, query_parameters, body, headers)
            elif path.startswith('/campaigns'):
                return self.handle_campaigns_request(http_method, path_parameters, query_parameters, body, headers)
            elif path.startswith('/evaluate'):
                return self.handle_evaluation_request(http_method, path_parameters, query_parameters, body, headers)
            elif path.startswith('/analytics'):
                return self.handle_analytics_request(http_method, path_parameters, query_parameters, body, headers)
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Endpoint not found'})
                }
                
        except Exception as e:
            logger.error(f"Error in lambda_handler: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': f'Internal server error: {str(e)}'})
            }

    def handle_conditions_request(self, method, path_params, query_params, body, headers):
        """Handle condition-related API requests"""
        try:
            if method == 'GET':
                if 'conditionId' in path_params:
                    return self.get_condition(path_params['conditionId'], headers)
                else:
                    return self.list_conditions(query_params, headers)
            
            elif method == 'POST':
                return self.create_condition(body, headers)
            
            elif method == 'PUT':
                return self.update_condition(path_params['conditionId'], body, headers)
            
            elif method == 'DELETE':
                return self.delete_condition(path_params['conditionId'], headers)
            
            else:
                return {
                    'statusCode': 405,
                    'headers': headers,
                    'body': json.dumps({'error': 'Method not allowed'})
                }
                
        except Exception as e:
            logger.error(f"Error in handle_conditions_request: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def handle_campaigns_request(self, method, path_params, query_params, body, headers):
        """Handle campaign-related API requests"""
        try:
            if method == 'GET':
                if 'campaignId' in path_params:
                    return self.get_campaign(path_params['campaignId'], headers)
                else:
                    return self.list_campaigns(query_params, headers)
            
            elif method == 'POST':
                return self.create_campaign(body, headers)
            
            elif method == 'PUT':
                return self.update_campaign(path_params['campaignId'], body, headers)
            
            elif method == 'DELETE':
                return self.delete_campaign(path_params['campaignId'], headers)
            
            else:
                return {
                    'statusCode': 405,
                    'headers': headers,
                    'body': json.dumps({'error': 'Method not allowed'})
                }
                
        except Exception as e:
            logger.error(f"Error in handle_campaigns_request: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def handle_evaluation_request(self, method, path_params, query_params, body, headers):
        """Handle condition evaluation requests"""
        try:
            if method == 'POST':
                if 'batch' in path_params:
                    return self.batch_evaluate_conditions(body, headers)
                else:
                    return self.evaluate_single_condition(body, headers)
            else:
                return {
                    'statusCode': 405,
                    'headers': headers,
                    'body': json.dumps({'error': 'Method not allowed'})
                }
                
        except Exception as e:
            logger.error(f"Error in handle_evaluation_request: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def handle_analytics_request(self, method, path_params, query_params, body, headers):
        """Handle analytics-related API requests"""
        try:
            if method == 'GET':
                if 'campaignId' in path_params:
                    return self.get_campaign_analytics(path_params['campaignId'], query_params, headers)
                else:
                    return self.get_overall_analytics(query_params, headers)
            else:
                return {
                    'statusCode': 405,
                    'headers': headers,
                    'body': json.dumps({'error': 'Method not allowed'})
                }
                
        except Exception as e:
            logger.error(f"Error in handle_analytics_request: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    # ============ CONDITION MANAGEMENT ============

    def create_condition(self, condition_data, headers):
        """Create a new condition definition"""
        try:
            # Validate required fields
            required_fields = ['name', 'type', 'operator', 'value']
            for field in required_fields:
                if field not in condition_data:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': f'Missing required field: {field}'})
                    }
            
            # Generate condition ID
            condition_id = str(uuid.uuid4())
            
            # Prepare condition item
            condition_item = {
                'conditionId': condition_id,
                'name': condition_data['name'],
                'type': condition_data['type'],
                'operator': condition_data['operator'],
                'value': condition_data['value'],
                'description': condition_data.get('description', ''),
                'metadata': condition_data.get('metadata', {}),
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat(),
                'isActive': condition_data.get('isActive', True),
                'version': 1
            }
            
            # Store in DynamoDB
            conditions_table.put_item(Item=condition_item)
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({
                    'conditionId': condition_id,
                    'condition': condition_item
                })
            }
            
        except Exception as e:
            logger.error(f"Error creating condition: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def get_condition(self, condition_id, headers):
        """Retrieve a specific condition"""
        try:
            response = conditions_table.get_item(
                Key={'conditionId': condition_id}
            )
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Condition not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(response['Item'], default=str)
            }
            
        except Exception as e:
            logger.error(f"Error retrieving condition: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def list_conditions(self, query_params, headers):
        """List all conditions with optional filtering"""
        try:
            # Build scan parameters
            scan_params = {}
            
            # Add filters based on query parameters
            if 'type' in query_params:
                scan_params['FilterExpression'] = 'conditionType = :type'
                scan_params['ExpressionAttributeValues'] = {':type': query_params['type']}
            
            # Execute scan
            response = conditions_table.scan(**scan_params)
            
            conditions = response.get('Items', [])
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'conditions': conditions,
                    'count': len(conditions)
                }, default=str)
            }
            
        except Exception as e:
            logger.error(f"Error listing conditions: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    # ============ CAMPAIGN MANAGEMENT ============

    def create_campaign(self, campaign_data, headers):
        """Create a new campaign with conditions"""
        try:
            # Validate required fields
            required_fields = ['name', 'conditions', 'action']
            for field in required_fields:
                if field not in campaign_data:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': f'Missing required field: {field}'})
                    }
            
            # Generate campaign ID
            campaign_id = str(uuid.uuid4())
            
            # Prepare campaign item
            campaign_item = {
                'campaignId': campaign_id,
                'name': campaign_data['name'],
                'description': campaign_data.get('description', ''),
                'conditions': campaign_data['conditions'],
                'action': campaign_data['action'],
                'priority': campaign_data.get('priority', 1),
                'startDate': campaign_data.get('startDate'),
                'endDate': campaign_data.get('endDate'),
                'isActive': campaign_data.get('isActive', True),
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat(),
                'stats': {
                    'evaluations': 0,
                    'matches': 0,
                    'conversions': 0
                }
            }
            
            # Store in DynamoDB
            campaigns_table.put_item(Item=campaign_item)
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({
                    'campaignId': campaign_id,
                    'campaign': campaign_item
                }, default=str)
            }
            
        except Exception as e:
            logger.error(f"Error creating campaign: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def get_campaign(self, campaign_id, headers):
        """Retrieve a specific campaign"""
        try:
            response = campaigns_table.get_item(
                Key={'campaignId': campaign_id}
            )
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Campaign not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(response['Item'], default=str)
            }
            
        except Exception as e:
            logger.error(f"Error retrieving campaign: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    # ============ CONDITION EVALUATION ============

    def evaluate_single_condition(self, evaluation_data, headers):
        """Evaluate a single condition against provided context"""
        try:
            # Validate required fields
            required_fields = ['conditionId', 'context']
            for field in required_fields:
                if field not in evaluation_data:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': f'Missing required field: {field}'})
                    }
            
            condition_id = evaluation_data['conditionId']
            context = evaluation_data['context']
            
            # Retrieve condition
            condition_response = conditions_table.get_item(
                Key={'conditionId': condition_id}
            )
            
            if 'Item' not in condition_response:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Condition not found'})
                }
            
            condition = condition_response['Item']
            
            # Evaluate condition
            result = self.evaluate_condition_logic(condition, context)
            
            # Store evaluation result
            evaluation_id = str(uuid.uuid4())
            evaluation_record = {
                'evaluationId': evaluation_id,
                'conditionId': condition_id,
                'context': context,
                'result': result,
                'timestamp': datetime.utcnow().isoformat(),
                'executionTime': result.get('executionTime', 0)
            }
            
            evaluations_table.put_item(Item=evaluation_record)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'evaluationId': evaluation_id,
                    'result': result
                }, default=str)
            }
            
        except Exception as e:
            logger.error(f"Error evaluating condition: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def batch_evaluate_conditions(self, evaluation_data, headers):
        """Evaluate multiple conditions in batch"""
        try:
            # Validate required fields
            if 'evaluations' not in evaluation_data:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Missing evaluations array'})
                }
            
            evaluations = evaluation_data['evaluations']
            results = []
            
            for evaluation in evaluations:
                try:
                    # Individual evaluation logic here
                    condition_id = evaluation['conditionId']
                    context = evaluation['context']
                    
                    # Retrieve condition
                    condition_response = conditions_table.get_item(
                        Key={'conditionId': condition_id}
                    )
                    
                    if 'Item' in condition_response:
                        condition = condition_response['Item']
                        result = self.evaluate_condition_logic(condition, context)
                        results.append({
                            'conditionId': condition_id,
                            'result': result
                        })
                    else:
                        results.append({
                            'conditionId': condition_id,
                            'error': 'Condition not found'
                        })
                        
                except Exception as e:
                    results.append({
                        'conditionId': evaluation.get('conditionId', 'unknown'),
                        'error': str(e)
                    })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'results': results,
                    'processed': len(results)
                }, default=str)
            }
            
        except Exception as e:
            logger.error(f"Error in batch evaluation: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def evaluate_condition_logic(self, condition, context):
        """Core condition evaluation logic"""
        start_time = datetime.utcnow()
        
        try:
            condition_type = condition['type']
            operator = condition['operator']
            expected_value = condition['value']
            
            # Extract context value based on condition type
            context_value = self.extract_context_value(condition_type, context)
            
            # Perform comparison based on operator
            matches = self.perform_comparison(operator, context_value, expected_value)
            
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            return {
                'matches': matches,
                'contextValue': context_value,
                'expectedValue': expected_value,
                'operator': operator,
                'executionTime': execution_time
            }
            
        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            return {
                'matches': False,
                'error': str(e),
                'executionTime': execution_time
            }

    def extract_context_value(self, condition_type, context):
        """Extract the relevant value from context based on condition type"""
        value_mappings = {
            'location.latitude': lambda ctx: ctx.get('location', {}).get('latitude'),
            'location.longitude': lambda ctx: ctx.get('location', {}).get('longitude'),
            'location.city': lambda ctx: ctx.get('location', {}).get('city'),
            'customer.tier': lambda ctx: ctx.get('customer', {}).get('loyaltyTier'),
            'customer.orderCount': lambda ctx: ctx.get('customer', {}).get('orderCount'),
            'order.amount': lambda ctx: ctx.get('order', {}).get('amount'),
            'time.hour': lambda ctx: datetime.utcnow().hour,
            'time.dayOfWeek': lambda ctx: datetime.utcnow().weekday()
        }
        
        if condition_type in value_mappings:
            return value_mappings[condition_type](context)
        
        # Default: try to extract directly from context
        return context.get(condition_type)

    def perform_comparison(self, operator, context_value, expected_value):
        """Perform comparison based on operator"""
        if context_value is None:
            return False
        
        operators = {
            'equals': lambda cv, ev: cv == ev,
            'not_equals': lambda cv, ev: cv != ev,
            'greater_than': lambda cv, ev: float(cv) > float(ev),
            'less_than': lambda cv, ev: float(cv) < float(ev),
            'greater_equal': lambda cv, ev: float(cv) >= float(ev),
            'less_equal': lambda cv, ev: float(cv) <= float(ev),
            'contains': lambda cv, ev: str(ev).lower() in str(cv).lower(),
            'starts_with': lambda cv, ev: str(cv).lower().startswith(str(ev).lower()),
            'in': lambda cv, ev: cv in ev if isinstance(ev, list) else False
        }
        
        if operator not in operators:
            raise ValueError(f"Unsupported operator: {operator}")
        
        return operators[operator](context_value, expected_value)

    # ============ ANALYTICS ============

    def get_campaign_analytics(self, campaign_id, query_params, headers):
        """Get analytics for a specific campaign"""
        try:
            time_range = query_params.get('timeRange', '24h')
            
            # Calculate time range
            end_time = datetime.utcnow()
            if time_range == '1h':
                start_time = end_time - timedelta(hours=1)
            elif time_range == '24h':
                start_time = end_time - timedelta(days=1)
            elif time_range == '7d':
                start_time = end_time - timedelta(days=7)
            elif time_range == '30d':
                start_time = end_time - timedelta(days=30)
            else:
                start_time = end_time - timedelta(days=1)
            
            # Query analytics data
            analytics_response = analytics_table.query(
                IndexName='campaignId-timestamp-index',
                KeyConditionExpression='campaignId = :campaign_id AND #ts BETWEEN :start_time AND :end_time',
                ExpressionAttributeNames={'#ts': 'timestamp'},
                ExpressionAttributeValues={
                    ':campaign_id': campaign_id,
                    ':start_time': start_time.isoformat(),
                    ':end_time': end_time.isoformat()
                }
            )
            
            analytics_data = analytics_response.get('Items', [])
            
            # Process analytics
            processed_analytics = self.process_campaign_analytics(analytics_data)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'campaignId': campaign_id,
                    'timeRange': time_range,
                    'analytics': processed_analytics
                }, default=str)
            }
            
        except Exception as e:
            logger.error(f"Error getting campaign analytics: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def process_campaign_analytics(self, analytics_data):
        """Process raw analytics data into insights"""
        if not analytics_data:
            return {
                'totalEvaluations': 0,
                'totalMatches': 0,
                'conversionRate': 0,
                'averageExecutionTime': 0
            }
        
        total_evaluations = len(analytics_data)
        total_matches = sum(1 for item in analytics_data if item.get('result', {}).get('matches', False))
        total_execution_time = sum(item.get('result', {}).get('executionTime', 0) for item in analytics_data)
        
        return {
            'totalEvaluations': total_evaluations,
            'totalMatches': total_matches,
            'conversionRate': (total_matches / total_evaluations * 100) if total_evaluations > 0 else 0,
            'averageExecutionTime': total_execution_time / total_evaluations if total_evaluations > 0 else 0,
            'breakdown': self.create_analytics_breakdown(analytics_data)
        }

    def create_analytics_breakdown(self, analytics_data):
        """Create detailed breakdown of analytics data"""
        # Group by hour
        hourly_breakdown = {}
        for item in analytics_data:
            timestamp = datetime.fromisoformat(item.get('timestamp', ''))
            hour_key = timestamp.strftime('%Y-%m-%d %H:00')
            
            if hour_key not in hourly_breakdown:
                hourly_breakdown[hour_key] = {'evaluations': 0, 'matches': 0}
            
            hourly_breakdown[hour_key]['evaluations'] += 1
            if item.get('result', {}).get('matches', False):
                hourly_breakdown[hour_key]['matches'] += 1
        
        return hourly_breakdown

# Lambda handler function
def lambda_handler(event, context):
    """Main Lambda entry point"""
    # Handle warmup requests
    if event.get('warmup'):
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Function warmed up',
                'timestamp': datetime.now().isoformat()
            })
        }
    
    api = ConditionEngineAPI()
    return api.lambda_handler(event, context)
