import React, { useState, useEffect, useCallback } from 'react';
import { EventItem, FamilyMember } from '../types';
import { convertToHexColor } from '../utils/colorUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './react-datepicker-custom.css';
import Modal from './ui/Modal';
import Button from './ui/Button';
import FormField from './ui/FormField';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit Event' : 'Add New Event'}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Event
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Event Title" htmlFor="eventTitle" required>
          <input
            id="eventTitle"
            type="text"
            value={eventState.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
            placeholder="Enter event title"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Start Date & Time" htmlFor="eventStart" required>
            <DatePicker
              id="eventStart"
              selected={pickerDate}
              onChange={handleDateChange}
              showTimeSelect
              timeIntervals={15}
              dateFormat="yyyy-MM-dd h:mm aa"
              className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
              placeholderText="Select date and time"
              minDate={new Date()}
              autoComplete="off"
              popperPlacement="bottom"
              calendarClassName="rounded-xl border border-slate-200 shadow-lg"
              popperClassName="z-50"
            />
          </FormField>

          <FormField label="End Time" htmlFor="eventEnd">
            <DatePicker
              id="eventEnd"
              selected={pickerEndTime}
              onChange={handleEndTimeChange}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="End Time"
              dateFormat="HH:mm"
              className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
              placeholderText="Select end time"
              autoComplete="off"
              popperPlacement="bottom"
              calendarClassName="rounded-xl border border-slate-200 shadow-lg"
              popperClassName="z-50"
            />
          </FormField>
        </div>

        <FormField label="Attendees" htmlFor="eventAttendees">
          <div
            id="eventAttendees"
            className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-100/50 p-2 sm:grid-cols-3"
          >
            {familyMembers.map(member => {
              const isSelected = eventState.attendees.includes(member.name);
              const memberColor = getMemberColor(member.name);

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleAttendee(member.name)}
                  className={`w-full rounded-lg p-2 text-left text-xs transition-all sm:text-sm ${
                    isSelected
                      ? 'font-semibold text-white shadow-md'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: memberColor,
                          border: `2px solid ${memberColor}`,
                          boxShadow: `0 0 0 1px #ffffff, 0 0 0 3px ${memberColor}`
                        }
                      : {}
                  }
                  aria-pressed={isSelected}
                >
                  {member.name}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Event Color" htmlFor="eventColor">
          <div id="eventColor" className="flex flex-wrap gap-2">
            {eventColors.map(color => {
              const hexColor = convertToHexColor(color);
              const isSelected = eventState.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`h-10 w-10 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-slate-700 scale-110 ring-2 ring-offset-1 ring-slate-700'
                      : 'border-slate-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: hexColor }}
                  aria-pressed={isSelected}
                  aria-label={`Select color ${color}`}
                />
              );
            })}
          </div>
        </FormField>
      </div>
    </Modal>
  );
};

export default EventModal;
    
