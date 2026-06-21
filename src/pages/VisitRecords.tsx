import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Star,
  Edit2,
  ChevronDown,
  Check,
  User,
  Stethoscope,
  Smile,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { UNDEAL_REASONS, PROJECTS } from '@/constants/dictionaries';
import { cn } from '@/lib/utils';
import type { Customer, VisitRecord } from '@/types';

type RecordType = 'consultation' | 'follow_up' | 'post_op';
type DealStatus = 'deal' | 'partial' | 'lost';

interface EnrichedRecord extends VisitRecord {
  customer?: Customer;
}

const RECORD_TYPE_CONFIG: Record<
  RecordType,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  consultation: {
    label: '术前',
    color: '#D4A574',
    bgColor: '#F6EDE2',
    borderColor: '#E2C29E',
  },
  post_op: {
    label: '术中',
    color: '#2E3D66',
    bgColor: '#E8ECF5',
    borderColor: '#4A5A82',
  },
  follow_up: {
    label: '回访',
    color: '#4ECDC4',
    bgColor: '#E5F9F7',
    borderColor: '#7DE3DC',
  },
};

const PIE_COLORS = [
  '#D4A574',
  '#FF6B6B',
  '#F59E0B',
  '#4ECDC4',
  '#2E3D66',
  '#EAB308',
  '#9CA3AF',
  '#8B5CF6',
];

export default function VisitRecords() {
  const {
    records,
    customers,
    initializeMockData,
    updateCustomer,
    addRecord,
  } = useCustomerStore();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editSatisfaction, setEditSatisfaction] = useState(5);

  const [statusCustomerId, setStatusCustomerId] = useState<string>('');
  const [dealStatus, setDealStatus] = useState<DealStatus>('deal');
  const [dealAmount, setDealAmount] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [postOpSatisfaction, setPostOpSatisfaction] = useState(5);
  const [selectedUndealReason, setSelectedUndealReason] = useState('');
  const [showStatusCustomerDropdown, setShowStatusCustomerDropdown] =
    useState(false);

  useEffect(() => {
    if (customers.length === 0) {
      initializeMockData();
    }
  }, [customers.length, initializeMockData]);

  const customerMap = useMemo(() => {
    const map: Record<string, Customer> = {};
    customers.forEach((c) => (map[c.id] = c));
    return map;
  }, [customers]);

  const enrichedRecords = useMemo<EnrichedRecord[]>(() => {
    return records
      .map((r) => ({
        ...r,
        customer: customerMap[r.customer_id],
      }))
      .filter((r) => {
        if (!selectedCustomerId) return true;
        return r.customer_id === selectedCustomerId;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [records, selectedCustomerId, customerMap]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const thisMonthRecords = records.filter((r) => {
      const d = new Date(r.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const revisitCount = thisMonthRecords.filter(
      (r) => r.record_type === 'follow_up'
    ).length;

    const recordsWithSatisfaction = records.filter(
      (r) => r.satisfaction !== undefined
    );
    const avgSatisfaction =
      recordsWithSatisfaction.length > 0
        ? recordsWithSatisfaction.reduce((sum, r) => sum + r.satisfaction, 0) /
          recordsWithSatisfaction.length
        : 0;

    const dealCustomers = customers.filter(
      (c) => c.status === 'deal' || c.status === 'active'
    );
    const conversionRate =
      customers.length > 0
        ? Math.round((dealCustomers.length / customers.length) * 100)
        : 0;

    const undealRecords = records.filter((r) => r.undeal_reason);
    const reasonCounts: Record<string, number> = {};
    undealRecords.forEach((r) => {
      if (r.undeal_reason) {
        reasonCounts[r.undeal_reason] =
          (reasonCounts[r.undeal_reason] ?? 0) + 1;
      }
    });
    const topReason = Object.entries(reasonCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    return {
      revisitCount,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      conversionRate,
      topReason: topReason ?? '暂无数据',
    };
  }, [records, customers]);

  const pieData = useMemo(() => {
    const reasonCounts: Record<string, number> = {};
    UNDEAL_REASONS.forEach((r) => (reasonCounts[r] = 0));
    records.forEach((r) => {
      if (r.undeal_reason && reasonCounts[r.undeal_reason] !== undefined) {
        reasonCounts[r.undeal_reason]++;
      }
    });
    const total = Object.values(reasonCounts).reduce((s, n) => s + n, 0);
    return UNDEAL_REASONS.map((name, idx) => ({
      name,
      value: reasonCounts[name],
      percent: total > 0 ? Math.round((reasonCounts[name] / total) * 100) : 0,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    })).filter((d) => d.value > 0);
  }, [records]);

  const handleEditRecord = (record: EnrichedRecord) => {
    setEditingRecordId(record.id);
    setEditSatisfaction(record.satisfaction);
  };

  const handleSaveEdit = (recordId: string) => {
    addRecord({
      id: recordId + '-edit',
      customer_id: enrichedRecords.find((r) => r.id === recordId)
        ?.customer_id,
      record_type: 'follow_up',
      satisfaction: editSatisfaction,
      note: `满意度更新：${editSatisfaction}星`,
    });
    setEditingRecordId(null);
  };

  const toggleProject = (project: string) => {
    setSelectedProjects((prev) =>
      prev.includes(project)
        ? prev.filter((p) => p !== project)
        : [...prev, project]
    );
  };

  const handleSaveStatus = () => {
    if (!statusCustomerId) return;

    const statusMap: Record<DealStatus, Customer['status']> = {
      deal: 'deal',
      partial: 'active',
      lost: 'lost',
    };

    const updates: Partial<Customer> = {
      status: statusMap[dealStatus],
    };

    if (dealStatus === 'deal' || dealStatus === 'partial') {
      if (dealAmount) updates.deal_amount = Number(dealAmount);
      if (selectedProjects.length) updates.deal_projects = selectedProjects;
    }

    updateCustomer(statusCustomerId, updates);

    const recordNoteParts = [];
    recordNoteParts.push(`成交状态：${dealStatus === 'deal' ? '已成交' : dealStatus === 'partial' ? '部分成交' : '未成交'}`);
    if (dealAmount) recordNoteParts.push(`成交金额：¥${dealAmount}`);
    if (selectedProjects.length)
      recordNoteParts.push(`成交项目：${selectedProjects.join('、')}`);
    if (dealStatus === 'lost' && selectedUndealReason)
      recordNoteParts.push(`未成交原因：${selectedUndealReason}`);
    recordNoteParts.push(`满意度：${postOpSatisfaction}星`);

    addRecord({
      customer_id: statusCustomerId,
      record_type: 'follow_up',
      satisfaction: postOpSatisfaction,
      undeal_reason:
        dealStatus === 'lost' ? selectedUndealReason || undefined : undefined,
      note: recordNoteParts.join(' | '),
    });

    setDealAmount('');
    setSelectedProjects([]);
    setPostOpSatisfaction(5);
    setSelectedUndealReason('');
  };

  const statCards = [
    {
      label: '本月复诊数',
      value: monthlyStats.revisitCount,
      suffix: '次',
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-rose-gold-500',
      bg: 'bg-rose-gold-soft',
    },
    {
      label: '平均满意度',
      value: monthlyStats.avgSatisfaction,
      suffix: '星',
      icon: <Smile className="w-5 h-5" />,
      color: 'text-mint',
      bg: 'bg-mint-soft',
      isStars: true,
    },
    {
      label: '成交率',
      value: monthlyStats.conversionRate,
      suffix: '%',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-coral',
      bg: 'bg-coral-soft',
    },
    {
      label: '未成交TOP1',
      value: monthlyStats.topReason,
      suffix: '',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      isText: true,
    },
  ];

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rose-gold-500" />
            回访记录管理
          </h1>
          <p className="text-ink-soft mt-1 text-sm">
            全流程回访追踪，数据驱动客户满意度提升
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-ink-soft mb-2">{card.label}</p>
                  {card.isText ? (
                    <p className="font-serif text-xl font-bold text-ink line-clamp-2">
                      {card.value}
                    </p>
                  ) : card.isStars ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-2xl font-bold text-ink">
                        {card.value}
                      </span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              'w-4 h-4',
                              s <= Math.round(card.value as number)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-200'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="font-serif text-2xl font-bold text-ink">
                      {card.value}
                      <span className="text-sm font-normal text-ink-soft ml-1">
                        {card.suffix}
                      </span>
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    card.bg,
                    card.color
                  )}
                >
                  {card.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-6">
          <div className="w-3/5">
            <div className="card p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">客户回访时间轴</h2>
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowCustomerDropdown(!showCustomerDropdown)
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-gold-100 bg-white text-sm text-ink hover:border-rose-gold-300 transition-all"
                  >
                    <User className="w-4 h-4 text-rose-gold-500" />
                    {selectedCustomerId
                      ? customerMap[selectedCustomerId]?.name
                      : '全部客户'}
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-ink-soft transition-transform',
                        showCustomerDropdown && 'rotate-180'
                      )}
                    />
                  </button>
                  {showCustomerDropdown && (
                    <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl shadow-card-hover border border-rose-gold-50 py-2 z-10 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedCustomerId('');
                          setShowCustomerDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-peach-soft transition-colors flex items-center justify-between',
                          !selectedCustomerId &&
                            'text-rose-gold-600 font-medium'
                        )}
                      >
                        全部客户
                        {!selectedCustomerId && <Check className="w-4 h-4" />}
                      </button>
                      {customers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setShowCustomerDropdown(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-peach-soft transition-colors flex items-center justify-between',
                            selectedCustomerId === c.id &&
                              'text-rose-gold-600 font-medium'
                          )}
                        >
                          {c.name}
                          {selectedCustomerId === c.id && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-rose-gold-100" />

                {enrichedRecords.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="text-ink-soft text-sm">暂无回访记录</p>
                  </div>
                )}

                {enrichedRecords.map((record, idx) => {
                  const config =
                    RECORD_TYPE_CONFIG[record.record_type as RecordType];
                  const isEditing = editingRecordId === record.id;

                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="relative mb-5 last:mb-0"
                    >
                      <div
                        className="absolute -left-[18px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                        style={{
                          backgroundColor: config.color,
                        }}
                      />

                      <div
                        className="card card-hover p-4 border-l-4"
                        style={{ borderLeftColor: config.color }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="tag-pill text-xs"
                              style={{
                                backgroundColor: config.bgColor,
                                color: config.color,
                                borderColor: config.borderColor,
                              }}
                            >
                              <Stethoscope className="w-3 h-3" />
                              {config.label}
                            </span>
                            <span className="text-xs text-ink-soft flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {record.created_at}
                            </span>
                          </div>
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="p-1.5 rounded-lg hover:bg-peach-soft text-ink-soft hover:text-rose-gold-600 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-rose-gold-soft flex items-center justify-center flex-shrink-0">
                            <span className="font-serif font-medium text-rose-gold-700 text-sm">
                              {record.customer?.name?.[0] ?? '?'}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-ink text-sm">
                              {record.customer?.name ?? '未知客户'}
                            </div>
                            <div className="text-xs text-ink-soft">
                              {record.customer?.projects.slice(0, 2).join('、') ||
                                '暂无项目'}
                            </div>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="bg-peach-soft rounded-xl p-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-ink-soft">
                                满意度：
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setEditSatisfaction(s)}
                                    className="p-0.5 transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className={cn(
                                        'w-5 h-5 transition-colors',
                                        s <= editSatisfaction
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-200'
                                      )}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingRecordId(null)}
                                className="px-3 py-1 text-xs rounded-lg bg-white text-ink-soft hover:text-ink border border-rose-gold-100 transition-all"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleSaveEdit(record.id)}
                                className="px-3 py-1 text-xs rounded-lg bg-rose-gold-gradient text-white"
                              >
                                保存
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-ink-soft">
                                满意度：
                              </span>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={cn(
                                      'w-4 h-4',
                                      s <= record.satisfaction
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-200'
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-ink-soft ml-1">
                                {record.satisfaction}/5
                              </span>
                            </div>
                            {record.note && (
                              <p className="text-sm text-ink leading-relaxed">
                                {record.note}
                              </p>
                            )}
                            {record.undeal_reason && (
                              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-coral-soft text-coral text-xs rounded-lg">
                                <AlertTriangle className="w-3 h-3" />
                                未成交原因：{record.undeal_reason}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-2/5 space-y-6">
            <div className="card p-5">
              <h2 className="section-title">未成交原因分析</h2>

              {pieData.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-5xl mb-3">📊</div>
                  <p className="text-ink-soft text-sm">暂无未成交记录</p>
                </div>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value} 例`,
                            name,
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #E2C29E',
                            boxShadow: '0 4px 20px rgba(30, 42, 74, 0.06)',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-2 space-y-2">
                    {pieData
                      .sort((a, b) => b.value - a.value)
                      .map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-ink flex-1 truncate">
                            {item.name}
                          </span>
                          <span className="text-sm font-medium text-ink-soft w-12 text-right">
                            {item.percent}%
                          </span>
                          <div className="w-20 h-2 bg-peach-soft rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${item.percent}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>

            <div className="card p-5">
              <h2 className="section-title">成交状态更新</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    选择客户
                  </label>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowStatusCustomerDropdown(
                          !showStatusCustomerDropdown
                        )
                      }
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-gold-100 bg-white text-sm text-ink hover:border-rose-gold-300 transition-all text-left"
                    >
                      <User className="w-4 h-4 text-rose-gold-500 flex-shrink-0" />
                      <span className="flex-1 truncate">
                        {statusCustomerId
                          ? customerMap[statusCustomerId]?.name
                          : '请选择客户'}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-ink-soft transition-transform flex-shrink-0',
                          showStatusCustomerDropdown && 'rotate-180'
                        )}
                      />
                    </button>
                    {showStatusCustomerDropdown && (
                      <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-card-hover border border-rose-gold-50 py-2 z-10 max-h-56 overflow-y-auto">
                        {customers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setStatusCustomerId(c.id);
                              setShowStatusCustomerDropdown(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2 text-left text-sm hover:bg-peach-soft transition-colors flex items-center justify-between',
                              statusCustomerId === c.id &&
                                'text-rose-gold-600 font-medium'
                            )}
                          >
                            {c.name}
                            {statusCustomerId === c.id && (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    成交状态
                  </label>
                  <div className="flex items-center gap-1 bg-peach-soft rounded-xl p-1">
                    {(
                      [
                        { key: 'deal', label: '已成交' },
                        { key: 'partial', label: '部分成交' },
                        { key: 'lost', label: '未成交' },
                      ] as { key: DealStatus; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setDealStatus(opt.key)}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          dealStatus === opt.key
                            ? 'bg-white text-ink shadow-card'
                            : 'text-ink-soft hover:text-ink'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(dealStatus === 'deal' || dealStatus === 'partial') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        成交金额（元）
                      </label>
                      <input
                        type="number"
                        value={dealAmount}
                        onChange={(e) => setDealAmount(e.target.value)}
                        placeholder="请输入成交金额"
                        className="input-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        项目清单
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PROJECTS.map((p) => (
                          <button
                            key={p}
                            onClick={() => toggleProject(p)}
                            className={cn(
                              'tag-pill text-xs',
                              selectedProjects.includes(p)
                                ? 'tag-pill-active'
                                : 'tag-pill-default'
                            )}
                          >
                            {selectedProjects.includes(p) && (
                              <Check className="w-3 h-3" />
                            )}
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    术后满意度
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setPostOpSatisfaction(s)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              'w-6 h-6 transition-colors',
                              s <= postOpSatisfaction
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-200 hover:text-yellow-200'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-ink-soft ml-2">
                      {postOpSatisfaction}/5 星
                    </span>
                  </div>
                </div>

                {dealStatus === 'lost' && (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      未成交原因
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {UNDEAL_REASONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedUndealReason(r)}
                          className={cn(
                            'tag-pill text-xs',
                            selectedUndealReason === r
                              ? 'bg-coral-soft text-coral border-coral/30'
                              : 'tag-pill-default'
                          )}
                        >
                          {selectedUndealReason === r && (
                            <Check className="w-3 h-3" />
                          )}
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveStatus}
                  disabled={!statusCustomerId}
                  className="btn-primary w-full mt-2"
                >
                  保存状态
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
