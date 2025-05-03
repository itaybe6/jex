import { FilterFieldsByCategory, FilterField } from '@/types/filter';

export const COMMON_JEWELRY_FIELDS: FilterField[] = [
  {
    key: "weight",
    type: "range",
    label: "Diamond Weight",
    min: 0,
    step: 0.01
  },
  {
    key: "color",
    type: "multi-select",
    label: "Color",
    options: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
  },
  {
    key: "clarity",
    type: "multi-select",
    label: "Clarity",
    options: ["I3", "I2", "I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF", "FL"]
  },
  {
    key: "cut_grade",
    type: "multi-select",
    label: "Cut Grade",
    options: ["POOR", "FAIR", "GOOD", "VERY GOOD", "EXCELLENT"]
  },
  {
    key: "certification",
    type: "multi-select",
    label: "Certification",
    options: ["GIA", "IGI", "HRD", "EGL", "SGL", "CGL", "IGL", "AIG"]
  },
  {
    key: "material",
    type: "multi-select",
    label: "Material",
    options: ["GOLD", "PLATINUM", "SILVER"]
  },
  {
    key: "gold_color",
    type: "multi-select",
    label: "Gold Color",
    options: ["WHITE", "ROSE", "YELLOW"],
    condition: { field: "material", includes: ["GOLD"] }
  },
  {
    key: "gold_karat",
    type: "multi-select",
    label: "Gold Karat",
    options: ["9K", "10K", "14K", "18K", "21K", "22K", "24K"],
    condition: { field: "material", includes: ["GOLD"] }
  },
  {
    key: "has_side_stones",
    type: "boolean",
    label: "Side Stones",
    subFields: [
      {
        key: "side_stones_weight",
        type: "range",
        label: "Side Stone Weight",
        min: 0,
        step: 0.01
      },
      {
        key: "side_stones_color",
        type: "multi-select",
        label: "Side Stone Color",
        options: ["D", "E", "F", "G", "H"]
      },
      {
        key: "side_stones_clarity",
        type: "multi-select",
        label: "Side Stone Clarity",
        options: ["IF", "VVS1", "VVS2", "VS1", "VS2"]
      }
    ]
  }
];

export const PRICE_FILTER_FIELDS: FilterField[] = [
  {
    key: "price",
    type: "range",
    label: "Price ($)",
    min: 0,
    step: 1
  }
];

export const WATCH_BRANDS_MODELS: Record<string, string[]> = {
  "Rolex": [
    "GMT-Master II", "Daytona", "Submariner", "Datejust", "Day-Date", "Yacht-Master II", "Oyster Perpetual", "Sea-Dweller", "Explorer II", "Milgauss", "Yacht-Master", "GMT-Master", "Lady-Datejust", "Explorer", "Air King"
  ],
  "Omega": [
    "Speedmaster", "Seamaster", "Seamaster 300", "Seamaster Aqua Terra", "De Ville", "Constellation", "Speedmaster Reduced", "Seamaster Planet Ocean", "Speedmaster Professional", "De Ville Prestige", "Speedmaster Racing", "Globemaster"
  ],
  "Breitling": [
    "Navitimer", "Superocean", "Chronomat", "Avenger", "Superocean Heritage", "Colt", "Top Time", "for Bentley", "Transocean", "Montbrillant", "Navitimer Heritage", "Professional"
  ],
  "IWC": [
    "Pilot", "Portuguese", "Portofino", "Ingenieur", "Aquatimer", "Da Vinci", "Porsche Design", "Aquatimer Automatic 2000", "Ingenieur Automatic", "Pilot Chronograph Top Gun", "Pilot Double Chronograph"
  ],
  "TAG Heuer": [
    "Carrera", "Aquaracer", "Formula 1", "Monaco", "Link", "Connected", "Aquaracer Lady", "Autavia", "Carrera Lady", "Monza"
  ],
  "Panerai": [
    "Luminor", "Luminor 1950", "Radiomir", "Radiomir 1940", "Ferrari", "Luminor Chrono", "Luminor GMT Automatic", "Luminor Marina", "Radiomir Black Seal"
  ],
  "Hublot": [
    "Big Bang", "Classic Fusion", "Big Bang Unico", "King Power", "Spirit of Big Bang", "Classic", "Big Bang Ferrari", "Classic Fusion Aerofusion"
  ],
  "Audemars Piguet": [
    "Royal Oak", "Royal Oak Offshore", "Jules Audemars", "Edward Piguet", "Royal Oak Chronograph", "Royal Oak Concept", "Royal Oak Dual Time", "Royal Oak Offshore Chronograph", "Royal Oak Offshore Diver", "Royal Oak Perpetual Calendar", "Royal Oak Selfwinding", "Royal Oak Tourbillon"
  ],
  "Cartier": [
    "Santos", "Tank", "Panthère", "Crash", "Ballon Bleu", "Calibre de Cartier", "Baignoire", "Pasha", "Drive de Cartier", "Ronde de Cartier", "Rotonde de Cartier", "Tortue"
  ],
  "Patek Philippe": [
    "Nautilus", "Calatrava", "Grand Complications", "Complications", "Aquanaut", "Golden Ellipse", "Gondolo", "Twenty~4", "Vintage"
  ],
  "Zenith": [
    "El Primero", "El Primero Chronomaster", "Elite", "Defy", "Captain", "Port Royal", "Pilot", "Star", "Stellina"
  ],
  "Tudor": [
    "Black Bay", "Submariner", "Fastrider", "Grantour", "Classic", "Fastrider Black Shield", "Heritage Chrono", "Heritage Ranger", "North Flag"
  ],
  "Chopard": [
    "Mille Miglia", "Happy Sport", "Imperiale", "Happy Diamonds", "Classic", "Ice Cube", "La Strada", "St. Moritz"
  ],
  "Bulgari": [
    "Diagono", "Bulgari", "Serpenti", "B.Zero1", "Assioma", "Ergon", "Rettangolo"
  ],
  "Richard Mille": [
    "RM 011", "RM 035", "RM 027", "RM 055", "RM 030", "RM 010", "RM 029", "RM 061"
  ]
};

export const GEM_TYPES = [
  'Alexandrite',
  'Amber',
  'Amethyst',
  'Ametrine',
  'Aquamarine',
  'Citrine',
  'Diamond',
  'Fancy Color Diamond',
  'Emerald',
  'Garnet',
  'Iolite',
  'Jade',
  'Kunzite',
  'Lapis Lazuli',
  'Moonstone',
  'Morganite',
  'Opal',
  'Pearl',
  'Peridot',
  'Rose Quartz',
  'Ruby',
  'Sapphire',
  'Spinel',
  'Sunstone',
  'Tanzanite',
  'Topaz',
  'Tourmaline',
  'Turquoise',
  'Zircon',
];

export const FILTER_FIELDS_BY_CATEGORY: FilterFieldsByCategory = {
  "Ring": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Ring Type",
      options: [
        "Wedding ring", "Hand Chain Ring - Bracelet", "Classic ring",
        "Engagement ring", "Solitaire ring", "All around ring", "Band ring"
      ]
    },
    ...COMMON_JEWELRY_FIELDS
  ],
  "Necklace": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Necklace Type",
      options: ["Pendant", "Chain", "Cuban links"]
    },
    ...COMMON_JEWELRY_FIELDS
  ],
  "Earrings": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Earring Type",
      options: ["Stud earrings", "Drop earrings", "English lock earrings", "Hoop earrings", "Chandelier earrings"]
    },
    ...COMMON_JEWELRY_FIELDS
  ],
  "Bracelet": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Bracelet Type",
      options: ["Tennis", "Bangle", "Armlet", "Bracelet"]
    },
    ...COMMON_JEWELRY_FIELDS
  ],
  "Special Pieces": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Special Piece Type",
      options: ["Crowns", "Cuff links", "Pins", "Belly chains"]
    },
    ...COMMON_JEWELRY_FIELDS
  ],
  "Loose Diamonds": [
    {
      key: "shape",
      type: "multi-select",
      label: "Shape",
      options: ["Round", "Princess", "Cushion", "Oval", "Emerald", "Pear", "Marquise", "Radiant", "Asscher", "Heart"]
    },
    {
      key: "weight",
      type: "range",
      label: "Weight",
      min: 0,
      step: 0.01
    },
    {
      key: "color",
      type: "multi-select",
      label: "Color",
      options: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N-Z"]
    },
    {
      key: "clarity",
      type: "multi-select",
      label: "Clarity",
      options: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"]
    },
    {
      key: "cut_grade",
      type: "multi-select",
      label: "Cut Grade",
      options: ["POOR", "FAIR", "GOOD", "VERY GOOD", "EXCELLENT"]
    },
    {
      key: "certification",
      type: "multi-select",
      label: "Certification",
      options: ["GIA", "IGI", "HRD", "EGL", "SGL", "CGL", "IGL", "AIG"]
    },
    {
      key: "type",
      type: "multi-select",
      label: "Type",
      options: ["Natural", "Lab Grown", "Treated"]
    }
  ],
  "Rough Diamonds": [
    {
      key: "weight",
      type: "range",
      label: "Weight (Carat)",
      min: 0,
      step: 0.01
    },
    {
      key: "clarity",
      type: "multi-select",
      label: "Clarity",
      options: ["I3", "I2", "I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF", "FL"]
    },
    {
      key: "color",
      type: "multi-select",
      label: "Color",
      options: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
    }
  ],
  "Gems": [
    {
      key: 'price',
      type: 'range',
      label: 'Price ($)',
      min: 0,
      step: 1
    },
    {
      key: 'gem_type',
      type: 'multi-select',
      label: 'Gem Type',
      options: GEM_TYPES
    },
    {
      key: 'certification_status',
      type: 'multi-select',
      label: 'Certification Status',
      options: ['Certificated', 'None Certificated']
    },
    {
      key: 'type',
      type: 'multi-select',
      label: 'Type',
      options: ['Natural', 'Lab Grown', 'Treated']
    }
  ],
  "Watches": [
    {
      key: "price",
      type: "range",
      label: "Price ($)",
      min: 0,
      step: 1
    },
    {
      key: "brand",
      type: "multi-select",
      label: "Brand",
      options: Object.keys(WATCH_BRANDS_MODELS)
    },
    {
      key: "model",
      type: "multi-select",
      label: "Model",
      options: [] // Will be set dynamically in the modal
    }
  ],
  "Loose Diamond": [
    {
      key: "clarity",
      label: "Clarity",
      type: "multi-select",
      options: ["I3","I2","I1","SI2","SI1","VS2","VS1","VVS2","VVS1","INTERNALLY"]
    },
    {
      key: "color",
      label: "Color",
      type: "multi-select",
      options: ["D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
    },
    {
      key: "cut",
      label: "Cut",
      type: "multi-select",
      options: ["POOR","FAIR","GOOD","VERY GOOD","EXCELLENT"]
    },
    {
      key: "weight",
      label: "Weight (Carats)",
      type: "range",
      min: 0,
      step: 0.01
    },
    {
      key: "shape",
      label: "Shape",
      type: "multi-select",
      options: ["Round", "Princess", "Cushion", "Oval", "Emerald", "Pear", "Marquise", "Radiant", "Asscher", "Heart"]
    },
    {
      key: "symmetry",
      label: "Symmetry",
      type: "multi-select",
      options: ["Excellent", "Very Good", "Good"]
    },
    {
      key: "polish",
      label: "Polish",
      type: "multi-select",
      options: ["Excellent", "Very Good", "Good"]
    },
    {
      key: "fluorescence",
      label: "Fluorescence",
      type: "multi-select",
      options: ["None", "Faint", "Medium", "Strong"]
    }
  ],
  "Rough Diamond": [
    {
      key: "clarity",
      label: "Clarity",
      type: "multi-select",
      options: ["I3","I2","I1","SI2","SI1","VS2","VS1","VVS2","VVS1","INTERNALLY"]
    },
    {
      key: "color",
      label: "Color",
      type: "multi-select",
      options: ["D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
    },
    {
      key: "cut",
      label: "Cut",
      type: "multi-select",
      options: ["POOR","FAIR","GOOD","VERY GOOD","EXCELLENT"]
    },
    {
      key: "weight",
      label: "Weight (Carats)",
      type: "range",
      min: 0,
      step: 0.01
    },
    {
      key: "shape",
      label: "Shape",
      type: "multi-select",
      options: ["Round", "Princess", "Cushion", "Oval", "Emerald", "Pear", "Marquise", "Radiant", "Asscher", "Heart"]
    }
  ]
};

export const CATEGORY_LABELS: Record<string, string> = {
  'Ring': 'Rings',
  'Necklace': 'Necklaces',
  'Earrings': 'Earrings',
  'Bracelet': 'Bracelets',
  'Special Pieces': 'Special Pieces',
  'Loose Diamonds': 'Loose Diamonds',
  'Rough Diamonds': 'Rough Diamonds',
  'Gems': 'Gems',
  'Watches': 'Watches',
}; 