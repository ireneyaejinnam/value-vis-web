import type { PriorityCategory } from '../../types/onboarding';

export const TIMEFRAME_OPTIONS = ["1 Year", "3 Years", "5 Years", "10 Years"];

export const PRIORITY_CATEGORIES: PriorityCategory[] = [
  { id: "career", label: "Career", icon: "briefcase", subGoals: ["Get promoted","Switch industries","Start a business","Build leadership skills","Expand professional network","Learn new technical skills"] },
  { id: "health", label: "Health", icon: "heart", subGoals: ["Exercise regularly","Improve diet","Better sleep schedule","Mental wellness","Run a marathon","Reduce stress"] },
  { id: "financial", label: "Financial", icon: "dollar-sign", subGoals: ["Build emergency fund","Start investing","Pay off debt","Save for retirement","Create passive income","Budget consistently"] },
  { id: "education", label: "Education", icon: "book-open", subGoals: ["Get a degree","Learn a new language","Take online courses","Read more books","Get certified","Attend workshops"] },
  { id: "relationship", label: "Relationship", icon: "users", subGoals: ["Strengthen family bonds","Make new friends","Find a partner","Improve communication","Be more present","Join communities"] },
  { id: "lifestyle", label: "Lifestyle", icon: "sun", subGoals: ["Travel more","Develop a hobby","Declutter life","Work-life balance","Live minimally","Practice mindfulness"] },
  { id: "social-impact", label: "Social Impact", icon: "globe", subGoals: ["Volunteer regularly","Support a cause","Mentor someone","Reduce carbon footprint","Donate to charity","Community involvement"] },
];
