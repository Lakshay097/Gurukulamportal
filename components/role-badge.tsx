interface RoleBadgeProps {
  colorTier: 'admin' | 'internal' | 'other';
  label?: string;
}

export default function RoleBadge({ colorTier, label }: RoleBadgeProps) {
  const colorMap = {
    admin: 'bg-[var(--color-admin)]',
    internal: 'bg-[var(--color-internal)]',
    other: 'bg-[var(--color-other)]',
  };

  const defaultLabels = {
    admin: 'Admin',
    internal: 'Staff',
    other: 'Restricted',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colorMap[colorTier]}`}>
      {label || defaultLabels[colorTier]}
    </span>
  );
}
