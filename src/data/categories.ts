import type { ComplaintCategory, UrgencyLevel } from '../types/complaint';

export interface CategoryMeta {
  category: ComplaintCategory;
  department: string;
  shortLabel: string;
  description: string;
  keywords: string[];
}

export const CATEGORY_LIST: CategoryMeta[] = [
  {
    category: 'Road damage',
    department: 'Municipal Corporation · Roads & Engineering',
    shortLabel: 'Roads & Potholes',
    description: 'Potholes, broken pavements, damaged dividers, or unsafe road surfaces',
    keywords: [
      'pothole',
      'road',
      'street',
      'asphalt',
      'footpath',
      'pavement',
      'crack',
      'pit',
      'गड्ढा',
      'सड़क',
      'रास्ता',
      'రోడ్డు',
      'గుంట',
      'గుంతలు',
      'దారి',
    ],
  },
  {
    category: 'Garbage & sanitation',
    department: 'Municipal Sanitation & Solid Waste Dept.',
    shortLabel: 'Garbage & Waste',
    description: 'Uncollected trash, overflowing bins, dead animals, or street sweeping',
    keywords: [
      'garbage',
      'trash',
      'waste',
      'dustbin',
      'bin',
      'litter',
      'smell',
      'clean',
      'sanitation',
      'कचरा',
      'कूड़ा',
      'सफाई',
      'గార్బేజ్',
      'చెత్త',
      'డస్ట్‌బిన్',
      'శుభ్రత',
    ],
  },
  {
    category: 'Streetlight',
    department: 'Municipal Electrical & Street Lighting Dept.',
    shortLabel: 'Streetlights',
    description: 'Broken, flickering, or non-working streetlights and dark poles',
    keywords: [
      'streetlight',
      'street light',
      'light',
      'lamp',
      'pole',
      'dark',
      'bulb',
      'flicker',
      'बिजली',
      'लाइट',
      'बत्ती',
      'खंभा',
      'వీధి దీపం',
      'లైట్',
      'కరెంట్',
      'చీకటి',
    ],
  },
  {
    category: 'Water supply & leakage',
    department: 'Water Supply & Sewerage Board',
    shortLabel: 'Water & Leaks',
    description: 'Broken water pipes, leaking valves, low pressure, or contaminated supply',
    keywords: [
      'water',
      'pipe',
      'leak',
      'leakage',
      'pressure',
      'tap',
      'drinking',
      'supply',
      'पानी',
      'पाइप',
      'रिसाव',
      'नल',
      'నీరు',
      'నీళ్లు',
      'పైప్',
      'లీక్',
      'ట్యాప్',
    ],
  },
  {
    category: 'Drainage & sewage',
    department: 'Stormwater & Underground Drainage Dept.',
    shortLabel: 'Drainage & Sewage',
    description: 'Blocked drains, overflowing manholes, sewage flooding, or open gutters',
    keywords: [
      'drain',
      'drainage',
      'sewage',
      'sewer',
      'manhole',
      'gutter',
      'overflow',
      'clog',
      'नाला',
      'नाली',
      'सीवर',
      'गटर',
      'డ్రైనేజ్',
      'డ్రైన్',
      'మురుగు',
      'మ్యాన్‌హోల్',
    ],
  },
  {
    category: 'Other municipal issue',
    department: 'General Municipal Civic Cell',
    shortLabel: 'Other Civic Issue',
    description: 'Parks, stray hazards, fallen trees, public toilets, or other local issues',
    keywords: ['park', 'tree', 'toilet', 'noise', 'stray', 'mosquito', 'पेड़', 'पार्क', 'చెట్టు', 'పార్క్'],
  },
];

export function getDepartmentForCategory(category: ComplaintCategory): string {
  return (
    CATEGORY_LIST.find((item) => item.category === category)?.department ??
    'General Municipal Civic Cell'
  );
}

export const URGENCY_LABELS: Record<UrgencyLevel, { label: string; badgeClass: string }> = {
  low: {
    label: 'Low priority',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  medium: {
    label: 'Medium priority',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  high: {
    label: 'High urgency',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};
