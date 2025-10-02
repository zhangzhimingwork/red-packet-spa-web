/**
 * WalletConnect 组件 E2E 测试
 * 
 * 测试目标：验证钱包连接按钮能够正确显示
 * 这是最简单的 E2E 测试，用于验证 Cypress 环境配置正确
 */

describe('WalletConnect E2E Test', () => {
  beforeEach(() => {
    // 访问应用首页
    cy.visit('http://localhost:3000');
    
    // 等待页面加载完成
    cy.wait(1000);
  });

  it('应该显示 Connect Wallet 按钮', () => {
    // 验证页面标题
    cy.contains('链上红包').should('be.visible');
    
    // 验证 Connect Wallet 按钮存在且可见
    cy.contains('Connect Wallet').should('be.visible');
    
    // 验证按钮可点击（未被禁用）
    cy.contains('Connect Wallet').should('not.be.disabled');
    
    // 可选：验证欢迎文案
    cy.contains('欢迎来到链上红包').should('be.visible');
    cy.contains('连接钱包开始抢红包吧').should('be.visible');
  });

  it('点击 Connect Wallet 按钮应该触发钱包连接', () => {
    // 找到并点击 Connect Wallet 按钮
    cy.contains('Connect Wallet').click();
    
    // 验证点击后的状态变化（如果有的话）
    // 注意：实际的钱包连接需要 MetaMask 等扩展，这里只测试 UI 交互
    cy.wait(500);
    
    // 可以检查是否有 loading 状态
    // cy.contains('Connecting').should('be.visible');
  });

  it('页面应该包含正确的布局结构', () => {
    // 验证导航栏存在
    cy.get('nav').should('exist');
    
    // 验证主要内容区域存在
    cy.get('.min-h-screen').should('exist');
    
    // 验证红包图标显示
    cy.get('svg').should('exist');
  });
});tests/e2e/wallet-connect.cy.ts