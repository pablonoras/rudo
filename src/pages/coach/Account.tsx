/**
 * src/pages/coach/Account.tsx
 * 
 * Coach account settings page that allows coaches to manage their profile and security settings.
 * Now includes invitation link management functionality.
 */

import {
  Copy,
  Edit,
  Link,
  Loader2,
  RefreshCw,
  Shield,
  ShieldOff,
  X
} from 'lucide-react';
import { useState } from 'react';
import UserProfile from '../../components/account/UserProfile';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';

export function CoachAccount() {
  const { profile, refreshProfile } = useProfile();
  const [copySuccess, setCopySuccess] = useState(false);
  const [inviteCodeAction, setInviteCodeAction] = useState<'idle' | 'generating' | 'disabling' | 'saving'>('idle');
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState('');

  const getInviteLink = () => {
    return `${window.location.origin}/register/athlete?code=${profile?.invite_code}`;
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(getInviteLink());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateRandomCode = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const regenerateInviteCode = async () => {
    if (!profile) return;
    
    setInviteCodeAction('generating');
    setInviteCodeError(null);
    
    try {
      const newCode = generateRandomCode();
      
      const { error } = await supabase
        .from('profiles')
        .update({ invite_code: newCode })
        .eq('id', profile.id);
      
      if (error) {
        throw error;
      }
      
      await refreshProfile();
    } catch (error) {
      console.error('Error regenerating invite code:', error);
      setInviteCodeError('Failed to regenerate invite code. Please try again.');
    } finally {
      setInviteCodeAction('idle');
    }
  };

  const disableInviteCode = async () => {
    if (!profile) return;
    
    setInviteCodeAction('disabling');
    setInviteCodeError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ invite_code: null })
        .eq('id', profile.id);
      
      if (error) {
        throw error;
      }
      
      await refreshProfile();
    } catch (error) {
      console.error('Error disabling invite code:', error);
      setInviteCodeError('Failed to disable invite code. Please try again.');
    } finally {
      setInviteCodeAction('idle');
    }
  };

  const saveInviteCode = async () => {
    if (!profile || !newInviteCode.trim()) return;
    
    setInviteCodeAction('saving');
    setInviteCodeError(null);
    
    try {
      // Check if code already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('invite_code', newInviteCode.trim())
        .neq('id', profile.id)
        .maybeSingle();
      
      if (existingProfile) {
        setInviteCodeError('This code is already in use. Please choose a different one.');
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ invite_code: newInviteCode.trim() })
        .eq('id', profile.id);
      
      if (error) {
        throw error;
      }
      
      await refreshProfile();
      setIsEditingCode(false);
      setNewInviteCode('');
    } catch (error) {
      console.error('Error saving invite code:', error);
      setInviteCodeError('Failed to save invite code. Please try again.');
    } finally {
      setInviteCodeAction('idle');
    }
  };

  const startEditingCode = () => {
    setNewInviteCode(profile?.invite_code || '');
    setIsEditingCode(true);
    setInviteCodeError(null);
  };

  const cancelEditingCode = () => {
    setIsEditingCode(false);
    setNewInviteCode('');
    setInviteCodeError(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Account Settings
      </h1>
      
      {/* Invitation Code Section */}
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

      {/* User Profile Section */}
      <UserProfile role="coach" />
    </div>
  );
} 