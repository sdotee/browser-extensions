/**
 * S.EE Browser Extension SDK
 * Supports URL shortening, Text sharing, and File sharing
 */

export interface SdkConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

// URL Shortening Types
export interface UrlShortenRequest {
  domain: string;
  target_url: string;
  custom_slug?: string;
  title?: string;
  password?: string;
  expire_at?: number;
}

export interface UrlShortenResponse {
  code: number;
  message: string;
  data: {
    custom_slug?: string;
    short_url: string;
    slug: string;
  };
}

// Text Sharing Types
export interface TextShareRequest {
  content: string;
  title: string;
  domain?: string;
  custom_slug?: string;
  password?: string;
  text_type?: 'plain_text' | 'source_code' | 'markdown';
  expire_at?: number;
}

export interface TextShareResponse {
  code: number;
  message: string;
  data: {
    short_url: string;
    slug: string;
    custom_slug?: string;
  };
}

// File Sharing Types
export interface FileUploadResponse {
  code: number;
  message: string;
  data: {
    url: string;
    file_id: string;
    filename: string;
    hash: string;
    size: number;
    width?: number;
    height?: number;
    page: string;
    delete: string;
  };
}

export interface DomainListResponse {
  code: number;
  message: string;
  data: {
    domains: string[];
  };
}

export interface ApiError {
  code: string;
  message: string;
  data?: string;
}

export class SeeError extends Error {
  public code: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'SeeError';
    this.code = error.code;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class SeeSDK {
  private config: SdkConfig;

  constructor(config: SdkConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'https://s.ee',
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    isFormData = false
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {
        Authorization: this.config.apiKey,
      };

      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers,
        body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new SeeError({
          code: data?.code || 'API_ERROR',
          message: data?.message || `Request failed with status ${response.status}`,
        });
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof SeeError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError('Request timeout');
        }
        throw new NetworkError(error.message);
      }

      throw new NetworkError('An unknown error occurred');
    }
  }

  // ==================== URL Shortening ====================

  /**
   * Create a shortened URL
   */
  async shortenUrl(request: UrlShortenRequest): Promise<UrlShortenResponse> {
    try {
      new URL(request.target_url);
    } catch {
      throw new SeeError({
        code: 'INVALID_URL',
        message: 'Invalid target URL',
      });
    }

    return this.request<UrlShortenResponse>('POST', '/api/v1/shorten', request);
  }

  /**
   * List available domains for URL shortening
   */
  async listUrlDomains(): Promise<DomainListResponse> {
    return this.request<DomainListResponse>('GET', '/api/v1/domains');
  }

  // ==================== Text Sharing ====================

  /**
   * Create a text share
   */
  async shareText(request: TextShareRequest): Promise<TextShareResponse> {
    if (!request.content || request.content.length === 0) {
      throw new SeeError({
        code: 'INVALID_CONTENT',
        message: 'Content cannot be empty',
      });
    }

    if (!request.title || request.title.length === 0) {
      throw new SeeError({
        code: 'INVALID_TITLE',
        message: 'Title cannot be empty',
      });
    }

    return this.request<TextShareResponse>('POST', '/api/v1/text', request);
  }

  /**
   * List available domains for text sharing
   */
  async listTextDomains(): Promise<DomainListResponse> {
    return this.request<DomainListResponse>('GET', '/api/v1/text/domains');
  }

  // ==================== File Sharing ====================

  /**
   * Upload a file
   */
  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<FileUploadResponse>('POST', '/api/v1/file/upload', formData, true);
  }

  /**
   * Delete a file
   */
  async deleteFile(hash: string): Promise<{ success: boolean; code: number; message: string }> {
    return this.request('GET', `/api/v1/file/delete/${hash}`);
  }

  /**
   * List available domains for file sharing
   */
  async listFileDomains(): Promise<DomainListResponse> {
    return this.request<DomainListResponse>('GET', '/api/v1/file/domains');
  }

  // ==================== Config ====================

  /**
   * Update SDK configuration
   */
  updateConfig(newConfig: Partial<SdkConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
