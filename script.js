// WizzCentral Login Script with AWS Cognito
console.log('Loading login script...');

// Configuration
let cognitoConfig = null;
let isConfigLoaded = false;
let cognitoUser = null;

// Load configuration on page load
async function loadConfiguration() {
    try {
        console.log('Loading Amplify configuration...');
        const response = await fetch('./amplify_outputs.json');
        const config = await response.json();
        console.log('Configuration loaded:', config);
        
        if (config.auth) {
            cognitoConfig = {
                region: config.auth.aws_region,
                userPoolId: config.auth.user_pool_id,
                clientId: config.auth.user_pool_client_id
            };
            
            // Configure AWS SDK
            AWS.config.region = cognitoConfig.region;
            
            isConfigLoaded = true;
            console.log('Cognito config extracted:', cognitoConfig);
        } else {
            throw new Error('Invalid configuration format');
        }
        
    } catch (error) {
        console.error('Failed to load configuration:', error);
        showMessage('Failed to load authentication configuration', 'error');
    }
}

// AWS Cognito authentication using AWS SDK
async function authenticateWithCognito(email, password) {
    if (!isConfigLoaded || !cognitoConfig) {
        throw new Error('Configuration not loaded');
    }
    
    console.log('Attempting Cognito authentication...');
    
    return new Promise((resolve, reject) => {
        const poolData = {
            UserPoolId: cognitoConfig.userPoolId,
            ClientId: cognitoConfig.clientId
        };
        
        const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        
        const userData = {
            Username: email,
            Pool: userPool
        };
        
        cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password
        });
        
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                console.log('Authentication successful:', result);
                resolve({
                    success: true,
                    accessToken: result.getAccessToken().getJwtToken(),
                    idToken: result.getIdToken().getJwtToken(),
                    refreshToken: result.getRefreshToken().getToken()
                });
            },
            onFailure: function(err) {
                console.error('Authentication failed:', err);
                reject(err);
            },
            newPasswordRequired: function(userAttributes, requiredAttributes) {
                console.log('New password required');
                reject(new Error('New password required. Please contact support.'));
            }
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing...');
    
    // Load configuration
    await loadConfiguration();
    
    // Initialize UI
    initializeUI();
});

function initializeUI() {
    console.log('Initializing UI...');
    
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    const emailInput = document.getElementById('email');

    if (!loginForm) {
        console.error('Login form not found');
        return;
    }

    // Password Toggle Functionality
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Form Submission Handler
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        if (!isConfigLoaded) {
            showMessage('Authentication system not ready. Please refresh the page.', 'error');
            return;
        }
        
        const email = emailInput?.value?.trim() || '';
        const password = passwordInput?.value?.trim() || '';
        const remember = document.getElementById('remember')?.checked || false;
        
        // Basic validation
        if (!email || !password) {
            showMessage('Please fill in all required fields.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long.', 'error');
            return;
        }
        
        console.log('Validation passed, calling handleLogin');
        handleLogin(email, password, remember);
    });
    
    // Auto-fill remembered email
    const rememberLogin = localStorage.getItem('rememberLogin');
    const lastEmail = localStorage.getItem('lastEmail');
    
    if (rememberLogin === 'true' && lastEmail && emailInput) {
        emailInput.value = lastEmail;
        const rememberCheckbox = document.getElementById('remember');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
    
    console.log('UI initialized successfully');
}

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Enhanced login handler
async function handleLogin(email, password, remember) {
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn) return;
    
    const originalText = loginBtn.innerHTML;
    
    // Update button state
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Signing In...</span>';
    loginBtn.disabled = true;
    
    try {
        console.log('Attempting login with email:', email);
        
        // Authenticate with Cognito
        const authResult = await authenticateWithCognito(email, password);
        
        if (authResult.success) {
            console.log('Login successful');
            showMessage('Login successful! Redirecting...', 'success');
            
            // Store authentication tokens
            sessionStorage.setItem('accessToken', authResult.accessToken);
            sessionStorage.setItem('idToken', authResult.idToken);
            sessionStorage.setItem('refreshToken', authResult.refreshToken);
            sessionStorage.setItem('userEmail', email);
            
            // Store remember preference
            if (remember) {
                localStorage.setItem('rememberLogin', 'true');
                localStorage.setItem('lastEmail', email);
            } else {
                localStorage.removeItem('rememberLogin');
                localStorage.removeItem('lastEmail');
            }
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } else {
            throw new Error('Authentication failed');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        handleLoginError(error);
    } finally {
        // Reset button state
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

function handleLoginError(error) {
    let errorMessage = 'Login failed';
    
    console.log('Error details:', {
        name: error.name,
        message: error.message
    });
    
    const errorString = error.message || error.toString();
    
    if (errorString.includes('NotAuthorizedException') || errorString.includes('Incorrect username or password')) {
        errorMessage = 'Invalid email or password';
    } else if (errorString.includes('UserNotConfirmedException')) {
        errorMessage = 'Please verify your email address';
    } else if (errorString.includes('UserNotFoundException')) {
        errorMessage = 'User not found';
    } else if (errorString.includes('TooManyRequestsException')) {
        errorMessage = 'Too many login attempts. Please try again later.';
    } else if (errorString.includes('NetworkError') || errorString.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
    } else if (error.message && error.message !== 'Authentication failed') {
        errorMessage = error.message;
    }
    
    showMessage(errorMessage, 'error');
}

// Message display function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to document
    document.body.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 5000);
}

// Social login handlers
document.addEventListener('DOMContentLoaded', function() {
    const socialBtns = document.querySelectorAll('.social-btn');
    
    socialBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const provider = this.classList.contains('google') ? 'Google' : 'Microsoft';
            showMessage(`${provider} login is not implemented yet.`, 'error');
        });
    });
    
    // Forgot password handler
    const forgotPasswordLink = document.querySelector('.forgot-password');
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        showMessage('Password reset functionality is not implemented yet.', 'error');
    });
});

// Input focus animations
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
            this.parentElement.style.transition = 'transform 0.3s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Enter key to submit form
    if (e.key === 'Enter' && (e.target.type === 'email' || e.target.type === 'password')) {
        e.preventDefault();
        loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape key to clear form
    if (e.key === 'Escape') {
        emailInput.value = '';
        passwordInput.value = '';
        document.getElementById('remember').checked = false;
        emailInput.focus();
    }
});

// Demo credentials hint
document.addEventListener('DOMContentLoaded', function() {
    // Add demo credentials hint after a short delay
    setTimeout(() => {
        showMessage('Demo: email: demo@wizz.com, password: demo123', 'success');
    }, 3000);
});
