import { createTool } from '@mastra/core';
import * as fs from 'fs';
import { z } from 'zod';

// 文件读取工具
export const readFileTool = createTool({
  id: 'read-file',
  description: 'Read the contents of a file',
  inputSchema: z.object({
    filePath: z.string().describe('Path to the file to read'),
  }),
  execute: async ({ context }) => {
    try {
      const content = fs.readFileSync(context.filePath, 'utf-8');
      return {
        success: true,
        content,
        lines: content.split('\n').length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// 代码复杂度分析工具
export const analyzeComplexityTool = createTool({
  id: 'analyze-complexity',
  description: 'Analyze code complexity metrics',
  inputSchema: z.object({
    code: z.string().describe('Code to analyze'),
  }),
  execute: async ({ context }) => {
    const { code } = context;
    
    const lines = code.split('\n');
    const codeLines = lines.filter(line => 
      line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
    );
    
    const complexity = {
      totalLines: lines.length,
      codeLines: codeLines.length,
      commentLines: lines.length - codeLines.length,
      maxNestingDepth: calculateNestingDepth(code),
      functionCount: (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(|\w+\s*\(/g) || []).length,
      conditionalCount: (code.match(/if\s*\(|switch\s*\(|\?\s*.*:/g) || []).length,
      loopCount: (code.match(/for\s*\(|while\s*\(|do\s*\{|forEach|map\(|filter\(/g) || []).length,
    };
    
    return complexity;
  },
});

function calculateNestingDepth(code: string): number {
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (const char of code) {
    if (char === '{') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === '}') {
      currentDepth--;
    }
  }
  
  return maxDepth;
}

// 安全检查工具
export const securityCheckTool = createTool({
  id: 'security-check',
  description: 'Check for common security issues in code',
  inputSchema: z.object({
    code: z.string().describe('Code to check for security issues'),
    fileType: z.string().describe('File type (ts, tsx, js, jsx)'),
  }),
  execute: async ({ context }) => {
    const { code, fileType } = context;
    const issues: Array<{ type: string; line: number; description: string }> = [];
    
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('eval(')) {
        issues.push({
          type: 'dangerous-function',
          line: index + 1,
          description: 'Use of eval() is dangerous and should be avoided',
        });
      }
      
      if (line.includes('innerHTML')) {
        issues.push({
          type: 'xss-risk',
          line: index + 1,
          description: 'Direct use of innerHTML can lead to XSS vulnerabilities',
        });
      }
      
      if (line.match(/api[_-]?key|secret|password|token/i) && line.includes('=')) {
        if (!line.includes('process.env') && !line.includes('import')) {
          issues.push({
            type: 'hardcoded-secret',
            line: index + 1,
            description: 'Possible hardcoded secret or API key detected',
          });
        }
      }
      
      if (fileType.includes('tsx') || fileType.includes('jsx')) {
        if (line.includes('dangerouslySetInnerHTML')) {
          issues.push({
            type: 'xss-risk',
            line: index + 1,
            description: 'Use of dangerouslySetInnerHTML can lead to XSS vulnerabilities',
          });
        }
      }
    });
    
    return {
      issuesFound: issues.length,
      issues,
    };
  },
});

// TypeScript 类型检查工具
export const typeCheckTool = createTool({
  id: 'type-check',
  description: 'Check TypeScript type usage and safety',
  inputSchema: z.object({
    code: z.string().describe('TypeScript code to analyze'),
  }),
  execute: async ({ context }) => {
    const { code } = context;
    const issues: Array<{ type: string; line: number; description: string }> = [];
    
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      if (line.match(/:\s*any\b/)) {
        issues.push({
          type: 'type-safety',
          line: index + 1,
          description: 'Use of "any" type bypasses type checking',
        });
      }
      
      if (line.includes('@ts-ignore')) {
        issues.push({
          type: 'type-safety',
          line: index + 1,
          description: 'Use of @ts-ignore suppresses TypeScript errors',
        });
      }
      
      if (line.includes('as any')) {
        issues.push({
          type: 'type-safety',
          line: index + 1,
          description: 'Type assertion to "any" bypasses type checking',
        });
      }
    });
    
    return {
      issuesFound: issues.length,
      issues,
      hasTypeAnnotations: code.includes(': '),
      usesInterfaces: code.includes('interface '),
      usesTypes: code.includes('type '),
    };
  },
});

// React Hooks 检查工具
export const reactHooksCheckTool = createTool({
  id: 'react-hooks-check',
  description: 'Check React Hooks usage patterns',
  inputSchema: z.object({
    code: z.string().describe('React code to analyze'),
  }),
  execute: async ({ context }) => {
    const { code } = context;
    const issues: Array<{ type: string; line: number; description: string }> = [];
    
    const lines = code.split('\n');
    let inConditional = false;
    let inLoop = false;
    
    lines.forEach((line, index) => {
      if (line.match(/if\s*\(|else|switch/)) inConditional = true;
      if (line.match(/for\s*\(|while\s*\(/)) inLoop = true;
      
      const hasHook = line.match(/use[A-Z]\w+\(/);
      
      if (hasHook) {
        if (inConditional) {
          issues.push({
            type: 'hooks-rules',
            line: index + 1,
            description: 'Hook called conditionally - hooks must be called at the top level',
          });
        }
        if (inLoop) {
          issues.push({
            type: 'hooks-rules',
            line: index + 1,
            description: 'Hook called in a loop - hooks must be called at the top level',
          });
        }
      }
      
      if (line.includes('useEffect')) {
        const nextLines = lines.slice(index, index + 10).join('\n');
        if (!nextLines.includes('[') || nextLines.match(/useEffect\([^)]+\)\s*;/)) {
          issues.push({
            type: 'hooks-dependencies',
            line: index + 1,
            description: 'useEffect without dependency array may cause infinite loops',
          });
        }
      }
      
      if (line.includes('}')) {
        inConditional = false;
        inLoop = false;
      }
    });
    
    return {
      issuesFound: issues.length,
      issues,
      hooksUsed: (code.match(/use[A-Z]\w+\(/g) || []).length,
    };
  },
});

export const allTools = {
  readFile: readFileTool,
  analyzeComplexity: analyzeComplexityTool,
  securityCheck: securityCheckTool,
  typeCheck: typeCheckTool,
  reactHooksCheck: reactHooksCheckTool,
};
