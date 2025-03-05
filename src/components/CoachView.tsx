import React, { useState } from 'react';
import { Search, ChevronLeft, UserCog } from 'lucide-react';
import { Translations, Athlete } from '../types';
import { CoachWeeklyCalendar } from './CoachWeeklyCalendar';
import { ProgrammingView } from './ProgrammingView';

interface CoachViewProps {
  t: Translations;
  onViewAsAthlete: (athlete: Athlete) => void;
}

export function CoachView({ t, onViewAsAthlete }: CoachViewProps) {
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAthletesList, setShowAthletesList] = useState(true);
  const [showProgramming, setShowProgramming] = useState(false);

  // Mock data for demonstration
  const athletes: Athlete[] = Array.from({ length: 120 }, (_, i) => ({
    id: i.toString(),
    name: `Athlete ${i + 1}`,
    avatar: `https://images.unsplash.com/photo-${1494790108377 + (i % 5)}-be9c29b29330?w=40&h=40&fit=crop`,
    level: i % 3 === 0 ? 'Advanced' : i % 2 === 0 ? 'Intermediate' : 'Beginner',
    lastActive: i % 2 === 0 ? '2h ago' : '5m ago',
    group: i % 4 === 0 ? 'Competition' : i % 3 === 0 ? 'Masters' : i % 2 === 0 ? 'Open' : 'Basics',
    joinDate: '2023-09-15',
    completedWorkouts: 156 + i,
    attendance: 85 + (i % 15),
    personalBests: {
      'Back Squat': '140kg',
      'Clean & Jerk': '100kg',
      'Snatch': '80kg',
      'Deadlift': '180kg',
      'Pull-ups': '35 reps'
    }
  }));

  const filteredAthletes = athletes.filter(athlete => 
    searchQuery === '' || athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAthleteData = athletes.find(a => a.id === selectedAthlete);

  const handleAthleteSelect = (athleteId: string) => {
    setSelectedAthlete(athleteId);
    setShowAthletesList(false);
  };

  return (
    <div className="h-screen flex">
      {/* Athletes List */}
      <div className={`bg-slate-800 flex flex-col transition-all duration-300 ${
        showAthletesList ? 'w-80' : 'w-16'
      }`}>
        {showAthletesList ? (
          <div className="p-4 flex flex-col h-full">
            <div className="relative mb-4">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t.searchAthletes}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="space-y-2">
                {filteredAthletes.map(athlete => (
                  <button
                    key={athlete.id}
                    onClick={() => handleAthleteSelect(athlete.id)}
                    className={`w-full p-3 rounded-lg transition-all flex items-center gap-3 ${
                      selectedAthlete === athlete.id 
                        ? 'bg-slate-700 ring-2 ring-indigo-500'
                        : 'hover:bg-slate-700'
                    }`}
                  >
                    <img 
                      src={athlete.avatar}
                      alt={athlete.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium truncate">{athlete.name}</div>
                      <div className="text-sm text-slate-400">
                        {athlete.group} • {athlete.level}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <button
              onClick={() => setShowAthletesList(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-slate-900">
        {selectedAthleteData ? (
          <div className="h-full flex flex-col">
            {/* Athlete Header */}
            <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedAthleteData.avatar}
                  alt={selectedAthleteData.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h1 className="text-xl font-bold">{selectedAthleteData.name}</h1>
                  <div className="text-sm text-slate-400">
                    {selectedAthleteData.group} • {selectedAthleteData.level}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onViewAsAthlete(selectedAthleteData)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <UserCog className="w-5 h-5" />
                View as Athlete
              </button>
            </div>

            {/* Calendar and Programming Area */}
            <div className="flex-1 overflow-hidden">
              {showProgramming ? (
                <ProgrammingView
                  athlete={selectedAthleteData}
                  selectedDate={selectedDate}
                  t={t}
                  onBack={() => setShowProgramming(false)}
                />
              ) : (
                <CoachWeeklyCalendar
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setShowProgramming(true);
                  }}
                  selectedAthlete={selectedAthlete}
                  athlete={selectedAthleteData}
                  t={t}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            {t.selectAthletePrompt}
          </div>
        )}
      </div>
    </div>
  );
}