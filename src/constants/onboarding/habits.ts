import type { Habit } from '../../types/onboarding';

export const MORNING_HABITS: Habit[] = [
  { id: "m-meditate", name: "Meditate", subtitle: "10 min mindfulness", category: "suggested", valueIds: ["social-order", "independent-thinking", "reliability"] },
  { id: "m-journal", name: "Journal", subtitle: "Write morning thoughts", category: "suggested", valueIds: ["reliability", "open-mindedness", "caring-for-others"] },
  { id: "m-exercise", name: "Exercise", subtitle: "30 min workout", category: "suggested", valueIds: ["success", "independent-thinking", "pleasure"] },
  { id: "m-read", name: "Read", subtitle: "Read 20 pages", category: "suggested", valueIds: ["open-mindedness", "social-order", "independent-thinking"] },
  { id: "m-water", name: "Drink Water", subtitle: "2 glasses on waking", category: "diet", valueIds: ["independent-thinking", "caring-for-others", "social-order"] },
  { id: "m-healthy-breakfast", name: "Healthy Breakfast", subtitle: "Balanced meal", category: "diet", valueIds: ["independent-thinking", "success", "social-order"] },
  { id: "m-smoothie", name: "Green Smoothie", subtitle: "Fruits & veggies blend", category: "diet", valueIds: ["independent-thinking", "pleasure", "caring-for-others"] },
  { id: "m-no-sugar", name: "Skip Sugar", subtitle: "No added sugar AM", category: "diet", valueIds: ["social-order", "success", "independent-thinking"] },
  { id: "m-yoga", name: "Yoga", subtitle: "15 min stretching", category: "sports", valueIds: ["pleasure", "independent-thinking", "politeness"] },
  { id: "m-run", name: "Morning Run", subtitle: "2-3 km jog", category: "sports", valueIds: ["success", "independent-thinking", "pleasure"] },
  { id: "m-pushups", name: "Push-ups", subtitle: "3 sets of 15", category: "sports", valueIds: ["success", "independent-thinking", "social-order"] },
  { id: "m-stretch", name: "Stretch", subtitle: "Full body 10 min", category: "sports", valueIds: ["independent-thinking", "caring-for-others", "pleasure"] },
  { id: "m-coldshower", name: "Cold Shower", subtitle: "2 min cold rinse", category: "health", valueIds: ["success", "independent-thinking", "social-order"] },
  { id: "m-sunlight", name: "Get Sunlight", subtitle: "10 min outdoor light", category: "health", valueIds: ["pleasure", "independent-thinking", "caring-for-others"] },
  { id: "m-vitamins", name: "Take Vitamins", subtitle: "Daily supplements", category: "health", valueIds: ["independent-thinking", "social-order", "caring-for-others"] },
  { id: "m-skincare", name: "Skincare Routine", subtitle: "Cleanse & moisturize", category: "health", valueIds: ["politeness", "independent-thinking", "pleasure"] },
];

export const EVENING_HABITS: Habit[] = [
  { id: "e-reflect", name: "Reflect", subtitle: "Review the day", category: "suggested", valueIds: ["reliability", "open-mindedness", "social-order"] },
  { id: "e-plan", name: "Plan Tomorrow", subtitle: "Set 3 priorities", category: "suggested", valueIds: ["social-order", "success", "independent-thinking"] },
  { id: "e-gratitude", name: "Gratitude", subtitle: "Write 3 things", category: "suggested", valueIds: ["pleasure", "nature", "reliability"] },
  { id: "e-wind-down", name: "Wind Down", subtitle: "No screens 30 min", category: "suggested", valueIds: ["social-order", "independent-thinking", "caring-for-others"] },
  { id: "e-light-dinner", name: "Light Dinner", subtitle: "Eat before 7pm", category: "diet", valueIds: ["social-order", "independent-thinking", "caring-for-others"] },
  { id: "e-herbal-tea", name: "Herbal Tea", subtitle: "Calming chamomile", category: "diet", valueIds: ["pleasure", "politeness", "caring-for-others"] },
  { id: "e-no-caffeine", name: "No Caffeine", subtitle: "After 2pm cutoff", category: "diet", valueIds: ["social-order", "independent-thinking", "success"] },
  { id: "e-prep-meals", name: "Prep Meals", subtitle: "Tomorrow's lunch", category: "diet", valueIds: ["independent-thinking", "social-order", "success"] },
  { id: "e-walk", name: "Evening Walk", subtitle: "20 min stroll", category: "sports", valueIds: ["pleasure", "independent-thinking", "nature"] },
  { id: "e-stretch-eve", name: "Stretch", subtitle: "Release tension", category: "sports", valueIds: ["independent-thinking", "pleasure", "caring-for-others"] },
  { id: "e-light-yoga", name: "Gentle Yoga", subtitle: "Relaxing flow", category: "sports", valueIds: ["pleasure", "politeness", "independent-thinking"] },
  { id: "e-foam-roll", name: "Foam Roll", subtitle: "Muscle recovery", category: "sports", valueIds: ["independent-thinking", "social-order", "success"] },
  { id: "e-sleep-schedule", name: "Fixed Bedtime", subtitle: "Same time daily", category: "health", valueIds: ["social-order", "independent-thinking", "success"] },
  { id: "e-skincare-pm", name: "PM Skincare", subtitle: "Night routine", category: "health", valueIds: ["politeness", "independent-thinking", "pleasure"] },
  { id: "e-deep-breath", name: "Deep Breathing", subtitle: "5 min box breathing", category: "health", valueIds: ["social-order", "independent-thinking", "pleasure"] },
  { id: "e-phone-away", name: "Phone Away", subtitle: "Airplane mode at 10", category: "health", valueIds: ["social-order", "success", "independent-thinking"] },
];

export const HABIT_FILTER_TABS = ["Suggested", "Diet", "Sports", "Health"] as const;
