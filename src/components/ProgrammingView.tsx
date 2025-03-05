import React, { useState } from 'react';
import { Plus, Save, Trash2, GripVertical, Copy, AlertCircle, Star, History, Lightbulb, ChevronDown } from 'lucide-react';
import { Athlete, Section, Translations } from '../types';

interface ProgrammingViewProps {
  athlete: Athlete;
  selectedDate: Date;
  t: Translations;
}

const SECTION_TYPES = ['warmup', 'strength', 'skill', 'metcon', 'cooldown'] as const;

// Enhanced templates with athlete level adaptations
const TEMPLATES = {
  warmup: {
    beginner: [
      '3 rounds:\n- 10 air squats\n- 5 push-ups (scale to knees if needed)\n- 10 walking lunges',
      'Row 500m at easy pace\nThen:\n- 10 arm circles each direction\n- 10 leg swings each\n- World\'s greatest stretch - 2 each side'
    ],
    intermediate: [
      '3 rounds:\n- 15 air squats\n- 10 push-ups\n- 10 v-ups\n- 10 pass-throughs',
      'Run 800m at easy pace\nThen 2 rounds:\n- 10 inchworms\n- 10 shoulder taps\n- 10 leg swings each'
    ],
    advanced: [
      '3 rounds:\n- 20 air squats\n- 15 push-ups\n- 15 hollow rocks\n- 10 burpees',
      'Row 1000m at moderate pace\nThen dynamic stretching:\n- Spider-man with rotation\n- Shoulder mobility\n- Hip activation'
    ]
  },
  strength: {
    beginner: [
      'Back Squat\n3x5 @ 70-75%\nFocus on form and depth',
      'Deadlift\n5x3 @ 65-70%\nPractice setup and hip hinge'
    ],
    intermediate: [
      'Back Squat\n5x5 @ 75-80%\nBuild in weight each set',
      'Deadlift\n5-5-3-3-1\nBuild to heavy single'
    ],
    advanced: [
      'Back Squat\nWave loading:\n3@75% / 3@85% / 1@90%\n3@80% / 2@87% / 1@92%',
      'Deadlift\n1-1-1-1-1\nBuild to new 1RM\nThen 3x3 @ 80%'
    ]
  },
  skill: {
    beginner: [
      'Clean & Jerk Technique\n5x3 with empty barbell\nFocus on positions',
      'Ring Rows & Push-up Practice\n4 sets:\n- 8-10 ring rows\n- Max push-ups'
    ],
    intermediate: [
      'Clean & Jerk\n7x2 @ 65-70%\nFocus on speed under bar',
      'Muscle-up Progression\n4 rounds:\n- 5 strict pull-ups\n- 5 strict dips\n- 3 kipping attempts'
    ],
    advanced: [
      'Clean & Jerk\nEvery 2 min for 16 min:\n1 clean + 2 jerks @ 75-80%',
      'Muscle-up Practice\n5 rounds:\n- 2 strict muscle-ups\n- 3 kipping muscle-ups\n- 2 bar muscle-ups'
    ]
  },
  metcon: {
    beginner: [
      'AMRAP 10:\n- 5 goblet squats\n- 5 push-ups\n- 10 walking lunges',
      'For Time:\n3 rounds\n- 200m run\n- 10 KB swings\n- 10 box step-ups'
    ],
    intermediate: [
      'AMRAP 15:\n- 10 power cleans (95/65)\n- 15 push-ups\n- 20 box jumps',
      'For Time:\n21-15-9\n- Thrusters (95/65)\n- Pull-ups'
    ],
    advanced: [
      'AMRAP 20:\n- 15 power cleans (135/95)\n- 12 bar muscle-ups\n- 30 double-unders',
      'For Time:\n- 30 clean & jerks (135/95)\n- 30 chest-to-bar\n- 30 burpees'
    ]
  },
  cooldown: {
    beginner: [
      'Row 500m easy\nThen light stretching:\n- Hip flexors\n- Shoulders\n- Hamstrings',
      '5 min easy bike\nBasic mobility work'
    ],
    intermediate: [
      'Row 750m easy\nThen:\n- Pigeon pose - 1 min each\n- Shoulder mobility\n- Core stretching',
      '8 min easy bike\nFoam roll tight areas'
    ],
    advanced: [
      'Row 1000m easy\nThen:\n- Advanced mobility work\n- Recovery positions\n- Breathing exercises',
      '10 min easy bike\nComprehensive mobility routine'
    ]
  }
};

export function ProgrammingView({ athlete, selectedDate, t }: ProgrammingViewProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedType, setSelectedType] = useState<typeof SECTION_TYPES[number]>('warmup');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const addSection = (type?: typeof SECTION_TYPES[number], template?: string) => {
    setSections([...sections, {
      id: Date.now().toString(),
      name: type ? t[type] : '',
      content: template || '',
      order: sections.length,
      type,
      intensity: 'moderate'
    }]);
    setShowTemplates(false);
    setShowQuickAdd(false);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const duplicateSection = (section: Section) => {
    setSections([...sections, {
      ...section,
      id: Date.now().toString(),
      order: sections.length,
      name: `${section.name} (${t.copy})`
    }]);
  };

  const getAthleteLevel = () => {
    return athlete.level.toLowerCase() as keyof typeof TEMPLATES.warmup;
  };

  const getSuggestedTemplates = () => {
    const level = getAthleteLevel();
    return SECTION_TYPES.map(type => ({
      type,
      template: TEMPLATES[type][level][0]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {new Intl.DateTimeFormat('default', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            }).format(selectedDate)}
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Lightbulb className="w-5 h-5" />
              {t.quickAdd}
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2">
              <History className="w-5 h-5" />
              {t.recentPerformance}
            </button>
          </div>
        </div>

        {showQuickAdd && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {t.suggestedTemplates}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {getSuggestedTemplates().map(({ type, template }) => (
                <button
                  key={type}
                  onClick={() => addSection(type, template)}
                  className={`text-left p-4 rounded-xl transition-colors hover:bg-slate-700 border-l-4 ${getSectionColor(type)}`}
                >
                  <div className="font-medium mb-2">{t[type]}</div>
                  <div className="text-sm text-slate-400 line-clamp-2">{template}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div 
            key={section.id} 
            className={`bg-slate-800 rounded-xl p-6 relative group ${
              section.type ? `border-l-4 ${getSectionColor(section.type)}` : ''
            }`}
          >
            <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-5 h-5 text-slate-500" />
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t.sectionName}
                  value={section.name}
                  onChange={(e) => updateSection(section.id, { name: e.target.value })}
                  className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 py-1 w-full"
                />
                {section.type && (
                  <div className="flex gap-2 mt-2 px-2">
                    <select
                      value={section.intensity}
                      onChange={(e) => updateSection(section.id, { intensity: e.target.value as Section['intensity'] })}
                      className="bg-slate-700 border-none rounded-lg text-sm px-3 py-1"
                    >
                      <option value="light">{t.light}</option>
                      <option value="moderate">{t.moderate}</option>
                      <option value="heavy">{t.heavy}</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => duplicateSection(section)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={() => removeSection(section.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                placeholder={t.content}
                value={section.content}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                className="w-full bg-slate-900 border-none rounded-lg p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              
              <textarea
                placeholder={t.notes}
                value={section.notes}
                onChange={(e) => updateSection(section.id, { notes: e.target.value })}
                className="w-full bg-slate-900 border-none rounded-lg p-4 h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-400"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Section */}
      <div className="bg-slate-800 rounded-xl p-6">
        {showTemplates ? (
          <div className="space-y-6">
            <div className="flex gap-2">
              {SECTION_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedType === type
                      ? `${getSectionColor(type)} text-white`
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {t[type]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {TEMPLATES[selectedType][getAthleteLevel()].map((template, index) => (
                <button
                  key={index}
                  onClick={() => addSection(selectedType, template)}
                  className="text-left bg-slate-900 p-4 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <pre className="font-mono text-sm whitespace-pre-wrap">
                    {template}
                  </pre>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setShowTemplates(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {t.addCustomSection}
              </button>
              <button
                onClick={() => addSection(selectedType)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {t.addSection}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex-1 py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-colors flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500"
            >
              <Plus className="w-5 h-5" />
              {t.useTemplate}
            </button>
            
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2">
              <Save className="w-5 h-5" />
              {t.save}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getSectionColor(type: typeof SECTION_TYPES[number]): string {
  switch (type) {
    case 'warmup': return 'border-yellow-500';
    case 'strength': return 'border-blue-500';
    case 'skill': return 'border-purple-500';
    case 'metcon': return 'border-red-500';
    case 'cooldown': return 'border-green-500';
  }
}