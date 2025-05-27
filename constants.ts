import { FamilyMember, Chore, EventItem, Reward, FamilyDetails, TabId, NavigationItem, ChoreType, Routine, RoutineStep } from './types';
import { Calendar, CheckSquare, Home, Activity } from 'lucide-react';

// Soft, muted color palette
const COLOR_PALETTE = [
  'bg-red-200', 'bg-teal-200', 'bg-blue-200', 'bg-green-200', 'bg-amber-100',
  'bg-pink-200', 'bg-purple-200', 'bg-indigo-200', 'bg-cyan-200', 'bg-emerald-200',
  'bg-orange-200', 'bg-rose-200', 'bg-stone-200', 'bg-sky-200', 'bg-violet-200'
] as const;

export const AVAILABLE_COLORS = [...COLOR_PALETTE];
export const EVENT_COLORS = [...COLOR_PALETTE];

export const DEFAULT_COLORS = [...COLOR_PALETTE];

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'family', label: 'Family', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'chores', label: 'Chores', icon: CheckSquare },
  { id: 'routines', label: 'Routines', icon: Activity }
];

export const DEFAULT_NEW_MEMBER_STATE: Omit<FamilyMember, 'id'> = { 
  name: '', 
  role: '', 
  initial: '', 
  color: AVAILABLE_COLORS[0],
  nickname: '',
  dob: '',
  points: 0 
};

export const DEFAULT_NEW_EVENT_STATE = {
  title: '',
  date: '',
  attendees: [],
  color: EVENT_COLORS[0]
};

export const DEFAULT_NEW_CHORE_STATE: Omit<Chore, 'id' | 'completed'> = {
  title: '',
  assignedTo: '', 
  points: 10,
  dueDate: new Date().toISOString().split('T')[0],
  icon: undefined,
  choreTypeId: undefined,
};

export const AVAILABLE_CHORE_ICONS: string[] = [
  '🧹', '🧺', '🍽️', '🚮', '🐶', '🍃', '✨', '🛠️', 
  '🛒', '🧑‍🍳', '🧽', '🧼', '🧸', '📚', '🛏️', '🌱',
  '🥕', '✏️', '🎨', '🎮', '⚽', '🚗', '📦', '💻',
  '☀️', '👕', '🦷', '🥣', '🎒', '🍎', '🌙', '📖', '💡' 
];
export const AVAILABLE_ROUTINE_STEP_ICONS = AVAILABLE_CHORE_ICONS; // Reuse for now

// --- Routines Constants ---
export const ROUTINE_COMPLETION_ICON = '🏆';
export const INITIAL_ROUTINES: Routine[] = []; // Users will define their own routines

export const DEFAULT_NEW_ROUTINE_STEP_STATE: Omit<RoutineStep, 'id'> = {
  title: '',
  icon: AVAILABLE_ROUTINE_STEP_ICONS[0] || '✨',
};

export const DEFAULT_NEW_ROUTINE_STATE: Omit<Routine, 'id'> = {
  name: '',
  appliesToMemberIds: [], // Changed from appliesToRoles
  steps: [],
  completionPoints: 10,
};

// --- Rewards Constants ---
export const AVAILABLE_REWARD_ICONS: string[] = [
  '📱', '🍕', '🌙', '🎢', '🎁', '🎟️', '🎮', '🍦',
  '📚', '🎨', '⚽', '💰', '🎉', '💡', '🚀', '⭐'
];

export const DEFAULT_NEW_REWARD_STATE: Omit<Reward, 'id'> = {
  title: '',
  cost: 10,
  icon: AVAILABLE_REWARD_ICONS[0],
};
