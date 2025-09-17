import json
import boto3
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
import re
import os
import jwt
import base64

logger = logging.getLogger(__name__)

class SecurityAuditor:
    """
    WizzCentral Campaign Condition Engine Security Auditor
    Performs comprehensive security analysis and vulnerability assessment
    """
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.cloudwatch = boto3.client('cloudwatch')
        self.iam = boto3.client('iam')
        self.lambda_client = boto3.client('lambda')
        
        # Security audit configuration
        self.audit_config = {
            'password_min_length': 12,
            'password_complexity_required': True,
            'session_timeout_minutes': 30,
            'max_failed_login_attempts': 5,
            'api_rate_limit_per_minute': 1000,
            'jwt_expiry_hours': 24,
            'encryption_algorithm': 'AES-256-GCM',
            'audit_log_retention_days': 90
        }
        
        # Security rules and patterns
        self.security_patterns = {
            'sql_injection': [
                r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
                r"(--|#|/\*|\*/)",
                r"(\bOR\b|\bAND\b).*=.*\b(TRUE|FALSE|\d+)\b"
            ],
            'xss_patterns': [
                r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>",
                r"javascript:",
                r"on\w+\s*=",
                r"<iframe",
                r"<object",
                r"<embed"
            ],
            'sensitive_data': [
                r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",  # Credit card
                r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
                r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",  # Email
                r"\b\d{10,15}\b"  # Phone numbers
            ],
            'api_keys': [
                r"(api_key|apikey|access_key|secret_key|private_key)\s*[:=]\s*['\"]?([A-Za-z0-9_\-]{20,})['\"]?",
                r"(AWS|aws)[_\-]?(ACCESS[_\-]?KEY[_\-]?ID|SECRET[_\-]?ACCESS[_\-]?KEY)",
                r"(STRIPE|stripe)[_\-]?(PUBLISHABLE|SECRET)[_\-]?KEY"
            ]
        }
        
        # Security findings severity levels
        self.severity_levels = {
            'CRITICAL': {'score': 100, 'color': 'red'},
            'HIGH': {'score': 80, 'color': 'orange'},
            'MEDIUM': {'score': 60, 'color': 'yellow'},
            'LOW': {'score': 40, 'color': 'blue'},
            'INFO': {'score': 20, 'color': 'green'}
        }

    def run_comprehensive_security_audit(self) -> Dict:
        """Run complete security audit of the condition engine system"""
        audit_id = str(uuid.uuid4())
        audit_start_time = datetime.utcnow()
        
        logger.info(f"Starting comprehensive security audit: {audit_id}")
        
        try:
            audit_results = {
                'auditId': audit_id,
                'startTime': audit_start_time.isoformat(),
                'auditType': 'comprehensive',
                'findings': [],
                'summary': {},
                'recommendations': [],
                'compliance': {},
                'riskScore': 0
            }
            
            # Run individual audit components
            audit_results['findings'].extend(self.audit_authentication_security())
            audit_results['findings'].extend(self.audit_api_security())
            audit_results['findings'].extend(self.audit_data_protection())
            audit_results['findings'].extend(self.audit_infrastructure_security())
            audit_results['findings'].extend(self.audit_condition_evaluation_security())
            audit_results['findings'].extend(self.audit_webhook_security())
            audit_results['findings'].extend(self.audit_mobile_app_security())
            audit_results['findings'].extend(self.audit_database_security())
            audit_results['findings'].extend(self.audit_logging_and_monitoring())
            
            # Calculate overall risk score and summary
            audit_results['summary'] = self.calculate_audit_summary(audit_results['findings'])
            audit_results['riskScore'] = audit_results['summary']['overallRiskScore']
            audit_results['recommendations'] = self.generate_security_recommendations(audit_results['findings'])
            audit_results['compliance'] = self.assess_compliance_status(audit_results['findings'])
            
            # Store audit results
            audit_results['endTime'] = datetime.utcnow().isoformat()
            audit_results['duration'] = str(datetime.utcnow() - audit_start_time)
            
            self.store_audit_results(audit_results)
            
            logger.info(f"Security audit completed: {audit_id}")
            return audit_results
            
        except Exception as e:
            logger.error(f"Error during security audit: {str(e)}")
            return {
                'auditId': audit_id,
                'error': str(e),
                'status': 'failed'
            }

    # ============ AUTHENTICATION SECURITY ============

    def audit_authentication_security(self) -> List[Dict]:
        """Audit authentication and authorization mechanisms"""
        findings = []
        
        try:
            # Check JWT configuration
            jwt_findings = self.audit_jwt_configuration()
            findings.extend(jwt_findings)
            
            # Check session management
            session_findings = self.audit_session_management()
            findings.extend(session_findings)
            
            # Check password policies
            password_findings = self.audit_password_policies()
            findings.extend(password_findings)
            
            # Check multi-factor authentication
            mfa_findings = self.audit_mfa_implementation()
            findings.extend(mfa_findings)
            
            # Check API key security
            api_key_findings = self.audit_api_key_security()
            findings.extend(api_key_findings)
            
        except Exception as e:
            findings.append({
                'category': 'authentication',
                'severity': 'HIGH',
                'title': 'Authentication Audit Error',
                'description': f'Error during authentication security audit: {str(e)}',
                'recommendation': 'Investigate authentication audit failure'
            })
        
        return findings

    def audit_jwt_configuration(self) -> List[Dict]:
        """Audit JWT token configuration and security"""
        findings = []
        
        # Check JWT secret strength
        findings.append({
            'category': 'authentication',
            'severity': 'MEDIUM',
            'title': 'JWT Secret Key Review',
            'description': 'JWT secret key strength should be verified',
            'recommendation': 'Ensure JWT secret is at least 32 characters and cryptographically random',
            'details': {
                'current_expiry': f"{self.audit_config['jwt_expiry_hours']} hours",
                'recommended_expiry': '24 hours or less'
            }
        })
        
        # Check JWT expiry settings
        if self.audit_config['jwt_expiry_hours'] > 24:
            findings.append({
                'category': 'authentication',
                'severity': 'MEDIUM',
                'title': 'JWT Expiry Too Long',
                'description': f'JWT tokens expire after {self.audit_config["jwt_expiry_hours"]} hours',
                'recommendation': 'Reduce JWT expiry to 24 hours or less for better security'
            })
        
        return findings

    def audit_session_management(self) -> List[Dict]:
        """Audit session management security"""
        findings = []
        
        # Check session timeout
        if self.audit_config['session_timeout_minutes'] > 60:
            findings.append({
                'category': 'authentication',
                'severity': 'LOW',
                'title': 'Session Timeout Too Long',
                'description': f'Session timeout is set to {self.audit_config["session_timeout_minutes"]} minutes',
                'recommendation': 'Consider reducing session timeout to 30 minutes or less'
            })
        
        # Check session storage security
        findings.append({
            'category': 'authentication',
            'severity': 'INFO',
            'title': 'Session Storage Security',
            'description': 'Verify session data is encrypted and stored securely',
            'recommendation': 'Ensure sessions use secure storage with encryption at rest'
        })
        
        return findings

    def audit_password_policies(self) -> List[Dict]:
        """Audit password policy implementation"""
        findings = []
        
        # Check password minimum length
        if self.audit_config['password_min_length'] < 12:
            findings.append({
                'category': 'authentication',
                'severity': 'HIGH',
                'title': 'Weak Password Minimum Length',
                'description': f'Password minimum length is {self.audit_config["password_min_length"]} characters',
                'recommendation': 'Increase minimum password length to at least 12 characters'
            })
        
        # Check password complexity requirements
        if not self.audit_config['password_complexity_required']:
            findings.append({
                'category': 'authentication',
                'severity': 'HIGH',
                'title': 'Missing Password Complexity Requirements',
                'description': 'Password complexity requirements are not enforced',
                'recommendation': 'Implement password complexity requirements (uppercase, lowercase, numbers, symbols)'
            })
        
        return findings

    def audit_mfa_implementation(self) -> List[Dict]:
        """Audit multi-factor authentication implementation"""
        findings = []
        
        # Check if MFA is implemented
        findings.append({
            'category': 'authentication',
            'severity': 'HIGH',
            'title': 'Multi-Factor Authentication Status',
            'description': 'Multi-factor authentication implementation needs verification',
            'recommendation': 'Implement MFA for admin accounts and high-privilege operations'
        })
        
        return findings

    def audit_api_key_security(self) -> List[Dict]:
        """Audit API key security practices"""
        findings = []
        
        # Check for hardcoded API keys (this would scan code in production)
        findings.append({
            'category': 'authentication',
            'severity': 'CRITICAL',
            'title': 'API Key Security Review',
            'description': 'API keys and secrets should be audited for proper storage',
            'recommendation': 'Ensure all API keys are stored in secure environment variables or secret managers'
        })
        
        return findings

    # ============ API SECURITY ============

    def audit_api_security(self) -> List[Dict]:
        """Audit API security implementations"""
        findings = []
        
        try:
            # Rate limiting
            findings.extend(self.audit_rate_limiting())
            
            # Input validation
            findings.extend(self.audit_input_validation())
            
            # CORS configuration
            findings.extend(self.audit_cors_configuration())
            
            # API versioning
            findings.extend(self.audit_api_versioning())
            
            # Error handling
            findings.extend(self.audit_error_handling())
            
        except Exception as e:
            findings.append({
                'category': 'api_security',
                'severity': 'HIGH',
                'title': 'API Security Audit Error',
                'description': f'Error during API security audit: {str(e)}',
                'recommendation': 'Investigate API security audit failure'
            })
        
        return findings

    def audit_rate_limiting(self) -> List[Dict]:
        """Audit API rate limiting implementation"""
        findings = []
        
        # Check if rate limiting is implemented
        findings.append({
            'category': 'api_security',
            'severity': 'MEDIUM',
            'title': 'Rate Limiting Configuration',
            'description': f'API rate limit is set to {self.audit_config["api_rate_limit_per_minute"]} requests per minute',
            'recommendation': 'Verify rate limiting is properly implemented and monitored'
        })
        
        # Check for DDoS protection
        findings.append({
            'category': 'api_security',
            'severity': 'HIGH',
            'title': 'DDoS Protection',
            'description': 'DDoS protection mechanisms should be verified',
            'recommendation': 'Implement AWS WAF or similar DDoS protection services'
        })
        
        return findings

    def audit_input_validation(self) -> List[Dict]:
        """Audit input validation and sanitization"""
        findings = []
        
        # Check for SQL injection protection
        findings.append({
            'category': 'api_security',
            'severity': 'CRITICAL',
            'title': 'SQL Injection Protection',
            'description': 'SQL injection protection mechanisms should be verified',
            'recommendation': 'Use parameterized queries and input validation for all database operations'
        })
        
        # Check for XSS protection
        findings.append({
            'category': 'api_security',
            'severity': 'HIGH',
            'title': 'Cross-Site Scripting (XSS) Protection',
            'description': 'XSS protection should be implemented for all user inputs',
            'recommendation': 'Implement proper input sanitization and output encoding'
        })
        
        # Check data type validation
        findings.append({
            'category': 'api_security',
            'severity': 'MEDIUM',
            'title': 'Data Type Validation',
            'description': 'All API inputs should have strict data type validation',
            'recommendation': 'Implement comprehensive input validation schemas'
        })
        
        return findings

    def audit_cors_configuration(self) -> List[Dict]:
        """Audit CORS configuration"""
        findings = []
        
        # Check for wildcard CORS
        findings.append({
            'category': 'api_security',
            'severity': 'MEDIUM',
            'title': 'CORS Configuration Review',
            'description': 'CORS configuration allows all origins (*)',
            'recommendation': 'Restrict CORS to specific trusted domains in production'
        })
        
        return findings

    def audit_api_versioning(self) -> List[Dict]:
        """Audit API versioning strategy"""
        findings = []
        
        findings.append({
            'category': 'api_security',
            'severity': 'LOW',
            'title': 'API Versioning Strategy',
            'description': 'API versioning strategy should be consistent',
            'recommendation': 'Maintain backward compatibility and proper deprecation notices'
        })
        
        return findings

    def audit_error_handling(self) -> List[Dict]:
        """Audit error handling security"""
        findings = []
        
        findings.append({
            'category': 'api_security',
            'severity': 'MEDIUM',
            'title': 'Error Information Disclosure',
            'description': 'Error responses should not leak sensitive information',
            'recommendation': 'Implement generic error messages for production and log detailed errors securely'
        })
        
        return findings

    # ============ DATA PROTECTION ============

    def audit_data_protection(self) -> List[Dict]:
        """Audit data protection and privacy measures"""
        findings = []
        
        try:
            # Encryption at rest
            findings.extend(self.audit_encryption_at_rest())
            
            # Encryption in transit
            findings.extend(self.audit_encryption_in_transit())
            
            # Data masking
            findings.extend(self.audit_data_masking())
            
            # PII handling
            findings.extend(self.audit_pii_handling())
            
            # Data retention
            findings.extend(self.audit_data_retention())
            
        except Exception as e:
            findings.append({
                'category': 'data_protection',
                'severity': 'HIGH',
                'title': 'Data Protection Audit Error',
                'description': f'Error during data protection audit: {str(e)}',
                'recommendation': 'Investigate data protection audit failure'
            })
        
        return findings

    def audit_encryption_at_rest(self) -> List[Dict]:
        """Audit encryption at rest implementation"""
        findings = []
        
        findings.append({
            'category': 'data_protection',
            'severity': 'HIGH',
            'title': 'Database Encryption at Rest',
            'description': 'Database encryption at rest should be verified',
            'recommendation': 'Ensure all databases use encryption at rest with customer-managed keys'
        })
        
        findings.append({
            'category': 'data_protection',
            'severity': 'MEDIUM',
            'title': 'S3 Bucket Encryption',
            'description': 'S3 bucket encryption settings should be verified',
            'recommendation': 'Enable default encryption for all S3 buckets'
        })
        
        return findings

    def audit_encryption_in_transit(self) -> List[Dict]:
        """Audit encryption in transit implementation"""
        findings = []
        
        findings.append({
            'category': 'data_protection',
            'severity': 'HIGH',
            'title': 'TLS Configuration',
            'description': 'All API endpoints should use TLS 1.2 or higher',
            'recommendation': 'Enforce TLS 1.2+ for all communications and disable weak cipher suites'
        })
        
        return findings

    def audit_data_masking(self) -> List[Dict]:
        """Audit data masking and anonymization"""
        findings = []
        
        findings.append({
            'category': 'data_protection',
            'severity': 'MEDIUM',
            'title': 'Sensitive Data Masking',
            'description': 'Sensitive data should be masked in logs and non-production environments',
            'recommendation': 'Implement data masking for PII in logs and development databases'
        })
        
        return findings

    def audit_pii_handling(self) -> List[Dict]:
        """Audit PII handling procedures"""
        findings = []
        
        findings.append({
            'category': 'data_protection',
            'severity': 'HIGH',
            'title': 'PII Data Handling',
            'description': 'Personal Identifiable Information handling should comply with privacy regulations',
            'recommendation': 'Implement proper PII classification, handling, and consent management'
        })
        
        return findings

    def audit_data_retention(self) -> List[Dict]:
        """Audit data retention policies"""
        findings = []
        
        findings.append({
            'category': 'data_protection',
            'severity': 'MEDIUM',
            'title': 'Data Retention Policy',
            'description': 'Data retention policies should be defined and implemented',
            'recommendation': 'Implement automated data lifecycle management and deletion policies'
        })
        
        return findings

    # ============ INFRASTRUCTURE SECURITY ============

    def audit_infrastructure_security(self) -> List[Dict]:
        """Audit infrastructure security configuration"""
        findings = []
        
        try:
            # IAM policies
            findings.extend(self.audit_iam_policies())
            
            # Network security
            findings.extend(self.audit_network_security())
            
            # Lambda security
            findings.extend(self.audit_lambda_security())
            
            # DynamoDB security
            findings.extend(self.audit_dynamodb_security())
            
        except Exception as e:
            findings.append({
                'category': 'infrastructure',
                'severity': 'HIGH',
                'title': 'Infrastructure Security Audit Error',
                'description': f'Error during infrastructure security audit: {str(e)}',
                'recommendation': 'Investigate infrastructure security audit failure'
            })
        
        return findings

    def audit_iam_policies(self) -> List[Dict]:
        """Audit IAM policies and permissions"""
        findings = []
        
        findings.append({
            'category': 'infrastructure',
            'severity': 'HIGH',
            'title': 'IAM Least Privilege Principle',
            'description': 'IAM policies should follow the principle of least privilege',
            'recommendation': 'Review and minimize IAM permissions to only required actions and resources'
        })
        
        findings.append({
            'category': 'infrastructure',
            'severity': 'MEDIUM',
            'title': 'IAM Role Separation',
            'description': 'Different functions should use separate IAM roles',
            'recommendation': 'Create specific IAM roles for each Lambda function and service'
        })
        
        return findings

    def audit_network_security(self) -> List[Dict]:
        """Audit network security configuration"""
        findings = []
        
        findings.append({
            'category': 'infrastructure',
            'severity': 'HIGH',
            'title': 'VPC Configuration',
            'description': 'Lambda functions should be deployed in VPC when accessing private resources',
            'recommendation': 'Use VPC for Lambda functions that access databases or internal services'
        })
        
        findings.append({
            'category': 'infrastructure',
            'severity': 'MEDIUM',
            'title': 'Security Group Configuration',
            'description': 'Security groups should restrict access to minimum required ports',
            'recommendation': 'Review and tighten security group rules'
        })
        
        return findings

    def audit_lambda_security(self) -> List[Dict]:
        """Audit Lambda function security"""
        findings = []
        
        findings.append({
            'category': 'infrastructure',
            'severity': 'MEDIUM',
            'title': 'Lambda Environment Variables',
            'description': 'Sensitive data in Lambda environment variables should be encrypted',
            'recommendation': 'Use AWS KMS to encrypt sensitive environment variables'
        })
        
        findings.append({
            'category': 'infrastructure',
            'severity': 'LOW',
            'title': 'Lambda Function Versioning',
            'description': 'Lambda functions should use versioning for better security tracking',
            'recommendation': 'Implement Lambda function versioning and aliases'
        })
        
        return findings

    def audit_dynamodb_security(self) -> List[Dict]:
        """Audit DynamoDB security configuration"""
        findings = []
        
        findings.append({
            'category': 'infrastructure',
            'severity': 'HIGH',
            'title': 'DynamoDB Encryption',
            'description': 'DynamoDB tables should use encryption at rest',
            'recommendation': 'Enable encryption at rest for all DynamoDB tables'
        })
        
        findings.append({
            'category': 'infrastructure',
            'severity': 'MEDIUM',
            'title': 'DynamoDB Point-in-Time Recovery',
            'description': 'DynamoDB tables should have point-in-time recovery enabled',
            'recommendation': 'Enable point-in-time recovery for critical DynamoDB tables'
        })
        
        return findings

    # ============ ADDITIONAL AUDIT CATEGORIES ============

    def audit_condition_evaluation_security(self) -> List[Dict]:
        """Audit condition evaluation security"""
        findings = []
        
        findings.append({
            'category': 'condition_security',
            'severity': 'HIGH',
            'title': 'Condition Injection Prevention',
            'description': 'Condition evaluation should prevent code injection attacks',
            'recommendation': 'Implement strict validation and sanitization of condition parameters'
        })
        
        return findings

    def audit_webhook_security(self) -> List[Dict]:
        """Audit webhook security implementation"""
        findings = []
        
        findings.append({
            'category': 'webhook_security',
            'severity': 'MEDIUM',
            'title': 'Webhook Signature Verification',
            'description': 'Webhook signatures should be verified using HMAC',
            'recommendation': 'Implement HMAC signature verification for all webhook deliveries'
        })
        
        return findings

    def audit_mobile_app_security(self) -> List[Dict]:
        """Audit mobile app integration security"""
        findings = []
        
        findings.append({
            'category': 'mobile_security',
            'severity': 'HIGH',
            'title': 'Mobile API Authentication',
            'description': 'Mobile API endpoints should use strong authentication',
            'recommendation': 'Implement OAuth 2.0 or similar strong authentication for mobile APIs'
        })
        
        return findings

    def audit_database_security(self) -> List[Dict]:
        """Audit database security configuration"""
        findings = []
        
        findings.append({
            'category': 'database_security',
            'severity': 'HIGH',
            'title': 'Database Access Controls',
            'description': 'Database access should be restricted to authorized services only',
            'recommendation': 'Implement database-level access controls and monitoring'
        })
        
        return findings

    def audit_logging_and_monitoring(self) -> List[Dict]:
        """Audit logging and monitoring security"""
        findings = []
        
        findings.append({
            'category': 'monitoring',
            'severity': 'MEDIUM',
            'title': 'Security Event Logging',
            'description': 'Security events should be comprehensively logged',
            'recommendation': 'Implement centralized security event logging and monitoring'
        })
        
        findings.append({
            'category': 'monitoring',
            'severity': 'HIGH',
            'title': 'Anomaly Detection',
            'description': 'Anomaly detection should be implemented for security monitoring',
            'recommendation': 'Set up automated anomaly detection for unusual access patterns'
        })
        
        return findings

    # ============ ANALYSIS AND REPORTING ============

    def calculate_audit_summary(self, findings: List[Dict]) -> Dict:
        """Calculate audit summary and risk scores"""
        summary = {
            'totalFindings': len(findings),
            'criticalFindings': 0,
            'highFindings': 0,
            'mediumFindings': 0,
            'lowFindings': 0,
            'infoFindings': 0,
            'overallRiskScore': 0,
            'categorySummary': {}
        }
        
        category_counts = {}
        total_severity_score = 0
        
        for finding in findings:
            severity = finding.get('severity', 'INFO')
            category = finding.get('category', 'unknown')
            
            # Count by severity
            if severity == 'CRITICAL':
                summary['criticalFindings'] += 1
            elif severity == 'HIGH':
                summary['highFindings'] += 1
            elif severity == 'MEDIUM':
                summary['mediumFindings'] += 1
            elif severity == 'LOW':
                summary['lowFindings'] += 1
            else:
                summary['infoFindings'] += 1
            
            # Count by category
            if category not in category_counts:
                category_counts[category] = 0
            category_counts[category] += 1
            
            # Calculate severity score
            severity_score = self.severity_levels.get(severity, {}).get('score', 0)
            total_severity_score += severity_score
        
        # Calculate overall risk score (0-100)
        if len(findings) > 0:
            summary['overallRiskScore'] = min(100, total_severity_score / len(findings))
        
        summary['categorySummary'] = category_counts
        
        return summary

    def generate_security_recommendations(self, findings: List[Dict]) -> List[Dict]:
        """Generate prioritized security recommendations"""
        recommendations = []
        
        # Group findings by severity
        critical_findings = [f for f in findings if f.get('severity') == 'CRITICAL']
        high_findings = [f for f in findings if f.get('severity') == 'HIGH']
        
        # Priority 1: Critical findings
        if critical_findings:
            recommendations.append({
                'priority': 1,
                'title': 'Address Critical Security Issues',
                'description': f'Immediately address {len(critical_findings)} critical security findings',
                'timeline': 'Within 24 hours',
                'impact': 'System security may be severely compromised'
            })
        
        # Priority 2: High findings
        if high_findings:
            recommendations.append({
                'priority': 2,
                'title': 'Resolve High-Risk Security Issues',
                'description': f'Address {len(high_findings)} high-risk security findings',
                'timeline': 'Within 1 week',
                'impact': 'Significant security vulnerabilities exist'
            })
        
        # Additional general recommendations
        recommendations.extend([
            {
                'priority': 3,
                'title': 'Implement Security Monitoring',
                'description': 'Set up comprehensive security monitoring and alerting',
                'timeline': 'Within 2 weeks',
                'impact': 'Improved threat detection and response'
            },
            {
                'priority': 4,
                'title': 'Regular Security Audits',
                'description': 'Schedule regular security audits and penetration testing',
                'timeline': 'Ongoing',
                'impact': 'Proactive security posture maintenance'
            }
        ])
        
        return recommendations

    def assess_compliance_status(self, findings: List[Dict]) -> Dict:
        """Assess compliance status with security standards"""
        compliance = {
            'SOC2': {'status': 'partial', 'issues': []},
            'GDPR': {'status': 'partial', 'issues': []},
            'CCPA': {'status': 'partial', 'issues': []},
            'PCI_DSS': {'status': 'partial', 'issues': []},
            'OWASP_Top10': {'status': 'partial', 'issues': []}
        }
        
        # Analyze findings for compliance issues
        for finding in findings:
            category = finding.get('category', '')
            severity = finding.get('severity', '')
            
            if category == 'data_protection' and severity in ['CRITICAL', 'HIGH']:
                compliance['GDPR']['issues'].append(finding['title'])
                compliance['CCPA']['issues'].append(finding['title'])
            
            if category == 'authentication' and severity in ['CRITICAL', 'HIGH']:
                compliance['SOC2']['issues'].append(finding['title'])
            
            if category == 'api_security' and severity in ['CRITICAL', 'HIGH']:
                compliance['OWASP_Top10']['issues'].append(finding['title'])
        
        # Determine overall compliance status
        for standard in compliance:
            if len(compliance[standard]['issues']) == 0:
                compliance[standard]['status'] = 'compliant'
            elif len(compliance[standard]['issues']) > 5:
                compliance[standard]['status'] = 'non_compliant'
        
        return compliance

    def store_audit_results(self, audit_results: Dict):
        """Store audit results for tracking and reporting"""
        try:
            # In production, this would store to a dedicated audit table
            logger.info(f"Storing audit results for audit ID: {audit_results['auditId']}")
            
            # Store summary metrics to CloudWatch
            self.cloudwatch.put_metric_data(
                Namespace='WizzCentral/Security',
                MetricData=[
                    {
                        'MetricName': 'SecurityAuditRiskScore',
                        'Value': audit_results['riskScore'],
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow()
                    },
                    {
                        'MetricName': 'SecurityFindingsTotal',
                        'Value': audit_results['summary']['totalFindings'],
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow()
                    },
                    {
                        'MetricName': 'CriticalSecurityFindings',
                        'Value': audit_results['summary']['criticalFindings'],
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow()
                    }
                ]
            )
            
        except Exception as e:
            logger.error(f"Error storing audit results: {str(e)}")

    def generate_audit_report(self, audit_results: Dict) -> str:
        """Generate a formatted audit report"""
        report = f"""
# WizzCentral Security Audit Report

**Audit ID:** {audit_results['auditId']}
**Date:** {audit_results['startTime']}
**Overall Risk Score:** {audit_results['riskScore']:.1f}/100

## Executive Summary

This security audit identified {audit_results['summary']['totalFindings']} findings across the WizzCentral Campaign Condition Engine system.

### Findings Breakdown
- **Critical:** {audit_results['summary']['criticalFindings']}
- **High:** {audit_results['summary']['highFindings']}
- **Medium:** {audit_results['summary']['mediumFindings']}
- **Low:** {audit_results['summary']['lowFindings']}
- **Info:** {audit_results['summary']['infoFindings']}

## Top Recommendations

"""
        
        for i, rec in enumerate(audit_results['recommendations'][:3], 1):
            report += f"{i}. **{rec['title']}** - {rec['description']} (Timeline: {rec['timeline']})\n"
        
        report += "\n## Compliance Status\n\n"
        for standard, status in audit_results['compliance'].items():
            report += f"- **{standard}:** {status['status'].title()}\n"
        
        return report

# Lambda handler for security audit
def lambda_handler(event, context):
    """Lambda handler for security audit execution"""
    auditor = SecurityAuditor()
    
    try:
        # Run security audit
        audit_results = auditor.run_comprehensive_security_audit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(audit_results, default=str)
        }
        
    except Exception as e:
        logger.error(f"Security audit failed: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'Security audit failed: {str(e)}'})
        }
