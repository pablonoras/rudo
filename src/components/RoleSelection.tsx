import { ArrowLeft, BarChart3, Dumbbell, MessageSquare, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n/context';
import LanguageToggle from './LanguageToggle';
import { Logo } from './Logo';

export type UserRole = 'coach' | 'athlete';

const RoleSelection = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for error messages in localStorage
  useEffect(() => {
    const storedError = localStorage.getItem('auth_error');
    if (storedError) {
      setErrorMessage(storedError);
      localStorage.removeItem('auth_error');
    }
  }, []);

  // Handle role selection and navigation
  const handleRoleSelect = (role: UserRole) => {
    navigate(`/login/${role}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Left Panel - Role Selection */}
      <div className="w-full lg:w-1/2 p-8 flex flex-col">
        <div className="flex items-center justify-between mb-12">
          <Link
            to="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back-to-home')}
          </Link>
          <LanguageToggle />
        </div>

        <div className="flex items-center gap-3 mb-12">
          <Logo variant="text-only" size="lg" />
        </div>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2">{t('select-your-role')}</h1>
          <p className="text-gray-400 mb-8">
            {t('choose-role-to-continue')}
          </p>

          {errorMessage && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4 mb-8">
            <button
              onClick={() => handleRoleSelect('coach')}
              className="w-full py-4 px-6 bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#8A2BE2] border rounded-lg transition-colors flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-medium text-left">{t('coach-role')}</h3>
                <p className="text-gray-400 text-sm text-left">{t('coach-role-description')}</p>
              </div>
              <div className="p-3 bg-[#8A2BE2]/20 rounded-full">
                <Users className="w-6 h-6 text-[#8A2BE2]" />
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('athlete')}
              className="w-full py-4 px-6 bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#4169E1] border rounded-lg transition-colors flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-medium text-left">{t('athlete-role')}</h3>
                <p className="text-gray-400 text-sm text-left">{t('athlete-role-description')}</p>
              </div>
              <div className="p-3 bg-[#4169E1]/20 rounded-full">
                <Dumbbell className="w-6 h-6 text-[#4169E1]" />
              </div>
            </button>
          </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection; 