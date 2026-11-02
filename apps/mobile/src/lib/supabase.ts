import './install-local-storage';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const authStorage = typeof globalThis.localStorage?.getItem === 'function'
  ? globalThis.localStorage
  : undefined;

const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: Boolean(authStorage),
        detectSessionInUrl: false,
      },
    })
  : null;
