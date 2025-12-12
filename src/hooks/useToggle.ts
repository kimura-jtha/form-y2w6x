import { useCallback, useState } from 'react';

/**
 * Toggle boolean state
 * @param initialValue - Initial boolean value
 * @returns [value, toggle, setValue]
 */
export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  return [value, toggle, setValue];
}
