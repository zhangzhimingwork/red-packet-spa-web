#!/usr/bin/env node

// 禁用 Mastra telemetry 警告
(globalThis as any).___MASTRA_TELEMETRY___ = true;

import dotenv from 'dotenv';
import { CodeReviewAgent } from './agent';
import * as path from 'path';

dotenv.config();

async function main() {
  console.log('🔍 Starting Code Review...\n');

  // 检查是否有 Groq API Key
  const hasGroq = !!process.env.GROQ_API_KEY;
  
  if (!hasGroq) {
    console.error('❌ 错误: 未找到 GROQ_API_KEY!');
    console.error('\n请在 .env 文件中设置:');
    console.error('  GROQ_API_KEY=gsk_your_key_here\n');
    console.error('获取免费 API Key: https://console.groq.com/\n');
    process.exit(1);
  }

  console.log('🤖 使用 Groq AI (免费)\n');

  // 过滤掉选项参数，只取配置文件路径
  const args = process.argv.slice(2).filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
  const configPath = args[0] || path.join(__dirname, 'config.json');
  
  const useEnhanced = process.argv.includes('--enhanced') || process.argv.includes('-e');
  const exitOnError = process.argv.includes('--strict');
  
  console.log('📝 标准审查模式\n');
    const agent = new CodeReviewAgent(configPath);
    
    try {
      const results = await agent.reviewAll();
      await agent.saveReport(results);
      
      console.log('\n✅ 审查完成!');
      
      const hasHighSeverity = results.some(r => 
        r.issues.some(i => i.severity === 'high')
      );
      
      if (hasHighSeverity) {
        console.log('\n⚠️  发现高危问题!');
        if (exitOnError) process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ 审查失败:', error);
      process.exit(1);
    }
}

main();
