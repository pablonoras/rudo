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
        } overflow-hidden`}
        style={cardStyle}
      >
        {/* Mobile Layout */}
        <div className="block md:hidden">
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {workout.name || 'Crossfit'}
              </h3>
              <div className="flex items-center">
                {activity?.is_completed && (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                )}
                {activity?.is_unscaled && (
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(scheduledDate, 'EEE, MMM d')}
            </p>
          </div>

          {/* Workout Content */}
          <div className="px-4 pb-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {workout.description}
              </div>
            </div>

            {/* Notes Section - Mobile */}
            {(activity?.notes || isEditingNotes) && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notes</h4>
                  {!isEditingNotes && activity?.notes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add your workout notes, results, or modifications..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSavingNotes ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent mr-1" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={handleCancelNotes}
                        className="flex items-center px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-sm text-gray-700 dark:text-gray-300">
                    {activity?.notes}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCompletionToggle}
                disabled={isUpdatingCompletion}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activity?.is_completed
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {isUpdatingCompletion ? (
                  <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                ) : activity?.is_completed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </>
                )}
              </button>

              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {activity?.notes ? 'Edit Notes' : 'Add Notes'}
                </button>
              )}
            </div>

            {/* Program Info */}
            {workout.programName && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Assigned Program:</span> {workout.programName}
                </div>
              </div>
            )}

            {/* Activity Status */}
            {activity?.completed_at && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Completed on {format(new Date(activity.completed_at), 'MMM d, yyyy \'at\' h:mm a')}
                {activity.is_unscaled && ' (Scaled)'}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {workout.name || 'Workout'}
                </h3>
                {activity?.is_completed && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {activity?.is_unscaled && (
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(scheduledDate, 'MMM d, yyyy')}</span>
                </div>
                {workout.assignmentType && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    {workout.assignmentType}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {workout.description}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {(activity?.notes || isEditingNotes) && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notes</h4>
                {!isEditingNotes && activity?.notes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your workout notes, results, or modifications..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSavingNotes ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent mr-1" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={handleCancelNotes}
                      className="flex items-center px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-sm text-gray-700 dark:text-gray-300">
                  {activity?.notes}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <button
                onClick={handleCompletionToggle}
                disabled={isUpdatingCompletion}
                className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activity?.is_completed
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                {isUpdatingCompletion ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : activity?.is_completed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </button>
              
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {activity?.notes ? 'Edit Notes' : 'Add Notes'}
                </button>
              )}
            </div>

            {/* Activity Status */}
            {activity?.completed_at && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    Completed {format(new Date(activity.completed_at), 'MMM d \'at\' h:mm a')}
                    {activity.is_unscaled && ' (Scaled)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Program Information */}
          {workout.programName && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Program:</span> {workout.programName}
                </div>
              </div>
            </div>
          )}
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