import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MORNING_HABITS, EVENING_HABITS, HABIT_FILTER_TABS } from '../constants/onboarding';
import { VALUES } from '../constants/onboarding';
import { Sun, Moon, Check, Clock, Settings } from 'lucide-react';
import { getTodayString } from '../utils/date';

type Tab = 'morning' | 'evening' | 'all';

const completionsKey = `habit-completions-${getTodayString()}`;
function loadCompletions(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(completionsKey) ?? '[]')); } catch { return new Set(); }
}
function saveCompletions(set: Set<string>) {
  localStorage.setItem(completionsKey, JSON.stringify([...set]));
}

export function HabitsPage() {
  const store = useAppStore();
  const [tab, setTab] = useState<Tab>('morning');
  const [filterTab, setFilterTab] = useState('Suggested');
  const [completions, setCompletions] = useState<Set<string>>(loadCompletions);
  const [showSettings, setShowSettings] = useState(false);
  const [wakeTime, setWakeTime] = useState(store.wakeTime);
  const [sleepTime, setSleepTime] = useState(store.sleepTime);

  function toggleCompletion(id: string) {
    const next = new Set(completions);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCompletions(next);
    saveCompletions(next);
  }

  const morningHabits = MORNING_HABITS.filter((h) => store.morningRoutines.includes(h.id));
  const eveningHabits = EVENING_HABITS.filter((h) => store.eveningRoutines.includes(h.id));
  const morningCompleted = morningHabits.filter((h) => completions.has(h.id)).length;
  const eveningCompleted = eveningHabits.filter((h) => completions.has(h.id)).length;

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Habits</h1>
            <p className="text-text-secondary text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl border transition-all ${showSettings ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary hover:border-primary/30'}`}
          >
            <Settings size={17} />
          </button>
        </div>

        {/* Time settings */}
        {showSettings && (
          <div className="bg-white border border-border rounded-2xl p-5 mb-6 animate-fade-in">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-2"><Sun size={12} className="text-amber-500" />Wake Time</label>
                <input type="time" value={wakeTime} onChange={(e) => { setWakeTime(e.target.value); store.setWakeTime(e.target.value); }}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-2"><Moon size={12} className="text-indigo-400" />Sleep Time</label>
                <input type="time" value={sleepTime} onChange={(e) => { setSleepTime(e.target.value); store.setSleepTime(e.target.value); }}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/60"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface border border-border rounded-xl p-1 w-fit">
          {([['morning', 'Morning', <Sun key="s" size={14} />], ['evening', 'Evening', <Moon key="m" size={14} />], ['all', 'All Habits', null]] as const).map(([t, label, icon]) => (
            <button key={t} onClick={() => setTab(t as Tab)}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-primary'}`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Progress cards */}
        {(tab === 'morning' || tab === 'all') && morningHabits.length > 0 && (
          <ProgressCard label="Morning Routine" icon={<Sun size={14} className="text-amber-500" />} done={morningCompleted} total={morningHabits.length} time={wakeTime} />
        )}
        {(tab === 'evening' || tab === 'all') && eveningHabits.length > 0 && (
          <ProgressCard label="Evening Routine" icon={<Moon size={14} className="text-indigo-400" />} done={eveningCompleted} total={eveningHabits.length} time={sleepTime} />
        )}

        {/* Habit grids */}
        {(tab === 'morning' || tab === 'all') && (
          <HabitSection title="Morning" icon={<Sun size={16} className="text-amber-500" />} habits={morningHabits} completions={completions} onToggle={toggleCompletion} empty={store.morningRoutines.length === 0} />
        )}
        {(tab === 'evening' || tab === 'all') && (
          <HabitSection title="Evening" icon={<Moon size={16} className="text-indigo-400" />} habits={eveningHabits} completions={completions} onToggle={toggleCompletion} empty={store.eveningRoutines.length === 0} />
        )}

        {/* Explore */}
        {tab === 'all' && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-text-primary mb-4">Explore All Habits</h2>
            <div className="flex gap-2 mb-4">
              {HABIT_FILTER_TABS.map((t) => (
                <button key={t} onClick={() => setFilterTab(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterTab === t ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/30'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...MORNING_HABITS, ...EVENING_HABITS]
                .filter((h) => filterTab === 'Suggested' ? h.category === 'suggested' : h.category === filterTab.toLowerCase())
                .map((habit) => (
                  <HabitCard key={habit.id} habit={habit} completed={completions.has(habit.id)} onToggle={() => toggleCompletion(habit.id)} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressCard({ label, icon, done, total, time }: { label: string; icon: React.ReactNode; done: number; total: number; time: string }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div className="bg-white border border-border rounded-2xl p-4 mb-4 flex items-center gap-4">
      <div className="flex items-center gap-2 flex-shrink-0">{icon}<span className="text-sm font-semibold text-text-primary">{label}</span></div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-muted">{done}/{total} completed</span>
          <span className="text-xs font-medium text-primary">{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0"><Clock size={11} />{time}</div>
    </div>
  );
}

function HabitSection({ title, icon, habits, completions, onToggle, empty }: {
  title: string; icon: React.ReactNode; habits: typeof MORNING_HABITS;
  completions: Set<string>; onToggle: (id: string) => void; empty: boolean;
}) {
  if (empty) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-sm font-semibold text-text-secondary">
            {icon}{title}
          </span>
        </div>
        <div className="bg-white border border-dashed border-border rounded-2xl p-8 text-center">
          <p className="text-text-muted text-sm">No habits selected. Complete onboarding to add habits.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary">
          {icon}{title}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} completed={completions.has(habit.id)} onToggle={() => onToggle(habit.id)} />
        ))}
      </div>
    </div>
  );
}

function HabitCard({ habit, completed, onToggle }: { habit: typeof MORNING_HABITS[0]; completed: boolean; onToggle: () => void }) {
  const linkedValues = habit.valueIds.slice(0, 2).map((id) => VALUES.find((v) => v.id === id)).filter(Boolean);
  return (
    <div className={`bg-white border rounded-2xl p-4 flex items-start gap-3 card-hover transition-all ${completed ? 'opacity-70' : ''} ${completed ? 'border-emerald-200 bg-emerald-50/50' : 'border-border'}`}>
      <button onClick={onToggle} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-primary'}`}>
        {completed && <Check size={12} color="white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>{habit.name}</p>
        <p className="text-xs text-text-muted mt-0.5">{habit.subtitle}</p>
        <div className="flex gap-1 mt-2">
          {linkedValues.map((v) => v && (
            <span key={v.id} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v.color }} title={v.label} />
          ))}
        </div>
      </div>
    </div>
  );
}
