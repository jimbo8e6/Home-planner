import { Calendar, CheckSquare, ShoppingCart, DollarSign, Refrigerator, ChefHat } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { CalendarEvent, TodoItem, ShoppingItem, Subscription, FridgeItem, View } from '../types';
import { format, parseISO, isTomorrow } from 'date-fns';

interface DashboardProps {
  onNavigate: (view: View) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [events] = useLocalStorage<CalendarEvent[]>('calendar-events', []);
  const [todos] = useLocalStorage<TodoItem[]>('todos', []);
  const [shoppingItems] = useLocalStorage<ShoppingItem[]>('shopping-items', []);
  const [subs] = useLocalStorage<Subscription[]>('subscriptions', []);
  const [fridgeItems] = useLocalStorage<FridgeItem[]>('fridge-items', []);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayEvents = events.filter(e => e.date === todayStr);
  const upcomingEvents = events
    .filter(e => parseISO(e.date) > today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const pendingTodos = todos.filter(t => !t.completed);
  const highPriorityTodos = pendingTodos.filter(t => t.priority === 'high').slice(0, 3);

  const uncheckedShopping = shoppingItems.filter(i => !i.checked).length;

  const activeSubs = subs.filter(s => s.active);
  const monthlySubCost = activeSubs.reduce((sum, s) => {
    if (s.frequency === 'monthly') return sum + s.amount;
    if (s.frequency === 'yearly') return sum + s.amount / 12;
    if (s.frequency === 'weekly') return sum + s.amount * 4.33;
    return sum;
  }, 0);

  const expiringSoon = fridgeItems.filter(i => {
    if (!i.expiryDate) return false;
    const days = (new Date(i.expiryDate).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 3;
  });

  const cards = [
    {
      view: 'calendar' as View,
      icon: <Calendar size={22} />,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      label: 'Calendar',
      stat: todayEvents.length > 0 ? `${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today` : 'No events today',
    },
    {
      view: 'todo' as View,
      icon: <CheckSquare size={22} />,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      label: 'To-Do',
      stat: pendingTodos.length > 0 ? `${pendingTodos.length} task${pendingTodos.length > 1 ? 's' : ''} pending` : 'All done!',
    },
    {
      view: 'shopping' as View,
      icon: <ShoppingCart size={22} />,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      label: 'Shopping',
      stat: uncheckedShopping > 0 ? `${uncheckedShopping} item${uncheckedShopping > 1 ? 's' : ''} to buy` : 'List is clear',
    },
    {
      view: 'finance' as View,
      icon: <DollarSign size={22} />,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      label: 'Finance',
      stat: `£${monthlySubCost.toFixed(2)}/mo in subscriptions`,
    },
    {
      view: 'fridge' as View,
      icon: <Refrigerator size={22} />,
      color: 'bg-sky-500',
      lightColor: 'bg-sky-50',
      textColor: 'text-sky-600',
      label: 'Fridge',
      stat: expiringSoon.length > 0 ? `${expiringSoon.length} item${expiringSoon.length > 1 ? 's' : ''} expiring soon` : `${fridgeItems.length} item${fridgeItems.length !== 1 ? 's' : ''} stocked`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Good {getTimeOfDay()}, let's see what's on today.</h2>
        <p className="text-gray-500 mt-1">{format(today, 'EEEE, MMMM do yyyy')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-4">
        {cards.map(card => (
          <button key={card.view} onClick={() => onNavigate(card.view)}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:shadow-md hover:border-gray-300 transition-all active:scale-95 group">
            <div className={`w-10 h-10 ${card.lightColor} rounded-xl flex items-center justify-center mb-3 ${card.textColor} group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{card.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-1 leading-snug">{card.stat}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Today's events & upcoming */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Today & Upcoming</h3>
            <button onClick={() => onNavigate('calendar')} className="text-xs text-blue-500 hover:text-blue-700">View calendar →</button>
          </div>
          {todayEvents.length === 0 && upcomingEvents.length === 0 && (
            <p className="text-sm text-gray-400">Nothing scheduled. <button onClick={() => onNavigate('calendar')} className="text-blue-500 hover:underline">Add an event</button></p>
          )}
          {todayEvents.map(e => (
            <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{e.title}</p>
                {e.time && <p className="text-xs text-gray-400">{e.time}</p>}
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Today</span>
            </div>
          ))}
          {upcomingEvents.map(e => (
            <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{e.title}</p>
                <p className="text-xs text-gray-400">{format(parseISO(e.date), 'EEE, MMM d')}</p>
              </div>
              {isTomorrow(parseISO(e.date)) && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Tomorrow</span>}
            </div>
          ))}
        </div>

        {/* Priority tasks */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Priority Tasks</h3>
            <button onClick={() => onNavigate('todo')} className="text-xs text-green-500 hover:text-green-700">View all →</button>
          </div>
          {highPriorityTodos.length === 0 && pendingTodos.length === 0 && (
            <div className="text-center py-4">
              <p className="text-2xl mb-1">🎉</p>
              <p className="text-sm text-gray-400">All tasks complete!</p>
            </div>
          )}
          {highPriorityTodos.length === 0 && pendingTodos.length > 0 && (
            <p className="text-sm text-gray-400 mb-3">No high-priority tasks</p>
          )}
          {highPriorityTodos.map(t => (
            <div key={t.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{t.text}</p>
                <p className="text-xs text-gray-400">{t.category}{t.dueDate ? ` · Due ${t.dueDate}` : ''}</p>
              </div>
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full whitespace-nowrap">High</span>
            </div>
          ))}
          {pendingTodos.filter(t => t.priority !== 'high').slice(0, 2).map(t => (
            <div key={t.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0 opacity-70">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-700 truncate">{t.text}</p>
            </div>
          ))}
        </div>

        {/* Fridge alerts */}
        {expiringSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <h3 className="font-semibold text-amber-800">Expiring Soon</h3>
              <button onClick={() => onNavigate('fridge')} className="ml-auto text-xs text-amber-600 hover:text-amber-800">View fridge →</button>
            </div>
            <div className="space-y-2">
              {expiringSoon.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <Refrigerator size={14} className="text-amber-500" />
                  <span className="text-amber-800 font-medium">{item.name}</span>
                  <span className="text-amber-600 ml-auto text-xs">Use by {item.expiryDate}</span>
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate('recipes')} className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">
              <ChefHat size={12} /> Find recipes to use these up
            </button>
          </div>
        )}

        {/* Shopping reminder */}
        {uncheckedShopping > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={18} className="text-orange-500" />
              <h3 className="font-semibold text-orange-800">Shopping List</h3>
              <button onClick={() => onNavigate('shopping')} className="ml-auto text-xs text-orange-600 hover:text-orange-800">View list →</button>
            </div>
            <p className="text-sm text-orange-700">You have <strong>{uncheckedShopping} item{uncheckedShopping > 1 ? 's' : ''}</strong> to pick up.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {shoppingItems.filter(i => !i.checked).slice(0, 6).map(item => (
                <span key={item.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{item.name}</span>
              ))}
              {uncheckedShopping > 6 && <span className="text-xs text-orange-500">+{uncheckedShopping - 6} more</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
