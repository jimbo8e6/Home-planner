import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { CalendarEvent, TodoItem, ShoppingItem, FridgeItem, Transaction, Subscription, RegularBill } from '../types';

export interface CloudData {
  todos: TodoItem[];
  calendarEvents: CalendarEvent[];
  shoppingItems: ShoppingItem[];
  fridgeItems: FridgeItem[];
  transactions: Transaction[];
  subscriptions: Subscription[];
  regularBills: RegularBill[];
}

const DEFAULT: CloudData = {
  todos: [],
  calendarEvents: [],
  shoppingItems: [],
  fridgeItems: [],
  transactions: [],
  subscriptions: [],
  regularBills: [],
};


interface UserDataContextType {
  data: CloudData;
  dataLoaded: boolean;
  update: (field: keyof CloudData, value: unknown) => void;
}

const UserDataContext = createContext<UserDataContextType>({
  data: DEFAULT,
  dataLoaded: false,
  update: () => {},
});

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<CloudData>(DEFAULT);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setData(DEFAULT);
      setDataLoaded(false);
      return;
    }

    supabase
      .from('user_data')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data: row }) => {
        if (row) {
          setData({
            todos: row.todos ?? [],
            calendarEvents: row.calendar_events ?? [],
            shoppingItems: row.shopping_items ?? [],
            fridgeItems: row.fridge_items ?? [],
            transactions: row.transactions ?? [],
            subscriptions: row.subscriptions ?? [],
            regularBills: row.regular_bills ?? [],
          });
        }
        setDataLoaded(true);
      });
  }, [user]);

  // Debounced sync to Supabase whenever data changes (after initial load)
  useEffect(() => {
    if (!user || !dataLoaded) return;
    const timer = setTimeout(() => {
      supabase.from('user_data').upsert({
        user_id: user.id,
        todos: data.todos,
        calendar_events: data.calendarEvents,
        shopping_items: data.shoppingItems,
        fridge_items: data.fridgeItems,
        transactions: data.transactions,
        subscriptions: data.subscriptions,
        regular_bills: data.regularBills,
        updated_at: new Date().toISOString(),
      }).then(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [data, user, dataLoaded]);

  const update = useCallback((field: keyof CloudData, value: unknown) => {
    setData(prev => {
      const current = prev[field];
      const next = typeof value === 'function'
        ? (value as (p: unknown) => unknown)(current)
        : value;
      return { ...prev, [field]: next };
    });
  }, []);

  return (
    <UserDataContext.Provider value={{ data, dataLoaded, update }}>
      {children}
    </UserDataContext.Provider>
  );
}

export const useUserData = () => useContext(UserDataContext);
