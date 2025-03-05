import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, ArrowLeft, X } from 'lucide-react';
import { Translations, Athlete } from '../types';

interface Session {
  id: string;
  time: string;
  duration: number;
  type: 'morning' | 'afternoon' | 'evening';
  sections: {
    type: 'warmup' | 'strength' | 'skill' | 'metcon' | 'cooldown';
    name: string;
    duration: number;
    content?: string;
  }[];
}

interface WeeklyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose?: () => void;
  t: Translations;
  athlete: Athlete;
  selectedAthlete: string;
}

export function WeeklyCalendar({ selectedDate, onDateSelect, onClose, t, athlete }: WeeklyCalendarProps) {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [expandedSession, setExpandedSession] = useState<{date: Date, session: Session} | null>(null);

  // Mock data for demonstration
  const [sessions] = useState<Record<string, Session[]>>({
    [new Date().toISOString().split('T')[0]]: [
      {
        id: '1',
        time: '06:00',
        duration: 60,
        type: 'morning',
        sections: [
          { type: 'warmup', name: 'General Warm-up', duration: 15, content: '3 rounds:\n- 10 air squats\n- 10 push-ups\n- 10 sit-ups' },
          { type: 'strength', name: 'Back Squat', duration: 30, content: '5x5 @ 75-80%\nBuild in weight each set' },
          { type: 'cooldown', name: 'Mobility', duration: 15, content: 'Hip and shoulder mobility\nFoam rolling' }
        ]
      },
      {
        id: '2',
        time: '17:00',
        duration: 45,
        type: 'evening',
        sections: [
          { type: 'warmup', name: 'Mobility', duration: 10, content: 'Dynamic stretching\nMovement prep' },
          { type: 'metcon', name: 'Conditioning', duration: 25, content: 'AMRAP 20:\n- 15 cal row\n- 12 burpees\n- 9 power cleans' },
          { type: 'cooldown', name: 'Cool-down', duration: 10, content: 'Light stretching\nBreathing exercises' }
        ]
      }
    ]
  });

  const getWeekDates = (date: Date) => {
    const week = [];
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());

    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      week.push(current);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  const getSessionsForDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return sessions[dateKey] || [];
  };

  const getSessionColor = (type: Session['type']) => {
    switch (type) {
      case 'morning': return 'border-yellow-500 bg-yellow-500/10';
      case 'afternoon': return 'border-orange-500 bg-orange-500/10';
      case 'evening': return 'border-blue-500 bg-blue-500/10';
    }
  };

  if (expandedSession) {
    return (
      <div className="h-full flex flex-col bg-slate-900">
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <button
            onClick={() => setExpandedSession(null)}
            className="hover:bg-slate-700 p-2 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.backToCalendar}
          </button>
          <button
            onClick={() => setExpandedSession(null)}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-2xl font-bold mb-2">
              {new Intl.DateTimeFormat('default', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              }).format(expandedSession.date)}
            </div>
            <div className={`bg-slate-800 rounded-xl overflow-hidden mb-6 border-l-4 ${getSessionColor(expandedSession.session.type).split(' ')[0]}`}>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-xl">{expandedSession.session.time}</div>
                  <div className="flex items-center text-slate-400">
                    <Clock className="w-5 h-5 mr-2" />
                    {expandedSession.session.duration}min
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {expandedSession.session.sections.map((section, idx) => (
                <div key={idx} className="bg-slate-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{section.name}</h3>
                    <span className="text-sm text-slate-400 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {section.duration}min
                    </span>
                  </div>
                  <div className="text-slate-300 whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Calendar Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(selectedDate.getDate() - (view === 'week' ? 7 : 30));
                onDateSelect(newDate);
              }}
              className="hover:bg-slate-700 p-2 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-medium">
              {new Intl.DateTimeFormat('default', { 
                month: 'long',
                year: 'numeric'
              }).format(selectedDate)}
            </h2>
            <button 
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(selectedDate.getDate() + (view === 'week' ? 7 : 30));
                onDateSelect(newDate);
              }}
              className="hover:bg-slate-700 p-2 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                view === 'week' ? 'bg-indigo-600' : 'hover:bg-slate-700'
              }`}
            >
              {t.week}
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                view === 'month' ? 'bg-indigo-600' : 'hover:bg-slate-700'
              }`}
            >
              {t.month}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {weekDates.map((date, index) => {
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const sessions = getSessionsForDate(date);

            return (
              <button
                key={index}
                onClick={() => onDateSelect(date)}
                className={`p-2 md:p-3 rounded-xl transition-all ${
                  isSelected 
                    ? 'bg-indigo-600' 
                    : isToday
                      ? 'bg-slate-700'
                      : 'hover:bg-slate-700'
                }`}
              >
                <div className="text-xs md:text-sm text-slate-400 mb-1">
                  {new Intl.DateTimeFormat('default', { weekday: 'short' }).format(date)}
                </div>
                <div className="text-lg md:text-xl font-bold">
                  {date.getDate()}
                </div>
                {sessions.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {sessions.map(session => (
                      <div 
                        key={session.id}
                        className={`flex-1 h-1 rounded-full ${
                          getSessionColor(session.type).split(' ')[0].replace('border', 'bg')
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {getSessionsForDate(selectedDate).map(session => (
            <button
              key={session.id}
              onClick={() => setExpandedSession({ date: selectedDate, session })}
              className={`w-full text-left rounded-xl bg-slate-800 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all ${
                getSessionColor(session.type)
              }`}
            >
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xl font-bold">{session.time}</div>
                  <div className="flex items-center text-slate-400">
                    <Clock className="w-5 h-5 mr-2" />
                    {session.duration}min
                  </div>
                </div>
                <div className="space-y-2">
                  {session.sections.map((section, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <span className="text-slate-300">{section.name}</span>
                      <span className="text-sm text-slate-400">{section.duration}min</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}