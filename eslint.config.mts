// eslint.config.mts
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
  // 忽略文件
  {
    ignores: [
      'tests',
      '__mocks__',
      'config',
      'backstop_data',
      'dist',
      'node_modules',
      'coverage',
      '*.config.js',
      '.husky',
      'docs',
      'scripts',
      'public',
      'demo/**/*',
      'cypress/**/*',
      '**/*.min.js',
      'src/types/ethers-contracts/**/*',
      'cypress.config.ts'  // 添加这行
    ]
  },

  // JavaScript 推荐配置
  js.configs.recommended,

  // TypeScript 推荐配置
  ...tseslint.configs.recommended,

  // 全局配置
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        browser: true,
        es2021: true,
        node: true
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },

  // React + TypeScript 文件配置
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
      prettier
    },
    rules: {
      // React 规则
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',

      // React Hooks 规则
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript 规则
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/comma-dangle': 'off',

      // Import 规则（放宽或关闭）
      'import/order': 'off',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'error',

      // 通用规则
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-unused-expressions': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-undef': 'off',
      'comma-dangle': 'off',

      // Prettier 规则
      'prettier/prettier': [
        'warn',
        {
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: true,
          trailingComma: 'none',
          bracketSpacing: true,
          arrowParens: 'avoid'
        }
      ]
    }
  },

  // 测试文件特殊配置
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'prettier/prettier': 'warn'
    }
  },

  // 配置文件和特殊文件
  {
    files: ['*.config.{ts,mts}', 'webpack.*.js', 'src/wdyr.tsx'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
      'import/no-extraneous-dependencies': 'off'
    }
  }
];
