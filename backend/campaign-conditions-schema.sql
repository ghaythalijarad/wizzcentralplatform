-- WizzCentral Campaign Conditions Database Schema
-- Enhanced schema to support sophisticated campaign condition definitions
-- Author: WizzCentral Dev Team
-- Version: 1.0

-- ============================================
-- CAMPAIGN CONDITIONS TABLES
-- ============================================

-- Main campaigns table with condition support
CREATE TABLE IF NOT EXISTS campaigns (
    campaign_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- 'first-order', 'restaurant-first', 'new-customer', 'special-occasion', 'advanced'
    description TEXT,
    
    -- Discount configuration
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'free_delivery', 'bogo'
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    
    -- Usage limits
    usage_limit INTEGER DEFAULT 0, -- 0 = unlimited
    current_usage INTEGER DEFAULT 0,
    single_use_per_customer BOOLEAN DEFAULT FALSE,
    stackable_with_others BOOLEAN DEFAULT FALSE,
    
    -- Validity period
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    
    -- Status and settings
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'expired', 'completed'
    auto_activate BOOLEAN DEFAULT FALSE,
    
    -- Advanced condition settings
    uses_advanced_conditions BOOLEAN DEFAULT FALSE,
    condition_logic VARCHAR(10) DEFAULT 'AND', -- 'AND', 'OR'
    
    -- Legacy targeting (for backward compatibility)
    target_restaurants JSON,
    target_segments JSON,
    occasions JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    
    -- Indexes
    INDEX idx_campaign_type (campaign_type),
    INDEX idx_campaign_status (status),
    INDEX idx_campaign_active (is_active),
    INDEX idx_campaign_dates (start_date, end_date),
    INDEX idx_campaign_code (code)
);

-- Campaign conditions table for sophisticated targeting
CREATE TABLE IF NOT EXISTS campaign_conditions (
    condition_rule_id VARCHAR(50) PRIMARY KEY,
    campaign_id VARCHAR(50) NOT NULL,
    condition_id VARCHAR(100) NOT NULL, -- References condition definition ID
    condition_order INTEGER NOT NULL, -- Order of evaluation
    
    -- Condition parameters (JSON for flexibility)
    parameters JSON,
    
    -- Logic operators
    operator VARCHAR(10) DEFAULT 'AND', -- 'AND', 'OR', 'NOT'
    
    -- Condition metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
    INDEX idx_campaign_conditions (campaign_id),
    INDEX idx_condition_order (campaign_id, condition_order)
);

-- Condition definitions catalog
CREATE TABLE IF NOT EXISTS condition_definitions (
    condition_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'customer', 'order', 'location', 'time', 'business', 'behavior'
    
    -- Parameters schema (JSON Schema)
    parameter_schema JSON,
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_condition_category (category),
    INDEX idx_condition_active (is_active)
);

-- ============================================
-- CAMPAIGN USAGE TRACKING
-- ============================================

-- Campaign usage tracking
CREATE TABLE IF NOT EXISTS campaign_usage (
    usage_id VARCHAR(50) PRIMARY KEY,
    campaign_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(50),
    
    -- Usage details
    discount_applied DECIMAL(10,2),
    original_amount DECIMAL(10,2),
    final_amount DECIMAL(10,2),
    
    -- Context
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    context_data JSON, -- Additional context about usage
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
    INDEX idx_campaign_usage (campaign_id),
    INDEX idx_customer_usage (customer_id),
    INDEX idx_usage_date (used_at),
    UNIQUE KEY unique_customer_campaign (customer_id, campaign_id) -- For single-use campaigns
);

-- Campaign eligibility log (for debugging and analytics)
CREATE TABLE IF NOT EXISTS campaign_eligibility_log (
    log_id VARCHAR(50) PRIMARY KEY,
    campaign_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(50),
    
    -- Eligibility result
    is_eligible BOOLEAN NOT NULL,
    evaluation_result JSON, -- Detailed condition evaluation results
    
    -- Context
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluation_time_ms INTEGER, -- Performance tracking
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
    INDEX idx_eligibility_campaign (campaign_id),
    INDEX idx_eligibility_customer (customer_id),
    INDEX idx_eligibility_date (checked_at)
);

-- ============================================
-- CUSTOMER DATA VIEWS (for condition evaluation)
-- ============================================

-- Customer summary view for condition evaluation
CREATE VIEW customer_summary AS
SELECT 
    c.customer_id,
    c.name,
    c.email,
    c.phone,
    c.registered_at,
    c.last_login_at,
    c.is_active,
    c.preferred_language,
    c.marketing_consent,
    
    -- Order statistics
    COALESCE(o.total_orders, 0) as total_orders,
    COALESCE(o.completed_orders, 0) as completed_orders,
    COALESCE(o.total_spent, 0) as total_spent,
    COALESCE(o.avg_order_value, 0) as avg_order_value,
    o.last_order_date,
    o.first_order_date,
    
    -- Behavioral metrics
    DATEDIFF(CURRENT_DATE, o.last_order_date) as days_since_last_order,
    DATEDIFF(CURRENT_DATE, c.registered_at) as days_since_registration,
    
    -- Customer segment classification
    CASE 
        WHEN COALESCE(o.total_spent, 0) > 500 OR COALESCE(o.completed_orders, 0) > 20 THEN 'vip'
        WHEN COALESCE(o.completed_orders, 0) >= 1 THEN 'regular'
        ELSE 'new'
    END as customer_segment

FROM customers c
LEFT JOIN (
    SELECT 
        customer_id,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
        SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END) as total_spent,
        AVG(CASE WHEN status = 'delivered' THEN total_amount END) as avg_order_value,
        MAX(CASE WHEN status = 'delivered' THEN completed_at END) as last_order_date,
        MIN(CASE WHEN status = 'delivered' THEN completed_at END) as first_order_date
    FROM orders 
    GROUP BY customer_id
) o ON c.customer_id = o.customer_id;

-- Restaurant order history view
CREATE VIEW customer_restaurant_history AS
SELECT 
    o.customer_id,
    o.restaurant_id,
    r.name as restaurant_name,
    r.category as restaurant_category,
    COUNT(*) as order_count,
    MAX(o.completed_at) as last_order_date,
    MIN(o.completed_at) as first_order_date,
    SUM(o.total_amount) as total_spent_at_restaurant
FROM orders o
JOIN restaurants r ON o.restaurant_id = r.restaurant_id
WHERE o.status = 'delivered'
GROUP BY o.customer_id, o.restaurant_id;

-- ============================================
-- STORED PROCEDURES FOR CONDITION EVALUATION
-- ============================================

DELIMITER //

-- Procedure to evaluate campaign eligibility
CREATE PROCEDURE EvaluateCampaignEligibility(
    IN p_campaign_id VARCHAR(50),
    IN p_customer_id VARCHAR(50),
    IN p_order_data JSON,
    OUT p_is_eligible BOOLEAN,
    OUT p_evaluation_details JSON
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_condition_id VARCHAR(100);
    DECLARE v_parameters JSON;
    DECLARE v_operator VARCHAR(10);
    DECLARE v_condition_result BOOLEAN DEFAULT TRUE;
    DECLARE v_overall_result BOOLEAN DEFAULT TRUE;
    DECLARE v_logic VARCHAR(10) DEFAULT 'AND';
    DECLARE v_evaluation_results JSON DEFAULT JSON_ARRAY();
    
    -- Cursor for campaign conditions
    DECLARE condition_cursor CURSOR FOR
        SELECT condition_id, parameters, operator
        FROM campaign_conditions
        WHERE campaign_id = p_campaign_id
        ORDER BY condition_order;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Get campaign logic
    SELECT condition_logic INTO v_logic
    FROM campaigns
    WHERE campaign_id = p_campaign_id AND is_active = TRUE;
    
    -- If no conditions, campaign is eligible
    IF (SELECT COUNT(*) FROM campaign_conditions WHERE campaign_id = p_campaign_id) = 0 THEN
        SET p_is_eligible = TRUE;
        SET p_evaluation_details = JSON_OBJECT('result', 'eligible', 'reason', 'no_conditions');
        LEAVE proc;
    END IF;
    
    -- Initialize result based on logic
    IF v_logic = 'OR' THEN
        SET v_overall_result = FALSE;
    END IF;
    
    -- Evaluate each condition
    OPEN condition_cursor;
    
    condition_loop: LOOP
        FETCH condition_cursor INTO v_condition_id, v_parameters, v_operator;
        IF done THEN
            LEAVE condition_loop;
        END IF;
        
        -- Call condition evaluation function (would be implemented in application layer)
        -- For now, we'll simulate basic conditions
        CASE v_condition_id
            WHEN 'new_customer' THEN
                SELECT (completed_orders = 0) INTO v_condition_result
                FROM customer_summary
                WHERE customer_id = p_customer_id;
                
            WHEN 'recently_registered' THEN
                SELECT (days_since_registration <= JSON_UNQUOTE(JSON_EXTRACT(v_parameters, '$.days'))) INTO v_condition_result
                FROM customer_summary
                WHERE customer_id = p_customer_id;
                
            WHEN 'vip_customer' THEN
                SELECT (customer_segment = 'vip') INTO v_condition_result
                FROM customer_summary
                WHERE customer_id = p_customer_id;
                
            ELSE
                SET v_condition_result = TRUE; -- Default to eligible for unknown conditions
        END CASE;
        
        -- Apply operator logic
        IF v_operator = 'NOT' THEN
            SET v_condition_result = NOT v_condition_result;
        END IF;
        
        -- Add to evaluation results
        SET v_evaluation_results = JSON_ARRAY_APPEND(
            v_evaluation_results,
            '$',
            JSON_OBJECT(
                'condition_id', v_condition_id,
                'result', v_condition_result,
                'operator', v_operator
            )
        );
        
        -- Apply overall logic
        IF v_logic = 'AND' THEN
            SET v_overall_result = v_overall_result AND v_condition_result;
        ELSE -- OR logic
            SET v_overall_result = v_overall_result OR v_condition_result;
        END IF;
        
    END LOOP;
    
    CLOSE condition_cursor;
    
    -- Set output parameters
    SET p_is_eligible = v_overall_result;
    SET p_evaluation_details = JSON_OBJECT(
        'logic', v_logic,
        'overall_result', v_overall_result,
        'condition_results', v_evaluation_results
    );
    
END //

-- Procedure to log campaign usage
CREATE PROCEDURE LogCampaignUsage(
    IN p_campaign_id VARCHAR(50),
    IN p_customer_id VARCHAR(50),
    IN p_order_id VARCHAR(50),
    IN p_discount_applied DECIMAL(10,2),
    IN p_original_amount DECIMAL(10,2),
    IN p_context_data JSON
)
BEGIN
    DECLARE v_usage_id VARCHAR(50);
    DECLARE v_final_amount DECIMAL(10,2);
    
    -- Generate usage ID
    SET v_usage_id = CONCAT('usage_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(CONCAT(p_campaign_id, p_customer_id)), 1, 8));
    
    -- Calculate final amount
    SET v_final_amount = p_original_amount - p_discount_applied;
    
    -- Insert usage record
    INSERT INTO campaign_usage (
        usage_id, campaign_id, customer_id, order_id,
        discount_applied, original_amount, final_amount,
        context_data
    ) VALUES (
        v_usage_id, p_campaign_id, p_customer_id, p_order_id,
        p_discount_applied, p_original_amount, v_final_amount,
        p_context_data
    );
    
    -- Update campaign usage count
    UPDATE campaigns 
    SET current_usage = current_usage + 1
    WHERE campaign_id = p_campaign_id;
    
END //

DELIMITER ;

-- ============================================
-- SAMPLE CONDITION DEFINITIONS
-- ============================================

-- Insert predefined condition definitions
INSERT INTO condition_definitions (condition_id, name, description, category, parameter_schema) VALUES
('new_customer', 'New Customer', 'Customer with zero completed orders', 'customer', '{}'),
('recently_registered', 'Recently Registered', 'Customer registered within specified days', 'customer', 
 '{"type":"object","properties":{"days":{"type":"number","minimum":1,"maximum":365,"default":7}}}'),
('restaurant_first_order', 'First Order From Restaurant', 'Customer has never ordered from specific restaurant(s)', 'customer',
 '{"type":"object","properties":{"restaurantIds":{"type":"array","items":{"type":"string"}}}}'),
('returning_customer', 'Returning Customer', 'Customer with at least one completed order', 'customer',
 '{"type":"object","properties":{"minOrders":{"type":"number","minimum":1,"default":1}}}'),
('vip_customer', 'VIP Customer', 'High-value customer based on spending or order frequency', 'customer',
 '{"type":"object","properties":{"minSpending":{"type":"number","default":500},"minOrders":{"type":"number","default":20},"timeFrameDays":{"type":"number","default":365}}}'),
('inactive_customer', 'Inactive Customer', 'Customer who hasn\'t ordered for specified period', 'customer',
 '{"type":"object","properties":{"inactiveDays":{"type":"number","minimum":7,"default":30}}}'),
('min_order_value', 'Minimum Order Value', 'Order total meets minimum value requirement', 'order',
 '{"type":"object","properties":{"minValue":{"type":"number","minimum":0,"default":0}}}'),
('order_count_period', 'Order Count in Period', 'Customer order count in specified time period', 'order',
 '{"type":"object","properties":{"maxOrders":{"type":"number","minimum":0,"default":1},"periodDays":{"type":"number","minimum":1,"default":30}}}'),
('first_order_today', 'First Order Today', 'Customer\'s first order of the day', 'order', '{}'),
('delivery_area', 'Delivery Area', 'Order delivery address within specified areas', 'location',
 '{"type":"object","properties":{"areas":{"type":"array","items":{"type":"string"}}}}'),
('restaurant_location', 'Restaurant Location', 'Order from restaurants in specific locations', 'location',
 '{"type":"object","properties":{"restaurantIds":{"type":"array","items":{"type":"string"}}}}'),
('time_of_day', 'Time of Day', 'Order placed within specific hours', 'time',
 '{"type":"object","properties":{"startHour":{"type":"number","minimum":0,"maximum":23,"default":0},"endHour":{"type":"number","minimum":0,"maximum":23,"default":23}}}'),
('day_of_week', 'Day of Week', 'Order placed on specific days', 'time',
 '{"type":"object","properties":{"days":{"type":"array","items":{"type":"number","minimum":0,"maximum":6}}}}'),
('special_occasion', 'Special Occasion', 'Order during special occasions or holidays', 'time',
 '{"type":"object","properties":{"occasions":{"type":"array","items":{"type":"string"}}}}'),
('restaurant_category', 'Restaurant Category', 'Order from restaurants of specific categories', 'business',
 '{"type":"object","properties":{"categories":{"type":"array","items":{"type":"string"}}}}'),
('payment_method', 'Payment Method', 'Order using specific payment methods', 'business',
 '{"type":"object","properties":{"methods":{"type":"array","items":{"type":"string"}}}}'),
('avg_order_value', 'Average Order Value', 'Customer\'s average order value in range', 'behavior',
 '{"type":"object","properties":{"minAverage":{"type":"number","default":0},"maxAverage":{"type":"number"},"periodDays":{"type":"number","default":90}}}'),
('order_frequency', 'Order Frequency', 'Customer order frequency pattern', 'behavior',
 '{"type":"object","properties":{"minOrdersPerMonth":{"type":"number","default":1},"maxOrdersPerMonth":{"type":"number"},"monthsBack":{"type":"number","default":3}}}');

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample campaign with advanced conditions
INSERT INTO campaigns (
    campaign_id, title, code, campaign_type, description,
    discount_type, discount_value, min_order_value,
    start_date, end_date, uses_advanced_conditions, condition_logic
) VALUES (
    'camp_newcustomer_001', 'New Customer Welcome', 'WELCOME25', 'advanced',
    'Welcome offer for new customers with sophisticated targeting',
    'percentage', 25.00, 30.00,
    '2025-01-01 00:00:00', '2025-12-31 23:59:59',
    TRUE, 'AND'
);

-- Add conditions for the sample campaign
INSERT INTO campaign_conditions (condition_rule_id, campaign_id, condition_id, condition_order, parameters) VALUES
('rule_001', 'camp_newcustomer_001', 'recently_registered', 1, '{"days": 7}'),
('rule_002', 'camp_newcustomer_001', 'new_customer', 2, '{}'),
('rule_003', 'camp_newcustomer_001', 'min_order_value', 3, '{"minValue": 30}');

-- Insert VIP weekend campaign
INSERT INTO campaigns (
    campaign_id, title, code, campaign_type, description,
    discount_type, discount_value, min_order_value,
    start_date, end_date, uses_advanced_conditions, condition_logic
) VALUES (
    'camp_vip_weekend_001', 'VIP Weekend Special', 'VIPWEEKEND', 'advanced',
    'Exclusive weekend offers for VIP customers',
    'percentage', 15.00, 75.00,
    '2025-01-01 00:00:00', '2025-12-31 23:59:59',
    TRUE, 'AND'
);

-- Add conditions for VIP weekend campaign
INSERT INTO campaign_conditions (condition_rule_id, campaign_id, condition_id, condition_order, parameters) VALUES
('rule_004', 'camp_vip_weekend_001', 'vip_customer', 1, '{"minSpending": 500, "minOrders": 20}'),
('rule_005', 'camp_vip_weekend_001', 'day_of_week', 2, '{"days": [0, 6]}'),
('rule_006', 'camp_vip_weekend_001', 'min_order_value', 3, '{"minValue": 75}');

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Campaign performance view
CREATE VIEW campaign_performance AS
SELECT 
    c.campaign_id,
    c.title,
    c.code,
    c.campaign_type,
    c.discount_type,
    c.discount_value,
    c.usage_limit,
    c.current_usage,
    CASE 
        WHEN c.usage_limit > 0 THEN ROUND((c.current_usage / c.usage_limit) * 100, 2)
        ELSE NULL
    END as usage_percentage,
    
    -- Financial metrics
    COALESCE(u.total_discount_given, 0) as total_discount_given,
    COALESCE(u.total_orders_value, 0) as total_orders_value,
    COALESCE(u.unique_customers, 0) as unique_customers,
    
    -- Performance metrics
    DATEDIFF(c.end_date, c.start_date) as campaign_duration_days,
    DATEDIFF(CURRENT_DATE, c.start_date) as days_active,
    
    c.start_date,
    c.end_date,
    c.is_active,
    c.status

FROM campaigns c
LEFT JOIN (
    SELECT 
        campaign_id,
        SUM(discount_applied) as total_discount_given,
        SUM(original_amount) as total_orders_value,
        COUNT(DISTINCT customer_id) as unique_customers
    FROM campaign_usage
    GROUP BY campaign_id
) u ON c.campaign_id = u.campaign_id;

-- Condition usage analytics
CREATE VIEW condition_usage_analytics AS
SELECT 
    cd.condition_id,
    cd.name,
    cd.category,
    COUNT(cc.condition_rule_id) as times_used,
    COUNT(DISTINCT cc.campaign_id) as campaigns_using,
    cd.created_at
FROM condition_definitions cd
LEFT JOIN campaign_conditions cc ON cd.condition_id = cc.condition_id
GROUP BY cd.condition_id, cd.name, cd.category, cd.created_at
ORDER BY times_used DESC;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional indexes for better performance
CREATE INDEX idx_campaign_usage_customer_campaign ON campaign_usage(customer_id, campaign_id);
CREATE INDEX idx_campaign_usage_date_range ON campaign_usage(used_at, campaign_id);
CREATE INDEX idx_eligibility_log_performance ON campaign_eligibility_log(campaign_id, checked_at, is_eligible);
CREATE INDEX idx_customer_summary_segment ON customer_summary(customer_segment);
CREATE INDEX idx_customer_summary_orders ON customer_summary(total_orders, total_spent);

-- ============================================
-- TRIGGERS FOR DATA INTEGRITY
-- ============================================

DELIMITER //

-- Trigger to update campaign usage count
CREATE TRIGGER update_campaign_usage_count
    AFTER INSERT ON campaign_usage
    FOR EACH ROW
BEGIN
    UPDATE campaigns 
    SET current_usage = (
        SELECT COUNT(*) 
        FROM campaign_usage 
        WHERE campaign_id = NEW.campaign_id
    )
    WHERE campaign_id = NEW.campaign_id;
END //

-- Trigger to update condition usage statistics
CREATE TRIGGER update_condition_usage_stats
    AFTER INSERT ON campaign_conditions
    FOR EACH ROW
BEGIN
    UPDATE condition_definitions 
    SET usage_count = usage_count + 1
    WHERE condition_id = NEW.condition_id;
END //

-- Trigger to validate campaign dates
CREATE TRIGGER validate_campaign_dates
    BEFORE INSERT ON campaigns
    FOR EACH ROW
BEGIN
    IF NEW.end_date <= NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'End date must be after start date';
    END IF;
END //

DELIMITER ;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant appropriate permissions for application user
-- GRANT SELECT, INSERT, UPDATE ON campaigns TO 'wizzcentral_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_conditions TO 'wizzcentral_app'@'%';
-- GRANT SELECT ON condition_definitions TO 'wizzcentral_app'@'%';
-- GRANT SELECT, INSERT ON campaign_usage TO 'wizzcentral_app'@'%';
-- GRANT SELECT, INSERT ON campaign_eligibility_log TO 'wizzcentral_app'@'%';
-- GRANT SELECT ON customer_summary TO 'wizzcentral_app'@'%';
-- GRANT SELECT ON customer_restaurant_history TO 'wizzcentral_app'@'%';
-- GRANT SELECT ON campaign_performance TO 'wizzcentral_app'@'%';
-- GRANT SELECT ON condition_usage_analytics TO 'wizzcentral_app'@'%';
-- GRANT EXECUTE ON PROCEDURE EvaluateCampaignEligibility TO 'wizzcentral_app'@'%';
-- GRANT EXECUTE ON PROCEDURE LogCampaignUsage TO 'wizzcentral_app'@'%';
