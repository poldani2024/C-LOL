import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '@shared/types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('c-lol-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('c-lol-token');
      localStorage.removeItem('c-lol-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function get<T>(url: string, params?: object): Promise<T> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, { params });
  return res.data.data as T;
}

export async function post<T>(url: string, data?: object): Promise<T> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data);
  return res.data.data as T;
}

export async function put<T>(url: string, data?: object): Promise<T> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data);
  return res.data.data as T;
}

export async function del<T>(url: string): Promise<T> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url);
  return res.data.data as T;
}

export default apiClient;
