import { useState } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';

interface ManualAthleteFormProps {
  onAdd: () => void;
  onCancel: () => void;
}

type AthleteLevel = 'beginner' | 'intermediate' | 'advanced';

export function ManualAthleteForm({ onAdd, onCancel }: ManualAthleteFormProps) {
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    level: 'beginner' as AthleteLevel,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) {
      setError('Coach profile not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Generate a random password (will not be used, as coaches will send invite links)
      const password = Math.random().toString(36).slice(-8);
      
      // 2. Create auth user and profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password,
        options: {
          data: {
            role: 'athlete',
            full_name: `${formData.firstName} ${formData.lastName}`,
          },
        },
      });

      if (authError || !authData.user) {
        throw authError || new Error('Failed to create user');
      }

      // 3. Create athlete profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        role: 'athlete',
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
      });

      if (profileError) {
        throw profileError;
      }

      // 4. Add coach-athlete relationship
      const { error: relationError } = await supabase.from('coach_athletes').insert({
        coach_id: profile.id,
        athlete_id: authData.user.id,
        status: 'active'
      });

      if (relationError) {
        throw relationError;
      }

      // Clear form and notify parent
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        level: 'beginner',
      });
      
      onAdd();
    } catch (error: any) {
      console.error('Error adding athlete:', error);
      setError(error.message || 'Failed to add athlete. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Level
        </label>
        <select
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: e.target.value as AthleteLevel })}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Athlete'}
        </button>
      </div>
    </form>
  );
}