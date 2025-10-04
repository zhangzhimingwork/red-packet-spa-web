import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { allTools } from './tools';

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
  metrics?: any;
}

/**
 * 增强版 Code Review Agent
 * 使用 Mastra Tools 进行更深入的代码分析
 */
class EnhancedCodeReviewAgent {
  private mastra: Mastra;
  private agent: Agent;
  private config: CodeReviewConfig;

  constructor(configPath: string) {
    this.config = this.loadConfig(configPath);
    
    // 初始化 Mastra 实例，注册所有工具
    this.mastra = new Mastra({
      agents: {
        enhancedReviewer: new Agent({
          name: 'enhanced-code-reviewer',
          instructions: this.getReviewInstructions(),
          model: {
            provider: 'ANTHROPIC',
            name: 'claude-sonnet-4-5-20250929',
            toolChoice: 'auto',
          },
          tools: allTools,
        }),
      },
    });

    this.agent = this.mastra.getAgent('enhancedReviewer');
  }

  private loadConfig(configPath: string): CodeReviewConfig {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile);
  }

  private getReviewInstructions(): string {
    const rules = this.config.reviewRules;
    let instructions = `You are an expert code reviewer with access to specialized analysis tools.

You have the following tools available:
- read-file: Read file contents
- analyze-complexity: Analyze code complexity metrics
- security-check: Check for security vulnerabilities
- type-check: Analyze TypeScript type safety
- react-hooks-check: Verify React Hooks usage

Review Focus Areas:
`;

    if (rules.checkCodeQuality) {
      instructions += `- Code Quality: Use analyze-complexity tool to check metrics\n`;
    }
    if (rules.checkSecurity) {
      instructions += `- Security: Use security-check tool to find vulnerabilities\n`;
    }
    if (rules.checkTypeScript) {
      instructions += `- TypeScript: Use type-check tool for type safety analysis\n`;
    }
    if (rules.checkReactPatterns) {
      instructions += `- React: Use react-hooks-check tool for Hooks validation\n`;
    }

    instructions += `
For each file:
1. Use appropriate tools to analyze the code
2. Combine tool results with your expertise
3. Return findings as JSON array:

[
  {
    "type": "issue-type",
    "severity": "high|medium|low",
    "line": number (optional),
    "message": "detailed description",
    "suggestion": "how to fix"
  }
]

Return ONLY the JSON array.`;

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
    const fileExt = path.extname(filePath).slice(1);

    // 构建包含工具使用指导的 prompt
    const prompt = `Review this file using your available tools:

File: ${relPath}
Type: ${fileExt}

Code:
\`\`\`${fileExt}
${content}
\`\`\`

Instructions:
1. Use analyze-complexity to get code metrics
2. Use security-check to find security issues
${fileExt.includes('ts') ? '3. Use type-check for TypeScript analysis\n' : ''}
${fileExt.includes('tsx') || fileExt.includes('jsx') ? '4. Use react-hooks-check for React patterns\n' : ''}
5. Combine all findings and provide comprehensive review

Return your findings as a JSON array of issues.`;

    try {
      const response = await this.agent.generate(prompt);
      
      let issues: ReviewIssue[] = [];
      let metrics = {};
      
      try {
        const text = response.text;
        const jsonMatch = text.match(/\[[\s\S]*?\]/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          issues = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          const objMatch = text.match(/\{[\s\S]*?\}/);
          if (objMatch) {
            const parsed = JSON.parse(objMatch[0]);
            issues = [parsed];
          }
        }
      } catch (parseError) {
        console.warn(`Failed to parse JSON from response for ${filePath}`);
        issues = [{
          type: 'review-feedback',
          severity: 'medium',
          message: response.text.substring(0, 300),
        }];
      }

      return {
        file: relPath,
        issues: issues.filter(issue => 
          issue.type && issue.severity && issue.message
        ),
        metrics,
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
    console.log(`\n🔧 Enhanced Review: Found ${files.length} files to analyze...\n`);

    const results: ReviewResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = path.relative(process.cwd(), file);
      console.log(`[${i + 1}/${files.length}] 🔍 Analyzing: ${relPath}`);
      
      const result = await this.reviewFile(file);
      results.push(result);
      
      if (result.issues.length > 0) {
        console.log(`  ⚠️  Found ${result.issues.length} issue(s)`);
      } else {
        console.log(`  ✅ No issues found`);
      }
    }

    return results;
  }

  generateReport(results: ReviewResult[]): string {
    let report = '# Enhanced Code Review Report\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Powered by Mastra AI Agent Framework\n\n`;
    
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
    
    report += `## 📊 Summary\n\n`;
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

    const cleanFiles = results.filter(r => r.issues.length === 0);
    if (cleanFiles.length > 0) {
      report += `## ✅ Clean Files (No Issues)\n\n`;
      for (const result of cleanFiles) {
        report += `- ${result.file}\n`;
      }
      report += `\n`;
    }

    report += `---\n\n`;
    report += `*This report was generated using Mastra AI Agent with specialized code analysis tools*\n`;

    return report;
  }

  async saveReport(results: ReviewResult[]): Promise<void> {
    const report = this.generateReport(results);
    const outputDir = this.config.outputPath;
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `enhanced-review-${timestamp}.md`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, report);
    console.log(`\n📄 Enhanced report saved to: ${filePath}`);

    const latestPath = path.join(outputDir, 'latest-enhanced.md');
    fs.writeFileSync(latestPath, report);
    console.log(`📄 Latest enhanced report: ${latestPath}`);
  }
}

export { EnhancedCodeReviewAgent };
