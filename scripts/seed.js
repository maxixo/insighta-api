import { runSeed } from '../src/services/seedService.js';

async function main() {
  try {
    const summary = await runSeed();
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

void main();
