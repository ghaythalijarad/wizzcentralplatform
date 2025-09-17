import json
import boto3
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
import os

logger = logging.getLogger(__name__)

class MobileAppIntegrationService:
    """
    Mobile App Integration Service for WizzCentral Condition Engine
    Handles Flutter driver app integration with campaign targeting
    """
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.sns = boto3.client('sns')
        
        # DynamoDB tables
        self.campaigns_table = self.dynamodb.Table(os.environ.get('CAMPAIGNS_TABLE'))
        self.conditions_table = self.dynamodb.Table(os.environ.get('CONDITIONS_TABLE'))
        self.driver_profiles_table = self.dynamodb.Table(os.environ.get('DRIVER_PROFILES_TABLE'))
        self.mobile_sessions_table = self.dynamodb.Table(os.environ.get('MOBILE_SESSIONS_TABLE'))
        
        # Mobile-specific configurations
        self.mobile_config = {
            'max_campaigns_per_request': 10,
            'location_accuracy_threshold': 100,  # meters
            'cache_duration': 300,  # 5 minutes
            'offline_mode_duration': 1800,  # 30 minutes
            'push_notification_enabled': True
        }

    def lambda_handler(self, event, context):
        """Lambda handler for mobile app integration"""
        try:
            # Extract request data
            body = json.loads(event.get('body', '{}'))
            path = event.get('path', '')
            method = event.get('httpMethod', '')
            headers = event.get('headers', {})
            
            # Extract driver authentication
            driver_id = self.extract_driver_id(headers)
            if not driver_id:
                return self.create_response(401, {'error': 'Invalid driver authentication'})
            
            # Route mobile-specific requests
            if path.startswith('/mobile/driver/campaigns'):
                return self.handle_driver_campaigns_request(method, driver_id, body)
            elif path.startswith('/mobile/driver/location'):
                return self.handle_location_update(driver_id, body)
            elif path.startswith('/mobile/driver/session'):
                return self.handle_session_management(method, driver_id, body)
            elif path.startswith('/mobile/campaigns/evaluate'):
                return self.handle_mobile_evaluation(driver_id, body)
            elif path.startswith('/mobile/campaigns/action'):
                return self.handle_campaign_action(driver_id, body)
            else:
                return self.create_response(404, {'error': 'Endpoint not found'})
                
        except Exception as e:
            logger.error(f"Error in mobile integration handler: {str(e)}")
            return self.create_response(500, {'error': 'Internal server error'})

    def extract_driver_id(self, headers: Dict) -> Optional[str]:
        """Extract driver ID from request headers"""
        auth_header = headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            # Extract driver ID from JWT token (simplified)
            token = auth_header[7:]
            # In production, validate JWT and extract driver_id
            return "driver_123"  # Placeholder
        return None

    def create_response(self, status_code: int, body: Dict) -> Dict:
        """Create standardized API response"""
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps(body, default=str)
        }

    # ============ DRIVER CAMPAIGNS ============

    def handle_driver_campaigns_request(self, method: str, driver_id: str, body: Dict) -> Dict:
        """Handle driver-specific campaign requests"""
        try:
            if method == 'GET':
                return self.get_driver_campaigns(driver_id)
            elif method == 'POST':
                return self.evaluate_driver_campaigns(driver_id, body)
            else:
                return self.create_response(405, {'error': 'Method not allowed'})
                
        except Exception as e:
            logger.error(f"Error handling driver campaigns request: {str(e)}")
            return self.create_response(500, {'error': str(e)})

    def get_driver_campaigns(self, driver_id: str) -> Dict:
        """Get active campaigns for a driver"""
        try:
            # Get driver profile
            driver_profile = self.get_driver_profile(driver_id)
            if not driver_profile:
                return self.create_response(404, {'error': 'Driver profile not found'})
            
            # Get active campaigns
            campaigns_response = self.campaigns_table.scan(
                FilterExpression='isActive = :active',
                ExpressionAttributeValues={':active': 1}
            )
            
            active_campaigns = campaigns_response.get('Items', [])
            
            # Filter campaigns relevant to driver
            relevant_campaigns = self.filter_campaigns_for_driver(active_campaigns, driver_profile)
            
            # Optimize for mobile delivery
            mobile_optimized_campaigns = self.optimize_campaigns_for_mobile(relevant_campaigns)
            
            return self.create_response(200, {
                'campaigns': mobile_optimized_campaigns,
                'count': len(mobile_optimized_campaigns),
                'driverId': driver_id,
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error getting driver campaigns: {str(e)}")
            return self.create_response(500, {'error': str(e)})

    def get_driver_profile(self, driver_id: str) -> Optional[Dict]:
        """Retrieve driver profile from database"""
        try:
            response = self.driver_profiles_table.get_item(
                Key={'driverId': driver_id}
            )
            return response.get('Item')
        except Exception as e:
            logger.error(f"Error retrieving driver profile: {str(e)}")
            return None

    def filter_campaigns_for_driver(self, campaigns: List[Dict], driver_profile: Dict) -> List[Dict]:
        """Filter campaigns based on driver characteristics"""
        relevant_campaigns = []
        
        for campaign in campaigns:
            if self.is_campaign_relevant_for_driver(campaign, driver_profile):
                relevant_campaigns.append(campaign)
        
        # Sort by priority and relevance
        return sorted(relevant_campaigns, key=lambda c: c.get('priority', 1), reverse=True)

    def is_campaign_relevant_for_driver(self, campaign: Dict, driver_profile: Dict) -> bool:
        """Check if campaign is relevant for the driver"""
        try:
            conditions = campaign.get('conditions', [])
            
            for condition in conditions:
                condition_type = condition.get('type', '')
                
                # Check driver-specific conditions
                if condition_type.startswith('driver.'):
                    if not self.evaluate_driver_condition(condition, driver_profile):
                        return False
                
                # Check location-based conditions
                elif condition_type.startswith('location.'):
                    # Pre-filter based on driver's service area
                    if not self.is_location_in_service_area(condition, driver_profile):
                        return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking campaign relevance: {str(e)}")
            return False

    def evaluate_driver_condition(self, condition: Dict, driver_profile: Dict) -> bool:
        """Evaluate driver-specific conditions"""
        condition_type = condition.get('type', '')
        operator = condition.get('operator', '')
        expected_value = condition.get('value')
        
        value_mappings = {
            'driver.vehicle_type': lambda p: p.get('vehicleType'),
            'driver.rating': lambda p: p.get('rating', 0),
            'driver.experience_level': lambda p: p.get('experienceLevel'),
            'driver.delivery_capacity': lambda p: p.get('deliveryCapacity', 1),
            'driver.active_hours': lambda p: p.get('activeHours', []),
            'driver.service_areas': lambda p: p.get('serviceAreas', [])
        }
        
        if condition_type in value_mappings:
            driver_value = value_mappings[condition_type](driver_profile)
            return self.perform_comparison(operator, driver_value, expected_value)
        
        return True

    def is_location_in_service_area(self, condition: Dict, driver_profile: Dict) -> bool:
        """Check if location condition is within driver's service area"""
        try:
            service_areas = driver_profile.get('serviceAreas', [])
            condition_location = condition.get('value', {})
            
            if not service_areas or not condition_location:
                return True  # Allow if no restrictions
            
            # Check if condition location overlaps with service areas
            for area in service_areas:
                if self.location_overlaps(condition_location, area):
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking service area: {str(e)}")
            return True

    def location_overlaps(self, location1: Dict, location2: Dict) -> bool:
        """Check if two location conditions overlap"""
        # Simplified overlap check
        # In production, implement proper geographic calculations
        return True

    def optimize_campaigns_for_mobile(self, campaigns: List[Dict]) -> List[Dict]:
        """Optimize campaigns for mobile delivery"""
        optimized = []
        
        for campaign in campaigns[:self.mobile_config['max_campaigns_per_request']]:
            # Reduce payload size
            mobile_campaign = {
                'campaignId': campaign['campaignId'],
                'name': campaign['name'],
                'description': campaign.get('description', '')[:200],  # Truncate
                'action': self.optimize_action_for_mobile(campaign.get('action', {})),
                'priority': campaign.get('priority', 1),
                'conditions': self.optimize_conditions_for_mobile(campaign.get('conditions', [])),
                'expiresAt': campaign.get('endDate'),
                'metadata': {
                    'evaluationCount': campaign.get('stats', {}).get('evaluations', 0),
                    'successRate': self.calculate_success_rate(campaign)
                }
            }
            optimized.append(mobile_campaign)
        
        return optimized

    def optimize_action_for_mobile(self, action: Dict) -> Dict:
        """Optimize campaign action for mobile consumption"""
        return {
            'type': action.get('type'),
            'value': action.get('value'),
            'displayText': action.get('displayText', '')[:100],  # Truncate
            'buttonText': action.get('buttonText', 'Apply'),
            'deepLink': action.get('deepLink')
        }

    def optimize_conditions_for_mobile(self, conditions: List[Dict]) -> List[Dict]:
        """Optimize conditions for mobile evaluation"""
        mobile_conditions = []
        
        for condition in conditions:
            # Only include conditions that can be evaluated on mobile
            if self.can_evaluate_on_mobile(condition):
                mobile_condition = {
                    'conditionId': condition['conditionId'],
                    'type': condition['type'],
                    'operator': condition['operator'],
                    'value': condition['value'],
                    'clientSide': self.is_client_side_evaluable(condition)
                }
                mobile_conditions.append(mobile_condition)
        
        return mobile_conditions

    def can_evaluate_on_mobile(self, condition: Dict) -> bool:
        """Check if condition can be evaluated on mobile device"""
        mobile_evaluable_types = [
            'location.current',
            'time.current',
            'driver.status',
            'order.current',
            'app.state'
        ]
        
        condition_type = condition.get('type', '')
        return any(condition_type.startswith(prefix) for prefix in mobile_evaluable_types)

    def is_client_side_evaluable(self, condition: Dict) -> bool:
        """Check if condition can be evaluated client-side"""
        client_side_types = [
            'time.current',
            'location.current',
            'app.state'
        ]
        
        condition_type = condition.get('type', '')
        return condition_type in client_side_types

    def calculate_success_rate(self, campaign: Dict) -> float:
        """Calculate campaign success rate"""
        stats = campaign.get('stats', {})
        evaluations = stats.get('evaluations', 0)
        conversions = stats.get('conversions', 0)
        
        if evaluations == 0:
            return 0.0
        
        return (conversions / evaluations) * 100

    # ============ LOCATION UPDATES ============

    def handle_location_update(self, driver_id: str, body: Dict) -> Dict:
        """Handle driver location updates"""
        try:
            location_data = body.get('location', {})
            
            # Validate location data
            if not self.validate_location_data(location_data):
                return self.create_response(400, {'error': 'Invalid location data'})
            
            # Update driver location
            self.update_driver_location(driver_id, location_data)
            
            # Check for location-based campaigns
            triggered_campaigns = self.check_location_triggered_campaigns(driver_id, location_data)
            
            response_data = {
                'success': True,
                'driverId': driver_id,
                'timestamp': datetime.utcnow().isoformat(),
                'triggeredCampaigns': triggered_campaigns
            }
            
            # Send push notifications if campaigns triggered
            if triggered_campaigns and self.mobile_config['push_notification_enabled']:
                asyncio.create_task(self.send_campaign_notifications(driver_id, triggered_campaigns))
            
            return self.create_response(200, response_data)
            
        except Exception as e:
            logger.error(f"Error handling location update: {str(e)}")
            return self.create_response(500, {'error': str(e)})

    def validate_location_data(self, location_data: Dict) -> bool:
        """Validate location data from mobile app"""
        required_fields = ['latitude', 'longitude', 'accuracy', 'timestamp']
        
        for field in required_fields:
            if field not in location_data:
                return False
        
        # Validate ranges
        lat = location_data.get('latitude', 0)
        lng = location_data.get('longitude', 0)
        accuracy = location_data.get('accuracy', 0)
        
        if not (-90 <= lat <= 90):
            return False
        if not (-180 <= lng <= 180):
            return False
        if accuracy > self.mobile_config['location_accuracy_threshold']:
            return False
        
        return True

    def update_driver_location(self, driver_id: str, location_data: Dict):
        """Update driver's current location"""
        try:
            self.driver_profiles_table.update_item(
                Key={'driverId': driver_id},
                UpdateExpression='SET currentLocation = :location, lastLocationUpdate = :timestamp',
                ExpressionAttributeValues={
                    ':location': location_data,
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            logger.error(f"Error updating driver location: {str(e)}")

    def check_location_triggered_campaigns(self, driver_id: str, location_data: Dict) -> List[Dict]:
        """Check for campaigns triggered by location change"""
        triggered_campaigns = []
        
        try:
            # Get location-based campaigns
            campaigns_response = self.campaigns_table.scan(
                FilterExpression='isActive = :active AND contains(conditionTypes, :location_type)',
                ExpressionAttributeValues={
                    ':active': 1,
                    ':location_type': 'location'
                }
            )
            
            location_campaigns = campaigns_response.get('Items', [])
            
            for campaign in location_campaigns:
                if self.evaluate_location_campaign(campaign, driver_id, location_data):
                    triggered_campaigns.append({
                        'campaignId': campaign['campaignId'],
                        'name': campaign['name'],
                        'action': campaign.get('action', {}),
                        'priority': campaign.get('priority', 1)
                    })
            
        except Exception as e:
            logger.error(f"Error checking location-triggered campaigns: {str(e)}")
        
        return triggered_campaigns

    def evaluate_location_campaign(self, campaign: Dict, driver_id: str, location_data: Dict) -> bool:
        """Evaluate if location-based campaign should trigger"""
        # Simplified evaluation logic
        # In production, use the full condition evaluation engine
        return True

    # ============ SESSION MANAGEMENT ============

    def handle_session_management(self, method: str, driver_id: str, body: Dict) -> Dict:
        """Handle mobile app session management"""
        try:
            if method == 'POST':
                return self.start_driver_session(driver_id, body)
            elif method == 'PUT':
                return self.update_driver_session(driver_id, body)
            elif method == 'DELETE':
                return self.end_driver_session(driver_id)
            else:
                return self.create_response(405, {'error': 'Method not allowed'})
                
        except Exception as e:
            logger.error(f"Error in session management: {str(e)}")
            return self.create_response(500, {'error': str(e)})

    def start_driver_session(self, driver_id: str, session_data: Dict) -> Dict:
        """Start a new driver session"""
        try:
            session_id = f"{driver_id}_{int(datetime.utcnow().timestamp())}"
            
            session_record = {
                'sessionId': session_id,
                'driverId': driver_id,
                'startTime': datetime.utcnow().isoformat(),
                'deviceInfo': session_data.get('deviceInfo', {}),
                'appVersion': session_data.get('appVersion'),
                'status': 'active',
                'lastActivity': datetime.utcnow().isoformat(),
                'campaignInteractions': []
            }
            
            self.mobile_sessions_table.put_item(Item=session_record)
            
            return self.create_response(200, {
                'sessionId': session_id,
                'driverId': driver_id,
                'status': 'started',
                'config': self.get_mobile_config_for_driver(driver_id)
            })
            
        except Exception as e:
            logger.error(f"Error starting driver session: {str(e)}")
            return self.create_response(500, {'error': str(e)})

    def get_mobile_config_for_driver(self, driver_id: str) -> Dict:
        """Get mobile configuration for specific driver"""
        return {
            'locationUpdateInterval': 30,  # seconds
            'campaignCheckInterval': 300,  # seconds
            'offlineModeEnabled': True,
            'pushNotificationsEnabled': True,
            'analyticsEnabled': True
        }

    # ============ CAMPAIGN EVALUATION ============

    def handle_mobile_evaluation(self, driver_id: str, body: Dict) -> Dict:
        """Handle campaign evaluation from mobile app"""
        try:
            evaluation_data = body.get('evaluation', {})
            context = body.get('context', {})
            
            # Add driver context
            context['driverId'] = driver_id
            context['timestamp'] = datetime.utcnow().isoformat()
            
            # Evaluate campaigns
            results = self.evaluate_campaigns_for_mobile(driver_id, evaluation_data, context)
            
            return self.create_response(200, {
                'evaluationId': f"mobile_{driver_id}_{int(datetime.utcnow().timestamp())}",
                'results': results,
                'driverId': driver_id,
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error in mobile evaluation: {str(e)}")
            return self.create_response(500, {'error': str(e)})

    def evaluate_campaigns_for_mobile(self, driver_id: str, evaluation_data: Dict, context: Dict) -> List[Dict]:
        """Evaluate campaigns specifically for mobile context"""
        results = []
        
        # Get driver profile for context
        driver_profile = self.get_driver_profile(driver_id)
        if driver_profile:
            context['driver'] = driver_profile
        
        campaign_ids = evaluation_data.get('campaignIds', [])
        
        for campaign_id in campaign_ids:
            try:
                # Get campaign
                campaign_response = self.campaigns_table.get_item(
                    Key={'campaignId': campaign_id}
                )
                
                if 'Item' in campaign_response:
                    campaign = campaign_response['Item']
                    result = self.evaluate_single_campaign_mobile(campaign, context)
                    results.append(result)
                    
            except Exception as e:
                logger.error(f"Error evaluating campaign {campaign_id}: {str(e)}")
                results.append({
                    'campaignId': campaign_id,
                    'matches': False,
                    'error': str(e)
                })
        
        return results

    def evaluate_single_campaign_mobile(self, campaign: Dict, context: Dict) -> Dict:
        """Evaluate single campaign for mobile"""
        campaign_id = campaign['campaignId']
        conditions = campaign.get('conditions', [])
        
        try:
            # Evaluate all conditions
            all_match = True
            condition_results = []
            
            for condition in conditions:
                condition_result = self.evaluate_mobile_condition(condition, context)
                condition_results.append(condition_result)
                
                if not condition_result.get('matches', False):
                    all_match = False
            
            return {
                'campaignId': campaign_id,
                'matches': all_match,
                'conditionResults': condition_results,
                'action': campaign.get('action', {}) if all_match else None,
                'evaluatedAt': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'campaignId': campaign_id,
                'matches': False,
                'error': str(e)
            }

    def evaluate_mobile_condition(self, condition: Dict, context: Dict) -> Dict:
        """Evaluate individual condition in mobile context"""
        condition_type = condition.get('type', '')
        operator = condition.get('operator', '')
        expected_value = condition.get('value')
        
        try:
            # Extract context value
            context_value = self.extract_mobile_context_value(condition_type, context)
            
            # Perform comparison
            matches = self.perform_comparison(operator, context_value, expected_value)
            
            return {
                'conditionId': condition.get('conditionId'),
                'matches': matches,
                'contextValue': context_value,
                'expectedValue': expected_value
            }
            
        except Exception as e:
            return {
                'conditionId': condition.get('conditionId'),
                'matches': False,
                'error': str(e)
            }

    def extract_mobile_context_value(self, condition_type: str, context: Dict):
        """Extract context value for mobile-specific conditions"""
        mobile_mappings = {
            'driver.status': lambda ctx: ctx.get('driver', {}).get('status'),
            'driver.rating': lambda ctx: ctx.get('driver', {}).get('rating'),
            'location.current.latitude': lambda ctx: ctx.get('location', {}).get('latitude'),
            'location.current.longitude': lambda ctx: ctx.get('location', {}).get('longitude'),
            'time.current.hour': lambda ctx: datetime.utcnow().hour,
            'app.version': lambda ctx: ctx.get('appVersion'),
            'device.platform': lambda ctx: ctx.get('deviceInfo', {}).get('platform')
        }
        
        if condition_type in mobile_mappings:
            return mobile_mappings[condition_type](context)
        
        # Default extraction
        return context.get(condition_type)

    def perform_comparison(self, operator: str, context_value, expected_value) -> bool:
        """Perform comparison for mobile evaluation"""
        if context_value is None:
            return False
        
        operators = {
            'equals': lambda cv, ev: cv == ev,
            'not_equals': lambda cv, ev: cv != ev,
            'greater_than': lambda cv, ev: float(cv) > float(ev),
            'less_than': lambda cv, ev: float(cv) < float(ev),
            'contains': lambda cv, ev: str(ev).lower() in str(cv).lower(),
            'in': lambda cv, ev: cv in ev if isinstance(ev, list) else False
        }
        
        if operator in operators:
            return operators[operator](context_value, expected_value)
        
        return False

    # ============ CAMPAIGN ACTIONS ============

    def handle_campaign_action(self, driver_id: str, body: Dict) -> Dict:
        """Handle campaign action execution from mobile app"""
        try:
            action_data = body.get('action', {})
            campaign_id = action_data.get('campaignId')
            action_type = action_data.get('type')
            
            if not campaign_id or not action_type:
                return self.create_response(400, {'error': 'Missing campaign ID or action type'})
            
            # Execute action
            result = self.execute_campaign_action(driver_id, campaign_id, action_data)
            
            # Track interaction
            self.track_campaign_interaction(driver_id, campaign_id, action_type, result)
            
            return self.create_response(200, {
                'success': True,
                'driverId': driver_id,
                'campaignId': campaign_id,
                'actionType': action_type,
                'result': result,
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error handling campaign action: {str(e)}")
            return self.create_response(500, {'error': str(e)})

    def execute_campaign_action(self, driver_id: str, campaign_id: str, action_data: Dict) -> Dict:
        """Execute specific campaign action"""
        action_type = action_data.get('type')
        
        if action_type == 'apply_promotion':
            return self.apply_promotion(driver_id, action_data)
        elif action_type == 'show_notification':
            return self.show_notification(driver_id, action_data)
        elif action_type == 'redirect_to_offer':
            return self.handle_offer_redirect(driver_id, action_data)
        else:
            return {'success': False, 'error': f'Unknown action type: {action_type}'}

    def apply_promotion(self, driver_id: str, action_data: Dict) -> Dict:
        """Apply promotion to driver"""
        # Implementation for applying promotions
        return {'success': True, 'applied': True}

    def show_notification(self, driver_id: str, action_data: Dict) -> Dict:
        """Show notification to driver"""
        # Implementation for showing notifications
        return {'success': True, 'shown': True}

    def handle_offer_redirect(self, driver_id: str, action_data: Dict) -> Dict:
        """Handle redirect to offer"""
        # Implementation for offer redirects
        return {'success': True, 'redirected': True}

    def track_campaign_interaction(self, driver_id: str, campaign_id: str, action_type: str, result: Dict):
        """Track campaign interaction for analytics"""
        try:
            interaction_record = {
                'interactionId': f"{driver_id}_{campaign_id}_{int(datetime.utcnow().timestamp())}",
                'driverId': driver_id,
                'campaignId': campaign_id,
                'actionType': action_type,
                'result': result,
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'mobile_app'
            }
            
            # Store interaction (this would go to analytics table)
            logger.info(f"Campaign interaction tracked: {interaction_record}")
            
        except Exception as e:
            logger.error(f"Error tracking campaign interaction: {str(e)}")

    # ============ PUSH NOTIFICATIONS ============

    async def send_campaign_notifications(self, driver_id: str, campaigns: List[Dict]):
        """Send push notifications for triggered campaigns"""
        try:
            for campaign in campaigns:
                await self.send_single_campaign_notification(driver_id, campaign)
        except Exception as e:
            logger.error(f"Error sending campaign notifications: {str(e)}")

    async def send_single_campaign_notification(self, driver_id: str, campaign: Dict):
        """Send push notification for single campaign"""
        try:
            # Get driver's push token
            driver_profile = self.get_driver_profile(driver_id)
            push_token = driver_profile.get('pushToken') if driver_profile else None
            
            if not push_token:
                return
            
            # Create notification payload
            notification_payload = {
                'title': f"New Campaign: {campaign['name']}",
                'body': campaign.get('description', 'Check out this new campaign!'),
                'data': {
                    'campaignId': campaign['campaignId'],
                    'action': campaign.get('action', {}),
                    'type': 'campaign_triggered'
                }
            }
            
            # Send via SNS (simplified)
            self.sns.publish(
                TopicArn=f"arn:aws:sns:us-east-1:123456789012:driver-notifications-{driver_id}",
                Message=json.dumps(notification_payload),
                Subject=f"Campaign Notification for Driver {driver_id}"
            )
            
        except Exception as e:
            logger.error(f"Error sending single campaign notification: {str(e)}")

# Lambda handler
def lambda_handler(event, context):
    """Main Lambda entry point for mobile integration"""
    service = MobileAppIntegrationService()
    return service.lambda_handler(event, context)
