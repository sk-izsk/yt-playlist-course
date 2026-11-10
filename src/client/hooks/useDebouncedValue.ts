import { useEffect, useState } from "react";

/** Returns `value` once it has stopped changing for `ms`. */
export const useDebouncedValue = <T,>(value: T, ms = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
};
