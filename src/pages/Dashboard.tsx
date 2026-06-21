import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Target,
  ShoppingBag,
  Search,
  Plus,
  AlertTriangle,
  Phone,
  ChevronDown,
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
  const tierCfg = TIER_CONFIG[customer.tier];
  const lastActiveDays = customer.last_follow_up
    ? daysSince(customer.last_follow_up)
    : daysSince(customer.created_at);
  const maskPhone =
    customer.phone.length >= 11
      ? customer.phone.slice(0, 3) + '****' + customer.phone.slice(7)
      : customer.phone;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
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
        (c.last_follow_up ?? c.created_at).slice(0, 7) === yearMonth
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
      </motion.div>
    </div>
  );
}
