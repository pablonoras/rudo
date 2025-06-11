import type { UserRole } from './supabase';
import { createCoachAthleteRelationship, supabase } from './supabase';

export interface EmailVerificationResult {
  success: boolean;
  userId?: string;
  role?: UserRole;
  error?: string;
  profile?: any;
}

/**
 * Handles the email verification process after a user clicks on the verification link.
 * This function ensures a profile is created for the user with the correct role.
 */
export async function handleEmailVerification(): Promise<EmailVerificationResult> {
  try {
    console.log('Starting handleEmailVerification process');
    
    // Step 1: Get the current session (should exist if verification link was clicked)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error during email verification:', sessionError);
      return { 
        success: false, 
        error: `Session error: ${sessionError.message}` 
      };
    }
    
    if (!session) {
      console.error('No active session found during email verification');
      return { 
        success: false, 
        error: 'No active session found. Please try logging in again.' 
      };
    }
    
    console.log('User authenticated during email verification:', session.user.id);
    console.log('Session data:', JSON.stringify({
      user_id: session.user.id,
      expires_at: session.expires_at,
      auth_token_length: session.access_token?.length || 0
    }));
    
    // Step 2: Get user metadata to determine role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error fetching user during email verification:', userError);
      return { 
        success: false, 
        userId: session.user.id,
        error: `User fetch error: ${userError.message}` 
      };
    }
    
    if (!user) {
      console.error('User not found during email verification');
      return { 
        success: false, 
        error: 'User not found. Please try logging in again.' 
      };
    }
    
    console.log('User email verification metadata:', {
      id: user.id,
      email: user.email,
      emailConfirmed: user.email_confirmed_at,
      metadata: user.user_metadata,
      app_metadata: user.app_metadata
    });
    
    // Step 3: Get role from user metadata or default to 'athlete'
    const role = user.user_metadata?.role as UserRole || 'athlete';
    const inviteCode = user.user_metadata?.inviteCode as string || null;
    
    console.log('Email verification for user with role:', role, 'and invite code:', inviteCode || 'none');
    
    // Step 4: Check if profile exists already
    console.log(`Checking for existing profile for user ID: ${user.id}`);
    try {
      const { data: existingProfile, error: profileError, status } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log(`Profile check API response status: ${status}`);
      
      if (profileError) {
        console.error(`Error checking for existing profile: ${profileError.message}`, {
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
          status: status
        });
        // Continue anyway, as we'll try to create the profile
      }
      
      console.log('Profile check result:', { 
        hasProfile: !!existingProfile,
        profileDetails: existingProfile || 'none'
      });
      
      // If this is an athlete with invite code, process the invitation
      if (role === 'athlete' && inviteCode) {
        console.log('Processing invite code for athlete after email verification:', inviteCode);
        await createCoachAthleteRelationship(inviteCode, user.id);
      }
      
      // Step 5: If profile doesn't exist, create it
      if (!existingProfile) {
        console.log('Creating profile for verified email user with role:', role);
        
        // Extract name from metadata or email
        const fullName = user.user_metadata?.full_name ||
                         user.user_metadata?.name ||
                         (user.email ? user.email.split('@')[0] : 'User');
                         
        const email = user.email || '';
        const avatarUrl = user.user_metadata?.avatar_url || 
                          user.user_metadata?.picture || 
                          null;
        
        // Try direct profile creation
        console.log(`Attempting to create profile with data:`, {
          id: user.id,
          role,
          fullName,
          email: email ? email.substring(0, 10) + '...' : '', // Partial for privacy
          hasAvatarUrl: !!avatarUrl
        });
        
        const profileData = {
          id: user.id,
          role,
          full_name: fullName,
          email,
          avatar_url: avatarUrl
        };
        
        const { error: insertError, status: insertStatus } = await supabase
          .from('profiles')
          .insert(profileData);
        
        console.log(`Profile insert API response status: ${insertStatus}`);
        
        if (insertError) {
          console.error('Error creating profile during email verification:', {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            status: insertStatus
          });
          
          // Try fallback using RPC method
          console.log('Attempting fallback profile creation with RPC');
          const { error: rpcError, status: rpcStatus } = await supabase.rpc(
            'add_missing_profile',
            {
              user_id: user.id,
              role,
              full_name: fullName,
              email,
              avatar_url: avatarUrl
            }
          );
          
          console.log(`RPC call response status: ${rpcStatus}`);
          
          if (rpcError) {
            console.error('RPC fallback profile creation failed:', {
              message: rpcError.message,
              code: rpcError.code,
              details: rpcError.details,
              hint: rpcError.hint,
              status: rpcStatus
            });
            return { 
              success: false, 
              userId: user.id,
              role,
              error: `Failed to create profile: ${rpcError.message}` 
            };
          }
        }
        
        console.log('Profile creation completed for verified email user');
        
        // Verify profile creation
        console.log('Verifying profile creation');
        const { data: verifyProfile, error: verifyError, status: verifyStatus } = await supabase
          .from('profiles')
          .select('id, role, full_name, email')
          .eq('id', user.id)
          .maybeSingle();
        
        console.log(`Profile verification API response status: ${verifyStatus}`);
        
        if (verifyError) {
          console.error('Error verifying profile creation:', {
            message: verifyError.message,
            code: verifyError.code,
            details: verifyError.details,
            hint: verifyError.hint,
            status: verifyStatus
          });
        }
        
        if (!verifyProfile) {
          console.error('Profile verification after creation failed: Profile not found');
          return { 
            success: false, 
            userId: user.id,
            role,
            error: 'Created profile could not be verified' 
          };
        }
        
        console.log('Profile verified after creation:', verifyProfile);
        
        return { 
          success: true, 
          userId: user.id, 
          role, 
          profile: verifyProfile 
        };
      } else {
        // Profile already exists
        console.log('Profile already exists');
        
        return { 
          success: true, 
          userId: user.id, 
          role: existingProfile.role as UserRole, 
          profile: existingProfile 
        };
      }
    } catch (apiError: any) {
      console.error('API error during profile operations:', {
        message: apiError.message,
        stack: apiError.stack,
        name: apiError.name,
        code: apiError.code
      });
      return {
        success: false,
        userId: user.id,
        error: `API error: ${apiError.message}`
      };
    }
  } catch (error: any) {
    console.error('Unexpected error during email verification:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return { 
      success: false, 
      error: `Unexpected error: ${error.message || 'Unknown error'}` 
    };
  }
} 