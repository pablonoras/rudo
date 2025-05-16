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
  invite_code?: string;
  created_at: string;
  updated_at: string;
  email_verified?: boolean;
}

/**
 * Validates an invite code to check if it belongs to a coach
 * @param inviteCode The invite code to validate
 * @returns Object with data (coach profile if valid) and error
 */
export async function validateInviteCode(inviteCode: string) {
  try {
    // Check if the invite code exists in the profiles table for a coach
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('invite_code', inviteCode)
      .eq('role', 'coach')
      .single();

    if (error) {
      console.error('Error validating invite code:', error);
      return { data: null, error };
    }

    if (!data) {
      return { 
        data: null, 
        error: { message: 'Invalid invitation code. Please check and try again.' } 
      };
    }

    // Code is valid, return the coach's profile
    return { data, error: null };
  } catch (error) {
    console.error('Exception validating invite code:', error);
    return { 
      data: null, 
      error: { message: 'An error occurred while validating the invitation code' } 
    };
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    // Ensure avatar_url is a valid URL or set to undefined
    if (profile.avatar_url) {
      try {
        // Basic URL validation
        new URL(profile.avatar_url);
      } catch (e) {
        // If URL is invalid, clear it
        console.warn('Invalid avatar URL:', profile.avatar_url);
        profile.avatar_url = undefined;
      }
    }

    // If no avatar_url in profile but exists in user metadata, use that
    if (!profile.avatar_url && user.user_metadata) {
      profile.avatar_url = 
        user.user_metadata.avatar_url || 
        user.user_metadata.picture || 
        undefined;
    }
    
    // Add email verification status from auth user
    profile.email_verified = user.email_confirmed_at !== null;
  }

  return profile;
}

/**
 * Ensures a profile exists for the current user
 * This is important for OAuth sign-ins where profile creation might fail
 * @param role The user role (coach or athlete)
 * @param inviteCode Optional invite code (null for athletes, generated for coaches)
 */
export async function ensureProfileExists(role: UserRole = 'coach', inviteCode?: string | null): Promise<boolean> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    console.log('Ensuring profile exists for user:', user.id, 'with role:', role);
    
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking for existing profile:', fetchError);
    }
    
    // If profile already exists, we're done
    if (existingProfile) {
      console.log('Profile already exists:', existingProfile);
      return true;
    }
    
    // Extract full name from metadata if available
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
    const email = user.email || user.user_metadata?.email || '';
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    
    console.log('Creating new profile with data:', { fullName, email, role });
    
    // Try direct insert first (more reliable)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role,
        full_name: fullName,
        email,
        avatar_url: avatarUrl,
      });
      
    if (insertError) {
      console.error('Error with direct profile insert:', insertError);
      
      // Fall back to RPC method
      console.log('Falling back to RPC method for profile creation');
      const { error: rpcError } = await supabase.rpc(
        'add_missing_profile',
        {
          user_id: user.id,
          role,
          full_name: fullName,
          email,
          avatar_url: avatarUrl
        }
      );
      
      if (rpcError) {
        console.error('Error creating profile with RPC:', rpcError);
        throw rpcError;
      }
    }
    
    // Verify the profile was created
    const { data: verifyProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (!verifyProfile) {
      console.error('Profile verification failed - profile not created');
      return false;
    }
    
    console.log('Profile created successfully');
    
    // If this is a coach and invite code was provided, update the invite code
    if (role === 'coach' && inviteCode) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ invite_code: inviteCode })
        .eq('id', user.id);
      
      if (updateError) {
        console.warn('Could not update invite code:', updateError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    return false;
  }
}

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole,
  firstName: string,
  lastName: string,
  inviteCode?: string
) {
  try {
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Create the auth user
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

    console.log('User created successfully:', user.id);

    // Create the profile directly with an INSERT instead of using RPC
    // This ensures the profile exists before we try to create relationships
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role,
        full_name: fullName,
        email,
        avatar_url: null,
      });

    if (insertError) {
      console.error('Error creating profile with direct insert:', insertError);
      
      // Fall back to the RPC method if direct insert fails
      const { error: profileError } = await supabase.rpc(
        'add_missing_profile',
        {
          user_id: user.id,
          role,
          full_name: fullName,
          email,
          avatar_url: null
        }
      );

      if (profileError) {
        console.error('Error creating profile with RPC fallback:', profileError);
        throw profileError;
      }
    }
    
    console.log('Profile created successfully for user:', user.id);
    
    // For athletes with invite code, create the coach-athlete relationship
    if (role === 'athlete' && inviteCode) {
      try {
        console.log('Processing invite code for new athlete:', inviteCode);
        
        // First verify the profile was actually created
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (!profileCheck) {
          console.error('Profile verification failed - profile not found in database');
          // Try one more time to create the profile
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              role,
              full_name: fullName,
              email,
              avatar_url: null,
            });
        } else {
          console.log('Profile verified successfully');
        }
        
        // Call the resolve_invite RPC
        const { data: resolveResult, error: resolveError } = await supabase.rpc(
          'resolve_invite', 
          { 
            code: inviteCode, 
            athlete_user_id: user.id 
          }
        );
        
        if (resolveError) {
          console.error('Error resolving invite code:', resolveError);
          
          // Try direct approach if RPC fails
          const { data: coachData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('invite_code', inviteCode)
            .eq('role', 'coach')
            .maybeSingle();
            
          if (coachData) {
            console.log('Found coach via direct query:', coachData);
            
            // Create coach_athletes relationship manually
            const { error: relationError } = await supabase
              .from('coach_athletes')
              .insert({
                coach_id: coachData.id,
                athlete_id: user.id,
                status: 'pending'
              });
              
            if (relationError) {
              console.error('Error creating relationship:', relationError);
            } else {
              console.log('Successfully created relationship via fallback');
              
              // Store coach info in localStorage for use after email verification
              localStorage.setItem('pendingCoachName', coachData.full_name);
              localStorage.setItem('pendingCoachId', coachData.id);
              localStorage.setItem('pendingJoinStatus', 'true');
            }
          }
        } else if (!resolveResult?.success) {
          console.error('Failed to resolve invite code:', resolveResult?.message);
        } else {
          // Store coach info in localStorage for use after email verification
          localStorage.setItem('pendingCoachName', resolveResult.coach_name);
          localStorage.setItem('pendingCoachId', resolveResult.coach_id);
          localStorage.setItem('pendingJoinStatus', 'true');
        }
      } catch (error) {
        console.error('Error processing invite code during signup:', error);
      }
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

/**
 * Sign in a user with email and password
 */
export async function signInWithEmail(email: string, password: string) {
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

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Update a user's password
 */
export async function updatePassword(password: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(
  provider: 'google',
  redirectUrl: string,
  inviteCodeOrOptions?: string | { redirectTo?: string; data?: Record<string, any> }
) {
  try {
    // Determine if we're dealing with an invite code or options object
    let inviteCode: string | undefined;
    let userData: Record<string, any> | undefined;
    let finalRedirectUrl = redirectUrl;
    
    console.log('signInWithOAuth called with provider:', provider);
    
    if (typeof inviteCodeOrOptions === 'string') {
      inviteCode = inviteCodeOrOptions;
      console.log('Using string invite code:', inviteCode);
    } else if (inviteCodeOrOptions && typeof inviteCodeOrOptions === 'object') {
      console.log('Using options object:', JSON.stringify(inviteCodeOrOptions));
      
      if (inviteCodeOrOptions.redirectTo) {
        finalRedirectUrl = inviteCodeOrOptions.redirectTo;
        console.log('Using custom redirect URL:', finalRedirectUrl);
      }
      
      userData = inviteCodeOrOptions.data;
      if (userData) {
        console.log('User data provided:', JSON.stringify(userData));
      }
    }
    
    // Construct redirect URL with optional invite code
    if (inviteCode) {
      finalRedirectUrl += `${finalRedirectUrl.includes('?') ? '&' : '?'}inviteCode=${encodeURIComponent(inviteCode)}`;
      console.log('Final redirect URL with invite code:', finalRedirectUrl);
    }
    
    // Store user data in localStorage to be retrieved in AuthCallback
    if (userData) {
      localStorage.setItem('oauthUserData', JSON.stringify(userData));
      console.log('Stored user data in localStorage');
    }
    
    console.log('Initiating OAuth sign-in with redirect to:', finalRedirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: finalRedirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error in signInWithOAuth:', error);
    return { data: null, error };
  }
}

export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Legacy functions for backward compatibility
 */
export async function signUp(
  email: string,
  password: string,
  role: UserRole = 'coach',
  inviteCode?: string
) {
  // Extract name from email if no name provided
  const fullName = email.split('@')[0] || 'User';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return signUpWithEmail(email, password, role, firstName, lastName, inviteCode);
}

export async function signIn(email: string, password: string) {
  return signInWithEmail(email, password);
}
