"""
Cache Warmer Lambda Function
Keeps Lambda functions warm and caches frequently accessed data
"""
import json
import boto3
import os
from datetime import datetime, timezone
from decimal import Decimal

# Initialize clients
lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')

# Table references
campaigns_table = dynamodb.Table(os.environ['CAMPAIGNS_TABLE'])
conditions_table = dynamodb.Table(os.environ['CONDITIONS_TABLE'])

def lambda_handler(event, context):
    """
    Warm up Lambda functions and refresh caches
    """
    try:
        results = {
            'warmedFunctions': [],
            'cachedData': {},
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # Warm up other Lambda functions
        function_names = [
            f"{os.environ.get('AWS_LAMBDA_FUNCTION_NAME', '').replace('cacheWarmer', 'conditionEngineApi')}",
            f"{os.environ.get('AWS_LAMBDA_FUNCTION_NAME', '').replace('cacheWarmer', 'conditionEvaluator')}",
            f"{os.environ.get('AWS_LAMBDA_FUNCTION_NAME', '').replace('cacheWarmer', 'analyticsProcessor')}"
        ]
        
        for function_name in function_names:
            if function_name and function_name != os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
                try:
                    warm_function(function_name)
                    results['warmedFunctions'].append(function_name)
                except Exception as e:
                    print(f"Failed to warm function {function_name}: {str(e)}")
        
        # Cache frequently accessed data
        results['cachedData']['activeCampaigns'] = cache_active_campaigns()
        results['cachedData']['activeConditions'] = cache_active_conditions()
        
        # Perform health checks
        health_status = perform_health_checks()
        results['healthChecks'] = health_status
        
        return {
            'statusCode': 200,
            'body': json.dumps(results, default=str)
        }
        
    except Exception as e:
        print(f"Error in cache warmer: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def warm_function(function_name):
    """
    Invoke a Lambda function to keep it warm
    """
    try:
        warm_payload = {
            'warmup': True,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='Event',  # Async invocation
            Payload=json.dumps(warm_payload)
        )
        
        print(f"Warmed function {function_name}: {response.get('StatusCode')}")
        
    except Exception as e:
        print(f"Error warming function {function_name}: {str(e)}")
        raise

def cache_active_campaigns():
    """
    Cache active campaigns data
    """
    try:
        response = campaigns_table.scan(
            FilterExpression='isActive = :active',
            ExpressionAttributeValues={':active': 1},
            ProjectionExpression='campaignId, campaignName, priority, startDate, endDate'
        )
        
        campaigns = response['Items']
        
        # Sort by priority
        campaigns.sort(key=lambda x: x.get('priority', 0), reverse=True)
        
        print(f"Cached {len(campaigns)} active campaigns")
        return {
            'count': len(campaigns),
            'campaigns': campaigns[:10],  # Cache top 10 for response size
            'lastUpdated': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        print(f"Error caching active campaigns: {str(e)}")
        return {'error': str(e)}

def cache_active_conditions():
    """
    Cache active conditions data
    """
    try:
        response = conditions_table.scan(
            FilterExpression='isActive = :active',
            ExpressionAttributeValues={':active': 1},
            ProjectionExpression='conditionId, conditionName, #type, criteria',
            ExpressionAttributeNames={'#type': 'type'}
        )
        
        conditions = response['Items']
        
        # Group by condition type
        conditions_by_type = {}
        for condition in conditions:
            condition_type = condition.get('type', 'unknown')
            if condition_type not in conditions_by_type:
                conditions_by_type[condition_type] = []
            conditions_by_type[condition_type].append(condition)
        
        print(f"Cached {len(conditions)} active conditions")
        return {
            'count': len(conditions),
            'byType': {k: len(v) for k, v in conditions_by_type.items()},
            'lastUpdated': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        print(f"Error caching active conditions: {str(e)}")
        return {'error': str(e)}

def perform_health_checks():
    """
    Perform basic health checks on the system
    """
    health_status = {
        'overall': 'healthy',
        'checks': [],
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    try:
        # Check DynamoDB tables
        table_checks = check_dynamodb_tables()
        health_status['checks'].extend(table_checks)
        
        # Check Lambda function availability
        lambda_checks = check_lambda_functions()
        health_status['checks'].extend(lambda_checks)
        
        # Determine overall health
        failed_checks = [check for check in health_status['checks'] if check['status'] != 'healthy']
        if failed_checks:
            health_status['overall'] = 'degraded' if len(failed_checks) < len(health_status['checks']) / 2 else 'unhealthy'
        
        return health_status
        
    except Exception as e:
        print(f"Error in health checks: {str(e)}")
        return {
            'overall': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

def check_dynamodb_tables():
    """
    Check DynamoDB table health
    """
    checks = []
    table_names = [
        os.environ['CAMPAIGNS_TABLE'],
        os.environ['CONDITIONS_TABLE'],
        os.environ['ANALYTICS_TABLE'],
        os.environ['EVALUATIONS_TABLE']
    ]
    
    for table_name in table_names:
        try:
            table = dynamodb.Table(table_name)
            table.load()
            
            checks.append({
                'name': f'DynamoDB Table: {table_name}',
                'status': 'healthy',
                'details': {
                    'status': table.table_status,
                    'itemCount': table.item_count
                }
            })
            
        except Exception as e:
            checks.append({
                'name': f'DynamoDB Table: {table_name}',
                'status': 'unhealthy',
                'error': str(e)
            })
    
    return checks

def check_lambda_functions():
    """
    Check Lambda function health
    """
    checks = []
    
    try:
        # Get current function configuration
        current_function = os.environ.get('AWS_LAMBDA_FUNCTION_NAME')
        if current_function:
            response = lambda_client.get_function(FunctionName=current_function)
            
            checks.append({
                'name': f'Lambda Function: {current_function}',
                'status': 'healthy',
                'details': {
                    'state': response['Configuration']['State'],
                    'runtime': response['Configuration']['Runtime'],
                    'memorySize': response['Configuration']['MemorySize']
                }
            })
    
    except Exception as e:
        checks.append({
            'name': 'Lambda Function Check',
            'status': 'unhealthy',
            'error': str(e)
        })
    
    return checks
