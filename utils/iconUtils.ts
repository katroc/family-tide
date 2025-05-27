/**
 * Centralized icon mapping utility
 * Maps text icon names to emoji characters consistently across the app
 */

// Comprehensive icon mapping from text names to emoji
export const ICON_MAP: { [key: string]: string } = {
  // Reward icons
  'gift': '🎁',
  'star': '⭐',
  'trophy': '🏆',
  'medal': '🏅',
  'award': '🏆',
  'ribbon': '🎗️',
  'crown': '👑',
  'money': '💰',
  
  // Activity rewards
  'game': '🎮',
  'movie': '🎬',
  'music': '🎵',
  'book': '📚',
  'phone': '📱',
  
  // Food rewards
  'pizza': '🍕',
  'ice-cream': '🍦',
  'icecream': '🍦',
  
  // Celebration icons
  'balloon': '🎈',
  'fireworks': '🎆',
  'party': '🎉',
  
  // Outline variants (fallbacks to similar icons)
  'gift-outline': '🎀',
  'star-outline': '✨',
  'trophy-outline': '🏆',
  'medal-outline': '🎖️',
  'award-outline': '🎖️',  
  // Chore icons
  'cleaning': '🧹',
  'laundry': '🧺',
  'dishes': '🍽️',
  'trash': '🚮',
  'pet': '🐶',
  'garden': '🍃',
  'vacuum': '✨',
  'repair': '🛠️',
  'shopping': '🛒',
  'cooking': '🧑‍🍳',
  'sponge': '🧽',
  'soap': '🧼',
  'toys': '🧸',
  'books': '📚',
  'bed': '🛏️',
  'plant': '🌱',
  'vegetables': '🥕',
  'homework': '✏️',
  'art': '🎨',
  'gaming': '🎮',
  'sports': '⚽',
  'car': '🚗',
  'package': '📦',
  'computer': '💻',
  'morning': '☀️',
  'clothes': '👕',
  'teeth': '🦷',
  'breakfast': '🥣',
  'school': '🎒',
  'apple': '🍎',
  'night': '🌙',
  'reading': '📖',
  'light': '💡',
  
  // Common action icons
  'checkmark': '✅',
  'check': '✓',
  'plus': '➕',
  'edit': '✏️',
  'delete': '🗑️',
  'save': '💾',
  'cancel': '❌',
  
  // Navigation icons (fallbacks)
  'home': '🏠',
  'calendar': '📅',
  'list': '📋',
  'routine': '🔄',
  'family': '👨‍👩‍👧‍👦',
  'settings': '⚙️',
  
  // Default fallback
  'default': '❓'
};
/**
 * Get emoji icon from text name
 * @param iconName - Text name of the icon (e.g., 'money', 'gift')
 * @param fallback - Fallback emoji if icon not found (default: '❓')
 * @returns Emoji character
 */
export function getIcon(iconName: string | undefined, fallback: string = '❓'): string {
  if (!iconName) return fallback;
  
  // If it's already an emoji (contains non-ASCII characters), return as-is
  if (iconName.length <= 2 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconName)) {
    return iconName;
  }
  
  // Look up in icon map (case insensitive)
  const normalizedName = iconName.toLowerCase().trim();
  return ICON_MAP[normalizedName] || fallback;
}

/**
 * Get all available reward icons as emoji characters
 * @returns Array of emoji characters
 */
export function getRewardIcons(): string[] {
  const rewardIconNames = [
    'gift', 'star', 'trophy', 'medal', 'award', 'ribbon', 'crown', 'money',
    'game', 'movie', 'music', 'book', 'phone', 'pizza', 'ice-cream', 
    'balloon', 'fireworks', 'party'
  ];
  
  return rewardIconNames.map(name => ICON_MAP[name]);
}

/**
 * Get all available chore icons as emoji characters
 * @returns Array of emoji characters
 */
export function getChoreIcons(): string[] {
  const choreIconNames = [
    'cleaning', 'laundry', 'dishes', 'trash', 'pet', 'garden', 'vacuum', 'repair',
    'shopping', 'cooking', 'sponge', 'soap', 'toys', 'books', 'bed', 'plant',
    'vegetables', 'homework', 'art', 'gaming', 'sports', 'car', 'package', 'computer',
    'morning', 'clothes', 'teeth', 'breakfast', 'school', 'apple', 'night', 'reading', 'light'
  ];
  
  return choreIconNames.map(name => ICON_MAP[name]);
}
/**
 * Get icon name from emoji (reverse lookup)
 * @param emoji - Emoji character
 * @returns Text name or original emoji if not found
 */
export function getIconName(emoji: string): string {
  const entry = Object.entries(ICON_MAP).find(([name, value]) => value === emoji);
  return entry ? entry[0] : emoji;
}

/**
 * Validate if a string is a valid icon (either emoji or mapped name)
 * @param icon - Icon string to validate
 * @returns boolean
 */
export function isValidIcon(icon: string | undefined): boolean {
  if (!icon) return false;
  
  // Check if it's an emoji
  if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon)) {
    return true;
  }
  
  // Check if it's a mapped name
  return icon.toLowerCase() in ICON_MAP;
}