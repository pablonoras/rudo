import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  BarChart, 
  Settings, 
  LogOut,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Dumbbell,
  Clock,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 p-4 flex flex-col">
        <div className="text-2xl font-black tracking-tighter mb-8">RUDO</div>
        
        <nav className="space-y-2 flex-grow">
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
          className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-red-400 mt-4"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="h-16 border-b border-white/10 px-8 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="relative p-2 hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
            </button>
            
            <div className="relative">
              <button 
                className="flex items-center space-x-2 p-2 hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setShowProfile(!showProfile)}
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-sm font-medium">JD</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Welcome, Coach!</h1>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Plus className="w-5 h-5" />
              <span>New Program</span>
            </button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-300">Active Athletes</h3>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">24</p>
              <p className="text-sm text-green-400 flex items-center mt-2">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12% this month
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-300">Today's Classes</h3>
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">8</p>
              <p className="text-sm text-gray-400 mt-2">Next class in 45m</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-300">PRs This Week</h3>
                <Dumbbell className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">12</p>
              <p className="text-sm text-gray-400 mt-2">4 today</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-300">Avg. Class Time</h3>
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">62m</p>
              <p className="text-sm text-gray-400 mt-2">+5m from last week</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">New athlete joined</p>
                      <p className="text-sm text-gray-400">Sarah Johnson completed onboarding</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">2h ago</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoachDashboard;