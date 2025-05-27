import { FamilyMember, Chore, EventItem, Reward, FamilyDetails, ChoreType, Routine, DailyRoutineProgress, TabId } from '../types';

// Tab component prop interfaces
export interface FamilyTabProps {
  familyMembers: FamilyMember[];
  familyDetails: FamilyDetails;
  setFamilyDetails: React.Dispatch<React.SetStateAction<FamilyDetails>>;
  familyPhoto: string | null;
  isEditingFamily: boolean;
  setIsEditingFamily: React.Dispatch<React.SetStateAction<boolean>>;
  onNewPhotoSelected: (photoDataUrl: string) => void;
  saveFamilyDetails: () => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (memberId: number) => void;
  onAddMember: () => void;
}

export interface ChoresTabProps {
  chores: Chore[];
  familyMembers: FamilyMember[];
  onAddChore: () => void;
  onCompleteChore: (choreId: number) => void;
  onManageChoreTypes: () => void;
  rewards: Reward[];
  onAddReward: () => void;
  getMemberByName: (name: string) => FamilyMember | undefined;
}

export interface RoutinesTabProps {
  routines: Routine[];
  familyMembers: FamilyMember[];
  dailyRoutineProgress: DailyRoutineProgress[];
  onToggleRoutineStep: (memberId: number, routineId: string, stepId: string, date: string) => void;
  currentDate: string;
  onManageRoutines: () => void;
  getMemberById: (id: number) => FamilyMember | undefined;
}

// Navigation interfaces
export interface NavigationItem {
  id: TabId;
  label: string;
  icon: string;
}

export interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  items: NavigationItem[];
}

// Modal component interfaces
export interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit: FamilyMember | null;
  onSaveMember: (member: FamilyMember | Omit<FamilyMember, 'id'>) => void;
  availableColors: string[];
  defaultNewMemberState: Omit<FamilyMember, 'id'>;
}

export interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveChore: (chore: Chore | Omit<Chore, 'id'>) => void;
  familyMembers: FamilyMember[];
  defaultNewChoreState: Omit<Chore, 'id'>;
  choreTypes: ChoreType[];
  chore: Chore | Omit<Chore, 'id'>;
}

export interface AddRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReward: (reward: Omit<Reward, 'id'>) => void;
  defaultNewRewardState: Omit<Reward, 'id'>;
  availableIcons: string[];
}

export interface ManageChoreTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  choreTypes: ChoreType[];
  onSaveChoreType: (choreType: ChoreType) => void;
}

export interface ManageRoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  routines: Routine[];
  familyMembers: FamilyMember[];
  onSaveRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => Promise<boolean>;
}
