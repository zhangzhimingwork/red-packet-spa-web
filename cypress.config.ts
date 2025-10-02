import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // 基础 URL
    baseUrl: 'http://localhost:3000',
    
    // 测试文件位置
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // 视口大小
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // 超时设置
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // 视频录制（可选）
    video: false,
    
    // 截图设置
    screenshotOnRunFailure: true,
    
    // 测试隔离
    testIsolation: true,
    
    setupNodeEvents(on, config) {
      // 这里可以添加插件和任务
      return config;
    },
  },
  
  // 组件测试配置（如果需要）
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});