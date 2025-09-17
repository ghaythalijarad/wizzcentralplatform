import redis
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import asyncio
import concurrent.futures
import boto3
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class ConditionEngineOptimizer:
    """
    Performance optimization layer for the WizzCentral Condition Engine
    Implements caching, query optimization, and batch processing
    """
    
    def __init__(self):
        # Initialize Redis for caching
        self.redis_client = redis.Redis(
            host=os.environ.get('REDIS_HOST', 'localhost'),
            port=int(os.environ.get('REDIS_PORT', 6379)),
            decode_responses=True
        )
        
        # Cache configuration
        self.cache_ttl = {
            'condition_definitions': 3600,  # 1 hour
            'campaign_rules': 1800,         # 30 minutes
            'customer_profiles': 900,       # 15 minutes
            'evaluation_results': 300       # 5 minutes
        }
        
        # Performance metrics
        self.performance_metrics = {
            'cache_hits': 0,
            'cache_misses': 0,
            'evaluation_times': [],
            'batch_sizes': []
        }
        
        # Optimization settings
        self.max_batch_size = 100
        self.parallel_evaluation_threshold = 10
        self.cache_warming_enabled = True

    # ============ CACHING LAYER ============

    def get_cached_condition(self, condition_id: str) -> Optional[Dict]:
        """Retrieve condition from cache"""
        try:
            cache_key = f"condition:{condition_id}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                self.performance_metrics['cache_hits'] += 1
                return json.loads(cached_data)
            
            self.performance_metrics['cache_misses'] += 1
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving from cache: {e}")
            return None

    def cache_condition(self, condition_id: str, condition_data: Dict) -> bool:
        """Store condition in cache"""
        try:
            cache_key = f"condition:{condition_id}"
            ttl = self.cache_ttl['condition_definitions']
            
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(condition_data, default=str)
            )
            return True
            
        except Exception as e:
            logger.error(f"Error caching condition: {e}")
            return False

    def get_cached_campaign(self, campaign_id: str) -> Optional[Dict]:
        """Retrieve campaign from cache"""
        try:
            cache_key = f"campaign:{campaign_id}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                self.performance_metrics['cache_hits'] += 1
                return json.loads(cached_data)
            
            self.performance_metrics['cache_misses'] += 1
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving campaign from cache: {e}")
            return None

    def cache_campaign(self, campaign_id: str, campaign_data: Dict) -> bool:
        """Store campaign in cache"""
        try:
            cache_key = f"campaign:{campaign_id}"
            ttl = self.cache_ttl['campaign_rules']
            
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(campaign_data, default=str)
            )
            return True
            
        except Exception as e:
            logger.error(f"Error caching campaign: {e}")
            return False

    def get_cached_customer_profile(self, customer_id: str) -> Optional[Dict]:
        """Retrieve customer profile from cache"""
        try:
            cache_key = f"customer:{customer_id}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                self.performance_metrics['cache_hits'] += 1
                return json.loads(cached_data)
            
            self.performance_metrics['cache_misses'] += 1
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving customer profile from cache: {e}")
            return None

    def cache_customer_profile(self, customer_id: str, profile_data: Dict) -> bool:
        """Store customer profile in cache"""
        try:
            cache_key = f"customer:{customer_id}"
            ttl = self.cache_ttl['customer_profiles']
            
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(profile_data, default=str)
            )
            return True
            
        except Exception as e:
            logger.error(f"Error caching customer profile: {e}")
            return False

    def get_evaluation_cache_key(self, condition_id: str, context: Dict) -> str:
        """Generate cache key for evaluation result"""
        # Create hash of context for cache key
        context_str = json.dumps(context, sort_keys=True, default=str)
        context_hash = hashlib.md5(context_str.encode()).hexdigest()
        return f"eval:{condition_id}:{context_hash}"

    def get_cached_evaluation(self, condition_id: str, context: Dict) -> Optional[Dict]:
        """Retrieve evaluation result from cache"""
        try:
            cache_key = self.get_evaluation_cache_key(condition_id, context)
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                self.performance_metrics['cache_hits'] += 1
                result = json.loads(cached_data)
                # Check if cache entry is still valid (not expired due to condition changes)
                if self.is_evaluation_cache_valid(result):
                    return result
            
            self.performance_metrics['cache_misses'] += 1
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving evaluation from cache: {e}")
            return None

    def cache_evaluation_result(self, condition_id: str, context: Dict, result: Dict) -> bool:
        """Store evaluation result in cache"""
        try:
            cache_key = self.get_evaluation_cache_key(condition_id, context)
            ttl = self.cache_ttl['evaluation_results']
            
            # Add timestamp for cache validation
            result_with_timestamp = {
                **result,
                'cached_at': datetime.utcnow().isoformat()
            }
            
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(result_with_timestamp, default=str)
            )
            return True
            
        except Exception as e:
            logger.error(f"Error caching evaluation result: {e}")
            return False

    def is_evaluation_cache_valid(self, cached_result: Dict) -> bool:
        """Check if cached evaluation result is still valid"""
        try:
            cached_at = datetime.fromisoformat(cached_result.get('cached_at', ''))
            # Cache is valid for 5 minutes
            return datetime.utcnow() - cached_at < timedelta(minutes=5)
        except:
            return False

    # ============ BATCH PROCESSING ============

    async def evaluate_conditions_batch(self, evaluations: List[Dict]) -> List[Dict]:
        """Evaluate multiple conditions in parallel"""
        start_time = datetime.utcnow()
        
        try:
            # Split into batches if too large
            batches = self.split_into_batches(evaluations, self.max_batch_size)
            results = []
            
            for batch in batches:
                if len(batch) >= self.parallel_evaluation_threshold:
                    batch_results = await self.evaluate_batch_parallel(batch)
                else:
                    batch_results = await self.evaluate_batch_sequential(batch)
                
                results.extend(batch_results)
            
            # Track performance
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            self.performance_metrics['evaluation_times'].append(execution_time)
            self.performance_metrics['batch_sizes'].append(len(evaluations))
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch evaluation: {e}")
            raise

    def split_into_batches(self, items: List, batch_size: int) -> List[List]:
        """Split list into smaller batches"""
        return [items[i:i + batch_size] for i in range(0, len(items), batch_size)]

    async def evaluate_batch_parallel(self, batch: List[Dict]) -> List[Dict]:
        """Evaluate batch in parallel"""
        tasks = []
        
        for evaluation in batch:
            task = asyncio.create_task(
                self.evaluate_single_async(evaluation)
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions in results
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    'conditionId': batch[i].get('conditionId', 'unknown'),
                    'error': str(result),
                    'matches': False
                })
            else:
                processed_results.append(result)
        
        return processed_results

    async def evaluate_batch_sequential(self, batch: List[Dict]) -> List[Dict]:
        """Evaluate batch sequentially"""
        results = []
        
        for evaluation in batch:
            try:
                result = await self.evaluate_single_async(evaluation)
                results.append(result)
            except Exception as e:
                results.append({
                    'conditionId': evaluation.get('conditionId', 'unknown'),
                    'error': str(e),
                    'matches': False
                })
        
        return results

    async def evaluate_single_async(self, evaluation: Dict) -> Dict:
        """Evaluate single condition asynchronously"""
        condition_id = evaluation['conditionId']
        context = evaluation['context']
        
        # Check cache first
        cached_result = self.get_cached_evaluation(condition_id, context)
        if cached_result:
            return cached_result
        
        # Evaluate condition
        result = await self.perform_evaluation_async(condition_id, context)
        
        # Cache result
        self.cache_evaluation_result(condition_id, context, result)
        
        return result

    async def perform_evaluation_async(self, condition_id: str, context: Dict) -> Dict:
        """Perform actual condition evaluation asynchronously"""
        # This would interface with the main condition evaluation logic
        # For now, return a placeholder
        return {
            'conditionId': condition_id,
            'matches': True,  # Placeholder logic
            'executionTime': 5.0,
            'timestamp': datetime.utcnow().isoformat()
        }

    # ============ QUERY OPTIMIZATION ============

    def optimize_condition_query(self, conditions: List[Dict]) -> List[Dict]:
        """Optimize condition ordering for faster evaluation"""
        # Sort conditions by estimated execution cost (fastest first)
        def get_execution_cost(condition):
            condition_type = condition.get('type', '')
            operator = condition.get('operator', '')
            
            # Define cost weights
            type_costs = {
                'location': 3,      # GPS calculations are expensive
                'time': 1,          # Time checks are fast
                'customer': 2,      # Customer lookups are moderate
                'order': 2,         # Order checks are moderate
                'behavior': 4,      # Behavior analysis is expensive
                'business': 3       # Business logic is expensive
            }
            
            operator_costs = {
                'equals': 1,
                'greater_than': 1,
                'less_than': 1,
                'contains': 2,
                'in': 2,
                'matches_regex': 4
            }
            
            base_cost = type_costs.get(condition_type.split('.')[0], 2)
            operator_cost = operator_costs.get(operator, 2)
            
            return base_cost * operator_cost
        
        return sorted(conditions, key=get_execution_cost)

    def build_condition_index(self, conditions: List[Dict]) -> Dict:
        """Build an index for faster condition lookups"""
        index = {
            'by_type': {},
            'by_priority': {},
            'by_campaign': {}
        }
        
        for condition in conditions:
            condition_type = condition.get('type', '')
            priority = condition.get('priority', 1)
            campaign_id = condition.get('campaignId', '')
            
            # Index by type
            if condition_type not in index['by_type']:
                index['by_type'][condition_type] = []
            index['by_type'][condition_type].append(condition)
            
            # Index by priority
            if priority not in index['by_priority']:
                index['by_priority'][priority] = []
            index['by_priority'][priority].append(condition)
            
            # Index by campaign
            if campaign_id not in index['by_campaign']:
                index['by_campaign'][campaign_id] = []
            index['by_campaign'][campaign_id].append(condition)
        
        return index

    # ============ CACHE WARMING ============

    def warm_cache(self, priority_campaigns: List[str] = None):
        """Pre-load frequently used data into cache"""
        if not self.cache_warming_enabled:
            return
        
        try:
            # Warm condition cache
            self.warm_condition_cache()
            
            # Warm campaign cache
            if priority_campaigns:
                self.warm_campaign_cache(priority_campaigns)
            
            # Warm customer profile cache
            self.warm_customer_cache()
            
            logger.info("Cache warming completed successfully")
            
        except Exception as e:
            logger.error(f"Error during cache warming: {e}")

    def warm_condition_cache(self):
        """Pre-load frequently used conditions"""
        # This would query the most frequently used conditions
        # and load them into cache
        pass

    def warm_campaign_cache(self, campaign_ids: List[str]):
        """Pre-load specific campaigns"""
        # This would load the specified campaigns into cache
        pass

    def warm_customer_cache(self):
        """Pre-load active customer profiles"""
        # This would load frequently accessed customer profiles
        pass

    # ============ PERFORMANCE MONITORING ============

    def get_performance_metrics(self) -> Dict:
        """Get current performance metrics"""
        cache_hit_rate = (
            self.performance_metrics['cache_hits'] / 
            (self.performance_metrics['cache_hits'] + self.performance_metrics['cache_misses'])
            if (self.performance_metrics['cache_hits'] + self.performance_metrics['cache_misses']) > 0 
            else 0
        )
        
        avg_evaluation_time = (
            sum(self.performance_metrics['evaluation_times']) / 
            len(self.performance_metrics['evaluation_times'])
            if self.performance_metrics['evaluation_times']
            else 0
        )
        
        avg_batch_size = (
            sum(self.performance_metrics['batch_sizes']) / 
            len(self.performance_metrics['batch_sizes'])
            if self.performance_metrics['batch_sizes']
            else 0
        )
        
        return {
            'cache_hit_rate': cache_hit_rate,
            'average_evaluation_time': avg_evaluation_time,
            'average_batch_size': avg_batch_size,
            'total_evaluations': len(self.performance_metrics['evaluation_times']),
            'cache_statistics': {
                'hits': self.performance_metrics['cache_hits'],
                'misses': self.performance_metrics['cache_misses']
            }
        }

    def reset_performance_metrics(self):
        """Reset performance tracking metrics"""
        self.performance_metrics = {
            'cache_hits': 0,
            'cache_misses': 0,
            'evaluation_times': [],
            'batch_sizes': []
        }

    # ============ MEMORY OPTIMIZATION ============

    def optimize_memory_usage(self):
        """Optimize memory usage by cleaning up caches"""
        try:
            # Clean expired cache entries
            self.clean_expired_cache_entries()
            
            # Limit cache size
            self.limit_cache_size()
            
            # Compress large cache entries
            self.compress_large_cache_entries()
            
        except Exception as e:
            logger.error(f"Error optimizing memory usage: {e}")

    def clean_expired_cache_entries(self):
        """Remove expired entries from cache"""
        # Redis handles TTL automatically, but we can do additional cleanup
        pass

    def limit_cache_size(self):
        """Limit total cache size by removing least recently used entries"""
        # Implement LRU eviction if needed
        pass

    def compress_large_cache_entries(self):
        """Compress large cache entries to save memory"""
        # Implement compression for large objects
        pass

# Global optimizer instance
optimizer = ConditionEngineOptimizer()
