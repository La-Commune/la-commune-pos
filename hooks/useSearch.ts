"use client";

import { useMemo, useState, useCallback } from "react";

interface UseSearchOptions<T> {
  items: T[];
  fields: (keyof T)[];
  initialQuery?: string;
}

export function useSearch<T>({ items, fields, initialQuery = "" }: UseSearchOptions<T>) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      fields.some((field) => {
        const val = item[field];
        if (typeof val === "string") return val.toLowerCase().includes(q);
        if (typeof val === "number") return String(val).includes(q);
        return false;
      })
    );
  }, [items, fields, query]);

  const reset = useCallback(() => setQuery(""), []);

  return { query, setQuery, filtered, reset, hasQuery: query.trim().length > 0 };
}
