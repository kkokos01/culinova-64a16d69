/**
 * Shared Edge Function client for all AI services
 * Handles common authentication, error handling, and retry logic
 */

export interface EdgeFunctionResponse<T = any> {
  success: boolean;
  response?: T;
  error?: string;
}

export class EdgeFunctionClient {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }
  }

  /**
   * Call a Supabase Edge Function with proper error handling
   */
  async callFunction<T = any>(
    functionName: string,
    payload: any,
    options?: {
      retries?: number;
      timeout?: number;
    }
  ): Promise<T> {
    const { retries = 2, timeout = 30000 } = options || {};
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.makeRequest<T>(functionName, payload, timeout);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Edge function attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError || new Error('Edge function failed after retries');
  }

  private async makeRequest<T>(
    functionName: string,
    payload: any,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
      }

      const data: EdgeFunctionResponse<T> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Edge function returned failure');
      }

      if (!data.response) {
        throw new Error('Edge function returned empty response');
      }

      return data.response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Edge function timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }
}

// Export singleton instance
export const edgeFunctionClient = new EdgeFunctionClient();
