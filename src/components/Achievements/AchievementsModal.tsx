import { X } from 'lucide-react';
import { ACHIEVEMENTS, RARITY_CONFIG } from '../../achievements/definitions';
import type { AchievementCategory } from '../../achievements/definitions';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  todo:     '✅ To-Do',
  shopping: '🛒 Shopping',
  fridge:   '🧊 Fridge & Recipes',
  finance:  '💰 Finance',
  calendar: '📅 Calendar',
  general:  '🏡 General',
};

const CATEGORIES: AchievementCategory[] = ['todo', 'shopping', 'fridge', 'finance', 'calendar', 'general'];

interface Props {
  onClose: () => void;
}

export function AchievementsModal({ onClose }: Props) {
  const unlocked: string[] = (() => {
    try { return JSON.parse(localStorage.getItem('unlocked-achievements') || '[]'); }
    catch { return []; }
  })();

  const unlockedCount = unlocked.length;
  const total = ACHIEVEMENTS.length;

  return (
    <div
      className="absolute inset-0 bg-black/50 z-50 flex flex-col"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white flex-1 overflow-y-auto rounded-t-3xl mt-14">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 pt-5 pb-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
            <p className="text-sm text-gray-400 mt-0.5">{unlockedCount} / {total} unlocked</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Overall progress</span>
            <span>{Math.round((unlockedCount / total) * 100)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${(unlockedCount / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-5 space-y-6 pb-10">
          {CATEGORIES.map(cat => {
            const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
            const catUnlocked = catAchievements.filter(a => unlocked.includes(a.id)).length;

            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 text-sm">{CATEGORY_LABELS[cat]}</h3>
                  <span className="text-xs text-gray-400">{catUnlocked}/{catAchievements.length}</span>
                </div>
                <div className="space-y-2">
                  {catAchievements.map(a => {
                    const isUnlocked = unlocked.includes(a.id);
                    const cfg = RARITY_CONFIG[a.rarity];

                    return (
                      <div
                        key={a.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          isUnlocked ? `${cfg.border} ${cfg.bg}` : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <span className={`text-2xl leading-none flex-shrink-0 ${!isUnlocked ? 'grayscale opacity-30' : ''}`}>
                          {isUnlocked ? a.emoji : '🔒'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                              {a.name}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isUnlocked ? cfg.badge : 'bg-gray-100 text-gray-400'}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className={`text-xs mt-0.5 leading-snug ${isUnlocked ? 'text-gray-500' : 'text-gray-300'}`}>
                            {isUnlocked ? a.description : '???'}
                          </p>
                        </div>
                        {isUnlocked && <span className="text-green-500 font-bold flex-shrink-0">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
