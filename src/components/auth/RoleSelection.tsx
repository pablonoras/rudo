import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoleInfo from './RoleInfo';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 to-black"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>
      </div>

      <main className="flex-grow relative z-10 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-center mb-8">
              Choose Your Role
            </h1>
            
            {/* Role Information Banner */}
            <RoleInfo />
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Coach Option */}
              <div 
                onClick={() => navigate('/coach-signin')}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                      <path d="M18 3 l-3 3"></path>
                      <path d="M6 3 l3 3"></path>
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center">I'm a Coach</h2>
                <p className="text-gray-400 mb-6 text-center">
                  Create workouts, manage athletes, and track progress
                </p>
                <div className="flex justify-center">
                  <button className="inline-flex items-center bg-purple-600/30 text-purple-200 px-4 py-2 rounded-lg group-hover:bg-purple-600/50 transition-colors">
                    Continue as Coach
                    <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
              
              {/* Athlete Option */}
              <div 
                onClick={() => navigate('/athlete-signin')}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 5v14"></path>
                      <path d="M18 5v14"></path>
                      <path d="M6 9h12"></path>
                      <path d="M6 15h12"></path>
                      <path d="M6 5h12"></path>
                      <path d="M6 19h12"></path>
                      <rect x="2" y="8" width="4" height="8" rx="1"></rect>
                      <rect x="18" y="8" width="4" height="8" rx="1"></rect>
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center">I'm an Athlete</h2>
                <p className="text-gray-400 mb-6 text-center">
                  Find your coach, view workouts, and log your results
                </p>
                <div className="flex justify-center">
                  <button className="inline-flex items-center bg-blue-600/30 text-blue-200 px-4 py-2 rounded-lg group-hover:bg-blue-600/50 transition-colors">
                    Continue as Athlete
                    <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center text-gray-500 text-sm">
              <p>Your account type cannot be changed later. If you need both roles, use separate accounts.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleSelection;