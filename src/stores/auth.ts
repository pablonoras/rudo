import { create } from 'zustand';
import { supabase, type Profile } from '../lib/supabase';

interface AuthState {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  initialize: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,
  error: null,
  initialize: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ profile: null, isLoading: false });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      set({ profile, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  setProfile: (profile) => set({ profile }),
}));

// Set up auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    useAuthStore.getState().setProfile(profile);
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.getState().setProfile(null);
  }
});