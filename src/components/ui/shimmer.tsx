import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]',
        className
      )}
    />
  );
}

export function ShimmerCard({ className }: ShimmerProps) {
  return (
    <div className={cn('rounded-lg overflow-hidden', className)}>
      <Shimmer className="w-full h-full" />
    </div>
  );
}

export function ShimmerText({ className }: ShimmerProps) {
  return <Shimmer className={cn('h-4 rounded', className)} />;
}

export function ShimmerCircle({ className }: ShimmerProps) {
  return <Shimmer className={cn('rounded-full', className)} />;
}

export function ShimmerButton({ className }: ShimmerProps) {
  return <Shimmer className={cn('h-10 rounded-md', className)} />;
}

export function ShimmerImage({ className }: ShimmerProps) {
  return <Shimmer className={cn('w-full aspect-square rounded-lg', className)} />;
}
