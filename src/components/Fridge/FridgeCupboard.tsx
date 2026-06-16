import { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, AlertCircle, ScanLine, Loader2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { triggerAchievementCheck } from '../../achievements/definitions';
import { lazy, Suspense } from 'react';
const BarcodeScanner = lazy(() => import('./BarcodeScanner').then(m => ({ default: m.BarcodeScanner })));
import type { FridgeItem, ShoppingItem } from '../../types';

function generateId() { return Math.random().toString(36).slice(2); }

function mapOFFCategory(tags: string[]): string {
  const t = tags.join(' ');
  if (/meat|beef|chicken|poultry|pork|lamb|sausage/.test(t)) return 'Meat & Fish';
  if (/fish|seafood|salmon|tuna|prawn/.test(t)) return 'Meat & Fish';
  if (/egg/.test(t)) return 'Eggs';
  if (/dairy|milk|cream|cheese|yogurt|butter/.test(t)) return 'Dairy';
  if (/vegetable|salad|carrot|broccoli|spinach|onion|pepper|tomato/.test(t)) return 'Vegetables';
  if (/fruit|apple|banana|berry|lemon|orange/.test(t)) return 'Fruit';
  if (/pasta|rice|cereal|bread|flour|grain|noodle/.test(t)) return 'Grains & Pasta';
  if (/sauce|condiment|oil|vinegar|spice|seasoning/.test(t)) return 'Condiments';
  return 'Other';
}

async function lookupBarcode(barcode: string): Promise<{ name: string; quantity: string; category: string } | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,quantity,categories_tags`
  );
  const data = await res.json();
  if (data.status !== 1) return null;
  const p = data.product;
  return {
    name: p.product_name || '',
    quantity: p.quantity || '',
    category: mapOFFCategory(p.categories_tags || []),
  };
}

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

function ItemEditSheet({ item, onSave, onDelete, onClose, onAddToShoppingList }: {
  item: FridgeItem;
  onSave: (updated: FridgeItem) => void;
  onDelete: () => void;
  onClose: () => void;
  onAddToShoppingList: () => void;
}) {
  const [form, setForm] = useState({
    name: item.name,
    quantity: item.quantity || '',
    category: item.category,
    location: item.location as 'fridge' | 'cupboard',
    expiryDate: item.expiryDate || '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-4 pb-8 space-y-4">
        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Quantity</label>
            <input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="e.g. 2, 500g, 1 pack"
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:placeholder-gray-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Location</label>
            <div className="flex gap-2">
              <button onClick={() => setForm(f => ({ ...f, location: 'fridge' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${form.location === 'fridge' ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                🧊 Fridge
              </button>
              <button onClick={() => setForm(f => ({ ...f, location: 'cupboard' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${form.location === 'cupboard' ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                🗄️ Cupboard
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Expiry / use-by date</label>
            <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300" />
            {form.expiryDate && (
              <button onClick={() => setForm(f => ({ ...f, expiryDate: '' }))}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mt-1">Clear date</button>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 focus:outline-none">
              {FRIDGE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => onSave({ ...item, ...form })}
            className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">
            Save changes
          </button>
          <button onClick={onClose}
            className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { onAddToShoppingList(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:text-orange-600 dark:hover:text-orange-400 dark:hover:border-orange-700 transition-colors">
            <ShoppingCart size={14} /> Add to shopping list
          </button>
          <button onClick={onDelete}
            className="flex-1 py-2.5 rounded-xl text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 transition-colors">
            Remove item
          </button>
        </div>
      </div>
    </div>
  );
}

export function FridgeCupboard() {
  const [items, setItems] = useLocalStorage<FridgeItem[]>('fridge-items', []);
  const [, setShoppingItems] = useLocalStorage<ShoppingItem[]>('shopping-items', []);
  const [locationFilter, setLocationFilter] = useState<'fridge' | 'cupboard'>('fridge');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Vegetables', quantity: '', expiryDate: '', location: 'fridge' as 'fridge' | 'cupboard' });
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  // Migrate old items without location field
  useEffect(() => {
    setItems(prev => prev.map(item => item.location ? item : { ...item, location: 'fridge' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = () => {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { id: generateId(), name: form.name, category: form.category, quantity: form.quantity, location: form.location, expiryDate: form.expiryDate }]);
    setForm(f => ({ ...f, name: '', quantity: '', expiryDate: '' }));
    triggerAchievementCheck();
  };

  const addCommon = (item: typeof COMMON_ITEMS[0]) => {
    if (items.some(i => i.name.toLowerCase() === item.name.toLowerCase())) return;
    setItems(prev => [...prev, { id: generateId(), name: item.name, category: item.category, quantity: '', location: item.location }]);
    triggerAchievementCheck();
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (updated: FridgeItem) => setItems(prev => prev.map(i => i.id === updated.id ? updated : i));

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    setBarcodeLoading(true);
    try {
      const product = await lookupBarcode(barcode);
      if (product && product.name) {
        setForm(f => ({ ...f, name: product.name, quantity: product.quantity, category: product.category }));
      } else {
        setForm(f => ({ ...f, name: '', quantity: '' }));
      }
    } catch {
      setForm(f => ({ ...f, name: '', quantity: '' }));
    } finally {
      setBarcodeLoading(false);
      setShowForm(true);
    }
  };

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
      {editingItem && (
        <ItemEditSheet
          item={editingItem}
          onSave={updated => { updateItem(updated); setEditingItem(null); }}
          onDelete={() => { removeItem(editingItem.id); setEditingItem(null); }}
          onClose={() => setEditingItem(null)}
          onAddToShoppingList={() => addToShoppingList(editingItem)}
        />
      )}
      {showScanner && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <Loader2 size={40} className="text-white animate-spin" />
          </div>
        }>
          <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
        </Suspense>
      )}
      {barcodeLoading && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center gap-4">
          <Loader2 size={40} className="text-white animate-spin" />
          <p className="text-white font-medium">Looking up product…</p>
        </div>
      )}
      {/* Main panel */}
      <div className="flex-1">
        {/* Location toggle */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
            <button onClick={() => { setLocationFilter('fridge'); setForm(f => ({ ...f, location: 'fridge' })); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${locationFilter === 'fridge' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              🧊 Fridge <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({fridgeCount})</span>
            </button>
            <button onClick={() => { setLocationFilter('cupboard'); setForm(f => ({ ...f, location: 'cupboard' })); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${locationFilter === 'cupboard' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              🗄️ Cupboard <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({cupboardCount})</span>
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
          <div className="flex items-center gap-2 flex-1 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 px-3 focus-within:ring-2 focus-within:ring-gray-300">
            <Search size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={`Search ${locationFilter}...`}
              className="flex-1 py-2.5 text-sm focus:outline-none bg-transparent dark:text-white dark:placeholder-gray-500" />
          </div>
          <button onClick={() => setShowScanner(true)}
            title="Scan barcode"
            className="flex items-center justify-center w-11 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
            <ScanLine size={18} />
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-gray-900 text-white pl-3 pr-4 py-2.5 rounded-xl hover:bg-gray-700 font-semibold text-sm whitespace-nowrap">
            <Plus size={15} /> Add Item
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
            <div className="flex gap-2">
              <input autoFocus placeholder="Item name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                className="flex-1 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300" />
              <input placeholder="Qty (e.g. 2)" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-28 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl px-3 py-2.5 focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="flex-1 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 focus:outline-none">
                {FRIDGE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value as 'fridge' | 'cupboard' }))}
                className="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 focus:outline-none">
                <option value="fridge">🧊 Fridge</option>
                <option value="cupboard">🗄️ Cupboard</option>
              </select>
              {form.location === 'fridge' && (
                <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 focus:outline-none" title="Use-by date" />
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={addItem} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">Add</button>
              <button onClick={() => setShowForm(false)} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        )}

        {/* Items grouped by category */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <span className="text-5xl">{locationFilter === 'fridge' ? '🧊' : '🗄️'}</span>
            <p className="mt-3 text-sm">Your {locationFilter} is empty. Add items above or use quick-add on the right.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {FRIDGE_CATEGORIES.map(cat => {
              const catItems = filteredItems.filter(i => i.category === cat);
              if (!catItems.length) return null;
              return (
                <div key={cat} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {cat} <span className="text-gray-300 dark:text-gray-600 font-normal normal-case">({catItems.length})</span>
                  </div>
                  {catItems.map(item => (
                    <button key={item.id} onClick={() => setEditingItem(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 group hover:bg-gray-50/80 dark:hover:bg-gray-700/60 transition-colors text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.name}</span>
                          {item.quantity && <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">{item.quantity}</span>}
                          {isExpired(item.expiryDate) && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">Expired</span>}
                          {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">Expiring soon</span>}
                        </div>
                        {item.expiryDate && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Use by {item.expiryDate}</p>}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); addToShoppingList(item); }}
                        title="Add to shopping list"
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-orange-500 transition-all px-2 py-1 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 flex-shrink-0"
                      >
                        <ShoppingCart size={13} /> Add to list
                      </button>
                      <span className="text-gray-300 dark:text-gray-600 flex-shrink-0 text-xs">›</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick-add sidebar */}
      <div className="w-full sm:w-56 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sticky top-0">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
            Quick add to {locationFilter}
          </p>
          <div className="space-y-1">
            {commonForLocation.map(item => {
              const inStock = items.some(i => i.name.toLowerCase() === item.name.toLowerCase());
              return (
                <button key={item.name} onClick={() => addCommon(item)} disabled={inStock}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${inStock ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 cursor-default' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-sky-700 dark:hover:text-sky-400'}`}>
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
