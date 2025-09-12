// Support Management JavaScript

import { getCurrentUser } from 'https://cdn.jsdelivr.net/npm/aws-amplify@6.4.7/auth/dist/aws-amplify-auth.esm.js';
import { Amplify } from 'https://cdn.jsdelivr.net/npm/aws-amplify@6.4.7/dist/aws-amplify.esm.js';

// Configure Amplify Auth
Amplify.configure({
  Auth: {
        Cognito: {
          region: window.WIZZCENTRAL_CONFIG.COGNITO_REGION,
          userPoolId: window.WIZZCENTRAL_CONFIG.COGNITO_USER_POOL_ID,
          userPoolClientId: window.WIZZCENTRAL_CONFIG.COGNITO_CLIENT_ID,
          mandatorySignIn: true
      }
    }
});

// Redirect to login if not authenticated
getCurrentUser().catch(() => {
    if (window.Auth && window.Auth.redirectToLogin) {
        window.Auth.redirectToLogin('support-root:amplify-getCurrentUser-failed');
    } else {
        window.location.href = window.location.origin + '/frontend/index.html';
    }
});

// Support data - will be loaded from real tables
let tickets = [];
let faqs = [];
let articles = [];

// Initialize support page
document.addEventListener('DOMContentLoaded', function() {
    initializeSupportPage();
    setupEventListeners();
});

function initializeSupportPage() {
    loadSupportData();
    renderTicketsTable();
    renderFAQs();
    renderKnowledgeBase();
    updateSupportStats();
}

// Load support data from backend
async function loadSupportData() {
    try {
        console.log('Loading support data from backend...');
        
        // Load tickets from backend
        await loadTickets();
        
        // Load FAQs from backend
        await loadFAQs();
        
        // Load knowledge base articles from backend
        await loadKnowledgeBase();
        
        console.log('Support data loaded successfully');
        
        // Re-render all components with new data
        renderTicketsTable();
        renderFAQs();
        renderKnowledgeBase();
        updateSupportStats();
    } catch (error) {
        console.error('Error loading support data:', error);
        // Show error in UI
        showErrorMessage('Failed to load support data: ' + error.message);
    }
}

// Load tickets from backend API
async function loadTickets() {
    try {
        const response = await fetch('http://localhost:3000/dev/api/support/tickets', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            tickets = data.tickets || [];
            console.log(`Loaded ${tickets.length} tickets`);
        } else {
            console.warn('Failed to load tickets from backend, using empty array');
            tickets = [];
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        tickets = [];
    }
}

// Load FAQs from backend API
async function loadFAQs() {
    try {
        const response = await fetch('http://localhost:3000/dev/api/support/faqs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            faqs = data.faqs || [];
            console.log(`Loaded ${faqs.length} FAQs`);
        } else {
            console.warn('Failed to load FAQs from backend, using empty array');
            faqs = [];
        }
    } catch (error) {
        console.error('Error loading FAQs:', error);
        faqs = [];
    }
}

// Load knowledge base articles from backend API
async function loadKnowledgeBase() {
    try {
        const response = await fetch('http://localhost:3000/dev/api/support/knowledge-base', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            articles = data.articles || [];
            console.log(`Loaded ${articles.length} knowledge base articles`);
        } else {
            console.warn('Failed to load knowledge base from backend, using empty array');
            articles = [];
        }
    } catch (error) {
        console.error('Error loading knowledge base:', error);
        articles = [];
    }
}

// Show error message to user
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f8d7da;
        color: #721c24;
        padding: 12px 20px;
        border-radius: 4px;
        border: 1px solid #f5c6cb;
        z-index: 1000;
        max-width: 400px;
    `;
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterTickets);
    }

    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (statusFilter) statusFilter.addEventListener('change', filterTickets);
    if (priorityFilter) priorityFilter.addEventListener('change', filterTickets);
    if (categoryFilter) categoryFilter.addEventListener('change', filterTickets);

    // New ticket form
    const newTicketForm = document.getElementById('newTicketForm');
    if (newTicketForm) {
        newTicketForm.addEventListener('submit', handleNewTicket);
    }
}

// Tab switching functionality
function switchTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Initialize live chat when switching to live chat tab
    if (tabName === 'livechat' && !liveChatState.isConnected) {
        initializeLiveChat();
    }

    // Update pagination info based on tab
    const paginationInfo = document.querySelector('.pagination-info');
    if (paginationInfo) {
        switch(tabName) {
            case 'tickets':
                paginationInfo.textContent = `Showing ${Math.min(tickets.length, 10)} of ${tickets.length} tickets`;
                break;
            case 'livechat':
                paginationInfo.textContent = 'Live Chat Support Dashboard';
                break;
            case 'faq':
                paginationInfo.textContent = `Showing ${Math.min(faqs.length, 10)} of ${faqs.length} FAQs`;
                break;
            case 'knowledge':
                paginationInfo.textContent = `Showing ${Math.min(articles.length, 6)} of ${articles.length} articles`;
                break;
        }
    }
}

function renderTicketsTable(ticketsList = tickets) {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;

    if (ticketsList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-ticket-alt" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                    <p>No support tickets found</p>
                    <small>Create a new ticket to get started</small>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = ticketsList.map(ticket => `
        <tr>
            <td>#${ticket.id || ticket.ticketNumber}</td>
            <td>
                <div class="customer-info">
                    <div class="customer-avatar">
                        <img src="${ticket.customer?.avatar || 'https://i.pravatar.cc/40?u=' + (ticket.customer?.email || 'default')}" alt="${ticket.customer?.name || 'Customer'}">
                    </div>
                    <div>
                        <div class="customer-name">${ticket.customer?.name || 'Unknown Customer'}</div>
                        <div class="customer-email">${ticket.customer?.email || 'No email'}</div>
                    </div>
                </div>
            </td>
            <td>${ticket.subject || 'No subject'}</td>
            <td><span class="category-badge ${ticket.category}">${getCategoryName(ticket.category)}</span></td>
            <td><span class="priority-badge ${ticket.priority}">${capitalizeFirst(ticket.priority)}</span></td>
            <td><span class="status-badge ${ticket.status}">${getStatusName(ticket.status)}</span></td>
            <td>${ticket.assignedTo || 'Unassigned'}</td>
            <td>${formatDate(ticket.createdAt || ticket.created)}</td>
            <td>
                <div class="actions">
                    <button class="btn-action" onclick="viewTicket('${ticket.id || ticket.ticketId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="assignTicket('${ticket.id || ticket.ticketId}')" title="Assign">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="btn-action" onclick="resolveTicket('${ticket.id || ticket.ticketId}')" title="Resolve">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Render FAQs dynamically
function renderFAQs() {
    const faqList = document.getElementById('faqList');
    if (!faqList) return;

    if (faqs.length === 0) {
        faqList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-question-circle" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                <p>No FAQs found</p>
                <small>Add your first FAQ to help customers</small>
            </div>
        `;
        return;
    }

    faqList.innerHTML = faqs.map(faq => `
        <div class="faq-item">
            <div class="faq-question">
                <h4>${faq.question || faq.title}</h4>
                <div class="faq-actions">
                    <button class="btn-action" onclick="editFAQ('${faq.id || faq.faqId}')" title="Edit FAQ">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action danger" onclick="deleteFAQ('${faq.id || faq.faqId}')" title="Delete FAQ">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="faq-answer">
                <p>${faq.answer || faq.content}</p>
                <div class="faq-meta">
                    <span class="faq-category">${faq.category || 'General'}</span>
                    <span class="faq-views">${faq.views || 0} views</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Render Knowledge Base articles dynamically
function renderKnowledgeBase() {
    const knowledgeGrid = document.getElementById('knowledgeGrid');
    if (!knowledgeGrid) return;

    if (articles.length === 0) {
        knowledgeGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                <p>No knowledge base articles found</p>
                <small>Create your first article to help agents</small>
            </div>
        `;
        return;
    }

    knowledgeGrid.innerHTML = articles.map(article => `
        <div class="knowledge-card">
            <div class="knowledge-icon">
                <i class="${article.icon || 'fas fa-file-alt'}"></i>
            </div>
            <h4>${article.title}</h4>
            <p>${article.description || (article.content ? article.content.substring(0, 100) + '...' : 'No description')}</p>
            <div class="knowledge-meta">
                <span class="knowledge-date">Updated: ${formatDate(article.updatedAt || article.updated)}</span>
                <span class="knowledge-views">${article.views || 0} views</span>
            </div>
            <div class="knowledge-actions">
                <button class="btn-action" onclick="viewArticle('${article.id || article.articleId}')" title="View Article">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="editArticle('${article.id || article.articleId}')" title="Edit Article">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action danger" onclick="deleteArticle('${article.id || article.articleId}')" title="Delete Article">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            return `${Math.floor(diff / 60000)}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            return `${Math.floor(diff / 3600000)}h ago`;
        } else if (diff < 604800000) { // Less than 1 week
            return `${Math.floor(diff / 86400000)}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    } catch (error) {
        return dateString;
    }
}

function getCategoryName(category) {
    const categories = {
        'order': 'Order Issues',
        'payment': 'Payment',
        'delivery': 'Delivery',
        'app': 'App Issues',
        'account': 'Account'
    };
    return categories[category] || category;
}

function getStatusName(status) {
    const statuses = {
        'open': 'Open',
        'in-progress': 'In Progress',
        'resolved': 'Resolved',
        'closed': 'Closed'
    };
    return statuses[status] || status;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterTickets() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const priorityFilter = document.getElementById('priorityFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    let filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.customer.name.toLowerCase().includes(searchTerm) ||
                            ticket.customer.email.toLowerCase().includes(searchTerm) ||
                            ticket.subject.toLowerCase().includes(searchTerm) ||
                            ticket.id.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || ticket.status === statusFilter;
        const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
        const matchesCategory = !categoryFilter || ticket.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    renderTicketsTable(filteredTickets);
}

function updateSupportStats() {
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const resolvedToday = tickets.filter(t => t.status === 'resolved').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in-progress').length;
    const totalTickets = tickets.length;

    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('h3').textContent = openTickets;
        statCards[1].querySelector('h3').textContent = resolvedToday;
        statCards[2].querySelector('h3').textContent = totalTickets > 0 ? '2.4h' : '0h'; // Average response time - would come from backend
        statCards[3].querySelector('h3').textContent = totalTickets > 0 ? '94%' : '0%'; // Satisfaction rate - would come from backend
    }
}

// Modal functions
function openNewTicketModal() {
    const modal = document.getElementById('newTicketModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeNewTicketModal() {
    const modal = document.getElementById('newTicketModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('newTicketForm').reset();
    }
}

function handleNewTicket(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newTicket = {
        id: 'TKT' + String(tickets.length + 1).padStart(3, '0'),
        customer: {
            name: 'Support Created',
            email: formData.get('customer'),
            avatar: 'https://i.pravatar.cc/40?img=' + (tickets.length + 24)
        },
        subject: formData.get('subject'),
        category: formData.get('category'),
        priority: formData.get('priority'),
        status: 'open',
        assignedTo: formData.get('assignee') || 'Unassigned',
        created: 'Just now',
        description: formData.get('description')
    };

    tickets.unshift(newTicket);
    renderTicketsTable();
    updateSupportStats();
    closeNewTicketModal();
    
    if (window.dashboardFunctions) {
        window.dashboardFunctions.showNotification('Support ticket created successfully!', 'success');
    }
}

// Ticket action functions
function viewTicket(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        alert(`Ticket Details:\n\nID: ${ticket.id}\nCustomer: ${ticket.customer.name}\nEmail: ${ticket.customer.email}\nSubject: ${ticket.subject}\nCategory: ${getCategoryName(ticket.category)}\nPriority: ${ticket.priority}\nStatus: ${getStatusName(ticket.status)}\nAssigned To: ${ticket.assignedTo}\nCreated: ${ticket.created}\n\nDescription:\n${ticket.description}`);
    }
}

function assignTicket(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        const assignees = ['John Support', 'Lisa Support', 'Tom Support'];
        const newAssignee = prompt('Assign to:', ticket.assignedTo);
        if (newAssignee && assignees.includes(newAssignee)) {
            ticket.assignedTo = newAssignee;
            renderTicketsTable();
            
            if (window.dashboardFunctions) {
                window.dashboardFunctions.showNotification(`Ticket ${ticketId} assigned to ${newAssignee}`, 'success');
            }
        }
    }
}

function resolveTicket(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket && confirm(`Mark ticket ${ticketId} as resolved?`)) {
        ticket.status = 'resolved';
        renderTicketsTable();
        updateSupportStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`Ticket ${ticketId} marked as resolved!`, 'success');
        }
    }
}

// FAQ functions
function openAddFAQModal() {
    alert('Add FAQ modal would open here.');
}

function editFAQ(faqId) {
    alert(`Edit FAQ ${faqId} modal would open here.`);
}

function deleteFAQ(faqId) {
    if (confirm(`Delete FAQ ${faqId}?`)) {
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification('FAQ deleted successfully!', 'success');
        }
    }
}

// Knowledge Base functions
function openAddArticleModal() {
    alert('Add article modal would open here.');
}

function viewArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (article) {
        alert(`Article: ${article.title}\n\nDescription: ${article.description}\n\nLast Updated: ${article.updated}\nViews: ${article.views}`);
    }
}

function editArticle(articleId) {
    alert(`Edit article ${articleId} modal would open here.`);
}

function deleteArticle(articleId) {
    if (confirm(`Delete article ${articleId}?`)) {
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification('Article deleted successfully!', 'success');
        }
    }
}

// ========================================
// LIVE CHAT SUPPORT FUNCTIONALITY
// ========================================

// Live Chat State Management
let liveChatState = {
    isConnected: false,
    websocket: null,
    activeSessions: [],
    currentSession: null,
    agentId: null,
    businessId: null
};

// WebSocket Manager instance
let wsManager = null;

// Initialize live chat functionality
async function initializeLiveChat() {
    if (__origInitializeLiveChat) {
        try { await __origInitializeLiveChat(); } catch (e) { console.error('Base live chat init failed', e); }
    }
    initAmazonConnectCCP();
    updateAgentBanner();
    console.log('🚀 Initializing live chat...');
    
    try {
        // Get current user info for agent identification
        const user = await getCurrentUser();
        liveChatState.agentId = user.username;
        liveChatState.businessId = '7ccf646c-9594-48d4-8f63-c366d89257e5';
        
        // Update agent info in UI
        document.getElementById('currentAgentName').textContent = user.username || 'Support Agent';
        
        // Initialize WebSocket connection
        if (!wsManager) {
            // Use the globally available WebSocketManager
            if (typeof WebSocketManager === 'undefined') {
                throw new Error('WebSocketManager not available. Make sure websocket-manager.js is loaded.');
            }
            
            wsManager = new WebSocketManager();
            
            // Setup live chat specific message handlers
            setupLiveChatHandlers();
        }
        
        // Connect to WebSocket
        const connected = await wsManager.connect(liveChatState.businessId);
        
        if (connected) {
            liveChatState.isConnected = true;
            updateConnectionStatus('Connected', 'online');
            
            // Load existing chat sessions
            await loadActiveChatSessions();
            
            console.log('✅ Live chat initialized successfully');
        } else {
            throw new Error('Failed to establish WebSocket connection');
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize live chat:', error);
        updateConnectionStatus('Failed to connect', 'error');
        showErrorMessage('Failed to initialize live chat: ' + error.message);
    }
}

// Setup live chat specific WebSocket handlers
function setupLiveChatHandlers() {
    if (!wsManager) return;
    
    // Listen for incoming chat messages
    wsManager.on('message', (message) => {
        handleIncomingChatMessage(message);
    });
    
    // Listen for new chat sessions
    wsManager.on('new_chat_session', (sessionData) => {
        handleNewChatSession(sessionData);
    });
    
    // Listen for chat session updates
    wsManager.on('chat_session_update', (sessionData) => {
        handleChatSessionUpdate(sessionData);
    });
    
    // Listen for connection events
    wsManager.on('connected', () => {
        console.log('📡 Live chat WebSocket connected');
        updateConnectionStatus('Connected', 'online');
    });
    
    wsManager.on('disconnected', () => {
        console.log('📡 Live chat WebSocket disconnected');
        updateConnectionStatus('Disconnected', 'offline');
        liveChatState.isConnected = false;
    });
    
    wsManager.on('error', (error) => {
        console.error('📡 Live chat WebSocket error:', error);
        updateConnectionStatus('Connection Error', 'error');
    });
}

// Handle incoming chat messages
function handleIncomingChatMessage(message) {
    console.log('💬 Incoming chat message:', message);
    
    // Handle different message types for live chat
    switch (message.type) {
        case 'chat_message':
            handleChatMessage(message);
            break;
        case 'new_chat_session':
            handleNewChatSession(message);
            break;
        case 'chat_session_update':
            handleChatSessionUpdate(message);
            break;
        case 'chat_session_ended':
            handleChatSessionEnded(message);
            break;
        case 'driver_status_update':
            handleDriverStatusUpdate(message);
            break;
        default:
            console.log('Unknown message type:', message.type);
    }
}

// Handle individual chat message
function handleChatMessage(message) {
    const { sessionId, senderId, content, timestamp, senderType } = message;
    
    // Find the session
    const session = liveChatState.activeSessions.find(s => s.id === sessionId);
    if (session) {
        // Add message to session
        if (!session.messages) session.messages = [];
        session.messages.push({
            id: Date.now().toString(),
            senderId,
            content,
            timestamp,
            senderType
        });
        
        // Update session last message and activity
        session.lastMessage = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        session.lastActivity = timestamp;
        
        // If message is from driver, mark as unread if not current session
        if (senderType === 'driver' && liveChatState.currentSession?.id !== sessionId) {
            session.hasUnread = true;
        }
        
        // Update UI if this is the current active session
        if (liveChatState.currentSession?.id === sessionId) {
            displayMessage({
                content,
                senderId,
                timestamp,
                senderType
            });
            
            // Scroll to bottom
            scrollChatToBottom();
            
            // Mark as read
            session.hasUnread = false;
        }
        
        // Update session in sidebar
        renderChatSessions();
        
        // Play notification sound if not current session and from driver
        if (liveChatState.currentSession?.id !== sessionId && senderType === 'driver') {
            playNotificationSound();
            
            // Update chat notification badge
            updateChatNotificationBadge();
        }
    } else {
        console.warn('Chat session not found:', sessionId);
    }
}

// Handle new chat session
function handleNewChatSession(sessionData) {
    console.log('🆕 New chat session:', sessionData);
    
    // Add to active sessions
    liveChatState.activeSessions.push(sessionData);
    
    // Update UI
    renderChatSessions();
    updateChatStats();
    
    // Show notification
    showBrowserNotification(
        'New Chat Request',
        `Driver ${sessionData.driverName} needs assistance`,
        'chat'
    );
    
    // Play notification sound
    playNotificationSound();
}

// Handle chat session updates
function handleChatSessionUpdate(sessionData) {
    console.log('📊 Chat session update:', sessionData);
    
    // Find and update session
    const sessionIndex = liveChatState.activeSessions.findIndex(s => s.id === sessionData.id);
    if (sessionIndex !== -1) {
        liveChatState.activeSessions[sessionIndex] = { ...liveChatState.activeSessions[sessionIndex], ...sessionData };
        
        // Re-render sessions
        renderChatSessions();
        updateChatStats();
        
        // Update current session if it's the active one
        if (liveChatState.currentSession?.id === sessionData.id) {
            liveChatState.currentSession = liveChatState.activeSessions[sessionIndex];
            updateActiveChatUI();
        }
    }
}

// Handle chat session ended
function handleChatSessionEnded(message) {
    console.log('🔚 Chat session ended:', message);
    
    const { sessionId } = message;
    
    // Remove from active sessions
    liveChatState.activeSessions = liveChatState.activeSessions.filter(s => s.id !== sessionId);
    
    // If this was the current session, clear it
    if (liveChatState.currentSession?.id === sessionId) {
        liveChatState.currentSession = null;
        document.getElementById('chatPlaceholder').style.display = 'block';
        document.getElementById('activeChat').style.display = 'none';
    }
    
    // Update UI
    renderChatSessions();
    updateChatStats();
    updateChatNotificationBadge();
}

// Handle driver status update
function handleDriverStatusUpdate(message) {
    console.log('👤 Driver status update:', message);
    
    const { driverId, status } = message;
    
    // Update status in all sessions for this driver
    liveChatState.activeSessions.forEach(session => {
        if (session.driverId === driverId) {
            session.driverStatus = status;
        }
    });
    
    // Update current session UI if applicable
    if (liveChatState.currentSession?.driverId === driverId) {
        updateActiveChatUI();
    }
    
    // Update sessions list
    renderChatSessions();
}

// Update chat notification badge
function updateChatNotificationBadge() {
    const chatNotification = document.getElementById('chatNotification');
    if (!chatNotification) return;
    
    // Count unread sessions
    const unreadCount = liveChatState.activeSessions.filter(s => s.hasUnread).length;
    
    if (unreadCount > 0) {
        chatNotification.textContent = unreadCount;
        chatNotification.style.display = 'flex';
    } else {
        chatNotification.style.display = 'none';
    }
}

// Load active chat sessions from backend
async function loadActiveChatSessions() {
    try {
        console.log('📥 Loading active chat sessions...');
        
        // In a real implementation, this would fetch from your backend
        // For now, we'll start with an empty array and let WebSocket populate it
        liveChatState.activeSessions = [];
        
        // Update UI
        renderChatSessions();
        updateChatStats();
        
        console.log('✅ Chat sessions loaded');
    } catch (error) {
        console.error('Error loading chat sessions:', error);
        showErrorMessage('Failed to load chat sessions');
    }
}

// Render chat sessions in sidebar
function renderChatSessions() {
    const sessionsList = document.getElementById('chatSessionsList');
    if (!sessionsList) return;
    
    if (liveChatState.activeSessions.length === 0) {
        sessionsList.innerHTML = `
            <div class="no-sessions">
                <i class="fas fa-comments"></i>
                <p>No active chat sessions</p>
                <small>Waiting for incoming driver requests...</small>
            </div>
        `;
        return;
    }
    
    sessionsList.innerHTML = liveChatState.activeSessions.map(session => `
        <div class="chat-session-item ${liveChatState.currentSession?.id === session.id ? 'active' : ''}" 
             onclick="selectChatSession('${session.id}')">
            <div class="session-avatar">
                <img src="${session.driverAvatar || 'https://i.pravatar.cc/40?u=' + session.driverId}" 
                     alt="${session.driverName}">
                ${session.hasUnread ? '<span class="unread-indicator"></span>' : ''}
            </div>
            <div class="session-info">
                <div class="session-name">${session.driverName}</div>
                <div class="session-preview">${session.lastMessage || 'No messages yet'}</div>
                <div class="session-time">${formatTime(session.lastActivity)}</div>
            </div>
            <div class="session-status">
                <span class="status-dot ${session.status}"></span>
            </div>
        </div>
    `).join('');
}

// Select and activate a chat session
function selectChatSession(sessionId) {
    const session = liveChatState.activeSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    console.log('📱 Selecting chat session:', sessionId);
    
    // Set as current session
    liveChatState.currentSession = session;
    
    // Mark as read
    session.hasUnread = false;
    
    // Show chat interface
    document.getElementById('chatPlaceholder').style.display = 'none';
    document.getElementById('activeChat').style.display = 'block';
    
    // Update UI
    updateActiveChatUI();
    loadChatMessages(sessionId);
    renderChatSessions(); // Re-render to update active state
    
    // Focus message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.focus();
}

// Update active chat UI with session info
function updateActiveChatUI() {
    if (!liveChatState.currentSession) return;
    
    const session = liveChatState.currentSession;
    
    // Update driver info
    document.getElementById('driverName').textContent = session.driverName || 'Unknown Driver';
    document.getElementById('driverPhone').textContent = session.driverPhone || 'No phone';
    document.getElementById('driverStatus').textContent = session.driverStatus || 'Unknown';
    
    const driverAvatar = document.getElementById('driverAvatar');
    if (driverAvatar) {
        driverAvatar.src = session.driverAvatar || 'https://i.pravatar.cc/40?u=' + session.driverId;
    }
    
    // Update status classes
    const statusElement = document.getElementById('driverStatus');
    if (statusElement) {
        statusElement.className = `online-status ${session.driverStatus?.toLowerCase() || 'offline'}`;
    }
}

// Load and display chat messages for a session
async function loadChatMessages(sessionId) {
    try {
        console.log('💬 Loading messages for session:', sessionId);
        
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const session = liveChatState.activeSessions.find(s => s.id === sessionId);
        if (!session || !session.messages) {
            chatMessages.innerHTML = `
                <div class="chat-welcome">
                    <p>Chat session started. Say hello to the driver!</p>
                </div>
            `;
            return;
        }
        
        // Render messages
        chatMessages.innerHTML = session.messages.map(message => 
            createMessageHTML(message)
        ).join('');
        
        // Scroll to bottom
        scrollChatToBottom();
        
    } catch (error) {
        console.error('Error loading chat messages:', error);
        showErrorMessage('Failed to load chat messages');
    }
}

// Create HTML for a chat message
function createMessageHTML(message) {
    const isAgent = message.senderType === 'support' || message.senderType === 'agent';
    const messageClass = isAgent ? 'message-sent' : 'message-received';
    
    return `
        <div class="chat-message ${messageClass}">
            <div class="message-content">
                <p>${escapeHtml(message.content)}</p>
                <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
        </div>
    `;
}

// Send a chat message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !liveChatState.currentSession || !liveChatState.isConnected) return;
    
    const content = messageInput.value.trim();
    if (!content) return;
    
    try {
        console.log('📤 Sending message:', content);
        
        // Create message object
        const message = {
            type: 'chat_message',
            sessionId: liveChatState.currentSession.id,
            senderId: liveChatState.agentId,
            senderType: 'support',
            content: content,
            timestamp: new Date().toISOString()
        };
        
        // Send via WebSocket
        if (wsManager && wsManager.ws && wsManager.ws.readyState === WebSocket.OPEN) {
            wsManager.ws.send(JSON.stringify(message));
            
            // Add to local messages immediately for responsive UI
            if (!liveChatState.currentSession.messages) {
                liveChatState.currentSession.messages = [];
            }
            
            liveChatState.currentSession.messages.push({
                id: Date.now().toString(),
                senderId: liveChatState.agentId,
                senderType: 'support',
                content: content,
                timestamp: new Date().toISOString()
            });
            
            // Display message
            displayMessage({
                content: content,
                senderId: liveChatState.agentId,
                senderType: 'support',
                timestamp: new Date().toISOString()
            });
            
            // Clear input
            messageInput.value = '';
            
            // Update session preview
            liveChatState.currentSession.lastMessage = content;
            liveChatState.currentSession.lastActivity = new Date().toISOString();
            
            // Update sidebar
            renderChatSessions();
            
            // Scroll to bottom
            scrollChatToBottom();
            
        } else {
            throw new Error('WebSocket not connected');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showErrorMessage('Failed to send message. Please check your connection.');
    }
}

// Display a new message in the chat
function displayMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageHTML = createMessageHTML(message);
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
}

// Send a quick response
function sendQuickResponse(message) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = message;
        sendMessage();
    }
}

// Handle message input key events
function handleMessageKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Update connection status in UI
function updateConnectionStatus(status, type) {
    const statusIndicator = document.getElementById('connectionStatus');
    if (!statusIndicator) return;
    
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');
    
    if (statusDot) {
        statusDot.className = `status-dot ${type}`;
    }
    
    if (statusText) {
        statusText.textContent = status;
    }
}

// Update chat statistics
function updateChatStats() {
    const activeChatCount = document.getElementById('activeChatCount');
    const queueCount = document.getElementById('queueCount');
    
    if (activeChatCount) {
        activeChatCount.textContent = liveChatState.activeSessions.length;
    }
    
    if (queueCount) {
        // For now, assume queue is 0 - in real implementation, this would come from backend
        queueCount.textContent = '0';
    }
}

// Refresh chat sessions
async function refreshChatSessions() {
    console.log('🔄 Refreshing chat sessions...');
    
    // Add loading indicator
    const refreshBtn = document.querySelector('.btn-refresh i');
    if (refreshBtn) {
        refreshBtn.classList.add('fa-spin');
    }
    
    try {
        await loadActiveChatSessions();
    } catch (error) {
        console.error('Error refreshing sessions:', error);
        showErrorMessage('Failed to refresh chat sessions');
    } finally {
        // Remove loading indicator
        if (refreshBtn) {
            refreshBtn.classList.remove('fa-spin');
        }
    }
}

// Test WebSocket connection
async function testConnection() {
    console.log('🧪 Testing WebSocket connection and adding demo session...');
    
    try {
        // First try original connection test
        if (!liveChatState.isConnected) {
            await initializeLiveChat();
        }
        
        // Add a demo session for testing
        simulateIncomingChatSession();
        
        showSuccessMessage('Connection test successful! Demo chat session added.');
        
    } catch (error) {
        console.error('Connection test failed:', error);
        showErrorMessage('Connection test failed: ' + error.message);
        
        // Still add demo session for UI testing
        simulateIncomingChatSession();
        showSuccessMessage('Demo session added for UI testing (WebSocket connection failed)');
    }
}

// Utility functions for live chat
function scrollChatToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this week, show day and time
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        padding: 12px 20px;
        border-radius: 4px;
        border: 1px solid #c3e6cb;
        z-index: 1000;
        max-width: 400px;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>
    `;
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 3000);
}

function playNotificationSound() {
    try {
        // Create audio element for notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYZBSuJ2fP...'); // truncated for brevity
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

function showBrowserNotification(title, message, type = 'info') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/frontend/assets/images/logo-small.png'
        });
    }
}

// Demo/Test Functions - Remove in production
function simulateIncomingChatSession() {
    const demoSession = {
        id: 'demo-session-' + Date.now(),
        driverId: 'driver-' + Math.floor(Math.random() * 1000),
        driverName: 'Ahmed Al-Rashid',
        driverPhone: '+966 50 123 4567',
        driverAvatar: 'https://i.pravatar.cc/40?u=ahmed',
        driverStatus: 'online',
        status: 'active',
        lastMessage: 'Hello, I need help with my delivery',
        lastActivity: new Date().toISOString(),
        hasUnread: true,
        messages: [
            {
                id: 'msg-1',
                senderId: 'driver-' + Math.floor(Math.random() * 1000),
                senderType: 'driver',
                content: 'Hello, I need help with my delivery',
                timestamp: new Date().toISOString()
            }
        ]
    };
    
    // Add to active sessions
    liveChatState.activeSessions.push(demoSession);
    
    // Update UI
    renderChatSessions();
    updateChatStats();
    updateChatNotificationBadge();
    
    // Show notification
    showBrowserNotification(
        'New Chat Request',
        `Driver ${demoSession.driverName} needs assistance`,
        'chat'
    );
    
    playNotificationSound();
    
    console.log('🎭 Demo chat session added:', demoSession);
}

function simulateIncomingMessage() {
    if (liveChatState.activeSessions.length === 0) {
        alert('No active sessions. Create a demo session first by clicking "Test Connection".');
        return;
    }
    
    const session = liveChatState.activeSessions[0];
    const demoMessage = {
        id: 'msg-' + Date.now(),
        senderId: session.driverId,
        senderType: 'driver',
        content: 'Can you help me find the customer address? The GPS is not working properly.',
        timestamp: new Date().toISOString()
    };
    
    // Add message to session
    if (!session.messages) session.messages = [];
    session.messages.push(demoMessage);
    
    // Update session
    session.lastMessage = demoMessage.content.substring(0, 50) + '...';
    session.lastActivity = demoMessage.timestamp;
    session.hasUnread = true;
    
    // Update UI if this is current session
    if (liveChatState.currentSession?.id === session.id) {
        displayMessage(demoMessage);
        scrollChatToBottom();
        session.hasUnread = false;
    }
    
    // Update UI
    renderChatSessions();
    updateChatNotificationBadge();
    playNotificationSound();
    
    console.log('🎭 Demo message added:', demoMessage);
}

// Additional chat functions that might be called from UI
function viewDriverProfile() {
    if (!liveChatState.currentSession) return;
    
    console.log('👤 Viewing driver profile:', liveChatState.currentSession.driverId);
    // In a real implementation, this would open a driver profile modal
    alert('Driver profile feature not implemented yet');
}

function escalateChat() {
    if (!liveChatState.currentSession) return;
    
    console.log('⚠️ Escalating chat:', liveChatState.currentSession.id);
    // In a real implementation, this would escalate to a supervisor
    alert('Chat escalation feature not implemented yet');
}

function endChat() {
    if (!liveChatState.currentSession) return;
    
    const confirmed = confirm('Are you sure you want to end this chat session?');
    if (!confirmed) return;
    
    console.log('📞 Ending chat:', liveChatState.currentSession.id);
    
    try {
        // Send end chat message via WebSocket
        if (wsManager && wsManager.ws && wsManager.ws.readyState === WebSocket.OPEN) {
            wsManager.ws.send(JSON.stringify({
                type: 'end_chat_session',
                sessionId: liveChatState.currentSession.id,
                agentId: liveChatState.agentId,
                timestamp: new Date().toISOString()
            }));
        }
        
        // Remove from active sessions
        liveChatState.activeSessions = liveChatState.activeSessions.filter(
            s => s.id !== liveChatState.currentSession.id
        );
        
        // Clear current session
        liveChatState.currentSession = null;
        
        // Update UI
        document.getElementById('chatPlaceholder').style.display = 'block';
        document.getElementById('activeChat').style.display = 'none';
        
        renderChatSessions();
        updateChatStats();
        
        showSuccessMessage('Chat session ended successfully');
        
    } catch (error) {
        console.error('Error ending chat:', error);
        showErrorMessage('Failed to end chat session');
    }
}

function attachFile() {
    console.log('📎 File attachment feature not implemented yet');
    alert('File attachment feature coming soon!');
}

function toggleEmojiPicker() {
    console.log('😀 Emoji picker feature not implemented yet');
    alert('Emoji picker feature coming soon!');
}

// Request notification permission on page load
if (Notification.permission === 'default') {
    Notification.requestPermission();
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('newTicketModal');
    if (e.target === modal) {
        closeNewTicketModal();
    }
});

// Export functions
window.supportManager = {
    switchTab,
    openNewTicketModal,
    closeNewTicketModal,
    viewTicket,
    assignTicket,
    resolveTicket,
    editFAQ,
    deleteFAQ,
    viewArticle,
    editArticle,
    deleteArticle,
    // Live Chat Functions
    initializeLiveChat,
    refreshChatSessions,
    testConnection,
    sendMessage,
    sendQuickResponse,
    handleMessageKeyDown,
    endChat,
    escalateChat,
    viewDriverProfile,
    attachFile,
    toggleEmojiPicker
};

// Additional UI functions for support center
function openNewTicketModal() {
    console.log('📝 Opening new ticket modal...');
    // In a real implementation, this would open a modal for creating tickets
    alert('New ticket creation feature not implemented yet');
}

function openAddFAQModal() {
    console.log('❓ Opening add FAQ modal...');
    // In a real implementation, this would open a modal for adding FAQs
    alert('Add FAQ feature not implemented yet');
}

function openAddArticleModal() {
    console.log('📚 Opening add article modal...');
    // In a real implementation, this would open a modal for adding knowledge base articles
    alert('Add knowledge base article feature not implemented yet');
}

function viewArticle(articleId) {
    console.log('👁️ Viewing article:', articleId);
    // In a real implementation, this would open an article viewer
    alert(`View article ${articleId} feature not implemented yet`);
}

function editArticle(articleId) {
    console.log('✏️ Editing article:', articleId);
    // In a real implementation, this would open an article editor
    alert(`Edit article ${articleId} feature not implemented yet`);
}

function deleteArticle(articleId) {
    console.log('🗑️ Deleting article:', articleId);
    // In a real implementation, this would delete the article
    const confirmed = confirm(`Are you sure you want to delete article ${articleId}?`);
    if (confirmed) {
        alert(`Delete article ${articleId} feature not implemented yet`);
    }
}

// Make functions globally accessible
window.openNewTicketModal = openNewTicketModal;
window.openAddFAQModal = openAddFAQModal;
window.openAddArticleModal = openAddArticleModal;
window.viewArticle = viewArticle;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;

// Make live chat functions globally accessible
window.switchTab = switchTab;
window.refreshChatSessions = refreshChatSessions;
window.testConnection = testConnection;
window.viewDriverProfile = viewDriverProfile;
window.escalateChat = escalateChat;
window.endChat = endChat;
window.sendQuickResponse = sendQuickResponse;
window.sendMessage = sendMessage;
window.handleMessageKeyDown = handleMessageKeyDown;
window.attachFile = attachFile;
window.toggleEmojiPicker = toggleEmojiPicker;
window.selectChatSession = selectChatSession;
window.simulateIncomingChatSession = simulateIncomingChatSession;
window.simulateIncomingMessage = simulateIncomingMessage;

// ========================================
// AMAZON CONNECT (CCP) INTEGRATION + AGENT STATUS
// ========================================
let ccpInitialized = false;
let connectAgentState = {
  ccpReady: false,
  agentPresent: false,
  agentStatus: null,
  lastError: null,
  groups: [],
};

function extractCognitoGroups() {
  try {
    if (window.Auth && typeof window.Auth.getIdToken === 'function') {
      const token = window.Auth.getIdToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const groups = payload['cognito:groups'] || [];
        connectAgentState.groups = groups;
        return groups;
      }
    }
  } catch (e) {
    console.warn('Unable to extract Cognito groups', e);
  }
  return [];
}

function userHasSupportPrivileges() {
  const groups = connectAgentState.groups.length
    ? connectAgentState.groups
    : extractCognitoGroups();
  return (
    groups.includes('support') ||
    groups.includes('admin') ||
    groups.includes('superadmin')
  );
}

function initAmazonConnectCCP() {
  if (ccpInitialized) return;
  if (!userHasSupportPrivileges()) {
    console.log('🔐 User lacks support privileges; skipping CCP init');
    return;
  }
  const ccpContainer = document.getElementById('ccpContainer');
  if (!ccpContainer) {
    console.warn('CCP container not found (id="ccpContainer")');
    return;
  }
  if (typeof connect === 'undefined' || !connect?.core?.initCCP) {
    console.warn(
      'Amazon Connect Streams API not loaded. Include connect-streams.js before this script.'
    );
    return;
  }
  try {
    console.log('🟡 Initializing Amazon Connect CCP...');
    connect.core.initCCP(ccpContainer, {
      ccpUrl:
        window.CONNECT_CCP_URL || window.WIZZCENTRAL_CONFIG?.CONNECT_CCP_URL || '',
      loginPopup: true,
      loginPopupAutoClose: true,
      softphone: { allowFramedSoftphone: true },
      region: window.CONNECT_REGION || 'us-east-1',
    });
    ccpInitialized = true;
    connect.core.onReady(() => {
      connectAgentState.ccpReady = true;
      updateAgentBanner();
    });
    connect.agent((agent) => {
      connectAgentState.agentPresent = true;
      connectAgentState.agentStatus = agent.getStatus()?.name || 'Unknown';
      updateAgentBanner();
      agent.onRefresh((a) => {
        connectAgentState.agentStatus = a.getStatus()?.name || 'Unknown';
        updateAgentBanner();
      });
    });
    connect.contact((contact) => {
      console.log(
        '📞 New Connect contact:',
        contact.getType(),
        contact.getContactId()
      );
    });
  } catch (e) {
    connectAgentState.lastError = e.message || String(e);
    console.error('❌ CCP init error:', e);
    updateAgentBanner();
  }
  updateAgentBanner();
}

function updateAgentBanner() {
  const banner = document.getElementById('connectAgentBanner');
  if (!banner) return;
  let html = '';
  if (connectAgentState.lastError) {
    html = `<div class="status-badge error">Amazon Connect Error: ${connectAgentState.lastError}</div>`;
  } else if (!connectAgentState.ccpReady) {
    html = '<div class="status-badge loading">Amazon Connect: Initializing...</div>';
  } else if (connectAgentState.ccpReady && !connectAgentState.agentPresent) {
    html = '<div class="status-badge warn">Agent: Not logged in (use CCP frame)</div>';
  } else {
    html = `<div class="status-badge success">Agent Status: ${connectAgentState.agentStatus}</div>`;
  }
  banner.innerHTML = html;
}

// Wrap existing initializeLiveChat if present
const __origInitializeLiveChat = typeof initializeLiveChat === 'function'
  ? initializeLiveChat
  : null;
async function initializeLiveChat() {
  if (__origInitializeLiveChat) {
    try {
      await __origInitializeLiveChat();
    } catch (e) {
      console.error('Base live chat init failed', e);
    }
  }
  initAmazonConnectCCP();
  updateAgentBanner();
}
window.initializeLiveChat = initializeLiveChat;