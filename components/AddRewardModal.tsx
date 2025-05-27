
import React, { useState, useEffect, useCallback } from 'react';
import { Reward } from '../types';
import { XCircle } from 'lucide-react';

interface AddRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReward: (newRewardData: Omit<Reward, 'id'>) => void;
  defaultNewRewardState: Omit<Reward, 'id'>;
  availableIcons: string[];
}

const AddRewardModal: React.FC<AddRewardModalProps> = ({
  isOpen,
  onClose,
  onSaveReward,
  defaultNewRewardState,
  availableIcons,
}) => {
  const [newReward, setNewReward] = useState(defaultNewRewardState);

  useEffect(() => {
    if (isOpen) {
      setNewReward(defaultNewRewardState);
    }
  }, [isOpen, defaultNewRewardState]);

  const handleChange = useCallback(<K extends keyof Omit<Reward, 'id'>>(
    field: K,
    value: Omit<Reward, 'id'>[K]
  ) => {
    setNewReward(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (newReward.title.trim() === '') {
      alert("Reward title cannot be empty.");
      return;
    }
    if (newReward.cost < 0) {
      alert("Cost cannot be negative.");
      return;
    }
    if (newReward.icon.trim() === '') {
        alert("Please select an icon for the reward.");
        return;
    }
    onSaveReward(newReward);
  }, [newReward, onSaveReward]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-50 rounded-2xl p-6 w-full max-w-md sm:max-w-lg border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <span className="text-2xl mr-2">🏆</span> Add New Reward
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-600">
                <XCircle size={24} />
            </button>
        </div>
        
        <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-1">
          <div>
            <label htmlFor="rewardTitle" className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Reward Title</label>
            <input
              id="rewardTitle"
              type="text"
              value={newReward.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
              placeholder="Enter reward title"
            />
          </div>
          
          <div>
            <label htmlFor="rewardCost" className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Cost (Points)</label>
            <input
              id="rewardCost"
              type="number"
              value={newReward.cost}
              onChange={(e) => handleChange('cost', parseInt(e.target.value, 10) || 0)}
              min="0"
              className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
              style={{ colorScheme: 'light' }} // Fix for cost input spinners
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Select Icon</label>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 p-2 sm:p-3 border border-slate-200 rounded-lg bg-slate-100/50 max-h-40 overflow-y-auto">
              {availableIcons.map(icon => {
                // Map icon names to emoji icons
                const iconMap: { [key: string]: string } = {
                  // Original icons
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
                  // Food rewards
                  'pizza': '🍕',
                  'ice-cream': '🍦',
                  // Celebration
                  'balloon': '🎈',
                  'fireworks': '🎆',
                  // Outline variants
                  'gift-outline': '🎀',
                  'star-outline': '✨',
                  'trophy-outline': '🏆',
                  'medal-outline': '🎖️',
                  'award-outline': '🎖️'
                };
                
                const iconEmoji = iconMap[icon] || '❓';
                
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleChange('icon', icon)}
                    className={`
                      p-2 rounded-lg transition-all aspect-square flex items-center justify-center
                      text-2xl sm:text-3xl
                      ${newReward.icon === icon 
                        ? 'bg-purple-400 text-white scale-110 ring-2 ring-purple-500' 
                        : 'bg-white hover:bg-purple-100 text-slate-600 border border-slate-300 hover:scale-105'
                      }
                    `}
                    aria-label={`Select icon ${icon}`}
                    title={icon}
                  >
                    {iconEmoji}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            className="flex-1 bg-purple-400 text-white py-3 px-4 sm:py-4 sm:px-6 rounded-xl hover:bg-purple-500 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
          >
            Save Reward
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-300 text-slate-600 py-3 px-4 sm:py-4 sm:px-6 rounded-xl hover:bg-slate-400 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRewardModal;
