import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  FC
} from 'react';
import { uiLogger } from '../utils/logger';
import { FamilyMember, Chore, TabId } from '../types';
import { dataService } from '../dataService';

interface ModalStateValue {
  // Tab state
  activeTab: TabId;
  setActiveTab: Dispatch<SetStateAction<TabId>>;
  handleTabChange: (tabId: TabId) => void;

  // Family editing
  isEditingFamily: boolean;
  setIsEditingFamily: Dispatch<SetStateAction<boolean>>;

  // Member modal
  isMemberModalOpen: boolean;
  editingMember: FamilyMember | null;
  openAddMember: () => void;
  openEditMember: (member: FamilyMember) => void;
  closeMemberModal: () => void;

  // Event modal
  isEventModalOpen: boolean;
  openEventModal: () => void;
  closeEventModal: () => void;

  // Chore modals
  isAddChoreModalOpen: boolean;
  isEditChoreModalOpen: boolean;
  editingChore: Chore | null;
  openAddChoreModal: () => void;
  openEditChoreModal: (chore: Chore) => void;
  closeChoreModals: () => void;

  // Reward modal
  isAddRewardModalOpen: boolean;
  openAddRewardModal: () => void;
  closeAddRewardModal: () => void;

  // Management modals
  isManageChoreTypesOpen: boolean;
  openManageChoreTypes: () => void;
  closeManageChoreTypes: () => void;
  isManageRoutinesOpen: boolean;
  openManageRoutines: () => void;
  closeManageRoutines: () => void;

  // Performance monitor
  isPerformanceMonitorOpen: boolean;
  openPerformanceMonitor: () => void;
  closePerformanceMonitor: () => void;
}

const ModalStateContext = createContext<ModalStateValue | undefined>(undefined);

export const ModalStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabId>('family');
  const [isEditingFamily, setIsEditingFamily] = useState(false);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [isAddChoreModalOpen, setIsAddChoreModalOpen] = useState(false);
  const [isEditChoreModalOpen, setIsEditChoreModalOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  const [isAddRewardModalOpen, setIsAddRewardModalOpen] = useState(false);

  const [isManageChoreTypesOpen, setIsManageChoreTypesOpen] = useState(false);
  const [isManageRoutinesOpen, setIsManageRoutinesOpen] = useState(false);

  const [isPerformanceMonitorOpen, setIsPerformanceMonitorOpen] = useState(false);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    dataService.saveActiveTab(tabId).catch(console.error);
  }, []);

  const openAddMember = useCallback(() => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  }, []);

  const openEditMember = useCallback((member: FamilyMember) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  }, []);

  const closeMemberModal = useCallback(() => {
    setEditingMember(null);
    setIsMemberModalOpen(false);
  }, []);

  const openEventModal = useCallback(() => {
    setIsEventModalOpen(true);
  }, []);

  const closeEventModal = useCallback(() => {
    setIsEventModalOpen(false);
  }, []);

  const openAddChoreModal = useCallback(() => {
    setEditingChore(null);
    setIsAddChoreModalOpen(true);
  }, []);

  const openEditChoreModal = useCallback((chore: Chore) => {
    setEditingChore(chore);
    setIsEditChoreModalOpen(true);
  }, []);

  const closeChoreModals = useCallback(() => {
    setEditingChore(null);
    setIsAddChoreModalOpen(false);
    setIsEditChoreModalOpen(false);
  }, []);

  const openAddRewardModal = useCallback(() => {
    setIsAddRewardModalOpen(true);
  }, []);

  const closeAddRewardModal = useCallback(() => {
    setIsAddRewardModalOpen(false);
  }, []);

  const openManageChoreTypes = useCallback(() => {
    setIsManageChoreTypesOpen(true);
  }, []);

  const closeManageChoreTypes = useCallback(() => {
    setIsManageChoreTypesOpen(false);
  }, []);

  const openManageRoutines = useCallback(() => {
    setIsManageRoutinesOpen(true);
  }, []);

  const closeManageRoutines = useCallback(() => {
    setIsManageRoutinesOpen(false);
  }, []);

  const openPerformanceMonitor = useCallback(() => {
    setIsPerformanceMonitorOpen(true);
  }, []);

  const closePerformanceMonitor = useCallback(() => {
    setIsPerformanceMonitorOpen(false);
  }, []);

  const value: ModalStateValue = {
    activeTab,
    setActiveTab,
    handleTabChange,

    isEditingFamily,
    setIsEditingFamily,

    isMemberModalOpen,
    editingMember,
    openAddMember,
    openEditMember,
    closeMemberModal,

    isEventModalOpen,
    openEventModal,
    closeEventModal,

    isAddChoreModalOpen,
    isEditChoreModalOpen,
    editingChore,
    openAddChoreModal,
    openEditChoreModal,
    closeChoreModals,

    isAddRewardModalOpen,
    openAddRewardModal,
    closeAddRewardModal,

    isManageChoreTypesOpen,
    openManageChoreTypes,
    closeManageChoreTypes,

    isManageRoutinesOpen,
    openManageRoutines,
    closeManageRoutines,

    isPerformanceMonitorOpen,
    openPerformanceMonitor,
    closePerformanceMonitor
  };

  return (
    <ModalStateContext.Provider value={value}>
      {children}
    </ModalStateContext.Provider>
  );
};

export function useModalState(): ModalStateValue {
  const context = useContext(ModalStateContext);
  if (!context) {
    throw new Error('useModalState must be used within ModalStateProvider');
  }
  return context;
}
