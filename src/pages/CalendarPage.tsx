import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Edit3, Brain, Calendar, Clock, RefreshCw } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { MentalRehearsalModal } from '../components/calendar/MentalRehearsalModal';
import { ValueBadge } from '../components/common/ValueBadge';
import { colorVariantStyle, colorVariantText } from '../components/common/ColorVariantBadge';
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
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${mrCompleted ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-border bg-white text-text-muted hover:text-primary hover:border-primary/40'}`}
              >
                <Brain size={14} />{mrCompleted ? 'Rehearsed ✓' : 'Mental Rehearsal'}
              </button>
            </div>
          </div>
        )}

        {/* Calendar view area */}
        <div className="flex-1 overflow-y-auto bg-bg">
          {calView === 'day' && (
            <DayView
              date={selectedDate}
              events={selectedEvents}
              today={today}
              onEdit={(e) => { setEditingEvent(e); setShowEventModal(true); }}
              onDelete={(id) => store.deleteCalendarEvent(id)}
              onToggle={(id) => store.toggleCalendarEvent(id)}
              onAdd={() => { setEditingEvent(null); setShowEventModal(true); }}
            />
          )}
          {calView === 'week' && (
            <WeekView
              selectedDate={selectedDate}
              today={today}
              eventsForDate={eventsForDate}
              onSelectDate={(d) => { setSelectedDate(d); setCalView('day'); }}
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

function DayView({ date, events, today, onEdit, onDelete, onToggle, onAdd }: {
  date: string; events: CalendarEvent[]; today: string;
  onEdit: (e: CalendarEvent) => void; onDelete: (id: string) => void;
  onToggle: (id: string) => void; onAdd: () => void;
}) {
  const label = date === today ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const sorted = [...events].sort((a, b) => {
    if (a.time === 'All day') return -1;
    if (b.time === 'All day') return 1;
    return a.time.localeCompare(b.time);
  });
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{label}</h2>
          <p className="text-xs text-text-muted">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={36} className="mx-auto text-text-muted mb-3 opacity-50" />
          <p className="text-text-secondary text-sm">No events for this day</p>
          <button onClick={onAdd} className="mt-3 text-primary text-sm hover:underline">Add one</button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((event) => (
            <EventCard key={event.id} event={event}
              onEdit={() => onEdit(event)}
              onDelete={() => onDelete(event.id)}
              onToggle={() => onToggle(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekView({ selectedDate, today, eventsForDate, onSelectDate }: {
  selectedDate: string; today: string;
  eventsForDate: (d: string) => CalendarEvent[];
  onSelectDate: (d: string) => void;
}) {
  const week = getWeekDates(new Date(selectedDate + 'T00:00:00'));
  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-2">
        {week.map((d) => {
          const dateStr = toDateStr(d);
          const events = eventsForDate(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <div key={dateStr} onClick={() => onSelectDate(dateStr)}
              className={`min-h-[120px] rounded-2xl border p-2 cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm ${isSelected ? 'border-primary/60 bg-primary/5' : isToday ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'}`}
            >
              <div className="flex flex-col items-center mb-2">
                <span className="text-[10px] text-text-muted font-medium uppercase">{DAY_NAMES[d.getDay()]}</span>
                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mt-0.5 ${isSelected ? 'bg-primary text-white' : isToday ? 'bg-primary/15 text-primary' : 'text-text-primary'}`}>
                  {d.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {events.slice(0, 3).map((e) => (
                  <div key={e.id} className={`text-[10px] leading-snug px-1.5 py-0.5 rounded-md truncate font-medium ${e.completed ? 'opacity-50 line-through' : ''}`}
                    style={{ background: colorVariantText(e.colorVariant) + '30', color: colorVariantText(e.colorVariant) }}
                  >
                    {e.time !== 'All day' ? e.time.slice(0, 5) + ' ' : ''}{e.title}
                  </div>
                ))}
                {events.length > 3 && <p className="text-[10px] text-text-muted pl-1">+{events.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-text-muted text-center mt-4">Click a day to see details</p>
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

function EventCard({ event, onEdit, onDelete, onToggle }: { event: CalendarEvent; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border p-4 flex items-start gap-3 bg-white card-hover transition-all" style={colorVariantStyle(event.colorVariant)}>
      <button onClick={onToggle} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${event.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-primary'}`}>
        {event.completed && <Check size={10} color="white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${event.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>{event.title}</p>
        {event.description && <p className="text-xs text-text-secondary mt-0.5 truncate">{event.description}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {event.time && event.time !== 'All day' && <span className="flex items-center gap-1 text-xs text-text-muted"><Clock size={10} />{event.time}</span>}
          {event.linkedValue && <ValueBadge valueId={event.linkedValue} />}
          {event.source === 'external' && <span className="text-xs text-text-muted bg-surface-2 px-1.5 py-0.5 rounded-md">Google</span>}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><Edit3 size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
      </div>
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
