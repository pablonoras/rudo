import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AssignmentModal } from '../../components/program/AssignmentModal';
import { useWorkoutStore } from '../../lib/workout';

export function ProgramAssignment() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { programs, assignProgram, fetchPrograms } = useWorkoutStore();
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch programs when component mounts
  useEffect(() => {
    const loadPrograms = async () => {
      setIsLoading(true);
      await fetchPrograms();
      setIsLoading(false);
    };
    
    loadPrograms();
  }, [fetchPrograms]);

  const program = programId ? programs[programId] : null;

  const handleAssign = async (athletes: string[], message?: string) => {
    if (!programId) return;

    console.log('Starting to assign athletes to program:', {
      programId,
      athletes,
      message
    });

    setIsAssigning(true);
    try {
      console.log('Calling assignProgram with:', athletes.length, 'athletes');
      await assignProgram(programId, athletes, message);
      console.log('Assignment successful, navigating to programs view');
      // Navigate back to programs view after successful assignment
      navigate('/coach/programs');
    } catch (error) {
      console.error('Error assigning program:', error);
      alert('There was a problem assigning the program to athletes. Please try again.');
      // Navigate back to the program details if there was an error
      navigate(`/coach/program/${programId}`);
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 dark:text-gray-400">Program not found</p>
      </div>
    );
  }

  return (
    <>
      {isAssigning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="text-gray-700 dark:text-gray-300">Assigning program to athletes...</p>
            </div>
          </div>
        </div>
      )}
      <AssignmentModal
        program={program}
        onClose={() => navigate('/coach/programs')}
        onAssign={handleAssign}
      />
    </>
  );
}