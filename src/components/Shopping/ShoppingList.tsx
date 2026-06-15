import { useState } from 'react';
import { Plus, X, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { ShoppingItem, FridgeItem, Transaction } from '../../types';

function generateId() { return Math.random().toString(36).slice(2); }

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Drinks', 'Snacks', 'Cleaning', 'Personal Care', 'Other'];

const CATEGORY_COLORS: Record<string, string> = {
  Produce: 'bg-green-100 text-green-700', Dairy: 'bg-blue-100 text-blue-700',
  Meat: 'bg-red-100 text-red-700', Bakery: 'bg-amber-100 text-amber-700',
  Frozen: 'bg-sky-100 text-sky-700', Pantry: 'bg-orange-100 text-orange-700',
  Drinks: 'bg-purple-100 text-purple-700', Snacks: 'bg-yellow-100 text-yellow-700',
  Cleaning: 'bg-teal-100 text-teal-700', 'Personal Care': 'bg-pink-100 text-pink-700',
  Other: 'bg-gray-100 text-gray-700',
};

// Maps shopping category → fridge/cupboard storage info, null = don't add to fridge
const SHOPPING_TO_STORAGE: Record<string, { location: 'fridge' | 'cupboard'; fridgeCategory: string } | null> = {
  Produce: { location: 'fridge', fridgeCategory: 'Vegetables' },
  Dairy: { location: 'fridge', fridgeCategory: 'Dairy' },
  Meat: { location: 'fridge', fridgeCategory: 'Meat & Fish' },
  Frozen: { location: 'fridge', fridgeCategory: 'Other' },
  Bakery: { location: 'cupboard', fridgeCategory: 'Grains & Pasta' },
  Pantry: { location: 'cupboard', fridgeCategory: 'Grains & Pasta' },
  Drinks: { location: 'cupboard', fridgeCategory: 'Other' },
  Snacks: { location: 'cupboard', fridgeCategory: 'Other' },
  Cleaning: null,
  'Personal Care': null,
  Other: { location: 'cupboard', fridgeCategory: 'Other' },
};

export function ShoppingList() {
  const [items, setItems] = useLocalStorage<ShoppingItem[]>('shopping-items', []);
  const [, setFridgeItems] = useLocalStorage<FridgeItem[]>('fridge-items', []);
  const [, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [form, setForm] = useState({ name: '', quantity: '1', category: 'Produce' });
  const [showForm, setShowForm] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [shopCost, setShopCost] = useState('');
  const [shopDescription, setShopDescription] = useState('Weekly shop');
  const [completed, setCompleted] = useState(false);

  const addItem = () => {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { id: generateId(), name: form.name, quantity: form.quantity, category: form.category, checked: false, addedAt: new Date().toISOString() }]);
    setForm(f => ({ ...f, name: '', quantity: '1' }));
  };

  const toggle = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearChecked = () => setItems(prev => prev.filter(i => !i.checked));

  const completeShop = () => {
    const cost = parseFloat(shopCost);
    if (!cost || cost <= 0) return;

    const checkedItems = items.filter(i => i.checked);

    // Add finance transaction
    setTransactions(prev => [...prev, {
      id: generateId(),
      description: shopDescription || 'Grocery shop',
      amount: cost,
      type: 'expense',
      category: 'Groceries',
      date: new Date().toISOString().slice(0, 10),
    }]);

    // Add to fridge/cupboard
    const newFridgeItems: FridgeItem[] = checkedItems
      .map(item => {
        const storage = SHOPPING_TO_STORAGE[item.category];
        if (!storage) return null;
        return {
          id: generateId(),
          name: item.name,
          category: storage.fridgeCategory,
          quantity: item.quantity,
          location: storage.location,
        } as FridgeItem;
      })
      .filter((item): item is FridgeItem => item !== null);

    if (newFridgeItems.length > 0) {
      setFridgeItems(prev => [...prev, ...newFridgeItems]);
    }

    // Clear checked items
    setItems(prev => prev.filter(i => !i.checked));
    setCompleted(true);
    setShopCost('');
  };

  const closeModal = () => {
    setShowCompleteModal(false);
    setCompleted(false);
    setShopCost('');
    setShopDescription('Weekly shop');
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat && (catFilter === 'all' || catFilter === cat));
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const unchecked = items.filter(i => !i.checked).length;
  const checked = items.filter(i => i.checked).length;
  const checkedItems = items.filter(i => i.checked);

  // Preview for modal
  const goingToFridge = checkedItems.filter(i => SHOPPING_TO_STORAGE[i.category]?.location === 'fridge');
  const goingToCupboard = checkedItems.filter(i => SHOPPING_TO_STORAGE[i.category]?.location === 'cupboard');
  const beingSkipped = checkedItems.filter(i => SHOPPING_TO_STORAGE[i.category] === null);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shopping List</h2>
          <p className="text-sm text-gray-500 mt-1">{unchecked} items to get · {checked} ticked off</p>
        </div>
        <div className="flex gap-2">
          {checked > 0 && (
            <>
              <button onClick={() => { setShowCompleteModal(true); setCompleted(false); }}
                className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-2 rounded-xl hover:bg-green-700 font-medium">
                <CheckCircle size={15} /> Complete Shop
              </button>
              <button onClick={clearChecked} className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50">
                <Trash2 size={14} /> Clear done
              </button>
            </>
          )}
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 font-medium text-sm">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex gap-2 mb-3">
            <input autoFocus placeholder="Item name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input placeholder="Qty" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              className="w-20 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
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
        {['Milk', 'Eggs', 'Bread', 'Butter', 'Apples', 'Pasta', 'Rice', 'Chicken'].map(name => {
          const cat = { Milk: 'Dairy', Eggs: 'Dairy', Bread: 'Bakery', Butter: 'Dairy', Apples: 'Produce', Pasta: 'Pantry', Rice: 'Pantry', Chicken: 'Meat' }[name]!;
          return (
            <button key={name} onClick={() => setItems(prev => [...prev, { id: generateId(), name, quantity: '1', category: cat, checked: false, addedAt: new Date().toISOString() }])}
              className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all">
              + {name}
            </button>
          );
        })}
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

      {/* Items */}
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
          ))}
        </div>
      )}

      {/* Complete Shop Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {completed ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Shop complete! 🎉</h3>
                <p className="text-gray-500 text-sm mb-1">Transaction added to Finance.</p>
                {goingToFridge.length + goingToCupboard.length > 0 && (
                  <p className="text-gray-500 text-sm">{goingToFridge.length + goingToCupboard.length} items added to your Fridge & Cupboard.</p>
                )}
                <button onClick={closeModal} className="mt-6 bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700 w-full">Done</button>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Complete Your Shop</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {checked} items ticked off · enter the total cost to finish
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Cost input */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Total cost</label>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-400">
                      <span className="px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-gray-500 text-sm font-medium">£</span>
                      <input
                        autoFocus
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={shopCost}
                        onChange={e => setShopCost(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && parseFloat(shopCost) > 0 && completeShop()}
                        className="flex-1 px-3 py-2.5 text-sm focus:outline-none text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
                    <input value={shopDescription} onChange={e => setShopDescription(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm max-h-48 overflow-y-auto">
                    {goingToFridge.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">→ Fridge ({goingToFridge.length})</p>
                        {goingToFridge.map(i => <p key={i.id} className="text-gray-600 py-0.5">🧊 {i.name} <span className="text-gray-400">({i.quantity})</span></p>)}
                      </div>
                    )}
                    {goingToCupboard.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 mt-2">→ Cupboard ({goingToCupboard.length})</p>
                        {goingToCupboard.map(i => <p key={i.id} className="text-gray-600 py-0.5">🗄️ {i.name} <span className="text-gray-400">({i.quantity})</span></p>)}
                      </div>
                    )}
                    {beingSkipped.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 mt-2">Not added to fridge ({beingSkipped.length})</p>
                        {beingSkipped.map(i => <p key={i.id} className="text-gray-400 py-0.5 line-through">{i.name}</p>)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex gap-2">
                  <button
                    onClick={completeShop}
                    disabled={!shopCost || parseFloat(shopCost) <= 0}
                    className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${!shopCost || parseFloat(shopCost) <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  >
                    Complete & Save (£{parseFloat(shopCost || '0').toFixed(2)})
                  </button>
                  <button onClick={closeModal} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
