#!/bin/bash

# Code Review Script
echo "🚀 Starting Code Review Process..."

# 检查是否安装了必要的依赖
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# 设置环境变量（如果需要）
export NODE_ENV=${NODE_ENV:-development}

# 运行 TypeScript 代码审查
echo "📝 Running Code Review Agent..."
yarn tsx scripts/code-review/index.ts "$@"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Code Review completed successfully!"
else
    echo "❌ Code Review failed with exit code $EXIT_CODE"
    exit $EXIT_CODE
fi
