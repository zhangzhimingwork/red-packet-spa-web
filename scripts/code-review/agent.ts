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
    const modelName = this.config.aiModel || 'gpt-4o-mini';
    
    this.mastra = new Mastra({
      agents: {
        codeReviewer: new Agent({
          name: 'code-reviewer',
          instructions: this.getReviewInstructions(),
          model: openai(modelName),
        }),
      },
    });

    this.agent = this.mastra.getAgent('codeReviewer') as any;
  }

  private loadConfig(configPath: string): CodeReviewConfig {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  private getReviewInstructions(): string {
    return `You are a code review expert. Analyze code and return ONLY a JSON array of issues found.

Format:
[
  {"type":"code-quality","severity":"medium","line":10,"message":"Variable name too short","suggestion":"Use descriptive names"}
]

If no issues, return: []`;
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
      const response = await this.agent.generate(`Review this code:\n\nFile: ${relPath}\n\`\`\`\n${content}\n\`\`\``);
      
      let issues: ReviewIssue[] = [];
      const text = response.text;
      
      // 尝试解析 JSON
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          issues = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn(`JSON parse failed for ${relPath}`);
        }
      }
      
      // 如果没有结构化数据，将整个响应作为 issue
      if (issues.length === 0 && text.trim() && text.trim() !== '[]') {
        issues = [{
          type: 'ai-feedback',
          severity: 'medium',
          message: text.trim()
        }];
      }

      return { file: relPath, issues };
    } catch (error) {
      return {
        file: relPath,
        issues: [{ type: 'error', severity: 'high', message: `Failed: ${error}` }]
      };
    }
  }

  async reviewAll(): Promise<ReviewResult[]> {
    const files = await this.scanFiles();
    console.log(`\n📁 Found ${files.length} files\n`);

    const results: ReviewResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const relPath = path.relative(process.cwd(), files[i]);
      console.log(`[${i + 1}/${files.length}] ${relPath}`);
      
      const result = await this.reviewFile(files[i]);
      results.push(result);
      console.log(result.issues.length ? `  ⚠️  ${result.issues.length} issues` : `  ✅ Clean`);
    }
    return results;
  }

  generateReport(results: ReviewResult[]): string {
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const high = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0);
    const med = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'medium').length, 0);
    const low = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'low').length, 0);
    
    let report = `# Code Review Report\n\nGenerated: ${new Date().toLocaleString()}\n\n`;
    report += `## Summary\n\n- Files: ${results.length}\n- Issues: ${totalIssues} (🔴 ${high} | 🟡 ${med} | 🟢 ${low})\n\n`;

    for (const severity of ['high', 'medium', 'low']) {
      const icon = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
      const issues = results.flatMap(r => 
        r.issues.filter(i => i.severity === severity).map(i => ({ ...i, file: r.file }))
      );
      
      if (issues.length > 0) {
        report += `## ${icon} ${severity.toUpperCase()}\n\n`;
        for (const issue of issues) {
          report += `**${issue.file}** - ${issue.type}\n`;
          report += `- ${issue.message}\n`;
          if (issue.suggestion) report += `- Fix: ${issue.suggestion}\n`;
          report += `\n`;
        }
      }
    }

    return report;
  }

  async saveReport(results: ReviewResult[]): Promise<void> {
    const report = this.generateReport(results);
    const dir = this.config.outputPath;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = path.join(dir, `review-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(file, report);
    fs.writeFileSync(path.join(dir, 'latest.md'), report);
    console.log(`\n📄 ${file}`);
  }
}

export { CodeReviewAgent, CodeReviewConfig, ReviewResult, ReviewIssue };
