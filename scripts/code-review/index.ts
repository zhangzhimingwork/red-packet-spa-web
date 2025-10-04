#!/usr/bin/env node

// 禁用 Mastra telemetry 警告
(globalThis as any).___MASTRA_TELEMETRY___ = true;

// 首先加载 .env 文件
import dotenv from 'dotenv';
import { CodeReviewAgent } from './agent';
import { EnhancedCodeReviewAgent } from './enhanced-agent';
import * as path from 'path';

// 加载 .env 文件
dotenv.config();

async function main() {
  console.log('🔍 Starting Code Review...\n');

  // 检查 API Key
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (!hasOpenAI && !hasAnthropic) {
    console.error('❌ Error: No API Key found!');
    console.error('\nPlease set one of the following environment variables:');
    console.error('  - OPENAI_API_KEY (for OpenAI GPT models)');
    console.error('  - ANTHROPIC_API_KEY (for Anthropic Claude models)');
    console.error('\nYou can set them in:');
    console.error('  1. .env file (recommended)');
    console.error('  2. Environment variables: export OPENAI_API_KEY=sk-...');
    console.error('\nExample .env file:');
    console.error('  OPENAI_API_KEY=sk-your-key-here\n');
    process.exit(1);
  }

  console.log(`🤖 Using AI Provider: ${hasOpenAI ? 'OpenAI' : 'Anthropic'}\n`);

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
