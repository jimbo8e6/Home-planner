import { format, differenceInDays } from 'date-fns';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { CalendarEvent, TodoItem, ShoppingItem, Subscription, FridgeItem, RegularBill, Transaction, View } from '../types';

interface DashboardProps {
  onNavigate: (view: View) => void;
  onOpenAchievements: () => void;
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

// ─── Section bubble config ────────────────────────────────────────────────────

const SECTIONS: {
  view: View;
  label: string;
  emoji: string;
}[] = [
  { view: 'calendar',  label: 'Calendar',         emoji: '📅' },
  { view: 'todo',      label: 'To-Do',             emoji: '✅' },
  { view: 'shopping',  label: 'Shopping',          emoji: '🛒' },
  { view: 'finance',   label: 'Finance',           emoji: '💰' },
  { view: 'fridge',    label: 'Kitchen', emoji: '🧊' },
  { view: 'recipes',   label: 'Recipes',           emoji: '👨‍🍳' },
];

// ─── Alert card ───────────────────────────────────────────────────────────────

interface AlertItem {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  view: View;
  accent: string;
}

function AlertCard({ alert, onNavigate }: { alert: AlertItem; onNavigate: (v: View) => void }) {
  return (
    <button
      onClick={() => onNavigate(alert.view)}
      className="flex-shrink-0 w-52 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5 shadow-md border border-gray-100 dark:border-gray-700 text-left active:scale-95 transition-transform hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{alert.emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{alert.label}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{alert.sub}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Dashboard({ onNavigate, onOpenAchievements }: DashboardProps) {
  const [events]       = useLocalStorage<CalendarEvent[]>('calendar-events', []);
  const [todos]        = useLocalStorage<TodoItem[]>('todos', []);
  const [shopping]     = useLocalStorage<ShoppingItem[]>('shopping-items', []);
  const [subs]         = useLocalStorage<Subscription[]>('subscriptions', []);
  const [bills]        = useLocalStorage<RegularBill[]>('regular-bills', []);
  const [transactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [fridge]       = useLocalStorage<FridgeItem[]>('fridge-items', []);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const thisMonth = todayStr.slice(0, 7);

  // ── Data derivations
  const todayEvents = events.filter(e => e.date === todayStr);
  const urgentTodos = todos.filter(t => !t.completed && t.priority === 'high');
  const overdueTodos = todos.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
  const uncheckedShopping = shopping.filter(s => !s.checked);

  const expiringSoon = fridge.filter(i => {
    if (!i.expiryDate) return false;
    const days = differenceInDays(new Date(i.expiryDate), today);
    return days >= 0 && days <= 3;
  });

  const billsDueSoon = bills.filter(b => {
    if (!b.active || !b.nextDueDate) return false;
    const days = differenceInDays(new Date(b.nextDueDate), today);
    return days >= 0 && days <= 7;
  });

  const monthlyIncome = transactions.filter(t => t.type === 'income' && t.date.slice(0, 7) === thisMonth).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = transactions.filter(t => t.type === 'expense' && t.date.slice(0, 7) === thisMonth).reduce((s, t) => s + t.amount, 0);
  const monthlyBills = bills.filter(b => b.active).reduce((sum, b) => {
    if (b.frequency === 'monthly') return sum + b.amount;
    if (b.frequency === 'yearly') return sum + b.amount / 12;
    if (b.frequency === 'quarterly') return sum + b.amount / 3;
    if (b.frequency === 'weekly') return sum + b.amount * 4.33;
    return sum;
  }, 0);
  const monthlySubs = subs.filter(s => s.active).reduce((sum, s) => {
    if (s.frequency === 'monthly') return sum + s.amount;
    if (s.frequency === 'yearly') return sum + s.amount / 12;
    if (s.frequency === 'weekly') return sum + s.amount * 4.33;
    return sum;
  }, 0);
  const netThisMonth = monthlyIncome - monthlyExpenses - monthlyBills - monthlySubs;

  // ── Build alert cards
  const alerts: AlertItem[] = [];

  if (todayEvents.length > 0) {
    const first = todayEvents[0];
    alerts.push({ id: 'events', emoji: '📅', view: 'calendar', accent: 'blue',
      label: `${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today`,
      sub: first.title + (first.time ? ` at ${first.time}` : '') + (todayEvents.length > 1 ? ` +${todayEvents.length - 1} more` : ''),
    });
  }

  if (urgentTodos.length > 0) {
    alerts.push({ id: 'urgent', emoji: '🚨', view: 'todo', accent: 'red',
      label: `${urgentTodos.length} urgent task${urgentTodos.length > 1 ? 's' : ''}`,
      sub: urgentTodos[0].text + (urgentTodos.length > 1 ? ` +${urgentTodos.length - 1} more` : ''),
    });
  } else if (overdueTodos.length > 0) {
    alerts.push({ id: 'overdue', emoji: '⏰', view: 'todo', accent: 'orange',
      label: `${overdueTodos.length} overdue task${overdueTodos.length > 1 ? 's' : ''}`,
      sub: overdueTodos[0].text,
    });
  }

  if (expiringSoon.length > 0) {
    alerts.push({ id: 'expiry', emoji: '⚠️', view: 'fridge', accent: 'amber',
      label: `${expiringSoon.length} item${expiringSoon.length > 1 ? 's' : ''} expiring soon`,
      sub: expiringSoon.map(i => i.name).slice(0, 2).join(', ') + (expiringSoon.length > 2 ? '...' : ''),
    });
  }

  if (billsDueSoon.length > 0) {
    const first = billsDueSoon[0];
    const days = differenceInDays(new Date(first.nextDueDate), today);
    alerts.push({ id: 'bills', emoji: '💳', view: 'finance', accent: 'slate',
      label: `${billsDueSoon.length} bill${billsDueSoon.length > 1 ? 's' : ''} due soon`,
      sub: `${first.name} ${days === 0 ? 'today' : `in ${days} day${days > 1 ? 's' : ''}`}`,
    });
  }

  if (uncheckedShopping.length > 0) {
    alerts.push({ id: 'shopping', emoji: '🛒', view: 'shopping', accent: 'orange',
      label: `${uncheckedShopping.length} item${uncheckedShopping.length > 1 ? 's' : ''} to buy`,
      sub: uncheckedShopping.slice(0, 3).map(i => i.name).join(', ') + (uncheckedShopping.length > 3 ? '...' : ''),
    });
  }

  if (monthlyIncome > 0) {
    alerts.push({ id: 'finance', emoji: netThisMonth >= 0 ? '📈' : '📉', view: 'finance', accent: netThisMonth >= 0 ? 'emerald' : 'red',
      label: netThisMonth >= 0 ? `£${netThisMonth.toFixed(0)} left this month` : `£${Math.abs(netThisMonth).toFixed(0)} over budget`,
      sub: `Income £${monthlyIncome.toFixed(0)} · Out £${(monthlyExpenses + monthlyBills + monthlySubs).toFixed(0)}`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({ id: 'clear', emoji: '✨', view: 'dashboard', accent: 'green',
      label: 'All clear!',
      sub: 'No urgent items. Enjoy your day.',
    });
  }

  // ── Bubble subtitles
  const bubbleSubtitle: Record<View, string> = {
    dashboard: '',
    calendar: todayEvents.length > 0 ? `${todayEvents.length} today` : 'No events today',
    todo: todos.filter(t => !t.completed).length > 0 ? `${todos.filter(t => !t.completed).length} pending` : 'All done ✓',
    shopping: uncheckedShopping.length > 0 ? `${uncheckedShopping.length} items` : 'List is clear',
    finance: `£${(monthlyBills + monthlySubs).toFixed(0)}/mo committed`,
    fridge: fridge.length > 0 ? `${fridge.length} items stocked` : 'Empty',
    recipes: fridge.length > 0 ? 'Find what to cook' : 'Add ingredients first',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Hero header */}
      <div className="bg-gray-900 px-5 pt-12 pb-14">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 dark:text-gray-500 text-sm font-medium tracking-wide">
            {format(today, 'EEEE, d MMMM yyyy')}
          </p>
          <button
            onClick={onOpenAchievements}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all font-medium"
          >
            🏆 Achievements
          </button>
        </div>
        <h1 className="text-white text-3xl font-bold mt-1">
          Good {getTimeOfDay()} 👋
        </h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Here's what's on today.</p>
      </div>

      {/* ── Alert strip — overlaps hero with -mt */}
      <div className="px-4 -mt-6 mb-5">
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {alerts.map(a => (
            <AlertCard key={a.id} alert={a} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      {/* ── Section bubbles */}
      <div className="px-4 pb-10">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Your home</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTIONS.map(s => (
            <button
              key={s.view}
              onClick={() => onNavigate(s.view)}
              className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-3xl p-5 flex flex-col items-center justify-center gap-2.5 shadow-md shadow-gray-900/20 active:scale-95 transition-all duration-150 aspect-square"
            >
              <span className="text-4xl leading-none">{s.emoji}</span>
              <span className="text-white font-bold text-sm text-center leading-tight">{s.label}</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs text-center leading-snug">{bubbleSubtitle[s.view]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
