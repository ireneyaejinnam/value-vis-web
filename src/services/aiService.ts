import { useAppStore } from '../store/useAppStore';
import { VALUES, PRIORITY_CATEGORIES } from '../constants/onboarding';
import type { Value } from '../types/onboarding';
import type { ColorVariant } from '../types';

export type ChatContentBlock =
  | { type: 'text'; text: string }
  | { type: 'values'; values: Value[] }
  | { type: 'tasks'; tasks: ChatTaskData[] }
  | { type: 'goals'; categories: ChatGoalData[] }
  | { type: 'actions'; actions: ChatAction[] }
  | { type: 'confirm_tasks'; message: string; tasks: ChatTaskData[]; confirmAction: string }
  | { type: 'confirm_calendar'; message: string; events: CalendarEventData[]; confirmAction: string };

export interface ChatTaskData {
  id: string;
  title: string;
  linkedValue?: string;
  colorVariant?: ColorVariant;
  time?: string;
  completed: boolean;
  subtaskCount?: number;
}

export interface ChatGoalData {
  id: string;
  label: string;
  icon: string;
  selected?: boolean;
}

export interface ChatAction {
  id: string;
  label: string;
  prompt?: string;
}

export interface CalendarEventData {
  id: string;
  title: string;
  date: string;
  time: string;
  linkedValue?: string;
  colorVariant?: ColorVariant;
}

function buildSystemPrompt(): string {
  const state = useAppStore.getState();
  const selectedValues = state.selectedValueIds.map((id) => VALUES.find((v) => v.id === id)).filter(Boolean) as Value[];
  const priorityCat = PRIORITY_CATEGORIES.find((c) => state.priorityCategory.includes(c.id));
  const subGoals = [...state.subGoals, ...state.customSubGoals];
  const recentTodos = state.projects.flatMap((p) => p.todos).slice(0, 10).map((t) => `- ${t.title} (${t.completed ? 'done' : 'pending'})`).join('\n');

  return `You are ValueVis, a personal productivity coach that helps users align their daily actions with their core values.

User Profile:
- Name: ${state.displayName ?? 'User'}
- Core Values: ${selectedValues.map((v) => `${v.label} (${v.definition})`).join(', ') || 'Not set yet'}
- Priority Area: ${priorityCat?.label ?? 'Not set'}
- Goals: ${subGoals.join(', ') || 'Not set'}
- Timeframe: ${state.timeframe}

Recent Tasks:
${recentTodos || 'No tasks yet'}

Your role:
1. Help users align tasks and habits with their values
2. Suggest tasks, goals, and habits that reflect their values
3. Provide motivational insights grounded in their values
4. When appropriate, suggest creating tasks or calendar events (use confirm_tasks or confirm_calendar blocks)

Response format: Plain conversational text. Be warm, insightful, and concise.`;
}

export async function sendChatMessage(
  userMessage: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const state = useAppStore.getState();
  const history = state.chatMessages.slice(-10).map((m) => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    // Demo mode
    await simulateDemoResponse(userMessage, onChunk, signal);
    return;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        ...history,
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      } catch {}
    }
  }
}

export async function generateMentalRehearsalScript(date: string): Promise<string> {
  const state = useAppStore.getState();
  const selectedValues = state.selectedValueIds
    .map((id) => VALUES.find((v) => v.id === id))
    .filter(Boolean) as Value[];
  const subGoals = [...state.subGoals, ...state.customSubGoals];
  const todayEvents = state.calendarEvents
    .filter((e) => e.date === date)
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((e) => `• ${e.time === 'All day' ? 'All day' : e.time} — ${e.title}`)
    .join('\n') || 'No events scheduled';

  const prompt = `Write a 200-word mental rehearsal visualization script for ${state.displayName ?? 'the user'}.

Their core values: ${selectedValues.map((v) => v.label).join(', ') || 'not set'}
Their goals: ${subGoals.join(', ') || 'not set'}
Today's schedule:
${todayEvents}

Structure the script as:
1. One sentence grounding breath to settle in
2. Walk through each scheduled event, visualizing it going well and connecting it to their values
3. Close with a single concrete intention for the day

Write in second person, present tense. Be warm, specific, and personal. Keep it under 220 words.`;

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return `Take a slow, deep breath and let your body settle.\n\nPicture your day unfolding with clarity and intention. Each task you've set for yourself today is an expression of what matters most to you — your values of ${selectedValues.map((v) => v.label).join(' and ') || 'growth and purpose'}.\n\nSee yourself moving through your schedule with focus and calm. When challenges arise, you meet them with the same values that guide your life. You are prepared, grounded, and clear.\n\nYour intention for today: show up fully aligned with who you are becoming.`;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 280,
      messages: [
        { role: 'system', content: 'You are a mindfulness and visualization coach. Write concise, personal, calming scripts.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error('Script generation failed');
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

const DEMO_RESPONSES = [
  "That's a great question! Based on your core values, I'd suggest focusing on tasks that align with what matters most to you. What specific area would you like to explore?",
  "I can see you're working on some meaningful projects. How are you feeling about the progress so far? Remember, aligning your work with your values helps maintain motivation.",
  "Let's think about how your current tasks connect to your deeper values. Which of your goals feels most energizing right now?",
  "Values-based productivity means doing work that feels authentic. Looking at your task list, I see some great opportunities to strengthen your value alignment.",
  "That's a wonderful area to focus on. Your commitment to your values shows in how you approach your work. Would you like some suggestions for next steps?",
];

async function simulateDemoResponse(
  _userMessage: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
  const words = response.split(' ');
  for (const word of words) {
    if (signal?.aborted) return;
    onChunk(word + ' ');
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 30));
  }
}
