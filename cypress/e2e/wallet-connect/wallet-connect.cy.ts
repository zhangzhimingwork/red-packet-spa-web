/**
 * WalletConnect 组件 E2E 测试
 * 
 * 测试目标：验证钱包连接按钮能够正确显示
 * 这是最简单的 E2E 测试，用于验证 Cypress 环境配置正确
 */

describe('WalletConnect E2E Test', () => {
  beforeEach(() => {
    // 访问应用首页
    cy.visit('/');
  });

  it('应该显示 Connect Wallet 按钮', () => {
    // 等待页面加载
    cy.get('body').should('be.visible');
    
    // 验证页面标题
    cy.get('h1', { timeout: 10000 }).should('be.visible');
    
    // 验证 Connect Wallet 按钮存在且可见
    cy.get('button').contains('Connect Wallet', { timeout: 10000 }).should('be.visible');
    
    // 验证按钮可点击（未被禁用）
    cy.get('button').contains('Connect Wallet').should('not.be.disabled');
  });

  it('应该显示欢迎信息', () => {
    // 等待页面完全加载
    cy.get('body').should('be.visible');
    
    // 验证欢迎文案（使用更宽松的匹配）
    cy.get('body', { timeout: 10000 }).should('contain', '红包');
  });

  it('页面应该包含基本元素', () => {
    // 验证页面主容器存在
    cy.get('.min-h-screen', { timeout: 10000 }).should('exist');
    
    // 验证导航栏存在
    cy.get('nav').should('exist');
  });
});