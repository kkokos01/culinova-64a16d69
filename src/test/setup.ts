import '@testing-library/jest-dom';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    })),
  }
}));

// Mock environment variables
vi.mock('@/lib/env', () => ({
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-key',
}));
