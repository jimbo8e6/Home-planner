import { Home, CheckSquare, ShoppingCart, Package, Wallet, Calendar, ChefHat, Trophy } from 'lucide-react';
import type { View } from '../../types';

const NAV_ITEMS: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard',  label: 'Home',              icon: <Home size={18} /> },
  { view: 'calendar',   label: 'Calendar',           icon: <Calendar size={18} /> },
  { view: 'todo',       label: 'To-Do',              icon: <CheckSquare size={18} /> },
  { view: 'shopping',   label: 'Shopping',           icon: <ShoppingCart size={18} /> },
  { view: 'fridge',     label: 'Kitchen',            icon: <Package size={18} /> },
  { view: 'recipes',    label: 'Recipes',            icon: <ChefHat size={18} /> },
  { view: 'finance',    label: 'Finance',            icon: <Wallet size={18} /> },
];

interface Props {
  currentView: View;
  onNavigate: (v: View) => void;
  onOpenAchievements: () => void;
}

export function Sidebar({ currentView, onNavigate, onOpenAchievements }: Props) {
  return (
    <div className="flex flex-col h-full bg-gray-900 dark:bg-black">
      {/* Logo */}
      <div className="px-5 pt-8 pb-6 border-b border-white/10">
        <p className="text-white font-bold text-lg tracking-tight">HomeBase</p>
        <p className="text-white/40 text-xs mt-0.5">Your home, organised</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ view, label, icon }) => {
          const active = currentView === view;
          return (
            <button key={view} onClick={() => onNavigate(view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                active ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/8'
              }`}>
              <span className={active ? 'text-white' : 'text-white/40'}>{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* Achievements */}
      <div className="px-3 pb-8 pt-3 border-t border-white/10">
        <button onClick={onOpenAchievements}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-all">
          <Trophy size={18} className="text-white/40" />
          Achievements
        </button>
      </div>
    </div>
  );
}
