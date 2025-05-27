import React from 'react';
import { TabId, NavigationItem } from '../types';
import { Users, List, Repeat, Calendar } from 'lucide-react';

// Map string icons to components
const iconMap = {
  people: Users,
  list: List,
  repeat: Repeat,
  calendar: Calendar
};

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  items: NavigationItem[];
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, items }) => {
  return (
    <div className="bg-slate-100/90 backdrop-blur-sm border-t border-slate-200 px-6 py-2 sticky bottom-0 z-20">
      <div className="flex justify-center space-x-8 sm:space-x-16">
        {items.map(tab => {
          const IconComponent = iconMap[tab.icon as keyof typeof iconMap];
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-4 sm:py-2 sm:px-8 transition-all min-h-[44px] ${
                activeTab === tab.id
                  ? 'text-teal-600'
                  : 'text-slate-600 hover:text-teal-600'
              }`}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {IconComponent && <IconComponent size={20} />}
              <span className="text-xs sm:text-sm font-medium mt-1">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="w-8 sm:w-12 h-1 bg-teal-600 rounded-full mt-1"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;