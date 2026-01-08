
import { blockchainRegistry } from './src/config/blockchains';

console.log('Total chains:', blockchainRegistry.count());
console.log('Wemix supported:', blockchainRegistry.isSupported('wemix'));
console.log('Beam supported:', blockchainRegistry.isSupported('beam'));

const wemix = blockchainRegistry.get('wemix');
console.log('Wemix details:', wemix ? wemix.id : 'undefined');

const beam = blockchainRegistry.get('beam');
console.log('Beam details:', beam ? beam.id : 'undefined');
