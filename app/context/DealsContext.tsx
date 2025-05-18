import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDealsByCategory } from '@/lib/supabaseApi';
import { categoryToProductType } from '@/components/DealOfTheDayIconsRow';

const DealsContext = createContext<{ allDeals: { [category: string]: any[] }, loading: boolean }>({ allDeals: {}, loading: true });

export const DealsProvider = ({ children }) => {
  const [allDeals, setAllDeals] = useState<{ [category: string]: any[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllDeals = async () => {
      const dealsByCategory: { [category: string]: any[] } = {};
      for (let key of Object.keys(categoryToProductType)) {
        const cat = categoryToProductType[key];
        const all = await getDealsByCategory(cat);
        dealsByCategory[cat] = all;
      }
      setAllDeals(dealsByCategory);
      setLoading(false);
    };
    loadAllDeals();
  }, []);

  return (
    <DealsContext.Provider value={{ allDeals, loading }}>
      {children}
    </DealsContext.Provider>
  );
};

export const useDeals = () => useContext(DealsContext); 