import { AuthError, createClient } from '@supabase/supabase-js';
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
      .select('id, full_name, email, avatar_url')
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
 * @param inviteCode Optional invite code (null for coaches, code for athletes)
 */
export async function ensureProfileExists(role?: UserRole, inviteCode?: string | null): Promise<boolean> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting current user:', userError);
      return false;
    }
    
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }
    
    console.log('Ensuring profile exists for user:', user.id);
    
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking for existing profile:', fetchError);
    }
    
    // If profile already exists, check if we need to update role
    if (existingProfile) {
      console.log('Profile already exists:', existingProfile);
      
      // If explicit role is provided and different from existing, update it
      if (role && existingProfile.role !== role) {
        console.log(`Updating user role from ${existingProfile.role} to ${role}`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating user role:', updateError);
        }
      }
      
      // If invite code provided for athlete, process it
      if (inviteCode && (existingProfile.role === 'athlete' || role === 'athlete')) {
        console.log('Processing invite code for existing athlete profile:', inviteCode);
        await createCoachAthleteRelationship(inviteCode, user.id);
      }
      
      return true;
    }
    
    // Determine the correct role to use, prioritizing:
    // 1. Explicitly passed role parameter
    // 2. Role from localStorage (for OAuth flows)
    // 3. Role from user metadata
    // 4. Default to 'athlete'
    let finalRole: UserRole = 'athlete'; // Default fallback
    
    // Check for role parameter
    if (role) {
      console.log('Using explicitly provided role:', role);
      finalRole = role;
    } else {
      // Try to get role from localStorage
      try {
        const storedUserData = localStorage.getItem('oauthUserData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          if (userData.role) {
            finalRole = userData.role as UserRole;
            console.log('Using role from localStorage:', finalRole);
            // Clear stored data after using it
            localStorage.removeItem('oauthUserData');
          }
        }
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
      
      // If no role found in localStorage, check user metadata
      if (finalRole === 'athlete' && user.user_metadata?.role) {
        finalRole = user.user_metadata.role as UserRole;
        console.log('Using role from user metadata:', finalRole);
      }
    }
    
    console.log('Final role to use for profile creation:', finalRole);
    
    // Extract user details from metadata
    const fullName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     (user.email ? user.email.split('@')[0] : 'User');
    const email = user.email || user.user_metadata?.email || '';
    const avatarUrl = user.user_metadata?.avatar_url || 
                      user.user_metadata?.picture || 
                      null;
    
    console.log('Creating new profile with data:', { fullName, email, role: finalRole });
    
    let profileCreated = false;
    
    // Try direct insert first (more reliable)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: finalRole,
        full_name: fullName,
        email,
        avatar_url: avatarUrl
      });
    
    if (insertError) {
      console.error('Error creating profile with direct insert:', insertError);
      
      // Fall back to the RPC method if direct insert fails
      const { error: rpcError } = await supabase.rpc(
        'add_missing_profile',
        {
          user_id: user.id,
          role: finalRole,
          full_name: fullName,
          email,
          avatar_url: avatarUrl
        }
      );
      
      if (rpcError) {
        console.error('Error creating profile with RPC fallback:', rpcError);
        return false;
      } else {
        profileCreated = true;
      }
    } else {
      profileCreated = true;
    }
    
    // Verify profile was created
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (verifyError || !verifyProfile) {
      console.error('Failed to verify profile creation:', verifyError || 'Profile not found');
      return false;
    }
    
    console.log('Profile created and verified successfully:', verifyProfile);
    
    // For athletes with invite code, create the coach-athlete relationship
    if (finalRole === 'athlete' && inviteCode) {
      await createCoachAthleteRelationship(inviteCode, user.id);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error in ensureProfileExists:', error);
    return false;
  }
}

/**
 * Helper function to create coach-athlete relationship immediately during signup
 * @param inviteCode The coach invite code
 * @param athleteId The athlete's user ID
 * @returns Success status, error message if any, and coach info if successful
 */
export async function createCoachAthleteRelationship(inviteCode: string, athleteId: string): Promise<{ 
  success: boolean; 
  error?: string;
  coachName?: string;
  coachId?: string;
}> {
  try {
    console.log('Creating coach-athlete relationship with invite code:', inviteCode);
    
    // Use the resolve_invite RPC to handle the coach-athlete relationship
    const { data: resolveResult, error: resolveError } = await supabase.rpc(
      'resolve_invite', 
      { 
        code: inviteCode, 
        athlete_user_id: athleteId 
      }
    );
    
    if (resolveError) {
      console.error('Error resolving invite code:', resolveError);
      return { success: false, error: resolveError.message };
    }
    
    if (!resolveResult || !resolveResult.success) {
      console.error('Failed to resolve invite code:', resolveResult);
      return { success: false, error: 'Invalid coach invitation code' };
    }
    
    console.log('Successfully created coach-athlete relationship with coach:', resolveResult.coach_name);
    return { 
      success: true,
      coachName: resolveResult.coach_name,
      coachId: resolveResult.coach_id
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating coach-athlete relationship';
    console.error('Failed to create coach-athlete relationship:', errorMessage);
    return { success: false, error: errorMessage };
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
    
    console.log(`Starting email sign-up for ${email} with role: ${role}`);
    
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
          avatar_url: null,
          signupMethod: 'email',
          inviteCode: inviteCode || null
        },
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!user) {
      throw new Error('Failed to create user: No user data returned');
    }

    console.log('Auth user created successfully:', user.id, 'with metadata:', user.user_metadata);
    console.log('Profile will be created automatically by database trigger');
    
    // If this is an athlete with an invite code, create the coach-athlete relationship immediately
    if (role === 'athlete' && inviteCode) {
      console.log('Creating coach-athlete relationship for athlete with invite code:', inviteCode);
      try {
        await createCoachAthleteRelationship(inviteCode, user.id);
      } catch (relationshipError) {
        console.log('Note: Coach-athlete relationship will be created after email verification');
      }
    }
    
    return { user, error: null };
  } catch (error) {
    const errorMessage = error instanceof AuthError ? error.message : 'An error occurred during sign up';
    console.error('Error in signUpWithEmail:', errorMessage);
    return { user: null, error: error instanceof Error ? error : new Error(errorMessage) };
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
    let userData: Record<string, any> = {};
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
      
      if (inviteCodeOrOptions.data) {
        userData = inviteCodeOrOptions.data;
        console.log('User data provided for OAuth:', JSON.stringify(userData));
      }
    }
    
    // Extract role from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlRole = urlParams.get('role') as UserRole | null;
    
    // Determine role from various sources
    const role = userData.role || urlRole || localStorage.getItem('selectedRole') as UserRole || 'athlete';
    
    // Ensure role is included in user data
    userData.role = role;
    console.log('Final role for OAuth sign-in:', role);
    
    // Construct redirect URL with optional invite code
    if (inviteCode) {
      finalRedirectUrl += `${finalRedirectUrl.includes('?') ? '&' : '?'}inviteCode=${encodeURIComponent(inviteCode)}`;
      // Add invite code to user data as well for the database trigger
      userData.inviteCode = inviteCode;
      console.log('Final redirect URL with invite code:', finalRedirectUrl);
    }
    
    // Always add role to the redirect URL for redundancy
    finalRedirectUrl += `${finalRedirectUrl.includes('?') ? '&' : '?'}role=${encodeURIComponent(role)}`;
    console.log('Added role to redirect URL:', role);
    
    // Store user data in localStorage to be retrieved in AuthCallback
    localStorage.setItem('oauthUserData', JSON.stringify(userData));
    console.log('Stored user data in localStorage for OAuth flow:', JSON.stringify(userData));
    
    console.log('Initiating OAuth sign-in with redirect to:', finalRedirectUrl);
    
    // Create options for the signInWithOAuth call
    // Note: We can't directly pass the userData as "data" in the signInWithOAuth call
    // because of TypeScript limitations, but we've stored it in localStorage
    // and added it to the redirect URL to ensure it's available during the auth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: finalRedirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
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

/**
 * Redirects the user to the appropriate page based on their role
 * @param userId Optional user ID (if not provided, will use the current session)
 */
export async function redirectBasedOnRole(userId?: string): Promise<void> {
  try {
    // Get the user's session if userId not provided
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session found');
        // Navigate to login if no session
        window.location.href = '/login';
        return;
      }
      userId = session.user.id;
    }
    
    // Get the user's profile to determine their role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      console.error('Error retrieving user profile:', error);
      // Redirect to login if can't determine role
      window.location.href = '/login';
      return;
    }
    
    console.log('Redirecting based on role:', profile.role);
    
    // Redirect based on role
    if (profile.role === 'coach') {
      // Coaches always go to the coach dashboard
      window.location.href = '/coach';
    } else if (profile.role === 'athlete') {
      // For athletes, check if they have any coach relationships (including inactive)
      const { data: coachRelationships, error: relationshipError } = await supabase
        .from('coach_athletes')
        .select('id, status')
        .eq('athlete_id', userId)
        .in('status', ['active', 'pending', 'inactive']);
      
      if (relationshipError) {
        console.error('Error checking coach relationships:', relationshipError);
      }
      
      // If athlete has any active, pending, or inactive coach relationship, redirect to dashboard
      // Otherwise, redirect to the invite code entry page
      if (coachRelationships && coachRelationships.length > 0) {
        console.log('Athlete has coach relationships, redirecting to dashboard');
        window.location.href = '/athlete';
      } else {
        console.log('Athlete has no coach relationships, redirecting to invite code entry');
        window.location.href = '/invite-code-entry';
      }
    } else {
      // Fallback for unknown role
      console.warn('Unknown user role:', profile.role);
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error in redirectBasedOnRole:', error);
    // Redirect to login page on any error
    window.location.href = '/login';
  }
}

// Athlete Activity Functions

export interface AthleteActivity {
  id: string;
  athlete_id: string;
  workout_id: string;
  scheduled_on: string | null;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  is_unscaled: boolean | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get athlete activity for a specific workout and date
 */
export async function getAthleteActivity(
  athleteId: string,
  workoutId: string,
  scheduledOn: string | null = null
): Promise<{ data: AthleteActivity | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('athlete_activity')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('workout_id', workoutId)
      .eq('scheduled_on', scheduledOn)
      .maybeSingle();

    return { data, error };
  } catch (error) {
    console.error('Error fetching athlete activity:', error);
    return { data: null, error };
  }
}

/**
 * Create or update athlete activity record
 */
export async function upsertAthleteActivity(
  athleteId: string,
  workoutId: string,
  scheduledOn: string | null,
  updates: Partial<Pick<AthleteActivity, 'is_completed' | 'completed_at' | 'notes' | 'is_unscaled'>>
): Promise<{ data: AthleteActivity | null; error: any }> {
  try {
    // First, try to get existing record
    const { data: existing } = await supabase
      .from('athlete_activity')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('workout_id', workoutId)
      .eq('scheduled_on', scheduledOn)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('athlete_activity')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      return { data, error };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('athlete_activity')
        .insert({
          athlete_id: athleteId,
          workout_id: workoutId,
          scheduled_on: scheduledOn,
          ...updates
        })
        .select()
        .single();

      return { data, error };
    }
  } catch (error) {
    console.error('Error upserting athlete activity:', error);
    return { data: null, error };
  }
}

/**
 * Mark workout as completed
 */
export async function markWorkoutCompleted(
  athleteId: string,
  workoutId: string,
  scheduledOn: string | null,
  isUnscaled: boolean
): Promise<{ data: AthleteActivity | null; error: any }> {
  try {
    const updates = {
      is_completed: true,
      completed_at: new Date().toISOString(),
      is_unscaled: isUnscaled
    };

    return await upsertAthleteActivity(athleteId, workoutId, scheduledOn, updates);
  } catch (error) {
    console.error('Error marking workout as completed:', error);
    return { data: null, error };
  }
}

/**
 * Mark workout as incomplete (uncheck completion)
 */
export async function markWorkoutIncomplete(
  athleteId: string,
  workoutId: string,
  scheduledOn: string | null
): Promise<{ data: AthleteActivity | null; error: any }> {
  try {
    const updates = {
      is_completed: false,
      completed_at: null,
      is_unscaled: null
    };

    return await upsertAthleteActivity(athleteId, workoutId, scheduledOn, updates);
  } catch (error) {
    console.error('Error marking workout as incomplete:', error);
    return { data: null, error };
  }
}

/**
 * Update workout notes
 */
export async function updateWorkoutNotes(
  athleteId: string,
  workoutId: string,
  scheduledOn: string | null,
  notes: string
): Promise<{ data: AthleteActivity | null; error: any }> {
  try {
    const updates = { notes };
    return await upsertAthleteActivity(athleteId, workoutId, scheduledOn, updates);
  } catch (error) {
    console.error('Error updating workout notes:', error);
    return { data: null, error };
  }
}

/**
 * Get recent athlete activity for a coach's athletes
 */
export async function getCoachAthleteActivity(
  coachId: string,
  limit: number = 10
): Promise<{ data: any[] | null; error: any }> {
  try {
    // First, get the athlete IDs for this coach
    const { data: athleteRelations, error: athleteError } = await supabase
      .from('coach_athletes')
      .select('athlete_id')
      .eq('coach_id', coachId)
      .eq('status', 'active');

    if (athleteError) {
      console.error('Error fetching athlete relations:', athleteError);
      return { data: null, error: athleteError };
    }

    // If no athletes found, return empty array
    if (!athleteRelations || athleteRelations.length === 0) {
      return { data: [], error: null };
    }

    // Extract athlete IDs
    const athleteIds = athleteRelations.map(relation => relation.athlete_id);

    // Now fetch the activity data for these athletes
    const { data, error } = await supabase
      .from('athlete_activity')
      .select(`
        *,
        athlete:profiles!athlete_activity_athlete_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        workout:workouts!athlete_activity_workout_id_fkey(
          workout_id,
          description,
          coach_id
        )
      `)
      .in('athlete_id', athleteIds)
      .order('updated_at', { ascending: false })
      .limit(limit);

    return { data, error };
  } catch (error) {
    console.error('Error fetching coach athlete activity:', error);
    return { data: null, error };
  }
}

/**
 * Delete an athlete account and all related data
 * Can be called by the athlete themselves or by a coach who has the athlete
 */
export async function deleteAthleteAccount(
  athleteId: string,
  requestingUserId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('Deleting athlete account:', athleteId);
    
    const { data, error } = await supabase.rpc('delete_athlete_account', {
      target_athlete_id: athleteId,
      requesting_user_id: requestingUserId || null
    });

    if (error) {
      console.error('Error calling delete_athlete_account RPC:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete athlete account'
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No response from deletion operation'
      };
    }

    // The stored procedure returns JSON, check if it indicates success
    if (data.success === false) {
      return {
        success: false,
        error: data.error || 'Deletion operation failed'
      };
    }

    console.log('Athlete account deleted successfully:', data);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error in deleteAthleteAccount:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
