#!/usr/bin/env node

import { CodeReviewAgent } from './agent';
import * as path from 'path';

async function main() {
  console.log('🔍 Starting Code Review...\n');

  const configPath = process.argv[2] || path.join(__dirname, 'config.json');
  
  const agent = new CodeReviewAgent(configPath);
  
  try {
    const results = await agent.reviewAll();
    await agent.saveReport(results);
    
    console.log('\n✅ Code Review completed successfully!');
    
    // 如果有高优先级问题，退出码为 1
    const hasHighSeverity = results.some(r => 
      r.issues.some(i => i.severity === 'high')
    );
    
    if (hasHighSeverity) {
      console.log('\n⚠️  High severity issues found!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during code review:', error);
    process.exit(1);
  }
}

main();
