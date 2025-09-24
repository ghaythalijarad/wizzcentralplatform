const fs = require('fs');

console.log('📊 IRAQI REGIONS COVERAGE ANALYSIS');
console.log('=====================================');

try {
  const content = fs.readFileSync('./local-dev-server.js', 'utf8');
  const match = content.match(/const comprehensiveIraqiRegions = \[([\s\S]*?)\];/);
  
  if (match) {
    const regions = eval('[' + match[1] + ']');
    
    const govs = regions.filter(r => r.level === 'governorate');
    const districts = regions.filter(r => r.level === 'district');
    const neighborhoods = regions.filter(r => r.level === 'neighborhood');
    
    console.log('🏛️  Governorates: ' + govs.length + '/18');
    console.log('🏙️  Districts: ' + districts.length);
    console.log('🏘️  Neighborhoods: ' + neighborhoods.length);
    console.log('🟢 Active regions: ' + regions.filter(r => r.is_active).length);
    console.log('🔴 Inactive regions: ' + regions.filter(r => !r.is_active).length);
    console.log('📍 Total regions: ' + regions.length);
    console.log('');
    
    console.log('📋 GOVERNORATES LIST:');
    govs.sort((a, b) => a.name.localeCompare(b.name)).forEach(gov => {
      const govDistricts = districts.filter(d => d.governorate_id === gov.id);
      const govNeighborhoods = neighborhoods.filter(n => n.governorate_id === gov.id);
      const status = gov.is_active ? '🟢' : '🔴';
      console.log(`  ${status} ${gov.name} (${gov.name_ar}) - ${govDistricts.length} districts, ${govNeighborhoods.length} neighborhoods`);
    });
    
  } else {
    console.log('❌ Could not find regions data');
  }
} catch(e) {
  console.log('❌ Error:', e.message);
}
