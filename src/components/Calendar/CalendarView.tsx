import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { triggerAchievementCheck } from '../../achievements/definitions';
import type { CalendarEvent } from '../../types';

const EVENT_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function generateId() {
  return Math.random().toString(36).slice(2);
}

export function CalendarView() {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('calendar-events', []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', time: '', description: '', color: EVENT_COLORS[0] });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsOnDay = (date: Date) =>
    events.filter(e => isSameDay(parseISO(e.date), date));

  const addEvent = () => {
    if (!form.title.trim() || !selectedDate) return;
    const newEvent: CalendarEvent = {
      id: generateId(),
      title: form.title,
      date: selectedDate,
      time: form.time,
      description: form.description,
      color: form.color,
    };
    setEvents(prev => [...prev, newEvent]);
    setForm({ title: '', time: '', description: '', color: EVENT_COLORS[0] });
    setShowForm(false);
    triggerAchievementCheck();
  };

  const removeEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));

  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  return (
    <div className="flex flex-col sm:flex-row gap-4 h-full">
      <div className="flex-1">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 font-medium"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dayEvents = eventsOnDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dateStr = format(day, 'yyyy-MM-dd');
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`min-h-[80px] p-1.5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'border-gray-900 bg-gray-50'
                    : isToday
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-gray-900 text-white' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map(ev => (
                    <div
                      key={ev.id}
                      className="text-xs px-1.5 py-0.5 rounded-md truncate text-white font-medium"
                      style={{ backgroundColor: ev.color }}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full sm:w-72 flex flex-col gap-4 flex-shrink-0">
        {selectedDate && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {format(parseISO(selectedDate), 'EEE, MMM d')}
              </h3>
              <button
                onClick={() => { setShowForm(true); }}
                className="flex items-center gap-1 text-xs bg-gray-900 text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-700"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {showForm && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-2">
                <input
                  autoFocus
                  placeholder="Event title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <input
                  placeholder="Notes (optional)"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <div className="flex gap-1.5">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={addEvent} className="flex-1 bg-gray-900 text-white text-sm py-1.5 rounded-lg hover:bg-gray-700">
                    Save
                  </button>
                  <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-700 text-sm py-1.5 rounded-lg hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedEvents.length === 0 && !showForm && (
              <p className="text-sm text-gray-400 text-center py-4">No events. Click Add!</p>
            )}

            <div className="space-y-2">
              {selectedEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50 group">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                    {ev.time && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />{ev.time}
                      </p>
                    )}
                    {ev.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{ev.description}</p>}
                  </div>
                  <button onClick={() => removeEvent(ev.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming events */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Upcoming</h3>
          {events
            .filter(e => parseISO(e.date) >= new Date(new Date().setHours(0,0,0,0)))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5)
            .map(ev => (
              <div key={ev.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-400">{format(parseISO(ev.date), 'MMM d')}{ev.time ? ` · ${ev.time}` : ''}</p>
                </div>
              </div>
            ))}
          {events.filter(e => parseISO(e.date) >= new Date()).length === 0 && (
            <p className="text-sm text-gray-400">No upcoming events</p>
          )}
        </div>
      </div>
    </div>
  );
}
