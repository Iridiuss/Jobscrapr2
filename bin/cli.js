#!/usr/bin/env node

const dispatcher = require('../src/dispatcher');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      options[key] = value;
    }
  }

  try {
    const results = await dispatcher.scrapeJobs(options);
    console.log(JSON.stringify(results, null, 2));

    // Save results to output folder
    const outputDir = path.resolve(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const safeCompany = (options.company || 'results').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeJob = (options.job || 'all').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outFile = path.join(outputDir, `jobs_${safeCompany}_${safeJob}.json`);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    console.log(`\n[Output] Results saved to ${outFile}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
