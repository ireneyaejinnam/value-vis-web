import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';
import {
  VALUES, VALUE_CATEGORIES, MAX_VALUES,
  PRIORITY_CATEGORIES, TIMEFRAME_OPTIONS,
  MORNING_HABITS, EVENING_HABITS, HABIT_FILTER_TABS,
} from '../constants/onboarding';
import { ChevronRight, ChevronLeft, Check, Plus, Moon, Sun } from 'lucide-react';

type Step = 'welcome' | 'values' | 'priority' | 'morning' | 'evening' | 'review';
const STEPS: Step[] = ['welcome', 'values', 'priority', 'morning', 'evening', 'review'];

export function OnboardingPage() {
  const navigate = useNavigate();
  const store = useAppStore();
  const [step, setStep] = useState<Step>('welcome');
  const [signingIn, setSigningIn] = useState(false);
  const [filterTab, setFilterTab] = useState('Suggested');
  const [customGoal, setCustomGoal] = useState('');

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  async function handleGoogleSignIn() {
    setSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      store.setDisplayName(result.user.displayName);
      setStep('values');
    } catch {
      // still allow continuing
      setStep('values');
    } finally {
      setSigningIn(false);
    }
  }

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }
  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }
  function finish() {
    store.completeOnboarding();
    navigate('/calendar');
  }

  const selectedValues = store.selectedValueIds
    .map((id) => VALUES.find((v) => v.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-bg">
      {/* Welcome screen — full lavender */}
      {step === 'welcome' && (
        <div className="min-h-screen welcome-bg flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-md text-center animate-fade-in">
            {/* Doodle sparkle */}
            <div className="mb-6 flex justify-center">
              <svg width="40" height="39" viewBox="0 0 32 31" fill="none" className="opacity-80">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.07506 13.7113C5.50275 13.2184 7.00514 12.5634 8.1637 11.6152C9.5397 10.4888 10.0993 9.03822 10.4751 7.51127C10.9576 5.54953 11.1503 3.45979 11.7354 1.49486C11.952 0.765172 12.3688 0.489347 12.5477 0.366937C12.9998 0.0577315 13.4568 -0.0249189 13.8868 0.0060811C14.3963 0.0418503 15.0962 0.228632 15.5565 1.05609C15.6222 1.17453 15.7075 1.35497 15.7649 1.60218C15.8068 1.78341 15.8338 2.35014 15.8781 2.58384C15.9889 3.15932 16.0816 3.73483 16.1686 4.3135C16.4583 6.23947 16.6248 7.87529 17.5397 9.64468C18.7811 12.0468 20.0251 13.5165 21.712 14.1675C23.3432 14.797 25.2936 14.6786 27.7854 14.185C28.0226 14.1294 28.2572 14.0817 28.4894 14.0427C29.5881 13.8567 30.6384 14.5554 30.8542 15.6158C31.07 16.6753 30.3717 17.7079 29.2829 17.9408C29.0556 17.9893 28.8316 18.0354 28.6101 18.0775C25.2427 18.8851 21.3444 21.7673 19.079 24.291C18.3807 25.0692 17.3584 27.2447 16.3155 28.6326C15.5459 29.6564 14.681 30.3312 13.9549 30.5697C13.4683 30.7303 13.0581 30.7056 12.7192 30.6246C12.2269 30.5069 11.8183 30.2485 11.5049 29.8376C11.3342 29.6126 11.1758 29.3114 11.1003 28.9267C11.0642 28.7415 11.0601 28.2709 11.0609 28.0579C10.8484 27.3497 10.5883 26.6581 10.3988 25.9435C9.94668 24.2385 9.05969 23.1591 8.00615 21.7331C7.02072 20.3985 5.96229 19.5599 4.4107 18.8906C4.20885 18.8429 2.58013 18.4566 2.00495 18.2349C1.16474 17.9098 0.764313 17.3653 0.619083 17.072C0.372108 16.5744 0.346695 16.1396 0.395926 15.7771C0.468951 15.2422 0.716748 14.7843 1.15654 14.4147C1.42895 14.185 1.83593 13.9616 2.38075 13.8527C2.80167 13.7677 3.91834 13.7184 4.07506 13.7113Z" fill="white"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 leading-tight">Your life is a<br/>work of art</h1>
            <p className="text-white/80 mb-10 text-base">Align your daily actions with your deepest values.</p>

            <div className="bg-white/95 rounded-2xl p-6 shadow-xl space-y-3">
              <button onClick={handleGoogleSignIn} disabled={signingIn}
                className="w-full py-3 rounded-xl bg-white border border-border text-text-primary font-medium text-sm flex items-center justify-center gap-3 hover:bg-surface-2 transition-colors shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                {signingIn ? 'Signing in…' : 'Continue with Google'}
              </button>
              <button onClick={() => { store.setDisplayName('Guest'); setStep('values'); }}
                className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors"
              >
                Continue without account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-step layout */}
      {step !== 'welcome' && (
        <div className="min-h-screen bg-bg">
          {/* Top progress bar */}
          <div className="bg-surface border-b border-border sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
              <button onClick={back} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-text-muted flex-shrink-0">{stepIndex}/{STEPS.length - 1}</span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 py-8">

            {/* ── VALUES ── */}
            {step === 'values' && (
              <div className="animate-fade-in">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-1">Your Core Values</h2>
                  <p className="text-text-secondary">Choose up to {MAX_VALUES} values that guide your life</p>
                  <div className="flex gap-2 mt-3">
                    {Array.from({ length: MAX_VALUES }).map((_, i) => (
                      <div key={i} className={`h-1.5 w-12 rounded-full transition-colors ${i < store.selectedValueIds.length ? 'bg-primary' : 'bg-surface-2'}`} />
                    ))}
                    <span className="text-xs text-text-muted self-center ml-1">{store.selectedValueIds.length}/{MAX_VALUES}</span>
                  </div>
                </div>

                {VALUE_CATEGORIES.map((cat) => (
                  <div key={cat} className="mb-8">
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">{cat}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {VALUES.filter((v) => v.category === cat).map((value) => {
                        const selected = store.selectedValueIds.includes(value.id);
                        const disabled = !selected && store.selectedValueIds.length >= MAX_VALUES;
                        return (
                          <button
                            key={value.id}
                            onClick={() => store.toggleValue(value.id)}
                            disabled={disabled}
                            className={`p-4 rounded-2xl border text-left transition-all card-hover ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            style={selected
                              ? { background: value.tintBg, borderColor: value.color + '60' }
                              : { background: '#fff', borderColor: '#E2E4EC' }
                            }
                          >
                            <div className="flex items-start justify-between gap-1 mb-2">
                              <div className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: value.color }} />
                              {selected && (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: value.color }}>
                                  <Check size={11} color="white" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-text-primary leading-tight mb-1">{value.label}</p>
                            <p className="text-xs" style={{ color: value.color }}>{value.definition}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="sticky bottom-0 bg-bg border-t border-border -mx-6 px-6 py-4 mt-4">
                  <div className="max-w-5xl mx-auto">
                    <button onClick={next} disabled={store.selectedValueIds.length === 0}
                      className="px-8 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PRIORITY ── */}
            {step === 'priority' && (
              <div className="animate-fade-in">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-1">What's your priority?</h2>
                  <p className="text-text-secondary">Choose one or more focus areas and the goals you're working toward</p>
                </div>

                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Focus Areas <span className="normal-case font-normal text-text-muted">— select all that apply</span></h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {PRIORITY_CATEGORIES.map((cat) => {
                      const selected = store.priorityCategory.includes(cat.id);
                      return (
                        <button key={cat.id} onClick={() => store.setPriorityCategory([cat.id])}
                          className={`p-4 rounded-2xl border text-left transition-all card-hover ${selected ? 'border-primary/50 bg-primary/10' : 'border-border bg-white hover:border-primary/30'}`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-2">
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-primary border-primary' : 'border-border'}`}>
                              {selected && <Check size={10} color="white" />}
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-text-primary mb-1">{cat.label}</p>
                          <p className="text-xs text-text-muted">{cat.subGoals.length} goals</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {store.priorityCategory.length > 0 && (() => {
                  const allGoals = PRIORITY_CATEGORIES
                    .filter((c) => store.priorityCategory.includes(c.id))
                    .flatMap((c) => c.subGoals.map((g) => ({ goal: g, area: c.label })));
                  return (
                    <div className="mb-8 animate-fade-in">
                      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Your Goals <span className="normal-case font-normal text-text-muted">— pick as many as you like</span></h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {allGoals.map(({ goal, area }) => {
                          const selected = store.subGoals.includes(goal);
                          return (
                            <button key={goal} onClick={() => store.toggleSubGoal(goal)}
                              className={`p-3 rounded-xl border text-left text-sm transition-all card-hover ${selected ? 'border-primary/50 bg-primary/10 text-primary font-medium' : 'border-border bg-white text-text-secondary hover:text-text-primary hover:border-primary/30'}`}
                            >
                              {selected && <Check size={12} className="inline mr-1.5 mb-0.5" />}
                              <span>{goal}</span>
                              {store.priorityCategory.length > 1 && <span className="block text-[10px] text-text-muted mt-0.5 font-normal">{area}</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <input value={customGoal} onChange={(e) => setCustomGoal(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && customGoal.trim()) { store.addCustomSubGoal(customGoal.trim()); setCustomGoal(''); } }}
                          placeholder="Or type your own goal…"
                          className="flex-1 bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary/60"
                        />
                        <button onClick={() => { if (customGoal.trim()) { store.addCustomSubGoal(customGoal.trim()); setCustomGoal(''); } }}
                          className="px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {store.customSubGoals.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {store.customSubGoals.map((g) => (
                            <span key={g} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                              {g}
                              <button onClick={() => store.removeCustomSubGoal(g)} className="hover:text-red-500 transition-colors">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Timeframe</h3>
                  <div className="flex gap-2">
                    {TIMEFRAME_OPTIONS.map((t) => (
                      <button key={t} onClick={() => store.setTimeframe(t)}
                        className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${store.timeframe === t ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-white text-text-secondary hover:border-primary/30 hover:text-text-primary'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sticky bottom-0 bg-bg border-t border-border -mx-6 px-6 py-4">
                  <div className="max-w-5xl mx-auto">
                    <button onClick={next} disabled={store.priorityCategory.length === 0}
                      className="px-8 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MORNING ── */}
            {step === 'morning' && (
              <RoutineStep
                title="Morning Routine"
                subtitle="Pick habits to start your day right"
                icon={<Sun size={20} className="text-amber-500" />}
                habits={MORNING_HABITS}
                selectedIds={store.morningRoutines}
                onToggle={(id) => store.toggleRoutine(id, 'morning')}
                filterTab={filterTab}
                setFilterTab={setFilterTab}
                onNext={next}
              />
            )}

            {/* ── EVENING ── */}
            {step === 'evening' && (
              <RoutineStep
                title="Evening Routine"
                subtitle="Pick habits to close your day with intention"
                icon={<Moon size={20} className="text-indigo-400" />}
                habits={EVENING_HABITS}
                selectedIds={store.eveningRoutines}
                onToggle={(id) => store.toggleRoutine(id, 'evening')}
                filterTab={filterTab}
                setFilterTab={setFilterTab}
                onNext={next}
              />
            )}

            {/* ── REVIEW ── */}
            {step === 'review' && (
              <div className="animate-fade-in">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-1">You're all set! 🎉</h2>
                  <p className="text-text-secondary">Here's a summary of your setup</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <ReviewCard label="Core Values" content={selectedValues.map((v) => v!.label).join(', ') || '–'} accent="#6363E1" />
                  <ReviewCard label="Priority Areas" content={PRIORITY_CATEGORIES.filter((c) => store.priorityCategory.includes(c.id)).map((c) => c.label).join(', ') || '–'} accent="#8050B8" />
                  <ReviewCard label="Goal" content={[...store.subGoals, ...store.customSubGoals].join(', ') || '–'} accent="#2AA890" />
                  <ReviewCard label="Timeframe" content={store.timeframe} accent="#C07050" />
                  <ReviewCard label="Morning Habits" content={`${store.morningRoutines.length} habits selected`} accent="#B04888" />
                  <ReviewCard label="Evening Habits" content={`${store.eveningRoutines.length} habits selected`} accent="#4A6FC0" />
                </div>

                <button onClick={finish}
                  className="px-8 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2 text-base"
                >
                  Start Exploring <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ label, content, accent }: { label: string; content: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 card-hover">
      <div className="w-2 h-2 rounded-full mb-3" style={{ background: accent }} />
      <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-text-primary">{content}</p>
    </div>
  );
}

function RoutineStep({
  title, subtitle, icon, habits, selectedIds, onToggle, filterTab, setFilterTab, onNext,
}: {
  title: string; subtitle: string; icon: React.ReactNode;
  habits: typeof MORNING_HABITS; selectedIds: string[];
  onToggle: (id: string) => void; filterTab: string; setFilterTab: (t: string) => void; onNext: () => void;
}) {
  const filtered = habits.filter((h) =>
    filterTab === 'Suggested' ? h.category === 'suggested' : h.category === filterTab.toLowerCase()
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">{icon}<h2 className="text-2xl font-bold text-text-primary">{title}</h2></div>
        <p className="text-text-secondary">{subtitle}</p>
      </div>

      <div className="flex gap-2 mb-6">
        {HABIT_FILTER_TABS.map((tab) => (
          <button key={tab} onClick={() => setFilterTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterTab === tab ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:text-text-primary hover:border-primary/30'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {filtered.map((habit) => {
          const selected = selectedIds.includes(habit.id);
          return (
            <button key={habit.id} onClick={() => onToggle(habit.id)}
              className={`p-4 rounded-2xl border text-left transition-all card-hover ${selected ? 'border-primary/50 bg-primary/10' : 'border-border bg-white hover:border-primary/30'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-text-primary">{habit.name}</p>
                {selected && <Check size={15} className="text-primary flex-shrink-0" />}
              </div>
              <p className="text-xs text-text-muted">{habit.subtitle}</p>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-bg border-t border-border -mx-6 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm text-text-muted">{selectedIds.length} selected</span>
          <button onClick={onNext}
            className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            Continue <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
