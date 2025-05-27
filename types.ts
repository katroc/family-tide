export interface FamilyMember {
  id: string; // String to maintain compatibility (converted from numbers)
  name: string;
  initial: string;
  role: string;
  color: string;
  nickname?: string; // Optional nickname
  dob?: string;      // Optional Date of Birth (YYYY-MM-DD)
  points: number;    // **FIXED: Added missing points field**
}

export interface ChoreType {
  id: string; // Unique identifier for the chore type
  name: string;
  defaultPoints: number;
  icon: string; // Emoji or icon representation
}

export interface Chore {
  id: string; // String to maintain compatibility (converted from numbers)
  title: string;
  assignedTo: string[]; // Names of assigned FamilyMembers
  completed: boolean;
  points: number;
  dueDate: string; // YYYY-MM-DD
  icon?: string; // Optional icon from ChoreType
  choreTypeId?: string | null; // **FIXED: Made properly nullable**
  status?: string; // Added to match DB schema
}

export interface EventItem {
  id: string; // String to maintain compatibility (converted from numbers)
  title: string;
  date: string; // ISO string, e.g., "2024-06-10T14:00:00Z"
  color: string;
  attendees: string[]; // Array of FamilyMember IDs
  endTime?: string; // Optional end time in HH:mm format
}

export interface Reward {
  id: string; // String to maintain compatibility (converted from numbers)
  title: string;
  cost: number;
  icon: string; // Emoji or icon representation
  available?: boolean; // Added to match DB schema
}

export interface FamilyDetails {
  id: string; // String to maintain compatibility (converted from numbers)
  name: string;
  address: string;
  photoUrl?: string; // URL to family photo
  photoObjectPosition?: string; // CSS object-position for photo
  inviteCode: string; // Unique invite code for family
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export type TabId = 'family' | 'calendar' | 'chores' | 'routines';

export interface NavigationItem {
  id: TabId;
  label: string;
  icon: string; // **FIXED: Changed from React.ElementType to string**
}

// Routines specific types
export interface RoutineStep {
  id: string; // e.g., 'brush-teeth'
  title: string;
  icon: string; // Emoji
}

export interface Routine {
  id: string; // String to maintain compatibility
  name: string; // e.g., "Morning Checklist"
  appliesToMemberIds: string[]; // Array of member IDs
  steps: RoutineStep[];
  completionPoints: number;
}

export interface DailyRoutineProgress {
  memberId: string; // String to maintain compatibility
  routineId: string;
  date: string; // YYYY-MM-DD
  completedStepIds: string[];
  isFullyCompleted: boolean; // True if all steps for this routine by this member on this date are done
}

// **NEW: Type aliases for creating new entities**
export type NewFamilyMember = Omit<FamilyMember, 'id' | 'points'> & {
  points?: number; // Optional when creating, defaults to 0
};

export type NewChore = Omit<Chore, 'id' | 'assignedTo'> & {
  assignedTo: string[]; // Ensure assignedTo is always an array
};
export type NewReward = Omit<Reward, 'id'>;

// **MISSING EXPORTS - These are what's causing the build error:**
export const FAMILY_MEMBER_ROLES = ['parent', 'child', 'other'] as const;

export const DEFAULT_COLORS = [
  'bg-red-300', 'bg-teal-300', 'bg-blue-300', 'bg-green-300', 'bg-amber-300',
  'bg-pink-300', 'bg-purple-300', 'bg-indigo-300', 'bg-cyan-300', 'bg-emerald-300',
  'bg-orange-300', 'bg-rose-300', 'bg-stone-300', 'bg-sky-300', 'bg-violet-300'
] as const;

export const DEFAULT_REWARD_ICONS = [
  // Main reward icons (using emoji characters)
  '🎁', '⭐', '🏆', '🏅', '🏆', '🎗️', '👑', '💰',
  // Activity rewards
  '🎮', '🎬', '🎵', '📚', 
  // Food rewards
  '🍕', '🍦', 
  // Celebration
  '🎈',
  // Additional options
  '🎀', '✨', '🎖️'
] as const;

// **NEW: Type guards for runtime type checking**
export function isFamilyMember(obj: any): obj is FamilyMember {
  return obj && 
    typeof obj.id === 'string' && // Updated to check for string ID
    typeof obj.name === 'string' &&
    typeof obj.initial === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.color === 'string' &&
    typeof obj.points === 'number';
}

export function isChore(obj: any): obj is Chore {
  return obj &&
    typeof obj.id === 'string' && // Updated to check for string ID
    typeof obj.title === 'string' &&
    Array.isArray(obj.assignedTo) && // Updated to check for array
    typeof obj.completed === 'boolean' &&
    typeof obj.points === 'number' &&
    typeof obj.dueDate === 'string';
}