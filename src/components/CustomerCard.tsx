import { useNavigate } from 'react-router-dom';
import { UserCircle2 } from 'lucide-react';
import type { Customer } from '@/types';
import { TIER_CONFIG, DECISION_CYCLES } from '@/constants/dictionaries';
import { useCustomerStore } from '@/store/customerStore';
import { daysSince } from '@/utils/tierAlgorithm';
import { cn } from '@/lib/utils';
import TagPill from './TagPill';

interface CustomerCardProps {
  customer: Customer;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const navigate = useNavigate();
  const consultants = useCustomerStore((state) => state.consultants);
  const tierConfig = TIER_CONFIG[customer.tier];

  const consultant = consultants.find((c) => c.id === customer.consultant_id);

  const lastFollowDays = customer.last_follow_up
    ? daysSince(customer.last_follow_up)
    : daysSince(customer.created_at);

  const decisionCycleLabel = DECISION_CYCLES.find((d) => d.value === customer.decision_cycle)?.label || '-';

  const budgetMin = Math.floor(customer.budget_min / 10000);
  const budgetMax = Math.floor(customer.budget_max / 10000);

  const handleClick = () => {
    navigate(`/customers/${customer.id}/profile`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'card card-hover cursor-pointer p-4 relative overflow-hidden',
        customer.tier === 'high' && 'animate-pulse-border'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-gold-100 flex items-center justify-center">
            <UserCircle2 className="w-6 h-6 text-rose-gold-500" />
          </div>
          <div>
            <div className="font-semibold text-ink">{customer.name}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-peach-soft text-ink-soft">
                {customer.gender === 'female' ? '女' : '男'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-peach-soft text-ink-soft">
                {customer.age}岁
              </span>
            </div>
          </div>
        </div>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: tierConfig.bgColor, color: tierConfig.color }}
        >
          {tierConfig.label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {customer.projects.slice(0, 2).map((project) => (
            <TagPill key={project} label={project} size="sm" />
          ))}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-soft">
            预算：<span className="text-ink font-medium">¥{budgetMin}万-¥{budgetMax}万</span>
          </span>
          <span className="text-ink-soft">
            决策：<span className="text-ink font-medium">{decisionCycleLabel}</span>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-peach-soft overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${customer.deal_probability}%`,
                background: 'linear-gradient(90deg, #D4A574, #FF6B6B)',
              }}
            />
          </div>
          <span className="text-xs font-semibold text-ink w-10 text-right">
            {customer.deal_probability}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-ink-soft">
          <span>距上次跟进 {lastFollowDays} 天</span>
          <span>咨询师：{consultant?.name || '-'}</span>
        </div>
      </div>
    </div>
  );
}
