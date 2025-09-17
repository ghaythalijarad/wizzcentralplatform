-- WizzCentral Campaign Condition Engine - Database Performance Optimization
-- This script optimizes the database schema for high-performance condition evaluation
-- Author: WizzCentral Dev Team
-- Version: 2.0

-- ============ PERFORMANCE INDEXES ============

-- Optimize campaign queries by status and priority
CREATE INDEX IF NOT EXISTS idx_campaigns_active_priority 
ON campaigns(is_active, priority DESC, created_at DESC)
WHERE is_active = true;

-- Optimize condition queries by type and status
CREATE INDEX IF NOT EXISTS idx_conditions_type_active 
ON conditions(condition_type, is_active, updated_at DESC)
WHERE is_active = true;

-- Optimize evaluation queries by timestamp and campaign
CREATE INDEX IF NOT EXISTS idx_evaluations_campaign_timestamp 
ON evaluations(campaign_id, evaluation_timestamp DESC)
INCLUDE (result, execution_time_ms, context_hash);

-- Optimize analytics queries by campaign and time range
CREATE INDEX IF NOT EXISTS idx_analytics_campaign_timerange 
ON analytics(campaign_id, timestamp DESC)
INCLUDE (metric_type, metric_value, customer_id);

-- Optimize customer behavior queries
CREATE INDEX IF NOT EXISTS idx_customer_behavior_lookup 
ON customer_analytics(customer_id, event_timestamp DESC)
INCLUDE (event_type, event_data, location_data);

-- Optimize location-based queries (using PostGIS for geographic data)
CREATE INDEX IF NOT EXISTS idx_location_spatial 
ON driver_locations USING GIST(location_point)
WHERE is_active = true;

-- Optimize driver profile queries
CREATE INDEX IF NOT EXISTS idx_driver_profiles_active 
ON driver_profiles(driver_id, last_active DESC)
WHERE is_active = true
INCLUDE (vehicle_type, rating, service_areas);

-- ============ MATERIALIZED VIEWS ============

-- Campaign effectiveness summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_campaign_effectiveness AS
SELECT 
    c.campaign_id,
    c.campaign_name,
    c.priority,
    COUNT(e.evaluation_id) as total_evaluations,
    COUNT(CASE WHEN e.result = true THEN 1 END) as successful_matches,
    ROUND(AVG(e.execution_time_ms), 2) as avg_execution_time,
    COUNT(CASE WHEN e.result = true THEN 1 END)::float / NULLIF(COUNT(e.evaluation_id), 0) * 100 as success_rate,
    MAX(e.evaluation_timestamp) as last_evaluated
FROM campaigns c
LEFT JOIN evaluations e ON c.campaign_id = e.campaign_id
WHERE c.is_active = true 
    AND e.evaluation_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY c.campaign_id, c.campaign_name, c.priority;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_campaign_effectiveness_pk 
ON mv_campaign_effectiveness(campaign_id);

-- Condition performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_condition_performance AS
SELECT 
    cond.condition_id,
    cond.condition_name,
    cond.condition_type,
    COUNT(e.evaluation_id) as evaluation_count,
    AVG(e.execution_time_ms) as avg_execution_time,
    COUNT(CASE WHEN e.result = true THEN 1 END)::float / NULLIF(COUNT(e.evaluation_id), 0) * 100 as match_rate,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY e.execution_time_ms) as p95_execution_time
FROM conditions cond
LEFT JOIN evaluations e ON cond.condition_id = e.condition_id
WHERE cond.is_active = true 
    AND e.evaluation_timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY cond.condition_id, cond.condition_name, cond.condition_type;

-- Create unique index on condition performance view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_condition_performance_pk 
ON mv_condition_performance(condition_id);

-- Real-time analytics summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_realtime_analytics AS
SELECT 
    DATE_TRUNC('hour', a.timestamp) as hour_bucket,
    a.campaign_id,
    a.metric_type,
    SUM(a.metric_value) as total_value,
    AVG(a.metric_value) as avg_value,
    COUNT(*) as event_count
FROM analytics a
WHERE a.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', a.timestamp), a.campaign_id, a.metric_type;

-- Create unique index on real-time analytics view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_realtime_analytics_pk 
ON mv_realtime_analytics(hour_bucket, campaign_id, metric_type);

-- ============ PARTITIONING ============

-- Partition evaluations table by date for better performance
CREATE TABLE IF NOT EXISTS evaluations_partitioned (
    LIKE evaluations INCLUDING ALL
) PARTITION BY RANGE (evaluation_timestamp);

-- Create partitions for current and future months
CREATE TABLE IF NOT EXISTS evaluations_202401 PARTITION OF evaluations_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE IF NOT EXISTS evaluations_202402 PARTITION OF evaluations_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE IF NOT EXISTS evaluations_202403 PARTITION OF evaluations_partitioned
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Partition analytics table by date
CREATE TABLE IF NOT EXISTS analytics_partitioned (
    LIKE analytics INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create analytics partitions
CREATE TABLE IF NOT EXISTS analytics_202401 PARTITION OF analytics_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE IF NOT EXISTS analytics_202402 PARTITION OF analytics_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE IF NOT EXISTS analytics_202403 PARTITION OF analytics_partitioned
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- ============ STORED PROCEDURES ============

-- High-performance condition evaluation procedure
CREATE OR REPLACE FUNCTION evaluate_condition_batch(
    p_condition_ids INTEGER[],
    p_context JSONB,
    p_evaluation_id UUID DEFAULT gen_random_uuid()
) RETURNS TABLE(
    condition_id INTEGER,
    matches BOOLEAN,
    execution_time_ms NUMERIC,
    context_value TEXT
) AS $$
DECLARE
    start_time TIMESTAMP;
    condition_rec RECORD;
    result_matches BOOLEAN;
    context_val TEXT;
    exec_time NUMERIC;
BEGIN
    -- Loop through conditions for batch evaluation
    FOR condition_rec IN 
        SELECT c.condition_id, c.condition_type, c.operator, c.expected_value, c.metadata
        FROM conditions c 
        WHERE c.condition_id = ANY(p_condition_ids)
            AND c.is_active = true
        ORDER BY c.priority ASC  -- Evaluate high priority conditions first
    LOOP
        start_time := clock_timestamp();
        
        -- Extract context value based on condition type
        CASE 
            WHEN condition_rec.condition_type = 'location.latitude' THEN
                context_val := (p_context->>'location'->>'latitude');
            WHEN condition_rec.condition_type = 'customer.loyalty_tier' THEN
                context_val := (p_context->>'customer'->>'loyaltyTier');
            WHEN condition_rec.condition_type = 'order.amount' THEN
                context_val := (p_context->>'order'->>'amount');
            WHEN condition_rec.condition_type = 'time.hour' THEN
                context_val := EXTRACT(HOUR FROM NOW())::TEXT;
            ELSE
                context_val := (p_context->>condition_rec.condition_type);
        END CASE;
        
        -- Perform comparison based on operator
        CASE condition_rec.operator
            WHEN 'equals' THEN
                result_matches := context_val = condition_rec.expected_value;
            WHEN 'greater_than' THEN
                result_matches := context_val::NUMERIC > condition_rec.expected_value::NUMERIC;
            WHEN 'less_than' THEN
                result_matches := context_val::NUMERIC < condition_rec.expected_value::NUMERIC;
            WHEN 'contains' THEN
                result_matches := position(LOWER(condition_rec.expected_value) IN LOWER(context_val)) > 0;
            WHEN 'in' THEN
                result_matches := context_val = ANY(string_to_array(condition_rec.expected_value, ','));
            ELSE
                result_matches := FALSE;
        END CASE;
        
        exec_time := EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000;
        
        -- Return result
        condition_id := condition_rec.condition_id;
        matches := result_matches;
        execution_time_ms := exec_time;
        context_value := context_val;
        
        RETURN NEXT;
        
        -- Insert evaluation record asynchronously
        INSERT INTO evaluations (
            evaluation_id, condition_id, context_data, result, 
            execution_time_ms, evaluation_timestamp
        ) VALUES (
            p_evaluation_id, condition_rec.condition_id, p_context, 
            result_matches, exec_time, NOW()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Campaign analytics aggregation procedure
CREATE OR REPLACE FUNCTION aggregate_campaign_analytics(
    p_campaign_id INTEGER,
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP
) RETURNS TABLE(
    total_evaluations BIGINT,
    successful_matches BIGINT,
    avg_execution_time NUMERIC,
    success_rate NUMERIC,
    hourly_distribution JSONB
) AS $$
DECLARE
    hourly_data JSONB;
BEGIN
    -- Calculate basic metrics
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN result = true THEN 1 END),
        AVG(execution_time_ms),
        COUNT(CASE WHEN result = true THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100
    INTO total_evaluations, successful_matches, avg_execution_time, success_rate
    FROM evaluations
    WHERE campaign_id = p_campaign_id
        AND evaluation_timestamp BETWEEN p_start_date AND p_end_date;
    
    -- Calculate hourly distribution
    SELECT jsonb_object_agg(hour_bucket, evaluation_count)
    INTO hourly_data
    FROM (
        SELECT 
            EXTRACT(HOUR FROM evaluation_timestamp) as hour_bucket,
            COUNT(*) as evaluation_count
        FROM evaluations
        WHERE campaign_id = p_campaign_id
            AND evaluation_timestamp BETWEEN p_start_date AND p_end_date
        GROUP BY EXTRACT(HOUR FROM evaluation_timestamp)
        ORDER BY hour_bucket
    ) hourly_stats;
    
    hourly_distribution := COALESCE(hourly_data, '{}'::jsonb);
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Location-based campaign finder
CREATE OR REPLACE FUNCTION find_campaigns_by_location(
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_radius_meters INTEGER DEFAULT 1000,
    p_driver_id INTEGER DEFAULT NULL
) RETURNS TABLE(
    campaign_id INTEGER,
    campaign_name TEXT,
    priority INTEGER,
    distance_meters NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH location_point AS (
        SELECT ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326) as point
    ),
    nearby_campaigns AS (
        SELECT 
            c.campaign_id,
            c.campaign_name,
            c.priority,
            ST_Distance(
                ST_Transform(lp.point, 3857),
                ST_Transform(cl.location_point, 3857)
            ) as distance_meters
        FROM campaigns c
        CROSS JOIN location_point lp
        JOIN campaign_locations cl ON c.campaign_id = cl.campaign_id
        WHERE c.is_active = true
            AND ST_DWithin(
                ST_Transform(lp.point, 3857),
                ST_Transform(cl.location_point, 3857),
                p_radius_meters
            )
    )
    SELECT nc.campaign_id, nc.campaign_name, nc.priority, nc.distance_meters
    FROM nearby_campaigns nc
    ORDER BY nc.priority DESC, nc.distance_meters ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============ PERFORMANCE MONITORING ============

-- Create performance tracking table
CREATE TABLE IF NOT EXISTS performance_metrics (
    metric_id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Create index for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_timestamp 
ON performance_metrics(metric_name, metric_timestamp DESC);

-- Performance monitoring function
CREATE OR REPLACE FUNCTION track_performance_metric(
    p_metric_name TEXT,
    p_metric_value NUMERIC,
    p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO performance_metrics (metric_name, metric_value, metadata)
    VALUES (p_metric_name, p_metric_value, p_metadata);
END;
$$ LANGUAGE plpgsql;

-- ============ CACHE WARMING QUERIES ============

-- Pre-load frequently accessed campaigns
PREPARE warm_active_campaigns AS
SELECT campaign_id, campaign_name, conditions, priority 
FROM campaigns 
WHERE is_active = true 
ORDER BY priority DESC, last_modified DESC 
LIMIT 50;

-- Pre-load popular conditions
PREPARE warm_popular_conditions AS
SELECT c.condition_id, c.condition_type, c.operator, c.expected_value
FROM conditions c
JOIN (
    SELECT condition_id, COUNT(*) as usage_count
    FROM evaluations 
    WHERE evaluation_timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY condition_id
    ORDER BY usage_count DESC
    LIMIT 100
) popular ON c.condition_id = popular.condition_id
WHERE c.is_active = true;

-- ============ CLEANUP PROCEDURES ============

-- Clean up old evaluation records
CREATE OR REPLACE FUNCTION cleanup_old_evaluations() RETURNS VOID AS $$
BEGIN
    -- Delete evaluations older than 30 days
    DELETE FROM evaluations 
    WHERE evaluation_timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete analytics data older than 90 days
    DELETE FROM analytics 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Log cleanup activity
    PERFORM track_performance_metric(
        'cleanup_evaluations', 
        (SELECT COUNT(*) FROM evaluations WHERE evaluation_timestamp < NOW() - INTERVAL '30 days'),
        jsonb_build_object('cleanup_date', NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- ============ REFRESH MATERIALIZED VIEWS ============

-- Refresh all performance-related materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_effectiveness;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_condition_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_realtime_analytics;
    
    -- Track refresh completion
    PERFORM track_performance_metric(
        'materialized_views_refreshed', 
        3,
        jsonb_build_object('refresh_time', NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- ============ AUTO-MAINTENANCE SCHEDULE ============

-- Schedule automatic maintenance tasks (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-evaluations', '0 2 * * *', 'SELECT cleanup_old_evaluations();');
-- SELECT cron.schedule('refresh-views', '*/15 * * * *', 'SELECT refresh_performance_views();');

-- ============ PERFORMANCE ANALYSIS QUERIES ============

-- Query to identify slow conditions
CREATE VIEW slow_conditions AS
SELECT 
    c.condition_id,
    c.condition_name,
    c.condition_type,
    AVG(e.execution_time_ms) as avg_execution_time,
    COUNT(*) as evaluation_count,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY e.execution_time_ms) as p95_time
FROM conditions c
JOIN evaluations e ON c.condition_id = e.condition_id
WHERE e.evaluation_timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY c.condition_id, c.condition_name, c.condition_type
HAVING AVG(e.execution_time_ms) > 50  -- Conditions taking more than 50ms on average
ORDER BY avg_execution_time DESC;

-- Query to identify inefficient campaigns
CREATE VIEW inefficient_campaigns AS
SELECT 
    c.campaign_id,
    c.campaign_name,
    COUNT(e.evaluation_id) as total_evaluations,
    COUNT(CASE WHEN e.result = true THEN 1 END) as successful_matches,
    AVG(e.execution_time_ms) as avg_execution_time,
    COUNT(CASE WHEN e.result = true THEN 1 END)::float / NULLIF(COUNT(e.evaluation_id), 0) * 100 as success_rate
FROM campaigns c
LEFT JOIN evaluations e ON c.campaign_id = e.campaign_id
WHERE e.evaluation_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY c.campaign_id, c.campaign_name
HAVING COUNT(e.evaluation_id) > 100  -- Campaigns with significant volume
    AND (COUNT(CASE WHEN e.result = true THEN 1 END)::float / NULLIF(COUNT(e.evaluation_id), 0) * 100) < 5  -- Low success rate
ORDER BY success_rate ASC;

-- ============ COMPLETION MESSAGE ============

-- Log optimization completion
DO $$
BEGIN
    RAISE NOTICE 'WizzCentral Campaign Condition Engine database optimization completed successfully!';
    RAISE NOTICE 'Performance indexes created: %', (
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
    );
    RAISE NOTICE 'Materialized views created: %', (
        SELECT COUNT(*) 
        FROM pg_matviews 
        WHERE schemaname = 'public' 
        AND matviewname LIKE 'mv_%'
    );
END $$;
