import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

// https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=platform&platform=chrome-extensions#configure-your-services-id
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
