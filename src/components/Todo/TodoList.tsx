import { useState } from 'react';
import { Plus, X, Flag, Calendar, Tag } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { triggerAchievementCheck } from '../../achievements/definitions';
import type { TodoItem } from '../../types';

function generateId() { return Math.random().toString(36).slice(2); }

const PRIORITIES = { high: { label: 'High', color: 'text-red-500', bg: 'bg-red-50 text-red-700' }, medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-50 text-amber-700' }, low: { label: 'Low', color: 'text-blue-500', bg: 'bg-blue-50 text-blue-700' } };
const CATEGORIES = ['Personal', 'Work', 'Home', 'Health', 'Family', 'Other'];

export function TodoList() {
  const [todos, setTodos] = useLocalStorage<TodoItem[]>('todos', []);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: '', priority: 'medium' as TodoItem['priority'], dueDate: '', category: 'Personal' });

  const addTodo = () => {
    if (!form.text.trim()) return;
    setTodos(prev => [{
      id: generateId(),
      text: form.text,
      completed: false,
      priority: form.priority,
      dueDate: form.dueDate,
      category: form.category,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setForm({ text: '', priority: 'medium', dueDate: '', category: 'Personal' });
    setShowForm(false);
  };

  const toggle = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    triggerAchievementCheck();
  };
  const remove = (id: string) => setTodos(prev => prev.filter(t => t.id !== id));

  const filtered = todos
    .filter(t => filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed)
    .filter(t => catFilter === 'all' || t.category === catFilter)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

  const counts = { all: todos.length, active: todos.filter(t => !t.completed).length, done: todos.filter(t => t.completed).length };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">To-Do List</h2>
          <p className="text-sm text-gray-500 mt-1">{counts.active} tasks remaining</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 font-medium text-sm"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
          <input
            autoFocus
            placeholder="What needs to be done?"
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <div className="flex gap-3 flex-wrap">
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TodoItem['priority'] }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              <option value="high">🔴 High priority</option>
              <option value="medium">🟡 Medium priority</option>
              <option value="low">🔵 Low priority</option>
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={addTodo} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">Add Task</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'active', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
            {f} ({counts[f]})
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1" />
        {['all', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${catFilter === c ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CheckmarkIcon />
            <p className="mt-2 text-sm">No tasks here. Add one above!</p>
          </div>
        )}
        {filtered.map(todo => (
          <div key={todo.id} className={`bg-white border rounded-xl px-4 py-3 flex items-start gap-3 group transition-all ${todo.completed ? 'opacity-60 border-gray-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggle(todo.id)}
              className="mt-0.5 w-4 h-4 accent-gray-900 cursor-pointer flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{todo.text}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITIES[todo.priority].bg}`}>
                  <Flag size={10} className="inline mr-1" />{PRIORITIES[todo.priority].label}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Tag size={10} />{todo.category}
                </span>
                {todo.dueDate && (
                  <span className={`text-xs flex items-center gap-1 ${new Date(todo.dueDate) < new Date() && !todo.completed ? 'text-red-500' : 'text-gray-400'}`}>
                    <Calendar size={10} />{todo.dueDate}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => remove(todo.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckmarkIcon() {
  return (
    <svg className="w-12 h-12 mx-auto text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
