import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  ShoppingBag,
  Search,
  Plus,
  AlertTriangle,
  Phone,
  ChevronDown,
  UserCircle2,
  Flame,
  ArrowRight,
  Eye,
  BarChart3,
  PieChart as PieChartIcon,
  ChevronUp,
} from 'lucide-react';

import { useCustomerStore } from '@/store/customerStore';
import { TIER_CONFIG } from '@/constants/dictionaries';
import type { TierType, Customer } from '@/types';
import { daysSince } from '@/utils/tierAlgorithm';
import { cn } from '@/lib/utils';

const TIER_ORDER: TierType[] = ['high', 'nurturing', 'watching', 'dormant'];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDealInRange(customer: Customer, startDate: string, endDate: string): boolean {
  if (customer.status !== 'deal') return false;
  const dealDate = customer.deal_at ?? customer.created_at;
  return dealDate >= startDate && dealDate <= endDate;
}

function getDateRangeArray(days: number) {
  const result: { date: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    result.push({ date: dateStr, label });
  }
  return result;
}

const lineColors = ['#D4A574', '#FF6B6B', '#4ECDC4', '#F59E0B'];

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  highlight,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  highlight?: 'coral' | 'mint';
  trend?: 'up';
}) {
  return (
    <motion.div variants={fadeInUp} className="card card-hover p-5 relative overflow-hidden">
      {highlight === 'coral' && (
        <div className="absolute inset-0 bg-gradient-to-br from-coral/5 to-transparent pointer-events-none" />
      )}
      {highlight === 'mint' && (
        <div className="absolute inset-0 bg-gradient-to-br from-mint/5 to-transparent pointer-events-none" />
      )}
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-soft mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-3xl font-serif font-bold',
                highlight === 'coral' && 'text-coral',
                highlight === 'mint' && 'text-mint',
                !highlight && 'text-ink'
              )}
            >
              {value}
            </span>
            {trend === 'up' && (
              <TrendingUp className="w-5 h-5 text-mint" />
            )}
          </div>
          {subValue && (
            <p
              className={cn(
                'text-sm mt-2',
                highlight === 'mint' ? 'text-mint' : 'text-ink-soft'
              )}
            >
              {subValue}
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center',
            highlight === 'coral' && 'bg-coral/10',
            highlight === 'mint' && 'bg-mint/10',
            !highlight && 'bg-peach-soft'
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5',
              highlight === 'coral' && 'text-coral',
              highlight === 'mint' && 'text-mint',
              !highlight && 'text-rose-gold-500'
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}

function FollowUpRateRing({ rate }: { rate: number }) {
  const circumference = 2 * Math.PI * 22;
  const offset = circumference * (1 - rate);
  return (
    <div className="relative w-11 h-11">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
        <circle
          cx="26"
          cy="26"
          r="22"
          stroke="rgb(246 237 226)"
          strokeWidth="5"
          fill="none"
        />
        <circle
          cx="26"
          cy="26"
          r="22"
          stroke="url(#ringGradient)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4A574" />
            <stop offset="100%" stopColor="#B8956E" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-ink">
          {Math.round(rate * 100)}%
        </span>
      </div>
    </div>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
  const navigate = useNavigate();
  const tierCfg = TIER_CONFIG[customer.tier];
  const lastActiveDays = customer.last_follow_up
    ? daysSince(customer.last_follow_up)
    : daysSince(customer.created_at);
  const maskPhone =
    customer.phone.length >= 11
      ? customer.phone.slice(0, 3) + '****' + customer.phone.slice(7)
      : customer.phone;

  const handleClick = () => {
    navigate(`/customers/${customer.id}/profile`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      onClick={handleClick}
      className={cn(
        'group rounded-xl border bg-white p-3.5 cursor-pointer transition-all duration-300',
        'border-rose-gold-50 hover:shadow-card-hover hover:-translate-y-0.5',
        customer.tier === 'high' && 'animate-pulse-border'
      )}
      style={{
        borderTop: `3px solid ${tierCfg.color}`,
      }}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-ink text-sm">{customer.name}</h4>
            <span className="text-xs text-ink-soft">{customer.age}岁</span>
          </div>
          <p className="text-xs text-ink-soft/70 mt-0.5">{maskPhone}</p>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: tierCfg.bgColor, color: tierCfg.color }}
        >
          {tierCfg.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2.5 min-h-[20px]">
        {customer.projects.slice(0, 2).map((p) => (
          <span
            key={p}
            className="text-[10px] px-1.5 py-0.5 bg-peach-soft text-ink-soft rounded"
          >
            {p}
          </span>
        ))}
        {customer.projects.length > 2 && (
          <span className="text-[10px] px-1.5 py-0.5 bg-peach-soft text-ink-soft rounded">
            +{customer.projects.length - 2}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-soft">
        <span>意向度 {customer.deal_probability}分</span>
        <span>{lastActiveDays === 0 ? '今日活跃' : `${lastActiveDays}天前`}</span>
      </div>
    </motion.div>
  );
}

function TierColumn({
  tier,
  customers,
}: {
  tier: TierType;
  customers: Customer[];
}) {
  const cfg = TIER_CONFIG[tier];
  return (
    <motion.div variants={fadeInUp} className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: cfg.color }}
          />
          <h3 className="font-semibold text-ink text-sm">{cfg.label}</h3>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
          >
            {customers.length}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-ink-soft/60 mb-3 px-1">
        {cfg.followDays}天内跟进 · 共{customers.length}人
      </p>
      <div
        className="space-y-2.5 overflow-y-auto pr-1 flex-1"
        style={{ maxHeight: 'calc(100vh - 420px)' }}
      >
        {customers.length === 0 ? (
          <div className="text-center text-ink-soft/50 text-xs py-12">
            暂无客户
          </div>
        ) : (
          customers.map((c) => <CustomerCard key={c.id} customer={c} />)
        )}
      </div>
    </motion.div>
  );
}

function OverduePanel({
  overdueCustomers,
}: {
  overdueCustomers: Customer[];
}) {
  const handleFollowUp = (customerId: string) => {
    const tasks = useCustomerStore.getState().tasks;
    const customerTask = tasks.find(
      (t) => t.customer_id === customerId && !t.completed
    );
    if (customerTask) {
      useCustomerStore.getState().completeTask(customerTask.id);
    }
  };

  return (
    <motion.div variants={fadeInUp} className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-coral/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-coral" />
          </div>
          <h3 className="font-serif font-semibold text-ink">超期未跟进预警</h3>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 bg-coral/10 text-coral rounded-full">
          {overdueCustomers.length}人
        </span>
      </div>
      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {overdueCustomers.length === 0 ? (
          <div className="text-center text-ink-soft/50 text-sm py-8">
            暂无超期客户
          </div>
        ) : (
          overdueCustomers.map((c) => {
            const lastActiveDays = c.last_follow_up
              ? daysSince(c.last_follow_up)
              : daysSince(c.created_at);
            const tierCfg = TIER_CONFIG[c.tier];
            const isCritical = lastActiveDays > 7;
            return (
              <div
                key={c.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl transition-all',
                  isCritical
                    ? 'bg-coral/10 border border-coral/20'
                    : 'bg-peach-soft/50 border border-rose-gold-50'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: tierCfg.bgColor }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: tierCfg.color }}
                    >
                      {c.name.slice(-1)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {c.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: tierCfg.bgColor,
                          color: tierCfg.color,
                        }}
                      >
                        {tierCfg.label}
                      </span>
                      <span
                        className={cn(
                          isCritical ? 'text-coral font-medium' : 'text-ink-soft'
                        )}
                      >
                        超期{lastActiveDays}天
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleFollowUp(c.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-gold-gradient text-white rounded-lg text-xs font-medium hover:shadow-glow transition-all flex-shrink-0"
                >
                  <Phone className="w-3 h-3" />
                  跟进
                </button>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

function ConsultantRanking({
  consultants,
  customers,
  tasks,
}: {
  consultants: ReturnType<typeof useCustomerStore.getState>['consultants'];
  customers: Customer[];
  tasks: ReturnType<typeof useCustomerStore.getState>['tasks'];
}) {
  const stats = useMemo(() => {
    return consultants
      .map((c) => {
        const myCustomers = customers.filter((x) => x.consultant_id === c.id);
        const myTasks = tasks.filter((t) =>
          myCustomers.some((mc) => mc.id === t.customer_id)
        );
        const completedTasks = myTasks.filter((t) => t.completed);
        const sevenDayRate =
          myTasks.length > 0 ? completedTasks.length / myTasks.length : 0;
        const highValue = myCustomers.filter((x) => x.tier === 'high').length;
        const deals = myCustomers.filter((x) => x.status === 'deal');
        const conversionRate =
          myCustomers.length > 0 ? deals.length / myCustomers.length : 0;
        return {
          ...c,
          displayName: c.name,
          sevenDayRate,
          highValue,
          conversionRate,
        };
      })
      .sort((a, b) => b.highValue - a.highValue);
  }, [consultants, customers, tasks]);

  return (
    <motion.div variants={fadeInUp} className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-mint/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-mint" />
        </div>
        <h3 className="font-serif font-semibold text-ink">咨询师业绩排名</h3>
      </div>
      <div className="space-y-4">
        {stats.map((s, idx) => (
          <div key={s.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    idx === 0 && 'bg-amber-100 text-amber-600',
                    idx === 1 && 'bg-rose-gold-100 text-rose-gold-600',
                    idx === 2 && 'bg-orange-100 text-orange-600',
                    idx >= 3 && 'bg-rose-gold-50 text-ink-soft'
                  )}
                >
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-ink">
                  {s.displayName}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-coral font-medium">
                  {s.highValue}高价值
                </span>
                <span className="text-mint font-medium">
                  {Math.round(s.conversionRate * 100)}%转化
                </span>
              </div>
            </div>
            <div className="relative h-6 bg-peach-soft/50 rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-lg"
                style={{
                  width: `${Math.max(s.highValue * 4, 8)}%`,
                  background:
                    'linear-gradient(90deg, #D4A574 0%, #E2C29E 50%, #B8956E 100%)',
                  opacity: 0.85,
                }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-coral/60 rounded-lg"
                style={{ width: `${s.sevenDayRate * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-[11px] text-ink/80 font-medium">
                  7日跟进率 {Math.round(s.sevenDayRate * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TierDistributionPie({
  tierCounts,
}: {
  tierCounts: Record<TierType, number>;
}) {
  const data = TIER_ORDER.map((t) => ({
    name: TIER_CONFIG[t].label,
    value: tierCounts[t],
    color: TIER_CONFIG[t].color,
  })).filter((d) => d.value > 0);

  return (
    <motion.div variants={fadeInUp} className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-peach flex items-center justify-center">
            <Users className="w-4 h-4 text-rose-gold-500" />
          </div>
          <h3 className="font-serif font-semibold text-ink">客户分层占比</h3>
        </div>
      </div>
      <div className="h-[220px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ink-soft/50 text-sm">
            暂无数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="48%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}人`,
                  name,
                ]}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #EDDAC4',
                  boxShadow: '0 4px 20px rgba(30,42,74,0.06)',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-ink-soft">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    customers,
    consultants,
    tasks,
    initializeMockData,
  } = useCustomerStore();

  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [consultantFilter, setConsultantFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [showConsultantDropdown, setShowConsultantDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'consultant' | 'supervisor'>('consultant');
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [expandedConsultantId, setExpandedConsultantId] = useState<string | null>(null);
  const [dealQualityDim, setDealQualityDim] = useState<'project' | 'channel' | 'consultant'>('project');
  const [expandedDealQualityKey, setExpandedDealQualityKey] = useState<string | null>(null);

  if (customers.length === 0) {
    initializeMockData();
  }

  const filteredCustomers = useMemo(() => {
    let list = [...customers];
    if (activeTab === 'mine') {
      list = list.filter(
        (c) => c.consultant_id === (consultants[0]?.id ?? '')
      );
    }
    if (consultantFilter !== 'all') {
      list = list.filter((c) => c.consultant_id === consultantFilter);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }
    return list;
  }, [customers, activeTab, consultantFilter, searchText, consultants]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayNewCount = useMemo(
    () => customers.filter((c) => c.created_at === todayStr).length,
    [customers, todayStr]
  );
  const highTierCount = useMemo(
    () => filteredCustomers.filter((c) => c.tier === 'high').length,
    [filteredCustomers]
  );
  const weekFollowRate = useMemo(() => {
    const allTasks = tasks;
    if (allTasks.length === 0) return 0;
    const done = allTasks.filter((t) => t.completed).length;
    return done / allTasks.length;
  }, [tasks]);
  const monthDeals = useMemo(() => {
    const yearMonth = todayStr.slice(0, 7);
    const deals = customers.filter(
      (c) =>
        c.status === 'deal' &&
        (c.deal_at ?? c.created_at).slice(0, 7) === yearMonth
    );
    return {
      count: deals.length,
      amount: deals.reduce((s, c) => s + (c.deal_amount ?? 0), 0),
    };
  }, [customers, todayStr]);

  const tieredCustomers = useMemo(() => {
    const sorted = [...filteredCustomers].sort((a, b) => {
      const aActive = a.last_follow_up ?? a.created_at;
      const bActive = b.last_follow_up ?? b.created_at;
      return bActive.localeCompare(aActive);
    });
    return {
      high: sorted.filter((c) => c.tier === 'high'),
      nurturing: sorted.filter((c) => c.tier === 'nurturing'),
      watching: sorted.filter((c) => c.tier === 'watching'),
      dormant: sorted.filter((c) => c.tier === 'dormant'),
    } as Record<TierType, Customer[]>;
  }, [filteredCustomers]);

  const overdueCustomers = useMemo(() => {
    return filteredCustomers
      .map((c) => {
        const lastDays = c.last_follow_up
          ? daysSince(c.last_follow_up)
          : daysSince(c.created_at);
        const threshold =
          c.tier === 'high' ? 1 : c.tier === 'nurturing' ? 3 : c.tier === 'watching' ? 7 : 30;
        return { customer: c, lastDays, overdue: lastDays - threshold };
      })
      .filter((x) => x.overdue > 3)
      .sort((a, b) => b.overdue - a.overdue)
      .map((x) => x.customer);
  }, [filteredCustomers]);

  const tierCounts = useMemo(
    () => ({
      high: tieredCustomers.high.length,
      nurturing: tieredCustomers.nurturing.length,
      watching: tieredCustomers.watching.length,
      dormant: tieredCustomers.dormant.length,
    }),
    [tieredCustomers]
  );

  const dateRange = useMemo(() => getDateRangeArray(rangeDays), [rangeDays]);
  const rangeStart = dateRange[0]?.date ?? '';
  const rangeEnd = dateRange[dateRange.length - 1]?.date ?? '';

  const getDealAnalytics = useCustomerStore((s) => s.getDealAnalytics);
  const records = useCustomerStore((s) => s.records);

  const dealAnalytics = useMemo(() => {
    if (!rangeStart || !rangeEnd) return { byProject: [], byChannel: [], byConsultant: [] };
    return getDealAnalytics(rangeStart, rangeEnd);
  }, [getDealAnalytics, rangeStart, rangeEnd]);

  const feedbackTagDistribution = useMemo(() => {
    const customerIdsInRange = new Set(
      customers
        .filter((c) => {
          const date = c.deal_at ?? c.created_at;
          return date >= rangeStart && date <= rangeEnd;
        })
        .map((c) => c.id)
    );
    const map = new Map<string, number>();
    records
      .filter(
        (r) =>
          r.record_type === 'follow_up_done' &&
          r.feedback_tag &&
          customerIdsInRange.has(r.customer_id)
      )
      .forEach((r) => {
        if (r.feedback_tag) {
          map.set(r.feedback_tag, (map.get(r.feedback_tag) ?? 0) + 1);
        }
      });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records, customers, rangeStart, rangeEnd]);

  const undealReasonDistribution = useMemo(() => {
    const map = new Map<string, number>();
    customers
      .filter((c) => c.status === 'lost')
      .forEach((c) => {
        if (c.undeal_reason) {
          map.set(c.undeal_reason, (map.get(c.undeal_reason) ?? 0) + 1);
        }
      });
    records
      .filter((r) => r.undeal_reason)
      .forEach((r) => {
        if (r.undeal_reason) {
          map.set(r.undeal_reason, (map.get(r.undeal_reason) ?? 0) + 1);
        }
      });
    const colors = ['#FF6B6B', '#F59E0B', '#4ECDC4', '#D4A574', '#9CA3AF', '#FFB36B', '#A78BFA', '#60A5FA'];
    return Array.from(map.entries())
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
      .sort((a, b) => b.value - a.value);
  }, [customers, records]);

  const supervisorStats = useMemo(() => {
    const rangeStart = dateRange[0]?.date ?? '';
    const rangeEnd = dateRange[dateRange.length - 1]?.date ?? '';

    const prevRangeStart = (() => {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() - rangeDays);
      return formatDate(d);
    })();
    const prevRangeEnd = (() => {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() - 1);
      return formatDate(d);
    })();

    const stats = consultants.map((c) => {
      const myCustomers = customers.filter((x) => x.consultant_id === c.id);

      const newCustomers = myCustomers.filter(
        (x) => x.created_at >= rangeStart && x.created_at <= rangeEnd
      );

      const newHighIntent = newCustomers.filter((x) => x.tier === 'high').length;

      const deals = myCustomers.filter((x) => isDealInRange(x, rangeStart, rangeEnd));

      const conversionRate = newHighIntent > 0 ? deals.length / newHighIntent : 0;

      const prevNewHighIntent = myCustomers.filter(
        (x) => x.tier === 'high' && x.created_at >= prevRangeStart && x.created_at <= prevRangeEnd
      ).length;

      const prevDeals = myCustomers.filter((x) => isDealInRange(x, prevRangeStart, prevRangeEnd)).length;

      const prevConversionRate = prevNewHighIntent > 0 ? prevDeals / prevNewHighIntent : 0;
      const conversionTrend = conversionRate - prevConversionRate;

      const overdueCount = myCustomers.filter((cust) => {
        if (cust.status !== 'active') return false;
        const lastDays = cust.last_follow_up
          ? daysSince(cust.last_follow_up)
          : daysSince(cust.created_at);
        const threshold =
          cust.tier === 'high' ? 1 : cust.tier === 'nurturing' ? 3 : cust.tier === 'watching' ? 7 : 30;
        return lastDays - threshold > 0;
      }).length;

      const followedUpCustomerIds = new Set(
        tasks
          .filter(
            (t) =>
              t.completed &&
              t.completed_at &&
              t.completed_at >= rangeStart &&
              t.completed_at <= rangeEnd
          )
          .map((t) => t.customer_id)
      );

      return {
        ...c,
        newCustomersCount: newCustomers.length,
        newHighIntent,
        dealsCount: deals.length,
        deals,
        followedUpCount: newCustomers.filter((x) => followedUpCustomerIds.has(x.id)).length,
        conversionRate,
        conversionTrend,
        overdueCount,
      };
    });

    return stats;
  }, [consultants, customers, dateRange, rangeDays, tasks]);

  const trendChartData = useMemo(() => {
    return dateRange.map((dr) => {
      const item: Record<string, string | number> = {
        date: dr.label,
        fullDate: dr.date,
      };
      consultants.forEach((c) => {
        const myCustomers = customers.filter((x) => x.consultant_id === c.id);
        const deals = myCustomers.filter(
          (x) =>
            x.status === 'deal' &&
            ((x.deal_at ?? x.created_at) === dr.date)
        ).length;
        item[c.name] = deals;
      });
      return item;
    });
  }, [dateRange, consultants, customers]);

  const allOverdueCustomers = useMemo(() => {
    return customers
      .map((c) => {
        if (c.status !== 'active') return null;
        const lastDays = c.last_follow_up
          ? daysSince(c.last_follow_up)
          : daysSince(c.created_at);
        const threshold =
          c.tier === 'high' ? 1 : c.tier === 'nurturing' ? 3 : c.tier === 'watching' ? 7 : 30;
        const overdueDays = lastDays - threshold;
        if (overdueDays <= 0) return null;
        return { customer: c, overdueDays };
      })
      .filter((x): x is { customer: Customer; overdueDays: number } => x !== null)
      .sort((a, b) => b.overdueDays - a.overdueDays);
  }, [customers]);

  const formatAmount = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return n.toString();
  };

  return (
    <div className="bg-cream min-h-screen p-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto space-y-5"
      >
        <motion.div variants={fadeInUp} className="mb-1">
          <h1 className="font-serif text-2xl font-bold text-ink mb-1">
            客户分层看板
          </h1>
          <p className="text-sm text-ink-soft">
            玫瑰金医美客户管理系统 · 今天是 {todayStr}
          </p>
        </motion.div>

        <div className="grid grid-cols-4 gap-5">
          <StatCard
            icon={Users}
            label="今日新增客户"
            value={String(todayNewCount)}
            trend="up"
          />
          <StatCard
            icon={Target}
            label="高意向客户池"
            value={String(highTierCount)}
            subValue="重点跟进，高成交概率"
            highlight="coral"
          />
          <div className="card card-hover p-5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-ink-soft mb-2">7日跟进完成率</p>
                <span className="text-3xl font-serif font-bold text-ink">
                  {Math.round(weekFollowRate * 100)}
                  <span className="text-lg text-ink-soft ml-0.5">%</span>
                </span>
                <p className="text-sm mt-2 text-ink-soft">
                  {weekFollowRate >= 0.85
                    ? '跟进节奏良好 ✨'
                    : weekFollowRate >= 0.6
                    ? '建议加快跟进节奏'
                    : '⚠️ 跟进不足，请及时处理'}
                </p>
              </div>
              <FollowUpRateRing rate={weekFollowRate} />
            </div>
          </div>
          <StatCard
            icon={ShoppingBag}
            label="本月成交数"
            value={String(monthDeals.count)}
            subValue={`成交金额 ¥${formatAmount(monthDeals.amount)}`}
            highlight="mint"
          />
        </div>

        <motion.div
          variants={fadeInUp}
          className="card p-4 flex items-center gap-4 flex-wrap"
        >
          <div className="flex items-center gap-1 bg-peach-soft/60 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'all'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              )}
            >
              全部客户
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'mine'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              )}
            >
              我负责的客户
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowConsultantDropdown((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-gold-100 bg-white text-sm text-ink hover:border-rose-gold-300 transition-all"
            >
              <span className="text-ink-soft">咨询师：</span>
              <span className="font-medium">
                {consultantFilter === 'all'
                  ? '全部'
                  : consultants.find((c) => c.id === consultantFilter)?.name ??
                    '全部'}
              </span>
              <ChevronDown className="w-4 h-4 text-ink-soft" />
            </button>
            {showConsultantDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-rose-gold-100 rounded-xl shadow-card-hover z-20 overflow-hidden min-w-[140px]">
                <div
                  onClick={() => {
                    setConsultantFilter('all');
                    setShowConsultantDropdown(false);
                  }}
                  className={cn(
                    'px-4 py-2.5 text-sm cursor-pointer transition-all',
                    consultantFilter === 'all'
                      ? 'bg-peach-soft text-ink font-medium'
                      : 'text-ink-soft hover:bg-peach-soft/50 hover:text-ink'
                  )}
                >
                  全部咨询师
                </div>
                {consultants.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setConsultantFilter(c.id);
                      setShowConsultantDropdown(false);
                    }}
                    className={cn(
                      'px-4 py-2.5 text-sm cursor-pointer transition-all',
                      consultantFilter === c.id
                        ? 'bg-peach-soft text-ink font-medium'
                        : 'text-ink-soft hover:bg-peach-soft/50 hover:text-ink'
                    )}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1 min-w-[260px] max-w-[400px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft/50" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="按姓名 / 手机号搜索..."
              className="input-base pl-10"
            />
          </div>

          <button
            onClick={() => navigate('/customers/entry')}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            <Plus className="w-4 h-4" />
            新建客户
          </button>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="flex items-center justify-center gap-1 bg-peach-soft/60 rounded-xl p-1 w-fit mx-auto"
        >
          <button
            onClick={() => setViewMode('consultant')}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
              viewMode === 'consultant'
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            咨询师视图
          </button>
          <button
            onClick={() => setViewMode('supervisor')}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
              viewMode === 'supervisor'
                ? 'bg-rose-gold-gradient text-white shadow-sm'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            主管运营视图
          </button>
        </motion.div>

        {viewMode === 'consultant' && (
          <div className="grid grid-cols-10 gap-5 items-start">
          <motion.div
            variants={fadeInUp}
            className="col-span-7 card p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title !mb-0">客户分层看板</h2>
              <div className="flex items-center gap-2">
                {TIER_ORDER.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: TIER_CONFIG[t].bgColor,
                      color: TIER_CONFIG[t].color,
                    }}
                  >
                    {TIER_CONFIG[t].label} {tierCounts[t]}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {TIER_ORDER.map((tier) => (
                <TierColumn
                  key={tier}
                  tier={tier}
                  customers={tieredCustomers[tier]}
                />
              ))}
            </div>
          </motion.div>

          <div className="col-span-3 flex flex-col gap-5">
            <OverduePanel overdueCustomers={overdueCustomers} />
            <ConsultantRanking
              consultants={consultants}
              customers={customers}
              tasks={tasks}
            />
            <TierDistributionPie tierCounts={tierCounts} />
          </div>
        </div>
        )}

        {viewMode === 'supervisor' && (
          <div className="space-y-5">
            <motion.div variants={fadeInUp} className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-peach-soft/60 rounded-xl p-1">
                <button
                  onClick={() => setRangeDays(7)}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                    rangeDays === 7
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-ink-soft hover:text-ink'
                  )}
                >
                  近7天
                </button>
                <button
                  onClick={() => setRangeDays(30)}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                    rangeDays === 30
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-ink-soft hover:text-ink'
                  )}
                >
                  近30天
                </button>
              </div>
              <div className="text-sm text-ink-soft">
                统计周期：{dateRange[0]?.date} ~ {dateRange[dateRange.length - 1]?.date}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="card p-6">
              <h3 className="section-title !mb-0 mb-5">咨询师转化趋势对比</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rose-gold-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-ink-soft">咨询师</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-ink-soft">新增高意向</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-ink-soft">成交数</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-ink-soft">转化率</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-ink-soft">超期风险</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supervisorStats.map((s) => (
                      <tr key={s.id} className="border-b border-rose-gold-50 hover:bg-peach-soft/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-rose-gold-100 flex items-center justify-center">
                              <UserCircle2 className="w-5 h-5 text-rose-gold-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink">{s.name}</p>
                              <p className="text-xs text-ink-soft">累计成交 {s.total_deals} 单</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-lg font-bold text-coral">{s.newHighIntent}</span>
                          <span className="text-xs text-ink-soft ml-1">人</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() =>
                              setExpandedConsultantId(
                                expandedConsultantId === s.id ? null : s.id
                              )
                            }
                            className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all hover:bg-mint/10"
                          >
                            <span
                              className="text-lg font-bold text-mint group-hover:underline decoration-mint decoration-2 underline-offset-4"
                              style={{ textDecorationColor: '#D4A574' }}
                            >
                              {s.dealsCount}
                            </span>
                            {s.dealsCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-mint/20 text-mint font-medium">
                                {s.dealsCount}人
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-lg font-bold text-rose-gold-500">
                              {Math.round(s.conversionRate * 100)}
                              <span className="text-sm text-ink-soft ml-0.5">%</span>
                            </span>
                            {s.conversionTrend !== 0 && (
                              <span className={cn(
                                'flex items-center text-xs font-medium',
                                s.conversionTrend > 0 ? 'text-mint' : 'text-coral'
                              )}>
                                {s.conversionTrend > 0 ? (
                                  <TrendingUp className="w-3.5 h-3.5" />
                                ) : (
                                  <TrendingDown className="w-3.5 h-3.5" />
                                )}
                                {Math.abs(Math.round(s.conversionTrend * 100))}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {s.overdueCount > 2 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-coral/10 text-coral text-xs font-medium">
                              <Flame className="w-3.5 h-3.5" />
                              高风险 ({s.overdueCount})
                            </span>
                          ) : s.overdueCount >= 1 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              中风险 ({s.overdueCount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mint/10 text-mint text-xs font-medium">
                              ✅ 正常
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <AnimatePresence>
                {expandedConsultantId &&
                  (() => {
                    const consultant = supervisorStats.find(
                      (s) => s.id === expandedConsultantId
                    );
                    if (!consultant || consultant.deals.length === 0) return null;
                    return (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 pt-5 border-t border-rose-gold-100">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-ink text-sm flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-mint" />
                              {consultant.name} · 成交客户明细
                            </h4>
                            <span className="text-xs text-ink-soft">
                              共 {consultant.deals.length} 人
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {consultant.deals.map((cust) => {
                              const dealDate = cust.deal_at ?? cust.created_at;
                              const dealAmount = cust.deal_amount ?? 0;
                              const amountStr =
                                dealAmount >= 10000
                                  ? `${(dealAmount / 10000).toFixed(1)}万`
                                  : `¥${dealAmount}`;
                              return (
                                <motion.div
                                  key={cust.id}
                                  layout
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  onClick={() =>
                                    navigate(`/customers/${cust.id}/profile`)
                                  }
                                  className="group rounded-xl border bg-white p-3 cursor-pointer transition-all duration-300 border-mint/20 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-mint"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-serif font-bold text-white"
                                      style={{
                                        background:
                                          'linear-gradient(135deg, #4ECDC4, #D4A574)',
                                      }}
                                    >
                                      {cust.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-ink truncate">
                                        {cust.name}
                                      </p>
                                      <p className="text-[10px] text-ink-soft">
                                        {dealDate}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-ink-soft">成交金额</span>
                                    <span className="text-sm font-bold text-mint">
                                      {amountStr}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {(cust.deal_projects ?? cust.projects)
                                      .slice(0, 2)
                                      .map((p) => (
                                        <span
                                          key={p}
                                          className="text-[10px] px-1.5 py-0.5 rounded bg-peach-soft text-ink-soft"
                                        >
                                          {p}
                                        </span>
                                      ))}
                                    {(cust.deal_projects ?? cust.projects).length >
                                      2 && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-peach-soft text-ink-soft">
                                        +
                                        {(cust.deal_projects ?? cust.projects)
                                          .length - 2}
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
              </AnimatePresence>
            </motion.div>

            <motion.div variants={fadeInUp} className="card p-6">
              <h3 className="section-title !mb-0 mb-5 flex items-center gap-2">
                <BarChart3 size={18} className="text-rose-gold-500" />
                成交质量分析
              </h3>

              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <div className="flex items-center gap-1 bg-peach-soft/60 rounded-xl p-1">
                  {([
                    { key: 'project', label: '按项目' },
                    { key: 'channel', label: '按渠道' },
                    { key: 'consultant', label: '按咨询师' },
                  ] as const).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => {
                        setDealQualityDim(t.key);
                        setExpandedDealQualityKey(null);
                      }}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        dealQualityDim === t.key
                          ? 'bg-white text-ink shadow-sm'
                          : 'text-ink-soft hover:text-ink'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-ink-soft ml-auto">
                  统计周期内共 {dealAnalytics[`by${dealQualityDim === 'project' ? 'Project' : dealQualityDim === 'channel' ? 'Channel' : 'Consultant'}`].length} 个维度项
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rose-gold-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-ink-soft">
                        {dealQualityDim === 'project' ? '成交项目' : dealQualityDim === 'channel' ? '来源渠道' : '咨询师'}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-ink-soft">成交数</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-ink-soft">成交金额</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-ink-soft">客单价</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-ink-soft">平均成交周期</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-ink-soft">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const list =
                        dealQualityDim === 'project'
                          ? dealAnalytics.byProject
                          : dealQualityDim === 'channel'
                          ? dealAnalytics.byChannel
                          : dealAnalytics.byConsultant;
                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-ink-soft/50 text-sm">
                              暂无成交数据
                            </td>
                          </tr>
                        );
                      }
                      return list.map((item) => {
                        const isExpanded = expandedDealQualityKey === item.key;
                        return (
                          <>
                            <tr
                              key={item.key}
                              className="border-b border-rose-gold-50 hover:bg-peach-soft/30 transition-colors"
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{
                                      background:
                                        dealQualityDim === 'consultant'
                                          ? 'linear-gradient(135deg, #D4A574, #C8965F)'
                                          : dealQualityDim === 'channel'
                                          ? 'linear-gradient(135deg, #FF6B6B, #FFB36B)'
                                          : 'linear-gradient(135deg, #4ECDC4, #6EE7DE)',
                                    }}
                                  >
                                    <ShoppingBag className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-sm font-medium text-ink">{item.name}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-base font-bold text-coral">{item.dealCount}</span>
                                <span className="text-xs text-ink-soft ml-0.5">单</span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-base font-bold text-mint">
                                  {item.totalAmount >= 10000
                                    ? `${(item.totalAmount / 10000).toFixed(1)}万`
                                    : `¥${item.totalAmount}`}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-base font-bold text-rose-gold-500">
                                  {item.avgUnitPrice >= 10000
                                    ? `${(item.avgUnitPrice / 10000).toFixed(1)}万`
                                    : `¥${Math.round(item.avgUnitPrice)}`}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-base font-bold text-ink">
                                  {item.avgCycleDays.toFixed(1)}
                                </span>
                                <span className="text-xs text-ink-soft ml-0.5">天</span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() =>
                                    setExpandedDealQualityKey(isExpanded ? null : item.key)
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-rose-gold-50 text-rose-gold-600 hover:bg-rose-gold-100"
                                >
                                  <Eye size={12} />
                                  查看客户
                                  {isExpanded ? (
                                    <ChevronUp size={12} />
                                  ) : (
                                    <ChevronDown size={12} />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="py-0">
                                  <AnimatePresence>
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="bg-peach-soft/30 p-4 border-t border-rose-gold-50">
                                        <div className="flex items-center justify-between mb-3">
                                          <h4 className="font-semibold text-ink text-xs flex items-center gap-1.5">
                                            <ShoppingBag className="w-3.5 h-3.5 text-mint" />
                                            {item.name} · 成交客户明细
                                          </h4>
                                          <span className="text-[11px] text-ink-soft">
                                            共 {item.customers.length} 人
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                          {item.customers.map((cust) => {
                                            const dealDate = cust.deal_at ?? cust.created_at;
                                            const dealAmount = cust.deal_amount ?? 0;
                                            const amountStr =
                                              dealAmount >= 10000
                                                ? `${(dealAmount / 10000).toFixed(1)}万`
                                                : `¥${dealAmount}`;
                                            return (
                                              <motion.div
                                                key={cust.id}
                                                layout
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={() =>
                                                  navigate(`/customers/${cust.id}/profile`)
                                                }
                                                className="group rounded-xl border bg-white p-3 cursor-pointer transition-all duration-300 border-mint/20 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-mint"
                                              >
                                                <div className="flex items-center gap-2 mb-2">
                                                  <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-serif font-bold text-white"
                                                    style={{
                                                      background:
                                                        'linear-gradient(135deg, #4ECDC4, #D4A574)',
                                                    }}
                                                  >
                                                    {cust.name.charAt(0)}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <p className="text-sm font-medium text-ink truncate">
                                                      {cust.name}
                                                    </p>
                                                    <p className="text-[10px] text-ink-soft">
                                                      {dealDate}
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                  <span className="text-xs text-ink-soft">成交金额</span>
                                                  <span className="text-sm font-bold text-mint">
                                                    {amountStr}
                                                  </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {(cust.deal_projects ?? cust.projects)
                                                    .slice(0, 2)
                                                    .map((p) => (
                                                      <span
                                                        key={p}
                                                        className="text-[10px] px-1.5 py-0.5 rounded bg-peach-soft text-ink-soft"
                                                      >
                                                        {p}
                                                      </span>
                                                    ))}
                                                  {(cust.deal_projects ?? cust.projects).length >
                                                    2 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-peach-soft text-ink-soft">
                                                      +
                                                      {(cust.deal_projects ?? cust.projects)
                                                        .length - 2}
                                                    </span>
                                                  )}
                                                </div>
                                              </motion.div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </AnimatePresence>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="card p-6">
              <h3 className="section-title !mb-0 mb-5 flex items-center gap-2">
                <PieChartIcon size={18} className="text-rose-gold-500" />
                客户反馈与未成交
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl p-5 border border-rose-gold-100 bg-gradient-to-br from-peach-soft/30 to-transparent">
                  <h4 className="font-semibold text-ink text-sm mb-4 flex items-center gap-2">
                    <BarChart3 size={14} className="text-rose-gold-500" />
                    跟进反馈标签 Top5
                  </h4>
                  <div className="h-[240px]">
                    {feedbackTagDistribution.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-ink-soft/50 text-xs">
                        暂无反馈标签数据
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={feedbackTagDistribution}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <XAxis type="number" hide domain={[0, 'dataMax']} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fill: '#4A5A82', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            width={80}
                          />
                          <Tooltip
                            cursor={{ fill: '#FBF7F2' }}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #EDDAC4',
                              boxShadow: '0 4px 20px rgba(30,42,74,0.08)',
                              fontSize: '12px',
                            }}
                            formatter={(val: number) => [`${val} 次`, '数量']}
                          />
                          <Bar
                            dataKey="count"
                            radius={[0, 8, 8, 0]}
                            barSize={22}
                            fill="url(#feedbackBarGradient)"
                          />
                          <defs>
                            <linearGradient id="feedbackBarGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#D4A574" />
                              <stop offset="100%" stopColor="#FF6B6B" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl p-5 border border-coral/15 bg-gradient-to-br from-coral/5 to-transparent">
                  <h4 className="font-semibold text-ink text-sm mb-4 flex items-center gap-2">
                    <PieChartIcon size={14} className="text-coral" />
                    未成交原因排行
                  </h4>
                  <div className="h-[240px]">
                    {undealReasonDistribution.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-ink-soft/50 text-xs">
                        暂无未成交原因数据
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={undealReasonDistribution}
                            cx="50%"
                            cy="48%"
                            innerRadius={48}
                            outerRadius={78}
                            paddingAngle={2}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {undealReasonDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val: number, name: string) => [`${val} 次`, name]}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #EDDAC4',
                              boxShadow: '0 4px 20px rgba(30,42,74,0.08)',
                              fontSize: '12px',
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            iconSize={8}
                            height={36}
                            formatter={(value) => (
                              <span className="text-xs text-ink-soft">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="card p-6">
              <h3 className="section-title !mb-0 mb-5">咨询师转化漏斗对比</h3>
              <div className="space-y-5">
                {supervisorStats.map((s) => {
                  const total = s.newCustomersCount || 1;
                  const layers = [
                    { name: '新增客户', count: s.newCustomersCount, color: '#FFD4A3', bgColor: '#FFE8D6' },
                    { name: '高意向', count: s.newHighIntent, color: '#FF6B6B', bgColor: '#FFE8E8' },
                    { name: '已跟进', count: s.followedUpCount, color: '#D4A574', bgColor: '#F6EDE2' },
                    { name: '成交', count: s.dealsCount, color: '#4ECDC4', bgColor: '#E8FAF8' },
                  ];

                  const segments = layers.map((layer, idx) => {
                    const prevCount = idx === 0 ? total : layers[idx - 1].count;
                    const widthPct = prevCount > 0 ? (layer.count / total) * 100 : 0;
                    const dropPct = idx === 0 ? 0 : prevCount > 0 ? ((prevCount - layer.count) / prevCount) * 100 : 0;
                    const ratioPct = idx === 0 ? 100 : layers[idx - 1].count > 0 ? (layer.count / layers[idx - 1].count) * 100 : 0;
                    return { ...layer, widthPct, dropPct, ratioPct, prevCount };
                  });

                  return (
                    <div key={s.id} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-[140px] flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-rose-gold-100 flex items-center justify-center">
                          <UserCircle2 className="w-5 h-5 text-rose-gold-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{s.name}</p>
                          <p className="text-[10px] text-ink-soft">{s.dealsCount}/{s.newCustomersCount}</p>
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        <div className="flex items-center h-10 rounded-lg overflow-hidden bg-rose-gold-50">
                          {segments.map((seg, idx) => (
                            <div
                              key={idx}
                              className="relative h-full flex items-center justify-center transition-all duration-500"
                              style={{
                                width: `${Math.max(seg.widthPct, 0)}%`,
                                backgroundColor: seg.color,
                                opacity: 0.85,
                              }}
                            >
                              {seg.widthPct > 12 && (
                                <span className="text-[10px] font-bold text-white px-1 truncate">
                                  {seg.name} {Math.round(seg.ratioPct)}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center h-6 mt-1">
                          {segments.slice(1).map((seg, idx) => {
                            const offsetStart =
                              segments.slice(0, idx + 1).reduce((sum, s) => sum + s.widthPct, 0) -
                              segments[idx].widthPct;
                            return (
                              <div
                                key={idx}
                                className="absolute text-[10px] text-ink-soft"
                                style={{
                                  left: `${offsetStart + segments[idx].widthPct / 2}%`,
                                  transform: 'translateX(-50%)',
                                }}
                              >
                                ↓{seg.prevCount - seg.count}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="w-[70px] flex-shrink-0 text-right">
                        <span className="text-sm font-bold text-mint">{s.dealsCount}</span>
                        <span className="text-[10px] text-ink-soft ml-0.5">
                          /{s.newCustomersCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-rose-gold-50">
                {[
                  { name: '新增客户', color: '#FFD4A3' },
                  { name: '高意向', color: '#FF6B6B' },
                  { name: '已跟进', color: '#D4A574' },
                  { name: '成交', color: '#4ECDC4' },
                ].map((legend) => (
                  <div key={legend.name} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: legend.color }}
                    />
                    <span className="text-xs text-ink-soft">{legend.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="card p-6">
              <h3 className="section-title !mb-0 mb-5">每日成交趋势</h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDDAC4" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#4A5A82', fontSize: 12 }}
                      axisLine={{ stroke: '#EDDAC4' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#4A5A82', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #EDDAC4',
                        boxShadow: '0 4px 20px rgba(30,42,74,0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span className="text-xs text-ink-soft">{value}</span>
                      )}
                    />
                    {consultants.map((c, idx) => (
                      <Line
                        key={c.id}
                        type="monotone"
                        dataKey={c.name}
                        stroke={lineColors[idx % lineColors.length]}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: lineColors[idx % lineColors.length] }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title !mb-0">风险预警清单</h3>
                <span className="text-xs font-medium px-2.5 py-1 bg-coral/10 text-coral rounded-full">
                  共 {allOverdueCustomers.length} 人
                </span>
              </div>
              {allOverdueCustomers.length === 0 ? (
                <div className="text-center py-12 text-ink-soft/50 text-sm">
                  暂无超期风险客户
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {allOverdueCustomers.map(({ customer, overdueDays }) => {
                    const consultant = consultants.find((c) => c.id === customer.consultant_id);
                    const tierCfg = TIER_CONFIG[customer.tier];
                    return (
                      <div
                        key={customer.id}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-xl transition-all',
                          overdueDays > 7
                            ? 'bg-coral/8 border border-coral/20'
                            : 'bg-peach-soft/50 border border-rose-gold-50'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: tierCfg.bgColor }}
                          >
                            <span
                              className="text-sm font-bold"
                              style={{ color: tierCfg.color }}
                            >
                              {customer.name.slice(-1)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink truncate">
                              {customer.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[11px] px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: tierCfg.bgColor,
                                  color: tierCfg.color,
                                }}
                              >
                                {tierCfg.label}
                              </span>
                              <span className="text-[11px] text-ink-soft">
                                咨询师：{consultant?.name ?? '未分配'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className={cn(
                              'text-sm font-bold',
                              overdueDays > 7 ? 'text-coral' : 'text-amber-600'
                            )}>
                              超期 {overdueDays} 天
                            </p>
                            <p className="text-[11px] text-ink-soft">
                              {customer.tier === 'high' ? '应1天内跟进' :
                               customer.tier === 'nurturing' ? '应3天内跟进' :
                               customer.tier === 'watching' ? '应7天内跟进' : '应30天内跟进'}
                            </p>
                          </div>
                          <button className="flex items-center gap-1 px-3 py-2 bg-rose-gold-gradient text-white rounded-lg text-xs font-medium hover:shadow-glow transition-all">
                            一键分配
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
