import { Calendar, CheckSquare, ShoppingCart, DollarSign, Refrigerator, LayoutDashboard, ChefHat } from 'lucide-react';
import type { View } from '../../types';

interface SidebarProps {
  current: View;
  onNavigate: (view: View) => void;
}

const navItems: { view: View; label: string; icon: React.ReactNode; color: string }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, color: 'text-violet-600' },
  { view: 'calendar', label: 'Calendar', icon: <Calendar size={20} />, color: 'text-blue-600' },
  { view: 'todo', label: 'To-Do', icon: <CheckSquare size={20} />, color: 'text-green-600' },
  { view: 'shopping', label: 'Shopping', icon: <ShoppingCart size={20} />, color: 'text-orange-600' },
  { view: 'finance', label: 'Finance', icon: <DollarSign size={20} />, color: 'text-emerald-600' },
  { view: 'fridge', label: 'Fridge & Cupboard', icon: <Refrigerator size={20} />, color: 'text-sky-600' },
  { view: 'recipes', label: 'Recipes', icon: <ChefHat size={20} />, color: 'text-rose-600' },
];

export function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen shadow-sm flex-shrink-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">HomeBase</h1>
        <p className="text-xs text-gray-500 mt-1">Your home, organised</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ view, label, icon, color }) => {
          const active = current === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-violet-50 text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={active ? 'text-violet-600' : color}>{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">HomeBase v1.0</p>
      </div>
    </aside>
  );
}
