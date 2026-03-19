export interface Value {
  id: string;
  label: string;
  definition: string;
  color: string;
  selectedColor: string;
  tintBg: string;
  category: 'Openness to Change' | 'Self-Enhancement' | 'Conservation' | 'Self-Transcendence';
}

export interface Habit {
  id: string;
  name: string;
  subtitle: string;
  category: 'suggested' | 'diet' | 'sports' | 'health';
  valueIds: string[];
}

export interface HabitCustomization {
  frequency: 'daily' | 'weekly' | 'monthly';
  section: 'morning' | 'evening';
  goalCount?: number;
  reminder?: string;
  monthlyDates?: number[];
  selectedDays?: number[];
}

export interface PriorityCategory {
  id: string;
  label: string;
  icon: string;
  subGoals: string[];
}
