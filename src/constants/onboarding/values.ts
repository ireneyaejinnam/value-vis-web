import type { Value } from '../../types/onboarding';

export const VALUE_CATEGORIES = [
  'Openness to Change',
  'Self-Enhancement',
  'Conservation',
  'Self-Transcendence',
] as const;

export const VALUES: Value[] = [
  { id: 'independent-thinking', label: 'Independent Thinking', definition: 'Think for yourself', color: '#ff6b6b', selectedColor: '#ff6b6b', tintBg: 'rgba(255,107,107,0.1)', category: 'Openness to Change' },
  { id: 'freedom-to-act', label: 'Freedom to Act', definition: 'Choose your own path', color: '#ee5a6f', selectedColor: '#ee5a6f', tintBg: 'rgba(238,90,111,0.1)', category: 'Openness to Change' },
  { id: 'excitement', label: 'Excitement', definition: 'Seek novelty and challenge', color: '#ff9ff3', selectedColor: '#ff9ff3', tintBg: 'rgba(255,159,243,0.1)', category: 'Openness to Change' },
  { id: 'pleasure', label: 'Pleasure', definition: 'Enjoy life fully', color: '#feca57', selectedColor: '#feca57', tintBg: 'rgba(254,202,87,0.1)', category: 'Self-Enhancement' },
  { id: 'success', label: 'Success', definition: 'Achieve goals, show skill', color: '#ff9f43', selectedColor: '#ff9f43', tintBg: 'rgba(255,159,67,0.1)', category: 'Self-Enhancement' },
  { id: 'influence', label: 'Influence', definition: 'Impact people and decisions', color: '#ee5a24', selectedColor: '#ee5a24', tintBg: 'rgba(238,90,36,0.1)', category: 'Self-Enhancement' },
  { id: 'wealth', label: 'Wealth', definition: 'Build material security', color: '#c23616', selectedColor: '#c23616', tintBg: 'rgba(194,54,22,0.1)', category: 'Self-Enhancement' },
  { id: 'reputation', label: 'Reputation', definition: 'Maintain social image', color: '#e67e22', selectedColor: '#e67e22', tintBg: 'rgba(230,126,34,0.1)', category: 'Self-Enhancement' },
  { id: 'personal-safety', label: 'Personal Safety', definition: 'Stay safe from harm', color: '#54a0ff', selectedColor: '#54a0ff', tintBg: 'rgba(84,160,255,0.1)', category: 'Conservation' },
  { id: 'social-order', label: 'Social Order', definition: 'Support stability and structure', color: '#2e86de', selectedColor: '#2e86de', tintBg: 'rgba(46,134,222,0.1)', category: 'Conservation' },
  { id: 'tradition', label: 'Tradition', definition: 'Respect customs and heritage', color: '#a29bfe', selectedColor: '#a29bfe', tintBg: 'rgba(162,155,254,0.1)', category: 'Conservation' },
  { id: 'following-rules', label: 'Following Rules', definition: 'Follow norms, avoid harm', color: '#6c5ce7', selectedColor: '#6c5ce7', tintBg: 'rgba(108,92,231,0.1)', category: 'Conservation' },
  { id: 'politeness', label: 'Politeness', definition: 'Be respectful to others', color: '#5f27cd', selectedColor: '#5f27cd', tintBg: 'rgba(95,39,205,0.1)', category: 'Conservation' },
  { id: 'humility', label: 'Humility', definition: 'Stay grounded and modest', color: '#786fa6', selectedColor: '#786fa6', tintBg: 'rgba(120,111,166,0.1)', category: 'Conservation' },
  { id: 'caring-for-others', label: 'Caring for Others', definition: 'Support those close by', color: '#48dbfb', selectedColor: '#48dbfb', tintBg: 'rgba(72,219,251,0.1)', category: 'Self-Transcendence' },
  { id: 'reliability', label: 'Reliability', definition: 'Be dependable, trustworthy', color: '#0abde3', selectedColor: '#0abde3', tintBg: 'rgba(10,189,227,0.1)', category: 'Self-Transcendence' },
  { id: 'social-justice', label: 'Social Justice', definition: 'Advance fairness for all', color: '#00d2d3', selectedColor: '#00d2d3', tintBg: 'rgba(0,210,211,0.1)', category: 'Self-Transcendence' },
  { id: 'nature', label: 'Nature', definition: 'Protect the natural world', color: '#1dd1a1', selectedColor: '#1dd1a1', tintBg: 'rgba(29,209,161,0.1)', category: 'Self-Transcendence' },
  { id: 'open-mindedness', label: 'Open-Mindedness', definition: 'Accept diverse views', color: '#10ac84', selectedColor: '#10ac84', tintBg: 'rgba(16,172,132,0.1)', category: 'Self-Transcendence' },
];

export const MAX_VALUES = 3;
