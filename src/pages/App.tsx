import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther, Address } from 'viem';
import {
  GiftIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import WalletConnect from '../components/WalletConnect';

import { abi as RED_PACKET_ABI } from '../abis';

const RED_PACKET_CONTRACT_ADDRESS = process.env.REACT_PUBLIC_RED_PACKET_CONTRACT_ADDRESS as Address;

interface RedPacketInfo {
  totalAmount: bigint;
  totalPackets: bigint;
  claimedPackets: bigint;
  remainingAmount: bigint;
  isActive: boolean;
}

type RedPacketInfoArr = [bigint, bigint, bigint, bigint, boolean];

interface UserInfo {
  claimed: boolean;
  amount: bigint;
}

type UserInfoArr = [boolean, bigint];

const App: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [claimedAmount, setClaimedAmount] = useState<string>('');
  const [fundAmount, setFundAmount] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 合约读取 - 添加 enabled 和 query 参数
  const {
    data: redPacketInfoArr,
    refetch: refetchInfo,
    isLoading: isLoadingInfo,
    isError: isErrorInfo
  } = useReadContract({
    address: RED_PACKET_CONTRACT_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'getRedPacketInfo',
    query: {
      enabled: isClient && !!RED_PACKET_CONTRACT_ADDRESS,
      refetchInterval: 10000 // 每10秒自动刷新
    }
  }) as {
    data: RedPacketInfoArr | undefined;
    refetch: () => void;
    isLoading: boolean;
    isError: boolean;
  };

  const redPacketArr: [bigint, bigint, bigint, bigint, boolean] | undefined = redPacketInfoArr;

  let redPacketInfo: RedPacketInfo | undefined;

  if (redPacketArr) {
    const [totalAmount, totalPackets, claimedPackets, remainingAmount, isActive] = redPacketArr;
    redPacketInfo = { totalAmount, totalPackets, claimedPackets, remainingAmount, isActive };
  }

  const {
    data: userInfoArr,
    refetch: refetchUserInfo,
    isLoading: isLoadingUser
  } = useReadContract({
    address: RED_PACKET_CONTRACT_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'getUserInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: isClient && !!address && !!RED_PACKET_CONTRACT_ADDRESS,
      refetchInterval: 10000
    }
  }) as { data: UserInfoArr | undefined; refetch: () => void; isLoading: boolean };

  const userArr: [boolean, bigint] | undefined = userInfoArr;

  let userInfo: UserInfo | undefined;

  if (userArr) {
    const [claimed, amount] = userArr;
    userInfo = { claimed, amount };
  }

  const { data: previewAmount } = useReadContract({
    address: RED_PACKET_CONTRACT_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'previewNextAmount',
    query: {
      enabled: isClient && !!RED_PACKET_CONTRACT_ADDRESS
    }
  }) as { data: [bigint, bigint] | undefined };

  const { data: owner } = useReadContract({
    address: RED_PACKET_CONTRACT_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'owner',
    query: {
      enabled: isClient && !!RED_PACKET_CONTRACT_ADDRESS
    }
  }) as { data: Address | undefined };

  // 合约写入
  const {
    writeContract: claimRedPacket,
    data: claimHash,
    isPending: isClaimPending
  } = useWriteContract();
  const {
    writeContract: toggleActive,
    data: toggleHash,
    isPending: isTogglePending
  } = useWriteContract();
  const {
    writeContract: addFunds,
    data: addFundsHash,
    isPending: isAddFundsPending
  } = useWriteContract();
  const {
    writeContract: emergencyWithdraw,
    data: withdrawHash,
    isPending: isWithdrawPending
  } = useWriteContract();

  // 等待交易确认
  const { isLoading: isClaimLoading, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash
  });
  const { isLoading: isToggleLoading, isSuccess: isToggleSuccess } = useWaitForTransactionReceipt({
    hash: toggleHash
  });
  const { isLoading: isAddFundsLoading, isSuccess: isAddFundsSuccess } =
    useWaitForTransactionReceipt({ hash: addFundsHash });
  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash });

  useEffect(() => {
    if (isClaimSuccess) {
      refetchInfo();
      refetchUserInfo();
    }
  }, [isClaimSuccess, refetchInfo, refetchUserInfo]);

  useEffect(() => {
    if (isToggleSuccess || isAddFundsSuccess || isWithdrawSuccess) {
      refetchInfo();
      refetchUserInfo();
    }
  }, [isToggleSuccess, isAddFundsSuccess, isWithdrawSuccess, refetchInfo, refetchUserInfo]);

  useEffect(() => {
    if (userInfo && userInfo.amount > BigInt(0)) {
      setClaimedAmount(formatEther(userInfo.amount));
    }
  }, [userInfo]);

  const handleClaimRedPacket = () => {
    if (!isConnected || !address) return;
    claimRedPacket({
      address: RED_PACKET_CONTRACT_ADDRESS,
      abi: RED_PACKET_ABI,
      functionName: 'claimRedPacket'
    });
  };
  const handleToggleActive = () => {
    if (!isConnected || !address) return;
    toggleActive({
      address: RED_PACKET_CONTRACT_ADDRESS,
      abi: RED_PACKET_ABI,
      functionName: 'toggleActive'
    });
  };
  const handleAddFunds = () => {
    if (!isConnected || !address || !fundAmount) return;
    addFunds({
      address: RED_PACKET_CONTRACT_ADDRESS,
      abi: RED_PACKET_ABI,
      functionName: 'addFunds',
      value: parseEther(fundAmount)
    });
    setFundAmount('');
  };
  const handleEmergencyWithdraw = () => {
    if (!isConnected || !address) return;
    emergencyWithdraw({
      address: RED_PACKET_CONTRACT_ADDRESS,
      abi: RED_PACKET_ABI,
      functionName: 'emergencyWithdraw'
    });
  };

  const isOwner = !!(address && owner && address.toLowerCase() === owner.toLowerCase());
  const progress = redPacketInfo
    ? (Number(redPacketInfo.claimedPackets) / Number(redPacketInfo.totalPackets)) * 100
    : 0;

  // 添加加载状态判断
  const isDataLoading = isLoadingInfo || (isConnected && isLoadingUser);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <GiftIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                链上红包
              </h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <GiftIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">欢迎来到链上红包</h2>
            <p className="text-xl text-gray-600 mb-8">连接钱包开始抢红包吧！</p>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <SparklesIcon className="w-5 h-5" />
                <span>公平透明的链上随机分配</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <FireIcon className="w-5 h-5" />
                <span>即时到账，无需等待</span>
              </div>
            </div>
          </div>
        ) : isDataLoading ? (
          // 添加全局加载状态
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">加载红包数据中...</p>
          </div>
        ) : isErrorInfo ? (
          // 添加错误状态
          <div className="text-center py-20">
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
            <p className="text-gray-600 mb-4">无法连接到智能合约，请检查网络连接</p>
            <button
              onClick={() => refetchInfo()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* 主要红包区域 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <GiftIcon className="w-10 h-10 text-white" />
                  </div>
                  {userInfo?.claimed ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <CheckCircleIcon className="w-8 h-8" />
                        <span className="text-2xl font-bold">已领取红包！</span>
                      </div>
                      <div className="text-4xl font-bold text-red-600">{claimedAmount} ETH</div>
                      <p className="text-gray-500">恭喜你获得了这个金额！</p>
                    </div>
                  ) : redPacketInfo?.isActive ? (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold text-gray-900">点击抢红包！</h2>
                      {previewAmount && previewAmount[0] > BigInt(0) && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                          <p className="text-sm text-yellow-800 mb-2">预计金额范围</p>
                          <div className="text-lg font-semibold text-yellow-900">
                            {formatEther(previewAmount[0])} - {formatEther(previewAmount[1])} ETH
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleClaimRedPacket}
                        disabled={isClaimPending || isClaimLoading}
                        className="w-full py-4 px-8 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isClaimPending || isClaimLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>抢红包中...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <GiftIcon className="w-6 h-6" />
                            <span>抢红包</span>
                          </div>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-gray-500">
                        <XCircleIcon className="w-8 h-8" />
                        <span className="text-2xl font-bold">红包已结束</span>
                      </div>
                      <p className="text-gray-500">
                        {redPacketInfo && redPacketInfo.claimedPackets >= redPacketInfo.totalPackets
                          ? '所有红包已被领完'
                          : '红包活动暂未开始'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 侧边栏 */}
            <div className="space-y-6">
              {/* 红包统计 */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <SparklesIcon className="w-5 h-5 text-red-500" />
                  <span>红包统计</span>
                </h3>
                {redPacketInfo ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">总金额</span>
                      <span className="font-semibold text-red-600">
                        {formatEther(redPacketInfo.totalAmount)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">剩余金额</span>
                      <span className="font-semibold">
                        {formatEther(redPacketInfo.remainingAmount)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">红包进度</span>
                      <span className="font-semibold">
                        {Number(redPacketInfo.claimedPackets)} /{' '}
                        {Number(redPacketInfo.totalPackets)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">状态</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          redPacketInfo.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {redPacketInfo.isActive ? '进行中' : '已结束'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2">加载中...</p>
                  </div>
                )}
              </div>

              {/* 管理员功能 */}
              {isOwner && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                    <span>管理员功能</span>
                  </h3>
                  <div className="space-y-4">
                    <button
                      onClick={handleToggleActive}
                      disabled={isTogglePending || isToggleLoading}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        redPacketInfo?.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } disabled:opacity-50`}
                    >
                      {isTogglePending || isToggleLoading
                        ? '处理中...'
                        : redPacketInfo?.isActive
                          ? '暂停红包'
                          : '开启红包'}
                    </button>
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="输入ETH数量"
                        value={fundAmount}
                        onChange={e => setFundAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddFunds}
                        disabled={!fundAmount || isAddFundsPending || isAddFundsLoading}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAddFundsPending || isAddFundsLoading ? '处理中...' : '添加资金'}
                      </button>
                    </div>
                    <button
                      onClick={handleEmergencyWithdraw}
                      disabled={isWithdrawPending || isWithdrawLoading}
                      className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isWithdrawPending || isWithdrawLoading ? '处理中...' : '紧急提取'}
                    </button>
                  </div>
                </div>
              )}

              {/* 使用说明 */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">使用说明</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <span className="bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </span>
                    <span>每个地址只能抢一次红包</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </span>
                    <span>红包金额随机分配，公平透明</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </span>
                    <span>抢到即时到账，无需等待</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
