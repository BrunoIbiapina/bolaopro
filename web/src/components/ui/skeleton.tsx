import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-lg bg-gradient-to-r from-surface via-surface-lighter to-surface bg-[length:1000px_100%]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
