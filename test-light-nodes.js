// Test node creation with light mode
const { NodeManager } = require('./dist/core/NodeManager');
const { blockchainRegistry } = require('./dist/config/blockchains/index');

(async () => {
  try {
    const nodeManager = new NodeManager();
    
    console.log('\nTesting node creation with wemix (light mode)...\n');
    
    // Check if wemix exists
    const wemix = blockchainRegistry.get('wemix');
    if (!wemix) {
      console.log('❌ wemix NOT found in registry');
      process.exit(1);
    }
    
    console.log(`✅ wemix found: ${wemix.name}`);

    // Try to create a node with light mode
    console.log('\nAttempting to create wemix light node...\n');
    const node = await nodeManager.createNode({
      name: 'test-wemix-light',
      blockchain: 'wemix',
      mode: 'light'
    });
    
    console.log('✅ Node created successfully!');
    console.log(`   Node ID: ${node.config.id}`);
    console.log(`   Node name: ${node.config.name}`);
    console.log(`   Blockchain: ${node.config.blockchain}`);
    console.log(`   Mode: ${node.config.mode}`);
    console.log(`   Status: ${node.status}`);
    
    // Test with sei as well
    console.log('\n\nTesting node creation with sei (light mode)...\n');
    const sei = blockchainRegistry.get('sei');
    if (!sei) {
      console.log('❌ sei NOT found in registry');
      process.exit(1);
    }
    
    console.log(`✅ sei found: ${sei.name}`);
    
    const node2 = await nodeManager.createNode({
      name: 'test-sei-light',
      blockchain: 'sei',
      mode: 'light'
    });
    
    console.log('✅ sei Node created successfully!');
    console.log(`   Node ID: ${node2.config.id}`);
    console.log(`   Blockchain: ${node2.config.blockchain}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
})();
