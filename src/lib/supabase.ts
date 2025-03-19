import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

export type UserRole = 'coach' | 'athlete';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function signUp(
  email: string,
  password: string,
  role: UserRole,
  fullName: string
) {
  try {
    // First, create the auth user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
      },
    });

    if (signUpError || !user) {
      throw signUpError || new Error('Failed to create user');
    }

    // Then, create the profile
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: user.id,
        role,
        full_name: fullName,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      throw profileError;
    }

    // Finally, sign in the user
    return signIn(email, password);
  } catch (error) {
    return { error };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signOut() {
  return supabase.auth.signOut();
}
