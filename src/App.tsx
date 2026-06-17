import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/Layout/TopBar';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/Calendar/CalendarView';
import { TodoList } from './components/Todo/TodoList';
import { ShoppingList } from './components/Shopping/ShoppingList';
import { FinancePlanner } from './components/Finance/FinancePlanner';
import { FridgeCupboard } from './components/Fridge/FridgeCupboard';
import { RecipesView } from './components/Fridge/RecipesView';
import { AchievementToast } from './components/Achievements/AchievementToast';
import { AchievementsModal } from './components/Achievements/AchievementsModal';
import { AuthScreen } from './components/Auth/AuthScreen';
import { triggerAchievementCheck, trackSectionVisit } from './achievements/definitions';
import { useAuth } from './contexts/AuthContext';
import { useUserData } from './contexts/UserDataContext';
import { Loader2 } from 'lucide-react';
import type { Achievement } from './achievements/definitions';
import type { View } from './types';

const PAGE_TITLES: Partial<Record<View, string>> = {
  dashboard: 'Home',
  calendar:  'Calendar',
  todo:      'To-Do List',
  shopping:  'Shopping List',
  finance:   'Finance',
  fridge:    'Kitchen',
  recipes:   'Recipes',
};

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 size={32} className="text-gray-600 animate-spin" />
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { dataLoaded } = useUserData();

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

  if (authLoading || (user && !dataLoaded)) return <LoadingScreen />;
  if (!user) return <AuthScreen />;

  const isHome = view === 'dashboard';

  const viewContent = (
    <>
      {isHome
        ? <Dashboard
            onNavigate={navigate}
            onOpenAchievements={() => setShowAchievementsModal(true)}
            onSignOut={signOut}
          />
        : <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
            {view === 'calendar'  && <CalendarView />}
            {view === 'todo'      && <TodoList />}
            {view === 'shopping'  && <ShoppingList />}
            {view === 'finance'   && <FinancePlanner />}
            {view === 'fridge'    && <FridgeCupboard />}
            {view === 'recipes'   && <RecipesView />}
          </div>
      }

      {currentAchievement && (
        <AchievementToast achievement={currentAchievement} onDismiss={() => setCurrentAchievement(null)} />
      )}
      {showAchievementsModal && (
        <AchievementsModal onClose={() => setShowAchievementsModal(false)} />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">

      {/* ── Mobile layout (< md) ── centered card, TopBar for nav */}
      <div className="md:hidden max-w-xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 shadow-2xl relative flex flex-col">
        {!isHome && (
          <TopBar title={PAGE_TITLES[view] ?? ''} onBack={() => setView('dashboard')} />
        )}
        {viewContent}
      </div>

      {/* ── Tablet / desktop layout (md+) ── sidebar + full-width content */}
      <div className="hidden md:flex min-h-screen">
        <div className="w-56 flex-shrink-0 sticky top-0 h-screen">
          <Sidebar
            currentView={view}
            onNavigate={navigate}
            onOpenAchievements={() => setShowAchievementsModal(true)}
            onSignOut={signOut}
          />
        </div>

        <div className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-950 relative flex flex-col overflow-hidden">
          {!isHome && (
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{PAGE_TITLES[view]}</h1>
            </div>
          )}
          <div className={`flex-1 overflow-y-auto ${isHome ? '' : 'p-6'}`}>
            {viewContent}
          </div>
        </div>
      </div>

    </div>
  );
}
