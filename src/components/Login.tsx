import { zodResolver } from '@hookform/resolvers/zod';
import { BarChart3, ChevronLeft, Dumbbell, MessageSquare, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useI18n } from '../lib/i18n/context';
import { getCurrentProfile, signIn, supabase } from '../lib/supabase';
import LanguageToggle from './LanguageToggle';
import { Logo } from './Logo';
import { UserRole } from './RoleSelection';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useParams<{ role: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Validate the role parameter
    if (role && (role === 'coach' || role === 'athlete')) {
      setUserRole(role as UserRole);
    } else {
      // If invalid role, redirect to role selection
      navigate('/auth');
    }

    // Check if there's a success message from registration
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // Clear the state to prevent showing the message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, role, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Function to redirect based on user role
  const redirectBasedOnRole = async () => {
    try {
      // Get the user's profile to determine their role
      const profile = await getCurrentProfile();
      
      if (!profile) {
        setErrorMessage('Unable to retrieve user profile');
        return;
      }
      
      // Check if there's a role mismatch (user trying to login with wrong role)
      if (userRole === 'coach' && profile.role === 'athlete') {
        setErrorMessage('You have an athlete account. Please use athlete login.');
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
        return;
      } else if (userRole === 'athlete' && profile.role === 'coach') {
        setErrorMessage('You have a coach account. Please use coach login.');
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
        return;
      }
      
      // Redirect based on role
      if (profile.role === 'coach') {
        navigate('/coach');
      } else if (profile.role === 'athlete') {
        navigate('/athlete');
      } else {
        // Fallback to home if role is not recognized
        navigate('/');
      }
    } catch (error) {
      console.error('Error determining user role:', error);
      setErrorMessage('An error occurred while accessing your account');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data: result, error } = await signIn(data.email, data.password);

      if (error) {
        setErrorMessage('Invalid email or password');
        setIsSubmitting(false);
        return;
      }

      // If login successful, redirect based on user role
      await redirectBasedOnRole();
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred during login');
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (!userRole) {
        setErrorMessage('Please select a role first');
        return;
      }

      console.log('Starting Google login with role:', userRole);
      
      // Store selected role in localStorage to be retrieved during the OAuth process
      localStorage.setItem('selectedRole', userRole);
      
      // Store more detailed user data for the OAuth flow
      localStorage.setItem('oauthUserData', JSON.stringify({
        role: userRole
      }));

      // For OAuth login, we pass the selected role in the redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback?role=${userRole}`;
      
      // Use Supabase client directly
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        throw error;
      }
      // Redirect will happen in the auth callback component
    } catch (error: any) {
      console.error('Error signing in with Google:', error.message);
      setErrorMessage('Failed to sign in with Google');
    }
  };

  const handleGoBack = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 p-8 flex flex-col">
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('back-to-role-selection')}
          </button>
          <LanguageToggle />
        </div>

        <div className="flex items-center gap-3 mb-12">
          <Logo variant="gradient" size="lg" />
        </div>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2">{t('welcome-back')}</h1>
          <p className="text-gray-400 mb-8">
            {userRole === 'coach' 
              ? t('sign-in-as-coach') 
              : t('sign-in-as-athlete')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                {successMessage}
              </div>
            )}

            <div>
              <input
                type="email"
                placeholder={t('email')}
                {...register('email')}
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
                {...register('password')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent text-white placeholder-gray-400"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 rounded border-white/10 bg-white/5" />
                {t('remember-me')}
              </label>
              <Link to="/forgot-password" className="text-[#8A2BE2] hover:text-[#4169E1] transition-colors">
                {t('forgot-password')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? t('signing-in') : t('sign-in')}
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
              onClick={handleGoogleLogin}
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

          <p className="text-center text-gray-400 text-sm mt-6">
            {t('dont-have-account')}{' '}
            <Link to={`/register/${userRole}`} className="text-[#8A2BE2] hover:text-[#4169E1] transition-colors">
              {t('sign-up')}
            </Link>
          </p>
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

export default Login; 