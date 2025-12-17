// Logging utilities for LLM runs (Deno-compatible)

export interface LogEntry {
  user_id?: string;
  space_id?: string;
  operation: string;
  model: string;
  temperature: number;
  used_json_fallback: boolean;
  hard_error: boolean;
  warnings: any[];
  request_json: any;
  response_json?: any;
  raw_output?: string;
  latency_ms?: number;
  prompt_version?: string;
  schema_version?: number;
}

export async function logLLMRun(entry: LogEntry): Promise<void> {
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const response = await fetch(`${supabaseUrl}/rest/v1/llm_runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(entry)
    });
    
    if (!response.ok) {
      console.error('Failed to log LLM run:', await response.text());
    } else {
      console.log('LLM run logged successfully');
    }
  } catch (error) {
    console.error('Failed to log LLM run:', error);
  }
}
