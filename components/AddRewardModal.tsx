
import React, { useState, useEffect, useCallback } from 'react';
import { Reward } from '../types';
import { getRewardIcons, getIconName, getIcon } from '../utils/iconUtils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import FormField from './ui/FormField';

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

  const iconOptions = (availableIcons.length > 0 ? availableIcons : getRewardIcons()).map((icon) => {
    const emoji = getIcon(icon, icon);
    const name = getIconName(emoji);
    return { emoji, name };
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Reward"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Reward
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Reward Title" htmlFor="rewardTitle" required>
          <input
            id="rewardTitle"
            type="text"
            value={newReward.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-purple-500 focus:outline-none"
            placeholder="Enter reward title"
          />
        </FormField>

        <FormField label="Cost (Points)" htmlFor="rewardCost" required>
          <input
            id="rewardCost"
            type="number"
            min={0}
            value={newReward.cost}
            onChange={(e) => handleChange('cost', parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-purple-500 focus:outline-none"
            style={{ colorScheme: 'light' }}
          />
        </FormField>

        <FormField label="Select Icon" htmlFor="rewardIcon">
          <div
            id="rewardIcon"
            className="grid grid-cols-5 gap-2 rounded-lg border border-slate-200 bg-slate-100/50 p-2 sm:grid-cols-6"
          >
            {iconOptions.map(({ emoji, name }) => {
              const isSelected = newReward.icon === name || newReward.icon === emoji;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleChange('icon', name)}
                  className={`aspect-square rounded-lg border transition-all text-2xl ${
                    isSelected
                      ? 'border-purple-500 bg-purple-400 text-white ring-2 ring-purple-300'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-purple-100'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Select icon ${name}`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </FormField>
      </div>
    </Modal>
  );
};

export default AddRewardModal;
