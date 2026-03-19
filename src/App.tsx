import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/common/Layout';
import { OnboardingPage } from './pages/OnboardingPage';
import { CalendarPage } from './pages/CalendarPage';
import { TodoPage } from './pages/TodoPage';
import { IAmPage } from './pages/IAmPage';
import { HabitsPage } from './pages/HabitsPage';
import { ChatPage } from './pages/ChatPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isOnboarding = useAppStore((s) => s.isOnboarding);
  if (isOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="todo" element={<TodoPage />} />
          <Route path="iam" element={<IAmPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
