import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../../lib/workout';
import { AssignmentModal } from '../../components/program/AssignmentModal';

export function ProgramAssignment() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { programs, assignProgram } = useWorkoutStore();
  const [isAssigning, setIsAssigning] = useState(false);

  const program = programId ? programs[programId] : null;

  const handleAssign = async (athletes: string[], teams: string[]) => {
    if (!programId) return;

    setIsAssigning(true);
    await assignProgram(programId, athletes, teams);
    setIsAssigning(false);
    navigate(`/coach/program/${programId}`);
  };

  if (!program) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 dark:text-gray-400">Program not found</p>
      </div>
    );
  }

  return (
    <AssignmentModal
      program={program}
      onClose={() => navigate(`/coach/program/${programId}`)}
      onAssign={handleAssign}
    />
  );
}