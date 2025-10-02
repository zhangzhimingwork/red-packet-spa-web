// Mock wagmi hooks
module.exports = {
  useAccount: jest.fn(() => ({
    address: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
  })),

  useConnect: jest.fn(() => ({
    connect: jest.fn(),
    connectors: [],
    isPending: false,
    isSuccess: false,
    isError: false,
  })),

  useDisconnect: jest.fn(() => ({
    disconnect: jest.fn(),
    isPending: false,
  })),

  useSignMessage: jest.fn(() => ({
    signMessage: jest.fn(),
    signMessageAsync: jest.fn(),
    data: undefined,
    isPending: false,
    isSuccess: false,
    isError: false,
  })),

  useBalance: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isSuccess: false,
  })),

  useEnsName: jest.fn(() => ({
    data: null,
    isLoading: false,
  })),

  useEnsAvatar: jest.fn(() => ({
    data: null,
    isLoading: false,
  })),

  useChainId: jest.fn(() => 1),

  useSwitchChain: jest.fn(() => ({
    switchChain: jest.fn(),
    isPending: false,
  })),

  useReadContract: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    refetch: jest.fn(),
  })),

  useWriteContract: jest.fn(() => ({
    writeContract: jest.fn(),
    data: undefined,
    isPending: false,
    isSuccess: false,
    isError: false,
  })),

  useWaitForTransactionReceipt: jest.fn(() => ({
    isLoading: false,
    isSuccess: false,
    isError: false,
    data: undefined,
  })),

  WagmiProvider: ({ children }) => children,
  
  createConfig: jest.fn(() => ({})),
};