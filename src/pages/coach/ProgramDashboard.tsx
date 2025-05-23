import { differenceInDays } from 'date-fns';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProgramAssignmentManager } from '../../components/program/ProgramAssignmentManager';
import { ProgramCard } from '../../components/program/ProgramCard';
import { ProgramEditModal } from '../../components/program/ProgramEditModal';
import { ProgramFilters } from '../../components/program/ProgramFilters';
import { ProgramSearch } from '../../components/program/ProgramSearch';
import { useWorkoutStore } from '../../lib/workout';

export function ProgramDashboard() {
  const {
    programs,
    createProgram,
    deleteProgram,
    updateProgramStatus,
    programFilter,
    setProgramFilter,
    fetchPrograms,
    updateProgramInDatabase,
    unassignProgramAthlete,
  } = useWorkoutStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [managingAssignmentsProgramId, setManagingAssignmentsProgramId] = useState<string | null>(null);

  // Fetch programs when component mounts
  useEffect(() => {
    console.log('ProgramDashboard: Fetching programs on mount');
    fetchPrograms().then(() => {
      console.log('ProgramDashboard: Programs loaded successfully');
    }).catch(error => {
      console.error('ProgramDashboard: Error fetching programs:', error);
    });
  }, [fetchPrograms]);

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName || !startDate || !endDate) return;

    // Calculate number of weeks based on dates
    const daysDiff = differenceInDays(new Date(endDate), new Date(startDate));
    const weekCount = Math.ceil(daysDiff / 7);

    createProgram({
      name: newProgramName,
      startDate,
      endDate,
      status: 'draft',
      weekCount,
      days: {},
      assignedTo: { athletes: [] },
    });

    setIsCreating(false);
    setNewProgramName('');
    setStartDate('');
    setEndDate('');
  };

  // Add handler for deleting programs
  const handleDeleteProgram = async (programId: string) => {
    try {
      await deleteProgram(programId);
    } catch (error) {
      console.error('Failed to delete program:', error);
    }
  };

  // Add handler for editing programs
  const handleEditProgram = (programId: string) => {
    setEditingProgramId(programId);
  };

  // Add handler for saving program edits
  const handleSaveProgramEdit = async (updates: { name: string, startDate: string, endDate: string, weekCount: number }) => {
    if (!editingProgramId) return;
    
    try {
      await updateProgramInDatabase(editingProgramId, updates);
      setEditingProgramId(null);
    } catch (error) {
      console.error('Failed to update program:', error);
      throw error; // Re-throw to allow modal to handle the error
    }
  };

  // Add handler for managing program assignments
  const handleManageAssignments = (programId: string) => {
    setManagingAssignmentsProgramId(programId);
  };

  // Add handler for unassigning athletes
  const handleUnassignAthlete = async (athleteId: string) => {
    if (!managingAssignmentsProgramId) return;
    
    try {
      await unassignProgramAthlete(managingAssignmentsProgramId, athleteId);
    } catch (error) {
      console.error('Failed to unassign athlete:', error);
      throw error; // Re-throw to allow modal to handle the error
    }
  };

  const programsList = Object.values(programs);
  
  // Filter programs based on search query and status
  const filteredPrograms = programsList
    .filter((program) => 
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (program.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
    .filter((program) => programFilter === 'all' || program.status === programFilter);

  const counts = {
    all: programsList.length,
    draft: programsList.filter((p) => p.status === 'draft').length,
    published: programsList.filter((p) => p.status === 'published').length,
    archived: programsList.filter((p) => p.status === 'archived').length,
  };

  // Get the program being edited
  const programBeingEdited = editingProgramId ? programs[editingProgramId] : null;
  
  // Get the program being managed for assignments
  const programBeingManaged = managingAssignmentsProgramId ? programs[managingAssignmentsProgramId] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Programs
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-full sm:w-64">
          <ProgramSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search programs..."
          />
        </div>
        <div className="flex-1">
          <ProgramFilters
            currentFilter={programFilter}
            onFilterChange={setProgramFilter}
            counts={counts}
          />
        </div>
      </div>

      {filteredPrograms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'No programs match your search'
              : 'No programs found for the selected filter'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onStatusChange={(status) => updateProgramStatus(program.id, status)}
              onDelete={() => handleDeleteProgram(program.id)}
              onEdit={() => handleEditProgram(program.id)}
              onManageAssignments={() => handleManageAssignments(program.id)}
            />
          ))}
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Create New Program
              </h2>

              <div>
                <label
                  htmlFor="program-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Program Name
                </label>
                <input
                  type="text"
                  id="program-name"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                  placeholder="e.g., March 2025 - Competition Team"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="start-date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="end-date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program Edit Modal */}
      {programBeingEdited && (
        <ProgramEditModal
          program={programBeingEdited}
          onClose={() => setEditingProgramId(null)}
          onSave={handleSaveProgramEdit}
        />
      )}

      {/* Program Assignment Manager Modal */}
      {programBeingManaged && (
        <ProgramAssignmentManager
          program={programBeingManaged}
          onClose={() => setManagingAssignmentsProgramId(null)}
          onUnassign={handleUnassignAthlete}
        />
      )}
    </div>
  );
}