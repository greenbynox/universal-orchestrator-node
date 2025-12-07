import { getSystemResources } from './src/utils/system';

async function test() {
  try {
    console.log('Calling getSystemResources...');
    const result = await getSystemResources();
    console.log('Result type:', typeof result);
    console.log('Result keys:', Object.keys(result));
    console.log('Full result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

test();
