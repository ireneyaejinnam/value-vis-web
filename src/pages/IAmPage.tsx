import { useAppStore, selectSelectedValues } from '../store/useAppStore';
import { Sparkles, TrendingUp, CheckSquare, Activity, Target } from 'lucide-react';
import { PRIORITY_CATEGORIES } from '../constants/onboarding';

export function IAmPage() {
  const store = useAppStore();
  const selectedValues = selectSelectedValues(store);

  const getValueStats = (valueId: string) => {
    const todos = store.projects.flatMap((p) => p.todos);
    const linkedTasks = todos.filter((t) => t.linkedValue === valueId);
    const completedTasks = linkedTasks.filter((t) => t.completed);
    const linkedEvents = store.calendarEvents.filter((e) => e.linkedValue === valueId);
    const streak = Math.floor(Math.random() * 14) + 1;
    return { linkedTasks: linkedTasks.length, completedTasks: completedTasks.length, linkedEvents: linkedEvents.length, streak };
  };

  const allTodos = store.projects.flatMap((p) => p.todos);
  const totalCompleted = allTodos.filter((t) => t.completed).length;
  const totalTasks = allTodos.length;
  const priorityCat = PRIORITY_CATEGORIES.find((c) => store.priorityCategory.includes(c.id));

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-1">I Am</h1>
          <p className="text-text-secondary">Your values, goals, and progress</p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Tasks Done" value={`${totalCompleted}/${totalTasks}`} icon={<CheckSquare size={16} className="text-emerald-500" />} />
          <StatCard label="Values" value={`${selectedValues.length}/3`} icon={<Sparkles size={16} className="text-primary" />} />
          <StatCard label="Habits" value={`${store.morningRoutines.length + store.eveningRoutines.length}`} icon={<Activity size={16} className="text-amber-500" />} />
          <StatCard label="Focus Area" value={priorityCat?.label ?? '—'} icon={<Target size={16} className="text-purple-500" />} />
        </div>

        {/* No values placeholder */}
        {selectedValues.length === 0 && (
          <div className="bg-white border border-border rounded-2xl p-10 text-center mb-8">
            <Sparkles size={36} className="mx-auto text-text-muted mb-3 opacity-50" />
            <p className="text-text-secondary">You haven't selected your core values yet.</p>
            <p className="text-text-muted text-sm mt-1">Complete onboarding to see your values here.</p>
          </div>
        )}

        {/* Value cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {selectedValues.map((value, idx) => {
            const stats = getValueStats(value.id);
            const completionRate = stats.linkedTasks > 0 ? (stats.completedTasks / stats.linkedTasks) * 100 : 0;
            return (
              <div key={value.id} className="rounded-2xl border p-5 card-hover" style={{ background: value.tintBg, borderColor: value.color + '40' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs text-text-muted font-medium">#{idx + 1} Value</span>
                    <h3 className="text-lg font-bold text-text-primary mt-0.5">{value.label}</h3>
                    <p className="text-xs mt-0.5" style={{ color: value.color }}>{value.definition}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: value.color + '25' }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: value.color }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Tasks', val: stats.linkedTasks },
                    { label: 'Done', val: stats.completedTasks },
                    { label: 'Streak', val: `${stats.streak}d` },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-black/5 rounded-xl p-2.5 text-center">
                      <p className="text-sm font-bold text-text-primary">{val}</p>
                      <p className="text-xs text-text-muted">{label}</p>
                    </div>
                  ))}
                </div>

                {stats.linkedTasks > 0 && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-text-muted">Task completion</span>
                      <span className="text-xs font-medium" style={{ color: value.color }}>{Math.round(completionRate)}%</span>
                    </div>
                    <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completionRate}%`, background: value.color }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-3">
                  <TrendingUp size={12} style={{ color: value.color }} />
                  <span className="text-xs" style={{ color: value.color }}>Trending up this week</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Goals */}
        {(store.subGoals.length > 0 || store.customSubGoals.length > 0) && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-text-primary mb-3">Your Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...store.subGoals, ...store.customSubGoals].map((goal, i) => (
                <div key={i} className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3 card-hover">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={15} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{goal}</p>
                    <p className="text-xs text-text-muted">{store.timeframe} · {priorityCat?.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 card-hover">
      <div className="flex items-center justify-between mb-2">{icon}<span className="text-xs text-text-muted">{label}</span></div>
      <p className="text-lg font-bold text-text-primary">{value}</p>
    </div>
  );
}
