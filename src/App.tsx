import { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/Calendar/CalendarView';
import { TodoList } from './components/Todo/TodoList';
import { ShoppingList } from './components/Shopping/ShoppingList';
import { FinancePlanner } from './components/Finance/FinancePlanner';
import { FridgeCupboard } from './components/Fridge/FridgeCupboard';
import { RecipesView } from './components/Fridge/RecipesView';
import type { View } from './types';

const PAGE_TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  calendar: 'Calendar',
  todo: 'To-Do List',
  shopping: 'Shopping List',
  finance: 'Finance Planner',
  fridge: 'Fridge & Cupboard',
  recipes: 'Recipes',
};

const PAGE_DESCRIPTIONS: Record<View, string> = {
  dashboard: 'Your home at a glance',
  calendar: 'Plan your schedule',
  todo: 'Track what needs doing',
  shopping: 'Tick items off as you shop, then complete your shop to auto-fill your fridge',
  finance: 'Manage money & subscriptions',
  fridge: 'Track what\'s in your fridge and cupboard',
  recipes: 'Recipes based on what you already have',
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar current={view} onNavigate={setView} />
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">{PAGE_TITLES[view]}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{PAGE_DESCRIPTIONS[view]}</p>
        </header>
        <div className="flex-1 p-8 overflow-auto">
          {view === 'dashboard' && <Dashboard onNavigate={setView} />}
          {view === 'calendar' && <CalendarView />}
          {view === 'todo' && <TodoList />}
          {view === 'shopping' && <ShoppingList />}
          {view === 'finance' && <FinancePlanner />}
          {view === 'fridge' && <FridgeCupboard />}
          {view === 'recipes' && <RecipesView />}
        </div>
      </main>
    </div>
  );
}
