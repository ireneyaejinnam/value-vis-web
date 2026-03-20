import { useState, useEffect, useRef } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';
import { ChevronLeft, ChevronRight, Plus, Brain, Calendar, RefreshCw } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { MentalRehearsalModal } from '../components/calendar/MentalRehearsalModal';
import { colorVariantText } from '../components/common/ColorVariantBadge';
import { VALUES } from '../constants/onboarding';
import type { CalendarEvent, ColorVariant } from '../types';
import { getTodayString } from '../utils/date';
import { COLOR_OPTIONS } from '../types';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_NAMES_SHORT = ['S','M','T','W','T','F','S'];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => { const dd = new Date(d); dd.setDate(d.getDate() + i); return dd; });
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarPage() {
  const store = useAppStore();
  const today = getTodayString();
  const [calView, setCalView] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showMR, setShowMR] = useState(false);

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(y, m);
  const firstDay = getFirstDayOfMonth(y, m);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const eventsForDate = (date: string) => store.calendarEvents.filter((e) => e.date === date);
  const selectedEvents = eventsForDate(selectedDate);
  const mrCompleted = store.mentalRehearsalCompletedDates.includes(selectedDate);

  // Keep currentDate in sync with selectedDate for week/month nav
  useEffect(() => {
    const parts = selectedDate.split('-').map(Number);
    setCurrentDate(new Date(parts[0], parts[1] - 1, parts[2]));
  }, [selectedDate]);

  async function syncGoogleCalendar() {
    setSyncing(true);
    setSyncError('');
    try {
      const calendarProvider = new GoogleAuthProvider();
      calendarProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      calendarProvider.setCustomParameters({ prompt: 'consent', access_type: 'offline' });

      const result = await signInWithPopup(auth, calendarProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) throw new Error('No access token returned from Google');
      store.setGoogleAccessToken(token);

      const timeMin = new Date(y, m - 1, 1).toISOString();
      const timeMax = new Date(y, m + 2, 0).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(`Google API error: ${resp.status}`);
      const data = await resp.json();

      const items = (data.items ?? []).map((item: any) => {
        const start = item.start?.dateTime ?? item.start?.date ?? '';
        const end = item.end?.dateTime ?? item.end?.date ?? '';
        const isAllDay = !item.start?.dateTime;
        const date = start.slice(0, 10);
        const time = isAllDay ? 'All day' : new Date(start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = isAllDay ? undefined : new Date(end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        return { externalId: item.id, title: item.summary ?? '(No title)', description: item.description, date, time, endTime, isAllDay };
      });

      store.importExternalCalendarItems(items);
      store.setGoogleCalendarConnected(true);
      store.setGoogleCalendarLastSyncedAt(new Date().toISOString());
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setSyncError(err.message ?? 'Sync failed');
      }
    } finally {
      setSyncing(false);
    }
  }

  function prevPeriod() {
    if (calView === 'day') {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      setSelectedDate(toDateStr(d));
    } else if (calView === 'week') {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() - 7);
      setSelectedDate(toDateStr(d));
    } else {
      setCurrentDate(new Date(y, m - 1, 1));
      const d = new Date(y, m - 1, 1);
      setSelectedDate(toDateStr(d));
    }
  }

  function nextPeriod() {
    if (calView === 'day') {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      setSelectedDate(toDateStr(d));
    } else if (calView === 'week') {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + 7);
      setSelectedDate(toDateStr(d));
    } else {
      setCurrentDate(new Date(y, m + 1, 1));
      const d = new Date(y, m + 1, 1);
      setSelectedDate(toDateStr(d));
    }
  }

  function periodLabel() {
    if (calView === 'day') {
      const d = new Date(selectedDate + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    if (calView === 'week') {
      const week = getWeekDates(new Date(selectedDate + 'T00:00:00'));
      const start = week[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = week[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} – ${end}`;
    }
    return `${MONTH_NAMES[m]} ${y}`;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top toolbar */}
      <div className="px-5 py-3 border-b border-border bg-surface flex items-center justify-between flex-shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-text-primary min-w-[140px] text-center">{periodLabel()}</span>
          <button onClick={nextPeriod} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><ChevronRight size={16} /></button>
        </div>

        {/* View toggle */}
        <div className="flex bg-surface-2 rounded-lg p-0.5 border border-border">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button key={v} onClick={() => setCalView(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${calView === v ? 'bg-white text-text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-primary'}`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={syncGoogleCalendar} disabled={syncing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${store.googleCalendarConnected ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-border bg-surface text-text-muted hover:text-primary hover:border-primary/40'}`}
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : store.googleCalendarConnected ? 'Google Synced ✓' : 'Import Google Calendar'}
          </button>
          <button onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            <Plus size={13} /> Add Event
          </button>
        </div>
      </div>

      {syncError && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-100 flex-shrink-0">
          <p className="text-xs text-red-600">{syncError}</p>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mini calendar sidebar — shown only in day view */}
        {calView === 'day' && (
          <div className="w-64 border-r border-border bg-surface flex-shrink-0 flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setCurrentDate(new Date(y, m - 1, 1))} className="p-1 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><ChevronLeft size={14} /></button>
                <span className="text-xs font-semibold text-text-primary">{MONTH_NAMES[m]} {y}</span>
                <button onClick={() => setCurrentDate(new Date(y, m + 1, 1))} className="p-1 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><ChevronRight size={14} /></button>
              </div>
              <div className="grid grid-cols-7 mb-0.5">
                {DAY_NAMES_SHORT.map((d, i) => <div key={i} className="text-center text-[10px] text-text-muted py-0.5 font-medium">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  const hasEvents = eventsForDate(dateStr).length > 0;
                  return (
                    <button key={day} onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all relative ${
                        isSelected ? 'bg-primary text-white font-semibold shadow-sm' :
                        isToday ? 'bg-primary/10 text-primary font-semibold' :
                        'hover:bg-surface-2 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {day}
                      {hasEvents && !isSelected && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary opacity-70" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rehearse button in sidebar */}
            <div className="p-3">
              <button onClick={() => setShowMR(true)}
                className="w-full rounded-2xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <img
                  src={mrCompleted ? '/genie/rehearsal_complete.png' : '/genie/rehearsal_banner.png'}
                  alt="Mental Rehearsal"
                  className="w-full object-cover group-hover:opacity-95 transition-opacity"
                  style={{ aspectRatio: '956/336' }}
                />
                <div className={`px-3 py-2 flex items-center justify-between ${mrCompleted ? 'bg-emerald-50' : 'bg-white'}`}>
                  <span className={`text-xs font-semibold ${mrCompleted ? 'text-emerald-600' : 'text-primary'}`}>
                    {mrCompleted ? 'Rehearsed ✓' : 'Mental Rehearsal'}
                  </span>
                  <Brain size={13} className={mrCompleted ? 'text-emerald-500' : 'text-primary'} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Calendar view area */}
        <div className={`flex-1 bg-bg ${calView === 'month' ? 'overflow-y-auto' : 'overflow-hidden flex flex-col'}`}>
          {calView === 'day' && (
            <DayView
              date={selectedDate}
              events={selectedEvents}
              today={today}
              onEdit={(e) => { setEditingEvent(e); setShowEventModal(true); }}
              onAdd={() => { setEditingEvent(null); setShowEventModal(true); }}
            />
          )}
          {calView === 'week' && (
            <WeekView
              selectedDate={selectedDate}
              today={today}
              eventsForDate={eventsForDate}
              onSelectDate={(d) => { setSelectedDate(d); setCalView('day'); }}
              onEdit={(e) => { setEditingEvent(e); setShowEventModal(true); }}
            />
          )}
          {calView === 'month' && (
            <MonthView
              year={y}
              month={m}
              selectedDate={selectedDate}
              today={today}
              eventsForDate={eventsForDate}
              onSelectDate={(d) => { setSelectedDate(d); setCalView('day'); }}
            />
          )}
        </div>
      </div>

      <EventFormModal open={showEventModal} onClose={() => setShowEventModal(false)} event={editingEvent} defaultDate={selectedDate} />
      <MentalRehearsalModal open={showMR} onClose={() => setShowMR(false)} date={selectedDate} />
    </div>
  );
}

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function parseMinutes(time: string): number | null {
  if (!time || time === 'All day') return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return null;
  return h * 60 + (m || 0);
}

function TimeGrid({ columns, today, onEdit }: {
  columns: { date: string; label?: string; isSelected?: boolean; events: CalendarEvent[] }[];
  today: string;
  onEdit: (e: CalendarEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = Math.max(0, (currentMinutes - 60) / 60 * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="flex" style={{ height: HOUR_HEIGHT * 24 }}>
        {/* Hour labels */}
        <div className="w-14 flex-shrink-0 relative border-r border-border">
          {HOURS.map((h) => (
            <div key={h} className="absolute right-2 text-[10px] text-text-muted leading-none"
              style={{ top: h * HOUR_HEIGHT - 6 }}>
              {h > 0 ? formatHour(h) : ''}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {columns.map((col) => {
          const isToday = col.date === today;
          const timed = col.events.filter((e) => e.time !== 'All day' && !e.isAllDay && parseMinutes(e.time) !== null);
          return (
            <div key={col.date} className="flex-1 relative border-l border-border min-w-0">
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div key={h} className="absolute w-full border-t border-border/40" style={{ top: h * HOUR_HEIGHT }} />
              ))}
              {/* Current time indicator */}
              {isToday && (
                <div className="absolute w-full flex items-center z-10 pointer-events-none"
                  style={{ top: (currentMinutes / 60) * HOUR_HEIGHT }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 -ml-1.5" />
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              )}
              {/* Timed events */}
              {timed.map((e) => {
                const startMin = parseMinutes(e.time)!;
                const top = (startMin / 60) * HOUR_HEIGHT;
                const color = colorVariantText(e.colorVariant);
                return (
                  <button key={e.id} onClick={() => onEdit(e)}
                    className="absolute left-1 right-1 rounded-lg px-1.5 py-1 text-left overflow-hidden hover:opacity-90 transition-opacity"
                    style={{ top: top + 1, minHeight: 28, background: color + '20', borderLeft: `3px solid ${color}` }}
                  >
                    <p className="text-[10px] font-semibold leading-tight truncate" style={{ color }}>{e.title}</p>
                    <p className="text-[9px] opacity-70 leading-tight" style={{ color }}>{e.time}</p>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ date, events, today, onEdit, onAdd }: {
  date: string; events: CalendarEvent[]; today: string;
  onEdit: (e: CalendarEvent) => void; onAdd: () => void;
}) {
  const allDay = events.filter((e) => e.time === 'All day' || e.isAllDay);
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* All-day events strip */}
      {allDay.length > 0 && (
        <div className="flex-shrink-0 border-b border-border px-4 py-2 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-text-muted w-14 flex-shrink-0 pt-1">All day</span>
          {allDay.map((e) => {
            const color = colorVariantText(e.colorVariant);
            return (
              <button key={e.id} onClick={() => onEdit(e)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md truncate max-w-[160px]"
                style={{ background: color + '20', color, borderLeft: `3px solid ${color}` }}
              >
                {e.title}
              </button>
            );
          })}
        </div>
      )}
      {/* Empty state */}
      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Calendar size={36} className="text-text-muted mb-3 opacity-50" />
          <p className="text-text-secondary text-sm">No events for this day</p>
          <button onClick={onAdd} className="mt-3 text-primary text-sm hover:underline">Add one</button>
        </div>
      ) : (
        <TimeGrid columns={[{ date, events }]} today={today} onEdit={onEdit} />
      )}
    </div>
  );
}

function WeekView({ selectedDate, today, eventsForDate, onSelectDate, onEdit }: {
  selectedDate: string; today: string;
  eventsForDate: (d: string) => CalendarEvent[];
  onSelectDate: (d: string) => void;
  onEdit: (e: CalendarEvent) => void;
}) {
  const week = getWeekDates(new Date(selectedDate + 'T00:00:00'));
  const columns = week.map((d) => ({
    date: toDateStr(d),
    label: DAY_NAMES[d.getDay()],
    day: d.getDate(),
    isSelected: toDateStr(d) === selectedDate,
    events: eventsForDate(toDateStr(d)),
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="flex flex-shrink-0 border-b border-border bg-surface">
        <div className="w-14 flex-shrink-0" />
        {columns.map((col) => {
          const isToday = col.date === today;
          const isSelected = col.isSelected;
          const allDay = col.events.filter((e) => e.time === 'All day' || e.isAllDay);
          return (
            <div key={col.date} className="flex-1 border-l border-border px-1 py-1.5 cursor-pointer hover:bg-surface-2 transition-colors"
              onClick={() => onSelectDate(col.date)}>
              <div className="flex items-center gap-1 justify-center mb-1">
                <span className="text-[10px] text-text-muted font-medium uppercase">{col.label}</span>
                <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${isSelected ? 'bg-primary text-white' : isToday ? 'bg-primary/15 text-primary' : 'text-text-primary'}`}>
                  {col.day}
                </span>
              </div>
              {allDay.map((e) => {
                const color = colorVariantText(e.colorVariant);
                return (
                  <div key={e.id} className="text-[9px] px-1 py-0.5 rounded truncate mb-0.5 font-medium"
                    style={{ background: color + '20', color }}>
                    {e.title}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* Time grid */}
      <TimeGrid columns={columns} today={today} onEdit={onEdit} />
    </div>
  );
}

function MonthView({ year, month, selectedDate, today, eventsForDate, onSelectDate }: {
  year: number; month: number; selectedDate: string; today: string;
  eventsForDate: (d: string) => CalendarEvent[];
  onSelectDate: (d: string) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  return (
    <div className="p-4">
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => <div key={d} className="text-center text-xs text-text-muted py-2 font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="min-h-[80px]" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const events = eventsForDate(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <div key={day} onClick={() => onSelectDate(dateStr)}
              className={`min-h-[80px] rounded-xl border p-1.5 cursor-pointer transition-all hover:border-primary/40 ${isSelected ? 'border-primary/60 bg-primary/5' : isToday ? 'border-primary/30 bg-primary/5' : 'border-border bg-white hover:bg-surface-2/50'}`}
            >
              <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isSelected ? 'bg-primary text-white' : isToday ? 'bg-primary/15 text-primary' : 'text-text-primary'}`}>
                {day}
              </span>
              <div className="space-y-0.5">
                {events.slice(0, 2).map((e) => (
                  <div key={e.id} className="text-[9px] leading-snug px-1 py-0.5 rounded truncate font-medium"
                    style={{ background: colorVariantText(e.colorVariant) + '25', color: colorVariantText(e.colorVariant) }}
                  >
                    {e.title}
                  </div>
                ))}
                {events.length > 2 && <p className="text-[9px] text-text-muted pl-0.5">+{events.length - 2}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-text-muted text-center mt-4">Click a day to see details</p>
    </div>
  );
}


function EventFormModal({ open, onClose, event, defaultDate }: { open: boolean; onClose: () => void; event: CalendarEvent | null; defaultDate: string }) {
  const store = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [linkedValue, setLinkedValue] = useState('');
  const [colorVariant, setColorVariant] = useState<ColorVariant>('mint');

  useEffect(() => {
    setTitle(event?.title ?? '');
    setDescription(event?.description ?? '');
    setDate(event?.date ?? defaultDate);
    setTime(event?.time && event?.time !== 'All day' ? event.time : '');
    setIsAllDay(event?.isAllDay ?? false);
    setLinkedValue(event?.linkedValue ?? '');
    setColorVariant(event?.colorVariant ?? 'mint');
  }, [event, defaultDate, open]);

  function handleSave() {
    if (!title.trim()) return;
    const data = { title: title.trim(), description: description.trim() || undefined, date, time: isAllDay ? 'All day' : (time || 'All day'), isAllDay, linkedValue: linkedValue || undefined, colorVariant, completed: event?.completed ?? false, source: (event?.source ?? 'native') as 'native' | 'external' };
    if (event) store.updateCalendarEvent(event.id, data);
    else store.addCalendarEvent(data);
    onClose();
  }

  const inputCls = "w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all";

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Edit Event' : 'New Event'}>
      <div className="p-5 space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className={inputCls} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className={inputCls + ' resize-none'} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="accent-primary" />
            <span className="text-sm text-text-secondary">All day</span>
          </label>
          {!isAllDay && <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text-primary outline-none focus:border-primary/60" />}
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">Link to value</p>
          <select value={linkedValue} onChange={(e) => setLinkedValue(e.target.value)} className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/60">
            <option value="">No value linked</option>
            {VALUES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">Color</p>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button key={c} onClick={() => setColorVariant(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${colorVariant === c ? 'border-gray-700 scale-110' : 'border-transparent'}`} style={{ background: colorVariantText(c) }} />
            ))}
          </div>
        </div>
        <button onClick={handleSave} disabled={!title.trim()} className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors">
          {event ? 'Save Changes' : 'Add Event'}
        </button>
      </div>
    </Modal>
  );
}
