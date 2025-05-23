import { createContext, ReactNode, useContext, useState } from 'react';
import { SessionForm } from '../components/session/SessionForm';
import { BlockEditor } from '../components/workout/BlockEditor';
import { WorkoutForm } from '../components/workout/WorkoutForm';
import { Session, WorkoutBlock } from '../lib/workout';

type ModalContextType = {
  showSessionForm: (props: SessionFormProps) => void;
  showWorkoutForm: (props: WorkoutFormProps) => void;
  showBlockEditor: (props: BlockEditorProps) => void;
  closeModal: () => void;
};

type SessionFormProps = {
  title: string;
  initialData?: Partial<Session>;
  onSave: (data: Partial<Session>) => void;
};

type WorkoutFormProps = {
  title: string;
  initialData?: Partial<WorkoutBlock>;
  onSave: (data: WorkoutBlock) => void;
};

type BlockEditorProps = {
  block: WorkoutBlock;
  onSave: (block: WorkoutBlock) => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [currentModal, setCurrentModal] = useState<{
    type: 'session' | 'workout' | 'block';
    props: any;
  } | null>(null);

  const showSessionForm = (props: SessionFormProps) => {
    setCurrentModal({ type: 'session', props });
  };

  const showWorkoutForm = (props: WorkoutFormProps) => {
    setCurrentModal({ type: 'workout', props });
  };

  const showBlockEditor = (props: BlockEditorProps) => {
    setCurrentModal({ type: 'block', props });
  };

  const closeModal = () => {
    setCurrentModal(null);
  };

  return (
    <ModalContext.Provider value={{ showSessionForm, showWorkoutForm, showBlockEditor, closeModal }}>
      {children}
      {currentModal?.type === 'session' && (
        <SessionForm
          {...currentModal.props}
          onClose={closeModal}
          onSave={(data) => {
            currentModal.props.onSave(data);
            closeModal();
          }}
        />
      )}
      {currentModal?.type === 'workout' && (
        <WorkoutForm
          {...currentModal.props}
          onClose={closeModal}
          onSave={(data) => {
            currentModal.props.onSave(data);
            closeModal();
          }}
        />
      )}
      {currentModal?.type === 'block' && (
        <BlockEditor
          {...currentModal.props}
          onClose={closeModal}
          onSave={(block) => {
            currentModal.props.onSave(block);
            closeModal();
          }}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}