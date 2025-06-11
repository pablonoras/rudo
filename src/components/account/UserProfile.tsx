/**
 * src/components/account/UserProfile.tsx
 * 
 * Component for managing user account settings, including personal information and password changes.
 * For athletes, also includes coach management section.
 */

import { AtSign, ClockIcon, Loader2, Save, Trash2, User, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { deleteAthleteAccount, getCurrentProfile, sendPasswordResetEmail, supabase } from '../../lib/supabase';

interface UserProfileProps {
  role: 'coach' | 'athlete';
}

// Type for coach connection
type CoachConnection = {
  id: string;
  coach_id: string;
  status: 'pending' | 'active' | 'inactive' | 'declined';
  coach: {
    full_name: string;
    avatar_url: string | null;
  };
};

const UserProfile = ({ role }: UserProfileProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // Coach-related state (only for athletes)
  const [coachConnections, setCoachConnections] = useState<CoachConnection[]>([]);
  const [isLoadingCoach, setIsLoadingCoach] = useState(true);
  const [coachErrorMessage, setCoachErrorMessage] = useState<string | null>(null);
  
  // Pending coach invitation state
  const [pendingCoachName, setPendingCoachName] = useState<string | null>(null);
  const [hasPendingInvite, setHasPendingInvite] = useState(false);

  // Delete account state (only for athletes)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        setUser(user);
        setEmail(user.email || '');
        setEmailVerified(user.email_confirmed_at !== null);
        
        // Check if user is OAuth user
        const hasOAuthIdentities = user.identities && 
          user.identities.some(identity => identity.provider !== 'email');
        
        const hasOAuthProvider = 
          user.app_metadata?.provider && 
          user.app_metadata.provider !== 'email';
          
        setIsOAuthUser(hasOAuthIdentities || hasOAuthProvider);
        
        console.log('User auth info in profile:', {
          hasOAuthIdentities,
          hasOAuthProvider,
          identities: user.identities,
          appMetadata: user.app_metadata
        });
        
        // Get profile data
        const profile = await getCurrentProfile();
        if (!profile) {
          throw new Error('Profile not found');
        }
        
        setProfile(profile);
        
        // Set form fields
        const nameParts = profile.full_name.split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');

        // Load coach connections for athletes
        if (role === 'athlete') {
          await fetchCoachConnections(profile);
          
          // Check localStorage for pending invitations
          const storedCoachName = localStorage.getItem('pendingCoachName');
          const hasPendingStatus = localStorage.getItem('pendingJoinStatus') === 'true';
          
          if (storedCoachName && hasPendingStatus) {
            setPendingCoachName(storedCoachName);
            setHasPendingInvite(true);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setErrorMessage('Failed to load user data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [role]);

  // Function to refresh coach connections (only for athletes)
  const fetchCoachConnections = async (profileData?: any) => {
    const currentProfile = profileData || profile;
    if (!currentProfile || role !== 'athlete') return;
    
    try {
      setIsLoadingCoach(true);
      
      // Step 1: Get coach-athlete relationships
      const { data: relationships, error: relationshipsError } = await supabase
        .from('coach_athletes')
        .select('id, coach_id, status')
        .eq('athlete_id', currentProfile.id)
        .not('status', 'eq', 'inactive'); // Don't show inactive coaches
      
      if (relationshipsError) {
        console.error('Error fetching coach relationships:', relationshipsError);
        throw relationshipsError;
      }
      
      if (!relationships || relationships.length === 0) {
        setCoachConnections([]);
        setIsLoadingCoach(false);
        return;
      }
      
      // Step 2: Get coach profiles for all coach IDs
      const coachIds = relationships.map(rel => rel.coach_id);
      const { data: coaches, error: coachesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', coachIds);
      
      if (coachesError) {
        console.error('Error fetching coach profiles:', coachesError);
        throw coachesError;
      }
      
      // Step 3: Combine the data
      const typedData: CoachConnection[] = relationships.map(relationship => {
        const coach = coaches?.find(c => c.id === relationship.coach_id);
        
        return {
          id: relationship.id,
          coach_id: relationship.coach_id,
          status: relationship.status as 'pending' | 'active' | 'inactive' | 'declined',
          coach: {
            full_name: coach?.full_name || 'Unknown Coach',
            avatar_url: coach?.avatar_url || null
          }
        };
      });
      
      setCoachConnections(typedData);
      
      // Check if we have a pending coach invitation from localStorage
      const storedCoachName = localStorage.getItem('pendingCoachName');
      const hasPendingStatus = localStorage.getItem('pendingJoinStatus') === 'true';
      const pendingCoachId = localStorage.getItem('pendingCoachId');
      
      // Only show the pending message if we don't already have this coach in our connections
      if (storedCoachName && hasPendingStatus && pendingCoachId) {
        // Check if this coach relationship is now active or no longer pending
        const coachRelationship = relationships?.find(conn => 
          conn.coach_id === pendingCoachId
        );
        
        if (coachRelationship) {
          if (coachRelationship.status === 'active') {
            // Coach has approved the request, clear localStorage
            localStorage.removeItem('pendingCoachName');
            localStorage.removeItem('pendingCoachId');
            localStorage.removeItem('pendingJoinStatus');
            setHasPendingInvite(false);
            setPendingCoachName(null);
          } else if (coachRelationship.status === 'pending') {
            // Still pending, show the message
            setPendingCoachName(storedCoachName);
            setHasPendingInvite(true);
          } else {
            // Status is something else (declined, etc.), clear localStorage
            localStorage.removeItem('pendingCoachName');
            localStorage.removeItem('pendingCoachId');
            localStorage.removeItem('pendingJoinStatus');
            setHasPendingInvite(false);
            setPendingCoachName(null);
          }
        } else {
          // Coach relationship not found in database but exists in localStorage
          // This could happen if the relationship was deleted or if the localStorage is stale
          // Show the message anyway, it will be cleared on next refresh if not valid
          setPendingCoachName(storedCoachName);
          setHasPendingInvite(true);
        }
      }
    } catch (err) {
      console.error('Error fetching coach connections:', err);
      setCoachErrorMessage('Failed to load coach information');
    } finally {
      setIsLoadingCoach(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    
    if (!profile) return;
    
    try {
      setIsSaving(true);
      
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
      
      if (error) {
        throw error;
      }
      
      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName
        }
      });
      
      if (metadataError) {
        console.warn('Warning: Could not update auth metadata:', metadataError);
      }
      
      setSuccessMessage('Profile updated successfully');
      
      // Update local state
      setProfile({
        ...profile,
        full_name: fullName
      });
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setErrorMessage(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setSuccessMessage('Password updated successfully');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      // Handle specific errors
      if (error.message.includes('password')) {
        setPasswordError(error.message);
      } else {
        setPasswordError('Failed to update password. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!email) return;
    
    try {
      setIsSaving(true);
      setErrorMessage(null);
      
      const { success, error } = await sendPasswordResetEmail(email);
      
      if (error) {
        throw error;
      }
      
      if (success) {
        setVerificationSent(true);
        setTimeout(() => {
          setVerificationSent(false);
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      setErrorMessage('Failed to send verification email. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      console.log('Starting account deletion for athlete:', profile.id);
      
      const result = await deleteAthleteAccount(profile.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }
      
      console.log('Account deleted successfully:', result.data);
      
      // Sign out the user and redirect to home page
      await supabase.auth.signOut();
      
      // Show success message briefly before redirect
      setSuccessMessage('Your account has been successfully deleted.');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Account Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information and account security.
          </p>
        </div>
        
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md text-sm">
            {successMessage}
          </div>
        )}
        
        <div className="p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
            Personal Information
          </h3>
          
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div className="mt-1 flex items-center">
                {emailVerified ? (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    Verified
                  </span>
                ) : (
                  <div className="flex items-center">
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center mr-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                      Not verified
                    </span>
                    <button
                      type="button"
                      onClick={handleSendVerificationEmail}
                      disabled={isSaving || verificationSent}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                    >
                      {verificationSent ? 'Verification email sent!' : 'Resend verification email'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Coaches Section - Only for Athletes */}
          {role === 'athlete' && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                Your Coaches
              </h3>
              
              {coachErrorMessage && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm">
                  {coachErrorMessage}
                </div>
              )}

              {/* Pending Coach Invitation Message */}
              {hasPendingInvite && pendingCoachName && (
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Waiting for coach approval
                      </h4>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                        <p>
                          You've joined <strong>{pendingCoachName}</strong>. Waiting for coach approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingCoach ? (
                <div className="p-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">Loading coach information...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {coachConnections.filter(conn => conn.status === 'active').length > 0 ? (
                    coachConnections
                      .filter(conn => conn.status === 'active')
                      .map(connection => (
                        <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {connection.coach.avatar_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={connection.coach.avatar_url}
                                  alt={`${connection.coach.full_name}'s avatar`}
                                  onError={(e) => {
                                    // If image fails to load, replace with default icon
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `
                                        <div class="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                          <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0014.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                                          </svg>
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {connection.coach.full_name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Active
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : coachConnections.filter(conn => conn.status === 'pending').length > 0 ? (
                    coachConnections
                      .filter(conn => conn.status === 'pending')
                      .map(connection => (
                        <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {connection.coach.avatar_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={connection.coach.avatar_url}
                                  alt={`${connection.coach.full_name}'s avatar`}
                                  onError={(e) => {
                                    // If image fails to load, replace with default icon
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `
                                        <div class="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                          <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0014.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                                          </svg>
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {connection.coach.full_name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Pending approval
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="p-6 text-center border border-gray-200 dark:border-gray-600 rounded-lg">
                      <UserCheck className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No coaches yet</h4>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        You don't have any coaches yet. Ask a coach for their invitation link to join.
                      </p>
                      <RouterLink
                        to="/athlete/find-coach"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Find a Coach
                      </RouterLink>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Password Section - Only for non-OAuth users */}
          {!isOAuthUser && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 id="change-password" className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                Change Password
              </h3>
              
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm">
                  {passwordError}
                </div>
              )}
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    At least 8 characters required
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Delete Account Section - Only for athletes */}
          {role === 'athlete' && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                Delete Account
              </h3>
              
              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm">
                  {deleteError}
                </div>
              )}
              
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                      Permanently delete your account
                    </h4>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                      <p className="mb-2">
                        This action will permanently delete your athlete account and all associated data:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your profile and personal information</li>
                        <li>All coach-athlete relationships</li>
                        <li>Your workout and program assignments</li>
                        <li>Your workout history and activity records</li>
                        <li>Your login credentials</li>
                      </ul>
                      <p className="mt-2 font-medium">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                disabled={isDeleting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mt-4">
                Delete Account
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirmation(false)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1 inline" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Forever'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 