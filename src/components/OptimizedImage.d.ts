import { FC } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

declare const OptimizedImage: FC<OptimizedImageProps>;
export default OptimizedImage; 