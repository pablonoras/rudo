import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Coach Option */}
              <div 
                onClick={() => navigate('/coach-signin')}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center">
                    {/* Improved Clipboard Icon for Coach */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {/* Clipboard with decorative elements */}
                      <rect x="8" y="2" width="8" height="4" rx="1" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      {/* Clipboard lines/content */}
                      <line x1="9" y1="10" x2="15" y2="10" />
                      <line x1="9" y1="14" x2="15" y2="14" />
                      <line x1="9" y1="18" x2="13" y2="18" />
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
                    {/* Dumbbell Icon for Athlete */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 5v14"></path>
                      <path d="M18 5v14"></path>
                      <path d="M6 9h12"></path>
                      <path d="M6 15h12"></path>
                      <rect x="2" y="7" width="4" height="10" rx="1"></rect>
                      <rect x="18" y="7" width="4" height="10" rx="1"></rect>
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