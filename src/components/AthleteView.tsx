import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Translations, Athlete } from '../types';
import { WeeklyCalendar } from './WeeklyCalendar';

interface AthleteViewProps {
  t: Translations;
  athlete: Athlete | null;
}

export function AthleteView({ t, athlete }: AthleteViewProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCompleted, setIsCompleted] = useState(false);

  const workout = {
    sections: [
      { name: 'Calentamiento', content: '3 rondas:\n- 10 air squats\n- 10 push-ups\n- 10 sit-ups', duration: 15 },
      { name: 'Técnica', content: 'Clean & Jerk: 5x3 @ 70-75%', duration: 30 },
      { name: 'WOD', content: 'For Time:\n21-15-9\n- Thrusters (95/65 lbs)\n- Pull-ups', duration: 20 },
    ]
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }).format(date);
  };

  return (
    <div className="min-h-screen md:min-h-0 md:max-w-2xl w-full mx-auto p-4 md:p-6">
      {showCalendar ? (
        <WeeklyCalendar
          onClose={() => setShowCalendar(false)}
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setShowCalendar(false);
          }}
          t={t}
          athlete={athlete!}
          selectedAthlete={athlete?.id || ''}
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 1)))}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl md:text-4xl font-bold capitalize">{formatDate(selectedDate)}</h1>
              <button 
                onClick={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 1)))}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => setShowCalendar(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors w-full md:w-auto"
            >
              <CalendarIcon className="w-4 h-4" />
              {t.calendar}
            </button>
          </div>

          <div className="space-y-4 md:space-y-6">
            {workout.sections.map((section, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl p-4 md:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl md:text-2xl font-bold">{section.name}</h2>
                  <div className="flex items-center text-sm text-slate-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {section.duration}min
                  </div>
                </div>
                <div className="whitespace-pre-line text-slate-300 text-base md:text-lg leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}

            <div className={`bg-slate-800 rounded-xl p-4 md:p-6 transition-all ${
              isCompleted ? 'ring-2 ring-green-500' : ''
            }`}>
              <h3 className="text-xl font-bold mb-4">{t.results}</h3>
              <textarea
                placeholder={t.results}
                className="w-full bg-slate-900 rounded-lg p-4 mb-4 text-base md:text-lg border-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
              <textarea
                placeholder={t.comments}
                className="w-full bg-slate-900 rounded-lg p-4 mb-6 text-base md:text-lg border-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
              <button 
                onClick={() => setIsCompleted(true)}
                className={`w-full py-3 md:py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base md:text-lg font-medium ${
                  isCompleted 
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                {isCompleted ? t.completed : t.submit}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}