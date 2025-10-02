import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';
const TOKEN_KEY = 'web3_auth_token';

interface NonceResponse {
  message: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}

interface VerifyResponse {
  success: boolean;
  token: string;
  address: string;
  expiresIn: string;
}

interface AuthState {
  expiresAt: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  address: string | null;
}

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [authState, setAuthState] = useState<AuthState>({
    expiresAt: 0,
    isAuthenticated: !isTokenExpires(),
    isLoading: false,
    error: null,
    address: null
  });

  /**
   * 登录：获取nonce、签名、验证
   */
  const login = useCallback(async () => {
    if (!isConnected || !address) {
      setAuthState(prev => ({
        ...prev,
        error: '请先连接钱包'
      }));
      return false;
    }

    if (!isTokenExpires()) {
      return true;
    }

    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      // 步骤1: 获取签名消息
      const nonceResponse = await axios.post<NonceResponse>(`${API_BASE_URL}/api/auth/nonce`, {
        address
      });

      const { message, expiresAt } = nonceResponse.data;
      console.log('message', JSON.stringify(message));

      // 步骤2: 使用wagmi签名消息
      const signature = await signMessageAsync({ message });

      console.log('signature', signature);

      // 步骤3: 验证签名
      const verifyResponse = await axios.post<VerifyResponse>(`${API_BASE_URL}/api/auth/verify`, {
        address,
        signature,
        message
      });

      if (verifyResponse.data.success) {
        // 存储Token到localStorage
        storeToken(JSON.stringify({ token: verifyResponse.data.token, expiresAt }));

        setAuthState({
          expiresAt,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          address: verifyResponse.data.address
        });

        return true;
      }

      throw new Error('验证失败');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '登录失败';

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      return false;
    }
  }, [address, isConnected, signMessageAsync]);

  /**
   * 登出：清除Token
   */
  const logout = useCallback(() => {
    removeToken();
    setAuthState({
      expiresAt: 0,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      address: null
    });
  }, []);

  /**
   * 验证当前Token是否有效
   */
  const verifyToken = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false
      }));
      return false;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        address: response.data.address
      }));

      return true;
    } catch (error) {
      console.log(error);
      removeToken();
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false
      }));
      return false;
    }
  }, []);

  /**
   * 获取认证的axios实例（自动添加Token）
   */
  const getAuthAxios = useCallback(() => {
    const token = getStoredToken();

    return axios.create({
      baseURL: API_BASE_URL,
      headers: token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {}
    });
  }, []);

  return {
    // 状态
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    address: authState.address,

    // 方法
    login,
    logout,
    verifyToken,
    getAuthAxios
  };
}

// LocalStorage工具函数
function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('存储Token失败:', error);
  }
}

function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('删除Token失败:', error);
  }
}

function isTokenExpires(): boolean {
  const tokenString = getStoredToken();
  if (tokenString) {
    const { expiresAt } = JSON.parse(tokenString);
    console.log('从localStorage获取token');
    return Date.now() > expiresAt;
  }
  return true;
}
