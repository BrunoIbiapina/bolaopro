import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <div className="relative inline-block w-full">
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border border-surface-lighter bg-surface/50 px-3 py-2 pr-8 text-sm text-gray-50 placeholder:text-gray-500 transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
          className
        )}
        {...props}
      />
      <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  )
);
Select.displayName = 'Select';

export { Select };
