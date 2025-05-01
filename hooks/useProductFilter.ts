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

      // Watches: special handling for brand/model
      if (filters.category === 'Watches') {
        // Brand filter
        if (filters.filters.brand && filters.filters.brand.length > 0) {
          const productBrand = (product.watch_specs?.brand || '').toString();
          if (!filters.filters.brand.includes(productBrand)) {
            return false;
          }
        }
        // Model filter
        if (filters.filters.model && filters.filters.model.length > 0) {
          const productModel = (product.watch_specs?.model || '').toString();
          if (!filters.filters.model.includes(productModel)) {
            return false;
          }
        }
      }

      // Price filter
      const priceFrom = filters.filters.price_from?.[0] || filters.filters.price?.[0];
      const priceTo = filters.filters.price_to?.[0] || filters.filters.price?.[1];
      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      if (price == null || isNaN(price)) {
        return false;
      }
      if (priceFrom && price < parseFloat(priceFrom)) {
        return false;
      }
      if (priceTo && price > parseFloat(priceTo)) {
        return false;
      }

      // Handle boolean filters
      const booleanFilters = Object.entries(filters.filters)
        .filter(([_, values]) => Array.isArray(values) && values.includes('true'))
        .map(([key]) => key);

      for (const booleanFilter of booleanFilters) {
        if (booleanFilter === 'has_side_stones') {
          const specs = product.specs as any;
          if (!specs?.has_side_stones) {
            return false;
          }
        }
      }

      // Handle range filters
      const rangeFilters = Object.entries(filters.filters)
        .filter(([key]) => key.endsWith('_from') || key.endsWith('_to'))
        .reduce((acc, [key, values]) => {
          if (!Array.isArray(values) || !values.length) return acc;
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
        let value;
        if (key === 'price') {
          value = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        } else {
          const specs = product.specs as any;
          value = specs?.[key];
        }
        if (value == null || isNaN(value)) {
          return false;
        }
        if (range.min && value < range.min) {
          return false;
        }
        if (range.max && value > range.max) {
          return false;
        }
      }

      // Handle multi-select filters (skip brand/model for Watches)
      const multiSelectFilters = Object.entries(filters.filters)
        .filter(([key, values]) => 
          Array.isArray(values) &&
          values.length > 0 && 
          !key.endsWith('_from') && 
          !key.endsWith('_to') && 
          !booleanFilters.includes(key) &&
          !(filters.category === 'Watches' && (key === 'brand' || key === 'model'))
        );

      for (const [key, values] of multiSelectFilters) {
        const specs = product.specs as any;
        if (!specs) {
          return false;
        }
        if (!values.includes(specs[key])) {
          return false;
        }
      }

      // If passed all filters
      return true;
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