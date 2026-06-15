import { useState, useCallback } from 'react';
import { Plus, X, Search, ChefHat, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { FridgeItem, Recipe } from '../../types';

function generateId() { return Math.random().toString(36).slice(2); }

const FRIDGE_CATEGORIES = ['Vegetables', 'Fruit', 'Meat & Fish', 'Dairy', 'Eggs', 'Grains & Pasta', 'Condiments', 'Leftovers', 'Other'];

const COMMON_ITEMS: { name: string; category: string }[] = [
  { name: 'Chicken breast', category: 'Meat & Fish' },
  { name: 'Eggs', category: 'Eggs' },
  { name: 'Milk', category: 'Dairy' },
  { name: 'Cheddar', category: 'Dairy' },
  { name: 'Butter', category: 'Dairy' },
  { name: 'Garlic', category: 'Vegetables' },
  { name: 'Onion', category: 'Vegetables' },
  { name: 'Tomatoes', category: 'Vegetables' },
  { name: 'Carrots', category: 'Vegetables' },
  { name: 'Spinach', category: 'Vegetables' },
  { name: 'Broccoli', category: 'Vegetables' },
  { name: 'Pasta', category: 'Grains & Pasta' },
  { name: 'Rice', category: 'Grains & Pasta' },
  { name: 'Lemon', category: 'Fruit' },
  { name: 'Salmon', category: 'Meat & Fish' },
  { name: 'Beef mince', category: 'Meat & Fish' },
  { name: 'Yogurt', category: 'Dairy' },
  { name: 'Potatoes', category: 'Vegetables' },
  { name: 'Mushrooms', category: 'Vegetables' },
  { name: 'Peppers', category: 'Vegetables' },
];

// Map fridge items to MealDB search terms
function itemToSearchTerms(itemName: string): string[] {
  const name = itemName.toLowerCase();
  const mapping: Record<string, string[]> = {
    'chicken breast': ['Chicken', 'chicken'],
    'chicken': ['Chicken'],
    'beef mince': ['Beef', 'beef'],
    'beef': ['Beef'],
    'salmon': ['Salmon', 'salmon'],
    'eggs': ['Eggs', 'egg'],
    'pasta': ['Pasta', 'pasta', 'Spaghetti'],
    'rice': ['Rice', 'rice'],
    'tomatoes': ['Tomato', 'tomato'],
    'potatoes': ['Potato', 'potato'],
    'mushrooms': ['Mushroom', 'mushroom'],
    'spinach': ['Spinach'],
    'broccoli': ['Broccoli'],
    'onion': ['Onion', 'onion'],
    'garlic': ['Garlic'],
    'lemon': ['Lemon'],
    'carrots': ['Carrot'],
    'peppers': ['Pepper'],
    'butter': ['Butter'],
    'milk': ['Milk'],
    'cheddar': ['Cheese', 'cheddar'],
    'cheese': ['Cheese'],
  };
  for (const [key, terms] of Object.entries(mapping)) {
    if (name.includes(key)) return terms;
  }
  return [itemName.split(' ')[0]];
}

export function FridgeChecker() {
  const [items, setItems] = useLocalStorage<FridgeItem[]>('fridge-items', []);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [form, setForm] = useState({ name: '', category: 'Vegetables', quantity: '', expiryDate: '' });
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const addItem = () => {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { id: generateId(), name: form.name, category: form.category, quantity: form.quantity, expiryDate: form.expiryDate }]);
    setForm(f => ({ ...f, name: '', quantity: '', expiryDate: '' }));
  };

  const addCommon = (item: { name: string; category: string }) => {
    if (items.some(i => i.name.toLowerCase() === item.name.toLowerCase())) return;
    setItems(prev => [...prev, { id: generateId(), name: item.name, category: item.category, quantity: '', expiryDate: '' }]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const findRecipes = useCallback(async () => {
    if (items.length === 0) return;
    setLoading(true);
    setSearched(true);
    setError('');
    setRecipes([]);

    try {
      const searchTerms = items.flatMap(i => itemToSearchTerms(i.name));
      const uniqueTerms = [...new Set(searchTerms)].slice(0, 5);

      const results = await Promise.all(
        uniqueTerms.map(term =>
          fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`)
            .then(r => r.json())
            .then((d: { meals: Recipe[] | null }) => d.meals || [])
            .catch(() => [] as Recipe[])
        )
      );

      const allRecipes = results.flat();
      const seen = new Set<string>();
      const unique = allRecipes.filter(r => {
        if (seen.has(r.idMeal)) return false;
        seen.add(r.idMeal);
        return true;
      });

      // Score recipes by how many fridge items they use
      const fridgeIngredients = items.map(i => i.name.toLowerCase());
      const scored = unique.map(r => {
        const ingredients = Array.from({ length: 20 }, (_, i) => r[`strIngredient${i + 1}`] || '')
          .filter(Boolean)
          .map(s => s.toLowerCase());
        const matches = fridgeIngredients.filter(fi => ingredients.some(ing => ing.includes(fi.split(' ')[0]) || fi.includes(ing.split(' ')[0])));
        return { recipe: r, score: matches.length };
      });

      scored.sort((a, b) => b.score - a.score);
      setRecipes(scored.slice(0, 12).map(s => s.recipe));
    } catch {
      setError('Could not fetch recipes. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [items]);

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const days = (new Date(date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 3;
  };
  const isExpired = (date?: string) => {
    if (!date) return false;
    return new Date(date).getTime() < Date.now();
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Fridge inventory */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">In the Fridge</h3>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1 text-xs bg-sky-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-sky-700">
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search items..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
          </div>

          {showForm && (
            <div className="p-3 bg-sky-50 border-b border-sky-100 space-y-2">
              <input autoFocus placeholder="Item name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              <div className="flex gap-2">
                <input placeholder="Qty (e.g. 2)" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
                <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" placeholder="Expiry" />
              </div>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
                {FRIDGE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={addItem} className="flex-1 bg-sky-600 text-white text-sm py-1.5 rounded-lg hover:bg-sky-700">Add</button>
                <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-700 text-sm py-1.5 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          )}

          {/* Common items quick-add */}
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick add</p>
            <div className="flex flex-wrap gap-1">
              {COMMON_ITEMS.map(item => {
                const inFridge = items.some(i => i.name.toLowerCase() === item.name.toLowerCase());
                return (
                  <button key={item.name} onClick={() => addCommon(item)} disabled={inFridge}
                    className={`text-xs px-2 py-1 rounded-full transition-all ${inFridge ? 'bg-sky-100 text-sky-600 cursor-default' : 'bg-gray-100 text-gray-600 hover:bg-sky-100 hover:text-sky-700'}`}>
                    {inFridge ? '✓ ' : '+ '}{item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item list */}
          <div className="max-h-80 overflow-y-auto">
            {filteredItems.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Your fridge is empty!</p>
            )}
            {FRIDGE_CATEGORIES.map(cat => {
              const catItems = filteredItems.filter(i => i.category === cat);
              if (!catItems.length) return null;
              return (
                <div key={cat}>
                  <div className="px-4 py-1.5 bg-gray-50 text-xs font-medium text-gray-500 sticky top-0">{cat}</div>
                  {catItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-800 truncate">{item.name}</span>
                          {item.quantity && <span className="text-xs text-gray-400">({item.quantity})</span>}
                          {isExpired(item.expiryDate) && <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded-full">Expired</span>}
                          {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 rounded-full">Soon</span>}
                        </div>
                        {item.expiryDate && <p className="text-xs text-gray-400">Use by {item.expiryDate}</p>}
                      </div>
                      <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-gray-100">
            <button onClick={findRecipes} disabled={loading || items.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${items.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-sky-600 text-white hover:bg-sky-700 active:scale-95'}`}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ChefHat size={16} />}
              {loading ? 'Finding recipes...' : `Find Recipes (${items.length} item${items.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Recipe suggestions */}
      <div className="flex-1 min-w-0">
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <ChefHat size={64} className="text-sky-200 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">What can I cook?</h3>
            <p className="text-gray-400 max-w-sm">Add ingredients from your fridge on the left, then click <strong>Find Recipes</strong> to discover meals you can make right now.</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <Loader2 size={48} className="text-sky-400 animate-spin mb-4" />
            <p className="text-gray-500">Searching for recipes...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {searched && !loading && recipes.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-gray-400">No recipes found for your current ingredients. Try adding more items!</p>
          </div>
        )}

        {recipes.length > 0 && !selected && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{recipes.length} recipes you can make</h3>
              <p className="text-sm text-gray-400">Based on {items.length} ingredients</p>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {recipes.map(recipe => (
                <button key={recipe.idMeal} onClick={() => setSelected(recipe)}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-sky-200 transition-all text-left group">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <span className="text-xs bg-white/90 text-gray-700 px-2 py-0.5 rounded-full font-medium">{recipe.strCategory}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-800 text-sm line-clamp-2 leading-snug">{recipe.strMeal}</p>
                    <p className="text-xs text-gray-400 mt-1">{recipe.strArea}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {selected && (
          <RecipeDetail recipe={selected} onBack={() => setSelected(null)} fridgeItems={items.map(i => i.name)} />
        )}
      </div>
    </div>
  );
}

function RecipeDetail({ recipe, onBack, fridgeItems }: { recipe: Recipe; onBack: () => void; fridgeItems: string[] }) {
  const ingredients = Array.from({ length: 20 }, (_, i) => ({
    ingredient: recipe[`strIngredient${i + 1}`] || '',
    measure: recipe[`strMeasure${i + 1}`] || '',
  })).filter(item => item.ingredient.trim());

  const hasIngredient = (ingredient: string) =>
    fridgeItems.some(fi => fi.toLowerCase().includes(ingredient.toLowerCase().split(' ')[0]) || ingredient.toLowerCase().includes(fi.toLowerCase().split(' ')[0]));

  const instructions = recipe.strInstructions?.split('\n').filter(Boolean) || [];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        ← Back to recipes
      </button>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="relative h-56 overflow-hidden">
          <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{recipe.strMeal}</h2>
              <p className="text-white/70 text-sm mt-1">{recipe.strCategory} · {recipe.strArea}</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Ingredients</h3>
            <div className="space-y-2">
              {ingredients.map(({ ingredient, measure }) => (
                <div key={ingredient} className={`flex items-center gap-2 text-sm ${hasIngredient(ingredient) ? '' : 'opacity-50'}`}>
                  <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${hasIngredient(ingredient) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {hasIngredient(ingredient) ? '✓' : '·'}
                  </span>
                  <span className="text-gray-600">{measure}</span>
                  <span className={hasIngredient(ingredient) ? 'text-gray-800 font-medium' : 'text-gray-400'}>{ingredient}</span>
                </div>
              ))}
            </div>
            {recipe.strYoutube && (
              <a href={recipe.strYoutube} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700">
                <ExternalLink size={14} /> Watch on YouTube
              </a>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Instructions</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {instructions.map((step, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">{step}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
