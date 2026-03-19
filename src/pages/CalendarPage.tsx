import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Edit3, Brain, Calendar, Clock, RefreshCw } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { ValueBadge } from '../components/common/ValueBadge';
import { colorVariantStyle, colorVariantText } from '../components/common/ColorVariantBadge';
import { VALUES } from '../constants/onboarding';
import type { CalendarEvent, ColorVariant } from '../types';
import { getTodayString } from '../utils/date';
import { COLOR_OPTIONS } from '../types';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

export function CalendarPage() {
  const store = useAppStore();
  const today = getTodayString();
  const [view, setView] = useState<'month' | 'timeline'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showMR, setShowMR] = useState(false);
  const [mrStep, setMrStep] = useState(0);

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(y, m);
  const firstDay = getFirstDayOfMonth(y, m);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const eventsForDate = (date: string) => store.calendarEvents.filter((e) => e.date === date);
  const selectedEvents = eventsForDate(selectedDate);
  const mrCompleted = store.mentalRehearsalCompletedDates.includes(selectedDate);

  async function syncGoogleCalendar() {
    setSyncing(true);
    setSyncError('');
    try {
      // Use a fresh provider with prompt:consent so Google ALWAYS shows
      // the account-picker and calendar permission screen.
      const calendarProvider = new GoogleAuthProvider();
      calendarProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      calendarProvider.setCustomParameters({ prompt: 'consent', access_type: 'offline' });

      const result = await signInWithPopup(auth, calendarProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) throw new Error('No access token returned from Google');
      store.setGoogleAccessToken(token);

      // Fetch events for the current month ± 1 month window
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

  const MR_STEPS = [
    { title: "Settle In", body: "Close your eyes. Take 3 slow, deep breaths. Let your thoughts quiet." },
    { title: "Visualize the Event", body: "Imagine yourself at your event on this day. See the environment around you." },
    { title: "Feel Your Values", body: "How are your core values showing up? What matters most to you here?" },
    { title: "Anchor the Intention", body: "Set a clear intention. What will you bring to this moment?" },
    { title: "Complete", body: "Open your eyes when ready. You've prepared mentally. Trust yourself." },
  ];

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Calendar panel */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-surface flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-semibold text-text-primary">Calendar</h1>
            <div className="flex items-center gap-1">
              {(['month','timeline'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${view === v ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-primary'}`}
                >
                  {v}
                </button>
              ))}
              <button
                onClick={syncGoogleCalendar}
                disabled={syncing}
                title={store.googleCalendarConnected ? 'Sync Google Calendar' : 'Connect Google Calendar'}
                className={`p-1.5 rounded-lg transition-colors ${store.googleCalendarConnected ? 'text-emerald-600 hover:bg-emerald-50' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentDate(new Date(y, m - 1, 1))} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><ChevronLeft size={15} /></button>
            <span className="text-sm font-semibold text-text-primary">{MONTH_NAMES[m]} {y}</span>
            <button onClick={() => setCurrentDate(new Date(y, m + 1, 1))} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => <div key={d} className="text-center text-xs text-text-muted py-1 font-medium">{d}</div>)}
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
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative ${
                    isSelected ? 'bg-primary text-white font-semibold shadow-sm' :
                    isToday ? 'bg-primary/10 text-primary font-semibold' :
                    'hover:bg-surface-2 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {day}
                  {hasEvents && !isSelected && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-bg">
        <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {selectedDate === today ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <p className="text-xs text-text-muted">{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={syncGoogleCalendar} disabled={syncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${store.googleCalendarConnected ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-border bg-surface text-text-muted hover:text-primary hover:border-primary/40'}`}
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : store.googleCalendarConnected ? 'Google Synced ✓' : 'Import Google Calendar'}
            </button>
            <button onClick={() => { setMrStep(0); setShowMR(true); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${mrCompleted ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-border bg-surface text-text-muted hover:text-primary hover:border-primary/40'}`}
            >
              <Brain size={13} />{mrCompleted ? 'Rehearsed ✓' : 'Rehearse'}
            </button>
            <button onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              <Plus size={13} /> Add Event
            </button>
          </div>
        </div>

        {syncError && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-100">
            <p className="text-xs text-red-600">{syncError}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {selectedEvents.length === 0 ? (
            <div className="text-center py-20">
              <Calendar size={36} className="mx-auto text-text-muted mb-3 opacity-50" />
              <p className="text-text-secondary text-sm">No events for this day</p>
              <button onClick={() => { setEditingEvent(null); setShowEventModal(true); }} className="mt-3 text-primary text-sm hover:underline">Add one</button>
            </div>
          ) : view === 'timeline' ? (
            <TimelineView events={selectedEvents} onEdit={(e) => { setEditingEvent(e); setShowEventModal(true); }} onDelete={(id) => store.deleteCalendarEvent(id)} onToggle={(id) => store.toggleCalendarEvent(id)} />
          ) : (
            selectedEvents.map((event) => (
              <EventCard key={event.id} event={event}
                onEdit={() => { setEditingEvent(event); setShowEventModal(true); }}
                onDelete={() => store.deleteCalendarEvent(event.id)}
                onToggle={() => store.toggleCalendarEvent(event.id)}
              />
            ))
          )}
        </div>
      </div>

      <EventFormModal open={showEventModal} onClose={() => setShowEventModal(false)} event={editingEvent} defaultDate={selectedDate} />

      <Modal open={showMR} onClose={() => setShowMR(false)} title="Mental Rehearsal">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain size={24} className="text-primary" />
          </div>
          <div className="flex justify-center gap-1.5 mb-4">
            {MR_STEPS.map((_, i) => (
              <div key={i} className={`h-1 w-6 rounded-full transition-colors ${i <= mrStep ? 'bg-primary' : 'bg-surface-2'}`} />
            ))}
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">{MR_STEPS[mrStep].title}</h3>
          <p className="text-text-secondary leading-relaxed mb-6 text-sm">{MR_STEPS[mrStep].body}</p>
          <div className="flex gap-2">
            {mrStep > 0 && <button onClick={() => setMrStep(mrStep - 1)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm hover:text-text-primary hover:border-primary/40 transition-colors">Back</button>}
            <button onClick={() => { if (mrStep < MR_STEPS.length - 1) { setMrStep(mrStep + 1); } else { store.completeMentalRehearsalForDate(selectedDate); setShowMR(false); } }}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              {mrStep < MR_STEPS.length - 1 ? 'Next →' : '✓ Complete'}
            </button>
          </div>
        </div>
      </Modal>
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

function TimelineView({ events, onEdit, onDelete, onToggle }: { events: CalendarEvent[]; onEdit: (e: CalendarEvent) => void; onDelete: (id: string) => void; onToggle: (id: string) => void }) {
  const sorted = [...events].sort((a, b) => {
    if (a.time === 'All day') return -1;
    if (b.time === 'All day') return 1;
    return a.time.localeCompare(b.time);
  });
  return (
    <div className="relative">
      <div className="absolute left-16 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-3">
        {sorted.map((event) => (
          <div key={event.id} className="flex gap-3 items-start">
            <div className="w-16 text-right flex-shrink-0 pt-4">
              <span className="text-xs text-text-muted font-medium">{event.time === 'All day' ? 'all' : event.time.slice(0, 5)}</span>
            </div>
            <div className="relative flex-1">
              <div className="absolute -left-[17px] top-4 w-2.5 h-2.5 rounded-full border-2 border-surface bg-surface" style={{ background: colorVariantText(event.colorVariant) }} />
              <EventCard event={event} onEdit={() => onEdit(event)} onDelete={() => onDelete(event.id)} onToggle={() => onToggle(event.id)} />
            </div>
          </div>
        ))}
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
