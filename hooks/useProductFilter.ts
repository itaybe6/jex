import { useState, useCallback } from 'react';
import { Product, FilterParams } from '@/types/product';

export const useProductFilter = () => {
  const [activeFilters, setActiveFilters] = useState<FilterParams | null>(null);

  const filterProducts = useCallback((products: Product[], filters: FilterParams | null) => {
    if (!filters || !filters.filters) return products;

    return products.filter(product => {
      // Category filter
      if (filters.category && product.category !== filters.category) {
        console.log('FILTER FAIL', { reason: 'category', productCategory: product.category, filterCategory: filters.category });
        return false;
      }

      // Watches: special handling for brand/model
      if (filters.category === 'Watches') {
        // Brand filter
        if (filters.filters.brand && filters.filters.brand.length > 0) {
          const productBrand = (product.watch_specs?.brand || '').toString();
          if (!filters.filters.brand.includes(productBrand)) {
            console.log('FILTER FAIL', { reason: 'brand', productBrand, filterBrands: filters.filters.brand });
            return false;
          }
        }
        // Model filter
        if (filters.filters.model && filters.filters.model.length > 0) {
          const productModel = (product.watch_specs?.model || '').toString();
          if (!filters.filters.model.includes(productModel)) {
            console.log('FILTER FAIL', { reason: 'model', productModel, filterModels: filters.filters.model });
            return false;
          }
        }
      }

      // Price filter
      const priceFrom = filters.filters.price_from?.[0] || filters.filters.price?.[0];
      const priceTo = filters.filters.price_to?.[0] || filters.filters.price?.[1];
      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      if (price == null || isNaN(price)) {
        console.log('FILTER FAIL', { reason: 'price is null/NaN', product });
        return false;
      }
      if (priceFrom && price < parseFloat(priceFrom)) {
        console.log('FILTER FAIL', { reason: 'price < priceFrom', price, priceFrom });
        return false;
      }
      if (priceTo && price > parseFloat(priceTo)) {
        console.log('FILTER FAIL', { reason: 'price > priceTo', price, priceTo });
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
            console.log('FILTER FAIL', { reason: 'has_side_stones', product });
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
          console.log('FILTER FAIL', { reason: 'range missing value', key, product });
          return false;
        }
        if (range.min && value < range.min) {
          console.log('FILTER FAIL', { reason: 'range min', key, value, min: range.min });
          return false;
        }
        if (range.max && value > range.max) {
          console.log('FILTER FAIL', { reason: 'range max', key, value, max: range.max });
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
          console.log('FILTER FAIL', { reason: 'multi-select: no specs', key, product });
          return false;
        }
        if (!values.includes(specs[key])) {
          console.log('FILTER FAIL', { reason: 'multi-select: value not included', key, values, actual: specs[key], product });
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