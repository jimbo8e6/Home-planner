export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'todo' | 'shopping' | 'fridge' | 'finance' | 'calendar' | 'general';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  check: (s: AchievementStats) => boolean;
}

export interface AchievementStats {
  completedTodos: number;
  highPriorityCompletedTodos: number;
  completedShops: number;
  fridgeItemCount: number;
  incomeEntries: number;
  subsTracked: number;
  billsTracked: number;
  calendarEvents: number;
  recipesSearched: number;
  visitedSections: string[];
  unlockedCount: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── To-Do
  { id: 'todo-1',    name: 'First Steps',          emoji: '🌱', rarity: 'common',    category: 'todo',     description: 'Ticked off your very first task. The journey begins!',             check: s => s.completedTodos >= 1 },
  { id: 'todo-10',   name: 'Getting Things Done',  emoji: '📋', rarity: 'common',    category: 'todo',     description: '10 tasks complete. You\'re on a roll!',                            check: s => s.completedTodos >= 10 },
  { id: 'todo-25',   name: 'In the Zone',          emoji: '⚡', rarity: 'rare',      category: 'todo',     description: '25 tasks smashed. Productivity is your superpower.',               check: s => s.completedTodos >= 25 },
  { id: 'todo-50',   name: 'Task Master',          emoji: '🎯', rarity: 'rare',      category: 'todo',     description: '50 tasks done. Is there anything you can\'t do?',                  check: s => s.completedTodos >= 50 },
  { id: 'todo-100',  name: 'Century Club',         emoji: '🏆', rarity: 'legendary', category: 'todo',     description: '100 tasks completed. You absolute legend.',                        check: s => s.completedTodos >= 100 },
  { id: 'todo-hi1',  name: 'High Achiever',        emoji: '🔴', rarity: 'common',    category: 'todo',     description: 'Crushed your first high-priority task. No messing around!',        check: s => s.highPriorityCompletedTodos >= 1 },
  { id: 'todo-hi10', name: 'No Messing Around',   emoji: '💪', rarity: 'epic',      category: 'todo',     description: '10 high-priority tasks? Seriously impressive.',                    check: s => s.highPriorityCompletedTodos >= 10 },

  // ── Shopping
  { id: 'shop-1',    name: 'First Trolley',        emoji: '🛒', rarity: 'common',    category: 'shopping', description: 'First shop completed. Fresh fridge incoming!',                     check: s => s.completedShops >= 1 },
  { id: 'shop-5',    name: 'Regular Shopper',      emoji: '🏪', rarity: 'common',    category: 'shopping', description: '5 shops done. The cashiers know your name.',                       check: s => s.completedShops >= 5 },
  { id: 'shop-10',   name: 'Shop Til You Drop',    emoji: '💳', rarity: 'rare',      category: 'shopping', description: '10 trips to the shops. Living your best life.',                    check: s => s.completedShops >= 10 },
  { id: 'shop-25',   name: 'Loyalty Card',         emoji: '🧾', rarity: 'epic',      category: 'shopping', description: '25 shops! Have you considered buying in bulk?',                   check: s => s.completedShops >= 25 },
  { id: 'shop-50',   name: 'Shopping Royalty',     emoji: '👑', rarity: 'legendary', category: 'shopping', description: '50 shops completed. The aisles are your kingdom.',                 check: s => s.completedShops >= 50 },

  // ── Fridge & Recipes
  { id: 'fridge-1',  name: 'Something in the Fridge', emoji: '🧊', rarity: 'common', category: 'fridge', description: 'First item stocked. A household begins.',                          check: s => s.fridgeItemCount >= 1 },
  { id: 'fridge-10', name: 'Stocked & Loaded',     emoji: '🏠', rarity: 'common',    category: 'fridge',   description: '10 items in your fridge & cupboard. Ready for anything.',          check: s => s.fridgeItemCount >= 10 },
  { id: 'recipe-1',  name: "What's Cooking?",      emoji: '👨‍🍳', rarity: 'common',    category: 'fridge',  description: 'Used the recipe finder for the first time. Chef mode activated!', check: s => s.recipesSearched >= 1 },
  { id: 'recipe-10', name: 'Recipe Hunter',        emoji: '🌟', rarity: 'rare',      category: 'fridge',   description: 'Searched for recipes 10 times. Gordon Ramsay would be proud.',     check: s => s.recipesSearched >= 10 },

  // ── Finance
  { id: 'income-1',  name: 'Payday!',             emoji: '💰', rarity: 'common',    category: 'finance',  description: 'First income recorded. Money in!',                                 check: s => s.incomeEntries >= 1 },
  { id: 'income-10', name: 'Finance Guru',        emoji: '📊', rarity: 'rare',      category: 'finance',  description: '10 income entries. Treating it like a proper business!',           check: s => s.incomeEntries >= 10 },
  { id: 'subs-3',    name: 'Subscription Aware',  emoji: '📱', rarity: 'common',    category: 'finance',  description: 'Tracking 3 subscriptions. Knowing is half the battle.',            check: s => s.subsTracked >= 3 },
  { id: 'bills-3',   name: 'Bill Payer',          emoji: '🏦', rarity: 'common',    category: 'finance',  description: '3 bills tracked. Adulting level: expert.',                         check: s => s.billsTracked >= 3 },

  // ── Calendar
  { id: 'cal-1',     name: 'Something to Look Forward To', emoji: '📅', rarity: 'common', category: 'calendar', description: 'First event added. Life is getting organised.',              check: s => s.calendarEvents >= 1 },
  { id: 'cal-10',    name: 'Busy Bee',             emoji: '🗓', rarity: 'rare',      category: 'calendar', description: '10 events in the diary. Your social life is thriving!',           check: s => s.calendarEvents >= 10 },
  { id: 'cal-25',    name: 'Life of the Party',   emoji: '🎉', rarity: 'epic',      category: 'calendar', description: '25 events! You never stop.',                                       check: s => s.calendarEvents >= 25 },

  // ── General
  { id: 'all-sections', name: 'Home Manager',     emoji: '🏡', rarity: 'epic',      category: 'general',  description: 'Explored all 6 sections. You\'re using HomePlanner like a pro!',    check: s => s.visitedSections.length >= 6 },
  { id: 'ach-10',    name: 'Achievement Hunter',  emoji: '🌈', rarity: 'epic',      category: 'general',  description: 'Unlocked 10 achievements. Clearly you\'re a completionist!',      check: s => s.unlockedCount >= 10 },
  { id: 'power-user', name: 'Power User',         emoji: '⭐', rarity: 'legendary', category: 'general',  description: 'Something in every section. True HomePlanner mastery!',               check: s => s.completedTodos >= 1 && s.fridgeItemCount >= 1 && s.completedShops >= 1 && s.incomeEntries >= 1 && s.calendarEvents >= 1 },
];

export const RARITY_CONFIG: Record<AchievementRarity, { label: string; border: string; bg: string; badge: string; glow: string }> = {
  common:    { label: 'Common',    border: 'border-gray-200',   bg: 'bg-white',       badge: 'bg-gray-100 text-gray-500',     glow: '' },
  rare:      { label: 'Rare',      border: 'border-blue-300',   bg: 'bg-blue-50',     badge: 'bg-blue-100 text-blue-700',     glow: 'shadow-blue-200' },
  epic:      { label: 'Epic',      border: 'border-purple-400', bg: 'bg-purple-50',   badge: 'bg-purple-100 text-purple-700', glow: 'shadow-purple-200' },
  legendary: { label: 'Legendary', border: 'border-amber-400',  bg: 'bg-amber-50',    badge: 'bg-amber-100 text-amber-700',   glow: 'shadow-amber-200' },
};

// ── Read stats from localStorage and fire events for newly unlocked achievements
export function triggerAchievementCheck() {
  try {
    const todos        = JSON.parse(localStorage.getItem('todos') || '[]');
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const subscriptions= JSON.parse(localStorage.getItem('subscriptions') || '[]');
    const bills        = JSON.parse(localStorage.getItem('regular-bills') || '[]');
    const events       = JSON.parse(localStorage.getItem('calendar-events') || '[]');
    const fridge       = JSON.parse(localStorage.getItem('fridge-items') || '[]');
    const extra        = JSON.parse(localStorage.getItem('achievement-stats') || '{}');
    const unlocked: string[] = JSON.parse(localStorage.getItem('unlocked-achievements') || '[]');

    const stats: AchievementStats = {
      completedTodos:              todos.filter((t: {completed: boolean}) => t.completed).length,
      highPriorityCompletedTodos:  todos.filter((t: {completed: boolean; priority: string}) => t.completed && t.priority === 'high').length,
      completedShops:              transactions.filter((t: {type: string; category: string}) => t.type === 'expense' && t.category === 'Groceries').length,
      fridgeItemCount:             fridge.length,
      incomeEntries:               transactions.filter((t: {type: string}) => t.type === 'income').length,
      subsTracked:                 subscriptions.length,
      billsTracked:                bills.length,
      calendarEvents:              events.length,
      recipesSearched:             extra.recipesSearched || 0,
      visitedSections:             extra.visitedSections || [],
      unlockedCount:               unlocked.length,
    };

    const newlyUnlocked = ACHIEVEMENTS.filter(a => !unlocked.includes(a.id) && a.check(stats));

    if (newlyUnlocked.length > 0) {
      localStorage.setItem('unlocked-achievements', JSON.stringify([...unlocked, ...newlyUnlocked.map(a => a.id)]));
      newlyUnlocked.forEach(a => {
        window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: a }));
      });
    }
  } catch {
    // fail silently
  }
}

export function trackRecipeSearch() {
  try {
    const extra = JSON.parse(localStorage.getItem('achievement-stats') || '{}');
    extra.recipesSearched = (extra.recipesSearched || 0) + 1;
    localStorage.setItem('achievement-stats', JSON.stringify(extra));
  } catch { /* */ }
}

export function trackSectionVisit(section: string) {
  try {
    const extra = JSON.parse(localStorage.getItem('achievement-stats') || '{}');
    const visited = new Set<string>(extra.visitedSections || []);
    visited.add(section);
    extra.visitedSections = [...visited];
    localStorage.setItem('achievement-stats', JSON.stringify(extra));
  } catch { /* */ }
}
