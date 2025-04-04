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

/**
 * Ensures a profile exists for the current user
 * This is important for OAuth sign-ins where profile creation might fail
 */
export async function ensureProfileExists(role: UserRole = 'coach'): Promise<boolean> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    
    // If profile already exists, we're done
    if (existingProfile) return true;
    
    // Profile doesn't exist, create it
    const { error: insertError } = await supabase.from('profiles').insert([
      {
        id: user.id,
        role,
        full_name: user.user_metadata.full_name || user.user_metadata.name || 'User',
        email: user.email || user.user_metadata.email || '',
        avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    
    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    return false;
  }
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
