// Check if nodes were created
const { NodeManager } = require('./dist/core/NodeManager');

(async () => {
  try {
    const nodeManager = new NodeManager();
    const nodes = nodeManager.getAllNodes();
    
    console.log(`\nTotal nodes: ${nodes.length}`);
    nodes.forEach(node => {
      console.log(`  - ${node.id}: ${node.config.blockchain} (${node.config.mode})`);
    });
    
    // Check for wemix and sei
    const wemixNode = nodes.find(n => n.config.blockchain === 'wemix');
    const seiNode = nodes.find(n => n.config.blockchain === 'sei');
    
    if (wemixNode) {
      console.log(`\n✅ WEMIX node found!`);
      console.log(`   ID: ${wemixNode.id}`);
      console.log(`   Name: ${wemixNode.config.name}`);
      console.log(`   Mode: ${wemixNode.config.mode}`);
    }
    
    if (seiNode) {
      console.log(`\n✅ SEI node found!`);
      console.log(`   ID: ${seiNode.id}`);
      console.log(`   Name: ${seiNode.config.name}`);
      console.log(`   Mode: ${seiNode.config.mode}`);
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
})();
