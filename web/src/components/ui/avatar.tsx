import * as React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, children, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-lighter text-sm font-semibold text-gray-50',
          className
        )}
        {...props}
      >
        {!showFallback && (
          <img
            src={src}
            alt={alt}
            className="h-full w-full rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        {showFallback && (
          <span>{fallback || children}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export function AvatarWithInitials({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  return (
    <Avatar src={src} alt={name} fallback={getInitials(name)} className={className} />
  );
}

export { Avatar };
