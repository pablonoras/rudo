import { ArrowLeft, BarChart3, Dumbbell, MessageSquare, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n/context';
import LanguageToggle from './LanguageToggle';

export type UserRole = 'coach' | 'athlete';

const RoleSelection = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Handle role selection and navigation
  const handleContinue = (action: 'login' | 'register') => {
    if (!selectedRole) return;

    if (action === 'login') {
      navigate(`/login/${selectedRole}`);
    } else {
      navigate(`/register/${selectedRole}`);
    }
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
          <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] bg-clip-text text-transparent">
            RUDO
          </div>
        </div>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2">{t('select-your-role')}</h1>
          <p className="text-gray-400 mb-8">
            {t('choose-role-to-continue')}
          </p>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => setSelectedRole('coach')}
              className={`w-full py-4 px-6 ${
                selectedRole === 'coach'
                  ? 'bg-white/10 border-[#8A2BE2]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              } border rounded-lg transition-colors flex items-center justify-between`}
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
              onClick={() => setSelectedRole('athlete')}
              className={`w-full py-4 px-6 ${
                selectedRole === 'athlete'
                  ? 'bg-white/10 border-[#4169E1]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              } border rounded-lg transition-colors flex items-center justify-between`}
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

          <div className="flex flex-col space-y-3">
            <button
              onClick={() => handleContinue('login')}
              disabled={!selectedRole}
              className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {t('sign-in')}
            </button>
            
            <button
              onClick={() => handleContinue('register')}
              disabled={!selectedRole}
              className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 px-4 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {t('sign-up')}
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