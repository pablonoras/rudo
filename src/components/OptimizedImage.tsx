import React from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
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
  
  // Generate WebP source if the original isn't already WebP
  const srcSet = ext !== 'webp' ? [
    `${src} 1x`,
    src.replace(`.${ext}`, '.webp') + ' 1x'
  ] : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${!priority ? 'lazy' : ''}`}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
    />
  );
};

export default OptimizedImage;