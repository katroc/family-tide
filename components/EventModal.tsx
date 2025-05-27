import React, { useState, useEffect, useCallback } from 'react';
import { EventItem, FamilyMember } from '../types';
import { convertToHexColor } from '../utils/colorUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './react-datepicker-custom.css';
import { setMinutes, setHours } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Omit<EventItem, 'time'>) => void;
  familyMembers: FamilyMember[];
  eventColors: string[];
  defaultNewEventState: Omit<EventItem, 'id' | 'time'>;
  eventToEdit?: EventItem | null;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent,
  familyMembers,
  eventColors,
  defaultNewEventState,
  eventToEdit = null,
}) => {
  // Helper to parse ISO string to Date or fallback
  const parseDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };
  // Helper to parse HH:mm string to Date (today)
  const parseTime = (timeStr: string | undefined) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  };

  const [eventState, setEventState] = useState<any>({
    ...defaultNewEventState,
    ...(eventToEdit ? { ...eventToEdit } : {}),
    date: eventToEdit?.date || '',
    endTime: eventToEdit?.endTime || '',
  });
  const [pickerDate, setPickerDate] = useState<Date | null>(parseDate(eventToEdit?.date || defaultNewEventState.date));
  const [pickerEndTime, setPickerEndTime] = useState<Date | null>(parseTime(eventToEdit?.endTime || ''));

  useEffect(() => {
    if (isOpen) {
      setEventState(eventToEdit ? { ...eventToEdit } : { ...defaultNewEventState });
      setPickerDate(parseDate(eventToEdit?.date || defaultNewEventState.date));
      setPickerEndTime(parseTime(eventToEdit?.endTime || ''));
    }
  }, [isOpen, defaultNewEventState, eventToEdit]);

  const handleChange = useCallback((field: string, value: any) => {
    setEventState((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleDateChange = (date: Date | null) => {
    setPickerDate(date);
    handleChange('date', date ? date.toISOString() : '');
  };

  const handleEndTimeChange = (date: Date | null) => {
    setPickerEndTime(date);
    // Store as HH:mm string
    handleChange('endTime', date ? date.toTimeString().slice(0,5) : '');
  };

  const toggleAttendee = useCallback((memberName: string) => {
    setEventState(prev => ({
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
    if (eventState.title.trim() && eventState.date) {
      onSaveEvent(eventState); // endTime is included in eventState, but only date is persisted
    } else {
      alert("Please fill in all required fields: Title and Date/Time.");
    }
  }, [eventState, onSaveEvent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-50 rounded-2xl p-6 w-full max-w-md sm:max-w-xl lg:max-w-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{eventToEdit ? 'Edit Event' : 'Add New Event'}</h3>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Event Title</label>
            <input
              type="text"
              value={eventState.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
              placeholder="Enter event title"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Start Date & Time</label>
              <DatePicker
                selected={pickerDate}
                onChange={handleDateChange}
                showTimeSelect
                timeIntervals={15}
                dateFormat="yyyy-MM-dd h:mm aa"
                className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
                placeholderText="Select date and time"
                minDate={new Date()}
                autoComplete="off"
                popperPlacement="bottom"
                calendarClassName="rounded-xl shadow-lg border border-slate-200"
                popperClassName="z-50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">End Time</label>
              <DatePicker
                selected={pickerEndTime}
                onChange={handleEndTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="End Time"
                dateFormat="HH:mm"
                className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
                placeholderText="Select end time"
                autoComplete="off"
                popperPlacement="bottom"
                calendarClassName="rounded-xl shadow-lg border border-slate-200"
                popperClassName="z-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Attendees</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border border-slate-200 rounded-lg bg-slate-100/50 max-h-32 overflow-y-auto">
              {familyMembers.map(member => {
                const isSelected = eventState.attendees.includes(member.name);
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
                      ${eventState.color === color
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
            {eventToEdit ? 'Save Changes' : 'Add Event'}
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

export default EventModal;
    