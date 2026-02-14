import React, { useState, useEffect } from 'react';
import { Shimmer } from '@/components/ui/shimmer';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CloudImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string; // For the wrapper
    imageClassName?: string; // For the actual image
    fallbackSrc?: string;
    containerClassName?: string;
}

const CloudImage: React.FC<CloudImageProps> = ({
    src,
    alt,
    className,
    imageClassName,
    containerClassName,
    fallbackSrc = '/placeholder-image.png',
    ...props
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
        setImgSrc(src);
    }, [src]);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        if (imgSrc !== fallbackSrc) {
            // Try fallback if available?
            // For now just show error state
        }
        setIsLoading(false);
        setHasError(true);
    };

    return (
        <div className={cn("relative overflow-hidden bg-secondary/20", containerClassName || className)}>
            {isLoading && (
                <div className="absolute inset-0 z-10">
                    <Shimmer className="w-full h-full" />
                </div>
            )}

            {hasError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary text-muted-foreground p-2 text-center text-xs">
                    <ImageOff className="w-1/3 h-1/3 mb-1 opacity-20" />
                    <span className="font-medium opacity-40">No Image</span>
                </div>
            ) : (
                <img
                    src={imgSrc}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                    className={cn(
                        "w-full h-full object-cover transition-all duration-500",
                        isLoading ? "opacity-0 scale-105 blur-sm" : "opacity-100 scale-100 blur-0",
                        imageClassName
                    )}
                    {...props}
                />
            )}
        </div>
    );
};

export default CloudImage;
