// Modern Amplify Auth implementation for WizzCentral
console.log('Loading script...');

// Load Amplify from CDN
const script = document.createElement('script');
script.src = 'https://unpkg.com/@aws-amplify/auth@6.0.13/dist/aws-amplify-auth.min.js';
script.onload = initializeApp;
document.head.appendChild(script);

// Global variables
let amplifyAuth;
let amplifyConfigured = false;

async function initializeApp() {
    console.log('Amplify Auth script loaded');
    
    try {
        // Import Amplify modules
        const { Amplify } = await import('https://unpkg.com/aws-amplify@6.0.13/dist/aws-amplify.esm.js');
        const { signIn, getCurrentUser } = await import('https://unpkg.com/@aws-amplify/auth@6.0.13/dist/aws-amplify-auth.esm.js');
        
        amplifyAuth = { signIn, getCurrentUser };
        
        // Load configuration
        await configureAmplify(Amplify);
        
        // Initialize UI
        initializeUI();
        
    } catch (error) {
        console.error('Failed to initialize Amplify:', error);
        showMessage('Failed to initialize authentication system', 'error');
    }
}

async function configureAmplify(Amplify) {
    try {
        console.log('Loading Amplify configuration...');
        
        // Try to load amplify_outputs.json
        const response = await fetch('./amplify_outputs.json');
        const config = await response.json();
        console.log('Configuration loaded:', config);
        
        Amplify.configure(config);
        amplifyConfigured = true;
        console.log('Amplify configured successfully');
        
    } catch (error) {
        console.error('Failed to load configuration:', error);
        showMessage('Failed to load authentication configuration', 'error');
    }
}

function initializeUI() {
    console.log('Initializing UI...');
    
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    const emailInput = document.getElementById('email');

    if (!loginForm || !passwordToggle || !passwordInput || !emailInput) {
        console.error('Required DOM elements not found');
        return;
    }

    // Password Toggle Functionality
    passwordToggle.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Form Submission Handler
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        if (!amplifyConfigured) {
            showMessage('Authentication system not ready. Please refresh the page.', 'error');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
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
    const originalText = loginBtn.innerHTML;
    
    // Update button state
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Signing In...</span>';
    loginBtn.disabled = true;
    
    try {
        console.log('Attempting login with email:', email);
        
        if (!amplifyAuth || !amplifyConfigured) {
            throw new Error('Authentication system not properly initialized');
        }
        
        // Attempt sign in
        const signInResult = await amplifyAuth.signIn({
            username: email,
            password: password
        });
        
        console.log('Sign in result:', signInResult);
        
        if (signInResult.isSignedIn) {
            console.log('Login successful');
            showMessage('Login successful! Redirecting...', 'success');
            
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
            console.log('Sign in not completed, additional steps required:', signInResult.nextStep);
            handleSignInNextStep(signInResult.nextStep);
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

function handleSignInNextStep(nextStep) {
    console.log('Handling next step:', nextStep);
    
    if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        showMessage('Please verify your email address before signing in', 'error');
    } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        showMessage('Password change required. Please contact support.', 'error');
    } else {
        showMessage('Additional authentication steps required', 'error');
    }
}

function handleLoginError(error) {
    let errorMessage = 'Login failed';
    
    console.log('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
    });
    
    if (error.name === 'NotAuthorizedException' || error.message?.includes('Incorrect username or password')) {
        errorMessage = 'Invalid email or password';
    } else if (error.name === 'UserNotConfirmedException') {
        errorMessage = 'Please verify your email address';
    } else if (error.name === 'UserNotFoundException') {
        errorMessage = 'User not found';
    } else if (error.name === 'TooManyRequestsException') {
        errorMessage = 'Too many login attempts. Please try again later.';
    } else if (error.message) {
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
    
    // Add animation styles if not already present
    if (!document.querySelector('#message-animations')) {
        const style = document.createElement('style');
        style.id = 'message-animations';
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
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM ready, waiting for Amplify...');
    });
} else {
    console.log('DOM already ready');
}

// Auto-fill remembered email
window.addEventListener('load', () => {
    const rememberLogin = localStorage.getItem('rememberLogin');
    const lastEmail = localStorage.getItem('lastEmail');
    
    if (rememberLogin === 'true' && lastEmail) {
        const emailInput = document.getElementById('email');
        const rememberCheckbox = document.getElementById('remember');
        
        if (emailInput) emailInput.value = lastEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
});
