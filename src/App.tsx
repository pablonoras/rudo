import React, { useState } from 'react';
import { CoachView } from './components/CoachView';
import { AthleteView } from './components/AthleteView';
import { LanguageToggle } from './components/LanguageToggle';
import { translations } from './i18n/translations';
import { Language, Athlete } from './types';

function App() {
  const [language, setLanguage] = useState<Language>('es');
  const [isCoach, setIsCoach] = useState(true);
  const [viewingAthlete, setViewingAthlete] = useState<Athlete | null>(null);
  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <LanguageToggle language={language} setLanguage={setLanguage} />
      {isCoach && !viewingAthlete ? (
        <CoachView 
          t={t} 
          onViewAsAthlete={(athlete) => {
            setViewingAthlete(athlete);
          }} 
        />
      ) : (
        <div className="relative">
          {viewingAthlete && (
            <button
              onClick={() => setViewingAthlete(null)}
              className="fixed top-4 left-4 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 z-10"
            >
              ← Back to Coach View
            </button>
          )}
          <AthleteView t={t} athlete={viewingAthlete} />
        </div>
      )}
    </div>
  );
}

export default App