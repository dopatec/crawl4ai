interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiUrl: string;
}

const config: Config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000'
};

export default config;
