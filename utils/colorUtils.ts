/**
 * Comprehensive Tailwind color mapping from class names to hex values
 * Used for converting Tailwind color classes to actual hex colors for styling
 */
export const TAILWIND_COLOR_MAP: Record<string, string> = {
  // Slate
  'bg-slate-50': '#f8fafc', 'slate-50': '#f8fafc',
  'bg-slate-100': '#f1f5f9', 'slate-100': '#f1f5f9',
  'bg-slate-200': '#e2e8f0', 'slate-200': '#e2e8f0',
  'bg-slate-300': '#cbd5e1', 'slate-300': '#cbd5e1',
  'bg-slate-400': '#94a3b8', 'slate-400': '#94a3b8',
  'bg-slate-500': '#64748b', 'slate-500': '#64748b',
  'bg-slate-600': '#475569', 'slate-600': '#475569',
  'bg-slate-700': '#334155', 'slate-700': '#334155',
  'bg-slate-800': '#1e293b', 'slate-800': '#1e293b',
  'bg-slate-900': '#0f172a', 'slate-900': '#0f172a',
  
  // Gray
  'bg-gray-50': '#f9fafb', 'gray-50': '#f9fafb',
  'bg-gray-100': '#f3f4f6', 'gray-100': '#f3f4f6',
  'bg-gray-200': '#e5e7eb', 'gray-200': '#e5e7eb',
  'bg-gray-300': '#d1d5db', 'gray-300': '#d1d5db',
  'bg-gray-400': '#9ca3af', 'gray-400': '#9ca3af',
  'bg-gray-500': '#6b7280', 'gray-500': '#6b7280',
  'bg-gray-600': '#4b5563', 'gray-600': '#4b5563',
  'bg-gray-700': '#374151', 'gray-700': '#374151',
  'bg-gray-800': '#1f2937', 'gray-800': '#1f2937',
  'bg-gray-900': '#111827', 'gray-900': '#111827',
  
  // Red
  'bg-red-50': '#fef2f2', 'red-50': '#fef2f2',
  'bg-red-100': '#fee2e2', 'red-100': '#fee2e2',
  'bg-red-200': '#fecaca', 'red-200': '#fecaca',
  'bg-red-300': '#fca5a5', 'red-300': '#fca5a5',
  'bg-red-400': '#f87171', 'red-400': '#f87171',
  'bg-red-500': '#ef4444', 'red-500': '#ef4444',
  'bg-red-600': '#dc2626', 'red-600': '#dc2626',
  'bg-red-700': '#b91c1c', 'red-700': '#b91c1c',
  'bg-red-800': '#991b1b', 'red-800': '#991b1b',
  'bg-red-900': '#7f1d1d', 'red-900': '#7f1d1d',  
  // Orange
  'bg-orange-50': '#fff7ed', 'orange-50': '#fff7ed',
  'bg-orange-100': '#ffedd5', 'orange-100': '#ffedd5',
  'bg-orange-200': '#fed7aa', 'orange-200': '#fed7aa',
  'bg-orange-300': '#fdba74', 'orange-300': '#fdba74',
  'bg-orange-400': '#fb923c', 'orange-400': '#fb923c',
  'bg-orange-500': '#f97316', 'orange-500': '#f97316',
  'bg-orange-600': '#ea580c', 'orange-600': '#ea580c',
  'bg-orange-700': '#c2410c', 'orange-700': '#c2410c',
  'bg-orange-800': '#9a3412', 'orange-800': '#9a3412',
  'bg-orange-900': '#7c2d12', 'orange-900': '#7c2d12',
  
  // Amber/Yellow
  'bg-amber-50': '#fffbeb', 'amber-50': '#fffbeb',
  'bg-amber-100': '#fef3c7', 'amber-100': '#fef3c7',
  'bg-amber-200': '#fde68a', 'amber-200': '#fde68a',
  'bg-amber-300': '#fcd34d', 'amber-300': '#fcd34d',
  'bg-amber-400': '#fbbf24', 'amber-400': '#fbbf24',
  'bg-amber-500': '#f59e0b', 'amber-500': '#f59e0b',
  'bg-amber-600': '#d97706', 'amber-600': '#d97706',
  'bg-amber-700': '#b45309', 'amber-700': '#b45309',
  'bg-amber-800': '#92400e', 'amber-800': '#92400e',
  'bg-amber-900': '#78350f', 'amber-900': '#78350f',
  
  'bg-yellow-50': '#fefce8', 'yellow-50': '#fefce8',
  'bg-yellow-100': '#fef9c3', 'yellow-100': '#fef9c3',
  'bg-yellow-200': '#fef08a', 'yellow-200': '#fef08a',
  'bg-yellow-300': '#fde047', 'yellow-300': '#fde047',
  'bg-yellow-400': '#facc15', 'yellow-400': '#facc15',
  'bg-yellow-500': '#eab308', 'yellow-500': '#eab308',
  'bg-yellow-600': '#ca8a04', 'yellow-600': '#ca8a04',
  'bg-yellow-700': '#a16207', 'yellow-700': '#a16207',
  'bg-yellow-800': '#854d0e', 'yellow-800': '#854d0e',
  'bg-yellow-900': '#713f12', 'yellow-900': '#713f12',
  
  // Lime
  'bg-lime-50': '#f7fee7', 'lime-50': '#f7fee7',
  'bg-lime-100': '#ecfccb', 'lime-100': '#ecfccb',
  'bg-lime-200': '#d9f99d', 'lime-200': '#d9f99d',
  'bg-lime-300': '#bef264', 'lime-300': '#bef264',
  'bg-lime-400': '#a3e635', 'lime-400': '#a3e635',
  'bg-lime-500': '#84cc16', 'lime-500': '#84cc16',
  'bg-lime-600': '#65a30d', 'lime-600': '#65a30d',
  'bg-lime-700': '#4d7c0f', 'lime-700': '#4d7c0f',
  'bg-lime-800': '#365314', 'lime-800': '#365314',
  'bg-lime-900': '#1a2e05', 'lime-900': '#1a2e05',  
  // Green
  'bg-green-50': '#f0fdf4', 'green-50': '#f0fdf4',
  'bg-green-100': '#dcfce7', 'green-100': '#dcfce7',
  'bg-green-200': '#bbf7d0', 'green-200': '#bbf7d0',
  'bg-green-300': '#86efac', 'green-300': '#86efac',
  'bg-green-400': '#4ade80', 'green-400': '#4ade80',
  'bg-green-500': '#22c55e', 'green-500': '#22c55e',
  'bg-green-600': '#16a34a', 'green-600': '#16a34a',
  'bg-green-700': '#15803d', 'green-700': '#15803d',
  'bg-green-800': '#166534', 'green-800': '#166534',
  'bg-green-900': '#14532d', 'green-900': '#14532d',
  
  // Emerald
  'bg-emerald-50': '#ecfdf5', 'emerald-50': '#ecfdf5',
  'bg-emerald-100': '#d1fae5', 'emerald-100': '#d1fae5',
  'bg-emerald-200': '#a7f3d0', 'emerald-200': '#a7f3d0',
  'bg-emerald-300': '#6ee7b7', 'emerald-300': '#6ee7b7',
  'bg-emerald-400': '#34d399', 'emerald-400': '#34d399',
  'bg-emerald-500': '#10b981', 'emerald-500': '#10b981',
  'bg-emerald-600': '#059669', 'emerald-600': '#059669',
  'bg-emerald-700': '#047857', 'emerald-700': '#047857',
  'bg-emerald-800': '#065f46', 'emerald-800': '#065f46',
  'bg-emerald-900': '#064e3b', 'emerald-900': '#064e3b',
  
  // Teal
  'bg-teal-50': '#f0fdfa', 'teal-50': '#f0fdfa',
  'bg-teal-100': '#ccfbf1', 'teal-100': '#ccfbf1',
  'bg-teal-200': '#99f6e4', 'teal-200': '#99f6e4',
  'bg-teal-300': '#5eead4', 'teal-300': '#5eead4',
  'bg-teal-400': '#2dd4bf', 'teal-400': '#2dd4bf',
  'bg-teal-500': '#14b8a6', 'teal-500': '#14b8a6',
  'bg-teal-600': '#0d9488', 'teal-600': '#0d9488',
  'bg-teal-700': '#0f766e', 'teal-700': '#0f766e',
  'bg-teal-800': '#115e59', 'teal-800': '#115e59',
  'bg-teal-900': '#134e4a', 'teal-900': '#134e4a',
  
  // Cyan
  'bg-cyan-50': '#ecfeff', 'cyan-50': '#ecfeff',
  'bg-cyan-100': '#cffafe', 'cyan-100': '#cffafe',
  'bg-cyan-200': '#a5f3fc', 'cyan-200': '#a5f3fc',
  'bg-cyan-300': '#67e8f9', 'cyan-300': '#67e8f9',
  'bg-cyan-400': '#22d3ee', 'cyan-400': '#22d3ee',
  'bg-cyan-500': '#06b6d4', 'cyan-500': '#06b6d4',
  'bg-cyan-600': '#0891b2', 'cyan-600': '#0891b2',
  'bg-cyan-700': '#0e7490', 'cyan-700': '#0e7490',
  'bg-cyan-800': '#155e75', 'cyan-800': '#155e75',
  'bg-cyan-900': '#164e63', 'cyan-900': '#164e63',  
  // Sky
  'bg-sky-50': '#f0f9ff', 'sky-50': '#f0f9ff',
  'bg-sky-100': '#e0f2fe', 'sky-100': '#e0f2fe',
  'bg-sky-200': '#bae6fd', 'sky-200': '#bae6fd',
  'bg-sky-300': '#7dd3fc', 'sky-300': '#7dd3fc',
  'bg-sky-400': '#38bdf8', 'sky-400': '#38bdf8',
  'bg-sky-500': '#0ea5e9', 'sky-500': '#0ea5e9',
  'bg-sky-600': '#0284c7', 'sky-600': '#0284c7',
  'bg-sky-700': '#0369a1', 'sky-700': '#0369a1',
  'bg-sky-800': '#075985', 'sky-800': '#075985',
  'bg-sky-900': '#0c4a6e', 'sky-900': '#0c4a6e',
  
  // Blue
  'bg-blue-50': '#eff6ff', 'blue-50': '#eff6ff',
  'bg-blue-100': '#dbeafe', 'blue-100': '#dbeafe',
  'bg-blue-200': '#bfdbfe', 'blue-200': '#bfdbfe',
  'bg-blue-300': '#93c5fd', 'blue-300': '#93c5fd',
  'bg-blue-400': '#60a5fa', 'blue-400': '#60a5fa',
  'bg-blue-500': '#3b82f6', 'blue-500': '#3b82f6',
  'bg-blue-600': '#2563eb', 'blue-600': '#2563eb',
  'bg-blue-700': '#1d4ed8', 'blue-700': '#1d4ed8',
  'bg-blue-800': '#1e40af', 'blue-800': '#1e40af',
  'bg-blue-900': '#1e3a8a', 'blue-900': '#1e3a8a',
  
  // Indigo
  'bg-indigo-50': '#eef2ff', 'indigo-50': '#eef2ff',
  'bg-indigo-100': '#e0e7ff', 'indigo-100': '#e0e7ff',
  'bg-indigo-200': '#c7d2fe', 'indigo-200': '#c7d2fe',
  'bg-indigo-300': '#a5b4fc', 'indigo-300': '#a5b4fc',
  'bg-indigo-400': '#818cf8', 'indigo-400': '#818cf8',
  'bg-indigo-500': '#6366f1', 'indigo-500': '#6366f1',
  'bg-indigo-600': '#4f46e5', 'indigo-600': '#4f46e5',
  'bg-indigo-700': '#4338ca', 'indigo-700': '#4338ca',
  'bg-indigo-800': '#3730a3', 'indigo-800': '#3730a3',
  'bg-indigo-900': '#312e81', 'indigo-900': '#312e81',
  
  // Violet
  'bg-violet-50': '#f5f3ff', 'violet-50': '#f5f3ff',
  'bg-violet-100': '#ede9fe', 'violet-100': '#ede9fe',
  'bg-violet-200': '#ddd6fe', 'violet-200': '#ddd6fe',
  'bg-violet-300': '#c4b5fd', 'violet-300': '#c4b5fd',
  'bg-violet-400': '#a78bfa', 'violet-400': '#a78bfa',
  'bg-violet-500': '#8b5cf6', 'violet-500': '#8b5cf6',
  'bg-violet-600': '#7c3aed', 'violet-600': '#7c3aed',
  'bg-violet-700': '#6d28d9', 'violet-700': '#6d28d9',
  'bg-violet-800': '#5b21b6', 'violet-800': '#5b21b6',
  'bg-violet-900': '#4c1d95', 'violet-900': '#4c1d95',
  
  // Purple
  'bg-purple-50': '#faf5ff', 'purple-50': '#faf5ff',
  'bg-purple-100': '#f3e8ff', 'purple-100': '#f3e8ff',
  'bg-purple-200': '#e9d5ff', 'purple-200': '#e9d5ff',
  'bg-purple-300': '#d8b4fe', 'purple-300': '#d8b4fe',
  'bg-purple-400': '#c084fc', 'purple-400': '#c084fc',
  'bg-purple-500': '#a855f7', 'purple-500': '#a855f7',
  'bg-purple-600': '#9333ea', 'purple-600': '#9333ea',
  'bg-purple-700': '#7e22ce', 'purple-700': '#7e22ce',
  'bg-purple-800': '#6b21a8', 'purple-800': '#6b21a8',
  'bg-purple-900': '#581c87', 'purple-900': '#581c87',  
  // Fuchsia
  'bg-fuchsia-50': '#fdf4ff', 'fuchsia-50': '#fdf4ff',
  'bg-fuchsia-100': '#fae8ff', 'fuchsia-100': '#fae8ff',
  'bg-fuchsia-200': '#f5d0fe', 'fuchsia-200': '#f5d0fe',
  'bg-fuchsia-300': '#f0abfc', 'fuchsia-300': '#f0abfc',
  'bg-fuchsia-400': '#e879f9', 'fuchsia-400': '#e879f9',
  'bg-fuchsia-500': '#d946ef', 'fuchsia-500': '#d946ef',
  'bg-fuchsia-600': '#c026d3', 'fuchsia-600': '#c026d3',
  'bg-fuchsia-700': '#a21caf', 'fuchsia-700': '#a21caf',
  'bg-fuchsia-800': '#86198f', 'fuchsia-800': '#86198f',
  'bg-fuchsia-900': '#701a75', 'fuchsia-900': '#701a75',
  
  // Pink
  'bg-pink-50': '#fdf2f8', 'pink-50': '#fdf2f8',
  'bg-pink-100': '#fce7f3', 'pink-100': '#fce7f3',
  'bg-pink-200': '#fbcfe8', 'pink-200': '#fbcfe8',
  'bg-pink-300': '#f9a8d4', 'pink-300': '#f9a8d4',
  'bg-pink-400': '#f472b6', 'pink-400': '#f472b6',
  'bg-pink-500': '#ec4899', 'pink-500': '#ec4899',
  'bg-pink-600': '#db2777', 'pink-600': '#db2777',
  'bg-pink-700': '#be185d', 'pink-700': '#be185d',
  'bg-pink-800': '#9d174d', 'pink-800': '#9d174d',
  'bg-pink-900': '#831843', 'pink-900': '#831843',
  
  // Rose
  'bg-rose-50': '#fff1f2', 'rose-50': '#fff1f2',
  'bg-rose-100': '#ffe4e6', 'rose-100': '#ffe4e6',
  'bg-rose-200': '#fecdd3', 'rose-200': '#fecdd3',
  'bg-rose-300': '#fda4af', 'rose-300': '#fda4af',
  'bg-rose-400': '#fb7185', 'rose-400': '#fb7185',
  'bg-rose-500': '#f43f5e', 'rose-500': '#f43f5e',
  'bg-rose-600': '#e11d48', 'rose-600': '#e11d48',
  'bg-rose-700': '#be123c', 'rose-700': '#be123c',
  'bg-rose-800': '#9f1239', 'rose-800': '#9f1239',
  'bg-rose-900': '#881337', 'rose-900': '#881337'
};

// Default fallback color (slate-400)
export const DEFAULT_MEMBER_COLOR = '#94a3b8';

/**
 * Converts a Tailwind color class or hex value to a hex color string
 * @param color - The color value to convert (Tailwind class or hex value)
 * @returns Hex color string or default color if conversion fails
 */
export function convertToHexColor(color: string | undefined): string {
  if (!color) {
    return DEFAULT_MEMBER_COLOR;
  }
  
  // If the color is already a hex value, use it directly
  if (color.startsWith('#')) {
    return color;
  }
  
  // Try exact match first (including bg- prefix)
  if (TAILWIND_COLOR_MAP[color]) {
    return TAILWIND_COLOR_MAP[color];
  }
  
  // Try without the bg- prefix
  const colorWithoutPrefix = color.replace(/^bg-/, '');
  if (TAILWIND_COLOR_MAP[colorWithoutPrefix]) {
    return TAILWIND_COLOR_MAP[colorWithoutPrefix];
  }
  
  // Enhanced fallback: try to find a similar color with a sensible default shade
  const colorMatch = color.match(/^(?:bg-)?([a-z]+)(?:-(\d+))?$/);
  if (colorMatch) {
    const [, baseColor, shade] = colorMatch;
    const defaultShade = shade || '500'; // Default to 500 if no shade specified
    const fallbackKey = `${baseColor}-${defaultShade}`;
    
    if (TAILWIND_COLOR_MAP[fallbackKey]) {
      return TAILWIND_COLOR_MAP[fallbackKey];
    }
    
    // Try common shades if the specified one doesn't exist
    const commonShades = ['500', '400', '600', '300', '200'];
    for (const commonShade of commonShades) {
      const tryKey = `${baseColor}-${commonShade}`;
      if (TAILWIND_COLOR_MAP[tryKey]) {
        return TAILWIND_COLOR_MAP[tryKey];
      }
    }
  }
  
  return DEFAULT_MEMBER_COLOR;
}