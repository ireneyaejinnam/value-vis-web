import { useState, useEffect, useRef } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';
import { ChevronLeft, ChevronRight, Plus, Brain, Calendar, RefreshCw, Send, Mic, MicOff, Trash2 } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { MentalRehearsalModal } from '../components/calendar/MentalRehearsalModal';
import { colorVariantText } from '../components/common/ColorVariantBadge';
import { VALUES } from '../constants/onboarding';
import type { CalendarEvent, ColorVariant } from '../types';
import { getTodayString } from '../utils/date';
import { COLOR_OPTIONS } from '../types';
import { sendChatMessage } from '../services/aiService';

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
function minutesToTime(mins: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, mins));
  const h = Math.floor(clamped / 60);
  const mn = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
}
function snapMins(mins: number): number { return Math.round(mins / 15) * 15; }
function clampMins(mins: number): number { return Math.max(0, Math.min(23 * 60 + 45, mins)); }

// ─── CalendarPage ──────────────────────────────────────────────────────────────

export function CalendarPage() {
  const store = useAppStore();
  const today = getTodayString();
  const [calView, setCalView] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalDefaultTime, setModalDefaultTime] = useState('');
  const [modalDefaultEndTime, setModalDefaultEndTime] = useState('');
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

  useEffect(() => {
    const parts = selectedDate.split('-').map(Number);
    setCurrentDate(new Date(parts[0], parts[1] - 1, parts[2]));
  }, [selectedDate]);

  function openEdit(e: CalendarEvent) {
    setEditingEvent(e);
    setModalDefaultTime('');
    setModalDefaultEndTime('');
    setShowEventModal(true);
  }

  function openAddWithTime(date: string, startTime: string, endTime: string) {
    setEditingEvent(null);
    setModalDefaultTime(startTime);
    setModalDefaultEndTime(endTime);
    setSelectedDate(date);
    setShowEventModal(true);
  }

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
      const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() - 1); setSelectedDate(toDateStr(d));
    } else if (calView === 'week') {
      const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() - 7); setSelectedDate(toDateStr(d));
    } else {
      setCurrentDate(new Date(y, m - 1, 1)); setSelectedDate(toDateStr(new Date(y, m - 1, 1)));
    }
  }
  function nextPeriod() {
    if (calView === 'day') {
      const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() + 1); setSelectedDate(toDateStr(d));
    } else if (calView === 'week') {
      const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() + 7); setSelectedDate(toDateStr(d));
    } else {
      setCurrentDate(new Date(y, m + 1, 1)); setSelectedDate(toDateStr(new Date(y, m + 1, 1)));
    }
  }
  function periodLabel() {
    if (calView === 'day') return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (calView === 'week') {
      const week = getWeekDates(new Date(selectedDate + 'T00:00:00'));
      return `${week[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${week[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return `${MONTH_NAMES[m]} ${y}`;
  }

  const showChatPanel = calView === 'day' || calView === 'week';

  return (
    <div className="flex h-full flex-col">
      {/* Top toolbar */}
      <div className="px-5 py-3 border-b border-border bg-surface flex items-center justify-between flex-shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-text-primary min-w-[140px] text-center">{periodLabel()}</span>
          <button onClick={nextPeriod} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><ChevronRight size={16} /></button>
        </div>
        <div className="flex bg-surface-2 rounded-lg p-0.5 border border-border">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button key={v} onClick={() => setCalView(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${calView === v ? 'bg-white text-text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-primary'}`}
            >{v}</button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={syncGoogleCalendar} disabled={syncing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${store.googleCalendarConnected ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-border bg-surface text-text-muted hover:text-primary hover:border-primary/40'}`}
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : store.googleCalendarConnected ? 'Google Synced ✓' : 'Import Google Calendar'}
          </button>
          <button onClick={() => { setEditingEvent(null); setModalDefaultTime(''); setModalDefaultEndTime(''); setShowEventModal(true); }}
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
        {/* Mini calendar sidebar — day view only */}
        {calView === 'day' && (
          <div className="w-56 border-r border-border bg-surface flex-shrink-0 flex flex-col overflow-y-auto">
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
        <div className={`flex-1 bg-bg min-w-0 ${calView === 'month' ? 'overflow-y-auto' : 'overflow-hidden flex flex-col'}`}>
          {calView === 'day' && (
            <DayView date={selectedDate} events={selectedEvents} today={today} onEdit={openEdit} onAddWithTime={openAddWithTime} />
          )}
          {calView === 'week' && (
            <WeekView selectedDate={selectedDate} today={today} eventsForDate={eventsForDate}
              onSelectDate={(d) => { setSelectedDate(d); setCalView('day'); }}
              onEdit={openEdit} onAddWithTime={openAddWithTime}
            />
          )}
          {calView === 'month' && (
            <MonthView year={y} month={m} selectedDate={selectedDate} today={today} eventsForDate={eventsForDate}
              onSelectDate={(d) => { setSelectedDate(d); setCalView('day'); }}
            />
          )}
        </div>

        {/* Inline chat panel — desktop, day/week only */}
        {showChatPanel && (
          <div className="hidden lg:flex w-72 xl:w-80 border-l border-border flex-col flex-shrink-0 bg-surface">
            <InlineChat />
          </div>
        )}
      </div>

      <EventFormModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        event={editingEvent}
        defaultDate={selectedDate}
        defaultTime={modalDefaultTime}
        defaultEndTime={modalDefaultEndTime}
      />
      <MentalRehearsalModal open={showMR} onClose={() => setShowMR(false)} date={selectedDate} />
    </div>
  );
}

// ─── Time grid constants ───────────────────────────────────────────────────────

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
  const [h, mn] = time.split(':').map(Number);
  if (isNaN(h)) return null;
  return h * 60 + (mn || 0);
}

// ─── Drag state ────────────────────────────────────────────────────────────────

type DragState =
  | null
  | { type: 'creating'; date: string; startMin: number; endMin: number }
  | { type: 'moving'; event: CalendarEvent; origDate: string; currentDate: string; offsetMin: number; currentStartMin: number }
  | { type: 'resizing'; event: CalendarEvent; currentEndMin: number };

// ─── TimeGrid ─────────────────────────────────────────────────────────────────

function TimeGrid({ columns, today, onEdit, onAddWithTime }: {
  columns: { date: string; label?: string; isSelected?: boolean; events: CalendarEvent[] }[];
  today: string;
  onEdit: (e: CalendarEvent) => void;
  onAddWithTime: (date: string, startTime: string, endTime: string) => void;
}) {
  const store = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const dragRef = useRef<DragState>(null);
  const [drag, setDragState] = useState<DragState>(null);
  const startMouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (currentMinutes - 60) / 60 * HOUR_HEIGHT);
    }
  }, []);

  function getGridY(clientY: number): number {
    if (!scrollRef.current) return 0;
    const rect = scrollRef.current.getBoundingClientRect();
    return clientY - rect.top + scrollRef.current.scrollTop;
  }

  function getColumnDate(clientX: number): string | null {
    if (!gridRef.current) return null;
    const cols = gridRef.current.querySelectorAll<HTMLElement>('[data-date]');
    for (const el of cols) {
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) return el.getAttribute('data-date');
    }
    return null;
  }

  function handleColumnMouseDown(e: React.MouseEvent, date: string) {
    if (e.button !== 0) return;
    e.preventDefault();
    startMouseRef.current = { x: e.clientX, y: e.clientY };
    const startMin = clampMins(snapMins((getGridY(e.clientY) / HOUR_HEIGHT) * 60));
    const init: DragState = { type: 'creating', date, startMin, endMin: startMin + 60 };
    dragRef.current = init;
    setDragState({ ...init });

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d || d.type !== 'creating') return;
      const curr = clampMins(snapMins((getGridY(ev.clientY) / HOUR_HEIGHT) * 60));
      const updated: DragState = { ...d, endMin: curr > d.startMin ? curr : d.startMin + 15 };
      dragRef.current = updated;
      setDragState({ ...updated });
    };
    const onUp = (ev: MouseEvent) => {
      const d = dragRef.current;
      const sx = startMouseRef.current;
      const moved = sx ? (Math.abs(ev.clientX - sx.x) > 5 || Math.abs(ev.clientY - sx.y) > 5) : false;
      if (d && d.type === 'creating' && moved) {
        const lo = Math.min(d.startMin, d.endMin);
        const hi = Math.max(d.startMin, d.endMin);
        onAddWithTime(d.date, minutesToTime(lo), minutesToTime(hi));
      }
      dragRef.current = null;
      setDragState(null);
      startMouseRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function handleEventMouseDown(e: React.MouseEvent, event: CalendarEvent, date: string) {
    if (e.button !== 0) return;
    e.stopPropagation();
    startMouseRef.current = { x: e.clientX, y: e.clientY };
    const startMin = parseMinutes(event.time) ?? 0;
    const offsetMin = snapMins((getGridY(e.clientY) / HOUR_HEIGHT) * 60) - startMin;
    const init: DragState = { type: 'moving', event, origDate: date, currentDate: date, offsetMin, currentStartMin: startMin };
    dragRef.current = init;
    setDragState({ ...init });

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d || d.type !== 'moving') return;
      const newStart = clampMins(snapMins((getGridY(ev.clientY) / HOUR_HEIGHT) * 60 - d.offsetMin));
      const newDate = getColumnDate(ev.clientX) ?? d.currentDate;
      const updated: DragState = { ...d, currentStartMin: newStart, currentDate: newDate };
      dragRef.current = updated;
      setDragState({ ...updated });
    };
    const onUp = (ev: MouseEvent) => {
      const d = dragRef.current;
      const sx = startMouseRef.current;
      const moved = sx ? (Math.abs(ev.clientX - sx.x) > 5 || Math.abs(ev.clientY - sx.y) > 5) : false;
      if (d && d.type === 'moving') {
        if (moved) {
          const origStart = parseMinutes(d.event.time) ?? 0;
          const origEnd = d.event.endTime ? parseMinutes(d.event.endTime) : null;
          const duration = origEnd !== null ? origEnd - origStart : null;
          const updates: Partial<Omit<CalendarEvent, 'id'>> = { time: minutesToTime(d.currentStartMin), date: d.currentDate };
          if (duration !== null) updates.endTime = minutesToTime(d.currentStartMin + duration);
          store.updateCalendarEvent(d.event.id, updates);
        } else {
          onEdit(d.event);
        }
      }
      dragRef.current = null;
      setDragState(null);
      startMouseRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function handleResizeMouseDown(e: React.MouseEvent, event: CalendarEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const startMin = parseMinutes(event.time) ?? 0;
    const endMin = event.endTime ? (parseMinutes(event.endTime) ?? startMin + 60) : startMin + 60;
    const init: DragState = { type: 'resizing', event, currentEndMin: endMin };
    dragRef.current = init;
    setDragState({ ...init });

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d || d.type !== 'resizing') return;
      const sMin = parseMinutes(d.event.time) ?? 0;
      const newEnd = Math.max(sMin + 15, clampMins(snapMins((getGridY(ev.clientY) / HOUR_HEIGHT) * 60)));
      const updated: DragState = { ...d, currentEndMin: newEnd };
      dragRef.current = updated;
      setDragState({ ...updated });
    };
    const onUp = () => {
      const d = dragRef.current;
      if (d && d.type === 'resizing') {
        store.updateCalendarEvent(d.event.id, { endTime: minutesToTime(d.currentEndMin) });
      }
      dragRef.current = null;
      setDragState(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto select-none">
      <div ref={gridRef} className="flex" style={{ height: HOUR_HEIGHT * 24 }}>
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
          const dragCreating = drag?.type === 'creating' && drag.date === col.date ? drag : null;
          const dragMovingHere = drag?.type === 'moving' && drag.currentDate === col.date ? drag : null;

          return (
            <div
              key={col.date}
              data-date={col.date}
              className="flex-1 relative border-l border-border min-w-0"
              style={{ cursor: drag?.type === 'creating' ? 'ns-resize' : 'crosshair' }}
              onMouseDown={(e) => handleColumnMouseDown(e, col.date)}
            >
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div key={h} className="absolute w-full border-t border-border/40" style={{ top: h * HOUR_HEIGHT }} />
              ))}

              {/* Half-hour lines */}
              {HOURS.map((h) => (
                <div key={`h-${h}`} className="absolute w-full border-t border-border/20" style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} />
              ))}

              {/* Current time indicator */}
              {isToday && (
                <div className="absolute w-full flex items-center z-10 pointer-events-none"
                  style={{ top: (currentMinutes / 60) * HOUR_HEIGHT }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 -ml-1.5" />
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              )}

              {/* Drag-to-create preview */}
              {dragCreating && (
                <div
                  className="absolute left-1 right-1 rounded-lg bg-primary/15 border border-primary/50 border-dashed pointer-events-none z-20"
                  style={{
                    top: (Math.min(dragCreating.startMin, dragCreating.endMin) / 60) * HOUR_HEIGHT + 1,
                    height: Math.max(14, Math.abs(dragCreating.endMin - dragCreating.startMin)) / 60 * HOUR_HEIGHT,
                  }}
                >
                  <p className="text-[10px] font-semibold text-primary px-1.5 pt-0.5">
                    {minutesToTime(Math.min(dragCreating.startMin, dragCreating.endMin))}–{minutesToTime(Math.max(dragCreating.startMin, dragCreating.endMin))}
                  </p>
                </div>
              )}

              {/* Ghost for event being moved from another column into this one */}
              {dragMovingHere && dragMovingHere.origDate !== col.date && (() => {
                const ev = dragMovingHere.event;
                const sMin = parseMinutes(ev.time) ?? 0;
                const eMin = ev.endTime ? (parseMinutes(ev.endTime) ?? sMin + 60) : sMin + 60;
                const ht = Math.max(24, (eMin - sMin) / 60 * HOUR_HEIGHT);
                const color = colorVariantText(ev.colorVariant);
                return (
                  <div className="absolute left-1 right-1 rounded-lg pointer-events-none z-20"
                    style={{ top: (dragMovingHere.currentStartMin / 60) * HOUR_HEIGHT + 1, height: ht, background: color + '25', borderLeft: `3px solid ${color}`, opacity: 0.8 }}>
                    <p className="text-[10px] font-semibold px-1.5 pt-0.5 truncate" style={{ color }}>{ev.title}</p>
                  </div>
                );
              })()}

              {/* Ghost for event moving within same column */}
              {dragMovingHere && dragMovingHere.origDate === col.date && (() => {
                const ev = dragMovingHere.event;
                const sMin = parseMinutes(ev.time) ?? 0;
                const eMin = ev.endTime ? (parseMinutes(ev.endTime) ?? sMin + 60) : sMin + 60;
                const ht = Math.max(24, (eMin - sMin) / 60 * HOUR_HEIGHT);
                const color = colorVariantText(ev.colorVariant);
                return (
                  <div className="absolute left-1 right-1 rounded-lg pointer-events-none z-20"
                    style={{ top: (dragMovingHere.currentStartMin / 60) * HOUR_HEIGHT + 1, height: ht, background: color + '25', borderLeft: `3px solid ${color}`, opacity: 0.85 }}>
                    <p className="text-[10px] font-semibold px-1.5 pt-0.5 truncate" style={{ color }}>{ev.title}</p>
                  </div>
                );
              })()}

              {/* Timed events */}
              {timed.map((e) => {
                const startMin = parseMinutes(e.time)!;
                const endMin = e.endTime ? (parseMinutes(e.endTime) ?? startMin + 60) : startMin + 60;
                const top = (startMin / 60) * HOUR_HEIGHT;
                const height = Math.max(24, (endMin - startMin) / 60 * HOUR_HEIGHT);
                const color = colorVariantText(e.colorVariant);
                const isBeingMoved = drag?.type === 'moving' && drag.event.id === e.id;
                const isBeingResized = drag?.type === 'resizing' && drag.event.id === e.id;
                const resizeHeight = isBeingResized
                  ? Math.max(24, ((drag as any).currentEndMin - startMin) / 60 * HOUR_HEIGHT)
                  : height;

                return (
                  <div
                    key={e.id}
                    className="absolute left-1 right-1 rounded-lg overflow-hidden group"
                    style={{
                      top: top + 1,
                      height: resizeHeight,
                      background: color + '20',
                      borderLeft: `3px solid ${color}`,
                      opacity: isBeingMoved ? 0.35 : 1,
                      zIndex: 5,
                      cursor: 'grab',
                    }}
                    onMouseDown={(ev) => handleEventMouseDown(ev, e, col.date)}
                  >
                    <div className="px-1.5 py-1 h-full flex flex-col pointer-events-none">
                      <p className="text-[10px] font-semibold leading-tight truncate" style={{ color }}>{e.title}</p>
                      <p className="text-[9px] opacity-70 leading-tight" style={{ color }}>
                        {e.time}{e.endTime ? ` – ${e.endTime}` : ''}
                      </p>
                    </div>
                    {/* Resize handle */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ cursor: 'ns-resize', pointerEvents: 'auto' }}
                      onMouseDown={(ev) => handleResizeMouseDown(ev, e)}
                    >
                      <div className="w-6 h-0.5 rounded-full" style={{ background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DayView ──────────────────────────────────────────────────────────────────

function DayView({ date, events, today, onEdit, onAddWithTime }: {
  date: string; events: CalendarEvent[]; today: string;
  onEdit: (e: CalendarEvent) => void;
  onAddWithTime: (date: string, startTime: string, endTime: string) => void;
}) {
  const allDay = events.filter((e) => e.time === 'All day' || e.isAllDay);
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {allDay.length > 0 && (
        <div className="flex-shrink-0 border-b border-border px-4 py-2 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-text-muted w-14 flex-shrink-0 pt-1">All day</span>
          {allDay.map((e) => {
            const color = colorVariantText(e.colorVariant);
            return (
              <button key={e.id} onClick={() => onEdit(e)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md truncate max-w-[160px]"
                style={{ background: color + '20', color, borderLeft: `3px solid ${color}` }}
              >{e.title}</button>
            );
          })}
        </div>
      )}
      {events.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
          <div className="text-center">
            <Calendar size={32} className="text-text-muted mb-2 opacity-30 mx-auto" />
            <p className="text-xs text-text-muted opacity-50">Drag to create an event</p>
          </div>
        </div>
      )}
      <TimeGrid columns={[{ date, events }]} today={today} onEdit={onEdit} onAddWithTime={onAddWithTime} />
    </div>
  );
}

// ─── WeekView ─────────────────────────────────────────────────────────────────

function WeekView({ selectedDate, today, eventsForDate, onSelectDate, onEdit, onAddWithTime }: {
  selectedDate: string; today: string;
  eventsForDate: (d: string) => CalendarEvent[];
  onSelectDate: (d: string) => void;
  onEdit: (e: CalendarEvent) => void;
  onAddWithTime: (date: string, startTime: string, endTime: string) => void;
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
                    style={{ background: color + '20', color }}>{e.title}</div>
                );
              })}
            </div>
          );
        })}
      </div>
      <TimeGrid columns={columns} today={today} onEdit={onEdit} onAddWithTime={onAddWithTime} />
    </div>
  );
}

// ─── MonthView ────────────────────────────────────────────────────────────────

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
                    style={{ background: colorVariantText(e.colorVariant) + '25', color: colorVariantText(e.colorVariant) }}>
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

// ─── EventFormModal ────────────────────────────────────────────────────────────

function EventFormModal({ open, onClose, event, defaultDate, defaultTime: dt, defaultEndTime: det }: {
  open: boolean; onClose: () => void; event: CalendarEvent | null;
  defaultDate: string; defaultTime?: string; defaultEndTime?: string;
}) {
  const store = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [linkedValue, setLinkedValue] = useState('');
  const [colorVariant, setColorVariant] = useState<ColorVariant>('mint');

  useEffect(() => {
    setTitle(event?.title ?? '');
    setDescription(event?.description ?? '');
    setDate(event?.date ?? defaultDate);
    setTime(event?.time && event?.time !== 'All day' ? event.time : (dt ?? ''));
    setEndTime(event?.endTime ?? det ?? '');
    setIsAllDay(event?.isAllDay ?? false);
    setLinkedValue(event?.linkedValue ?? '');
    setColorVariant(event?.colorVariant ?? 'mint');
  }, [event, defaultDate, open, dt, det]);

  function handleSave() {
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      time: isAllDay ? 'All day' : (time || 'All day'),
      endTime: isAllDay ? undefined : (endTime || undefined),
      isAllDay,
      linkedValue: linkedValue || undefined,
      colorVariant,
      completed: event?.completed ?? false,
      source: (event?.source ?? 'native') as 'native' | 'external',
    };
    if (event) store.updateCalendarEvent(event.id, data);
    else store.addCalendarEvent(data);
    onClose();
  }

  function handleDelete() {
    if (event) { store.deleteCalendarEvent(event.id); onClose(); }
  }

  const inputCls = "w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all";

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Edit Event' : 'New Event'}>
      <div className="p-5 space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className={inputCls} autoFocus />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className={inputCls + ' resize-none'} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="accent-primary" />
          <span className="text-sm text-text-secondary">All day</span>
        </label>
        {!isAllDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-text-muted mb-1">Start time</p>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text-primary outline-none focus:border-primary/60" />
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">End time</p>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text-primary outline-none focus:border-primary/60" />
            </div>
          </div>
        )}
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
        <div className="flex gap-2">
          {event && (
            <button onClick={handleDelete}
              className="px-4 py-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button onClick={handleSave} disabled={!title.trim()}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors"
          >
            {event ? 'Save Changes' : 'Add Event'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── InlineChat ────────────────────────────────────────────────────────────────

function InlineChat() {
  const store = useAppStore();
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [listening, setListening] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.chatMessages, streamingText]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
  }, [input]);

  async function sendMsg(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    store.addChatMessage({ content: trimmed, sender: 'user' });
    setInput('');
    setStreaming(true);
    setStreamingText('');
    const controller = new AbortController();
    abortRef.current = controller;
    let full = '';
    try {
      await sendChatMessage(trimmed, (chunk) => { full += chunk; setStreamingText(full); }, controller.signal);
      if (full) store.addChatMessage({ content: full.trim(), sender: 'assistant' });
    } catch (err: any) {
      if (err.name !== 'AbortError') store.addChatMessage({ content: "Sorry, I couldn't respond right now.", sender: 'assistant' });
    } finally {
      setStreaming(false);
      setStreamingText('');
      abortRef.current = null;
    }
  }

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e: any) => {
      const t = Array.from(e.results).map((res: any) => res[0].transcript).join('');
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) { setListening(false); sendMsg(t); }
    };
    r.onend = () => setListening(false);
    r.start();
    recognitionRef.current = r;
    setListening(true);
  }
  function stopVoice() { recognitionRef.current?.stop(); setListening(false); }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src="/genie/genie_icon.png" alt="Coach" className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <p className="text-xs font-semibold text-text-primary">ValueVis Coach</p>
            <p className="text-[10px] text-text-muted">Plan your day with AI</p>
          </div>
        </div>
        <button onClick={() => store.clearChatMessages()}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-red-500 transition-colors" title="Clear chat">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {store.chatMessages.map((msg) => (
          <InlineBubble key={msg.id} content={msg.content} sender={msg.sender} />
        ))}
        {streaming && streamingText && <InlineBubble content={streamingText} sender="assistant" streaming />}
        {streaming && !streamingText && (
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex-shrink-0 mt-0.5" />
            <div className="bg-white border border-border rounded-xl rounded-tl-none px-3 py-2">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-text-muted"
                    style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border flex-shrink-0">
        <div className="flex gap-1.5 items-end">
          <div className="flex-1 bg-bg border border-border rounded-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/10 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input); } }}
              placeholder="Ask your coach…"
              rows={1}
              className="w-full bg-transparent px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none resize-none"
              style={{ minHeight: '34px' }}
            />
          </div>
          <button onClick={listening ? stopVoice : startVoice}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border flex-shrink-0 ${listening ? 'bg-red-50 border-red-200 text-red-500' : 'bg-bg border-border text-text-muted hover:text-text-primary'}`}
          >
            {listening ? <MicOff size={12} /> : <Mic size={12} />}
          </button>
          <button onClick={() => sendMsg(input)} disabled={!input.trim() || streaming}
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 hover:bg-primary-dark transition-colors flex-shrink-0"
          >
            <Send size={12} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineBubble({ content, sender, streaming }: { content: string; sender: 'user' | 'assistant'; streaming?: boolean }) {
  const isUser = sender === 'user';
  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-5 h-5 rounded-md bg-primary/10 flex-shrink-0 mt-0.5 flex items-center justify-center">
          <span className="text-[10px] text-primary font-bold">✦</span>
        </div>
      )}
      <div className={`max-w-[88%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
        isUser ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-border text-text-primary rounded-tl-none shadow-sm'
      }`}>
        {content}
        {streaming && <span className="inline-block w-0.5 h-3 bg-current ml-0.5 animate-pulse align-middle opacity-60" />}
      </div>
    </div>
  );
}
