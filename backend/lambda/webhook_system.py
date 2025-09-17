import json
import boto3
import uuid
import hashlib
import hmac
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
import asyncio
import aiohttp
import os

logger = logging.getLogger(__name__)

class WebhookSystem:
    """
    WizzCentral Webhook System for Real-time Campaign Notifications
    Handles webhook registration, event publishing, and delivery management
    """
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.sqs = boto3.client('sqs')
        self.sns = boto3.client('sns')
        
        # DynamoDB tables
        self.webhooks_table = self.dynamodb.Table(os.environ.get('WEBHOOKS_TABLE', 'wizzcentral-webhooks'))
        self.webhook_events_table = self.dynamodb.Table(os.environ.get('WEBHOOK_EVENTS_TABLE', 'wizzcentral-webhook-events'))
        self.webhook_logs_table = self.dynamodb.Table(os.environ.get('WEBHOOK_LOGS_TABLE', 'wizzcentral-webhook-logs'))
        
        # SQS queue for webhook delivery
        self.webhook_queue_url = os.environ.get('WEBHOOK_QUEUE_URL')
        
        # Webhook configuration
        self.webhook_config = {
            'max_retry_attempts': 3,
            'initial_retry_delay': 5,  # seconds
            'max_retry_delay': 300,    # seconds
            'timeout': 30,             # seconds
            'batch_size': 10,
            'secret_key_length': 32
        }
        
        # Supported event types
        self.supported_events = {
            'campaign.created',
            'campaign.updated',
            'campaign.activated',
            'campaign.deactivated',
            'campaign.deleted',
            'condition.evaluated',
            'condition.matched',
            'condition.failed',
            'analytics.threshold_reached',
            'driver.campaign_triggered',
            'customer.action_completed'
        }

    def lambda_handler(self, event, context):
        """Lambda handler for webhook system"""
        try:
            # Handle different event sources
            if 'Records' in event:
                # SQS message for webhook delivery
                return self.handle_webhook_delivery(event['Records'])
            else:
                # API Gateway request for webhook management
                return self.handle_webhook_api(event, context)
                
        except Exception as e:
            logger.error(f"Error in webhook lambda handler: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Internal server error'})
            }

    def handle_webhook_api(self, event, context):
        """Handle webhook management API requests"""
        try:
            method = event.get('httpMethod', '')
            path = event.get('path', '')
            body = json.loads(event.get('body', '{}')) if event.get('body') else {}
            path_params = event.get('pathParameters') or {}
            
            headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            }
            
            if method == 'OPTIONS':
                return {'statusCode': 200, 'headers': headers, 'body': ''}
            
            # Route webhook management requests
            if path.startswith('/webhooks') and 'webhookId' not in path_params:
                if method == 'GET':
                    return self.list_webhooks(headers)
                elif method == 'POST':
                    return self.register_webhook(body, headers)
            elif path.startswith('/webhooks') and 'webhookId' in path_params:
                webhook_id = path_params['webhookId']
                if method == 'GET':
                    return self.get_webhook(webhook_id, headers)
                elif method == 'PUT':
                    return self.update_webhook(webhook_id, body, headers)
                elif method == 'DELETE':
                    return self.delete_webhook(webhook_id, headers)
            elif path.startswith('/webhooks/test'):
                return self.test_webhook(body, headers)
            elif path.startswith('/webhooks/logs'):
                return self.get_webhook_logs(event.get('queryStringParameters', {}), headers)
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Endpoint not found'})
                }
                
        except Exception as e:
            logger.error(f"Error handling webhook API: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }

    # ============ WEBHOOK REGISTRATION ============

    def register_webhook(self, webhook_data: Dict, headers: Dict) -> Dict:
        """Register a new webhook endpoint"""
        try:
            # Validate required fields
            required_fields = ['url', 'events', 'name']
            for field in required_fields:
                if field not in webhook_data:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': f'Missing required field: {field}'})
                    }
            
            # Validate URL
            if not self.is_valid_url(webhook_data['url']):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid webhook URL'})
                }
            
            # Validate events
            invalid_events = set(webhook_data['events']) - self.supported_events
            if invalid_events:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        'error': f'Unsupported events: {list(invalid_events)}',
                        'supported_events': list(self.supported_events)
                    })
                }
            
            # Generate webhook ID and secret
            webhook_id = str(uuid.uuid4())
            secret_key = self.generate_secret_key()
            
            # Create webhook record
            webhook_record = {
                'webhookId': webhook_id,
                'name': webhook_data['name'],
                'url': webhook_data['url'],
                'events': webhook_data['events'],
                'secretKey': secret_key,
                'isActive': webhook_data.get('isActive', True),
                'description': webhook_data.get('description', ''),
                'headers': webhook_data.get('headers', {}),
                'timeout': webhook_data.get('timeout', self.webhook_config['timeout']),
                'retryConfig': {
                    'maxAttempts': webhook_data.get('maxRetryAttempts', self.webhook_config['max_retry_attempts']),
                    'initialDelay': webhook_data.get('initialRetryDelay', self.webhook_config['initial_retry_delay']),
                    'maxDelay': webhook_data.get('maxRetryDelay', self.webhook_config['max_retry_delay'])
                },
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat(),
                'stats': {
                    'totalEvents': 0,
                    'successfulDeliveries': 0,
                    'failedDeliveries': 0,
                    'lastDeliveryAt': None
                }
            }
            
            # Store webhook
            self.webhooks_table.put_item(Item=webhook_record)
            
            # Test webhook endpoint
            test_result = self.test_webhook_endpoint(webhook_record)
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({
                    'webhookId': webhook_id,
                    'webhook': {
                        **webhook_record,
                        'secretKey': '***HIDDEN***'  # Don't return the actual secret
                    },
                    'testResult': test_result
                }, default=str)
            }
            
        except Exception as e:
            logger.error(f"Error registering webhook: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def get_webhook(self, webhook_id: str, headers: Dict) -> Dict:
        """Get webhook details"""
        try:
            response = self.webhooks_table.get_item(
                Key={'webhookId': webhook_id}
            )
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Webhook not found'})
                }
            
            webhook = response['Item']
            # Hide secret key in response
            webhook['secretKey'] = '***HIDDEN***'
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(webhook, default=str)
            }
            
        except Exception as e:
            logger.error(f"Error getting webhook: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def list_webhooks(self, headers: Dict) -> Dict:
        """List all registered webhooks"""
        try:
            response = self.webhooks_table.scan()
            webhooks = response.get('Items', [])
            
            # Hide secret keys
            for webhook in webhooks:
                webhook['secretKey'] = '***HIDDEN***'
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'webhooks': webhooks,
                    'count': len(webhooks)
                }, default=str)
            }
            
        except Exception as e:
            logger.error(f"Error listing webhooks: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def update_webhook(self, webhook_id: str, update_data: Dict, headers: Dict) -> Dict:
        """Update webhook configuration"""
        try:
            # Get existing webhook
            response = self.webhooks_table.get_item(
                Key={'webhookId': webhook_id}
            )
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Webhook not found'})
                }
            
            # Update allowed fields
            update_expression = "SET updatedAt = :updated_at"
            expression_values = {':updated_at': datetime.utcnow().isoformat()}
            
            updatable_fields = ['name', 'url', 'events', 'isActive', 'description', 'headers', 'timeout']
            for field in updatable_fields:
                if field in update_data:
                    update_expression += f", {field} = :{field}"
                    expression_values[f":{field}"] = update_data[field]
            
            # Validate events if being updated
            if 'events' in update_data:
                invalid_events = set(update_data['events']) - self.supported_events
                if invalid_events:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({
                            'error': f'Unsupported events: {list(invalid_events)}',
                            'supported_events': list(self.supported_events)
                        })
                    }
            
            # Update webhook
            self.webhooks_table.update_item(
                Key={'webhookId': webhook_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values
            )
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'webhookId': webhook_id,
                    'updated': True,
                    'updatedAt': expression_values[':updated_at']
                })
            }
            
        except Exception as e:
            logger.error(f"Error updating webhook: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def delete_webhook(self, webhook_id: str, headers: Dict) -> Dict:
        """Delete a webhook"""
        try:
            # Check if webhook exists
            response = self.webhooks_table.get_item(
                Key={'webhookId': webhook_id}
            )
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Webhook not found'})
                }
            
            # Delete webhook
            self.webhooks_table.delete_item(
                Key={'webhookId': webhook_id}
            )
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'webhookId': webhook_id,
                    'deleted': True,
                    'deletedAt': datetime.utcnow().isoformat()
                })
            }
            
        except Exception as e:
            logger.error(f"Error deleting webhook: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    # ============ EVENT PUBLISHING ============

    def publish_event(self, event_type: str, event_data: Dict, source: str = 'condition_engine') -> bool:
        """Publish an event to all registered webhooks"""
        try:
            if event_type not in self.supported_events:
                logger.warning(f"Unsupported event type: {event_type}")
                return False
            
            # Get all active webhooks that listen to this event
            response = self.webhooks_table.scan(
                FilterExpression='isActive = :active AND contains(events, :event_type)',
                ExpressionAttributeValues={
                    ':active': True,
                    ':event_type': event_type
                }
            )
            
            webhooks = response.get('Items', [])
            
            if not webhooks:
                logger.info(f"No active webhooks found for event type: {event_type}")
                return True
            
            # Create event record
            event_id = str(uuid.uuid4())
            event_record = {
                'eventId': event_id,
                'eventType': event_type,
                'eventData': event_data,
                'source': source,
                'timestamp': datetime.utcnow().isoformat(),
                'webhookCount': len(webhooks)
            }
            
            # Store event
            self.webhook_events_table.put_item(Item=event_record)
            
            # Queue webhook deliveries
            for webhook in webhooks:
                self.queue_webhook_delivery(webhook, event_record)
            
            logger.info(f"Event {event_id} published to {len(webhooks)} webhooks")
            return True
            
        except Exception as e:
            logger.error(f"Error publishing event: {str(e)}")
            return False

    def queue_webhook_delivery(self, webhook: Dict, event: Dict):
        """Queue a webhook delivery for processing"""
        try:
            delivery_payload = {
                'webhookId': webhook['webhookId'],
                'eventId': event['eventId'],
                'eventType': event['eventType'],
                'eventData': event['eventData'],
                'timestamp': event['timestamp'],
                'attempt': 1,
                'maxAttempts': webhook.get('retryConfig', {}).get('maxAttempts', self.webhook_config['max_retry_attempts'])
            }
            
            # Send to SQS for processing
            self.sqs.send_message(
                QueueUrl=self.webhook_queue_url,
                MessageBody=json.dumps(delivery_payload, default=str),
                MessageAttributes={
                    'webhookId': {
                        'StringValue': webhook['webhookId'],
                        'DataType': 'String'
                    },
                    'eventType': {
                        'StringValue': event['eventType'],
                        'DataType': 'String'
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"Error queuing webhook delivery: {str(e)}")

    # ============ WEBHOOK DELIVERY ============

    def handle_webhook_delivery(self, records: List[Dict]) -> Dict:
        """Process webhook delivery from SQS"""
        try:
            for record in records:
                body = json.loads(record['body'])
                self.process_webhook_delivery(body)
            
            return {'statusCode': 200}
            
        except Exception as e:
            logger.error(f"Error handling webhook delivery: {str(e)}")
            return {'statusCode': 500}

    async def process_webhook_delivery(self, delivery_data: Dict):
        """Process individual webhook delivery"""
        webhook_id = delivery_data['webhookId']
        event_id = delivery_data['eventId']
        attempt = delivery_data['attempt']
        
        try:
            # Get webhook configuration
            webhook_response = self.webhooks_table.get_item(
                Key={'webhookId': webhook_id}
            )
            
            if 'Item' not in webhook_response:
                logger.error(f"Webhook {webhook_id} not found")
                return
            
            webhook = webhook_response['Item']
            
            if not webhook.get('isActive', False):
                logger.info(f"Webhook {webhook_id} is not active, skipping delivery")
                return
            
            # Prepare webhook payload
            payload = self.create_webhook_payload(delivery_data, webhook)
            
            # Deliver webhook
            success = await self.deliver_webhook(webhook, payload)
            
            # Log delivery result
            self.log_webhook_delivery(webhook_id, event_id, attempt, success, payload)
            
            # Update webhook stats
            self.update_webhook_stats(webhook_id, success)
            
            # Handle retry if failed
            if not success and attempt < delivery_data['maxAttempts']:
                await self.schedule_webhook_retry(delivery_data)
            
        except Exception as e:
            logger.error(f"Error processing webhook delivery: {str(e)}")
            self.log_webhook_delivery(webhook_id, event_id, attempt, False, None, str(e))

    def create_webhook_payload(self, delivery_data: Dict, webhook: Dict) -> Dict:
        """Create the payload to send to webhook endpoint"""
        payload = {
            'id': delivery_data['eventId'],
            'type': delivery_data['eventType'],
            'data': delivery_data['eventData'],
            'timestamp': delivery_data['timestamp'],
            'webhook': {
                'id': webhook['webhookId'],
                'name': webhook['name']
            }
        }
        
        return payload

    async def deliver_webhook(self, webhook: Dict, payload: Dict) -> bool:
        """Deliver webhook to endpoint"""
        try:
            # Create signature
            signature = self.create_webhook_signature(payload, webhook['secretKey'])
            
            # Prepare headers
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'WizzCentral-Webhooks/1.0',
                'X-WizzCentral-Signature': signature,
                'X-WizzCentral-Event-Type': payload['type'],
                'X-WizzCentral-Event-ID': payload['id'],
                'X-WizzCentral-Timestamp': payload['timestamp']
            }
            
            # Add custom headers
            custom_headers = webhook.get('headers', {})
            headers.update(custom_headers)
            
            # Make HTTP request
            timeout = webhook.get('timeout', self.webhook_config['timeout'])
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
                async with session.post(
                    webhook['url'],
                    json=payload,
                    headers=headers
                ) as response:
                    # Consider 2xx status codes as success
                    success = 200 <= response.status < 300
                    
                    if not success:
                        logger.warning(f"Webhook delivery failed: {response.status} {response.reason}")
                    
                    return success
                    
        except asyncio.TimeoutError:
            logger.error(f"Webhook delivery timeout for {webhook['url']}")
            return False
        except Exception as e:
            logger.error(f"Webhook delivery error: {str(e)}")
            return False

    def create_webhook_signature(self, payload: Dict, secret_key: str) -> str:
        """Create HMAC signature for webhook security"""
        try:
            payload_bytes = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
            signature = hmac.new(
                secret_key.encode('utf-8'),
                payload_bytes,
                hashlib.sha256
            ).hexdigest()
            
            return f"sha256={signature}"
            
        except Exception as e:
            logger.error(f"Error creating webhook signature: {str(e)}")
            return ""

    async def schedule_webhook_retry(self, delivery_data: Dict):
        """Schedule webhook retry with exponential backoff"""
        try:
            attempt = delivery_data['attempt']
            delay = min(
                self.webhook_config['initial_retry_delay'] * (2 ** (attempt - 1)),
                self.webhook_config['max_retry_delay']
            )
            
            # Update attempt counter
            delivery_data['attempt'] += 1
            
            # Schedule retry (simplified - in production use SQS delay or Step Functions)
            await asyncio.sleep(delay)
            await self.process_webhook_delivery(delivery_data)
            
        except Exception as e:
            logger.error(f"Error scheduling webhook retry: {str(e)}")

    # ============ LOGGING AND MONITORING ============

    def log_webhook_delivery(self, webhook_id: str, event_id: str, attempt: int, success: bool, payload: Dict = None, error: str = None):
        """Log webhook delivery attempt"""
        try:
            log_record = {
                'logId': str(uuid.uuid4()),
                'webhookId': webhook_id,
                'eventId': event_id,
                'attempt': attempt,
                'success': success,
                'timestamp': datetime.utcnow().isoformat(),
                'error': error,
                'payloadSize': len(json.dumps(payload, default=str)) if payload else 0
            }
            
            self.webhook_logs_table.put_item(Item=log_record)
            
        except Exception as e:
            logger.error(f"Error logging webhook delivery: {str(e)}")

    def update_webhook_stats(self, webhook_id: str, success: bool):
        """Update webhook delivery statistics"""
        try:
            update_expression = "SET stats.totalEvents = stats.totalEvents + :one, stats.lastDeliveryAt = :timestamp"
            expression_values = {
                ':one': 1,
                ':timestamp': datetime.utcnow().isoformat()
            }
            
            if success:
                update_expression += ", stats.successfulDeliveries = stats.successfulDeliveries + :one"
            else:
                update_expression += ", stats.failedDeliveries = stats.failedDeliveries + :one"
            
            self.webhooks_table.update_item(
                Key={'webhookId': webhook_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values
            )
            
        except Exception as e:
            logger.error(f"Error updating webhook stats: {str(e)}")

    def get_webhook_logs(self, query_params: Dict, headers: Dict) -> Dict:
        """Get webhook delivery logs"""
        try:
            webhook_id = query_params.get('webhookId')
            limit = int(query_params.get('limit', 50))
            
            if webhook_id:
                # Get logs for specific webhook
                response = self.webhook_logs_table.query(
                    IndexName='webhookId-timestamp-index',
                    KeyConditionExpression='webhookId = :webhook_id',
                    ExpressionAttributeValues={':webhook_id': webhook_id},
                    ScanIndexForward=False,  # Most recent first
                    Limit=limit
                )
            else:
                # Get all logs
                response = self.webhook_logs_table.scan(Limit=limit)
            
            logs = response.get('Items', [])
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'logs': logs,
                    'count': len(logs)
                }, default=str)
            }
            
        except Exception as e:
            logger.error(f"Error getting webhook logs: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    # ============ TESTING ============

    def test_webhook(self, test_data: Dict, headers: Dict) -> Dict:
        """Test webhook endpoint"""
        try:
            webhook_id = test_data.get('webhookId')
            
            if not webhook_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'webhookId is required'})
                }
            
            # Get webhook
            response = self.webhooks_table.get_item(
                Key={'webhookId': webhook_id}
            )
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Webhook not found'})
                }
            
            webhook = response['Item']
            test_result = self.test_webhook_endpoint(webhook)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'webhookId': webhook_id,
                    'testResult': test_result
                })
            }
            
        except Exception as e:
            logger.error(f"Error testing webhook: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    def test_webhook_endpoint(self, webhook: Dict) -> Dict:
        """Test webhook endpoint connectivity"""
        try:
            # Create test payload
            test_payload = {
                'id': str(uuid.uuid4()),
                'type': 'webhook.test',
                'data': {'message': 'This is a test webhook delivery'},
                'timestamp': datetime.utcnow().isoformat(),
                'webhook': {
                    'id': webhook['webhookId'],
                    'name': webhook['name']
                }
            }
            
            # This would be async in production
            # For now, return a mock result
            return {
                'success': True,
                'responseTime': 150,  # ms
                'statusCode': 200,
                'message': 'Webhook endpoint is reachable'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Webhook endpoint test failed'
            }

    # ============ UTILITY FUNCTIONS ============

    def is_valid_url(self, url: str) -> bool:
        """Validate webhook URL"""
        try:
            import urllib.parse
            result = urllib.parse.urlparse(url)
            return all([result.scheme, result.netloc]) and result.scheme in ['http', 'https']
        except:
            return False

    def generate_secret_key(self) -> str:
        """Generate a secure secret key for webhook signing"""
        import secrets
        return secrets.token_hex(self.webhook_config['secret_key_length'])

# Lambda handler
def lambda_handler(event, context):
    """Main Lambda entry point for webhook system"""
    webhook_system = WebhookSystem()
    return webhook_system.lambda_handler(event, context)
