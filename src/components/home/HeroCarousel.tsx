import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Slider } from '@/types/slider';
import { useSliders } from '@/hooks/useSliders';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function HeroCarousel() {
    const { sliders, loading } = useSliders();
    const [activeSliders, setActiveSliders] = useState<Slider[]>([]);

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 5000, stopOnInteraction: false })
    ]);

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (sliders) {
            setActiveSliders(sliders.filter(s => s.status === 'active'));
        }
    }, [sliders]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    if (loading) {
        return (
            <div className="px-4 py-4 md:px-0 md:py-0 mb-6">
                <div className="w-full aspect-[16/9] md:aspect-[21/7] bg-muted animate-pulse rounded-2xl md:rounded-none overflow-hidden" />
            </div>
        );
    }

    if (activeSliders.length === 0) {
        return null;
    }

    return (
        <section className="relative group px-4 py-4 md:px-0 md:py-0">
            <div className="overflow-hidden rounded-2xl md:rounded-none shadow-lg md:shadow-none" ref={emblaRef}>
                <div className="flex">
                    {activeSliders.map((slider, index) => (
                        <div key={slider.id} className="flex-[0_0_100%] min-w-0 relative aspect-[16/9] md:aspect-[21/7]">
                            <img
                                src={slider.image_url}
                                alt={slider.title || 'Slider Image'}
                                className="w-full h-full object-cover"
                                loading={index === 0 ? "eager" : "lazy"}
                            />

                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-center">
                                <div className="container px-6 md:px-12 lg:px-20">
                                    <AnimatePresence mode="wait">
                                        {selectedIndex === index && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -50 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 50 }}
                                                transition={{ duration: 0.5, delay: 0.2 }}
                                                className="max-w-xl text-white space-y-2 md:space-y-4"
                                            >
                                                {slider.title && (
                                                    <h2 className="text-2xl md:text-4xl lg:text-6xl font-bold leading-tight drop-shadow-md">
                                                        {slider.title}
                                                    </h2>
                                                )}
                                                {slider.subtitle && (
                                                    <p className="text-sm md:text-lg lg:text-xl text-white/90 font-medium drop-shadow-sm max-w-md">
                                                        {slider.subtitle}
                                                    </p>
                                                )}
                                                {slider.redirect_url && (
                                                    <div className="pt-2 md:pt-4">
                                                        <Link to={slider.redirect_url}>
                                                            <Button size="lg" className="rounded-full px-8 bg-white text-black hover:bg-white/90 font-bold border-none transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                                                Shop Now
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            {activeSliders.length > 1 && (
                <>
                    <button
                        onClick={scrollPrev}
                        className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 border border-white/30"
                    >
                        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 border border-white/30"
                    >
                        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {scrollSnaps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => scrollTo(index)}
                                className={cn(
                                    "h-1.5 md:h-2 rounded-full transition-all duration-300 shadow-sm",
                                    selectedIndex === index ? "w-6 md:w-10 bg-white" : "w-1.5 md:w-2 bg-white/40 hover:bg-white/60"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
