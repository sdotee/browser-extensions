/**
 * Browser-compatible S.EE SDK
 * Simplified version for Chrome Extension environment
 */

export interface SdkConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface UrlShortenRequest {
  domain: string;
  target_url: string;
  custom_slug?: string;
  title?: string;
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

export class UrlShortenerError extends Error {
  public code: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'UrlShortenerError';
    this.code = error.code;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class UrlShortenSDK {
  private config: SdkConfig;

  constructor(config: SdkConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'https://s.ee',
      apiKey: config.apiKey,
      timeout: config.timeout || 10000,
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new UrlShortenerError({
          code: data?.code || 'API_ERROR',
          message: data?.message || `Request failed with status ${response.status}`,
        });
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof UrlShortenerError) {
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

  /**
   * Create a shortened URL
   */
  async create(request: UrlShortenRequest): Promise<UrlShortenResponse> {
    // Basic URL validation
    try {
      new URL(request.target_url);
    } catch {
      throw new UrlShortenerError({
        code: 'INVALID_URL',
        message: 'Invalid target URL',
      });
    }

    return this.request<UrlShortenResponse>('POST', '/api/v1/shorten', request);
  }

  /**
   * List available domains
   */
  async listDomains(): Promise<DomainListResponse> {
    return this.request<DomainListResponse>('GET', '/api/v1/domains');
  }

  /**
   * Update SDK configuration
   */
  updateConfig(newConfig: Partial<SdkConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
