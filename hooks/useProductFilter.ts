import { useState, useCallback } from 'react';
import { Product, FilterParams } from '@/types/product';

export const useProductFilter = () => {
  const [activeFilters, setActiveFilters] = useState<FilterParams | null>(null);

  const filterProducts = useCallback((products: Product[], filters: FilterParams | null) => {
    if (!filters || !filters.filters) return products;

    return products.filter(product => {
      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Price filter
      const priceFrom = filters.filters.price_from?.[0];
      const priceTo = filters.filters.price_to?.[0];
      if (priceFrom && product.price < parseFloat(priceFrom)) return false;
      if (priceTo && product.price > parseFloat(priceTo)) return false;

      // Handle boolean filters
      const booleanFilters = Object.entries(filters.filters)
        .filter(([_, values]) => values.includes('true'))
        .map(([key]) => key);

      for (const booleanFilter of booleanFilters) {
        if (booleanFilter === 'has_side_stones') {
          const specs = product.specs as any;
          if (!specs?.has_side_stones) return false;
        }
      }

      // Handle range filters
      const rangeFilters = Object.entries(filters.filters)
        .filter(([key]) => key.endsWith('_from') || key.endsWith('_to'))
        .reduce((acc, [key, values]) => {
          if (!values.length) return acc;
          const baseKey = key.replace(/_from$|_to$/, '');
          if (!acc[baseKey]) acc[baseKey] = {};
          if (key.endsWith('_from')) {
            acc[baseKey].min = parseFloat(values[0]);
          } else {
            acc[baseKey].max = parseFloat(values[0]);
          }
          return acc;
        }, {} as Record<string, { min?: number; max?: number }>);

      for (const [key, range] of Object.entries(rangeFilters)) {
        const specs = product.specs as any;
        const value = specs?.[key];
        if (!value) return false;
        if (range.min && value < range.min) return false;
        if (range.max && value > range.max) return false;
      }

      // Handle multi-select filters
      const multiSelectFilters = Object.entries(filters.filters)
        .filter(([key, values]) => 
          values.length > 0 && 
          !key.endsWith('_from') && 
          !key.endsWith('_to') && 
          !booleanFilters.includes(key)
        );

      return multiSelectFilters.every(([key, values]) => {
        const specs = product.specs as any;
        if (!specs) return false;
        return values.includes(specs[key]);
      });
    });
  }, []);

  const applyFilters = useCallback((filters: FilterParams) => {
    setActiveFilters(filters);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters(null);
  }, []);

  return {
    activeFilters,
    filterProducts,
    applyFilters,
    clearFilters
  };
}; 