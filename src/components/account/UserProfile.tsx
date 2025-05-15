/**
 * src/components/account/UserProfile.tsx
 * 
 * Component for managing user account settings, including personal information and password changes.
 */

import { AtSign, Loader2, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentProfile, sendPasswordResetEmail, supabase } from '../../lib/supabase';

interface UserProfileProps {
  role: 'coach' | 'athlete';
}

const UserProfile = ({ role }: UserProfileProps) => {
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
      } catch (error) {
        console.error('Error loading user data:', error);
        setErrorMessage('Failed to load user data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);

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
          
          {isOAuthUser ? (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                Password Management
              </h3>
            </div>
          ) : (
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
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 