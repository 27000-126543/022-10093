import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  Phone,
  MapPin,
  UserCheck,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Calendar,
  Plus,
  X,
  ChevronRight,
  Crown,
  User,
  Star,
  CheckCircle,
  ShoppingBag,
  Tag,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SKIN_TAGS,
  CONTOUR_TAGS,
  PROJECTS,
  TIER_CONFIG,
  SCRIPT_TEMPLATES,
  DECISION_CYCLES,
} from '@/constants/dictionaries';
import { useCustomerStore } from '@/store/customerStore';
import type { Customer, FollowUpTask, VisitRecord } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customers = useCustomerStore((s) => s.customers);
  const consultants = useCustomerStore((s) => s.consultants);
  const tasks = useCustomerStore((s) => s.tasks);
  const records = useCustomerStore((s) => s.records);
  const addTask = useCustomerStore((s) => s.addTask);
  const initializeMockData = useCustomerStore((s) => s.initializeMockData);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [taskNote, setTaskNote] = useState('');

  useEffect(() => {
    if (customers.length === 0) {
      initializeMockData();
    }
  }, [customers.length, initializeMockData]);

  const customer = useMemo<Customer | undefined>(
    () => customers.find((c) => c.id === id),
    [customers, id]
  );

  const consultant = useMemo(
    () => consultants.find((c) => c.id === customer?.consultant_id),
    [consultants, customer]
  );

  const radarData = useMemo(() => {
    if (!customer) return [];
    const breakdown = customer.deal_probability_breakdown ?? {
      budget: 0,
      urgency: 0,
      projects: 0,
      tags: 0,
      channel: 0,
    };
    return [
      { subject: '消费能力', A: Math.round((breakdown.budget / 30) * 100), fullMark: 100 },
      { subject: '紧急度', A: Math.round((breakdown.urgency / 25) * 100), fullMark: 100 },
      { subject: '审美认知', A: Math.round((breakdown.projects / 20) * 100), fullMark: 100 },
      { subject: '配合度', A: Math.round((breakdown.tags / 15) * 100), fullMark: 100 },
      { subject: '决策复杂度', A: 100 - Math.round((breakdown.channel / 10) * 50), fullMark: 100 },
    ];
  }, [customer]);

  const driverData = useMemo(() => {
    if (!customer) return [];
    const b = customer.deal_probability_breakdown ?? {
      budget: 0,
      urgency: 0,
      projects: 0,
      tags: 0,
      channel: 0,
    };
    return [
      { name: '预算', value: b.budget, max: 30 },
      { name: '紧急度', value: b.urgency, max: 25 },
      { name: '意向', value: b.projects, max: 20 },
      { name: '标签', value: b.tags, max: 15 },
      { name: '渠道', value: b.channel, max: 10 },
    ];
  }, [customer]);

  const projectIntentRanks = useMemo(() => {
    if (!customer) return [];
    return customer.projects.map((p, idx) => ({
      name: p,
      rank: customer.projects.length - idx,
    }));
  }, [customer]);

  const suggestedScript = useMemo(() => {
    if (!customer) return '';
    const tpl = SCRIPT_TEMPLATES[customer.tier];
    return tpl
      .replace('{name}', customer.name)
      .replace('{project}', customer.projects[0] ?? '您关注的项目')
      .replace('{expert}', '王主任');
  }, [customer]);

  type TimelineItem = {
    id: string;
    type: 'task' | 'record';
    date: string;
    title: string;
    color: string;
    priority?: string;
    method?: string;
    note?: string;
    satisfaction?: number;
    recordType?: string;
    undealReason?: string;
  };

  const timelineData = useMemo<TimelineItem[]>(() => {
    if (!customer) return [];

    const priorityLabel: Record<string, string> = {
      high: '高优先级',
      medium: '中优先级',
      low: '低优先级',
    };
    const methodLabel: Record<string, string> = {
      wechat: '微信',
      phone: '电话',
      visit: '到店',
    };
    const recordTypeLabel: Record<string, string> = {
      consultation: '术前咨询',
      follow_up: '跟进回访',
      post_op: '术后回访',
      follow_up_done: '跟进完成',
    };

    const completedTasks: TimelineItem[] = tasks
      .filter((t) => t.customer_id === customer.id && t.completed)
      .map((t: FollowUpTask) => ({
        id: t.id,
        type: 'task',
        date: t.completed_at ?? t.due_date,
        title: '跟进完成',
        color: '#D4A574',
        priority: t.priority ? priorityLabel[t.priority] : undefined,
        method: t.follow_up_method ? methodLabel[t.follow_up_method] : undefined,
        note: t.follow_up_note,
      }));

    const visitRecords: TimelineItem[] = records
      .filter((r) => r.customer_id === customer.id)
      .map((r: VisitRecord) => {
        const isUndeal = !!r.undeal_reason;
        const isFollowUpDone = r.record_type === 'follow_up_done';
        let color = '#4ECDC4';
        if (isUndeal) color = '#FF6B6B';
        else if (isFollowUpDone) color = '#4A90D9';
        return {
          id: r.id,
          type: 'record',
          date: r.created_at,
          title: recordTypeLabel[r.record_type] ?? '回访记录',
          color,
          satisfaction: r.satisfaction,
          recordType: r.record_type,
          undealReason: r.undeal_reason,
          note: r.follow_up_note ?? r.note,
          method: r.follow_up_method ? methodLabel[r.follow_up_method] : undefined,
          priority: r.priority ? priorityLabel[r.priority] : undefined,
        };
      });

    return [...completedTasks, ...visitRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [customer, tasks, records]);

  const dealReviewData = useMemo(() => {
    if (!customer) return null;

    const formatAmount = (amount?: number) => {
      if (!amount) return '暂无';
      if (amount >= 10000) {
        return `${(amount / 10000).toFixed(2)}万`;
      }
      return `¥${amount}`;
    };

    const dealDate = customer.deal_at ?? customer.created_at;

    const followUpDoneRecords = records
      .filter(
        (r) => r.customer_id === customer.id && r.record_type === 'follow_up_done'
      )
      .sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    const sourceFollowUpRecord =
      followUpDoneRecords.length > 0
        ? followUpDoneRecords[followUpDoneRecords.length - 1]
        : null;

    const lastFollowUpRecord =
      followUpDoneRecords.length > 0
        ? followUpDoneRecords[followUpDoneRecords.length - 1]
        : tasks
            .filter((t) => t.customer_id === customer.id && t.completed)
            .sort(
              (a, b) =>
                new Date(b.completed_at ?? b.due_date).getTime() -
                new Date(a.completed_at ?? a.due_date).getTime()
            )[0];

    const methodLabel: Record<string, string> = {
      wechat: '微信',
      phone: '电话',
      visit: '到店',
    };

    const priorityLabel: Record<string, string> = {
      high: '高优先级',
      medium: '中优先级',
      low: '低优先级',
    };

    return {
      status: customer.status,
      dealDate,
      dealAmount: formatAmount(customer.deal_amount),
      dealProjects: customer.deal_projects ?? [],
      channel: customer.channel,
      undealReason: customer.undeal_reason,
      sourceRecord: sourceFollowUpRecord
        ? {
            method: methodLabel[sourceFollowUpRecord.follow_up_method ?? ''] ?? undefined,
            priority: sourceFollowUpRecord.priority
              ? priorityLabel[sourceFollowUpRecord.priority]
              : undefined,
            note: sourceFollowUpRecord.follow_up_note ?? sourceFollowUpRecord.note,
          }
        : null,
      lastRecord: lastFollowUpRecord
        ? {
            date:
              'completed_at' in lastFollowUpRecord
                ? (lastFollowUpRecord as FollowUpTask).completed_at ??
                  (lastFollowUpRecord as FollowUpTask).due_date
                : (lastFollowUpRecord as VisitRecord).created_at,
            method:
              'follow_up_method' in lastFollowUpRecord
                ? methodLabel[(lastFollowUpRecord as any).follow_up_method ?? ''] ?? undefined
                : undefined,
            note:
              'follow_up_note' in lastFollowUpRecord
                ? (lastFollowUpRecord as any).follow_up_note ?? (lastFollowUpRecord as any).note
                : (lastFollowUpRecord as VisitRecord).note,
          }
        : null,
    };
  }, [customer, records, tasks]);

  const handleCreateTask = () => {
    if (!customer) return;
    addTask({
      customer_id: customer.id,
      priority: taskPriority,
      due_date: taskDueDate,
      suggested_script: taskNote || suggestedScript,
      completed: false,
    });
    setShowTaskModal(false);
    setTaskNote('');
    navigate('/tasks');
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="card p-10 text-center">
          <p className="text-ink-soft">客户不存在或已被删除</p>
          <button onClick={() => navigate('/')} className="btn-secondary mt-5">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[customer.tier];
  const budgetMinW = customer.budget_min / 10000;
  const budgetMaxW = customer.budget_max / 10000;

  return (
    <div className="min-h-screen bg-cream p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            返回
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTaskModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              立即创建跟进任务
            </button>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex gap-6"
        >
          <motion.div
            variants={itemVariants}
            className="w-[280px] shrink-0 space-y-5"
          >
            <div className="card p-6 text-center card-hover">
              <div className="relative inline-block mb-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-serif font-bold text-white animate-glow-breath"
                  style={{
                    background: `linear-gradient(135deg, ${tierConfig.color}, #D4A574)`,
                  }}
                >
                  {customer.name.charAt(0)}
                </div>
                {customer.tier === 'high' && (
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center shadow-card">
                    <Crown size={14} />
                  </div>
                )}
              </div>

              <h2 className="font-serif text-xl font-bold text-ink">{customer.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="tag-pill bg-peach-soft text-ink-soft cursor-default text-xs">
                  {customer.gender === 'female' ? '女' : '男'}
                </span>
                <span className="tag-pill bg-rose-gold-50 text-ink-soft cursor-default text-xs">
                  {customer.age}岁
                </span>
              </div>
            </div>

            <div className="card p-5 card-hover space-y-4">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <User size={14} className="text-rose-gold-500" />
                基本信息
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-ink-soft" />
                  <span className="text-ink-soft">电话</span>
                  <span className="ml-auto text-ink font-medium">{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin size={15} className="text-ink-soft" />
                  <span className="text-ink-soft">渠道</span>
                  <span className="ml-auto text-ink font-medium">{customer.channel}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <UserCheck size={15} className="text-ink-soft" />
                  <span className="text-ink-soft">咨询师</span>
                  <span className="ml-auto text-ink font-medium">
                    {consultant?.name ?? '未分配'}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="card p-5 card-hover border-2"
              style={{ borderColor: tierConfig.color + '40' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-ink-soft">客户分层</span>
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: tierConfig.bgColor,
                    color: tierConfig.color,
                  }}
                >
                  {tierConfig.label}
                </div>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: tierConfig.bgColor + '60' }}
              >
                <p className="text-xs text-ink-soft mb-1.5">建议跟进频率</p>
                <p className="text-sm font-semibold" style={{ color: tierConfig.color }}>
                  每 {tierConfig.followDays} 天跟进一次
                </p>
              </div>
            </div>

            <div className="card p-5 card-hover">
              <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-rose-gold-500" />
                成交概率
              </h3>
              <div className="text-center">
                <span
                  className="text-5xl font-bold bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${tierConfig.color}, #FF6B6B)`,
                  }}
                >
                  {customer.deal_probability}
                </span>
                <span className="text-2xl font-bold text-ink-soft ml-1">%</span>
              </div>
              <div className="mt-4 h-2 bg-rose-gold-50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${customer.deal_probability}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${tierConfig.color}, #FF6B6B)`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex-1 min-w-0 space-y-5">
            <div className="card p-6 card-hover">
              <h2 className="section-title mb-5">客户画像雷达</h2>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="#EDDAC4" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#4A5A82', fontSize: 13 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: '#4A5A82', fontSize: 10 }}
                      axisLine={false}
                      tickCount={5}
                    />
                    <Radar
                      name="得分"
                      dataKey="A"
                      stroke={tierConfig.color}
                      fill={tierConfig.color}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6 card-hover">
              <h2 className="section-title mb-5">关注点标签矩阵</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-ink mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-gold-400" />
                    皮肤关注点
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {SKIN_TAGS.map((tag) => {
                      const active = customer.skin_tags.includes(tag);
                      return (
                        <div
                          key={tag}
                          className={cn(
                            'py-2 px-2.5 rounded-lg text-xs text-center font-medium transition-all border',
                            active
                              ? 'bg-rose-gold-gradient text-white border-transparent shadow-md'
                              : 'bg-rose-gold-50/50 text-ink-soft border-rose-gold-100 opacity-60'
                          )}
                        >
                          {tag}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-coral" />
                    轮廓关注点
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {CONTOUR_TAGS.map((tag) => {
                      const active = customer.contour_tags.includes(tag);
                      return (
                        <div
                          key={tag}
                          className={cn(
                            'py-2 px-2.5 rounded-lg text-xs text-center font-medium transition-all border',
                            active
                              ? 'bg-gradient-to-r from-coral to-rose-gold-400 text-white border-transparent shadow-md'
                              : 'bg-coral-soft/40 text-ink-soft border-coral/20 opacity-60'
                          )}
                        >
                          {tag}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 card-hover">
              <h2 className="section-title mb-5">咨询项目意向</h2>
              <div className="space-y-2.5">
                {PROJECTS.filter((p) => customer.projects.includes(p)).length === 0 ? (
                  <p className="text-ink-soft text-sm text-center py-8">暂无咨询项目</p>
                ) : (
                  PROJECTS.filter((p) => customer.projects.includes(p)).map((p, idx) => {
                    const total = customer.projects.length;
                    const intentPct = Math.round(((total - idx) / total) * 100);
                    return (
                      <div
                        key={p}
                        className="flex items-center gap-4 p-3 rounded-xl bg-rose-gold-50/40 hover:bg-rose-gold-50 transition-colors"
                      >
                        <span className="text-sm text-ink flex-1 font-medium">{p}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-1.5 bg-rose-gold-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${intentPct}%` }}
                              transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                              className="h-full bg-gradient-to-r from-rose-gold-400 to-coral rounded-full"
                            />
                          </div>
                          <span
                            className="tag-pill cursor-default text-xs font-semibold"
                            style={{
                              backgroundColor:
                                intentPct >= 80
                                  ? '#FFE8E8'
                                  : intentPct >= 50
                                    ? '#FEF3C7'
                                    : '#FEF9C3',
                              color:
                                intentPct >= 80
                                  ? '#FF6B6B'
                                  : intentPct >= 50
                                    ? '#F59E0B'
                                    : '#EAB308',
                            }}
                          >
                            {intentPct >= 80 ? '高意向' : intentPct >= 50 ? '中意向' : '低意向'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-rose-gold-100 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-ink-soft mb-1">预算区间</p>
                  <p className="text-lg font-bold text-ink">
                    ¥{budgetMinW}万 - ¥{budgetMaxW}万
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-soft mb-1">决策周期</p>
                  <p className="text-lg font-bold text-ink">
                    {DECISION_CYCLES.find((d) => d.value === customer.decision_cycle)?.label ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-soft mb-1">项目数量</p>
                  <p className="text-lg font-bold text-ink">{customer.projects.length} 项</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="w-[320px] shrink-0 space-y-5">
            <div className="card p-6 card-hover animate-glow-breath border-2 border-rose-gold-200">
              <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-rose-gold-500" />
                成交概率评分卡
              </h3>
              <div className="relative w-full aspect-square max-w-[220px] mx-auto">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D4A574" />
                      <stop offset="50%" stopColor="#C8965F" />
                      <stop offset="100%" stopColor="#FF6B6B" />
                    </linearGradient>
                    <filter id="scoreGlow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="#F6EDE2"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    filter="url(#scoreGlow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: customer.deal_probability / 100 }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center',
                      strokeDasharray: `${2 * Math.PI * 85}`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-5xl font-bold bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${tierConfig.color}, #FF6B6B)`,
                    }}
                  >
                    {customer.deal_probability}
                  </span>
                  <span className="text-sm text-ink-soft mt-0.5">%</span>
                  <span
                    className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: tierConfig.bgColor,
                      color: tierConfig.color,
                    }}
                  >
                    {tierConfig.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6 card-hover">
              <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-rose-gold-500" />
                核心驱动因素
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={driverData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                  >
                    <XAxis type="number" hide domain={[0, 'dataMax']} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#4A5A82', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      cursor={{ fill: '#FBF7F2' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #EDDAC4',
                        boxShadow: '0 4px 20px rgba(30,42,74,0.08)',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, _name: string, props: { payload: { max: number } }) => [
                        `${value}/${props.payload.max}`,
                        '得分',
                      ]}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                      {driverData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={`url(#barGradient${idx})`}
                          style={{
                            background: `linear-gradient(90deg, #D4A574, #FF6B6B)`,
                          }}
                        />
                      ))}
                      <defs>
                        {driverData.map((_, idx) => (
                          <linearGradient
                            key={idx}
                            id={`barGradient${idx}`}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#D4A574" />
                            <stop offset="100%" stopColor="#FF6B6B" />
                          </linearGradient>
                        ))}
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6 card-hover">
              <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <MessageSquare size={14} className="text-rose-gold-500" />
                建议下一步话术
              </h3>
              <div
                className="relative rounded-2xl p-4 text-sm leading-relaxed"
                style={{ backgroundColor: tierConfig.bgColor }}
              >
                <div
                  className="absolute -top-2 left-5 w-4 h-4 rotate-45"
                  style={{ backgroundColor: tierConfig.bgColor }}
                />
                <p className="text-ink whitespace-pre-wrap">{suggestedScript}</p>
              </div>
            </div>

            <button
              onClick={() => setShowTaskModal(true)}
              className="card w-full p-5 card-hover border-2 border-dashed border-rose-gold-200 hover:border-rose-gold-400 transition-colors group"
            >
              <div className="flex items-center justify-center gap-2 text-rose-gold-500 group-hover:text-coral transition-colors">
                <Plus size={18} />
                <span className="font-semibold text-sm">立即创建跟进任务</span>
                <ChevronRight size={16} />
              </div>
            </button>
          </motion.div>
        </motion.div>

        {dealReviewData && (
          <motion.div variants={itemVariants} className="mt-6">
            <div className="card p-6 card-hover">
              <h2 className="section-title mb-5">成交复盘</h2>

              {dealReviewData.status === 'deal' && (
                <div
                  className="rounded-xl p-5 border-2"
                  style={{ borderColor: '#4ECDC4', backgroundColor: '#4ECDC408' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#4ECDC420' }}
                  >
                    <ShoppingBag className="w-5 h-5" style={{ color: '#4ECDC4' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">已成交</h3>
                    <p className="text-xs text-ink-soft">恭喜成交记录已归档</p>
                  </div>
                </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-ink-soft mb-1">成交时间</p>
                      <p className="text-sm font-semibold text-ink">{dealReviewData.dealDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-soft mb-1">成交金额</p>
                      <p className="text-sm font-semibold text-mint">{dealReviewData.dealAmount}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-ink-soft mb-2">成交项目</p>
                      <div className="flex flex-wrap gap-1.5">
                        {dealReviewData.dealProjects.length > 0 ? (
                          dealReviewData.dealProjects.map((p) => (
                            <span
                              key={p}
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: '#4ECDC420', color: '#4ECDC4' }}
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-ink-soft">暂无项目记录</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-ink-soft mb-2">来源渠道</p>
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-peach-soft text-ink-soft font-medium">
                        <Tag className="w-3 h-3" />
                        {dealReviewData.channel}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-ink-soft mb-1.5">来源跟进记录</p>
                      {dealReviewData.sourceRecord ? (
                        <div className="rounded-lg p-3 bg-white/60 border border-mint/20">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {dealReviewData.sourceRecord.method && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-peach-soft text-ink-soft font-medium">
                                {dealReviewData.sourceRecord.method}
                              </span>
                            )}
                            {dealReviewData.sourceRecord.priority && (
                              <span
                                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: '#4ECDC420', color: '#4ECDC4' }}
                              >
                                {dealReviewData.sourceRecord.priority}
                              </span>
                            )}
                          </div>
                          {dealReviewData.sourceRecord.note && (
                            <p className="text-xs text-ink-soft leading-relaxed">
                              {dealReviewData.sourceRecord.note}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-soft">暂无对应跟进记录</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {dealReviewData.status === 'lost' && (
                <div
                  className="rounded-xl p-5 border-2"
                  style={{ borderColor: '#FF6B6B', backgroundColor: '#FF6B6B08' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#FF6B6B20' }}
                    >
                      <Info className="w-5 h-5" style={{ color: '#FF6B6B' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink">未成交</h3>
                      <p className="text-xs text-ink-soft">客户已流失</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-ink-soft mb-1.5">未成交原因</p>
                      <span className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{ backgroundColor: '#FF6B6B20', color: '#FF6B6B' }}
                      >
                        {dealReviewData.undealReason ?? '暂无记录'}
                      </span>
                    </div>
                    {dealReviewData.lastRecord && (
                      <div>
                        <p className="text-xs text-ink-soft mb-1.5">最后跟进记录</p>
                        <div className="rounded-lg p-3 bg-white/60 border border-coral/20">
                          <div className="flex items-center gap-2 mb-1">
                            {dealReviewData.lastRecord.date && (
                              <span className="text-[11px] text-ink-soft">
                                {dealReviewData.lastRecord.date}
                              </span>
                            )}
                            {dealReviewData.lastRecord.method && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-peach-soft text-ink-soft font-medium">
                                {dealReviewData.lastRecord.method}
                              </span>
                            )}
                          </div>
                          {dealReviewData.lastRecord.note && (
                            <p className="text-xs text-ink-soft leading-relaxed">
                              {dealReviewData.lastRecord.note}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {dealReviewData.status === 'active' && (
                <div
                  className="rounded-xl p-5 border-2 border-gray-200 bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200">
                      <Info className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">此客户尚未成交</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        可在跟进任务中心或回访记录中更新成交状态
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="mt-6">
          <div className="card p-6 card-hover">
            <h2 className="section-title mb-5">历史跟进与回访</h2>
            {timelineData.length === 0 ? (
              <div className="text-center py-16 text-ink-soft/50 text-sm">
                暂无跟进与回访记录
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-rose-gold-100" />
                <div className="space-y-5">
                  {timelineData.map((item) => (
                    <div key={item.id} className="relative flex gap-4">
                      <div
                        className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.type === 'task' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Star className="w-3.5 h-3.5 text-white" fill="white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h4 className="font-semibold text-ink text-sm">{item.title}</h4>
                          <span className="text-xs text-ink-soft">{item.date}</span>
                          {item.priority && (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: item.color + '20',
                                color: item.color,
                              }}
                            >
                              {item.priority}
                            </span>
                          )}
                          {item.method && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-peach-soft text-ink-soft font-medium">
                              {item.method}
                            </span>
                          )}
                          {item.satisfaction !== undefined && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="w-3 h-3"
                                  fill={i < item.satisfaction! ? '#F59E0B' : 'none'}
                                  stroke={i < item.satisfaction! ? '#F59E0B' : '#E5E7EB'}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {item.undealReason && (
                          <div className="mb-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-coral/10 text-coral font-medium">
                              未成交原因：{item.undealReason}
                            </span>
                          </div>
                        )}
                        {item.note && (
                          <p className="text-sm text-ink-soft leading-relaxed">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -16, opacity: 0 }}
              className="card p-7 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg font-bold text-ink">创建跟进任务</h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-rose-gold-50 flex items-center justify-center text-ink-soft transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">优先级</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['high', 'medium', 'low'] as const).map((p) => {
                      const cfg = {
                        high: { label: '高', color: '#FF6B6B', bg: '#FFE8E8' },
                        medium: { label: '中', color: '#F59E0B', bg: '#FEF3C7' },
                        low: { label: '低', color: '#9CA3AF', bg: '#F3F4F6' },
                      }[p];
                      const active = taskPriority === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setTaskPriority(p)}
                          className={cn(
                            'py-2.5 rounded-lg text-sm font-semibold transition-all border',
                            active
                              ? 'border-transparent shadow-md'
                              : 'border-rose-gold-100 hover:border-rose-gold-200 bg-white text-ink-soft'
                          )}
                          style={
                            active
                              ? { backgroundColor: cfg.bg, color: cfg.color }
                              : undefined
                          }
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-1.5">
                    <Calendar size={14} className="text-ink-soft" />
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="input-base"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">跟进备注 / 自定义话术</label>
                  <textarea
                    value={taskNote}
                    onChange={(e) => setTaskNote(e.target.value)}
                    placeholder={suggestedScript.slice(0, 50) + '...'}
                    rows={4}
                    className="input-base resize-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button onClick={handleCreateTask} className="btn-primary flex-1">
                  创建任务
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
