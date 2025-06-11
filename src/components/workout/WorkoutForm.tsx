import { ChevronDown, Info, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';

const COLOR_TAGS = [
  // Light blues and cyans
  { value: '#BAE6FD', class: 'bg-[#BAE6FD]', name: 'Light Blue' },
  { value: '#A5F3FC', class: 'bg-[#A5F3FC]', name: 'Sky' },
  { value: '#7DD3FC', class: 'bg-[#7DD3FC]', name: 'Blue' },
  { value: '#67E8F9', class: 'bg-[#67E8F9]', name: 'Cyan' },
  
  // Purples and pinks
  { value: '#C4B5FD', class: 'bg-[#C4B5FD]', name: 'Lavender' },
  { value: '#DDD6FE', class: 'bg-[#DDD6FE]', name: 'Light Purple' },
  { value: '#FBCFE8', class: 'bg-[#FBCFE8]', name: 'Pink' },
  { value: '#FECDD3', class: 'bg-[#FECDD3]', name: 'Rose' },
  
  // Greens
  { value: '#A7F3D0', class: 'bg-[#A7F3D0]', name: 'Mint' },
  { value: '#BBF7D0', class: 'bg-[#BBF7D0]', name: 'Light Green' },
  { value: '#86EFAC', class: 'bg-[#86EFAC]', name: 'Green' },
  
  // Yellows and oranges
  { value: '#FDE68A', class: 'bg-[#FDE68A]', name: 'Light Yellow' },
  { value: '#FCD34D', class: 'bg-[#FCD34D]', name: 'Yellow' },
  { value: '#FDBA74', class: 'bg-[#FDBA74]', name: 'Orange' },
  
  // Reds
  { value: '#FECACA', class: 'bg-[#FECACA]', name: 'Light Red' },
  { value: '#FEE2E2', class: 'bg-[#FEE2E2]', name: 'Pale Red' },
  
  // Neutrals
  { value: '#E5E7EB', class: 'bg-[#E5E7EB]', name: 'Gray' },
  { value: '#F3F4F6', class: 'bg-[#F3F4F6]', name: 'Light Gray' },
];

// The most stylish default color
const DEFAULT_COLOR = '#BAE6FD'; // Light Blue

interface WorkoutType {
  id: number;
  code: string;
  created_by_coach_id: string | null;
}

interface WorkoutFormProps {
  initialData?: {
    description?: string;
    color?: string;
    notes?: string;
    name?: string;
    type_id?: number;
  };
  onSave: (workout: {
    description: string;
    color: string;
    notes?: string;
    name?: string;
    type_id: number;
    wasEdited: boolean;
    coach_id?: string;
  }) => void;
  onClose: () => void;
  title: string;
}

export function WorkoutForm({ initialData, onSave, onClose, title }: WorkoutFormProps) {
  const { profile } = useProfile();
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [color, setColor] = useState(initialData?.color ?? DEFAULT_COLOR);
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [name, setName] = useState(initialData?.name ?? '');
  const [typeId, setTypeId] = useState<number | undefined>(initialData?.type_id);
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [typeSearchQuery, setTypeSearchQuery] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [addingCustomType, setAddingCustomType] = useState(false);
  // Add state for color dropdown
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  // Ref for the color dropdown button
  const colorDropdownRef = useRef<HTMLButtonElement>(null);
  
  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description ?? '');
      setColor(initialData.color ?? DEFAULT_COLOR);
      setNotes(initialData.notes ?? '');
      setName(initialData.name ?? '');
      setTypeId(initialData.type_id);
    }
  }, [initialData]);

  // Fetch workout types
  useEffect(() => {
    const fetchWorkoutTypes = async () => {
      setIsLoadingTypes(true);
      try {
        const { data, error } = await supabase
          .from('workout_types')
          .select('*')
          .order('code', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        setWorkoutTypes(data || []);
        
        // If no type selected yet and we have data, default to 'metcon' instead of 'custom'
        if (!typeId && data && data.length > 0) {
          const metconType = data.find(type => type.code === 'metcon');
          if (metconType) {
            setTypeId(metconType.id);
          } else {
            // Fallback to custom if metcon type doesn't exist
            const customType = data.find(type => type.code === 'custom');
            if (customType) {
              setTypeId(customType.id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching workout types:', error);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    
    fetchWorkoutTypes();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that a type has been selected
    if (!typeId) {
      alert('Please select a workout type');
      return;
    }
    
    onSave({
      description,
      color,
      notes: notes || undefined,
      name: name || undefined,
      type_id: typeId,
      wasEdited: Boolean(initialData?.description),
      coach_id: profile?.id // Add coach_id for new workouts
    });
    onClose();
  };

  // Filter workout types based on search
  const filteredTypes = typeSearchQuery
    ? workoutTypes.filter(type => 
        type.code.toLowerCase().includes(typeSearchQuery.toLowerCase())
      )
    : workoutTypes;

  // Handle creating a custom workout type
  const handleAddCustomType = async () => {
    if (!customTypeInput.trim() || !profile?.id) return;
    
    setAddingCustomType(true);
    try {
      // Convert to snake_case and lowercase
      const typeCode = customTypeInput
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
      
      // Check if it already exists
      const existingType = workoutTypes.find(type => type.code === typeCode);
      if (existingType) {
        setTypeId(existingType.id);
        setShowTypeDropdown(false);
        setCustomTypeInput('');
        return;
      }
      
      // Create new workout type
      const { data, error } = await supabase
        .from('workout_types')
        .insert([
          {
            code: typeCode,
            created_by_coach_id: profile.id
          }
        ])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add to local state
        setWorkoutTypes(prev => [...prev, data[0]]);
        // Select the new type
        setTypeId(data[0].id);
        // Reset UI
        setShowTypeDropdown(false);
        setCustomTypeInput('');
      }
    } catch (error) {
      console.error('Error creating custom workout type:', error);
      alert('Failed to create custom workout type. Please try again.');
    } finally {
      setAddingCustomType(false);
    }
  };

  // Determine if we're editing an existing workout
  const isEditing = initialData?.description !== undefined;

  // Get the selected type name
  const selectedTypeName = workoutTypes.find(type => type.id === typeId)?.code || 'Select Type';

  // Close color dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get the selected color name or hex value
  const selectedColorName = COLOR_TAGS.find(tag => tag.value === color)?.name || color;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-48 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color
                </label>
                <button
                  ref={colorDropdownRef}
                  type="button"
                  onClick={() => setShowColorDropdown(!showColorDropdown)}
                  className="mt-1 w-full flex items-center justify-between border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-sm"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-5 h-5 rounded-full mr-2" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-gray-700 dark:text-gray-300">{selectedColorName}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {showColorDropdown && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                    <div className="p-2 grid grid-cols-4 gap-2">
                      {COLOR_TAGS.map((tag) => (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => {
                            setColor(tag.value);
                            setShowColorDropdown(false);
                          }}
                          className="flex flex-col items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={tag.name}
                        >
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              color === tag.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                            }`}
                            style={{ backgroundColor: tag.value }}
                          >
                            {color === tag.value && (
                              <svg className="w-4 h-4 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="sr-only">{tag.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Workout Type
                </label>
                <button
                  type="button"
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2 text-left flex justify-between items-center"
                >
                  <span className={`${selectedTypeName === 'Select Type' ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                    {selectedTypeName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {showTypeDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Search workout types..."
                          value={typeSearchQuery}
                          onChange={(e) => setTypeSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {isLoadingTypes ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Loading workout types...
                      </div>
                    ) : filteredTypes.length > 0 ? (
                      <div className="py-1">
                        {filteredTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${typeId === type.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}
                            onClick={() => {
                              setTypeId(type.id);
                              setShowTypeDropdown(false);
                            }}
                          >
                            {type.code}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No matching workout types
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                      <div className="flex items-center">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Add custom type..."
                          value={customTypeInput}
                          onChange={(e) => setCustomTypeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !addingCustomType) {
                              e.preventDefault();
                              handleAddCustomType();
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={addingCustomType || !customTypeInput.trim()}
                          className={`px-3 py-2 rounded-r-md text-sm font-medium text-white ${addingCustomType || !customTypeInput.trim() ? 'bg-gray-400 dark:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                          onClick={handleAddCustomType}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Workout Name <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                placeholder="Enter a name for this workout..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Workout Description
              </label>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center mb-2">
                <Info className="h-3 w-3 mr-1" />
                Use standard CrossFit notation (e.g., "21-15-9" or "5 rounds for time")
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2 font-mono"
                placeholder="Enter workout description using CrossFit notation..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                placeholder="Enter any additional notes, coaching cues, or instructions..."
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                {isEditing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}