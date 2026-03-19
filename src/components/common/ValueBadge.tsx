import { VALUES } from '../../constants/onboarding';

interface Props {
  valueId: string;
  size?: 'sm' | 'md';
}

export function ValueBadge({ valueId, size = 'sm' }: Props) {
  const value = VALUES.find((v) => v.id === valueId);
  if (!value) return null;

  const fontSize = size === 'sm' ? '10px' : '12px';
  const padding = size === 'sm' ? '2px 7px' : '4px 9px';

  return (
    <span style={{
      background: value.tintBg,
      color: value.color,
      border: `1px solid ${value.color}50`,
      borderRadius: 999,
      fontSize,
      padding,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {value.label}
    </span>
  );
}
