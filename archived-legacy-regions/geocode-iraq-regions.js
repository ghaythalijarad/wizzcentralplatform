#!/usr/bin/env node
/**
 * Iraqi Regions Geocoding System
 * Automatically fetches coordinates for all Iraqi governorates, districts, and neighborhoods
 * Uses multiple geocoding APIs with smart fallback
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // API Keys (set these in environment or replace with your keys)
    GOOGLE_API_KEY: process.env.GOOGLE_GEOCODING_API_KEY || '',
    MAPBOX_API_KEY: process.env.MAPBOX_API_KEY || '',
    
    // Rate limiting
    DELAY_BETWEEN_REQUESTS: 1100, // milliseconds (for Nominatim 1 req/sec limit)
    
    // Cache file
    CACHE_FILE: path.join(__dirname, 'geocoding-cache.json'),
    
    // Output file
    OUTPUT_FILE: path.join(__dirname, 'iraq-regions-geocoded.json')
};

// ============================================
// GEOCODING CACHE
// ============================================

class GeocodingCache {
    constructor() {
        this.cache = this.loadCache();
    }
    
    loadCache() {
        try {
            if (fs.existsSync(CONFIG.CACHE_FILE)) {
                const data = fs.readFileSync(CONFIG.CACHE_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('⚠️  Could not load cache:', error.message);
        }
        return {};
    }
    
    saveCache() {
        try {
            fs.writeFileSync(CONFIG.CACHE_FILE, JSON.stringify(this.cache, null, 2));
            console.log('💾 Cache saved');
        } catch (error) {
            console.error('❌ Could not save cache:', error.message);
        }
    }
    
    get(query) {
        return this.cache[query];
    }
    
    set(query, result) {
        this.cache[query] = result;
        this.saveCache();
    }
}

// ============================================
// GEOCODING SERVICES
// ============================================

class GeocodingService {
    constructor() {
        this.cache = new GeocodingCache();
    }
    
    async geocode(locationName, governorate = 'Iraq') {
        // Build search query
        const query = `${locationName}, ${governorate}, Iraq`;
        
        // Check cache first
        const cached = this.cache.get(query);
        if (cached) {
            console.log(`📦 Cache hit: ${locationName}`);
            return cached;
        }
        
        console.log(`🔍 Geocoding: ${query}`);
        
        // Try services in order
        let result = null;
        
        // 1. Try Google Geocoding (best accuracy)
        if (CONFIG.GOOGLE_API_KEY) {
            result = await this.geocodeGoogle(query);
            if (result) {
                console.log(`✅ Google: ${locationName}`);
                this.cache.set(query, result);
                return result;
            }
        }
        
        // 2. Try Mapbox
        if (CONFIG.MAPBOX_API_KEY) {
            result = await this.geocodeMapbox(query);
            if (result) {
                console.log(`✅ Mapbox: ${locationName}`);
                this.cache.set(query, result);
                return result;
            }
        }
        
        // 3. Try OpenStreetMap Nominatim (free fallback)
        result = await this.geocodeNominatim(query);
        if (result) {
            console.log(`✅ Nominatim: ${locationName}`);
            this.cache.set(query, result);
            return result;
        }
        
        console.error(`❌ Failed to geocode: ${locationName}`);
        return null;
    }
    
    async geocodeGoogle(query) {
        if (!CONFIG.GOOGLE_API_KEY) return null;
        
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${CONFIG.GOOGLE_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'OK' && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                return {
                    lat: location.lat,
                    lng: location.lng,
                    source: 'google',
                    accuracy: 'high',
                    formatted_address: data.results[0].formatted_address
                };
            }
        } catch (error) {
            console.warn('⚠️  Google geocoding error:', error.message);
        }
        
        return null;
    }
    
    async geocodeMapbox(query) {
        if (!CONFIG.MAPBOX_API_KEY) return null;
        
        try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${CONFIG.MAPBOX_API_KEY}&country=IQ`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                return {
                    lat: lat,
                    lng: lng,
                    source: 'mapbox',
                    accuracy: 'high',
                    formatted_address: data.features[0].place_name
                };
            }
        } catch (error) {
            console.warn('⚠️  Mapbox geocoding error:', error.message);
        }
        
        return null;
    }
    
    async geocodeNominatim(query) {
        try {
            // Respect Nominatim usage policy: 1 request per second
            await this.delay(CONFIG.DELAY_BETWEEN_REQUESTS);
            
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=iq`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'WhizzCentralPlatform/1.0 (Regions Management System)'
                }
            });
            const data = await response.json();
            
            if (data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    source: 'nominatim',
                    accuracy: 'medium',
                    formatted_address: data[0].display_name
                };
            }
        } catch (error) {
            console.warn('⚠️  Nominatim geocoding error:', error.message);
        }
        
        return null;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================
// IRAQ REGIONS DATA
// ============================================

const IRAQ_REGIONS = {
    // 18 Iraqi Governorates
    governorates: [
        { id: 'baghdad', name: 'Baghdad', name_ar: 'بغداد' },
        { id: 'basra', name: 'Basra', name_ar: 'البصرة' },
        { id: 'najaf', name: 'Najaf', name_ar: 'النجف' },
        { id: 'karbala', name: 'Karbala', name_ar: 'كربلاء' },
        { id: 'nineveh', name: 'Nineveh', name_ar: 'نينوى' },
        { id: 'erbil', name: 'Erbil', name_ar: 'أربيل' },
        { id: 'sulaymaniyah', name: 'Sulaymaniyah', name_ar: 'السليمانية' },
        { id: 'duhok', name: 'Duhok', name_ar: 'دهوك' },
        { id: 'kirkuk', name: 'Kirkuk', name_ar: 'كركوك' },
        { id: 'anbar', name: 'Anbar', name_ar: 'الأنبار' },
        { id: 'diyala', name: 'Diyala', name_ar: 'ديالى' },
        { id: 'saladin', name: 'Saladin', name_ar: 'صلاح الدين' },
        { id: 'wasit', name: 'Wasit', name_ar: 'واسط' },
        { id: 'maysan', name: 'Maysan', name_ar: 'ميسان' },
        { id: 'qadisiyyah', name: 'Al-Qadisiyyah', name_ar: 'القادسية' },
        { id: 'babil', name: 'Babil', name_ar: 'بابل' },
        { id: 'dhi_qar', name: 'Dhi Qar', name_ar: 'ذي قار' },
        { id: 'muthanna', name: 'Al-Muthanna', name_ar: 'المثنى' }
    ],
    
    // Districts by governorate (major ones)
    districts: {
        najaf: [
            { id: 'najaf_central', name: 'Najaf Central District', name_ar: 'قضاء مركز النجف' },
            { id: 'najaf_kufa', name: 'Al-Kufa District', name_ar: 'قضاء الكوفة' },
            { id: 'najaf_manathera', name: 'Al-Manathera District', name_ar: 'قضاء المناذرة' },
            { id: 'najaf_mishkhab', name: 'Al-Mishkhab District', name_ar: 'قضاء المشخاب' }
        ],
        baghdad: [
            { id: 'baghdad_karkh', name: 'Al-Karkh', name_ar: 'الكرخ' },
            { id: 'baghdad_rusafa', name: 'Al-Rusafa', name_ar: 'الرصافة' },
            { id: 'baghdad_kadhimiya', name: 'Al-Kadhimiya', name_ar: 'الكاظمية' },
            { id: 'baghdad_adhamiya', name: 'Al-Adhamiya', name_ar: 'الأعظمية' },
            { id: 'baghdad_mahmoudiya', name: 'Al-Mahmoudiya', name_ar: 'المحمودية' }
        ],
        basra: [
            { id: 'basra_center', name: 'Basra Center', name_ar: 'مركز البصرة' },
            { id: 'basra_abu_khaseeb', name: 'Abu Al-Khaseeb', name_ar: 'أبو الخصيب' },
            { id: 'basra_zubair', name: 'Al-Zubair', name_ar: 'الزبير' },
            { id: 'basra_fao', name: 'Al-Fao', name_ar: 'الفاو' }
        ],
        karbala: [
            { id: 'karbala_center', name: 'Karbala Center', name_ar: 'مركز كربلاء' },
            { id: 'karbala_hindiya', name: 'Al-Hindiya', name_ar: 'الهندية' },
            { id: 'karbala_ain_tamur', name: 'Ain Al-Tamur', name_ar: 'عين التمر' }
        ]
        // Add more districts for other governorates as needed
    }
};

// ============================================
// MAIN GEOCODING PROCESS
// ============================================

async function geocodeAllRegions() {
    console.log('🌍 Starting Iraqi Regions Geocoding Process');
    console.log('===========================================\n');
    
    const service = new GeocodingService();
    const results = {
        country: null,
        governorates: [],
        districts: [],
        timestamp: new Date().toISOString(),
        summary: {
            total: 0,
            successful: 0,
            failed: 0
        }
    };
    
    // 1. Geocode Iraq (country level)
    console.log('\n📍 Geocoding Country Level');
    console.log('──────────────────────────');
    const iraqCoords = await service.geocode('Iraq');
    results.country = {
        id: 'iraq',
        name: 'Iraq',
        name_ar: 'العراق',
        level: 'country',
        coordinates: iraqCoords || { lat: 33.2232, lng: 43.6793 } // Fallback to known coordinates
    };
    results.summary.total++;
    if (iraqCoords) results.summary.successful++;
    
    // 2. Geocode all governorates
    console.log('\n📍 Geocoding Governorates');
    console.log('──────────────────────────');
    for (const gov of IRAQ_REGIONS.governorates) {
        const coords = await service.geocode(gov.name, 'Iraq');
        results.governorates.push({
            ...gov,
            level: 'governorate',
            parent_id: 'iraq',
            coordinates: coords || { lat: null, lng: null },
            geocoded: !!coords
        });
        results.summary.total++;
        if (coords) results.summary.successful++;
        else results.summary.failed++;
    }
    
    // 3. Geocode districts for each governorate
    console.log('\n📍 Geocoding Districts');
    console.log('──────────────────────────');
    for (const [govId, districts] of Object.entries(IRAQ_REGIONS.districts)) {
        const governorate = results.governorates.find(g => g.id === govId);
        if (!governorate) continue;
        
        for (const district of districts) {
            const coords = await service.geocode(district.name, governorate.name);
            results.districts.push({
                ...district,
                level: 'district',
                parent_id: govId,
                governorate_id: govId,
                coordinates: coords || { lat: null, lng: null },
                geocoded: !!coords
            });
            results.summary.total++;
            if (coords) results.summary.successful++;
            else results.summary.failed++;
        }
    }
    
    // 4. Save results
    console.log('\n💾 Saving Results');
    console.log('──────────────────────────');
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`✅ Results saved to: ${CONFIG.OUTPUT_FILE}`);
    
    // 5. Print summary
    console.log('\n📊 Geocoding Summary');
    console.log('══════════════════════════');
    console.log(`Total regions:      ${results.summary.total}`);
    console.log(`Successfully geocoded: ${results.summary.successful}`);
    console.log(`Failed:             ${results.summary.failed}`);
    console.log(`Success rate:       ${((results.summary.successful / results.summary.total) * 100).toFixed(1)}%`);
    
    console.log('\n✅ Geocoding complete!');
    
    return results;
}

// ============================================
// RUN
// ============================================

if (require.main === module) {
    console.log('\n🚀 Iraqi Regions Geocoding System');
    console.log('════════════════════════════════════\n');
    
    // Check API keys
    if (!CONFIG.GOOGLE_API_KEY && !CONFIG.MAPBOX_API_KEY) {
        console.log('⚠️  No API keys provided. Will use free Nominatim service only.');
        console.log('   For better results, set:');
        console.log('   - GOOGLE_GEOCODING_API_KEY environment variable');
        console.log('   - MAPBOX_API_KEY environment variable\n');
    }
    
    geocodeAllRegions()
        .then(() => {
            console.log('\n✨ Process completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Process failed:', error);
            process.exit(1);
        });
}

module.exports = { GeocodingService, geocodeAllRegions };
