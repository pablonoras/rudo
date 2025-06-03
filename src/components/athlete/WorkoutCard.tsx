/**
 * src/components/athlete/WorkoutCard.tsx
 * 
 * Enhanced WorkoutCard component with athlete activity features:
 * - Add/edit workout notes
 * - Mark as completed with scaling options
 * - Track completion status and timestamps
 */

import { format } from 'date-fns';
import {
    Award,
    Calendar,
    CheckCircle,
    Circle,
    Clock,
    Edit3,
    MessageSquare,
    Save,
    TrendingDown,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import {
    AthleteActivity,
    getAthleteActivity,
    markWorkoutCompleted,
    markWorkoutIncomplete,
    updateWorkoutNotes
} from '../../lib/supabase';

interface WorkoutCardProps {
  workout: {
    id: string;
    name?: string;
    description: string;
    notes?: string;
    color?: string;
    assignmentType?: string;
    programName?: string;
  };
  scheduledDate: Date;
  onActivityChange?: () => void;
}

export function WorkoutCard({ workout, scheduledDate, onActivityChange }: WorkoutCardProps) {
  const { profile } = useProfile();
  const [activity, setActivity] = useState<AthleteActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showUncompletionDialog, setShowUncompletionDialog] = useState(false);
  const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);

  const scheduledOn = format(scheduledDate, 'yyyy-MM-dd');

  // Check if we have a valid color value
  const hasValidColor = workout.color && 
    (workout.color.startsWith('#') || 
     workout.color.startsWith('rgb') || 
     workout.color.startsWith('hsl'));

  // Get background and border colors
  const getDefaultBgColor = () => 'bg-gray-50 dark:bg-gray-800';
  const getDefaultBorderColor = () => 'border-gray-200 dark:border-gray-700';

  // Create style object for direct color values
  const cardStyle = hasValidColor ? {
    borderTopWidth: '4px',
    borderTopColor: workout.color,
  } : {};

  // Load activity data
  useEffect(() => {
    const loadActivity = async () => {
      if (!profile?.id || !workout.id) return;
      
      setIsLoading(true);
      try {
        const { data } = await getAthleteActivity(profile.id, workout.id, scheduledOn);
        setActivity(data);
        setNotes(data?.notes || '');
      } catch (error) {
        console.error('Error loading activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivity();
  }, [profile?.id, workout.id, scheduledOn]);

  // Handle completion toggle
  const handleCompletionToggle = () => {
    if (activity?.is_completed) {
      setShowUncompletionDialog(true);
    } else {
      setShowCompletionDialog(true);
    }
  };

  // Mark workout as completed
  const handleMarkCompleted = async (isUnscaled: boolean) => {
    if (!profile?.id) return;
    
    setIsUpdatingCompletion(true);
    try {
      const { data, error } = await markWorkoutCompleted(
        profile.id, 
        workout.id, 
        scheduledOn, 
        isUnscaled
      );
      
      if (error) {
        console.error('Error marking workout as completed:', error);
        return;
      }
      
      setActivity(data);
      setShowCompletionDialog(false);
      onActivityChange?.();
    } catch (error) {
      console.error('Error marking workout as completed:', error);
    } finally {
      setIsUpdatingCompletion(false);
    }
  };

  // Mark workout as incomplete
  const handleMarkIncomplete = async () => {
    if (!profile?.id) return;
    
    setIsUpdatingCompletion(true);
    try {
      const { data, error } = await markWorkoutIncomplete(
        profile.id, 
        workout.id, 
        scheduledOn
      );
      
      if (error) {
        console.error('Error marking workout as incomplete:', error);
        return;
      }
      
      setActivity(data);
      setShowUncompletionDialog(false);
      onActivityChange?.();
    } catch (error) {
      console.error('Error marking workout as incomplete:', error);
    } finally {
      setIsUpdatingCompletion(false);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!profile?.id) return;
    
    setIsSavingNotes(true);
    try {
      const { data, error } = await updateWorkoutNotes(
        profile.id, 
        workout.id, 
        scheduledOn, 
        notes.trim()
      );
      
      if (error) {
        console.error('Error saving notes:', error);
        return;
      }
      
      setActivity(data);
      setIsEditingNotes(false);
      onActivityChange?.();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Cancel editing notes
  const handleCancelNotes = () => {
    setNotes(activity?.notes || '');
    setIsEditingNotes(false);
  };

  return (
    <>
      <div 
        className={`${!hasValidColor ? getDefaultBgColor() : 'bg-white dark:bg-gray-800'} rounded-lg shadow-sm border ${
          activity?.is_completed 
            ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/10' 
            : getDefaultBorderColor()
        }`}
        style={cardStyle}
      >
        <div className="p-4">
          {/* Source badge (program/direct assignment) */}
          {workout.assignmentType === 'program' && (
            <div className="flex items-center mb-2">
              <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Calendar className="h-3 w-3 mr-1" />
                {workout.programName}
              </span>
            </div>
          )}
          
          {/* Header with completion status */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              {workout.name && (
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {workout.name}
                </h3>
              )}
              
              {/* Completion status */}
              {activity?.is_completed && (
                <div className="flex items-center mt-1 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>
                    Completed {activity.completed_at && format(new Date(activity.completed_at), 'MMM d, h:mm a')}
                  </span>
                  {activity.is_unscaled !== null && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                      {activity.is_unscaled ? (
                        <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center">
                          <Award className="h-3 w-3 mr-1" />
                          As Prescribed
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 flex items-center">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Scaled
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Completion toggle button */}
            <button
              onClick={handleCompletionToggle}
              disabled={isUpdatingCompletion}
              className={`p-1 rounded-full transition-colors ${
                activity?.is_completed
                  ? 'text-green-500 dark:text-green-400 hover:text-green-600'
                  : 'text-gray-400 hover:text-green-500 dark:hover:text-green-400'
              } ${isUpdatingCompletion ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {activity?.is_completed ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
            </button>
          </div>
          
          {/* Workout description */}
          <div className="mt-3 text-base text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
            {workout.description}
          </div>
          
          {/* Coach notes */}
          {workout.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coach Notes:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {workout.notes}
              </p>
            </div>
          )}
          
          {/* Athlete notes section */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                My Notes
              </h4>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did this workout feel? Any modifications or thoughts..."
                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isSavingNotes ? (
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={handleCancelNotes}
                    className="inline-flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {activity?.notes ? (
                  <p className="whitespace-pre-wrap">{activity.notes}</p>
                ) : (
                  <p className="italic">No notes yet. Click edit to add your thoughts.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Dialog */}
      {showCompletionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Mark Workout as Completed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Did you complete this workout as prescribed or did you scale it?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleMarkCompleted(true)}
                disabled={isUpdatingCompletion}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                <Award className="h-4 w-4 mr-2" />
                As Prescribed
              </button>
              <button
                onClick={() => handleMarkCompleted(false)}
                disabled={isUpdatingCompletion}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Scaled
              </button>
            </div>
            <button
              onClick={() => setShowCompletionDialog(false)}
              className="w-full mt-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Uncompletion Dialog */}
      {showUncompletionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Mark as Incomplete?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to mark this workout as incomplete? This will remove the completion status and timestamp.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleMarkIncomplete}
                disabled={isUpdatingCompletion}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                Yes, Mark Incomplete
              </button>
              <button
                onClick={() => setShowUncompletionDialog(false)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 