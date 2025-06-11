import React from 'react';
import { cn } from '../lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
}) => {
  // Extract the file extension
  const ext = src.split('.').pop()?.toLowerCase();
  
  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!width) return undefined;
    
    const sizes = [0.5, 1, 1.5, 2];
    const srcSet = sizes.map(size => {
      const w = Math.round(width * size);
      return `${src}?w=${w}&q=${size === 2 ? 70 : 80} ${w}w`;
    });
    
    return srcSet.join(', ');
  };

  return (
    <img
      src={src}
      srcSet={generateSrcSet()}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      alt={alt}
      width={width}
      height={height}
      className={cn(
        'transition-opacity duration-300',
        !priority && 'lazy blur-up',
        className
      )}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
    />
  );
};

export default OptimizedImage;