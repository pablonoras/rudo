import React from 'react';
import { Users, Calendar, BarChart, Settings, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const CoachDashboard = () => {
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
            <Users className="w-5 h-5" />
            <span>Athletes</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <Calendar className="w-5 h-5" />
            <span>Programming</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <BarChart className="w-5 h-5" />
            <span>Analytics</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
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
        <h1 className="text-3xl font-bold mb-8">Welcome, Coach!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sample Cards */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">Active Athletes</h3>
            <p className="text-3xl font-bold text-purple-400">24</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">Today's Classes</h3>
            <p className="text-3xl font-bold text-purple-400">8</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">PRs This Week</h3>
            <p className="text-3xl font-bold text-purple-400">12</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoachDashboard;