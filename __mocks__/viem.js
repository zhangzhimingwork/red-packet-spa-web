/**
 * Mock for viem library
 * 用于 Jest 测试环境
 */

module.exports = {
  // 格式化 Ether（wei -> ether）
  formatEther: jest.fn((value) => {
    if (typeof value === 'bigint') {
      return (Number(value) / 1e18).toFixed(18).replace(/\.?0+$/, '');
    }
    if (typeof value === 'number') {
      return (value / 1e18).toString();
    }
    return '0';
  }),

  // 解析 Ether（ether -> wei）
  parseEther: jest.fn((value) => {
    if (typeof value === 'string' || typeof value === 'number') {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return BigInt(Math.floor(num * 1e18));
    }
    return BigInt(0);
  }),

  // 格式化单位
  formatUnits: jest.fn((value, decimals = 18) => {
    if (typeof value === 'bigint') {
      const divisor = Math.pow(10, decimals);
      return (Number(value) / divisor).toString();
    }
    return '0';
  }),

  // 解析单位
  parseUnits: jest.fn((value, decimals = 18) => {
    if (typeof value === 'string' || typeof value === 'number') {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      const multiplier = Math.pow(10, decimals);
      return BigInt(Math.floor(num * multiplier));
    }
    return BigInt(0);
  }),

  // 格式化 Gwei
  formatGwei: jest.fn((value) => {
    if (typeof value === 'bigint') {
      return (Number(value) / 1e9).toString();
    }
    return '0';
  }),

  // 解析 Gwei
  parseGwei: jest.fn((value) => {
    if (typeof value === 'string' || typeof value === 'number') {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return BigInt(Math.floor(num * 1e9));
    }
    return BigInt(0);
  }),

  // 验证地址格式
  isAddress: jest.fn((address) => {
    if (typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }),

  // 获取校验和地址
  getAddress: jest.fn((address) => {
    if (typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address)) {
      return address;
    }
    throw new Error('Invalid address');
  }),

  // 判断地址是否相等
  isAddressEqual: jest.fn((a, b) => {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.toLowerCase() === b.toLowerCase();
    }
    return false;
  }),

  // 零地址
  zeroAddress: '0x0000000000000000000000000000000000000000',

  // 最大 uint256
  maxUint256: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),

  // 编码函数数据
  encodeFunctionData: jest.fn(() => '0x'),

  // 解码函数结果
  decodeFunctionResult: jest.fn(() => []),

  // 编码 ABI 参数
  encodeAbiParameters: jest.fn(() => '0x'),

  // 解码 ABI 参数
  decodeAbiParameters: jest.fn(() => []),

  // 哈希函数
  keccak256: jest.fn((data) => '0x' + '0'.repeat(64)),

  // 十六进制转换
  toHex: jest.fn((value) => {
    if (typeof value === 'bigint' || typeof value === 'number') {
      return '0x' + value.toString(16);
    }
    if (typeof value === 'string') {
      return '0x' + Buffer.from(value).toString('hex');
    }
    return '0x0';
  }),

  fromHex: jest.fn((hex) => {
    if (typeof hex === 'string') {
      return hex.replace('0x', '');
    }
    return '';
  }),

  // 字节转换
  toBytes: jest.fn((value) => new Uint8Array()),

  fromBytes: jest.fn((bytes) => '0x'),

  // 字符串转换
  stringToHex: jest.fn((str) => '0x' + Buffer.from(str).toString('hex')),

  hexToString: jest.fn((hex) => {
    const cleanHex = hex.replace('0x', '');
    return Buffer.from(cleanHex, 'hex').toString('utf8');
  }),

  // 数字转换
  numberToHex: jest.fn((num) => '0x' + num.toString(16)),

  hexToNumber: jest.fn((hex) => {
    return parseInt(hex, 16);
  }),

  // 布尔转换
  boolToHex: jest.fn((bool) => bool ? '0x1' : '0x0'),

  hexToBool: jest.fn((hex) => hex !== '0x0' && hex !== '0x'),

  // 地址类型
  Address: {},

  // 哈希类型
  Hash: {},

  // 十六进制类型
  Hex: {},

  // 合约读取
  readContract: jest.fn(),

  // 合约写入
  writeContract: jest.fn(),

  // 模拟合约
  simulateContract: jest.fn(),

  // 获取余额
  getBalance: jest.fn(),

  // 获取区块
  getBlock: jest.fn(),

  // 获取交易
  getTransaction: jest.fn(),

  // 获取交易回执
  getTransactionReceipt: jest.fn(),

  // 等待交易
  waitForTransactionReceipt: jest.fn(),

  // 签名消息
  signMessage: jest.fn(),

  // 验证消息
  verifyMessage: jest.fn(),

  // 创建公共客户端
  createPublicClient: jest.fn(() => ({
    readContract: jest.fn(),
    getBalance: jest.fn(),
    getBlock: jest.fn(),
    getTransaction: jest.fn(),
    getTransactionReceipt: jest.fn(),
    waitForTransactionReceipt: jest.fn(),
  })),

  // 创建钱包客户端
  createWalletClient: jest.fn(() => ({
    writeContract: jest.fn(),
    signMessage: jest.fn(),
  })),

  // HTTP 传输
  http: jest.fn(() => ({})),

  // WebSocket 传输
  webSocket: jest.fn(() => ({})),

  // 自定义传输
  custom: jest.fn(() => ({})),

  // 主网链配置
  mainnet: {
    id: 1,
    name: 'Ethereum',
    network: 'homestead',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://eth.llamarpc.com'] },
      public: { http: ['https://eth.llamarpc.com'] },
    },
  },

  // Sepolia 测试网配置
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    network: 'sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://rpc.sepolia.org'] },
      public: { http: ['https://rpc.sepolia.org'] },
    },
    testnet: true,
  },
};