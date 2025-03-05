import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { Translations, Athlete } from '../types';
import { ProgrammingView } from './ProgrammingView';

interface CoachWeeklyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  selectedAthlete: string;
  athlete: Athlete;
  t: Translations;
}

export function CoachWeeklyCalendar({ selectedDate, onDateSelect, athlete, t }: CoachWeeklyCalendarProps) {
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

  // Mock data for demonstration
  const workouts = {
    [new Date().toISOString().split('T')[0]]: {
      sections: [
        { type: 'warmup', name: 'General Warm-up', content: '3 rounds:\n- 10 air squats\n- 10 push-ups\n- 10 sit-ups' },
        { type: 'strength', name: 'Back Squat', content: '5x5 @ 75-80%\nBuild in weight each set' },
        { type: 'metcon', name: 'For Time', content: '21-15-9\n- Thrusters (95/65)\n- Pull-ups' }
      ]
    }
  };

  const getWorkoutForDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return workouts[dateKey];
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'warmup': return 'border-yellow-500';
      case 'strength': return 'border-blue-500';
      case 'skill': return 'border-purple-500';
      case 'metcon': return 'border-red-500';
      case 'cooldown': return 'border-green-500';
      default: return 'border-slate-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Calendar Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(selectedDate.getDate() - 7);
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
                newDate.setDate(selectedDate.getDate() + 7);
                onDateSelect(newDate);
              }}
              className="hover:bg-slate-700 p-2 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const workout = getWorkoutForDate(date);

            return (
              <div key={index} className="flex flex-col">
                <div className={`text-center p-2 rounded-t-lg ${
                  isToday ? 'bg-slate-700' : 'bg-slate-800'
                }`}>
                  <div className="text-sm text-slate-400">
                    {new Intl.DateTimeFormat('default', { weekday: 'short' }).format(date)}
                  </div>
                  <div className="text-xl font-bold">
                    {date.getDate()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Programming Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-7 gap-4 min-h-full">
          {weekDates.map((date, dayIndex) => {
            const workout = getWorkoutForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div 
                key={dayIndex}
                className={`bg-slate-800 rounded-lg flex flex-col ${
                  isToday ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                {workout ? (
                  <div className="flex-1 p-4">
                    <div className="space-y-4">
                      {workout.sections.map((section, idx) => (
                        <div 
                          key={idx}
                          className={`border-l-4 ${getSectionColor(section.type)} bg-slate-900/50 rounded-lg p-3`}
                        >
                          <div className="font-medium mb-2">{section.name}</div>
                          <div className="text-sm text-slate-400 whitespace-pre-line">
                            {section.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => onDateSelect(date)}
                    className="flex-1 p-4 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}