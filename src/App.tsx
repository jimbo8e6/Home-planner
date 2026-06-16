import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/Layout/TopBar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/Calendar/CalendarView';
import { TodoList } from './components/Todo/TodoList';
import { ShoppingList } from './components/Shopping/ShoppingList';
import { FinancePlanner } from './components/Finance/FinancePlanner';
import { FridgeCupboard } from './components/Fridge/FridgeCupboard';
import { RecipesView } from './components/Fridge/RecipesView';
import { AchievementToast } from './components/Achievements/AchievementToast';
import { AchievementsModal } from './components/Achievements/AchievementsModal';
import { triggerAchievementCheck, trackSectionVisit } from './achievements/definitions';
import type { Achievement } from './achievements/definitions';
import type { View } from './types';

const PAGE_TITLES: Partial<Record<View, string>> = {
  calendar:  'Calendar',
  todo:      'To-Do List',
  shopping:  'Shopping List',
  finance:   'Finance',
  fridge:    'Fridge & Cupboard',
  recipes:   'Recipes',
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const achievement = (e as CustomEvent<Achievement>).detail;
      setAchievementQueue(prev => [...prev, achievement]);
    };
    window.addEventListener('achievement-unlocked', handler);
    triggerAchievementCheck();
    return () => window.removeEventListener('achievement-unlocked', handler);
  }, []);

  // Dequeue one at a time
  useEffect(() => {
    if (!currentAchievement && achievementQueue.length > 0) {
      setCurrentAchievement(achievementQueue[0]);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [currentAchievement, achievementQueue]);

  const navigate = useCallback((v: View) => {
    if (v !== 'dashboard') trackSectionVisit(v);
    setView(v);
  }, []);

  const isHome = view === 'dashboard';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* App shell — phone-width centered, card-style on tablet+ */}
      <div className="max-w-xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 shadow-2xl relative flex flex-col">
        {isHome ? (
          <Dashboard
            onNavigate={navigate}
            onOpenAchievements={() => setShowAchievementsModal(true)}
          />
        ) : (
          <>
            <TopBar
              title={PAGE_TITLES[view] ?? ''}
              onBack={() => setView('dashboard')}
            />
            <div className="flex-1 overflow-y-auto p-4">
              {view === 'calendar'  && <CalendarView />}
              {view === 'todo'      && <TodoList />}
              {view === 'shopping'  && <ShoppingList />}
              {view === 'finance'   && <FinancePlanner />}
              {view === 'fridge'    && <FridgeCupboard />}
              {view === 'recipes'   && <RecipesView />}
            </div>
          </>
        )}

        {currentAchievement && (
          <AchievementToast
            achievement={currentAchievement}
            onDismiss={() => setCurrentAchievement(null)}
          />
        )}

        {showAchievementsModal && (
          <AchievementsModal onClose={() => setShowAchievementsModal(false)} />
        )}
      </div>
    </div>
  );
}
