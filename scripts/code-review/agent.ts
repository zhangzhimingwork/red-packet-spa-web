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
}

interface ReviewResult {
  file: string;
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    line?: number;
    message: string;
    suggestion?: string;
  }>;
}

class CodeReviewAgent {
  private mastra: Mastra;
  private agent: Agent;
  private config: CodeReviewConfig;

  constructor(configPath: string) {
    this.config = this.loadConfig(configPath);
    this.mastra = new Mastra({
      agents: [],
    });

    this.agent = new Agent({
      name: 'code-reviewer',
      instructions: this.getReviewInstructions(),
      model: {
        provider: 'ANTHROPIC',
        name: 'claude-sonnet-4-5-20250929',
        toolChoice: 'auto',
      },
    });
  }

  private loadConfig(configPath: string): CodeReviewConfig {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile);
  }

  private getReviewInstructions(): string {
    const rules = this.config.reviewRules;
    let instructions = `你是一个专业的代码审查专家。请仔细审查提供的代码，并提供详细的反馈。\n\n审查重点：\n`;

    if (rules.checkCodeQuality) {
      instructions += `- 代码质量：检查代码的可读性、可维护性和整洁度\n`;
    }
    if (rules.checkSecurity) {
      instructions += `- 安全性：识别潜在的安全漏洞和风险\n`;
    }
    if (rules.checkPerformance) {
      instructions += `- 性能：发现性能瓶颈和优化机会\n`;
    }
    if (rules.checkBestPractices) {
      instructions += `- 最佳实践：确保遵循行业最佳实践\n`;
    }
    if (rules.checkTypeScript) {
      instructions += `- TypeScript：检查类型安全和 TypeScript 最佳实践\n`;
    }
    if (rules.checkReactPatterns) {
      instructions += `- React 模式：检查 React 组件设计和 Hooks 使用\n`;
    }

    instructions += `\n请以 JSON 格式返回审查结果，包含以下字段：
    - type: 问题类型
    - severity: 严重程度 (high/medium/low)
    - line: 行号（如果适用）
    - message: 问题描述
    - suggestion: 改进建议`;

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

    const prompt = `请审查以下文件：\n\n文件名: ${fileName}\n\n代码内容：\n\`\`\`\n${content}\n\`\`\`\n\n请提供详细的代码审查反馈。`;

    try {
      const response = await this.agent.generate(prompt);
      
      let issues = [];
      try {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          issues = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {
        // 如果无法解析 JSON，创建一个通用的 issue
        issues = [{
          type: 'general',
          severity: 'medium',
          message: response.text,
        }];
      }

      return {
        file: filePath,
        issues,
      };
    } catch (error) {
      console.error(`Error reviewing file ${filePath}:`, error);
      return {
        file: filePath,
        issues: [{
          type: 'error',
          severity: 'high',
          message: `审查失败: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  }

  async reviewAll(): Promise<ReviewResult[]> {
    const files = await this.scanFiles();
    console.log(`Found ${files.length} files to review...`);

    const results: ReviewResult[] = [];
    
    for (const file of files) {
      console.log(`Reviewing: ${file}`);
      const result = await this.reviewFile(file);
      results.push(result);
    }

    return results;
  }

  generateReport(results: ReviewResult[]): string {
    let report = '# Code Review Report\n\n';
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;
    
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    report += `## 总结\n\n`;
    report += `- 审查文件数: ${results.length}\n`;
    report += `- 发现问题数: ${totalIssues}\n\n`;

    report += `## 详细结果\n\n`;

    for (const result of results) {
      if (result.issues.length === 0) continue;

      report += `### ${result.file}\n\n`;
      
      for (const issue of result.issues) {
        const severityEmoji = {
          high: '🔴',
          medium: '🟡',
          low: '🟢',
        }[issue.severity];

        report += `${severityEmoji} **${issue.type}** (${issue.severity})\n`;
        if (issue.line) {
          report += `- 行号: ${issue.line}\n`;
        }
        report += `- 问题: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `- 建议: ${issue.suggestion}\n`;
        }
        report += `\n`;
      }
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
    console.log(`\nReport saved to: ${filePath}`);

    // 同时保存一个 latest.md
    const latestPath = path.join(outputDir, 'latest.md');
    fs.writeFileSync(latestPath, report);
    console.log(`Latest report saved to: ${latestPath}`);
  }
}

export { CodeReviewAgent, CodeReviewConfig, ReviewResult };
