import { useState, useCallback, useEffect } from 'react';
import { ChefHat, Loader2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { FridgeItem, Recipe } from '../../types';

function itemToSearchTerms(itemName: string): string[] {
  const name = itemName.toLowerCase();
  const mapping: Record<string, string[]> = {
    'chicken breast': ['Chicken'], 'chicken': ['Chicken'],
    'beef mince': ['Beef'], 'beef': ['Beef'],
    'salmon': ['Salmon'], 'eggs': ['Egg'],
    'pasta': ['Pasta', 'Spaghetti'], 'rice': ['Rice'],
    'tomatoes': ['Tomato'], 'tinned tomatoes': ['Tomato'],
    'potatoes': ['Potato'], 'mushrooms': ['Mushroom'],
    'spinach': ['Spinach'], 'broccoli': ['Broccoli'],
    'onion': ['Onion'], 'garlic': ['Garlic'],
    'lemon': ['Lemon'], 'carrots': ['Carrot'],
    'peppers': ['Pepper'], 'butter': ['Butter'],
    'milk': ['Milk'], 'cheddar': ['Cheese'],
    'cheese': ['Cheese'], 'flour': ['Flour'],
  };
  for (const [key, terms] of Object.entries(mapping)) {
    if (name.includes(key)) return terms;
  }
  return [itemName.split(' ')[0]];
}

function RecipeDetail({ recipe, onBack, fridgeItems }: { recipe: Recipe; onBack: () => void; fridgeItems: string[] }) {
  const ingredients = Array.from({ length: 20 }, (_, i) => ({
    ingredient: recipe[`strIngredient${i + 1}`] || '',
    measure: recipe[`strMeasure${i + 1}`] || '',
  })).filter(item => item.ingredient.trim());

  const hasIngredient = (ingredient: string) =>
    fridgeItems.some(fi =>
      fi.toLowerCase().includes(ingredient.toLowerCase().split(' ')[0]) ||
      ingredient.toLowerCase().includes(fi.toLowerCase().split(' ')[0])
    );

  const haveCount = ingredients.filter(({ ingredient }) => hasIngredient(ingredient)).length;
  const instructions = recipe.strInstructions?.split('\n').filter(s => s.trim()) || [];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        ← Back to recipes
      </button>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="relative h-64 overflow-hidden">
          <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{recipe.strMeal}</h2>
              <p className="text-white/70 text-sm mt-1">{recipe.strCategory} · {recipe.strArea}</p>
            </div>
          </div>
          <div className="absolute top-4 right-4 bg-white/90 text-gray-800 text-sm font-medium px-3 py-1.5 rounded-full">
            {haveCount}/{ingredients.length} ingredients
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Ingredients</h3>
            <div className="space-y-2">
              {ingredients.map(({ ingredient, measure }) => {
                const have = hasIngredient(ingredient);
                return (
                  <div key={ingredient} className={`flex items-center gap-2 text-sm ${have ? '' : 'opacity-50'}`}>
                    <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${have ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {have ? '✓' : '·'}
                    </span>
                    <span className="text-gray-500">{measure}</span>
                    <span className={have ? 'text-gray-800 font-medium' : 'text-gray-400'}>{ingredient}</span>
                  </div>
                );
              })}
            </div>
            {recipe.strYoutube && (
              <a href={recipe.strYoutube} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700">
                <ExternalLink size={14} /> Watch on YouTube
              </a>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Instructions</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
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

export function RecipesView() {
  const [allItems] = useLocalStorage<FridgeItem[]>('fridge-items', []);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Recipe | null>(null);

  const fridgeItems = allItems.filter(i => (i.location ?? 'fridge') === 'fridge');
  const cupboardItems = allItems.filter(i => (i.location ?? 'fridge') === 'cupboard');

  const findRecipes = useCallback(async () => {
    if (allItems.length === 0) return;
    setLoading(true);
    setSearched(true);
    setError('');
    setRecipes([]);
    setSelected(null);

    try {
      const searchTerms = allItems.flatMap(i => itemToSearchTerms(i.name));
      const uniqueTerms = [...new Set(searchTerms)].slice(0, 6);

      const results = await Promise.all(
        uniqueTerms.map(term =>
          fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`)
            .then(r => r.json())
            .then((d: { meals: Recipe[] | null }) => d.meals || [])
            .catch(() => [] as Recipe[])
        )
      );

      const seen = new Set<string>();
      const unique = results.flat().filter(r => {
        if (seen.has(r.idMeal)) return false;
        seen.add(r.idMeal);
        return true;
      });

      const allItemNames = allItems.map(i => i.name.toLowerCase());
      const scored = unique.map(r => {
        const ingredients = Array.from({ length: 20 }, (_, i) => r[`strIngredient${i + 1}`] || '')
          .filter(Boolean).map(s => s.toLowerCase());
        const matches = allItemNames.filter(fi =>
          ingredients.some(ing => ing.includes(fi.split(' ')[0]) || fi.includes(ing.split(' ')[0]))
        );
        return { recipe: r, score: matches.length };
      });

      scored.sort((a, b) => b.score - a.score);
      setRecipes(scored.slice(0, 15).map(s => s.recipe));
    } catch {
      setError('Could not fetch recipes. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [allItems]);

  // Auto-search when component mounts if items exist
  useEffect(() => {
    if (allItems.length > 0 && !searched) {
      findRecipes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (selected) {
    return <RecipeDetail recipe={selected} onBack={() => setSelected(null)} fridgeItems={allItems.map(i => i.name)} />;
  }

  return (
    <div>
      {/* Ingredient summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧊</span>
          <div>
            <p className="text-sm font-medium text-gray-700">{fridgeItems.length} fridge items</p>
            <p className="text-xs text-gray-400">{fridgeItems.slice(0, 3).map(i => i.name).join(', ')}{fridgeItems.length > 3 ? ` +${fridgeItems.length - 3} more` : ''}</p>
          </div>
        </div>
        <div className="w-px h-10 bg-gray-200" />
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗄️</span>
          <div>
            <p className="text-sm font-medium text-gray-700">{cupboardItems.length} cupboard items</p>
            <p className="text-xs text-gray-400">{cupboardItems.slice(0, 3).map(i => i.name).join(', ')}{cupboardItems.length > 3 ? ` +${cupboardItems.length - 3} more` : ''}</p>
          </div>
        </div>
        <div className="ml-auto">
          <button onClick={findRecipes} disabled={loading || allItems.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${allItems.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95'}`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {loading ? 'Searching...' : searched ? 'Refresh' : 'Find Recipes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!searched && !loading && allItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ChefHat size={64} className="text-rose-200 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nothing in the fridge yet</h3>
          <p className="text-gray-400 max-w-sm">Add ingredients to your Fridge & Cupboard first, then come back here to find recipes that match what you have.</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={48} className="text-rose-400 animate-spin mb-4" />
          <p className="text-gray-500">Searching for recipes based on your {allItems.length} ingredients...</p>
        </div>
      )}

      {searched && !loading && recipes.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-2">No recipes found for your current ingredients.</p>
          <p className="text-sm text-gray-400">Try adding more items to your fridge & cupboard.</p>
        </div>
      )}

      {recipes.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {recipes.length} recipes you can make
            </h3>
            <p className="text-sm text-gray-400">Sorted by how many ingredients you already have</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {recipes.map(recipe => {
              const ingredients = Array.from({ length: 20 }, (_, i) => recipe[`strIngredient${i + 1}`] || '').filter(Boolean);
              const allItemNames = allItems.map(i => i.name.toLowerCase());
              const matchCount = allItemNames.filter(fi =>
                ingredients.some(ing => ing.toLowerCase().includes(fi.split(' ')[0]) || fi.includes(ing.toLowerCase().split(' ')[0]))
              ).length;

              return (
                <button key={recipe.idMeal} onClick={() => setSelected(recipe)}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-rose-200 transition-all text-left group">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                      <span className="text-xs bg-white/90 text-gray-700 px-2 py-0.5 rounded-full font-medium">{recipe.strCategory}</span>
                      {matchCount > 0 && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">{matchCount} ✓</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-800 text-sm line-clamp-2 leading-snug">{recipe.strMeal}</p>
                    <p className="text-xs text-gray-400 mt-1">{recipe.strArea}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
