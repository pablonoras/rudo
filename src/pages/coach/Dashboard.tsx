/**
 * src/pages/coach/Dashboard.tsx
 * 
 * This file contains the actual Coach Dashboard that will display real data from Supabase.
 * Added invitation code management functionality that allows coaches to:
 * - View their unique invitation link
 * - Copy the link to clipboard
 * - Regenerate a new code (invalidating old links)
 * - Disable the invitation code
 * - Manually edit the code
 */

import { format, parseISO } from 'date-fns';
import {
    Calendar,
    ChevronRight,
    Clock,
    Copy,
    Edit,
    FilePlus,
    Link,
    Loader2,
    PlusCircle,
    RefreshCw,
    Shield,
    ShieldOff,
    UserPlus,
    Users,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';
import { useWorkoutStore } from '../../lib/workout';

// Define a type for athlete data
interface Athlete {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: string;
}

export function CoachDashboard() {
  const { profile, refreshProfile } = useProfile();
  const { programs, fetchPrograms } = useWorkoutStore();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite code related states
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [inviteCodeAction, setInviteCodeAction] = useState<'idle' | 'generating' | 'saving' | 'disabling'>('idle');
  const [copySuccess, setCopySuccess] = useState(false);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get coach name from profile
  const coachName = profile?.full_name || 'Coach';
  
  // Generate the invite link
  const getInviteLink = () => {
    if (!profile?.invite_code) return '';
    return `${window.location.origin}/register?code=${profile.invite_code}`;
  };
  
  // Copy the invite link to clipboard
  const copyInviteLink = async () => {
    const link = getInviteLink();
    if (!link) return;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };
  
  // Generate a random invite code (lowercase alphanumeric, 10 chars)
  const generateRandomCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  // Regenerate a new invite code
  const regenerateInviteCode = async () => {
    if (!profile) return;
    
    try {
      setInviteCodeAction('generating');
      setInviteCodeError(null);
      
      // Generate a new random code client-side
      const newCode = generateRandomCode();
      
      const { error } = await supabase
        .from('profiles')
        .update({ invite_code: newCode })
        .eq('id', profile.id);
      
      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          // Try again with a different random code
          setTimeout(() => regenerateInviteCode(), 100);
          return;
        }
        throw error;
      }
      
      // Refresh the profile to get the new code
      await refreshProfile();
    } catch (err) {
      console.error('Error regenerating invite code:', err);
      setInviteCodeError('Failed to regenerate code. Please try again.');
    } finally {
      setInviteCodeAction('idle');
    }
  };
  
  // Disable the invite code
  const disableInviteCode = async () => {
    if (!profile) return;
    
    try {
      setInviteCodeAction('disabling');
      setInviteCodeError(null);
      
      const { error } = await supabase
        .from('profiles')
        .update({ invite_code: null })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      // Refresh the profile
      await refreshProfile();
    } catch (err) {
      console.error('Error disabling invite code:', err);
      setInviteCodeError('Failed to disable code. Please try again.');
    } finally {
      setInviteCodeAction('idle');
    }
  };
  
  // Save a custom invite code
  const saveInviteCode = async () => {
    if (!profile || !newInviteCode.trim()) return;
    
    // Validate the invite code format - lowercase, no spaces
    const cleanCode = newInviteCode.trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(cleanCode)) {
      setInviteCodeError('Code must contain only lowercase letters and numbers without spaces.');
      return;
    }
    
    try {
      setInviteCodeAction('saving');
      setInviteCodeError(null);
      
      const { error } = await supabase
        .from('profiles')
        .update({ invite_code: cleanCode })
        .eq('id', profile.id);
      
      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          setInviteCodeError('This code is already in use. Please choose a different one.');
          return;
        }
        throw error;
      }
      
      // Refresh the profile and exit edit mode
      await refreshProfile();
      setIsEditingCode(false);
      setNewInviteCode('');
    } catch (err) {
      console.error('Error saving invite code:', err);
      setInviteCodeError('Failed to save code. Please try again.');
    } finally {
      setInviteCodeAction('idle');
    }
  };
  
  // Handle starting code edit
  const startEditingCode = () => {
    if (profile?.invite_code) {
      setNewInviteCode(profile.invite_code);
    }
    setIsEditingCode(true);
    setInviteCodeError(null);
  };
  
  // Cancel code editing
  const cancelEditingCode = () => {
    setIsEditingCode(false);
    setNewInviteCode('');
    setInviteCodeError(null);
  };
  
  // Fetch athletes assigned to this coach
  const fetchAthletes = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      // Get athletes from the coach_athletes relation
      const { data: athleteRelations, error: relationError } = await supabase
        .from('coach_athletes')
        .select('athlete_id, status')
        .eq('coach_id', profile.id)
        .eq('status', 'active');
      
      if (relationError) {
        console.error('Error fetching athlete relations:', relationError);
        return;
      }
      
      if (!athleteRelations || athleteRelations.length === 0) {
        console.log('No athletes found for this coach');
        setAthletes([]);
        setLoading(false);
        return;
      }
      
      // Get athlete IDs to fetch their profile data
      const athleteIds = athleteRelations.map(relation => relation.athlete_id);
      
      // Fetch athlete profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', athleteIds);
      
      if (profileError) {
        console.error('Error fetching athlete profiles:', profileError);
        return;
      }
      
      // Create a map for quick lookups
      const profileMap: Record<string, any> = {};
      profileData?.forEach(profile => {
        profileMap[profile.id] = profile;
      });
      
      // Combine relationship data with profile data
      const formattedAthletes = athleteRelations
        .map(relation => {
          const profile = profileMap[relation.athlete_id];
          
          if (!profile) {
            return {
              id: relation.athlete_id,
              full_name: 'Athlete (data incomplete)',
              email: 'email@not.available',
              avatar_url: null,
              status: relation.status,
            } as Athlete;
          }
          
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            avatar_url: profile.avatar_url,
            status: relation.status,
          } as Athlete;
        });
      
      setAthletes(formattedAthletes);
    } catch (error) {
      console.error('Error in fetchAthletes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    if (profile) {
      fetchPrograms();
      fetchAthletes();
    }
  }, [profile, fetchPrograms]);

  // Get programs to display
  const programList = Object.values(programs)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {getGreeting()}, {coachName} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome to your dashboard. Here you can manage your athletes and programs.
        </p>
      </div>

      {/* Invitation Code */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Athlete Invitation</h2>
        
        {inviteCodeError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm">
            {inviteCodeError}
          </div>
        )}
        
        {isEditingCode ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Invitation Code
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="inviteCode"
                  type="text"
                  value={newInviteCode}
                  onChange={(e) => setNewInviteCode(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter custom code"
                  disabled={inviteCodeAction !== 'idle'}
                />
                <button
                  onClick={saveInviteCode}
                  disabled={inviteCodeAction !== 'idle' || !newInviteCode.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteCodeAction === 'saving' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={cancelEditingCode}
                  disabled={inviteCodeAction !== 'idle'}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use lowercase letters and numbers only. This code will be part of your invite link.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {profile?.invite_code ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Invitation Link
                  </label>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {getInviteLink()}
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-r-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {copySuccess ? (
                        <span className="text-green-600 dark:text-green-400">Copied!</span>
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Share this link with your athletes to invite them to join your team.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={startEditingCode}
                    disabled={inviteCodeAction !== 'idle'}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit Code
                  </button>
                  <button
                    onClick={regenerateInviteCode}
                    disabled={inviteCodeAction !== 'idle'}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {inviteCodeAction === 'generating' ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Regenerate Code
                  </button>
                  <button
                    onClick={disableInviteCode}
                    disabled={inviteCodeAction !== 'idle'}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {inviteCodeAction === 'disabling' ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <ShieldOff className="h-3 w-3 mr-1" />
                    )}
                    Disable Code
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 mb-4">No active invitation code</p>
                <button
                  onClick={regenerateInviteCode}
                  disabled={inviteCodeAction !== 'idle'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {inviteCodeAction === 'generating' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Generate Invite Code
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RouterLink
            to="/coach/programs"
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <FilePlus className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Create Program</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Build workout templates</p>
            </div>
          </RouterLink>
          <RouterLink
            to="/coach/athletes"
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Manage Athletes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View and approve athletes</p>
            </div>
          </RouterLink>
        </div>
      </div>

      {/* Programs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Your Programs
            </h2>
            <RouterLink
              to="/coach/programs"
              className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              New Program
            </RouterLink>
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading programs...</p>
          </div>
        ) : programList.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {programList.map((program) => (
              <RouterLink
                key={program.id}
                to={`/coach/program/${program.id}`}
                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {program.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {format(parseISO(program.startDate), 'MMM d')} -{' '}
                      {format(parseISO(program.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{program.weekCount} weeks</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{program.assignedTo.athletes.length} assigned</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </RouterLink>
            ))}
            {programList.length < Object.values(programs).length && (
              <RouterLink 
                to="/coach/programs"
                className="block px-6 py-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                View all programs
              </RouterLink>
            )}
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No programs yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              Create your first workout program to start assigning to your athletes and teams.
            </p>
            <RouterLink
              to="/coach/programs"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Program
            </RouterLink>
          </div>
        )}
      </div>
    </div>
  );
}