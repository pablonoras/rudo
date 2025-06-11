import { createContext, ReactNode, useContext, useState } from 'react';
import { BlockEditor } from '../components/workout/BlockEditor';
import { WorkoutForm } from '../components/workout/WorkoutForm';
import { WorkoutBlock } from '../lib/workout';

type ModalContextType = {
  showWorkoutForm: (props: WorkoutFormProps) => void;
  showBlockEditor: (props: BlockEditorProps) => void;
  closeModal: () => void;
};

// Define the types for form props
export interface WorkoutFormProps {
  title: string;
  initialData?: {
    description?: string;
    color?: string;
    notes?: string;
    name?: string;
    type_id: number;
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
}

export interface BlockEditorProps {
  title: string;
  blockType: string;
  initialData?: Partial<WorkoutBlock>;
  onSave: (blockData: Partial<WorkoutBlock>) => void;
}

// Create the Modal Context
const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Define the types of modals
type ModalType = 'workout' | 'block' | null;

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [workoutFormProps, setWorkoutFormProps] = useState<WorkoutFormProps | null>(null);
  const [blockEditorProps, setBlockEditorProps] = useState<BlockEditorProps | null>(null);

  const showWorkoutForm = (props: WorkoutFormProps) => {
    setWorkoutFormProps(props);
    setModalType('workout');
  };

  const showBlockEditor = (props: BlockEditorProps) => {
    setBlockEditorProps(props);
    setModalType('block');
  };

  const closeModal = () => {
    setModalType(null);
  };

  return (
    <ModalContext.Provider value={{
      showWorkoutForm,
      showBlockEditor,
      closeModal,
    }}>
      {children}

      {modalType === 'workout' && workoutFormProps && (
        <WorkoutForm
          {...workoutFormProps}
          onClose={closeModal}
        />
      )}

      {modalType === 'block' && blockEditorProps && (
        <BlockEditor
          {...blockEditorProps}
          onClose={closeModal}
        />
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};