"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/** Debounce a value */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

/** Debounce an async action (prevents double-submit) */
export function useAsyncAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async <T>(
    action: () => Promise<T>,
    options?: { onSuccess?: (result: T) => void; onError?: (err: string) => void }
  ): Promise<T | undefined> => {
    if (isLoading) return undefined; // Prevent double-submit
    setIsLoading(true);
    setError(null);
    try {
      const result = await action();
      if (mountedRef.current) {
        setIsLoading(false);
        options?.onSuccess?.(result);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      if (mountedRef.current) {
        setIsLoading(false);
        setError(message);
        options?.onError?.(message);
      }
      return undefined;
    }
  }, [isLoading]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return { isLoading, error, execute, reset };
}
