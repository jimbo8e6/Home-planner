import { useState } from 'react';
import { TopBar } from './components/Layout/TopBar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/Calendar/CalendarView';
import { TodoList } from './components/Todo/TodoList';
import { ShoppingList } from './components/Shopping/ShoppingList';
import { FinancePlanner } from './components/Finance/FinancePlanner';
import { FridgeCupboard } from './components/Fridge/FridgeCupboard';
import { RecipesView } from './components/Fridge/RecipesView';
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

  const isHome = view === 'dashboard';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* App shell — phone-width centered, card-style on tablet+ */}
      <div className="max-w-xl mx-auto min-h-screen bg-gray-50 shadow-2xl relative flex flex-col">
        {isHome ? (
          <Dashboard onNavigate={setView} />
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
      </div>
    </div>
  );
}
