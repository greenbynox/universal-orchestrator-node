// Check which blockchains are missing docker config
const { blockchainRegistry } = require('./dist/config/blockchains/index');

const allBlockchains = blockchainRegistry.getAll();
const missingDocker = allBlockchains.filter(bc => !bc.docker);

console.log(`\nTotal blockchains: ${allBlockchains.length}`);
console.log(`Missing docker config: ${missingDocker.length}`);
console.log(`\nBlockchains without docker:\n`);

missingDocker.forEach(bc => {
  console.log(`  - ${bc.id} (${bc.name}) [${bc.category}]`);
});

console.log(`\n\nGrouped by category:`);
const byCategory = {};
missingDocker.forEach(bc => {
  if (!byCategory[bc.category]) byCategory[bc.category] = [];
  byCategory[bc.category].push(bc.id);
});

Object.keys(byCategory).sort().forEach(cat => {
  console.log(`  ${cat}: ${byCategory[cat].join(', ')}`);
});
