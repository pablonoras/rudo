import { format } from 'date-fns';
import {
    Edit2,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';

interface WorkoutType {
  id: number;
  code: string;
}

interface Workout {
  workout_id: string;
  name: string | null;
  description: string;
  color: string;
  notes: string | null;
  type_id: number;
  coach_id: string;
  created_at: string;
  updated_at: string;
  type?: WorkoutType;
}

export function Workouts() {
  const { profile } = useProfile();
  const { showWorkoutForm } = useModal();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [workoutTypes, setWorkoutTypes] = useState<Record<number, string>>({});
  const [typeFilter, setTypeFilter] = useState<number | null>(null);

  // Fetch workout types
  const fetchWorkoutTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_types')
        .select('id, code')
        .order('code');
        
      if (error) {
        throw error;
      }
      
      // Convert to a lookup object for easier access
      const typesMap: Record<number, string> = {};
      data?.forEach(type => {
        typesMap[type.id] = type.code;
      });
      
      setWorkoutTypes(typesMap);
    } catch (error) {
      console.error('Error fetching workout types:', error);
    }
  };

  // Fetch workouts from the database
  const fetchWorkouts = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    try {
      // Query workouts created by this coach
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          type:workout_types(id, code)
        `)
        .eq('coach_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching workouts:', error);
        return;
      }
      
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error in fetchWorkouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (profile) {
      fetchWorkoutTypes();
      fetchWorkouts();
    }
  }, [profile]);

  // Handle creating a new workout
  const handleCreateWorkout = () => {
    showWorkoutForm({
      title: 'Create New Workout',
      onSave: async (workout) => {
        try {
          // Save the workout to the database
          const { data, error } = await supabase
            .from('workouts')
            .insert([{
              description: workout.description,
              color: workout.color,
              name: workout.name || null,
              notes: workout.notes || null,
              coach_id: profile?.id,
              type_id: workout.type_id
            }])
            .select();
          
          if (error) throw error;
          
          // Refresh the workouts list
          fetchWorkouts();
        } catch (error) {
          console.error('Error creating workout:', error);
          alert('There was an error creating the workout. Please try again.');
        }
      }
    });
  };

  // Handle editing a workout
  const handleEditWorkout = (workout: Workout) => {
    showWorkoutForm({
      title: 'Edit Workout',
      initialData: {
        description: workout.description,
        color: workout.color,
        name: workout.name || undefined,
        notes: workout.notes || undefined,
        type_id: workout.type_id
      },
      onSave: async (updatedWorkout) => {
        try {
          // Update the workout in the database
          const { error } = await supabase
            .from('workouts')
            .update({
              description: updatedWorkout.description,
              color: updatedWorkout.color,
              name: updatedWorkout.name || null,
              notes: updatedWorkout.notes || null,
              type_id: updatedWorkout.type_id
            })
            .eq('workout_id', workout.workout_id);
          
          if (error) throw error;
          
          // Refresh the workouts list
          fetchWorkouts();
        } catch (error) {
          console.error('Error updating workout:', error);
          alert('There was an error updating the workout. Please try again.');
        }
      }
    });
  };

  // Handle deleting a workout
  const deleteWorkout = async (workoutId: string) => {
    try {
      // Delete the workout from the database
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('workout_id', workoutId);
      
      if (error) throw error;
      
      // Refresh the workouts list
      fetchWorkouts();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('There was an error deleting the workout. Please try again.');
    }
  };

  // Get unique workout types from current workouts
  const uniqueWorkoutTypes = workouts.reduce<{ id: number; code: string }[]>((acc, workout) => {
    if (workout.type && !acc.some(type => type.id === workout.type?.id)) {
      acc.push({ id: workout.type.id, code: workout.type.code });
    }
    return acc;
  }, []).sort((a, b) => a.code.localeCompare(b.code));

  // Filter workouts based on search query and type filter
  const filteredWorkouts = workouts.filter(workout => {
    // Apply search filter
    const matchesSearch = !searchQuery || 
      (workout.name && workout.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      workout.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply type filter
    const matchesType = !typeFilter || workout.type_id === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workouts</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your workout templates and assign them to programs or athletes
          </p>
        </div>
        <button
          onClick={handleCreateWorkout}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Workout
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search workouts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {uniqueWorkoutTypes.length > 0 && (
              <div>
                <select
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={typeFilter || ''}
                  onChange={(e) => setTypeFilter(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">All Types</option>
                  {uniqueWorkoutTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.code}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : filteredWorkouts.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkouts.map((workout) => (
                <div 
                  key={workout.workout_id} 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div 
                    className="h-2" 
                    style={{ backgroundColor: workout.color || '#BAE6FD' }}
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {workout.name || ''}
                        </h3>
                        <div className="flex items-center gap-2">
                          {workout.type && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {workout.type.code}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(workout.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditWorkout(workout)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Edit Workout"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(workout.workout_id)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Workout"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 font-mono text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {workout.description}
                    </div>
                    
                    {workout.notes && (
                      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <p className="font-medium mb-1">Notes:</p>
                        <p className="whitespace-pre-wrap">{workout.notes}</p>
                      </div>
                    )}
                    
                    {/* Delete confirmation dialog */}
                    {showDeleteConfirm === workout.workout_id && (
                      <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 flex items-center justify-center z-10 p-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center max-w-xs">
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Are you sure you want to delete this workout?
                          </p>
                          <div className="flex justify-center space-x-3">
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => deleteWorkout(workout.workout_id)}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {searchQuery || typeFilter ? (
              <>
                <p className="text-lg font-medium">No matching workouts found.</p>
                <p>Try adjusting your search or filter criteria.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No workouts found.</p>
                <p>Create your first workout to get started.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 