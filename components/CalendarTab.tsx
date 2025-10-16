import React, { useState, useEffect, useMemo } from 'react';
import { EventItem, FamilyMember, DEFAULT_COLORS } from '../types';
import { Plus, Sun, Loader2, AlertTriangle, Wifi, WifiOff, Edit3, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { mapWeatherCodeToDescriptionAndIcon, WeatherDisplayInfo } from '../utils';
import { useRealtimeEvents } from '../hooks/useRealtimeData';
import EventModal from './EventModal';
import { dataService } from '../dataService';

import { uiLogger } from '../utils/logger';
interface EventWithPosition extends EventItem {
  position: {
    top: string;
    height: string;
    left: string;
    width: string;
  };
}

interface CalendarTabProps {
  events: EventItem[];
  familyMembers: FamilyMember[];
  onAddEvent: () => void;
  currentLocation: string | null;
  onEventsUpdated?: (events: EventItem[]) => void;
}

interface WeatherData {
  temperature: number;
  description: string;
  icon: React.ElementType;
}

interface WeekDayInfo {
  dayName: string;
  date: string;
  fullDate: Date;
  isCurrentDay: boolean;
}

const getWeekDays = (currentReferenceDate: Date): WeekDayInfo[] => {
  const days: WeekDayInfo[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = currentReferenceDate.getDay();
  const currentDayOfMonth = currentReferenceDate.getDate();

  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(currentReferenceDate);
  monday.setDate(currentDayOfMonth + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);

    const isCurrentDay = day.getFullYear() === today.getFullYear() &&
      day.getMonth() === today.getMonth() &&
      day.getDate() === today.getDate();
    days.push({
      dayName: dayNames[i],
      date: day.getDate().toString(),
      fullDate: day,
      isCurrentDay: isCurrentDay,
    });
  }
  return days;
};

// Function to check if two events overlap (using date property)
const eventsOverlap = (a: EventItem, b: EventItem): boolean => {
  const aDate = new Date(a.date);
  const bDate = new Date(b.date);
  // Only overlap if on the same day
  if (
    aDate.getFullYear() !== bDate.getFullYear() ||
    aDate.getMonth() !== bDate.getMonth() ||
    aDate.getDate() !== bDate.getDate()
  ) return false;

  const aStart = aDate.getHours() * 60 + aDate.getMinutes();
  const aEnd = a.endTime
    ? (() => { const [h, m] = a.endTime.split(':').map(Number); return h * 60 + m; })()
    : aStart + 60;
  const bStart = bDate.getHours() * 60 + bDate.getMinutes();
  const bEnd = b.endTime
    ? (() => { const [h, m] = b.endTime.split(':').map(Number); return h * 60 + m; })()
    : bStart + 60;

  return aStart < bEnd && bStart < aEnd;
};

// Function to process events and calculate their positions (using date property)
const processEvents = (events: EventItem[], dayDate: Date): EventWithPosition[] => {
  // Filter events for the current day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getFullYear() === dayDate.getFullYear() &&
      eventDate.getMonth() === dayDate.getMonth() &&
      eventDate.getDate() === dayDate.getDate()
    );
  });
  if (dayEvents.length === 0) return [];

  // Sort events by start time
  const sortedEvents = [...dayEvents].sort((a, b) => {
    const aStart = new Date(a.date).getHours() * 60 + new Date(a.date).getMinutes();
    const bStart = new Date(b.date).getHours() * 60 + new Date(b.date).getMinutes();
    return aStart - bStart;
  });

  // Create columns for non-overlapping events
  const columns: EventItem[][] = [];
  
  // Assign each event to the first column where it doesn't overlap with ANY event in that column
  sortedEvents.forEach(event => {
    let placed = false;
    for (const column of columns) {
      const hasOverlapInColumn = column.some(existingEvent => eventsOverlap(existingEvent, event));
      if (!hasOverlapInColumn) {
        column.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
    }
  });

  // Calculate positions for each event
  const result: EventWithPosition[] = [];
  const columnWidth = 100 / columns.length;
  const rowHeightPercent = 100 / 15;

  columns.forEach((column, columnIndex) => {
    column.forEach(event => {
      const eventDate = new Date(event.date);
      const startMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
      const endMinutes = event.endTime
        ? (() => { const [h, m] = event.endTime.split(':').map(Number); return h * 60 + m; })()
        : startMinutes + 60;
      const adjustedStart = Math.max(420, startMinutes) - 420; // 7am = 420 minutes
      const adjustedEnd = Math.min(1260, endMinutes) - 420;    // 10pm = 1260 minutes
      let top = (adjustedStart / 840) * 100 - rowHeightPercent / 2;
      if (top < 0) top = 0;
      const height = ((adjustedEnd - adjustedStart) / 840) * 100;
      const left = columnIndex * columnWidth;
      result.push({
        ...event,
        position: {
          top: `${top}%`,
          height: `${height}%`,
          left: `${left}%`,
          width: `${columnWidth}%`
        }
      });
    });
  });
  return result;
};

// Utility to get an offset Tailwind color class for the avatar
function getOffsetColorClass(colorClass: string | undefined): string {
  if (!colorClass) return 'bg-slate-200';
  // Try to match bg-<color>-<shade>
  const match = colorClass.match(/^(bg-)?([a-z]+)-(\d{3})$/);
  if (!match) return colorClass;
  const [, , base, shadeStr] = match;
  const shade = parseInt(shadeStr, 10);
  // Always go lighter
  let newShade = shade - 100;
  if (newShade < 50) newShade = 50;
  return `bg-${base}-${newShade}`;
}

// Tooltip component for avatar hover (right side, themed)
const AvatarTooltip: React.FC<{ name: string; email?: string }> = ({ name, email }) => (
  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs shadow-xl border border-teal-300 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
    <div className="font-semibold">{name}</div>
    {email && <div className="text-teal-100 text-[10px]">{email}</div>}
  </div>
);

const CalendarTab: React.FC<CalendarTabProps> = ({ events, familyMembers, onAddEvent, currentLocation, onEventsUpdated }) => {
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: undefined }));
  const [currentReferenceDate, setCurrentReferenceDate] = useState(new Date());
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Real-time events monitoring
  const { isConnected: isRealtimeConnected, lastUpdate } = useRealtimeEvents((eventType, record) => {
    uiLogger.debug('Real-time event update', { eventType, recordId: record?.id });
    // The parent component will handle the actual data refresh via the RealtimeProvider
  });

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: undefined }));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (currentLocation) {
      setIsWeatherLoading(true);
      setWeatherData(null);
      setWeatherError(null);

      // Extract just the city/town/suburb from the full address
      let locationQuery = '';
      const locationParts = currentLocation.split(',').map(part => part.trim());

      if (locationParts.length > 1) {
        // Address has commas, take the second-to-last part (usually the suburb/city)
        locationQuery = locationParts[locationParts.length - 2];
      } else {
        // No commas - try to extract suburb from string like "32 Ancher St Taylor ACT"
        const addressStr = locationParts[0];

        // Australian state/territory codes
        const australianStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

        // Try to find state code and extract suburb before it
        const words = addressStr.split(/\s+/);
        const stateIndex = words.findIndex(word => australianStates.includes(word.toUpperCase()));

        if (stateIndex > 0) {
          // Found state code, take the word before it (suburb)
          locationQuery = words[stateIndex - 1];
        } else {
          // No state code found, try to extract last 1-2 words (likely suburb)
          // Skip street numbers and common street types
          const streetTypes = ['ST', 'STREET', 'RD', 'ROAD', 'AVE', 'AVENUE', 'DR', 'DRIVE', 'CT', 'COURT', 'PL', 'PLACE'];
          const meaningfulWords = words.filter(word => {
            const upper = word.toUpperCase();
            return isNaN(Number(word)) && !streetTypes.includes(upper);
          });

          // Take last 1-2 meaningful words as the suburb/city
          locationQuery = meaningfulWords.slice(-2).join(' ');
        }
      }

      if (!locationQuery) {
        setIsWeatherLoading(false);
        setWeatherError('Invalid location format');
        return;
      }

      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationQuery)}&count=1&language=en&format=json`)
        .then(response => response.json())
        .then(geoData => {
          if (geoData?.results?.[0]) {
            const { latitude, longitude } = geoData.results[0];
            return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`);
          } else {
            throw new Error(`Could not find location: ${locationQuery}`);
          }
        })
        .then(response => response.json())
        .then(meteoData => {
          if (meteoData?.current) {
            const { temperature_2m, weather_code } = meteoData.current;
            const weatherInfo = mapWeatherCodeToDescriptionAndIcon(weather_code);
            setWeatherData({
              temperature: Math.round(temperature_2m),
              description: weatherInfo.description,
              icon: weatherInfo.icon,
            });
          } else {
            throw new Error('Weather data format incorrect.');
          }
        })
        .catch(error => {
          uiLogger.error('Weather fetch error', error as Error);
          // Only show the first part of the error message to avoid showing the full URL
          const errorMessage = error.message.split('\n')[0];
          setWeatherError(errorMessage);
        })
        .finally(() => {
          setIsWeatherLoading(false);
        });
    } else {
      setWeatherData(null);
      setIsWeatherLoading(false);
      setWeatherError(null);
    }
  }, [currentLocation]);

  const currentWeekDays = useMemo(() => getWeekDays(currentReferenceDate), [currentReferenceDate]);
  const timeSlots = ['7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm'];

  const WeatherIcon = weatherData?.icon || Sun;

  // Get current month and year string
  const monthYear = currentReferenceDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="h-full flex flex-col">
      {/* Header with Month, Time, Weather */}
      <div className="flex flex-col sm:flex-row items-center mb-4 sm:mb-6 gap-3">
        {/* Month/Year, Time, Weather, with week navigation */}
        <div className="flex items-center gap-2 sm:gap-3 order-first w-full sm:w-auto">
          {/* Previous week button */}
          <button
            className="rounded-full bg-slate-100/80 hover:bg-teal-100 p-2 sm:p-2.5 shadow-md flex items-center justify-center text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            aria-label="Previous week"
            onClick={() => setCurrentReferenceDate(prev => {
              const d = new Date(prev);
              d.setDate(d.getDate() - 7);
              return d;
            })}
            style={{ minWidth: 40, minHeight: 40 }}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="text-teal-700 font-bold text-base sm:text-xl bg-slate-100/80 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-md min-w-[120px] flex items-center justify-center min-h-[40px] sm:min-h-[48px]">
            {monthYear}
          </div>
          {/* Next week button */}
          <button
            className="rounded-full bg-slate-100/80 hover:bg-teal-100 p-2 sm:p-2.5 shadow-md flex items-center justify-center text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            aria-label="Next week"
            onClick={() => setCurrentReferenceDate(prev => {
              const d = new Date(prev);
              d.setDate(d.getDate() + 7);
              return d;
            })}
            style={{ minWidth: 40, minHeight: 40 }}
          >
            <ChevronRight size={22} />
          </button>
          <div className="text-slate-600 font-medium text-sm sm:text-base bg-slate-100/80 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-md min-w-[100px] sm:min-w-[110px] flex items-center justify-center min-h-[40px] sm:min-h-[48px]">
            {currentTime}
          </div>
          <div className="bg-slate-100/80 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-md flex items-center min-h-[40px] sm:min-h-[48px]">
            {isWeatherLoading ? (
              <Loader2 className="animate-spin text-teal-500 mr-1.5 sm:mr-2" size={20} />
            ) : weatherData ? (
              <WeatherIcon className="text-orange-400 mr-1.5 sm:mr-2" size={20} />
            ) : (
              <AlertTriangle className="text-red-500 mr-1.5 sm:mr-2" size={20} />
            )}
            <span className="text-slate-600 font-medium text-sm sm:text-base whitespace-nowrap">
              {isWeatherLoading ? (
                'Loading...'
              ) : weatherError ? (
                weatherError.startsWith('Could not find location:') ? 'City not found' : 'Weather N/A'
              ) : weatherData ? (
                currentLocation ? (
                  `${weatherData.temperature}°C in ${currentLocation.split(',').map(part => part.trim())[1] || currentLocation.split(',').map(part => part.trim())[0]}`
                ) : (
                  `${weatherData.temperature}°C`
                )
              ) : currentLocation ? (
                'Getting weather...'
              ) : (
                'Set address'
              )}
            </span>
          </div>
        </div>

        <div className="hidden sm:block sm:flex-grow"></div>

        <button
          onClick={onAddEvent}
          className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg transition-colors flex items-center gap-2 min-h-[40px] sm:min-h-[48px] sm:order-last self-start sm:self-center w-full sm:w-auto justify-center"
          aria-label="Add New Event"
        >
          <Plus size={18} />
          <span className="text-xs sm:text-sm font-medium">Add Event</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-50/60 backdrop-blur-sm rounded-3xl p-3 sm:p-6 shadow-lg flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Time Gutter */}
          <div className="w-10 sm:w-16 flex flex-col mr-2 sm:mr-4">
            <div className="h-10 sm:h-14 flex items-center justify-end pr-1 sm:pr-2">
              <span className="text-xs text-slate-500 font-medium"></span>
            </div>
            {timeSlots.map(time => (
              <div key={time} className="flex-1 flex items-start justify-end pr-1 sm:pr-2 pt-0.5 sm:pt-1">
                <span className="text-[10px] sm:text-xs text-slate-500">{time}</span>
              </div>
            ))}
            <div className="flex-1 flex items-start justify-end pr-1 sm:pr-2 pt-0.5 sm:pt-1">
              <span className="text-[10px] sm:text-xs text-slate-500">10pm</span>
            </div>
          </div>

          {/* Main Calendar Days */}
          <div className="flex-1 flex gap-1 sm:gap-2 overflow-x-auto"> {/* Ensure overflow-x-auto */}
            {currentWeekDays.map((dayInfo) => (
              <div
                key={dayInfo.dayName}
                className={`
                  ${dayInfo.isCurrentDay ? 'flex-[2_1_0%] sm:flex-[3_1_0%] min-w-[120px]' : 'flex-[1_1_0%] min-w-[80px]'}
                  flex flex-col rounded-lg sm:rounded-xl border
                  ${dayInfo.isCurrentDay ? 'bg-teal-50/60 border-teal-400/70' : 'bg-slate-50/50 border-slate-200/30'}
                `}
              >
                {/* Day Header */}
                <div className={`h-10 sm:h-14 flex flex-col items-center justify-center border-b
                  ${dayInfo.isCurrentDay ? 'border-teal-300/50' : 'border-slate-200/50'}
                  ${dayInfo.isCurrentDay ? 'bg-teal-100/40' : ''}
                `}>
                  <span className={`font-semibold text-xs sm:text-sm ${dayInfo.isCurrentDay ? 'text-teal-700' : 'text-slate-600'}`}>{dayInfo.dayName}</span>
                  <span className={`text-sm sm:text-lg ${dayInfo.isCurrentDay ? 'text-teal-600 font-bold' : 'text-slate-500'}`}>{dayInfo.date}</span>
                </div>

                {/* Day Content Area */}
                <div className="flex-1 relative p-1 sm:p-2">
                  {/* Time slot grid lines */}
                  <div className="absolute inset-0 sm:inset-x-2 sm:inset-y-0 grid grid-rows-15 pointer-events-none">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div key={i} className={`border-b ${dayInfo.isCurrentDay ? 'border-teal-100/60' : 'border-slate-100/50'} last:border-b-0`}></div>
                    ))}
                  </div>

                  {/* Events for this day */}
                  {processEvents(events, dayInfo.fullDate).map((event) => {
                    // Find attendee info
                    const attendeeMembers = (event.attendees || [])
                      .map((name: string) => familyMembers.find(m => m.name === name))
                      .filter(Boolean);
                    const maxAvatars = 3;
                    const extraCount = attendeeMembers.length > maxAvatars ? attendeeMembers.length - maxAvatars : 0;
                    // Debug log
                    if (attendeeMembers.length > 0) {
                      uiLogger.debug('Event attendees', { eventTitle: event.title, attendeeCount: attendeeMembers.length });
                    }
                    return (
                      <div
                        key={event.id}
                        className={`absolute rounded-md sm:rounded-lg p-1 shadow-sm z-10 overflow-hidden flex flex-col group/event`}
                        style={{
                          top: event.position.top,
                          left: event.position.left,
                          width: event.position.width,
                          height: event.position.height,
                          minHeight: '24px',
                          maxHeight: '100%',
                        }}
                        title={`${event.title} (${event.time})`}
                      >
                        {/* Edit button, visible on hover */}
                        <button
                          className="absolute top-1 right-1 opacity-0 group-hover/event:opacity-100 bg-white/80 hover:bg-teal-500 hover:text-white text-slate-600 rounded-full p-1 shadow transition-opacity z-20"
                          style={{ transition: 'opacity 0.2s' }}
                          onClick={e => { e.stopPropagation(); setEditingEvent(event); }}
                          aria-label="Edit event"
                        >
                          <Edit3 size={14} />
                        </button>
                        <div className={`w-full h-full rounded-md sm:rounded-lg p-1 ${event.color || 'bg-slate-200'}`}>
                          <div
                            className="text-[10px] font-medium text-slate-600 leading-none break-words"
                            style={{
                              lineHeight: '1.1',
                              maxHeight: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as const
                            }}
                          >
                            {event.title}
                          </div>
                          <div className="text-[9px] text-slate-600 leading-none mt-0.5">
                            {(() => {
                              const d = new Date(event.date);
                              const start = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              if (event.endTime) {
                                return `${start} - ${event.endTime}`;
                              }
                              return start;
                            })()}
                          </div>
                          {/* Attendees Avatars */}
                          {attendeeMembers.length > 0 && (
                            <div className="flex items-center mt-1 space-x-1">
                              {attendeeMembers.slice(0, maxAvatars).map((member, idx) => (
                                <div
                                  key={member.id}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm ${getOffsetColorClass(member.color)} relative group`}
                                  style={{ zIndex: 10 - idx }}
                                >
                                  {member.photo ? (
                                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover rounded-full" />
                                  ) : (
                                    member.name?.[0] || '?'
                                  )}
                                  <AvatarTooltip name={member.name} email={member.email} />
                                </div>
                              ))}
                              {extraCount > 0 && (
                                <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm" style={{ zIndex: 0 }}>
                                  +{extraCount}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Event Modal (uses EventModal) */}
      {editingEvent && (
        <EventModal
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaveEvent={async (event) => {
            try {
              await dataService.updateEvent(event);
              if (onEventsUpdated) {
                const updatedEvents = await dataService.getEvents();
                onEventsUpdated(updatedEvents);
              }
              setEditingEvent(null);
            } catch (error) {
              uiLogger.error('Error updating event', error as Error);
              alert('Failed to update event. Please try again.');
            }
          }}
          familyMembers={familyMembers}
          eventColors={[...DEFAULT_COLORS]}
          defaultNewEventState={{
            title: '',
            date: '',
            color: DEFAULT_COLORS[0],
            attendees: []
          }}
          eventToEdit={editingEvent}
        />
      )}
    </div>
  );
};

export default CalendarTab;