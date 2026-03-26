import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateMentalRehearsalScript } from '../../services/aiService';
import { X, Play, RotateCcw } from 'lucide-react';

const MOODS = [
  { value: 1, emoji: '😞', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

type Phase = 'pre-mood' | 'generating' | 'ready' | 'timing' | 'post-mood' | 'complete';

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  initialMood?: number;
}

export function MentalRehearsalModal({ open, onClose, date, initialMood }: Props) {
  const store = useAppStore();
  const [phase, setPhase] = useState<Phase>(initialMood ? 'generating' : 'pre-mood');
  const [preMood, setPreMood] = useState<number | null>(initialMood ?? null);
  const [postMood, setPostMood] = useState<number | null>(null);
  const [script, setScript] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  useEffect(() => {
    if (!open) return;
    setPhase(initialMood ? 'generating' : 'pre-mood');
    setPreMood(initialMood ?? null);
    setPostMood(null);
    setScript('');
    setTimeLeft(60);
    setError('');
  }, [open, date, initialMood]);

  useEffect(() => {
    if (phase === 'generating') {
      generateMentalRehearsalScript(date)
        .then((s) => { setScript(s); setPhase('ready'); })
        .catch(() => { setError('Could not generate script. Try again.'); setPhase('ready'); });
    }
  }, [phase, date]);

  useEffect(() => {
    if (phase === 'timing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setPhase('post-mood');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  function handlePreMood(mood: number) {
    setPreMood(mood);
    setPhase('generating');
  }

  function handleStartTimer() {
    setTimeLeft(60);
    setPhase('timing');
  }

  function handlePostMood(mood: number) {
    setPostMood(mood);
    store.completeMentalRehearsalForDate(date);
    setPhase('complete');
  }

  function handleRehearse() {
    setPhase('pre-mood');
    setPreMood(null);
    setPostMood(null);
    setScript('');
    setTimeLeft(60);
    store.clearMentalRehearsalForDate(date);
  }

  if (!open) return null;

  const fmt = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh] animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Mental Rehearsal</h2>
            <p className="text-xs text-text-muted">{fmt}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Banner */}
          <div className="p-5 space-y-5">

            {/* Pre-mood */}
            {phase === 'pre-mood' && (
              <div className="animate-fade-in">
                <p className="text-sm font-semibold text-text-primary mb-1">How are you feeling right now?</p>
                <p className="text-xs text-text-muted mb-4">Check in before your visualization session</p>
                <MoodSelector onSelect={handlePreMood} selected={preMood} />
              </div>
            )}

            {/* Generating */}
            {phase === 'generating' && (
              <div className="animate-fade-in text-center py-6">
                <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Generating your personalized script…</p>
              </div>
            )}

            {/* Ready / Timing */}
            {(phase === 'ready' || phase === 'timing') && (
              <div className="animate-fade-in space-y-4">
                {error && <p className="text-xs text-red-500">{error}</p>}
                {script && (
                  <div className="bg-surface-2 rounded-2xl p-4">
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{script}</p>
                  </div>
                )}

                {phase === 'timing' ? (
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary mb-1">{timeLeft}</p>
                    <p className="text-xs text-text-muted">seconds remaining — breathe and visualize</p>
                  </div>
                ) : (
                  <button onClick={handleStartTimer}
                    className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={15} /> Start Visualization (60s)
                  </button>
                )}
              </div>
            )}

            {/* Post-mood */}
            {phase === 'post-mood' && (
              <div className="animate-fade-in">
                <p className="text-sm font-semibold text-text-primary mb-1">How do you feel now?</p>
                <p className="text-xs text-text-muted mb-4">After your visualization session</p>
                {preMood && (
                  <div className="flex items-center gap-2 mb-4 bg-surface-2 rounded-xl px-3 py-2">
                    <span className="text-xs text-text-muted">Before:</span>
                    <span className="text-sm">{MOODS[preMood - 1].emoji}</span>
                    <span className="text-xs text-text-secondary">{MOODS[preMood - 1].label}</span>
                  </div>
                )}
                <MoodSelector onSelect={handlePostMood} selected={postMood} />
              </div>
            )}

            {/* Complete */}
            {phase === 'complete' && (
              <div className="animate-fade-in text-center space-y-4">
                <div>
                  <p className="text-base font-semibold text-text-primary mb-1">Session complete</p>
                  {preMood && postMood && (
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <div className="text-center">
                        <p className="text-2xl">{MOODS[preMood - 1].emoji}</p>
                        <p className="text-xs text-text-muted mt-1">Before</p>
                      </div>
                      <div className="text-text-muted text-lg">→</div>
                      <div className="text-center">
                        <p className="text-2xl">{MOODS[postMood - 1].emoji}</p>
                        <p className="text-xs text-text-muted mt-1">After</p>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={handleRehearse}
                  className="w-full py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={13} /> Rehearse Again
                </button>
                <button onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MoodSelector({ onSelect, selected }: { onSelect: (v: number) => void; selected: number | null }) {
  return (
    <div className="flex justify-between gap-2">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onSelect(mood.value)}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
            selected === mood.value
              ? 'border-primary/60 bg-primary/10'
              : 'border-border hover:border-primary/30 hover:bg-surface-2'
          }`}
        >
          <span className="text-2xl">{mood.emoji}</span>
          <span className="text-xs text-text-muted">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}
