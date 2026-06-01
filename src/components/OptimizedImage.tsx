// src/components/OptimizedImage.tsx
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Générer les URLs WebP et fallback
  const getImageUrls = (originalSrc: string) => {
    // Si c'est déjà une URL externe (Unsplash, etc.), on la garde telle quelle
    if (originalSrc.startsWith('http')) {
      return {
        webp: originalSrc,
        fallback: originalSrc,
      };
    }

    // Pour les images locales, on pourrait ajouter la logique de conversion
    return {
      webp: originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
      fallback: originalSrc,
    };
  };

  const { webp, fallback } = getImageUrls(imageSrc);

  useEffect(() => {
    // Preload si prioritaire
    if (priority && typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = webp;
      link.type = 'image/webp';
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, webp]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    // Fallback vers l'image originale si WebP échoue
    if (imageSrc === webp) {
      setImageSrc(fallback);
    } else {
      setHasError(true);
      onError?.();
    }
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-ink/5 text-ink/40',
          className
        )}
        style={{ width, height }}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder blur */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          className="absolute inset-0 bg-ink/5 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Image principale */}
      <picture>
        <source srcSet={webp} type="image/webp" />
        <img
          src={fallback}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      </picture>
    </div>
  );
}

// Composant pour les images de fond optimisées
export interface OptimizedBackgroundImageProps {
  src: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function OptimizedBackgroundImage({
  src,
  alt = '',
  className,
  children,
  overlay = false,
  overlayOpacity = 0.5,
}: OptimizedBackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-ink/5 animate-pulse" />
      )}

      {/* Image de fond */}
      <OptimizedImage
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay optionnel */}
      {overlay && (
        <div
          className="absolute inset-0 bg-ink"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Contenu */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
