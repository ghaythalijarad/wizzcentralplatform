// Support Management JavaScript

// Sample support data
let tickets = [
    {
        id: 'TKT001',
        customer: {
            name: 'Sarah Wilson',
            email: 'sarah@email.com',
            avatar: 'https://i.pravatar.cc/40?img=21'
        },
        subject: 'Order not delivered',
        category: 'order',
        priority: 'high',
        status: 'open',
        assignedTo: 'John Support',
        created: '2 hours ago',
        description: 'My order #ORD-123 was supposed to be delivered 3 hours ago but I still haven\'t received it.'
    },
    {
        id: 'TKT002',
        customer: {
            name: 'Mike Johnson',
            email: 'mike@email.com',
            avatar: 'https://i.pravatar.cc/40?img=22'
        },
        subject: 'Payment failed',
        category: 'payment',
        priority: 'medium',
        status: 'in-progress',
        assignedTo: 'Lisa Support',
        created: '4 hours ago',
        description: 'My payment was declined but I was still charged. Please help me resolve this issue.'
    },
    {
        id: 'TKT003',
        customer: {
            name: 'Emma Davis',
            email: 'emma@email.com',
            avatar: 'https://i.pravatar.cc/40?img=23'
        },
        subject: 'App keeps crashing',
        category: 'app',
        priority: 'low',
        status: 'resolved',
        assignedTo: 'Tom Support',
        created: '1 day ago',
        description: 'The app crashes every time I try to add items to my cart.'
    }
];

let faqs = [
    {
        id: 1,
        question: 'How do I track my order?',
        answer: 'You can track your order in real-time by going to the "My Orders" section in the app. You\'ll see the current status and estimated delivery time.',
        category: 'Order Tracking',
        views: 1234
    },
    {
        id: 2,
        question: 'What payment methods are accepted?',
        answer: 'We accept all major credit cards, debit cards, PayPal, Apple Pay, Google Pay, and cash on delivery in select areas.',
        category: 'Payment',
        views: 987
    },
    {
        id: 3,
        question: 'How do I cancel my order?',
        answer: 'You can cancel your order within 5 minutes of placing it. Go to "My Orders" and tap the "Cancel" button. After preparation starts, cancellation may not be possible.',
        category: 'Order Management',
        views: 756
    }
];

let articles = [
    {
        id: 1,
        title: 'Driver Guidelines',
        description: 'Complete guide for delivery drivers including safety protocols, delivery procedures, and app usage.',
        icon: 'fas fa-motorcycle',
        updated: 'Jul 20, 2025',
        views: 2456
    },
    {
        id: 2,
        title: 'Merchant Onboarding',
        description: 'Step-by-step guide for new merchants to set up their restaurant profile and start receiving orders.',
        icon: 'fas fa-store',
        updated: 'Jul 18, 2025',
        views: 1843
    },
    {
        id: 3,
        title: 'Customer Support Best Practices',
        description: 'Guidelines for support agents on handling customer inquiries, escalation procedures, and communication standards.',
        icon: 'fas fa-users',
        updated: 'Jul 15, 2025',
        views: 1234
    }
];

// Initialize support page
document.addEventListener('DOMContentLoaded', function() {
    initializeSupportPage();
    setupEventListeners();
});

function initializeSupportPage() {
    renderTicketsTable();
    updateSupportStats();
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
    
    // Update pagination info based on tab
    const paginationInfo = document.querySelector('.pagination-info');
    if (paginationInfo) {
        switch(tabName) {
            case 'tickets':
                paginationInfo.textContent = 'Showing 1-10 of 47 tickets';
                break;
            case 'faq':
                paginationInfo.textContent = 'Showing 1-10 of 25 FAQs';
                break;
            case 'knowledge':
                paginationInfo.textContent = 'Showing 1-6 of 18 articles';
                break;
        }
    }
}

function renderTicketsTable(ticketsList = tickets) {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;

    tbody.innerHTML = ticketsList.map(ticket => `
        <tr>
            <td>#${ticket.id}</td>
            <td>
                <div class="customer-info">
                    <div class="customer-avatar">
                        <img src="${ticket.customer.avatar}" alt="${ticket.customer.name}">
                    </div>
                    <div>
                        <div class="customer-name">${ticket.customer.name}</div>
                        <div class="customer-email">${ticket.customer.email}</div>
                    </div>
                </div>
            </td>
            <td>${ticket.subject}</td>
            <td><span class="category-badge ${ticket.category}">${getCategoryName(ticket.category)}</span></td>
            <td><span class="priority-badge ${ticket.priority}">${capitalizeFirst(ticket.priority)}</span></td>
            <td><span class="status-badge ${ticket.status}">${getStatusName(ticket.status)}</span></td>
            <td>${ticket.assignedTo}</td>
            <td>${ticket.created}</td>
            <td>
                <div class="actions">
                    <button class="btn-action" onclick="viewTicket('${ticket.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="assignTicket('${ticket.id}')" title="Assign">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="btn-action" onclick="resolveTicket('${ticket.id}')" title="Resolve">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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

    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('h3').textContent = openTickets;
        statCards[1].querySelector('h3').textContent = resolvedToday;
        // Other stats would typically come from backend analytics
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
    deleteArticle
};
