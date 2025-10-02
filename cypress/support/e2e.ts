/**
 * Cypress E2E 测试支持文件
 * 
 * 这个文件在每个测试文件之前自动加载
 * 用于添加自定义命令、全局配置等
 */

// 导入 Cypress 命令
import './commands';

// 全局错误处理 - 忽略不影响测试的错误
Cypress.on('uncaught:exception', (err) => {
  // 忽略以下错误，返回 false 表示不让测试失败
  
  // Web3/钱包相关错误
  if (err.message.includes('MetaMask') || 
      err.message.includes('ethereum') ||
      err.message.includes('web3') ||
      err.message.includes('wallet')) {
    return false;
  }
  
  // React 相关错误
  if (err.message.includes('Hydration') ||
      err.message.includes('hydration') ||
      err.message.includes('Minified React error')) {
    return false;
  }
  
  // 网络请求错误
  if (err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('Network request failed')) {
    return false;
  }
  
  // Wagmi/Viem 相关错误
  if (err.message.includes('wagmi') ||
      err.message.includes('viem') ||
      err.message.includes('connector')) {
    return false;
  }
  
  // ResizeObserver 错误（常见但无害）
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  
  // 其他错误正常抛出
  return true;
});

// 忽略未捕获的 Promise rejection
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('promise rejection')) {
    return false;
  }
  return true;
});

// 全局前置操作
beforeEach(() => {
  // 清除 localStorage
  cy.clearLocalStorage();
  
  // 清除 cookies
  cy.clearCookies();
});

// 声明自定义命令的类型
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 等待页面完全加载
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>;
    }
  }
}