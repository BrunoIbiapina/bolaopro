import { Card } from '@/components/ui/card';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">BP</span>
            </div>
          </div>

          {/* Content */}
          {children}
        </div>
      </Card>
    </div>
  );
}
