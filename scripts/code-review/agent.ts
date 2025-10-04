import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
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
  language?: 'zh-CN' | 'en-US';
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
  private config: CodeReviewConfig;
  private model: any;

  constructor(configPath: string) {
    this.config = this.loadConfig(configPath);
    const modelName = this.config.aiModel || 'llama-3.3-70b-versatile';
    this.model = groq(modelName);
  }

  private loadConfig(configPath: string): CodeReviewConfig {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  private getPrompt(filePath: string, content: string): string {
    const lang = this.config.language || 'zh-CN';
    
    if (lang === 'zh-CN') {
      return `你是一位专业的代码审查专家。请分析以下代码并仅返回 JSON 数组格式的问题列表。

文件: ${filePath}

\`\`\`
${content}
\`\`\`

格式要求（仅返回此 JSON，不要有其他内容）：
[{"type":"问题类型","severity":"high|medium|low","message":"问题描述","suggestion":"修复建议"}]

如无问题则返回: []`;
    } else {
      return `You are a code review expert. Analyze this code and return ONLY a JSON array of issues.

File: ${filePath}

\`\`\`
${content}
\`\`\`

Format (return ONLY this JSON, nothing else):
[{"type":"issue-type","severity":"high|medium|low","message":"description","suggestion":"fix"}]

If no issues: []`;
    }
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
      const { text } = await generateText({
        model: this.model,
        prompt: this.getPrompt(relPath, content),
      });
      
      let issues: ReviewIssue[] = [];
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      
      if (jsonMatch) {
        try {
          issues = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn(`Parse failed: ${relPath}`);
        }
      }
      
      if (issues.length === 0 && text.trim() && text.trim() !== '[]') {
        issues = [{ type: 'feedback', severity: 'medium', message: text.trim().substring(0, 300) }];
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
    console.log(`\n📁 ${files.length} files\n`);

    const results: ReviewResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const relPath = path.relative(process.cwd(), files[i]);
      console.log(`[${i + 1}/${files.length}] ${relPath}`);
      
      const result = await this.reviewFile(files[i]);
      results.push(result);
      console.log(result.issues.length ? `  ⚠️  ${result.issues.length}` : `  ✅`);
    }
    return results;
  }

  generateReport(results: ReviewResult[]): string {
    const lang = this.config.language || 'zh-CN';
    const total = results.reduce((s, r) => s + r.issues.length, 0);
    const high = results.reduce((s, r) => s + r.issues.filter(i => i.severity === 'high').length, 0);
    const med = results.reduce((s, r) => s + r.issues.filter(i => i.severity === 'medium').length, 0);
    const low = results.reduce((s, r) => s + r.issues.filter(i => i.severity === 'low').length, 0);
    
    const title = lang === 'zh-CN' ? '代码审查报告' : 'Code Review Report';
    const filesLabel = lang === 'zh-CN' ? '文件' : 'files';
    const issuesLabel = lang === 'zh-CN' ? '问题' : 'issues';
    const fixLabel = lang === 'zh-CN' ? '修复建议' : 'Fix';
    
    let report = `# ${title}\n\n${new Date().toLocaleString()}\n\n`;
    report += `**${results.length} ${filesLabel}** | **${total} ${issuesLabel}** (🔴${high} 🟡${med} 🟢${low})\n\n`;

    const severityLabels = {
      high: lang === 'zh-CN' ? '高危' : 'HIGH',
      medium: lang === 'zh-CN' ? '中等' : 'MEDIUM',
      low: lang === 'zh-CN' ? '低危' : 'LOW'
    };

    for (const sev of ['high', 'medium', 'low'] as const) {
      const icon = sev === 'high' ? '🔴' : sev === 'medium' ? '🟡' : '🟢';
      const items = results.flatMap(r => 
        r.issues.filter(i => i.severity === sev).map(i => ({ ...i, file: r.file }))
      );
      
      if (items.length > 0) {
        report += `## ${icon} ${severityLabels[sev]}\n\n`;
        for (const item of items) {
          report += `**${item.file}**\n- ${item.message}\n`;
          if (item.suggestion) report += `- ${fixLabel}: ${item.suggestion}\n`;
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

    const file = path.join(dir, `review-${Date.now()}.md`);
    fs.writeFileSync(file, report);
    fs.writeFileSync(path.join(dir, 'latest.md'), report);
    console.log(`\n📄 ${file}`);
  }
}

export { CodeReviewAgent, CodeReviewConfig, ReviewResult, ReviewIssue };
