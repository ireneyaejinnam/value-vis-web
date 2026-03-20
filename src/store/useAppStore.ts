import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TodoItem, Project, CalendarEvent, ChatMessage, FabPosition, ColorVariant } from '../types';
import { getTodayString } from '../utils/date';
import { VALUES, MAX_VALUES } from '../constants/onboarding';
import type { Value, HabitCustomization } from '../types/onboarding';

// ─── Onboarding slice ─────────────────────────────────────────────────────────

interface OnboardingState {
  selectedValueIds: string[];
  priorityCategory: string[];
  timeframe: string;
  subGoals: string[];
  customSubGoals: string[];
  morningRoutines: string[];
  eveningRoutines: string[];
  habitCustomizations: Record<string, HabitCustomization>;
  wakeTime: string;
  sleepTime: string;
}

const INITIAL_ONBOARDING: OnboardingState = {
  selectedValueIds: [],
  priorityCategory: [],
  timeframe: '1 Year',
  subGoals: [],
  customSubGoals: [],
  morningRoutines: [],
  eveningRoutines: [],
  habitCustomizations: {},
  wakeTime: '07:00',
  sleepTime: '23:00',
};

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'CHI Paper',
    todos: [
      { id: 'todo-1', title: 'Write introduction section', description: 'Draft the introduction for the CHI 2027 paper', time: '09:00 AM', completed: false, category: 'Paper Write-up', projectId: 'proj-1', colorVariant: 'blue', linkedValue: 'independent-thinking' },
      { id: 'todo-2', title: 'Prepare presentation slides', description: 'Create slides for the research presentation', time: '02:00 PM', completed: true, category: 'Presentation', projectId: 'proj-1', colorVariant: 'coral', linkedValue: 'success' },
      { id: 'todo-3', title: 'Review related work', description: 'Read and summarize related papers', time: '11:00 AM', completed: false, category: 'Paper Write-up', projectId: 'proj-1', colorVariant: 'purple', priority: 'high' },
      { id: 'todo-4', title: 'Design study protocol', description: 'Create the user study protocol document', time: '03:30 PM', completed: false, category: 'General', projectId: 'proj-1', colorVariant: 'mint', linkedValue: 'caring-for-others', priority: 'medium' },
      { id: 'todo-5', title: 'Team meeting prep', description: 'Prepare agenda for weekly meeting', time: '10:00 AM', completed: true, category: 'General', projectId: 'proj-1', colorVariant: 'pink', priority: 'low' },
    ],
  },
  {
    id: 'proj-2',
    name: 'Design Prototype',
    todos: [
      { id: 'todo-6', title: 'Create wireframes', description: 'Design initial wireframes in Figma', time: '10:00 AM', completed: false, category: 'General', projectId: 'proj-2', colorVariant: 'pink', linkedValue: 'success', priority: 'high' },
      { id: 'todo-7', title: 'User flow diagram', description: 'Map out the complete user flow', time: '01:00 PM', completed: false, category: 'General', projectId: 'proj-2', colorVariant: 'blue', priority: 'medium' },
      { id: 'todo-8', title: 'Prototype review', description: 'Present prototype to team for feedback', time: '04:00 PM', completed: false, category: 'Presentation', projectId: 'proj-2', colorVariant: 'coral', linkedValue: 'reliability', priority: 'medium' },
      { id: 'todo-9', title: 'Implement animations', description: 'Add micro-interactions to prototype', time: '11:30 AM', completed: true, category: 'General', projectId: 'proj-2', colorVariant: 'purple' },
      { id: 'todo-10', title: 'Usability testing', description: 'Conduct usability tests with 5 participants', time: '02:30 PM', completed: false, category: 'General', projectId: 'proj-2', colorVariant: 'mint', linkedValue: 'caring-for-others', priority: 'high' },
    ],
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: 'msg-1', content: "Hi! I'm your ValueVis coach. I'm here to help you align your daily tasks with your core values. What would you like to explore today?", sender: 'assistant', timestamp: new Date().toISOString() },
];

// ─── Store ────────────────────────────────────────────────────────────────────

type ExternalCalendarItem = {
  externalId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  endTime?: string;
  isAllDay?: boolean;
};

interface AppState extends OnboardingState {
  // Auth
  displayName: string | null;
  setDisplayName: (name: string | null) => void;

  // Onboarding
  isOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  toggleValue: (id: string) => void;
  toggleSubGoal: (goal: string) => void;
  addCustomSubGoal: (goal: string) => void;
  removeCustomSubGoal: (goal: string) => void;
  toggleRoutine: (habitId: string, type: 'morning' | 'evening') => void;
  setHabitCustomization: (habitId: string, data: HabitCustomization) => void;
  setPriorityCategory: (categories: string[]) => void;
  setTimeframe: (timeframe: string) => void;
  setWakeTime: (time: string) => void;
  setSleepTime: (time: string) => void;

  // Projects & Todos
  projects: Project[];
  currentProjectId: string;
  setProjects: (projects: Project[]) => void;
  setCurrentProjectId: (id: string) => void;
  toggleTodo: (projectId: string, todoId: string) => void;
  addTodo: (projectId: string, todo: Omit<TodoItem, 'id'>) => string;
  updateTodo: (projectId: string, todoId: string, updates: Partial<Omit<TodoItem, 'id' | 'projectId'>>) => void;
  deleteTodo: (projectId: string, todoId: string) => void;
  addProject: (name: string) => string;

  // Calendar Events
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  toggleCalendarEvent: (eventId: string) => void;
  updateCalendarEvent: (eventId: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void;
  deleteCalendarEvent: (eventId: string) => void;
  mentalRehearsalCompletedDates: string[];
  completeMentalRehearsalForDate: (date: string) => void;
  clearMentalRehearsalForDate: (date: string) => void;
  importExternalCalendarItems: (items: ExternalCalendarItem[]) => void;
  removeExternalCalendarItemsByIds: (ids: string[]) => void;

  // Google Calendar
  googleCalendarConnected: boolean;
  googleCalendarLastSyncedAt?: string;
  googleAccessToken: string | null;
  setGoogleCalendarConnected: (connected: boolean) => void;
  setGoogleCalendarLastSyncedAt: (timestamp: string) => void;
  setGoogleAccessToken: (token: string | null) => void;

  // Custom Categories
  customCategories: string[];
  addCustomCategory: (category: string) => { success: boolean; error?: string };

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatMessages: () => void;

  // FAB
  fabPosition: FabPosition | null;
  setFabPosition: (pos: FabPosition) => void;
}

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Onboarding ───────────────────────────────────────────────────────
      ...INITIAL_ONBOARDING,
      displayName: null,
      isOnboarding: true,

      setDisplayName: (name) => set({ displayName: name }),

      completeOnboarding: () => set({ isOnboarding: false }),
      resetOnboarding: () => set({ isOnboarding: true, ...INITIAL_ONBOARDING, chatMessages: INITIAL_CHAT }),

      toggleValue: (valueId) =>
        set((state) => {
          if (state.selectedValueIds.includes(valueId)) {
            return { selectedValueIds: state.selectedValueIds.filter((id) => id !== valueId) };
          }
          if (state.selectedValueIds.length < MAX_VALUES) {
            return { selectedValueIds: [...state.selectedValueIds, valueId] };
          }
          return state;
        }),

      toggleSubGoal: (goal) =>
        set((state) => ({
          subGoals: state.subGoals.includes(goal)
            ? state.subGoals.filter((g) => g !== goal)
            : [...state.subGoals, goal],
        })),

      addCustomSubGoal: (goal) => {
        const trimmed = goal.trim();
        if (!trimmed) return;
        set((state) => ({
          customSubGoals: state.customSubGoals.includes(trimmed)
            ? state.customSubGoals
            : [...state.customSubGoals, trimmed],
        }));
      },

      removeCustomSubGoal: (goal) =>
        set((state) => ({ customSubGoals: state.customSubGoals.filter((g) => g !== goal) })),

      toggleRoutine: (habitId, type) =>
        set((state) => {
          const key = type === 'morning' ? 'morningRoutines' : 'eveningRoutines';
          const current = state[key];
          return { [key]: current.includes(habitId) ? current.filter((id) => id !== habitId) : [...current, habitId] };
        }),

      setHabitCustomization: (habitId, data) =>
        set((state) => ({ habitCustomizations: { ...state.habitCustomizations, [habitId]: data } })),

      setPriorityCategory: (categories) =>
        set((state) => {
          if (categories.length === 1) {
            const id = categories[0];
            return {
              priorityCategory: state.priorityCategory.includes(id)
                ? state.priorityCategory.filter((c) => c !== id)
                : [...state.priorityCategory, id],
            };
          }
          return { priorityCategory: categories };
        }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setWakeTime: (time) => set({ wakeTime: time }),
      setSleepTime: (time) => set({ sleepTime: time }),

      // ── Projects & Todos ─────────────────────────────────────────────────
      projects: DUMMY_PROJECTS,
      currentProjectId: 'proj-1',

      setProjects: (projects) =>
        set((state) => ({
          projects,
          currentProjectId: projects.some((p) => p.id === state.currentProjectId)
            ? state.currentProjectId
            : (projects[0]?.id ?? ''),
        })),

      setCurrentProjectId: (id) => set({ currentProjectId: id }),

      toggleTodo: (projectId, todoId) =>
        set((state) => {
          let toggledCompleted: boolean | undefined;
          const projects = state.projects.map((p) =>
            p.id === projectId
              ? { ...p, todos: p.todos.map((t) => { if (t.id !== todoId) return t; toggledCompleted = !t.completed; return { ...t, completed: toggledCompleted }; }) }
              : p,
          );
          const calendarEvents = state.calendarEvents.map((e) =>
            e.externalId === `todo:${todoId}` && toggledCompleted !== undefined ? { ...e, completed: toggledCompleted } : e,
          );
          return { projects, calendarEvents };
        }),

      addTodo: (projectId, todo) => {
        const todoId = `todo-${genId()}`;
        set((state) => {
          const newTodo: TodoItem = { ...todo, id: todoId };
          const projects = state.projects.map((p) =>
            p.id === projectId ? { ...p, todos: [...p.todos, newTodo] } : p,
          );
          const linkedCalendarEvent: CalendarEvent = {
            id: `evt-${genId()}`,
            source: 'native',
            externalId: `todo:${todoId}`,
            title: newTodo.title,
            description: newTodo.description,
            time: newTodo.time || 'All day',
            date: getTodayString(),
            completed: newTodo.completed,
            colorVariant: newTodo.colorVariant,
            linkedValue: newTodo.linkedValue,
          };
          return { projects, calendarEvents: [...state.calendarEvents, linkedCalendarEvent] };
        });
        return todoId;
      },

      updateTodo: (projectId, todoId, updates) =>
        set((state) => {
          let mergedTodo: TodoItem | undefined;
          const projects = state.projects.map((p) =>
            p.id === projectId
              ? { ...p, todos: p.todos.map((t) => { if (t.id !== todoId) return t; mergedTodo = { ...t, ...updates }; return mergedTodo!; }) }
              : p,
          );
          if (!mergedTodo) return { projects };
          const rt = mergedTodo;
          const calendarEvents = state.calendarEvents.some((e) => e.externalId === `todo:${todoId}`)
            ? state.calendarEvents.map((e) => e.externalId === `todo:${todoId}` ? { ...e, title: rt.title, description: rt.description, time: rt.time || 'All day', completed: rt.completed, colorVariant: rt.colorVariant, linkedValue: rt.linkedValue } : e)
            : [...state.calendarEvents, { id: `evt-${genId()}`, source: 'native' as const, externalId: `todo:${todoId}`, title: rt.title, description: rt.description, time: rt.time || 'All day', date: getTodayString(), completed: rt.completed, colorVariant: rt.colorVariant, linkedValue: rt.linkedValue }];
          return { projects, calendarEvents };
        }),

      deleteTodo: (projectId, todoId) =>
        set((state) => ({
          projects: state.projects.map((p) => p.id === projectId ? { ...p, todos: p.todos.filter((t) => t.id !== todoId) } : p),
          calendarEvents: state.calendarEvents.filter((e) => e.externalId !== `todo:${todoId}`),
        })),

      addProject: (name) => {
        const newId = `proj-${genId()}`;
        set((state) => ({
          projects: [...(state.projects ?? []), { id: newId, name, todos: [] }],
          currentProjectId: newId,
        }));
        return newId;
      },

      // ── Calendar ─────────────────────────────────────────────────────────
      calendarEvents: [],
      mentalRehearsalCompletedDates: [],

      setCalendarEvents: (events) => set({ calendarEvents: events }),

      addCalendarEvent: (event) =>
        set((state) => ({ calendarEvents: [...state.calendarEvents, { ...event, id: `evt-${genId()}` }] })),

      toggleCalendarEvent: (eventId) =>
        set((state) => ({ calendarEvents: state.calendarEvents.map((e) => e.id === eventId ? { ...e, completed: !e.completed } : e) })),

      updateCalendarEvent: (eventId, updates) =>
        set((state) => ({ calendarEvents: state.calendarEvents.map((e) => e.id === eventId ? { ...e, ...updates } : e) })),

      deleteCalendarEvent: (eventId) =>
        set((state) => ({ calendarEvents: state.calendarEvents.filter((e) => e.id !== eventId) })),

      completeMentalRehearsalForDate: (date) =>
        set((state) => {
          const d = date.trim();
          if (!d || state.mentalRehearsalCompletedDates.includes(d)) return state;
          return { mentalRehearsalCompletedDates: [...state.mentalRehearsalCompletedDates, d] };
        }),

      clearMentalRehearsalForDate: (date) =>
        set((state) => ({ mentalRehearsalCompletedDates: state.mentalRehearsalCompletedDates.filter((d) => d !== date.trim()) })),

      importExternalCalendarItems: (items) =>
        set((state) => {
          if (!items.length) return state;
          const existingMap = new Map(state.calendarEvents.filter((e) => e.source === 'external' && e.externalId).map((e) => [e.externalId!, e]));
          const upserts = items.map((item) => {
            const existing = existingMap.get(item.externalId);
            if (existing) return { ...existing, title: item.title, description: item.description, date: item.date, time: item.time, externalId: item.externalId };
            return { id: `evt-${genId()}`, source: 'external' as const, externalId: item.externalId, title: item.title, description: item.description, date: item.date, time: item.time, completed: false, colorVariant: 'mint' as ColorVariant };
          });
          const upsertIds = new Set(upserts.map((e) => e.id));
          return {
            calendarEvents: [...state.calendarEvents.filter((e) => !upsertIds.has(e.id)), ...upserts],
            googleCalendarConnected: true,
            googleCalendarLastSyncedAt: new Date().toISOString(),
          };
        }),

      removeExternalCalendarItemsByIds: (externalIds) =>
        set((state) => {
          const ids = new Set(externalIds.map((id) => id.trim()).filter(Boolean));
          return { calendarEvents: state.calendarEvents.filter((e) => !(e.source === 'external' && e.externalId && ids.has(e.externalId.trim()))), googleCalendarLastSyncedAt: new Date().toISOString() };
        }),

      // ── Google Calendar ──────────────────────────────────────────────────
      googleCalendarConnected: false,
      googleCalendarLastSyncedAt: undefined,
      googleAccessToken: null,
      setGoogleCalendarConnected: (connected) => set({ googleCalendarConnected: connected }),
      setGoogleCalendarLastSyncedAt: (timestamp) => set({ googleCalendarLastSyncedAt: timestamp }),
      setGoogleAccessToken: (token) => set({ googleAccessToken: token }),

      // ── Custom Categories ────────────────────────────────────────────────
      customCategories: [],
      addCustomCategory: (category) => {
        const trimmed = category.trim();
        if (!trimmed) return { success: false, error: 'Category name cannot be empty' };
        if (trimmed.length > 20) return { success: false, error: 'Category name must be 20 characters or less' };
        const existing = (get().customCategories ?? []).map((c) => c.toLowerCase());
        if (existing.includes(trimmed.toLowerCase())) return { success: false, error: 'Category already exists' };
        set((state) => ({ customCategories: [...(state.customCategories ?? []), trimmed] }));
        return { success: true };
      },

      // ── Chat ─────────────────────────────────────────────────────────────
      chatMessages: INITIAL_CHAT,
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, { ...message, id: `msg-${genId()}`, timestamp: new Date().toISOString() }],
        })),
      clearChatMessages: () => set({ chatMessages: INITIAL_CHAT }),

      // ── FAB ──────────────────────────────────────────────────────────────
      fabPosition: null,
      setFabPosition: (pos) => set({ fabPosition: pos }),
    }),
    {
      name: 'value-vis-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        displayName: state.displayName,
        isOnboarding: state.isOnboarding,
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        calendarEvents: state.calendarEvents,
        mentalRehearsalCompletedDates: state.mentalRehearsalCompletedDates,
        googleCalendarConnected: state.googleCalendarConnected,
        googleCalendarLastSyncedAt: state.googleCalendarLastSyncedAt,
        customCategories: state.customCategories ?? [],
        chatMessages: state.chatMessages,
        fabPosition: state.fabPosition,
        selectedValueIds: state.selectedValueIds,
        priorityCategory: state.priorityCategory,
        timeframe: state.timeframe,
        subGoals: state.subGoals,
        customSubGoals: state.customSubGoals,
        morningRoutines: state.morningRoutines,
        eveningRoutines: state.eveningRoutines,
        habitCustomizations: state.habitCustomizations,
        wakeTime: state.wakeTime,
        sleepTime: state.sleepTime,
      }),
    },
  ),
);

// Selectors
export const selectSelectedValues = (state: AppState): Value[] =>
  state.selectedValueIds.map((id) => VALUES.find((v) => v.id === id)).filter((v): v is Value => v !== undefined);

export const selectAllSubGoals = (state: AppState): string[] => [...state.subGoals, ...state.customSubGoals];
