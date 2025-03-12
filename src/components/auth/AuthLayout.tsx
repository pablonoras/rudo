import { Dumbbell } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center">
            <Dumbbell className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-3xl font-black tracking-wider text-gray-900 dark:text-gray-100">
              RUDO
            </span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}