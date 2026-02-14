import React, { useState, useEffect, useRef, Suspense } from 'react';
import { SectionLoadingFallback } from './LazyLoadingFallback';

interface LazySectionProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    threshold?: number;
    rootMargin?: string;
}

export const LazySection: React.FC<LazySectionProps> = ({
    children,
    fallback = <SectionLoadingFallback />,
    threshold = 0.1,
    rootMargin = '100px'
}) => {
    const [isIntersecting, setIntersecting] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIntersecting(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    return (
        <div ref={sectionRef} className="min-h-[100px]">
            {isIntersecting ? (
                <Suspense fallback={fallback}>
                    {children}
                </Suspense>
            ) : (
                fallback
            )}
        </div>
    );
};

export default LazySection;
