import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, BarChart3, ChevronLeft, Dumbbell, MessageSquare, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useI18n } from '../lib/i18n/context';
import { signInWithOAuth, signUp, validateInviteCode } from '../lib/supabase';
import LanguageToggle from './LanguageToggle';

// Schema for email/password registration
const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Schema for invite code validation
const inviteCodeSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required')
});

type RegisterFormData = z.infer<typeof registerSchema>;
type InviteCodeFormData = z.infer<typeof inviteCodeSchema>;

// Define registration steps
type RegistrationStep = 'role-selection' | 'invite-code' | 'registration';
type UserRole = 'coach' | 'athlete';

const Register = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(codeFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidatingUrlCode, setIsValidatingUrlCode] = useState(false);

  // Form for email/password registration
  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Form for invite code
  const {
    register: registerInviteCode,
    handleSubmit: handleSubmitInviteCode,
    formState: { errors: inviteCodeErrors },
  } = useForm<InviteCodeFormData>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: {
      inviteCode: codeFromUrl || ''
    }
  });

  // Check for invite code in URL when component mounts
  useEffect(() => {
    const validateCodeFromUrl = async () => {
      if (codeFromUrl) {
        setIsValidatingUrlCode(true);
        try {
          // Validate the invite code from URL
          const { data: validationResult, error } = await validateInviteCode(codeFromUrl);

          if (error || !validationResult) {
            setErrorMessage('Invalid invitation code in URL. Please check and try again.');
            // Reset to role selection if code is invalid
            setCurrentStep('role-selection');
          } else {
            // Valid code from URL - set as athlete and go to registration
            setSelectedRole('athlete');
            setInviteCode(codeFromUrl);
            setCurrentStep('registration');
          }
        } catch (error: any) {
          setErrorMessage(error.message || 'An error occurred while validating the invitation code');
          setCurrentStep('role-selection');
        } finally {
          setIsValidatingUrlCode(false);
        }
      }
    };

    validateCodeFromUrl();
  }, [codeFromUrl]);

  // Handle role selection
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'coach') {
      // Coach goes directly to registration
      setCurrentStep('registration');
    } else if (role === 'athlete' && codeFromUrl) {
      // If we already have a valid code from URL, go directly to registration
      setCurrentStep('registration');
    } else {
      // Athlete needs to enter invite code first
      setCurrentStep('invite-code');
    }
    setErrorMessage(null);
  };

  // Handle invite code submission
  const onSubmitInviteCode = async (data: InviteCodeFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Validate the invite code
      const { data: validationResult, error } = await validateInviteCode(data.inviteCode);

      if (error || !validationResult) {
        setErrorMessage('Invalid invitation code. Please check and try again.');
        setIsSubmitting(false);
        return;
      }

      // Store the valid invite code and proceed to registration
      setInviteCode(data.inviteCode);
      setCurrentStep('registration');
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred while validating the invitation code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle registration form submission
  const onSubmitRegistration = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Different registration logic based on role
      if (selectedRole === 'coach') {
        // Coach registration
        const { error } = await signUp(data.email, data.password, 'coach');

        if (error) {
          setErrorMessage(error.message || 'An error occurred during registration');
          setIsSubmitting(false);
          return;
        }
      } else if (selectedRole === 'athlete' && inviteCode) {
        // Athlete registration with invite code
        const { error } = await signUp(data.email, data.password, 'athlete', inviteCode);

        if (error) {
          setErrorMessage(error.message || 'An error occurred during registration');
          setIsSubmitting(false);
          return;
        }
      }

      // Registration successful, redirect to login
      navigate('/login', { state: { message: 'Registration successful! Please check your email to verify your account.' } });
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google OAuth registration
  const handleGoogleRegistration = async () => {
    try {
      // For OAuth registration, we don't specify a role - we'll determine it after authentication
      // But we still pass the invite code for athletes
      if (selectedRole === 'athlete' && inviteCode) {
        // Athlete OAuth registration with invite code
        await signInWithOAuth(
          'google',
          `${window.location.origin}/auth/callback`,
          inviteCode
        );
      } else {
        // Coach or any other OAuth registration without invite code
        await signInWithOAuth(
          'google',
          `${window.location.origin}/auth/callback`
        );
      }
    } catch (error: any) {
      console.error('Error signing up with Google:', error.message);
      setErrorMessage('Failed to sign up with Google');
    }
  };

  // Go back to previous step
  const handleGoBack = () => {
    if (currentStep === 'invite-code') {
      setCurrentStep('role-selection');
      setSelectedRole(null);
    } else if (currentStep === 'registration' && selectedRole === 'athlete' && !codeFromUrl) {
      setCurrentStep('invite-code');
      setInviteCode(null);
    } else if (currentStep === 'registration') {
      setCurrentStep('role-selection');
      setSelectedRole(null);
      setInviteCode(codeFromUrl);
    }
    setErrorMessage(null);
  };

  // Show loading state when validating URL code
  if (isValidatingUrlCode) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#8A2BE2] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Validating invitation code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Left Panel - Registration Form */}
      <div className="w-full lg:w-1/2 p-8 flex flex-col">
        <div className="flex items-center justify-between mb-12">
          {currentStep !== 'role-selection' ? (
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {currentStep === 'invite-code' ? t('back-to-role-selection') : t('back-to-home')}
            </button>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back-to-home')}
            </Link>
          )}
          <LanguageToggle />
        </div>

        <div className="flex items-center gap-3 mb-12">
          <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] bg-clip-text text-transparent">
            RUDO
          </div>
        </div>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
          {/* Role Selection Step */}
          {currentStep === 'role-selection' && (
            <>
              <h1 className="text-3xl font-bold mb-2">{t('create-account')}</h1>
              <p className="text-gray-400 mb-8">
                {t('select-your-role')}
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect('coach')}
                  className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-medium">{t('coach-role')}</h3>
                    <p className="text-gray-400 text-sm">{t('coach-role-description')}</p>
                  </div>
                  <div className="p-3 bg-[#8A2BE2]/20 rounded-full">
                    <Users className="w-6 h-6 text-[#8A2BE2]" />
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('athlete')}
                  className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-medium">{t('athlete-role')}</h3>
                    <p className="text-gray-400 text-sm">{t('athlete-role-description')}</p>
                  </div>
                  <div className="p-3 bg-[#4169E1]/20 rounded-full">
                    <Dumbbell className="w-6 h-6 text-[#4169E1]" />
                  </div>
                </button>
              </div>

              <p className="text-center text-gray-400 text-sm mt-8">
                {t('already-have-account')}{' '}
                <Link to="/login" className="text-[#8A2BE2] hover:text-[#4169E1] transition-colors">
                  {t('sign-in')}
                </Link>
              </p>
            </>
          )}

          {/* Invite Code Step (Athletes only) */}
          {currentStep === 'invite-code' && (
            <>
              <h1 className="text-3xl font-bold mb-2">{t('enter-invite-code')}</h1>
              <p className="text-gray-400 mb-8">
                {t('invite-code-description')}
              </p>

              <form onSubmit={handleSubmitInviteCode(onSubmitInviteCode)} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    placeholder={t('invite-code-placeholder')}
                    {...registerInviteCode('inviteCode')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent text-white placeholder-gray-400"
                  />
                  {inviteCodeErrors.inviteCode && (
                    <p className="text-red-400 text-sm mt-1">{inviteCodeErrors.inviteCode.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? t('verifying') : t('verify-code')}
                </button>
              </form>
            </>
          )}

          {/* Registration Step */}
          {currentStep === 'registration' && (
            <>
              <h1 className="text-3xl font-bold mb-2">{t('create-account')}</h1>
              <p className="text-gray-400 mb-8">
                {selectedRole === 'coach' ? t('join-as-coach') : t('join-as-athlete')}
              </p>

              <form onSubmit={handleSubmit(onSubmitRegistration)} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <input
                    type="email"
                    placeholder={t('email')}
                    {...registerForm('email')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent text-white placeholder-gray-400"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder={t('password')}
                    {...registerForm('password')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent text-white placeholder-gray-400"
                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder={t('confirm-password')}
                    {...registerForm('confirmPassword')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent text-white placeholder-gray-400"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? t('creating-account') : t('create-account')}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#0A0A0A] text-gray-400">{t('or-continue-with')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleRegistration}
                  className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 px-4 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('continue-with-google')}
                </button>
              </form>
            </>
          )}

          {/* Always show login link at the bottom except in role selection */}
          {currentStep !== 'role-selection' && (
            <p className="text-center text-gray-400 text-sm mt-6">
              {t('already-have-account')}{' '}
              <Link to="/login" className="text-[#8A2BE2] hover:text-[#4169E1] transition-colors">
                {t('sign-in')}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right Panel - Feature Showcase */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#8A2BE2]/10 to-[#4169E1]/10 border-l border-white/10">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center p-12">
          <h2 className="text-2xl font-bold mb-8">{t('train-smarter')}</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <Dumbbell className="w-6 h-6 text-[#8A2BE2]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('feature-programming-title')}</h3>
                <p className="text-gray-400">
                  {t('feature-programming-description')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <MessageSquare className="w-6 h-6 text-[#4169E1]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('feature-communication-title')}</h3>
                <p className="text-gray-400">
                  {t('feature-communication-description')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <BarChart3 className="w-6 h-6 text-[#8A2BE2]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('feature-tracking-title')}</h3>
                <p className="text-gray-400">
                  {t('feature-tracking-description')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <Users className="w-6 h-6 text-[#4169E1]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('feature-community-title')}</h3>
                <p className="text-gray-400">
                  {t('feature-community-description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 