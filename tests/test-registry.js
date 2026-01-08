// Simple test to verify blockchain registry
const { blockchainRegistry, TOTAL_SUPPORTED_CHAINS } = require('./dist/config/blockchains/index');

console.log(`\nTotal blockchains loaded: ${TOTAL_SUPPORTED_CHAINS}`);

// Check wemix
const wemix = blockchainRegistry.get('wemix');
if (wemix) {
  console.log(`\n✅ wemix found!`);
  console.log(`  ID: ${wemix.id}`);
  console.log(`  Name: ${wemix.name}`);
  console.log(`  Category: ${wemix.category}`);
  console.log(`  Chain ID: ${wemix.chainId}`);
  console.log(`  IsActive: ${wemix.isActive}`);
} else {
  console.log(`\n❌ wemix NOT found!`);
}

// Check sei
const sei = blockchainRegistry.get('sei');
if (sei) {
  console.log(`\n✅ sei found!`);
  console.log(`  ID: ${sei.id}`);
  console.log(`  Name: ${sei.name}`);
} else {
  console.log(`\n❌ sei NOT found!`);
}

// List all IDs
const allIds = blockchainRegistry.listIds();
console.log(`\nAll blockchain IDs (first 20):`);
allIds.slice(0, 20).forEach(id => console.log(`  - ${id}`));

if (allIds.includes('wemix')) {
  console.log(`\n✅ wemix is in the registry list`);
} else {
  console.log(`\n❌ wemix is NOT in the registry list`);
}

console.log(`\nTotal IDs in registry: ${allIds.length}`);
