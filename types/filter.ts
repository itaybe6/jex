export type FilterField = {
  key: string;
  type: 'range' | 'multi-select' | 'number' | 'text' | 'boolean';
  label: string;
  options?: string[];
  condition?: {
    field: string;
    includes: string[];
  };
  min?: number;
  max?: number;
  step?: number;
  subFields?: FilterField[];
};

export type FilterFieldsByCategory = {
  [key: string]: FilterField[];
};

export type FilterParams = {
  category?: string;
  filters: {
    [key: string]: string[];
  };
};

export type FilterValue = string | number | boolean | null;

export type FilterState = {
  [key: string]: FilterValue | FilterValue[];
}; 