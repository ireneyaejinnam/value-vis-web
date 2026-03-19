// ValueVis Web — Type Definitions

export type InstrumentalValue =
  | 'Ambitious' | 'Capable' | 'Cheerful' | 'Helpful' | 'Honest'
  | 'Intellectual' | 'Logical' | 'Loving' | 'Polite';

export type TerminalValue =
  | 'Wisdom' | 'Freedom' | 'A World of Beauty' | 'Family Security'
  | 'Sense of Accomplishment' | 'Comfortable Life';

export type ColorVariant = 'coral' | 'blue' | 'mint' | 'purple' | 'pink';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

export interface TodoSubtask {
  id: string;
  title: string;
  completed: boolean;
  generatedBy?: 'user' | 'ai';
}

export interface TodoItem {
  id: string;
  source?: 'native' | 'external';
  externalId?: string;
  title: string;
  description?: string;
  time?: string;
  priority?: 'high' | 'medium' | 'low';
  linkedValue?: string;
  completed: boolean;
  category: string;
  projectId: string;
  colorVariant?: ColorVariant;
  durationMins?: number;
  subtasks?: TodoSubtask[];
}

export interface Project {
  id: string;
  name: string;
  todos: TodoItem[];
}

export interface CalendarEvent {
  id: string;
  source?: 'native' | 'external';
  externalId?: string;
  title: string;
  description?: string;
  time: string;
  date: string;
  isAllDay?: boolean;
  linkedValue?: string;
  completed: boolean;
  colorVariant?: ColorVariant;
}

export interface FabPosition { x: number; y: number; }

export const COLOR_OPTIONS: ColorVariant[] = ['coral', 'blue', 'mint', 'purple', 'pink'];
export const BASE_CATEGORIES = ['Presentation', 'Paper Write-up', 'General'] as const;
