import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
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
    
    const provider = this.config.aiProvider || 
                     (process.env.OPENAI_API_KEY ? 'OPENAI' : 'ANTHROPIC');
    
    const modelName = this.config.aiModel || this.getDefaultModel(provider);
    
    // 使用 AI SDK 方式配置模型
    const model = provider === 'OPENAI' 
      ? openai(modelName)
      : { provider: 'ANTHROPIC', name: modelName, apiKey: process.env.ANTHROPIC_API_KEY };
    
    this.mastra = new Mastra({
      agents: {
        codeReviewer: new Agent({
          name: 'code-reviewer',
          instructions: this.getReviewInstructions(),
          model: model,
        }),
      },
    });

    this.agent = this.mastra.getAgent('codeReviewer');
  }

  private getDefaultModel(provider: 'ANTHROPIC' | 'OPENAI'): string {
    return provider === 'OPENAI' ? 'gpt-4o' : 'claude-sonnet-4-5-20250929';
  }

  private loadConfig(configPath: string): CodeReviewConfig {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  private getReviewInstructions(): string {
    const rules = this.config.reviewRules;
    let instructions = `You are a professional code review expert. Review the provided code and provide detailed feedback.

Review Focus Areas:
`;

    if (rules.checkCodeQuality) instructions += `- Code Quality\n`;
    if (rules.checkSecurity) instructions += `- Security\n`;
    if (rules.checkPerformance) instructions += `- Performance\n`;
    if (rules.checkBestPractices) instructions += `- Best Practices\n`;
    if (rules.checkTypeScript) instructions += `- TypeScript\n`;
    if (rules.checkReactPatterns) instructions += `- React Patterns\n`;

    instructions += `
Return results as JSON array:
[{"type":"issue-type","severity":"high|medium|low","line":number,"message":"description","suggestion":"fix"}]

Return ONLY the JSON array.`;

    return instructions;
  }

  async scanFiles(): Promise<string[]> {
    const files: string[] = [];
    for (const pattern of this.config.scanPatterns) {
      files.push(...await glob(pattern, { ignore: this.config.excludePatterns, absolute: true }));
    }
    return [...new Set(files)];
  }

  async reviewFile(filePath: string): Promise<ReviewResult> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relPath = path.relative(process.cwd(), filePath);

    try {
      const response = await this.agent.generate(`Review file: ${relPath}\n\n\`\`\`\n${content}\n\`\`\``);
      
      let issues: ReviewIssue[] = [];
      try {
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          issues = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        issues = [{ type: 'review-feedback', severity: 'medium', message: response.text.substring(0, 200) }];
      }

      return { file: relPath, issues: issues.filter(i => i.type && i.severity && i.message) };
    } catch (error) {
      return {
        file: relPath,
        issues: [{ type: 'error', severity: 'high', message: `Review failed: ${error instanceof Error ? error.message : String(error)}` }]
      };
    }
  }

  async reviewAll(): Promise<ReviewResult[]> {
    const files = await this.scanFiles();
    console.log(`\n📁 Found ${files.length} files to review...\n`);

    const results: ReviewResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const relPath = path.relative(process.cwd(), files[i]);
      console.log(`[${i + 1}/${files.length}] Reviewing: ${relPath}`);
      
      const result = await this.reviewFile(files[i]);
      results.push(result);
      console.log(result.issues.length > 0 ? `  ⚠️  Found ${result.issues.length} issue(s)` : `  ✅ No issues found`);
    }
    return results;
  }

  generateReport(results: ReviewResult[]): string {
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const highSeverity = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0);
    
    let report = `# Code Review Report\n\nGenerated: ${new Date().toLocaleString()}\n\n`;
    report += `## Summary\n\n- Files reviewed: ${results.length}\n- Total issues: ${totalIssues}\n`;
    
    // Add issues by severity...
    return report;
  }

  async saveReport(results: ReviewResult[]): Promise<void> {
    const report = this.generateReport(results);
    const outputDir = this.config.outputPath;
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, `code-review-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(filePath, report);
    console.log(`\n📄 Report saved to: ${filePath}`);
  }
}

export { CodeReviewAgent, CodeReviewConfig, ReviewResult, ReviewIssue };
