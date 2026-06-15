import { useState } from 'react';
import { Plus, X, ShoppingCart, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { ShoppingItem } from '../../types';

function generateId() { return Math.random().toString(36).slice(2); }

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Drinks', 'Snacks', 'Cleaning', 'Personal Care', 'Other'];

const CATEGORY_COLORS: Record<string, string> = {
  Produce: 'bg-green-100 text-green-700',
  Dairy: 'bg-blue-100 text-blue-700',
  Meat: 'bg-red-100 text-red-700',
  Bakery: 'bg-amber-100 text-amber-700',
  Frozen: 'bg-sky-100 text-sky-700',
  Pantry: 'bg-orange-100 text-orange-700',
  Drinks: 'bg-purple-100 text-purple-700',
  Snacks: 'bg-yellow-100 text-yellow-700',
  Cleaning: 'bg-teal-100 text-teal-700',
  'Personal Care': 'bg-pink-100 text-pink-700',
  Other: 'bg-gray-100 text-gray-700',
};

export function ShoppingList() {
  const [items, setItems] = useLocalStorage<ShoppingItem[]>('shopping-items', []);
  const [form, setForm] = useState({ name: '', quantity: '1', category: 'Produce' });
  const [showForm, setShowForm] = useState(false);
  const [catFilter, setCatFilter] = useState('all');

  const addItem = () => {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { id: generateId(), name: form.name, quantity: form.quantity, category: form.category, checked: false, addedAt: new Date().toISOString() }]);
    setForm(f => ({ ...f, name: '', quantity: '1' }));
  };

  const toggle = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearChecked = () => setItems(prev => prev.filter(i => !i.checked));

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat && (catFilter === 'all' || catFilter === cat));
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const unchecked = items.filter(i => !i.checked).length;
  const checked = items.filter(i => i.checked).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shopping List</h2>
          <p className="text-sm text-gray-500 mt-1">{unchecked} items to get · {checked} ticked off</p>
        </div>
        <div className="flex gap-2">
          {checked > 0 && (
            <button onClick={clearChecked} className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50">
              <Trash2 size={14} /> Clear done
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 font-medium text-sm">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex gap-2 mb-3">
            <input
              autoFocus
              placeholder="Item name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              placeholder="Qty"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              className="w-20 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={addItem} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600">Add</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-200">✕</button>
          </div>
        </div>
      )}

      {/* Quick-add common items */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['Milk', 'Eggs', 'Bread', 'Butter', 'Apples', 'Pasta', 'Rice', 'Chicken'].map(item => (
          <button key={item} onClick={() => {
            setItems(prev => [...prev, { id: generateId(), name: item, quantity: '1', category: item === 'Milk' || item === 'Eggs' || item === 'Butter' ? 'Dairy' : item === 'Bread' ? 'Bakery' : item === 'Apples' ? 'Produce' : item === 'Chicken' ? 'Meat' : 'Pantry', checked: false, addedAt: new Date().toISOString() }]);
          }}
            className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all">
            + {item}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', ...CATEGORIES.filter(c => items.some(i => i.category === c))].map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${catFilter === c ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      {/* Items by category */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">Your list is empty. Add some items above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-700'}`}>{cat}</span>
                <span className="text-xs text-gray-400">{catItems.filter(i => !i.checked).length}/{catItems.length}</span>
              </div>
              <div>
                {catItems.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 group ${item.checked ? 'opacity-50' : ''}`}>
                    <input type="checkbox" checked={item.checked} onChange={() => toggle(item.id)} className="w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0" />
                    <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.quantity}</span>
                    <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
