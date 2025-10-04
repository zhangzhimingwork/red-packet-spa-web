import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface CodeReviewConfig {
  scanPatterns: string[];
  excludePatterns: string[];
  reviewRules: {
    checkCodeQuality: boolean;
    checkSecurity: boolean;
    checkPerformance: boolean;
    checkBestPractices: boolean;
    checkTypeScript: boolean;
    checkReactPatterns: boolean;
  };
  outputFormat: string;
  outputPath: string;
  aiProvider?: 'ANTHROPIC' | 'OPENAI';
  aiModel?: string;
}

interface ReviewIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  line?: number;
  message: string;
  suggestion?: string;
}

interface ReviewResult {
  file: string;
  issues: ReviewIssue[];
}

class CodeReviewAgent {
  private mastra: Mastra;
  private agent: Agent;
  private config: CodeReviewConfig;

  constructor(configPath: string) {
    this.config = this.loadConfig(configPath);
    
    // 从环境变量或配置文件获取 AI 提供商
    const provider = this.config.aiProvider || 
                     (process.env.OPENAI_API_KEY ? 'OPENAI' : 'ANTHROPIC');
    
    // 根据提供商选择模型
    const modelName = this.config.aiModel || this.getDefaultModel(provider);
    
    // 构建完整的模型配置
    const modelConfig: any = {
      provider: provider,
      name: modelName,
    };
    
    // 为 OpenAI 添加必要的配置
    if (provider === 'OPENAI') {
      modelConfig.apiKey = process.env.OPENAI_API_KEY;
    } else if (provider === 'ANTHROPIC') {
      modelConfig.apiKey = process.env.ANTHROPIC_API_KEY;
    }
    
    // 初始化 Mastra 实例
    this.mastra = new Mastra({
      agents: {
        codeReviewer: new Agent({
          name: 'code-reviewer',
          instructions: this.getReviewInstructions(),
          model: modelConfig,
        }),
      },
    });

    // 获取 agent 实例
    this.agent = this.mastra.getAgent('codeReviewer');
  }

  private getDefaultModel(provider: 'ANTHROPIC' | 'OPENAI'): string {
    switch (provider) {
      case 'OPENAI':
        return 'gpt-4o';
      case 'ANTHROPIC':
        return 'claude-sonnet-4-5-20250929';
      default:
        return 'gpt-4o';
    }
  }

  private loadConfig(configPath: string): CodeReviewConfig {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile);
  }

  private getReviewInstructions(): string {
    const rules = this.config.reviewRules;
    let instructions = `You are a professional code review expert. Please carefully review the provided code and provide detailed feedback.

Review Focus Areas:
`;

    if (rules.checkCodeQuality) {
      instructions += `- Code Quality: Check code readability, maintainability, and cleanliness\n`;
    }
    if (rules.checkSecurity) {
      instructions += `- Security: Identify potential security vulnerabilities and risks\n`;
    }
    if (rules.checkPerformance) {
      instructions += `- Performance: Find performance bottlenecks and optimization opportunities\n`;
    }
    if (rules.checkBestPractices) {
      instructions += `- Best Practices: Ensure industry best practices are followed\n`;
    }
    if (rules.checkTypeScript) {
      instructions += `- TypeScript: Check type safety and TypeScript best practices\n`;
    }
    if (rules.checkReactPatterns) {
      instructions += `- React Patterns: Review React component design and Hooks usage\n`;
    }

    instructions += `
Please return the review results in JSON array format with the following fields:
[
  {
    "type": "issue type (e.g., security, performance, code-quality, best-practice)",
    "severity": "high | medium | low",
    "line": "line number (optional)",
    "message": "detailed issue description",
    "suggestion": "improvement suggestion"
  }
]

Return ONLY the JSON array, no other text.`;

    return instructions;
  }

  async scanFiles(): Promise<string[]> {
    const files: string[] = [];
    
    for (const pattern of this.config.scanPatterns) {
      const matchedFiles = await glob(pattern, {
        ignore: this.config.excludePatterns,
        absolute: true,
      });
      files.push(...matchedFiles);
    }

    return [...new Set(files)];
  }

  async reviewFile(filePath: string): Promise<ReviewResult> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const relPath = path.relative(process.cwd(), filePath);

    const prompt = `Please review the following file:

File: ${relPath}
File name: ${fileName}

Code:
\`\`\`
${content}
\`\`\`

Provide a detailed code review with specific issues and suggestions.`;

    try {
      const response = await this.agent.generate(prompt);
      
      let issues: ReviewIssue[] = [];
      
      try {
        // 尝试从响应中提取 JSON
        const text = response.text;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          issues = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          // 如果没有找到 JSON 数组，尝试找到对象
          const objMatch = text.match(/\{[\s\S]*\}/);
          if (objMatch) {
            const parsed = JSON.parse(objMatch[0]);
            issues = [parsed];
          } else {
            // 如果完全无法解析，创建一个通用反馈
            issues = [{
              type: 'review-feedback',
              severity: 'medium',
              message: text,
              suggestion: 'Review the AI feedback above',
            }];
          }
        }
      } catch (parseError) {
        console.warn(`Failed to parse JSON from response for ${filePath}:`, parseError);
        issues = [{
          type: 'parse-error',
          severity: 'low',
          message: `Unable to parse structured review. Raw feedback: ${response.text.substring(0, 200)}...`,
        }];
      }

      return {
        file: relPath,
        issues: issues.filter(issue => 
          issue.type && issue.severity && issue.message
        ),
      };
    } catch (error) {
      console.error(`Error reviewing file ${filePath}:`, error);
      return {
        file: relPath,
        issues: [{
          type: 'error',
          severity: 'high',
          message: `Review failed: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  }

  async reviewAll(): Promise<ReviewResult[]> {
    const files = await this.scanFiles();
    console.log(`\n📁 Found ${files.length} files to review...\n`);

    const results: ReviewResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = path.relative(process.cwd(), file);
      console.log(`[${i + 1}/${files.length}] Reviewing: ${relPath}`);
      
      const result = await this.reviewFile(file);
      results.push(result);
      
      // 显示当前文件的问题数
      if (result.issues.length > 0) {
        console.log(`  ⚠️  Found ${result.issues.length} issue(s)`);
      } else {
        console.log(`  ✅ No issues found`);
      }
    }

    return results;
  }

  generateReport(results: ReviewResult[]): string {
    let report = '# Code Review Report\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const highSeverity = results.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'high').length, 0
    );
    const mediumSeverity = results.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'medium').length, 0
    );
    const lowSeverity = results.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'low').length, 0
    );
    
    report += `## Summary\n\n`;
    report += `- Files reviewed: ${results.length}\n`;
    report += `- Total issues found: ${totalIssues}\n`;
    report += `  - 🔴 High: ${highSeverity}\n`;
    report += `  - 🟡 Medium: ${mediumSeverity}\n`;
    report += `  - 🟢 Low: ${lowSeverity}\n\n`;

    // 按严重程度分类
    if (highSeverity > 0) {
      report += `## 🔴 High Severity Issues\n\n`;
      for (const result of results) {
        const highIssues = result.issues.filter(i => i.severity === 'high');
        if (highIssues.length > 0) {
          report += `### ${result.file}\n\n`;
          for (const issue of highIssues) {
            report += `**${issue.type}**`;
            if (issue.line) report += ` (Line ${issue.line})`;
            report += `\n- Problem: ${issue.message}\n`;
            if (issue.suggestion) report += `- Suggestion: ${issue.suggestion}\n`;
            report += `\n`;
          }
        }
      }
    }

    if (mediumSeverity > 0) {
      report += `## 🟡 Medium Severity Issues\n\n`;
      for (const result of results) {
        const mediumIssues = result.issues.filter(i => i.severity === 'medium');
        if (mediumIssues.length > 0) {
          report += `### ${result.file}\n\n`;
          for (const issue of mediumIssues) {
            report += `**${issue.type}**`;
            if (issue.line) report += ` (Line ${issue.line})`;
            report += `\n- Problem: ${issue.message}\n`;
            if (issue.suggestion) report += `- Suggestion: ${issue.suggestion}\n`;
            report += `\n`;
          }
        }
      }
    }

    if (lowSeverity > 0) {
      report += `## 🟢 Low Severity Issues\n\n`;
      for (const result of results) {
        const lowIssues = result.issues.filter(i => i.severity === 'low');
        if (lowIssues.length > 0) {
          report += `### ${result.file}\n\n`;
          for (const issue of lowIssues) {
            report += `**${issue.type}**`;
            if (issue.line) report += ` (Line ${issue.line})`;
            report += `\n- Problem: ${issue.message}\n`;
            if (issue.suggestion) report += `- Suggestion: ${issue.suggestion}\n`;
            report += `\n`;
          }
        }
      }
    }

    // 列出没有问题的文件
    const cleanFiles = results.filter(r => r.issues.length === 0);
    if (cleanFiles.length > 0) {
      report += `## ✅ Clean Files (No Issues)\n\n`;
      for (const result of cleanFiles) {
        report += `- ${result.file}\n`;
      }
      report += `\n`;
    }

    return report;
  }

  async saveReport(results: ReviewResult[]): Promise<void> {
    const report = this.generateReport(results);
    const outputDir = this.config.outputPath;
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `code-review-${timestamp}.md`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, report);
    console.log(`\n📄 Report saved to: ${filePath}`);

    // 同时保存一个 latest.md
    const latestPath = path.join(outputDir, 'latest.md');
    fs.writeFileSync(latestPath, report);
    console.log(`📄 Latest report saved to: ${latestPath}`);
  }
}

export { CodeReviewAgent, CodeReviewConfig, ReviewResult, ReviewIssue };
