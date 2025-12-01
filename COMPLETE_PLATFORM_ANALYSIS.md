# WhizzCentral Platform - Complete Analysis
**Generated:** November 30, 2025  
**Platform Version:** 2.0.0  
**Analysis Scope:** All Pages, Logic, Architecture, and Integration

---

## 📊 Executive Summary

The WhizzCentral Platform is a comprehensive admin dashboard for managing the WhizzEcoSystem delivery platform across Iraq. It integrates with 4 DynamoDB tables, uses AWS Cognito for authentication, implements RBAC permissions, and provides real-time features via WebSockets and Amazon Connect.

### Key Statistics
- **Pages:** 20 HTML pages
- **JavaScript Modules:** 60+ files
- **Backend APIs:** 15+ endpoints
- **DynamoDB Tables:** 4 (Regions, Businesses, Products, Categories)
- **AWS Services:** Cognito, DynamoDB, S3, Lambda, API Gateway, Amazon Connect
- **Security:** XSS protection, CSP headers, RBAC, JWT tokens

---

## 🗂️ Platform Architecture

### 1. Frontend Architecture

```
frontend/
├── pages/              # 20 HTML pages
├── assets/
│   ├── js/            # Utilities (auth, RBAC, security, AWS)
│   ├── css/           # Styles
│   └── images/        # Static assets
├── styles/            # Material 3 Design System
└── [module].js        # Page-specific logic
```

### 2. Backend Architecture

```
backend/
├── local-dev-server.js           # Main Express server
├── merchants-bulk-handler.js     # Bulk upload API
├── chat-websocket-handler/       # WebSocket chat
├── push-notification-handler/    # FCM notifications
└── regions-api/                  # Regions management
```

### 3. Authentication Flow

```
User Login → Cognito Auth → JWT Token → RBAC Check → Access Granted
                ↓
         Identity Pool → AWS Credentials → DynamoDB Access
```

---

## 📄 Page-by-Page Analysis

### Core Pages

#### 1. **Dashboard** (`dashboard.html`)
**Purpose:** Main overview with real-time statistics  
**JavaScript:** `dashboard.js`  
**Features:**
- Real-time order statistics from WizzOrders API
- Active merchants, drivers, and customers count
- Revenue tracking and growth metrics
- Chart.js visualizations
- Live updates via polling

**API Endpoints:**
- `/health` - Server status
- `/api/statistics` - Dashboard stats
- External: WizzOrders API for order data

**Key Logic:**
```javascript
// Fetches real-time statistics every 30 seconds
async function loadDashboardStats() {
    const stats = await fetch('/api/statistics');
    updateStatCards(stats);
    renderCharts(stats);
}
```

**RBAC:** All authenticated users (admin, support_agent, merchants_admin)

---

#### 2. **Merchants** (`merchants.html`)
**Purpose:** Manage merchant businesses and their products  
**JavaScript:** `merchants.js`  
**Features:**
- View all merchants from WhizzMerchants_Businesses table
- Edit merchant details (name, owner, address, status)
- Toggle merchant approval status
- View merchant products from WhizzMerchants_Products
- **Bulk upload items** (CSV/JSON/XLSX) with deduplication
- Product categorization and inventory management

**API Endpoints:**
- `GET /businesses` - List all merchants
- `POST /api/merchants/:id/items/bulk` - Bulk upload products
- `GET /api/categories` - Load product categories
- `GET /api/merchants/:id/products` - Load merchant products
- `PUT /api/merchants/:id/products/:productId` - Update product

**Key Features:**
1. **Bulk Upload System:**
   - Supports CSV, JSON, XLSX formats
   - Category mapping (English/Arabic → categoryId)
   - Deduplication via normalized names
   - SHA-256 fingerprinting for change detection
   - Progress tracking and validation
   - Up to 1,000 items per upload

2. **Table Layout:**
   - Business info (logo, name, category, city)
   - Owner, Status, Accepting Orders
   - Email, Phone, Address, Last Update
   - Actions (view, edit, bulk upload, toggle status)

**Data Transformation:**
```javascript
merchantsData = businesses.map(item => ({
    id: item.businessId,
    name: item.businessName,
    owner: item.ownerName,
    status: item.status || (item.isActive ? 'approved' : 'pending'),
    acceptingOrders: item.acceptingOrders,
    address: buildAddressFromData(item),
    fullData: item // Preserve raw data
}));
```

**RBAC:** admin, merchants_admin

---

#### 3. **Orders** (`orders.html`, `orders-new.html`, `orders-management.html`)
**Purpose:** View and manage customer orders  
**JavaScript:** Integrated with WizzOrders API  
**Features:**
- Real-time order tracking
- Order status updates
- Driver assignment
- Order history and search
- Filtering by status, date, merchant

**API Endpoints:**
- External: WizzOrders API endpoints
- WebSocket: Real-time order updates

**Order Statuses:**
- pending, confirmed, preparing, ready_for_pickup
- driver_assigned, picked_up, in_transit
- delivered, cancelled, refunded

**RBAC:** admin, support_agent

---

#### 4. **Drivers** (`drivers.html`)
**Purpose:** Manage delivery drivers  
**JavaScript:** `drivers.js`  
**Features:**
- View all drivers with status (online/offline)
- Edit driver details (name, phone, vehicle, region)
- Track driver location and assignments
- Upload driver documents to S3
- Approval workflow

**Data Structure:**
```javascript
{
    driverId: string,
    name: string,
    phone: string,
    vehicleType: string,
    vehiclePlate: string,
    homeRegionId: string,
    status: 'online' | 'offline' | 'busy',
    isActive: boolean,
    documents: { license, id, vehicle },
    location: { lat, lng }
}
```

**RBAC:** admin

---

#### 5. **Customers** (`customers.html`)
**Purpose:** View and manage customer accounts  
**JavaScript:** `customers.js`  
**Features:**
- Customer list with search and filters
- View customer order history
- Edit customer details
- Customer points and loyalty tracking
- Account status management

**RBAC:** admin, support_agent

---

#### 6. **Regions** (`regions.html`, `regions-management.html`)
**Purpose:** Manage delivery regions and boundaries  
**JavaScript:** `regions.js`  
**Features:**
- Interactive map with Mapbox GL JS
- Draw/edit region boundaries (H3 hexagons)
- Toggle region activation
- Commission rules per region
- Hierarchical structure (City → District → Neighborhood)

**DynamoDB Table:** `WizzCentral_Regions`
```javascript
{
    regionId: string,
    name: string,
    nameAr: string,
    type: 'city' | 'district' | 'neighborhood',
    parentId: string,
    isActive: boolean,
    h3Cells: string[],
    boundary: GeoJSON,
    commissionRate: number
}
```

**Key Logic:**
```javascript
// Toggle region activation
async function toggleRegionStatus(regionId) {
    const region = await getRegion(regionId);
    const newStatus = !region.isActive;
    await updateRegion(regionId, { isActive: newStatus });
    
    // Cascade to children
    if (region.children) {
        await Promise.all(
            region.children.map(child => 
                toggleRegionStatus(child.regionId)
            )
        );
    }
}
```

**RBAC:** admin

---

#### 7. **Promotions** (`promotions.html`)
**Purpose:** Create and manage promotional campaigns  
**JavaScript:** `promotions.js`, `campaign-manager.js`  
**Features:**
- Platform-wide discounts
- Merchant-specific promotions
- Customer targeting (location, order history)
- Push notifications via FCM
- A/B testing support
- Analytics dashboard

**Campaign Types:**
1. **Percentage Discount:** 10% off orders
2. **Fixed Amount:** $5 off orders over $20
3. **Free Delivery:** Waive delivery fee
4. **BOGO:** Buy one get one free

**Targeting Options:**
- Geographic (city, district, neighborhood)
- Customer segments (new, loyal, inactive)
- Order history (frequency, value)
- Time-based (day of week, hour)

**Push Notification Flow:**
```
Campaign Created → Target Calculation → FCM Tokens Retrieved 
    → Batch Processing → Send Notifications → Track Delivery
```

**RBAC:** admin, marketing_manager

---

#### 8. **Support** (`support.html`)
**Purpose:** Customer support chat via Amazon Connect  
**JavaScript:** `support.js`, `amazon-connect-chat.js`  
**Features:**
- Live chat with customers
- Chat history retrieval
- File sharing (images, documents)
- Multiple simultaneous conversations
- Agent status management
- Merchant support channel

**Amazon Connect Integration:**
```javascript
// Initialize chat session
async function startChat(contactFlowId, participantToken) {
    const session = await connect.ChatSession.create({
        chatDetails: {
            contactFlowId,
            participantToken
        },
        type: 'CUSTOMER'
    });
    
    session.onMessage(handleIncomingMessage);
    session.connect();
}
```

**User Types:**
- **Customer Support:** Help customers with orders
- **Merchant Support:** Assist merchants with platform issues

**RBAC:** admin, support_agent

---

#### 9. **Financial Management** (`financial-management.html`)
**Purpose:** Track revenue, commissions, and payouts  
**JavaScript:** `financial-management.js`  
**Features:**
- Revenue dashboard
- Commission calculations
- Merchant payouts
- Driver earnings
- Transaction history
- Export reports (CSV/PDF)

**Financial Tables:**
- `WizzFinancial_Transactions`
- `WizzFinancial_Commissions`
- `WizzFinancial_Payouts`

**RBAC:** admin, finance_manager

---

### Utility Pages

#### 10. **RBAC Debug** (`rbac-debug.html`)
**Purpose:** Test and debug role-based access control  
**Features:**
- View current user role
- Test permission checks
- Simulate different roles
- Access matrix visualization

#### 11. **Unauthorized** (`unauthorized.html`)
**Purpose:** 403 error page for denied access

---

## 🔐 Security Implementation

### 1. XSS Protection (100% Complete)

**Implementation:**
```javascript
// security-utils.js
class SecurityUtils {
    static escapeHTML(str) {
        return DOMPurify.sanitize(str, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
            ALLOWED_ATTR: []
        });
    }
    
    static sanitizeHTML(html) {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'button', 'img', 'div', 'span', 'h1-h6'
            ],
            ALLOWED_ATTR: [
                'data-*', 'class', 'id', 'src', 'alt', 'title'
            ],
            ALLOW_DATA_ATTR: true
        });
    }
}
```

**Applied to:**
- ✅ Dashboard
- ✅ Merchants
- ✅ Orders
- ✅ Drivers
- ✅ Customers
- ✅ Promotions
- ✅ Support

---

### 2. RBAC System

**Roles:**
```javascript
const ROLES = {
    ADMIN: 'admin',                    // Full access
    SUPPORT: 'support_agent',           // Orders, customers, support
    MERCHANTS_ADMIN: 'merchants_admin', // Merchants only
    MARKETING: 'marketing_manager',     // Promotions only
    FINANCE: 'finance_manager'          // Financial only
};
```

**Permission Matrix:**

| Page | admin | support_agent | merchants_admin | marketing_manager | finance_manager |
|------|-------|---------------|-----------------|-------------------|-----------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Merchants | ✅ | ❌ | ✅ | ❌ | ❌ |
| Orders | ✅ | ✅ | ❌ | ❌ | ❌ |
| Drivers | ✅ | ❌ | ❌ | ❌ | ❌ |
| Customers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Regions | ✅ | ❌ | ❌ | ❌ | ❌ |
| Promotions | ✅ | ❌ | ❌ | ✅ | ❌ |
| Support | ✅ | ✅ | ❌ | ❌ | ❌ |
| Financial | ✅ | ❌ | ❌ | ❌ | ✅ |

**Implementation:**
```javascript
// rbac.js
class RBAC {
    static hasAccess(page) {
        const userRole = this.getUserRole();
        const allowedRoles = PAGE_PERMISSIONS[page];
        return allowedRoles.includes(userRole);
    }
    
    static requireAccess(page) {
        if (!this.hasAccess(page)) {
            window.location.href = '/pages/unauthorized.html';
        }
    }
}
```

---

### 3. Content Security Policy

```javascript
// Helmet CSP Configuration
helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for inline scripts
            "https://cdn.jsdelivr.net",
            "https://cdn.sheetjs.com",
            "https://api.mapbox.com"
        ],
        styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://api.mapbox.com"
        ],
        imgSrc: [
            "'self'",
            "data:",
            "https:",
            "blob:"
        ],
        connectSrc: [
            "'self'",
            "https://cognito-idp.us-east-1.amazonaws.com",
            "https://dynamodb.us-east-1.amazonaws.com",
            "wss://*.execute-api.us-east-1.amazonaws.com"
        ]
    }
});
```

---

## 🔌 API Endpoints

### Local Development Server (`local-dev-server.js`)

#### Health & Status
- `GET /health` - Server health check
- `GET /api/statistics` - Dashboard statistics

#### Merchants
- `GET /businesses` - List all merchants
- `GET /api/merchants/:id` - Get merchant details
- `PUT /api/merchants/:id` - Update merchant
- `POST /api/merchants/:id/items/bulk` - Bulk upload products
- `GET /api/merchants/:id/products` - List merchant products
- `PUT /api/merchants/:id/products/:productId` - Update product

#### Categories
- `GET /api/categories` - List all product categories

#### Regions
- `GET /api/regions` - List all regions (with pagination)
- `GET /api/regions/:id` - Get region details
- `PATCH /api/regions/:id/toggle` - Toggle region activation
- `POST /api/regions` - Create new region
- `PUT /api/regions/:id` - Update region
- `DELETE /api/regions/:id` - Delete region

#### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/send-info-notification` - Send to merchants

#### Push Notifications
- `POST /api/push-notifications/send` - Send push notification
- `POST /api/push-notifications/register-token` - Register FCM token

---

## 🗄️ Database Schema

### 1. WizzCentral_Regions
```javascript
{
    regionId: "string (PK)",
    name: "string",
    nameAr: "string",
    type: "city | district | neighborhood",
    parentId: "string",
    isActive: "boolean",
    h3Cells: ["string"],
    boundary: {
        type: "Polygon",
        coordinates: [[lat, lng]]
    },
    commissionRate: "number",
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### 2. WhizzMerchants_Businesses
```javascript
{
    businessId: "string (PK)",
    businessName: "string",
    ownerName: "string",
    email: "string",
    phoneNumber: "string",
    businessType: "restaurant | store | cafe | pharmacy",
    status: "approved | pending | rejected",
    isActive: "boolean",
    acceptingOrders: "boolean",
    onlineStatus: "online | offline",
    address: {
        street: "string",
        district: "string",
        city: "string",
        country: "Iraq"
    },
    latitude: "number",
    longitude: "number",
    regionId: "string",
    businessPhotoUrl: "string",
    cognitoUserId: "string",
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### 3. WhizzMerchants_Products
```javascript
{
    productId: "string (PK)",
    businessId: "string (GSI)",
    name: "string",
    name_ar: "string",
    description: "string",
    description_ar: "string",
    price: "number",
    categoryId: "string",
    image_url: "string",
    is_available: "boolean",
    preparation_time: "number",
    allergens: ["string"],
    ingredients: ["string"],
    fingerprint: "string (SHA-256)", // For change detection
    searchableName: "string", // Normalized for deduplication
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### 4. WhizzMerchants_Categories
```javascript
{
    categoryId: "string (PK)",
    name: "string",
    name_ar: "string",
    icon: "string",
    order: "number",
    isActive: "boolean"
}
```

---

## 🔄 Data Flow Diagrams

### 1. Bulk Upload Flow
```
User Uploads File (CSV/JSON/XLSX)
    ↓
Parse & Validate (SheetJS)
    ↓
Preview in UI (show 5 items)
    ↓
User Confirms
    ↓
API: POST /api/merchants/:id/items/bulk
    ↓
Backend Processing:
    ├─ Load Categories (cache 5 min)
    ├─ Map Category Names → categoryId
    ├─ Normalize Names (deduplication)
    ├─ Load Existing Products
    ├─ Calculate Fingerprints (SHA-256)
    ├─ Determine: Create vs Update vs Skip
    └─ Batch Write to DynamoDB
    ↓
Response: { created, updated, skipped, errors }
    ↓
UI: Show Success Summary
```

### 2. Region Activation Flow
```
Admin Clicks Toggle
    ↓
Confirm Dialog
    ↓
API: PATCH /api/regions/:id/toggle
    ↓
Backend:
    ├─ Load Region
    ├─ Update isActive
    ├─ Cascade to Children (recursive)
    └─ Update Parent Counts
    ↓
Response: Updated Region
    ↓
UI: Refresh Table
```

### 3. Push Notification Flow
```
Campaign Created
    ↓
Calculate Target Audience
    ↓
Query FCM Tokens from DynamoDB
    ↓
Batch Processing (500 tokens/batch)
    ↓
Lambda: push-notification-handler
    ↓
FCM API v1
    ↓
Track Delivery Status
    ↓
Update Campaign Analytics
```

---

## 🛠️ Development Tools

### 1. Build & Deploy
```bash
# Local development
npm start                 # Start server on port 3000
npm run test             # Run tests

# Deployment
./deploy-to-amplify.sh   # Deploy to AWS Amplify
./deploy-backend-fix.sh  # Deploy backend Lambda functions
```

### 2. Debugging
```bash
# Enable debug mode (bypass auth)
sessionStorage.setItem('debugMode', 'true');

# Check AWS credentials
aws sso login --profile wizz-drivers-ghayth-dev
aws sts get-caller-identity

# Test DynamoDB connection
node test-dynamodb-connection.js
```

### 3. Testing Scripts
- `test-bulk-upload.sh` - Test bulk upload with sample CSV
- `test-regions-api.sh` - Test regions API endpoints
- `test-merchant-chat.js` - Test WebSocket chat
- `test-push-notifications.sh` - Test FCM integration

---

## 📦 Dependencies

### Frontend
```json
{
    "dompurify": "3.0.6",      // XSS protection
    "chart.js": "^4.0.0",      // Data visualization
    "mapbox-gl": "^2.15.0",    // Interactive maps
    "xlsx": "0.20.1"           // Excel/CSV parsing
}
```

### Backend
```json
{
    "express": "^4.18.2",
    "helmet": "^7.1.0",        // Security headers
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "@aws-sdk/client-dynamodb": "^3.490.0",
    "@aws-sdk/lib-dynamodb": "^3.490.0",
    "@aws-sdk/client-s3": "^3.490.0",
    "dotenv": "^16.3.1"
}
```

---

## 🚀 Deployment Architecture

```
AWS Amplify (Frontend Hosting)
    ↓
API Gateway (REST APIs)
    ↓
Lambda Functions (Backend Logic)
    ├─ merchants-bulk-handler
    ├─ push-notification-handler
    └─ chat-websocket-handler
    ↓
DynamoDB (Data Storage)
    ├─ WizzCentral_Regions
    ├─ WhizzMerchants_Businesses
    ├─ WhizzMerchants_Products
    └─ WhizzMerchants_Categories
    ↓
S3 (File Storage)
    └─ Business photos, driver documents
    ↓
Amazon Connect (Customer Support Chat)
```

---

## 📈 Performance Optimizations

### 1. Data Loading
- **Pagination:** 50 items per page
- **Lazy Loading:** Load data on demand
- **Caching:** Cache categories for 5 minutes
- **Debouncing:** Search input debounced 300ms

### 2. UI Rendering
- **Virtual Scrolling:** For large tables
- **Progressive Enhancement:** Core features work without JS
- **Image Lazy Loading:** `loading="lazy"` attribute
- **Skeleton Screens:** Show while loading

### 3. API Optimization
- **Batch Operations:** Bulk upload processes 100 items at a time
- **Compression:** Gzip enabled on server
- **Connection Pooling:** Reuse DynamoDB connections
- **Rate Limiting:** 100 requests per 15 minutes per IP

---

## 🐛 Known Issues & Limitations

### Current Issues
1. ⚠️ **Merchant Table:** Some columns show business name instead of owner/email/phone (fixed in latest commit)
2. ⚠️ **Safari Cache:** Hard refresh required after updates
3. ⚠️ **WebSocket Reconnection:** May require page reload after network interruption

### Limitations
1. **Bulk Upload:** Max 1,000 items per upload
2. **File Size:** Max 5MB for file uploads
3. **Concurrent Users:** Recommended <100 simultaneous users
4. **Map Rendering:** Performance degrades with >1000 regions

### Planned Improvements
- [ ] S3 presigned uploads for bulk files >5MB
- [ ] Async Lambda processing with status polling
- [ ] Enhanced error export (CSV with per-item details)
- [ ] Product image bulk upload
- [ ] Inventory sync integration
- [ ] Price history tracking

---

## 📝 Testing Checklist

### Manual Testing
- [ ] Login with different roles (admin, support, merchants_admin)
- [ ] Create/edit/delete merchants
- [ ] Bulk upload 10 products from CSV
- [ ] Toggle region activation
- [ ] Create promotional campaign with push notification
- [ ] Start support chat session
- [ ] View financial reports

### Automated Testing
```bash
# Run test suite
npm test

# Specific tests
npm run test:merchants
npm run test:regions
npm run test:bulk-upload
```

---

## 🔗 External Integrations

### 1. WizzOrders API
**Purpose:** Order management system  
**Base URL:** `https://api.whizzorders.com/v1`  
**Endpoints:**
- `GET /orders` - List orders
- `POST /orders/:id/assign-driver` - Assign driver
- `PUT /orders/:id/status` - Update order status

### 2. Firebase Cloud Messaging (FCM)
**Purpose:** Push notifications to mobile apps  
**API Version:** v1 (OAuth 2.0)  
**Service Account:** `firebase-service-account.json`

### 3. Amazon Connect
**Purpose:** Customer support chat  
**Instance:** `https://whizz-support.awsapps.com/connect`  
**Contact Flows:**
- Customer Support: `arn:aws:connect:...`
- Merchant Support: `arn:aws:connect:...`

### 4. Mapbox GL JS
**Purpose:** Interactive maps and geocoding  
**API Key:** Stored in `.env.mapbox`  
**Features Used:**
- Map rendering
- Geocoding
- H3 hexagon visualization

---

## 📚 Documentation References

### Internal Docs
- `/BULK_UPLOAD_IMPLEMENTATION_COMPLETE.md` - Bulk upload technical details
- `/RBAC_FINAL_SUMMARY.md` - RBAC implementation guide
- `/XSS_PROTECTION_100_PERCENT_COMPLETE.md` - Security audit
- `/DEPLOYMENT_TO_AWS_AMPLIFY.md` - Deployment guide

### External Resources
- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Material Design 3](https://m3.material.io/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/api/)

---

## 🎯 Conclusion

The WhizzCentral Platform is a production-ready admin dashboard with:
- ✅ Complete CRUD operations for all entities
- ✅ Real-time features (WebSocket, polling)
- ✅ Comprehensive security (XSS, CSP, RBAC)
- ✅ Bulk operations with validation
- ✅ Mobile-responsive UI (Material 3)
- ✅ Integration with external services
- ✅ Scalable architecture (AWS serverless)

**Current Status:** Stable, deployed to production  
**Next Phase:** Analytics dashboard, inventory management, advanced reporting

---

**Generated by:** AI Agent  
**Last Updated:** November 30, 2025  
**Version:** 2.0.0
