import React from 'react';
import { Dumbbell, Calendar, Trophy, User, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const AthleteDashboard = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 p-4">
        <div className="text-2xl font-black tracking-tighter mb-8">RUDO</div>
        
        <nav className="space-y-2">
          <a href="#" className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Dumbbell className="w-5 h-5" />
            <span>Workouts</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <Calendar className="w-5 h-5" />
            <span>Schedule</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <Trophy className="w-5 h-5" />
            <span>PRs</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </a>
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-red-400 mt-auto absolute bottom-4"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Welcome, Athlete!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sample Cards */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">Today's WOD</h3>
            <p className="text-gray-400">
              5 Rounds For Time:
              <br />
              400m Run
              <br />
              15 Power Cleans (135/95)
              <br />
              15 Bar-Facing Burpees
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">Next Class</h3>
            <p className="text-3xl font-bold text-purple-400">17:30</p>
            <p className="text-gray-400">CrossFit Class</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">Recent PR</h3>
            <p className="text-3xl font-bold text-purple-400">225 lbs</p>
            <p className="text-gray-400">Back Squat</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AthleteDashboard;