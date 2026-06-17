import { useCallback } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import type { CloudData } from '../contexts/UserDataContext';

const KEY_FIELD: Record<string, keyof CloudData> = {
  'todos':          'todos',
  'calendar-events':'calendarEvents',
  'shopping-items': 'shoppingItems',
  'fridge-items':   'fridgeItems',
  'transactions':   'transactions',
  'subscriptions':  'subscriptions',
  'regular-bills':  'regularBills',
};

export function useCloudStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const { data, update } = useUserData();
  const field = KEY_FIELD[key];

  const value = field !== undefined ? (data[field] as T) : defaultValue;

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      if (field !== undefined) {
        update(field, newValue);
      }
    },
    [field, update]
  );

  return [value ?? defaultValue, setValue];
}
