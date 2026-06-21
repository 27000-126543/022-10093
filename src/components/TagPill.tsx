import { cn } from '@/lib/utils';

interface TagPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function TagPill({ label, active = false, onClick, size = 'md' }: TagPillProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'tag-pill',
        active ? 'tag-pill-active' : 'tag-pill-default',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      )}
    >
      {label}
    </span>
  );
}
