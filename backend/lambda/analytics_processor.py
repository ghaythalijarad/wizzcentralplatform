"""
Analytics Processor Lambda Function
Processes analytics data from DynamoDB streams and scheduled events
"""
import json
import boto3
import os
from datetime import datetime, timezone, timedelta
from decimal import Decimal

# Initialize clients
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

# Table references
analytics_table = dynamodb.Table(os.environ['ANALYTICS_TABLE'])
evaluations_table = dynamodb.Table(os.environ['EVALUATIONS_TABLE'])
campaigns_table = dynamodb.Table(os.environ['CAMPAIGNS_TABLE'])

def lambda_handler(event, context):
    """
    Process analytics data from different event sources
    """
    try:
        # Check event source
        if 'Records' in event:
            # DynamoDB Stream event
            return process_stream_records(event['Records'])
        elif 'source' in event and event['source'] == 'aws.events':
            # Scheduled event
            return process_scheduled_analytics()
        else:
            # Direct invocation
            return process_direct_analytics(event)
    
    except Exception as e:
        print(f"Error in analytics processor: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_stream_records(records):
    """Process DynamoDB stream records"""
    processed = 0
    
    for record in records:
        try:
            if record['eventName'] in ['INSERT', 'MODIFY']:
                evaluation_data = record['dynamodb'].get('NewImage', {})
                
                # Convert DynamoDB format to regular dict
                evaluation = convert_dynamodb_to_dict(evaluation_data)
                
                # Process the evaluation for analytics
                process_evaluation_analytics(evaluation)
                processed += 1
                
        except Exception as e:
            print(f"Error processing stream record: {str(e)}")
            continue
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Processed {processed} stream records'
        })
    }

def process_scheduled_analytics():
    """Process scheduled analytics generation"""
    try:
        # Generate campaign performance metrics
        campaign_metrics = generate_campaign_metrics()
        
        # Generate condition effectiveness metrics
        condition_metrics = generate_condition_metrics()
        
        # Send metrics to CloudWatch
        send_cloudwatch_metrics(campaign_metrics, condition_metrics)
        
        # Store aggregated analytics
        store_aggregated_analytics(campaign_metrics, condition_metrics)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Scheduled analytics processed successfully',
                'campaignMetrics': len(campaign_metrics),
                'conditionMetrics': len(condition_metrics)
            })
        }
        
    except Exception as e:
        print(f"Error in scheduled analytics: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_direct_analytics(event):
    """Process direct analytics request"""
    try:
        campaign_id = event.get('campaignId')
        time_range = event.get('timeRange', 'last_24h')
        
        if campaign_id:
            analytics = generate_campaign_analytics(campaign_id, time_range)
        else:
            analytics = generate_overall_analytics(time_range)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'analytics': analytics,
                'generatedAt': datetime.now(timezone.utc).isoformat()
            })
        }
        
    except Exception as e:
        print(f"Error in direct analytics: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_evaluation_analytics(evaluation):
    """Process analytics for a single evaluation"""
    try:
        analytics_id = f"eval_{evaluation['evaluationId']}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        
        analytics_record = {
            'analyticsId': analytics_id,
            'campaignId': evaluation.get('campaignId', 'unknown'),
            'conditionId': evaluation.get('conditionId'),
            'result': evaluation.get('result', False),
            'timestamp': evaluation.get('timestamp', datetime.now(timezone.utc).isoformat()),
            'metadata': {
                'evaluationId': evaluation['evaluationId'],
                'processingTime': datetime.now(timezone.utc).isoformat()
            },
            'ttl': int(datetime.now(timezone.utc).timestamp()) + 7776000  # 90 days
        }
        
        analytics_table.put_item(Item=analytics_record)
        
    except Exception as e:
        print(f"Error processing evaluation analytics: {str(e)}")

def generate_campaign_metrics():
    """Generate metrics for all active campaigns"""
    try:
        # Get active campaigns
        campaigns_response = campaigns_table.scan(
            FilterExpression='isActive = :active',
            ExpressionAttributeValues={':active': 1}
        )
        
        metrics = []
        for campaign in campaigns_response['Items']:
            campaign_id = campaign['campaignId']
            
            # Get evaluations for this campaign in the last 24 hours
            yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
            
            evaluations_response = evaluations_table.scan(
                FilterExpression='campaignId = :cid AND #ts > :yesterday',
                ExpressionAttributeNames={'#ts': 'timestamp'},
                ExpressionAttributeValues={
                    ':cid': campaign_id,
                    ':yesterday': yesterday.isoformat()
                }
            )
            
            total_evaluations = len(evaluations_response['Items'])
            successful_evaluations = sum(1 for e in evaluations_response['Items'] if e.get('result'))
            
            metrics.append({
                'campaignId': campaign_id,
                'totalEvaluations': total_evaluations,
                'successfulEvaluations': successful_evaluations,
                'successRate': successful_evaluations / total_evaluations if total_evaluations > 0 else 0,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        
        return metrics
        
    except Exception as e:
        print(f"Error generating campaign metrics: {str(e)}")
        return []

def generate_condition_metrics():
    """Generate metrics for condition effectiveness"""
    try:
        # Get evaluations from the last 24 hours
        yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
        
        evaluations_response = evaluations_table.scan(
            FilterExpression='#ts > :yesterday',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={':yesterday': yesterday.isoformat()}
        )
        
        condition_stats = {}
        
        for evaluation in evaluations_response['Items']:
            condition_id = evaluation.get('conditionId')
            result = evaluation.get('result', False)
            
            if condition_id not in condition_stats:
                condition_stats[condition_id] = {
                    'total': 0,
                    'successful': 0
                }
            
            condition_stats[condition_id]['total'] += 1
            if result:
                condition_stats[condition_id]['successful'] += 1
        
        metrics = []
        for condition_id, stats in condition_stats.items():
            metrics.append({
                'conditionId': condition_id,
                'totalEvaluations': stats['total'],
                'successfulEvaluations': stats['successful'],
                'successRate': stats['successful'] / stats['total'] if stats['total'] > 0 else 0,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        
        return metrics
        
    except Exception as e:
        print(f"Error generating condition metrics: {str(e)}")
        return []

def send_cloudwatch_metrics(campaign_metrics, condition_metrics):
    """Send metrics to CloudWatch"""
    try:
        metric_data = []
        
        # Campaign metrics
        for campaign in campaign_metrics:
            metric_data.extend([
                {
                    'MetricName': 'TotalEvaluations',
                    'Dimensions': [
                        {'Name': 'CampaignId', 'Value': campaign['campaignId']}
                    ],
                    'Value': campaign['totalEvaluations'],
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'SuccessRate',
                    'Dimensions': [
                        {'Name': 'CampaignId', 'Value': campaign['campaignId']}
                    ],
                    'Value': campaign['successRate'],
                    'Unit': 'Percent'
                }
            ])
        
        # Condition metrics
        for condition in condition_metrics:
            metric_data.extend([
                {
                    'MetricName': 'ConditionEvaluations',
                    'Dimensions': [
                        {'Name': 'ConditionId', 'Value': condition['conditionId']}
                    ],
                    'Value': condition['totalEvaluations'],
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'ConditionSuccessRate',
                    'Dimensions': [
                        {'Name': 'ConditionId', 'Value': condition['conditionId']}
                    ],
                    'Value': condition['successRate'],
                    'Unit': 'Percent'
                }
            ])
        
        # Send metrics in batches of 20 (CloudWatch limit)
        for i in range(0, len(metric_data), 20):
            batch = metric_data[i:i+20]
            cloudwatch.put_metric_data(
                Namespace='WizzCentral/ConditionEngine',
                MetricData=batch
            )
        
    except Exception as e:
        print(f"Error sending CloudWatch metrics: {str(e)}")

def store_aggregated_analytics(campaign_metrics, condition_metrics):
    """Store aggregated analytics data"""
    try:
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Store campaign analytics
        for campaign in campaign_metrics:
            analytics_id = f"campaign_{campaign['campaignId']}_{datetime.now(timezone.utc).strftime('%Y%m%d%H')}"
            
            analytics_table.put_item(Item={
                'analyticsId': analytics_id,
                'campaignId': campaign['campaignId'],
                'type': 'campaign_hourly',
                'timestamp': timestamp,
                'metrics': campaign,
                'ttl': int(datetime.now(timezone.utc).timestamp()) + 2592000  # 30 days
            })
        
        # Store condition analytics
        for condition in condition_metrics:
            analytics_id = f"condition_{condition['conditionId']}_{datetime.now(timezone.utc).strftime('%Y%m%d%H')}"
            
            analytics_table.put_item(Item={
                'analyticsId': analytics_id,
                'conditionId': condition['conditionId'],
                'type': 'condition_hourly',
                'timestamp': timestamp,
                'metrics': condition,
                'ttl': int(datetime.now(timezone.utc).timestamp()) + 2592000  # 30 days
            })
        
    except Exception as e:
        print(f"Error storing aggregated analytics: {str(e)}")

def convert_dynamodb_to_dict(dynamodb_item):
    """Convert DynamoDB item format to regular dict"""
    def convert_value(value):
        if 'S' in value:
            return value['S']
        elif 'N' in value:
            return Decimal(value['N'])
        elif 'B' in value:
            return value['B']
        elif 'SS' in value:
            return value['SS']
        elif 'NS' in value:
            return [Decimal(n) for n in value['NS']]
        elif 'BS' in value:
            return value['BS']
        elif 'M' in value:
            return {k: convert_value(v) for k, v in value['M'].items()}
        elif 'L' in value:
            return [convert_value(item) for item in value['L']]
        elif 'NULL' in value:
            return None
        elif 'BOOL' in value:
            return value['BOOL']
        else:
            return value
    
    return {k: convert_value(v) for k, v in dynamodb_item.items()}

def generate_campaign_analytics(campaign_id, time_range='last_24h'):
    """Generate analytics for a specific campaign"""
    # Implementation for specific campaign analytics
    pass

def generate_overall_analytics(time_range='last_24h'):
    """Generate overall system analytics"""
    # Implementation for overall analytics
    pass
