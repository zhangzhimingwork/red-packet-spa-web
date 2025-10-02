import React, { useEffect, useState } from 'react';
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
  useChainId,
  useSwitchChain
} from 'wagmi';
import {
  ChevronDownIcon,
  DocumentDuplicateIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Blockies from 'react-blockies';
import maiinnet from '@/assets/mainnet.svg';
import sepolia from '@/assets/sepolia.svg';
import { useAuth } from '@/hooks/useAuth';

interface WalletConnectProps {
  className?: string;
  requireAuth?: boolean; // 是否需要身份验证
  onAuthSuccess?: () => void; // 认证成功回调
  onAuthError?: (error: string) => void; // 认证失败回调
}

interface BalanceType {
  decimals: number;
  formatted: string;
  symbol: string;
  value: bigint;
}

const SUPPORTED_CHAINS = [
  {
    id: 1,
    name: 'Ethereum',
    icon: maiinnet,
    color: '#627EEA'
  },
  {
    id: 11155111,
    name: 'Sepolia',
    icon: sepolia,
    color: '#FF6B6B'
  }
];

const WalletConnect: React.FC<WalletConnectProps> = ({
  className = '',
  requireAuth = true,
  onAuthSuccess,
  onAuthError
}) => {
  const [mounted, setMounted] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  console.log('ensName', ensName);
  const { data: ensAvatar } = useEnsAvatar({ name: ensName || '' });
  console.log('ensAvatar', ensAvatar);
  const { data: balance } = useBalance({ address });
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  // 使用 Web3 身份验证 Hook
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    login,
    logout: authLogout
  } = useAuth();

  console.log('isConnected', isConnected);
  console.log('requireAuth', requireAuth);
  console.log('isAuthenticated', isAuthenticated);
  console.log('isAuthLoading', isAuthLoading);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 当钱包连接后，如果需要认证且未认证，则提示用户签名
  useEffect(() => {
    const auth = async () => {
      if (isConnected && requireAuth && !isAuthenticated && !isAuthLoading) {
        try {
          console.log('login');
          const success = await login();
          if (success) {
            onAuthSuccess?.();
          }
        } catch (err) {
          console.error('Auth failed', err);
        }
      }
    };

    auth();
  }, [isConnected, requireAuth, isAuthenticated, isAuthLoading, onAuthSuccess, login]);

  // 处理认证错误
  useEffect(() => {
    if (authError && onAuthError) {
      onAuthError(authError);
    }
  }, [authError, onAuthError]);

  const currentChain = SUPPORTED_CHAINS.find(chain => chain.id === chainId) || SUPPORTED_CHAINS[0];

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatBalance = (b: BalanceType | undefined) => {
    if (!b) return '0.0000';
    const v = parseFloat(b.formatted);
    return v.toFixed(4);
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('copy failed', err);
    }
  };

  const handleConnect = async () => {
    const metamask = connectors.find(c => c.name?.toLowerCase().includes('metamask'));
    const target = metamask || connectors[0];
    if (!target) {
      console.warn('No wallet connector available');
      return;
    }
    try {
      await connect({ connector: target });
    } catch (err) {
      console.error('connect error', err);
    }
  };

  const handleNetworkChange = async (targetChainId: number) => {
    if (!switchChain) return;
    if (targetChainId === chainId) {
      setShowNetworkDropdown(false);
      return;
    }
    try {
      await switchChain({ chainId: targetChainId });
    } catch (err) {
      console.error('switchChain error', err);
    } finally {
      setShowNetworkDropdown(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    authLogout(); // 同时登出身份验证
    setShowAccountDropdown(false);
  };

  if (!mounted) return null;

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className={`${className}`}>
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-150"
        >
          <div className="relative flex items-center space-x-3">
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </div>
        </button>
      </div>
    );
  }

  // 已连接且已认证（或不需要认证）
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* 左：网络选择 */}
      <div className="relative">
        <button
          onClick={() => setShowNetworkDropdown(s => !s)}
          className="flex items-center space-x-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:shadow-sm transition"
        >
          <div className="w-7 h-7">
            <img src={currentChain.icon} alt={currentChain.name} className="w-7 h-7" />
          </div>
          <span className="text-sm font-medium text-gray-800">{currentChain.name}</span>
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </button>

        {showNetworkDropdown && (
          <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {SUPPORTED_CHAINS.map(chain => (
              <button
                key={chain.id}
                onClick={() => handleNetworkChange(chain.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  chain.id === chainId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="w-7 h-7">
                  <img src={chain.icon} alt={chain.name} className="w-7 h-7" />
                </div>
                <div className="flex-1 text-sm font-medium text-gray-800">{chain.name}</div>
                {chain.id === chainId && (
                  <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 右：账户信息 */}
      <div className="relative">
        <button
          onClick={() => setShowAccountDropdown(s => !s)}
          className="flex items-center space-x-3 px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:shadow-sm transition"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden">
            {ensAvatar ? (
              <img src={ensAvatar} alt={ensName || 'avatar'} className="w-7 h-7" />
            ) : (
              <Blockies
                key={address}
                seed={address || ''}
                size={7}
                scale={4}
                className="rounded-full"
              />
            )}
          </div>

          <span className="text-sm font-medium text-gray-800">
            {ensName || (address ? formatAddress(address) : 'Unknown')}
          </span>

          {/* 认证状态指示器 */}
          {requireAuth && isAuthenticated && (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Authenticated" />
          )}

          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </button>

        {showAccountDropdown && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                  {ensAvatar ? (
                    <img src={ensAvatar} alt={ensName || 'avatar'} className="w-16 h-16" />
                  ) : (
                    <Blockies
                      key={address}
                      seed={address || ''}
                      size={16}
                      scale={4}
                      className="rounded-full"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {ensName || formatAddress(address || '')}
                  </div>

                  {/* 认证状态徽章 */}
                  {requireAuth && (
                    <div className="flex items-center space-x-1 text-xs">
                      {isAuthenticated ? (
                        <>
                          <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 font-medium">Verified</span>
                        </>
                      ) : (
                        <>
                          <ExclamationCircleIcon className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-600 font-medium">Not Verified</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-2 shadow-sm">
                <div className="text-2xl font-bold text-gray-900">
                  {formatBalance(balance as unknown as BalanceType)} ETH
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 p-4 border-t border-gray-100">
              <div className="flex gap-1">
                <button
                  onClick={handleCopyAddress}
                  className={`w-full flex gap-1 items-center justify-center px-2 py-2 rounded-lg font-medium transition-all duration-200 text-xs ${
                    copySuccess
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  <span>{copySuccess ? 'Copied!' : 'Copy Address'}</span>
                </button>

                <button
                  onClick={handleDisconnect}
                  className="w-full flex gap-1 items-center justify-center px-2 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors duration-200 border border-transparent hover:border-red-200 text-xs"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 点击外部区域关闭下拉 */}
      {(showNetworkDropdown || showAccountDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNetworkDropdown(false);
            setShowAccountDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default WalletConnect;
