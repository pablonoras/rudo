import { AuthLayout } from './AuthLayout';

export function VerificationPage() {
  return (
    <AuthLayout
      title="Check your email"
      subtitle="We've sent you a verification link to complete your registration"
    >
      <div className="text-center mt-8">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please check your email and click the verification link to activate your
          account. You can close this page.
        </p>
      </div>
    </AuthLayout>
  );
}