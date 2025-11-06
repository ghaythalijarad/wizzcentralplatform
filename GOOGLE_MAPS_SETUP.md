# 🔑 Google Maps API Setup Guide

## Required APIs for Iraqi Regions System

### ✅ APIs to Enable

1. **Geocoding API** (REQUIRED)
   - Purpose: Address ↔ Coordinates conversion
   - Use: Search Iraqi cities and get lat/lng
   
2. **Maps JavaScript API** (REQUIRED)
   - Purpose: Interactive maps on web
   - Use: Display regions on map with markers
   
3. **Places API (New)** (RECOMMENDED)
   - Purpose: Detailed place information
   - Use: Better Iraqi location data

---

## 🔧 Setup Steps

### 1. Enable APIs in Google Cloud Console

```bash
# Open Google Cloud Console
open https://console.cloud.google.com/apis/library

# Your Project: "wizz business"

# Search and Enable:
□ Geocoding API
□ Maps JavaScript API
□ Places API (New)
```

### 2. Create API Key

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click: **"Create Credentials"** → **"API Key"**
3. Copy the key: `AIzaSy...`
4. Save it temporarily

### 3. Restrict API Key (CRITICAL!)

**Click "Restrict Key" and configure:**

#### API Restrictions:
```
✅ Geocoding API
✅ Maps JavaScript API
✅ Places API
```

#### Application Restrictions:

**Option A: For Development (HTTP Referrers)**
```
http://localhost:3000/*
http://localhost:*
http://127.0.0.1:3000/*
```

**Option B: For Production (HTTP Referrers)**
```
https://yourdomain.com/*
https://*.yourdomain.com/*
```

**Option C: For Backend (IP Addresses)**
```
Your-Server-IP-Address
```

### 4. Add API Key to Project

Create: `google-maps-config.js`
```javascript
const GOOGLE_MAPS_CONFIG = {
    apiKey: 'YOUR_API_KEY_HERE',
    language: 'ar', // Arabic support
    region: 'IQ'    // Iraq
};
```

⚠️ **NEVER commit API keys to GitHub!**

Add to `.gitignore`:
```
google-maps-config.js
.env
```

---

## 💰 Billing Setup

### 1. Enable Billing (Required)
```
1. Go to: https://console.cloud.google.com/billing
2. Link a credit card
3. Google requires billing even for free tier
```

### 2. Set Budget Alerts
```
1. Go to: Billing → Budgets & Alerts
2. Create Budget: $50/month
3. Set alerts at: 50%, 90%, 100%
4. Add your email for notifications
```

### 3. Expected Costs (First Month)
```
Free Credit: $200/month
Expected Usage: 
  • Geocoding: ~10,000 requests = $0 (under free tier)
  • Maps JS API: ~50,000 loads = $154
  • Places API: ~5,000 requests = ~$50
  
Total: ~$200/month (covered by free credit)
Net Cost: $0 for first few months ✅
```

---

## 🔒 Security Best Practices

### 1. API Key Restrictions (MUST DO)
✅ Restrict to specific APIs only
✅ Restrict to your domains/IPs
✅ Never expose in public repos
✅ Rotate keys periodically

### 2. Environment Variables
```bash
# Use .env file
GOOGLE_MAPS_API_KEY=your_key_here
GOOGLE_MAPS_LANGUAGE=ar
GOOGLE_MAPS_REGION=IQ
```

### 3. Backend Proxy (Recommended)
```
Instead of: Client → Google Maps API
Do: Client → Your Server → Google Maps API

Benefits:
✅ Hide API key from frontend
✅ Add caching
✅ Monitor usage
✅ Add rate limiting
```

---

## 📊 Usage Monitoring

### Check Usage
```
1. Go to: https://console.cloud.google.com/apis/dashboard
2. View metrics for each API
3. Set up alerts for high usage
```

### Cost Control
```
1. Set daily quotas per API
2. Implement caching on your server
3. Cache geocoding results (cities don't move!)
4. Use lazy loading for maps
```

---

## 🧪 Test Your Setup

### Test Geocoding API
```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Baghdad,Iraq&key=YOUR_API_KEY"
```

Expected Response:
```json
{
  "results": [{
    "formatted_address": "Baghdad, Iraq",
    "geometry": {
      "location": {
        "lat": 33.3152,
        "lng": 44.3661
      }
    },
    "address_components": [...]
  }],
  "status": "OK"
}
```

### Test Maps JavaScript API
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&language=ar&region=IQ"></script>
</head>
<body>
  <div id="map" style="height: 400px;"></div>
  <script>
    const map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 33.3152, lng: 44.3661 },
      zoom: 10
    });
  </script>
</body>
</html>
```

---

## ⚠️ Common Issues

### Issue 1: "This API key is not authorized"
**Solution:**
- Check API restrictions in console
- Verify HTTP referrer matches your domain
- Wait 5 minutes for changes to propagate

### Issue 2: "Billing not enabled"
**Solution:**
- Go to Billing and add payment method
- Even free tier requires billing setup

### Issue 3: "OVER_QUERY_LIMIT"
**Solution:**
- Check quota limits in console
- Implement caching
- Add rate limiting

### Issue 4: Arabic text not showing
**Solution:**
- Add `language=ar` parameter to API calls
- Use `region=IQ` for Iraqi results

---

## 🎯 Next Steps

After setup:

1. ✅ APIs enabled
2. ✅ API key created and restricted
3. ✅ Billing enabled
4. ✅ Budget alerts set
5. ✅ API key tested

Then:
1. Create `google-maps-config.js` with your key
2. Update `regions-api/server.js` to serve config
3. Create Google Maps playground UI
4. Test with Iraqi cities
5. Deploy to production

---

## 📞 Support

**Documentation:**
- Geocoding API: https://developers.google.com/maps/documentation/geocoding
- Maps JavaScript API: https://developers.google.com/maps/documentation/javascript
- Places API: https://developers.google.com/maps/documentation/places/web-service

**Billing:**
- Pricing: https://developers.google.com/maps/billing-and-pricing/pricing
- Calculator: https://mapsplatform.google.com/pricing/

**Community:**
- Stack Overflow: [google-maps] tag
- GitHub Issues: google-maps-platform

---

## 🎉 Ready!

Once setup complete, run:
```bash
npm run playground
open http://localhost:3000
```

Your Google Maps powered Iraqi regions system will be live! 🚀
