/**
 * src/contexts/ProfileContext.tsx
 * 
 * Context for managing and providing user profile data across the application.
 * Fetches profile data from Supabase and provides it to components.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, getCurrentProfile, supabase } from '../lib/supabase';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const profileData = await getCurrentProfile();
      
      if (profileData) {
        // Ensure we have a valid profile with required fields
        const sanitizedProfile: Profile = {
          ...profileData,
          // Ensure avatar_url is undefined rather than null or empty string for cleaner handling
          avatar_url: profileData.avatar_url || undefined
        };
        setProfile(sanitizedProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile();
      } else {
        setProfile(null);
      }
    });

    // Initial profile fetch
    fetchProfile();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext); 