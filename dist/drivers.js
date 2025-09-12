// Drivers Management JavaScript with Direct Authentication

// Use centralized AWS utilities
const DRIVERS_TABLE = 'WhizzDrivers_dev'; // Real drivers table

// Ensure user is authenticated before loading drivers data
async function ensureAuthenticated() {
    try {
        if (!window.AuthService) {
            throw new Error('AuthService not available');
        }
        
        // Check if user is already authenticated
        if (AuthService.isAuthenticated()) {
            console.log('User is already authenticated');
            return true;
        }
        
        // Redirect to login if not authenticated using centralized helper
        console.log('User not authenticated, redirecting to login...');
        if (window.Auth && typeof Auth.redirectToLogin === 'function') {
            Auth.redirectToLogin('drivers:auth-required');
        } else {
            // Safe fallback if Auth not loaded yet
            const path = (window.location.pathname || '');
            const loginPath = path.startsWith('/frontend/') ? '/frontend/index.html' : '/index.html';
            window.location.href = loginPath;
        }
        return false;
        
    } catch (error) {
        console.error('Authentication check failed:', error);
        if (window.Auth && typeof Auth.redirectToLogin === 'function') {
            Auth.redirectToLogin('drivers:auth-check-failed');
        } else {
            const path = (window.location.pathname || '');
            const loginPath = path.startsWith('/frontend/') ? '/frontend/index.html' : '/index.html';
            window.location.href = loginPath;
        }
        return false;
    }
}

// Load drivers data from DynamoDB - Real integration with WhizzDrivers_dev
async function loadDriversData() {
    try {
        console.log('Loading drivers data from WhizzDrivers_dev table...');

        // Ensure user is authenticated
        if (!(await ensureAuthenticated())) {
            return;
        }

        // Initialize DynamoDB using centralized AWSUtils (handles tokens/config)
        const dynamoDB = await AWSUtils.getDynamoDBClient();
        if (!dynamoDB) {
            throw new Error('AWS is not initialized (missing idToken). Please login again.');
        }
        
        const params = { 
            TableName: DRIVERS_TABLE,
            Limit: 100
        };
        
        console.log('Scanning drivers table with params:', params);
        const result = await dynamoDB.scan(params).promise();
        
        console.log('DynamoDB scan result:', result);
        const items = (result && Array.isArray(result.Items)) ? result.Items : [];
        
        console.log(`Found ${items.length} drivers in table`);
        return processDriversItems(items);
        
    } catch (error) {
        console.error('Error loading drivers data:', error);
        drivers = [];
        const tbody = document.getElementById('driversTableBody');
        if (tbody) {
            const msg = (error && (error.message || error.code)) ? String(error.message || error.code) : 'Unknown error';
            const isAuth = /not authenticated|credential|Missing credentials|expired|token/i.test(msg);
            const isAccess = /AccessDenied|not authorized|permission|denied/i.test(msg);
            if (isAuth) {
                const loginClick = "(function(){ if(window.Auth && typeof Auth.redirectToLogin==='function'){ Auth.redirectToLogin('drivers:login-required'); } else { var p=window.location.pathname||''; var lp=p.startsWith('/frontend/')?'/frontend/index.html':'/index.html'; window.location.href=lp; } })(); return false;";
                tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem; color: #e74c3c;">
                    Authentication required. <a href="#" onclick="${loginClick}">Please login</a>
                </td></tr>`;
            } else if (isAccess) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem; color: #e74c3c;">
                    Access denied when reading DynamoDB. Ensure your Cognito Identity Pool roles allow <code>Scan</code> on <strong>${DRIVERS_TABLE}</strong>.<br>
                    Tip: add <code>dynamodb:Scan</code>, <code>dynamodb:UpdateItem</code>, <code>dynamodb:PutItem</code> for the table ARN.
                </td></tr>`;
            } else {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem; color: #e74c3c;">
                    Failed to load drivers data: ${msg}
                </td></tr>`;
            }
        }
    }
}

// Defensive: purge any legacy/mock rows injected by old builds
function purgeMockRows(forceSpinner = false) {
    try {
        const tbody = document.getElementById('driversTableBody');
        if (!tbody) return;
        const text = (tbody.textContent || '').trim();
        const looksMock = /Carlos Rodriguez|Ahmed Hassan|Maria Santos|#DRV00\d|Downtown Area|North District|South Area|\$89\.50|\$125\.75|\$45\.25/.test(text);
        if (looksMock || forceSpinner) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">
                <i class="fas fa-spinner fa-spin"></i> Loading drivers from database...
            </td></tr>`;
        }
    } catch (_) {}
}

// Observe table body for unexpected legacy injections and purge them
(function setupMockGuard(){
    try {
        const tbody = document.getElementById('driversTableBody');
        if (!tbody || typeof MutationObserver === 'undefined') return;
        const observer = new MutationObserver(() => purgeMockRows(false));
        observer.observe(tbody, { childList: true, subtree: true, characterData: true });
        // Timed sweeps to catch late injections
        setTimeout(() => purgeMockRows(false), 0);
        setTimeout(() => purgeMockRows(false), 500);
        setTimeout(() => purgeMockRows(false), 1500);
    } catch (_) {}
})();

// Create a new driver record in DynamoDB (real integration)
async function createDriverInDB(driverInput) {
    // Ensure authenticated and AWS initialized
    const dynamoDB = await AWSUtils.getDynamoDBClient();
    if (!dynamoDB) {
        throw new Error('AWS is not initialized (missing idToken). Please login again.');
    }

    const nowSec = Math.floor(Date.now() / 1000);

    // Normalize fields expected by backend/table
    const item = {
        driverId: driverInput.id,
        id: driverInput.id, // keep both keys for schema compatibility
        name: driverInput.name,
        fullName: driverInput.name,
        email: driverInput.email,
        phoneNumber: driverInput.rawPhone || driverInput.phone,
        status: 'PENDING_REVIEW',
        registrationStatus: 'PENDING_REVIEW',
        vehicleType: driverInput.vehicleType || 'motorcycle',
        licenseNumber: driverInput.licenseNumber || driverInput.license || null,
        emergencyContact: driverInput.emergencyContact || null,
        ordersCompleted: 0,
        rating: 0,
        earnings: 0,
        createdAt: nowSec,
        updatedAt: nowSec
    };

    const params = {
        TableName: DRIVERS_TABLE,
        Item: item,
        // Prevent accidental overwrite if driverId already exists
        ConditionExpression: 'attribute_not_exists(driverId)'
    };

    console.log('Putting new driver item:', params);
    await dynamoDB.put(params).promise();
    return item;
}

function processDriversItems(items) {
    if (!Array.isArray(items)) items = [];
    drivers = items.map(item => ({
        id: item.driverId || item.id || `driver-${Date.now()}-${Math.random()}`,
        name: item.name || item.fullName || 'Unknown Driver',
        email: item.email || 'N/A',
        phone: formatPhoneNumber(item.phoneNumber || item.phone),
        status: mapDriverStatus(item.registrationStatus || item.status),
        location: item.city || item.location || 'Unknown Location',
        ordersCompleted: item.ordersCompleted || 0,
        rating: typeof item.rating === 'number' ? item.rating : 4.5,
        earnings: typeof item.earnings === 'number' ? item.earnings : 0,
        vehicleType: mapVehicleType(item.vehicleType),
        licenseNumber: item.licenseNumber || 'N/A',
        nationalId: item.nationalId || 'N/A',
        createdAt: item.createdAt ? formatDate(item.createdAt) : 'N/A',
        updatedAt: item.updatedAt ? formatDate(item.updatedAt) : 'N/A',
        avatar: generateDriverAvatar(item.name || item.fullName),
        documents: {
            drivingLicense: item.drivingLicense || null,
            nationalId: item.nationalId || null,
            vehicleRegistration: item.vehicleRegistration || null,
            nonCriminalRecord: item.nonCriminalRecord || null
        },
        fullData: item
    }));

    console.log(`✅ Successfully loaded ${drivers.length} drivers from WhizzDrivers_dev!`);
    initializeDriversPage();
}

// Helper function to map driver status from database to display format
function mapDriverStatus(dbStatus) {
    const statusMap = {
        'PENDING_REVIEW': 'pending',
        'PENDING': 'pending', 
        'APPROVED': 'online',
        'ACTIVE': 'online',
        'REJECTED': 'offline',
        'SUSPENDED': 'offline',
        'INACTIVE': 'offline',
        // Handle lowercase versions too
        'pending_review': 'pending',
        'pending': 'pending',
        'approved': 'online', 
        'active': 'online',
        'rejected': 'offline',
        'suspended': 'offline',
        'inactive': 'offline'
    };
    return statusMap[dbStatus] || 'pending';
}

// Helper function to map vehicle type to display format
function mapVehicleType(dbVehicleType) {
    if (!dbVehicleType) return 'unknown';

    const vehicleMap = {
        'دراجة نارية': 'motorcycle',
        'سيارة': 'car',
        'دراجة هوائية': 'bicycle',
        'motorcycle': 'motorcycle',
        'car': 'car',
        'bicycle': 'bicycle'
    };
    return vehicleMap[dbVehicleType] || 'motorcycle';
}

// Helper function to format dates
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
        // Handle both timestamp and ISO string formats
        const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
        if (isNaN(date.getTime())) {
            return timestamp.toString(); // Return original if can't parse
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.warn(`Could not parse date: ${timestamp}`);
        return timestamp.toString();
    }
}

// Generate avatar URL for driver
function generateDriverAvatar(name) {
    if (!name) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=center';
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=40&background=4f46e5&color=fff`;
}

// Helper function to format phone numbers
function formatPhoneNumber(phone) {
    if (!phone || phone === 'None' || phone === 'null' || phone === 'undefined') {
        return 'N/A';
    }
    
    // Handle string phone numbers
    const phoneStr = phone.toString().trim();
    
    // If it's already formatted with +964, return as is
    if (phoneStr.startsWith('+964')) {
        return phoneStr;
    }
    
    // If it starts with 964, add the +
    if (phoneStr.startsWith('964')) {
        return '+' + phoneStr;
    }
    
    // If it starts with 07, convert to +964 format
    if (phoneStr.startsWith('07')) {
        return '+964' + phoneStr.substring(1);
    }
    
    // If it's just digits and looks like Iraqi number, try to format
    if (phoneStr.match(/^\d{10}$/) && phoneStr.startsWith('7')) {
        return '+964' + phoneStr;
    }
    
    // Return original if we can't format it
    return phoneStr || 'N/A';
}

// Driver management functions
let drivers = []; // Will be populated from DynamoDB

// Lightweight notification helper
function notify(message, type = 'info') {
    if (window.dashboardFunctions && typeof window.dashboardFunctions.showNotification === 'function') {
        window.dashboardFunctions.showNotification(message, type);
        return;
    }
    // Fallback toast
    const toast = document.createElement('div');
    toast.style.cssText = `position: fixed; right: 20px; bottom: 20px; background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#dbeafe'}; color: #111; border: 1px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'}; border-radius: 8px; padding: 10px 14px; z-index: 10000; box-shadow: 0 4px 14px rgba(0,0,0,.15); font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; }, 2500);
    setTimeout(() => { toast.remove(); }, 3000);
}

function initializeDriversPage() {
    renderDriversTable();
    updateDriverStats();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterDrivers);
    }

    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const ratingFilter = document.getElementById('ratingFilter');

    if (statusFilter) {
        statusFilter.addEventListener('change', filterDrivers);
    }

    if (ratingFilter) {
        ratingFilter.addEventListener('change', filterDrivers);
    }

    // Add driver form
    const addDriverForm = document.getElementById('addDriverForm');
    if (addDriverForm) {
        addDriverForm.addEventListener('submit', handleAddDriver);
    }
}

function renderDriversTable(driversList = drivers) {
    const tbody = document.getElementById('driversTableBody');
    if (!tbody) return;

    tbody.innerHTML = driversList.map(driver => `
        <tr>
            <td>
                <div class="driver-info">
                    <div class="driver-avatar">
                        <img src="${driver.avatar}" alt="${driver.name}">
                    </div>
                    <div>
                        <div class="driver-name">${driver.name}</div>
                        <div class="driver-id">#${driver.id}</div>
                    </div>
                </div>
            </td>
            <td>${driver.phone}</td>
            <td><span class="status-badge ${driver.status}">${capitalizeFirst(driver.status)}</span></td>
            <td>${driver.location}</td>
            <td>${driver.ordersCompleted}</td>
            <td>
                <div class="rating">
                    <span class="rating-stars">
                        ${generateStars(driver.rating)}
                    </span>
                    <span class="rating-value">${driver.rating}</span>
                </div>
            </td>
            <td>$${driver.earnings.toFixed(2)}</td>
            <td>
                <div class="actions">
                    <button class="btn-action" onclick="viewDriver('${driver.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="editDriver('${driver.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-toggle-status ${driver.status === 'online' ? 'approved' : 'pending'}" 
                            onclick="toggleDriverStatus('${driver.id}', '${driver.status}')" 
                            title="${driver.status === 'online' ? 'Suspend Driver' : 'Approve Driver'}">
                        <i class="fas ${driver.status === 'online' ? 'fa-pause' : 'fa-check'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterDrivers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const ratingFilter = document.getElementById('ratingFilter').value;

    let filteredDrivers = drivers.filter(driver => {
        const matchesSearch = driver.name.toLowerCase().includes(searchTerm) ||
            driver.id.toLowerCase().includes(searchTerm) ||
            driver.phone.includes(searchTerm);

        const matchesStatus = !statusFilter || driver.status === statusFilter;

        const matchesRating = !ratingFilter ||
            (ratingFilter === '5' && driver.rating >= 5) ||
            (ratingFilter === '4' && driver.rating >= 4) ||
            (ratingFilter === '3' && driver.rating >= 3);

        return matchesSearch && matchesStatus && matchesRating;
    });

    renderDriversTable(filteredDrivers);
}

function updateDriverStats() {
    if (drivers.length === 0) {
        // Show zeros when no drivers loaded
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('h3').textContent = '0';
            statCards[1].querySelector('h3').textContent = '0';
            statCards[2].querySelector('h3').textContent = '0';
            statCards[3].querySelector('h3').textContent = '0.0';
        }
        return;
    }

    const onlineDrivers = drivers.filter(d => d.status === 'online' || d.status === 'approved').length;
    const deliveringDrivers = drivers.filter(d => d.status === 'delivering' || d.status === 'busy').length;
    const pendingDrivers = drivers.filter(d => d.status === 'pending').length;
    const totalDrivers = drivers.length;
    
    // Calculate average rating, excluding drivers with no rating
    const driversWithRating = drivers.filter(d => d.rating > 0);
    const avgRating = driversWithRating.length > 0 
        ? (driversWithRating.reduce((sum, d) => sum + d.rating, 0) / driversWithRating.length).toFixed(1)
        : '0.0';

    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('h3').textContent = onlineDrivers;
        statCards[0].querySelector('p').textContent = 'Approved Drivers';
        
        statCards[1].querySelector('h3').textContent = pendingDrivers;
        statCards[1].querySelector('p').textContent = 'Pending Review';
        
        statCards[2].querySelector('h3').textContent = totalDrivers;
        
        statCards[3].querySelector('h3').textContent = avgRating;
    }

    console.log(`📊 Driver Stats Updated: ${totalDrivers} total, ${onlineDrivers} approved, ${pendingDrivers} pending, ${avgRating} avg rating`);
}

// Modal functions
function openAddDriverModal() {
    const modal = document.getElementById('addDriverModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAddDriverModal() {
    const modal = document.getElementById('addDriverModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        document.getElementById('addDriverForm').reset();
    }
}

function handleAddDriver(e) {
    e.preventDefault();

    // Convert to async to allow real DB creation
    (async () => {
        try {
            const submitBtn = document.querySelector('#addDriverModal .btn-primary[form="addDriverForm"]');
            const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...'; }

            // Collect form data
            const formData = new FormData(e.target);
            const name = formData.get('name');
            const email = formData.get('email');
            const rawPhone = formData.get('phone');
            const license = formData.get('license');
            const vehicleType = formData.get('vehicleType');
            const emergencyContact = formData.get('emergencyContact');

            // Generate driver id
            const genId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('DRV_' + Date.now() + '_' + Math.floor(Math.random()*1e6));

            const newDriver = {
                id: genId,
                name,
                email,
                phone: formatPhoneNumber(rawPhone),
                rawPhone,
                status: 'pending',
                location: 'Pending Location Verification',
                ordersCompleted: 0,
                rating: 0.0,
                earnings: 0,
                vehicleType,
                avatar: generateDriverAvatar(name),
                licenseNumber: license,
                emergencyContact,
                createdAt: new Date().toISOString()
            };

            // Persist to DynamoDB
            try {
                await createDriverInDB(newDriver);
                notify(`Driver "${newDriver.name}" created successfully.`, 'success');
            } catch (err) {
                console.error('Create driver failed:', err);
                const msg = (err && (err.message || err.code)) || 'Unknown error';
                notify(`Failed to create driver in database: ${msg}`, 'error');
                // If permissions missing, surface clear hint
                if ((err.code === 'AccessDeniedException') || /not authorized|access denied|insufficient/i.test(msg)) {
                    notify('AWS IAM role for Cognito Identity likely missing DynamoDB PutItem on WhizzDrivers_dev.', 'error');
                }
                // Fallback: add locally so user sees immediate result (optional)
                drivers.push(newDriver);
                renderDriversTable();
                updateDriverStats();
                throw err; // rethrow to skip success flow below
            }

            // Refresh from DB to reflect canonical values
            await loadDriversData();
            updateDriverStats();
            closeAddDriverModal();
        } catch (ex) {
            console.warn('Add driver flow finished with warnings/errors:', ex);
        } finally {
            const submitBtn = document.querySelector('#addDriverModal .btn-primary[form="addDriverForm"]');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Add Driver'; }
        }
    })();
}

// Driver action functions
function viewDriver(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
        notify(`Driver: ${driver.name} | ${driver.phone} | Status: ${driver.status}`, 'info');
    }
}

function editDriver(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
        notify(`Edit dialog for ${driver.name} would open here.`, 'info');
    }
}

// Toggle driver status between approved and suspended
async function toggleDriverStatus(driverId, currentStatus) {
    console.log(`🔄 Toggling status for driver ${driverId} from ${currentStatus}`);

    try {
        // Show loading state
        const button = document.querySelector(`button[onclick="toggleDriverStatus('${driverId}', '${currentStatus}')"]`);
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        // Determine new status based on current status
        const newStatus = (currentStatus === 'online' || currentStatus === 'approved') ? 'pending' : 'online';
        const dbStatus = newStatus === 'online' ? 'APPROVED' : 'PENDING_REVIEW';

        console.log(`📝 Updating driver ${driverId} to status: ${newStatus} (DB: ${dbStatus})`);
        
        // Show confirmation for critical actions
        if (newStatus === 'pending' && !confirm(`Are you sure you want to change ${driverId} status to pending review?`)) {
            // Reset button state
            const button = document.querySelector(`button[onclick="toggleDriverStatus('${driverId}', '${currentStatus}')"]`);
            if (button) {
                button.disabled = false;
                const icon = currentStatus === 'online' ? 'fa-pause' : 'fa-check';
                button.innerHTML = `<i class="fas ${icon}"></i>`;
            }
            return;
        }

        // Get DynamoDB client
        const dynamoDB = await AWSUtils.getDynamoDBClient();

        // Update the item in DynamoDB (write both status fields for compatibility)
        const baseUpdate = {
            UpdateExpression: 'SET #status = :status, #reg = :status, #updatedAt = :timestamp',
            ExpressionAttributeNames: {
                '#status': 'status',
                '#reg': 'registrationStatus',
                '#updatedAt': 'updatedAt'
            },
            ExpressionAttributeValues: {
                ':status': dbStatus,
                ':timestamp': Math.floor(Date.now() / 1000)
            },
            ReturnValues: 'ALL_NEW'
        };

        let result;
        try {
            const updateParams1 = {
                TableName: 'WhizzDrivers_dev',
                Key: { driverId: driverId },
                ...baseUpdate
            };
            result = await dynamoDB.update(updateParams1).promise();
        } catch (e1) {
            // Fallback: try with 'id' as key if schema differs
            if (e1?.code === 'ValidationException' || /key element does not match/i.test(e1?.message || '')) {
                console.warn('Primary key driverId update failed, retrying with id key');
                const updateParams2 = {
                    TableName: 'WhizzDrivers_dev',
                    Key: { id: driverId },
                    ...baseUpdate
                };
                result = await dynamoDB.update(updateParams2).promise();
            } else {
                throw e1;
            }
        }

        console.log('✅ Driver status update successful:', result);

        // Update local data (optimistic)
        const driverIndex = drivers.findIndex(d => d.id === driverId);
        if (driverIndex !== -1) {
            drivers[driverIndex].status = newStatus;
        }

        // Refresh from DB to ensure UI reflects persisted state
        await loadDriversData();

        // Refresh the table and stats
        renderDriversTable();
        updateDriverStats();

        // Show success message
        const driver = drivers.find(d => d.id === driverId);
        const driverName = driver ? driver.name : 'Driver';
        const statusMessage = newStatus === 'online' ? 'approved and activated' : 'suspended';

        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${driverName} has been ${statusMessage}.`, 'success');
        }

        console.log(`✅ Driver ${driverId} status changed from ${currentStatus} to ${newStatus}`);

    } catch (error) {
        console.error('❌ Error updating driver status:', error);

        // Reset button state
        const button = document.querySelector(`button[onclick*="toggleDriverStatus('${driverId}'"]`);
        if (button) {
            button.disabled = false;
            const icon = currentStatus === 'online' ? 'fa-pause' : 'fa-check';
            button.innerHTML = `<i class="fas ${icon}"></i>`;
        }

        let errorMessage = 'Failed to update driver status';
        if (error.code === 'ResourceNotFoundException') {
            errorMessage = 'Driver not found in database';
        } else if (error.code === 'ValidationException') {
            errorMessage = 'Invalid data provided';
        } else if (error.message) {
            errorMessage = error.message;
        }

        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`Error: ${errorMessage}`, 'error');
        }
    }
}

// Close modal when clicking outside
window.addEventListener('click', function (e) {
    const modal = document.getElementById('addDriverModal');
    if (e.target === modal) {
        closeAddDriverModal();
    }
});

// Export functions
window.driversManager = {
    openAddDriverModal,
    closeAddDriverModal,
    viewDriver,
    editDriver,
    toggleDriverStatus
};

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Drivers page loading...');

    // Immediately clear any pre-existing/mock rows and show a loading placeholder
    try {
        const tbodyInit = document.getElementById('driversTableBody');
        if (tbodyInit) {
            tbodyInit.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">
                <i class="fas fa-spinner fa-spin"></i> Loading drivers from database...
            </td></tr>`;
        }
    } catch (_) { }
    
    try {
        // Wait for AuthService to be available
        let retries = 0;
        while (!window.AuthService && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (!window.AuthService) {
            throw new Error('AuthService not available');
        }
        
        // Initialize AuthService
        await AuthService.initialize();
        
        // Check authentication and load drivers data
        if (await ensureAuthenticated()) {
            console.log('✅ User authenticated, loading drivers data...');
            await loadDriversData();
            setupEventListeners();
        } else {
            console.log('❌ User not authenticated, redirecting...');
        }
        
    } catch (error) {
        console.error('Failed to initialize drivers page:', error);
        const tbody = document.getElementById('driversTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem; color: #e74c3c;">
                Failed to initialize: ${error.message}. Please refresh the page.
            </td></tr>`;
        }
    }
});

console.log('Drivers management script loaded');
