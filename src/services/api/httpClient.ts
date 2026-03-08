/**
 * HTTP Client para comunicación con API del backend
 * VERSION: 2.1.0 - Con filtro automático de branch_id para admin de sede
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  user?: any;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

class HttpClient {
  private baseURL: string;
  private static readonly TOKEN_KEY = 'dental_clinic_token';
  private tokenMissingEventFired: boolean = false;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    if (import.meta.env.DEV) {
      this.monitorTokenChanges();
    }
  }

  private monitorTokenChanges(): void {}

  private getToken(): string | null {
    return localStorage.getItem(HttpClient.TOKEN_KEY);
  }

  public saveToken(token: string): void {
    localStorage.setItem(HttpClient.TOKEN_KEY, token);
    this.tokenMissingEventFired = false;
  }

  public removeToken(): void {
    localStorage.removeItem(HttpClient.TOKEN_KEY);
  }

  private buildHeaders(config: RequestConfig = {}, isFormData: boolean = false): Headers {
    const defaultHeaders: Record<string, string> = {};
    if (!isFormData) defaultHeaders['Content-Type'] = 'application/json';
    const headers = new Headers({ ...defaultHeaders, ...config.headers });
    const requiresAuth = config.requiresAuth !== false;
    if (requiresAuth) {
      const token = this.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
        this.tokenMissingEventFired = false;
      } else if (!this.tokenMissingEventFired) {
        this.tokenMissingEventFired = true;
        window.dispatchEvent(new CustomEvent('auth:token-missing', {
          detail: { message: 'Token JWT no encontrado' }
        }));
      }
    }
    return headers;
  }

  private async handleError(response: Response, isRetry: boolean = false): Promise<never> {
    let errorMessage = 'Error en la petición';
    let errorData: any = null;
    try {
      errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    if (response.status === 401 && isRetry) {
      this.removeToken();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    if (response.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden'));
    }
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  private async request<T = any>(
    endpoint: string,
    config: RequestConfig = {},
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const method = config.method || 'GET';
    const isFormData = config.body instanceof FormData;

    // Para FormData, solo pasamos Authorization header (sin Content-Type)
    // El navegador establecerá automáticamente el Content-Type con el boundary correcto
    let headers: HeadersInit;
    if (isFormData) {
      const token = this.getToken();
      headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    } else {
      headers = this.buildHeaders(config, false);
    }

    const options: RequestInit = {
      method,
      headers,
    };
    if (config.body && method !== 'GET') {
      options.body = isFormData ? config.body : JSON.stringify(config.body);
    }
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (response.status === 401 && !isRetry && config.requiresAuth !== false) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const token = this.getToken();
          if (token) return this.request<T>(endpoint, config, true);
        }
        await this.handleError(response, isRetry);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return { success: true } as ApiResponse<T>;
    } catch (error) {
      if (error instanceof Error && !(error as any).status) {
        throw new Error('Error de conexión con el servidor');
      }
      throw error;
    }
  }

  public async get<T = any>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  public async post<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  public async put<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  public async delete<T = any>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  public async patch<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }
}

export const httpClient = new HttpClient();
export default httpClient;
