import { useState, useEffect } from 'react';
import { Plus, X, Search, ShoppingCart, AlertCircle } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { FridgeItem, ShoppingItem } from '../../types';

function generateId() { return Math.random().toString(36).slice(2); }

const FRIDGE_CATEGORIES = ['Vegetables', 'Fruit', 'Meat & Fish', 'Dairy', 'Eggs', 'Grains & Pasta', 'Condiments', 'Leftovers', 'Other'];

const FRIDGE_TO_SHOPPING_CATEGORY: Record<string, string> = {
  Vegetables: 'Produce', Fruit: 'Produce', 'Meat & Fish': 'Meat',
  Dairy: 'Dairy', Eggs: 'Dairy', 'Grains & Pasta': 'Pantry',
  Condiments: 'Pantry', Leftovers: 'Other', Other: 'Other',
};

const COMMON_ITEMS: { name: string; category: string; location: 'fridge' | 'cupboard' }[] = [
  { name: 'Chicken breast', category: 'Meat & Fish', location: 'fridge' },
  { name: 'Eggs', category: 'Eggs', location: 'fridge' },
  { name: 'Milk', category: 'Dairy', location: 'fridge' },
  { name: 'Cheddar', category: 'Dairy', location: 'fridge' },
  { name: 'Butter', category: 'Dairy', location: 'fridge' },
  { name: 'Garlic', category: 'Vegetables', location: 'fridge' },
  { name: 'Onion', category: 'Vegetables', location: 'cupboard' },
  { name: 'Tomatoes', category: 'Vegetables', location: 'fridge' },
  { name: 'Carrots', category: 'Vegetables', location: 'fridge' },
  { name: 'Spinach', category: 'Vegetables', location: 'fridge' },
  { name: 'Mushrooms', category: 'Vegetables', location: 'fridge' },
  { name: 'Peppers', category: 'Vegetables', location: 'fridge' },
  { name: 'Salmon', category: 'Meat & Fish', location: 'fridge' },
  { name: 'Beef mince', category: 'Meat & Fish', location: 'fridge' },
  { name: 'Yogurt', category: 'Dairy', location: 'fridge' },
  { name: 'Lemon', category: 'Fruit', location: 'fridge' },
  { name: 'Pasta', category: 'Grains & Pasta', location: 'cupboard' },
  { name: 'Rice', category: 'Grains & Pasta', location: 'cupboard' },
  { name: 'Potatoes', category: 'Vegetables', location: 'cupboard' },
  { name: 'Tinned tomatoes', category: 'Condiments', location: 'cupboard' },
  { name: 'Olive oil', category: 'Condiments', location: 'cupboard' },
  { name: 'Flour', category: 'Grains & Pasta', location: 'cupboard' },
  { name: 'Broccoli', category: 'Vegetables', location: 'fridge' },
];

export function FridgeCupboard() {
  const [items, setItems] = useLocalStorage<FridgeItem[]>('fridge-items', []);
  const [, setShoppingItems] = useLocalStorage<ShoppingItem[]>('shopping-items', []);
  const [locationFilter, setLocationFilter] = useState<'fridge' | 'cupboard'>('fridge');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Vegetables', quantity: '', expiryDate: '', location: 'fridge' as 'fridge' | 'cupboard' });

  // Migrate old items without location field
  useEffect(() => {
    setItems(prev => prev.map(item => item.location ? item : { ...item, location: 'fridge' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = () => {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { id: generateId(), name: form.name, category: form.category, quantity: form.quantity, location: form.location, expiryDate: form.expiryDate }]);
    setForm(f => ({ ...f, name: '', quantity: '', expiryDate: '' }));
  };

  const addCommon = (item: typeof COMMON_ITEMS[0]) => {
    if (items.some(i => i.name.toLowerCase() === item.name.toLowerCase())) return;
    setItems(prev => [...prev, { id: generateId(), name: item.name, category: item.category, quantity: '', location: item.location }]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const addToShoppingList = (item: FridgeItem) => {
    const shoppingCat = FRIDGE_TO_SHOPPING_CATEGORY[item.category] || 'Other';
    setShoppingItems(prev => {
      if (prev.some(s => s.name.toLowerCase() === item.name.toLowerCase() && !s.checked)) return prev;
      return [...prev, { id: generateId(), name: item.name, quantity: item.quantity || '1', category: shoppingCat, checked: false, addedAt: new Date().toISOString() }];
    });
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const days = (new Date(date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 3;
  };
  const isExpired = (date?: string) => !!date && new Date(date).getTime() < Date.now();

  const locationItems = items.filter(i => (i.location ?? 'fridge') === locationFilter);
  const filteredItems = locationItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const fridgeCount = items.filter(i => (i.location ?? 'fridge') === 'fridge').length;
  const cupboardCount = items.filter(i => (i.location ?? 'fridge') === 'cupboard').length;
  const expiringCount = items.filter(i => isExpiringSoon(i.expiryDate) && !isExpired(i.expiryDate)).length;

  const commonForLocation = COMMON_ITEMS.filter(i => i.location === locationFilter);

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4">
      {/* Main panel */}
      <div className="flex-1">
        {/* Location toggle */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button onClick={() => { setLocationFilter('fridge'); setForm(f => ({ ...f, location: 'fridge' })); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${locationFilter === 'fridge' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              🧊 Fridge <span className="ml-1 text-xs text-gray-400">({fridgeCount})</span>
            </button>
            <button onClick={() => { setLocationFilter('cupboard'); setForm(f => ({ ...f, location: 'cupboard' })); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${locationFilter === 'cupboard' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              🗄️ Cupboard <span className="ml-1 text-xs text-gray-400">({cupboardCount})</span>
            </button>
          </div>
          {expiringCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <AlertCircle size={14} />
              {expiringCount} item{expiringCount > 1 ? 's' : ''} expiring soon
            </div>
          )}
        </div>

        {/* Search + add */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={`Search ${locationFilter}...`}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white" />
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2.5 rounded-xl hover:bg-sky-700 font-semibold text-sm whitespace-nowrap">
            <Plus size={16} /> Add Item
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white border border-sky-200 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
            <div className="flex gap-2">
              <input autoFocus placeholder="Item name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              <input placeholder="Qty (e.g. 2)" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-28 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                {FRIDGE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value as 'fridge' | 'cupboard' }))}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                <option value="fridge">🧊 Fridge</option>
                <option value="cupboard">🗄️ Cupboard</option>
              </select>
              {form.location === 'fridge' && (
                <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none" title="Use-by date" />
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={addItem} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Add</button>
              <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        )}

        {/* Items grouped by category */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-5xl">{locationFilter === 'fridge' ? '🧊' : '🗄️'}</span>
            <p className="mt-3 text-sm">Your {locationFilter} is empty. Add items above or use quick-add on the right.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {FRIDGE_CATEGORIES.map(cat => {
              const catItems = filteredItems.filter(i => i.category === cat);
              if (!catItems.length) return null;
              return (
                <div key={cat} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {cat} <span className="text-gray-300 font-normal normal-case">({catItems.length})</span>
                  </div>
                  {catItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{item.name}</span>
                          {item.quantity && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{item.quantity}</span>}
                          {isExpired(item.expiryDate) && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Expired</span>}
                          {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">Expiring soon</span>}
                        </div>
                        {item.expiryDate && <p className="text-xs text-gray-400 mt-0.5">Use by {item.expiryDate}</p>}
                      </div>
                      {/* Add to shopping list */}
                      <button
                        onClick={() => addToShoppingList(item)}
                        title="Add to shopping list"
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-all px-2 py-1 rounded-lg hover:bg-orange-50"
                      >
                        <ShoppingCart size={13} /> Add to list
                      </button>
                      <button onClick={() => removeItem(item.id)} title="Remove item"
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick-add sidebar */}
      <div className="w-full sm:w-56 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sticky top-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Quick add to {locationFilter}
          </p>
          <div className="space-y-1">
            {commonForLocation.map(item => {
              const inStock = items.some(i => i.name.toLowerCase() === item.name.toLowerCase());
              return (
                <button key={item.name} onClick={() => addCommon(item)} disabled={inStock}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${inStock ? 'text-sky-600 bg-sky-50 cursor-default' : 'text-gray-700 hover:bg-gray-50 hover:text-sky-700'}`}>
                  {inStock ? '✓ ' : '+ '}{item.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
