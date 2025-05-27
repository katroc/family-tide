
import React, { useState, useEffect, useCallback } from 'react';
import { EventItem, FamilyMember } from '../types';
import { convertToHexColor } from '../utils/colorUtils';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (newEventData: Omit<EventItem, 'id' | 'time'>) => void;
  familyMembers: FamilyMember[];
  eventColors: string[];
  defaultNewEventState: Omit<EventItem, 'id' | 'time'>;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent,
  familyMembers,
  eventColors,
  defaultNewEventState,
}) => {
  const [newEvent, setNewEvent] = useState(defaultNewEventState);

  useEffect(() => {
    if (isOpen) {
      setNewEvent(defaultNewEventState);
    }
  }, [isOpen, defaultNewEventState]);

  const handleChange = useCallback(<K extends keyof typeof defaultNewEventState,>(field: K, value: (typeof defaultNewEventState)[K]) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleAttendee = useCallback((memberName: string) => {
    setNewEvent(prev => ({
      ...prev,
      attendees: prev.attendees.includes(memberName)
        ? prev.attendees.filter(name => name !== memberName)
        : [...prev.attendees, memberName]
    }));
  }, []);

  const getMemberColor = useCallback((memberName: string) => {
    const member = familyMembers.find(m => m.name === memberName);
    return convertToHexColor(member?.color);
  }, [familyMembers]);

  const handleSave = useCallback(() => {
    if (newEvent.title.trim() && newEvent.startTime && newEvent.endTime && newEvent.day) {
      if (newEvent.startTime >= newEvent.endTime) {
        alert("End time must be after start time.");
        return;
      }
      onSaveEvent(newEvent);
    } else {
      alert("Please fill in all required fields: Title, Day, Start Time, End Time.");
    }
  }, [newEvent, onSaveEvent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-50 rounded-2xl p-6 w-full max-w-md sm:max-w-xl lg:max-w-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Event</h3>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Event Title</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
              placeholder="Enter event title"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Day</label>
            <select
              value={newEvent.day}
              onChange={(e) => handleChange('day', e.target.value)}
              className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
            >
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <option key={day} value={day}>{day}day</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Start Time</label>
              <input
                type="time"
                value={newEvent.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
                style={{ colorScheme: 'light' }}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">End Time</label>
              <input
                type="time"
                value={newEvent.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Attendees</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border border-slate-200 rounded-lg bg-slate-100/50 max-h-32 overflow-y-auto">
              {familyMembers.map(member => {
                const isSelected = newEvent.attendees.includes(member.name);
                const memberColor = getMemberColor(member.name);
                
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleAttendee(member.name)}
                    className={`p-2 rounded-lg text-xs sm:text-sm w-full text-left transition-all
                      ${isSelected 
                        ? 'text-white font-semibold shadow-md transform scale-[1.02]' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:scale-[1.02]'
                      }
                    `}
                    style={isSelected ? { 
                      backgroundColor: memberColor,
                      border: `2px solid ${memberColor}`,
                      boxShadow: `0 0 0 1px white, 0 0 0 3px ${memberColor}`,
                      color: '#ffffff'
                    } : {}}
                    aria-label={`${isSelected ? 'Remove' : 'Add'} ${member.name} as attendee`}
                    aria-pressed={isSelected}
                  >
                    {member.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Event Color</label>
            <div className="flex flex-wrap gap-2">
              {eventColors.map((color, index) => {
                // Use the color utility to get consistent hex values
                const hexColor = convertToHexColor(color);
                const colorName = color.replace('bg-', '').replace('-200', '');
                
                return (
                  <button
                    key={color}
                    onClick={() => handleChange('color', color)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all
                      ${newEvent.color === color
                        ? 'border-slate-700 scale-110 ring-2 ring-offset-1 ring-slate-700'
                        : 'border-slate-200 hover:scale-105'
                      }
                    `}
                    style={{ backgroundColor: hexColor }}
                    aria-label={`Select color ${colorName}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-5 sm:mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-teal-500 text-white py-3 px-4 sm:py-4 sm:px-6 rounded-xl hover:bg-teal-600 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
          >
            Add Event
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

export default AddEventModal;
    