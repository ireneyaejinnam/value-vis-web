import type { ColorVariant } from '../../types';

const colorMap: Record<ColorVariant, { bg: string; text: string; border: string }> = {
  coral:  { bg: 'rgba(232,154,122,0.15)', text: '#C07050', border: 'rgba(232,154,122,0.4)' },
  blue:   { bg: 'rgba(122,154,232,0.15)', text: '#4A6FC0', border: 'rgba(122,154,232,0.4)' },
  mint:   { bg: 'rgba(122,232,208,0.15)', text: '#2AA890', border: 'rgba(122,232,208,0.4)' },
  purple: { bg: 'rgba(184,122,232,0.15)', text: '#8050B8', border: 'rgba(184,122,232,0.4)' },
  pink:   { bg: 'rgba(232,122,184,0.15)', text: '#B04888', border: 'rgba(232,122,184,0.4)' },
};

interface Props {
  variant: ColorVariant;
  size?: 'sm' | 'md';
}

export function ColorVariantDot({ variant, size = 'md' }: Props) {
  const c = colorMap[variant];
  const s = size === 'sm' ? 8 : 10;
  return <div style={{ width: s, height: s, background: c.text, borderRadius: '50%', flexShrink: 0 }} />;
}

export function colorVariantStyle(variant?: ColorVariant) {
  if (!variant) return { background: 'rgba(255,255,255,0.8)', borderColor: '#E2E4EC' };
  const c = colorMap[variant];
  return { background: c.bg, borderColor: c.border };
}

export function colorVariantText(variant?: ColorVariant): string {
  if (!variant) return '#6363E1';
  return colorMap[variant].text;
}
