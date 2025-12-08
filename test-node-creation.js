// Test node creation
const { NodeManager } = require('./dist/core/NodeManager');
const { blockchainRegistry } = require('./dist/config/blockchains/index');

(async () => {
  try {
    const nodeManager = new NodeManager();
    
    console.log('\nTesting node creation with wemix...\n');
    
    // Test 1: Check if wemix exists in registry
    const wemix = blockchainRegistry.get('wemix');
    if (wemix) {
      console.log('✅ wemix found in registry');
      console.log(`   Full config: ${JSON.stringify(wemix, null, 2)}`);
    } else {
      console.log('❌ wemix NOT found in registry');
      process.exit(1);
    }

    // Test 2: Try to create a node
    console.log('\nAttempting to create wemix node...\n');
    const node = await nodeManager.createNode({
      name: 'test-wemix',
      blockchain: 'wemix',
      mode: 'full'
    });
    
    console.log('✅ Node created successfully!');
    console.log(`   Node ID: ${node.config.id}`);
    console.log(`   Node name: ${node.config.name}`);
    console.log(`   Blockchain: ${node.config.blockchain}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
})();
