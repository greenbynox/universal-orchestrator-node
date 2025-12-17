
import { nodeManager } from './src/core/NodeManager';
import { blockchainRegistry } from './src/config/blockchains';

async function test() {
  console.log('Registry count:', blockchainRegistry.count());
  console.log('Beam supported:', blockchainRegistry.isSupported('beam'));
  
  const beam = blockchainRegistry.get('beam');
  console.log('Beam object:', beam ? 'Found' : 'Not Found');

  // Mock a node config
  const nodeId = 'beam-test';
  // We need to hack into nodeManager to add a node without creating files
  // Or we can just use the public API if we can
  
  // Let's just check if we can retrieve the chain using the same logic as NodeManager
  const chain = blockchainRegistry.get('beam');
  if (!chain) {
    console.error('Blockchain definition not found for beam');
  } else {
    console.log('Blockchain definition FOUND for beam');
    console.log('Requirements:', chain.docker?.requirements);
  }
}

test().catch(console.error);
