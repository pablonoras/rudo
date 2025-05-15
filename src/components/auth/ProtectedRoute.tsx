import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '../../lib/supabase';
import { getCurrentProfile, supabase } from '../../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; role?: UserRole } | null>(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Get the user's profile from the database to check their role
        const profile = await getCurrentProfile();
        
        if (profile) {
          setUser({ 
            id: session.user.id, 
            role: profile.role 
          });
          
          // Check if the user's role matches the required role for this route
          setAuthorized(profile.role === role);
        } else {
          setUser({ id: session.user.id });
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkAuth();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (!authorized) {
    // Redirect to the appropriate dashboard based on the user's actual role
    if (user.role === 'coach') {
      return <Navigate to="/coach" replace />;
    } else if (user.role === 'athlete') {
      return <Navigate to="/athlete" replace />;
    } else {
      // If role is unknown, redirect to login
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;