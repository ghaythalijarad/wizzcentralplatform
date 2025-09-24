// Populate regions data via API endpoints
const regionsData = [
  // Iraq (Country)
  {
    name: 'Iraq',
    name_ar: 'العراق',
    level: 'country',
    coordinates: {
      lat: 33.2232,
      lng: 43.6793,
      radius: 500000
    }
  },
  
  // Baghdad Governorate
  {
    name: 'Baghdad',
    name_ar: 'بغداد',
    level: 'governorate',
    parent_id: 'iraq',
    coordinates: {
      lat: 33.3152,
      lng: 44.3661,
      radius: 50000
    }
  },
  
  // Baghdad Districts
  {
    name: 'Al-Karada',
    name_ar: 'الكرادة',
    level: 'district',
    parent_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3089,
      lng: 44.4205,
      radius: 5000
    }
  },
  
  {
    name: 'Al-Mansour',
    name_ar: 'المنصور',
    level: 'district',
    parent_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3061,
      lng: 44.3451,
      radius: 5000
    }
  },
  
  // Basra Governorate
  {
    name: 'Basra',
    name_ar: 'البصرة',
    level: 'governorate',
    parent_id: 'iraq',
    coordinates: {
      lat: 30.5085,
      lng: 47.7804,
      radius: 40000
    }
  },
  
  // More regions...
  {
    name: 'Erbil',
    name_ar: 'أربيل',
    level: 'governorate',
    parent_id: 'iraq',
    coordinates: {
      lat: 36.1911,
      lng: 44.0093,
      radius: 35000
    }
  },
  
  {
    name: 'Al-Adhamiya',
    name_ar: 'الأعظمية',
    level: 'district',
    parent_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3756,
      lng: 44.3831,
      radius: 4000
    }
  },
  
  {
    name: 'Sadr City',
    name_ar: 'مدينة الصدر',
    level: 'district',
    parent_id: 'baghdad-gov',
    coordinates: {
      lat: 33.3739,
      lng: 44.4644,
      radius: 6000
    }
  },
  
  // Neighborhoods 
  {
    name: 'Al-Jadriya',
    name_ar: 'الجادرية',
    level: 'neighborhood',
    parent_id: 'karada-district',
    coordinates: {
      lat: 33.2875,
      lng: 44.3969,
      radius: 2000
    }
  },
  
  {
    name: 'Karrada Center',
    name_ar: 'مركز الكرادة',
    level: 'neighborhood',
    parent_id: 'karada-district',
    coordinates: {
      lat: 33.3106,
      lng: 44.4207,
      radius: 1500
    }
  },
  
  {
    name: 'Nineveh',
    name_ar: 'نينوى',
    level: 'governorate',
    parent_id: 'iraq',
    coordinates: {
      lat: 36.335,
      lng: 43.1182,
      radius: 45000
    }
  },
  
  {
    name: 'Najaf',
    name_ar: 'النجف',
    level: 'governorate',
    parent_id: 'iraq',
    coordinates: {
      lat: 32.0258,
      lng: 44.3236,
      radius: 30000
    }
  }
];

async function createRegionsViaAPI() {
  const apiBase = 'http://localhost:3000';
  
  console.log('🌍 Creating sample regions via API...');
  
  try {
    for (const region of regionsData) {
      console.log(`📍 Creating: ${region.name} (${region.level})`);
      
      const response = await fetch(`${apiBase}/api/regions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(region)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created: ${region.name} - ID: ${result.data.id}`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to create ${region.name}: ${error}`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Regions creation complete!');
    console.log('📊 Check http://localhost:3000/pages/regions.html to see the data');
    
  } catch (error) {
    console.error('💥 Error creating regions:', error);
  }
}

// HTML version for browser execution
const htmlScript = `
<!DOCTYPE html>
<html>
<head>
    <title>Create Sample Regions</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .btn { background: #00C2E8; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin: 10px 5px; }
        .btn:hover { background: #009BB8; }
        .log { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; font-family: monospace; height: 400px; overflow-y: auto; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌍 Create Sample Regions Data</h1>
        <p>This will populate the WizzCentral_Regions table with sample Iraqi regions data.</p>
        
        <button class="btn" onclick="createRegions()">🚀 Create Sample Regions</button>
        <button class="btn" onclick="openRegionsPage()">📋 Open Regions Page</button>
        <button class="btn" onclick="clearLog()">🗑️ Clear Log</button>
        
        <div id="log" class="log">
            Ready to create regions...<br>
        </div>
    </div>

    <script>
        const regionsData = ${JSON.stringify(regionsData, null, 2)};
        
        function log(message, type = 'info') {
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            const className = type === 'success' ? 'success' : type === 'error' ? 'error' : '';
            logDiv.innerHTML += \`<span class="\${className}">[\\${timestamp}] \\${message}</span><br>\`;
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        async function createRegions() {
            log('🌍 Starting regions creation...');
            
            let success = 0;
            let failed = 0;
            
            for (const region of regionsData) {
                log(\`📍 Creating: \\${region.name} (\\${region.level})\`);
                
                try {
                    const response = await fetch('/api/regions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(region)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        log(\`✅ Created: \\${region.name} - ID: \\${result.data.id}\`, 'success');
                        success++;
                    } else {
                        const error = await response.text();
                        log(\`❌ Failed: \\${region.name} - \\${error}\`, 'error');
                        failed++;
                    }
                } catch (error) {
                    log(\`💥 Error: \\${region.name} - \\${error.message}\`, 'error');
                    failed++;
                }
                
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            log(\`🎉 Creation complete! Success: \\${success}, Failed: \\${failed}\`, success > failed ? 'success' : 'error');
            if (success > 0) {
                log('📊 You can now check the regions page to see the data!', 'success');
            }
        }
        
        function openRegionsPage() {
            window.open('/pages/regions.html', '_blank');
        }
        
        function clearLog() {
            document.getElementById('log').innerHTML = 'Log cleared...<br>';
        }
    </script>
</body>
</html>`;

// Export for different uses
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { regionsData, createRegionsViaAPI };
}

// For Node.js execution
if (require.main === module) {
    createRegionsViaAPI();
}

// Write HTML version to file
require('fs').writeFileSync('/Users/ghaythallaheebi/wizzcentralplatform/frontend/create-sample-regions.html', htmlScript);
console.log('📝 Created HTML version: /frontend/create-sample-regions.html');
