 /**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletConnect from '@/components/WalletConnect';
import { useAccount, useConnect } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
jest.mock('wagmi');
jest.mock('@/hooks/useAuth');
jest.mock('react-blockies', () => {
  return function Blockies() {
    return <div data-testid="blockies-avatar">Avatar</div>;
  };
});

const mockedUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockedUseConnect = useConnect as jest.MockedFunction<typeof useConnect>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('WalletConnect - 基础测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 默认返回值
    mockedUseConnect.mockReturnValue({
      connect: jest.fn(),
      connectors: [{ name: 'MetaMask', id: 'metamask' }],
      isPending: false
    } as any);

    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      address: null,
      login: jest.fn(),
      logout: jest.fn(),
      verifyToken: jest.fn(),
      getAuthAxios: jest.fn()
    });
  });

  it('应该显示 Connect Wallet 按钮当钱包未连接时', () => {
    // 设置钱包未连接状态
    mockedUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false
    } as any);

    // 渲染组件
    render(<WalletConnect />);

    // 验证按钮显示
    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    expect(connectButton).toBeInTheDocument();
    expect(connectButton).toBeVisible();
  });
});
