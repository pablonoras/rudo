/**
 * src/components/DemoInitializer.tsx
 * 
 * This component initializes sample data when loaded.
 * It's used to set up the demo environment with pre-configured data.
 */

import { useEffect } from 'react';
import { initializeWithSampleData } from '../lib/workout';

export default function DemoInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize sample data when component mounts
    initializeWithSampleData();
  }, []);

  // Simply render the children, this is just for initialization
  return <>{children}</>;
} 