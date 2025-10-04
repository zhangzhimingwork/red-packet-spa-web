#!/usr/bin/env node

import { CodeReviewAgent } from './agent';
import { EnhancedCodeReviewAgent } from './enhanced-agent';
import * as path from 'path';

async function main() {
  console.log('🔍 Starting Code Review...\n');

  const configPath = process.argv[2] || path.join(__dirname, 'config.json');
  const useEnhanced = process.argv.includes('--enhanced') || process.argv.includes('-e');
  
  if (useEnhanced) {
    console.log('🚀 Using Enhanced Code Review Agent with Mastra Tools\n');
    const agent = new EnhancedCodeReviewAgent(configPath);
    
    try {
      const results = await agent.reviewAll();
      await agent.saveReport(results);
      
      console.log('\n✅ Enhanced Code Review completed successfully!');
      
      const hasHighSeverity = results.some(r => 
        r.issues.some(i => i.severity === 'high')
      );
      
      if (hasHighSeverity) {
        console.log('\n⚠️  High severity issues found!');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Error during enhanced code review:', error);
      process.exit(1);
    }
  } else {
    console.log('📝 Using Standard Code Review Agent\n');
    const agent = new CodeReviewAgent(configPath);
    
    try {
      const results = await agent.reviewAll();
      await agent.saveReport(results);
      
      console.log('\n✅ Code Review completed successfully!');
      
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
}

main();
