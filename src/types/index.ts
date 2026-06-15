export type View = 'dashboard' | 'calendar' | 'todo' | 'shopping' | 'finance' | 'fridge' | 'recipes';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  time?: string;
  color: string;
  description?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category: string;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  addedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  nextBillingDate: string;
  category: string;
  active: boolean;
  color: string;
}

export interface RegularBill {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'quarterly' | 'weekly';
  nextDueDate: string;
  category: string;
  active: boolean;
  color: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export interface FridgeItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  location: 'fridge' | 'cupboard';
  expiryDate?: string;
}

export interface Recipe {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strYoutube?: string;
  [key: string]: string | undefined;
}
