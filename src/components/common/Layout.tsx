import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarDays, CheckSquare, Sparkles, Activity, MessageCircle, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const NAV_ITEMS = [
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/todo',     icon: CheckSquare,  label: 'Todo' },
  { to: '/iam',      icon: Sparkles,     label: 'I Am' },
  { to: '/habits',   icon: Activity,     label: 'Habits' },
  { to: '/chat',     icon: MessageCircle,label: 'Coach' },
];

export function Layout() {
  const navigate = useNavigate();
  const store = useAppStore();
  const displayName = store.displayName;

  function handleReset() {
    if (window.confirm('Reset to onboarding? This will clear your session state.')) {
      store.resetOnboarding();
      navigate('/onboarding');
    }
  }

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-surface flex-shrink-0 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">✦</span>
            </div>
            <span className="font-semibold text-text-primary text-sm tracking-tight">ValueVis</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border space-y-1">
          {displayName && (
            <div className="px-3 py-2 rounded-xl bg-surface-2">
              <p className="text-xs text-text-muted">Signed in as</p>
              <p className="text-xs font-medium text-text-primary truncate">{displayName}</p>
            </div>
          )}
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
          >
            <RotateCcw size={14} />
            Back to Onboarding
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col bg-bg">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">✦</span>
            </div>
            <span className="font-semibold text-text-primary text-sm">ValueVis</span>
          </div>
          <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted transition-colors">
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur-xl">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-all ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
