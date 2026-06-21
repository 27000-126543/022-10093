import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  Store,
  ChevronDown,
  Check,
  User,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { cn } from '@/lib/utils';
import { TIER_CONFIG } from '@/constants/dictionaries';
import type { FollowUpTask, Customer } from '@/types';

type TabType = 'all' | 'today' | 'overdue' | 'completed';
type PriorityType = 'high' | 'medium' | 'low';
type FollowMethod = 'wechat' | 'phone' | 'visit';

interface GroupedTasks {
  key: string;
  label: string;
  tasks: (FollowUpTask & { customer?: Customer; overdueDays?: number })[];
}

const PRIORITY_COLORS: Record<PriorityType, string> = {
  high: 'bg-coral',
  medium: 'bg-orange-400',
  low: 'bg-yellow-400',
};

const PRIORITY_LABELS: Record<PriorityType, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const METHOD_LABELS: Record<FollowMethod, string> = {
  wechat: '微信',
  phone: '电话',
  visit: '到店',
};

const METHOD_ICONS: Record<FollowMethod, typeof MessageCircle> = {
  wechat: MessageCircle,
  phone: Phone,
  visit: Store,
};

function daysBetween(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function TaskList() {
  const {
    tasks,
    customers,
    consultants,
    completeTask,
    updateTask,
    addTask,
    initializeMockData,
  } = useCustomerStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedPriority, setSelectedPriority] = useState<PriorityType | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [showConsultantDropdown, setShowConsultantDropdown] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [followMethod, setFollowMethod] = useState<FollowMethod>('wechat');
  const [followNote, setFollowNote] = useState('');
  const [nextDate, setNextDate] = useState(addDays(3));
  const [expandedScript, setExpandedScript] = useState<string | null>(null);

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

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (activeTab === 'today') {
          if (task.completed) return false;
          const d = daysBetween(task.due_date);
          return d === 0;
        }
        if (activeTab === 'overdue') {
          if (task.completed) return false;
          return daysBetween(task.due_date) < 0;
        }
        if (activeTab === 'completed') {
          return task.completed;
        }
        return true;
      })
      .filter((task) => {
        if (!selectedPriority) return true;
        return task.priority === selectedPriority;
      })
      .filter((task) => {
        if (!selectedConsultant) return true;
        const customer = customerMap[task.customer_id];
        return customer?.consultant_id === selectedConsultant;
      })
      .map((task) => {
        const customer = customerMap[task.customer_id];
        const overdueDays = task.completed ? undefined : -daysBetween(task.due_date);
        return {
          ...task,
          customer,
          overdueDays: overdueDays && overdueDays > 0 ? overdueDays : undefined,
        };
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [tasks, activeTab, selectedPriority, selectedConsultant, customerMap]);

  const groupedTasks = useMemo<GroupedTasks[]>(() => {
    const groups: GroupedTasks[] = [];
    const today: GroupedTasks['tasks'] = [];
    const tomorrow: GroupedTasks['tasks'] = [];
    const thisWeek: GroupedTasks['tasks'] = [];
    const overdue: GroupedTasks['tasks'] = [];
    const completed: GroupedTasks['tasks'] = [];

    filteredTasks.forEach((task) => {
      if (task.completed) {
        completed.push(task);
        return;
      }
      const d = daysBetween(task.due_date);
      if (d < 0) overdue.push(task);
      else if (d === 0) today.push(task);
      else if (d === 1) tomorrow.push(task);
      else if (d <= 7) thisWeek.push(task);
    });

    if (overdue.length) groups.push({ key: 'overdue', label: '超期', tasks: overdue });
    if (today.length) groups.push({ key: 'today', label: '今日', tasks: today });
    if (tomorrow.length) groups.push({ key: 'tomorrow', label: '明天', tasks: tomorrow });
    if (thisWeek.length) groups.push({ key: 'thisWeek', label: '本周', tasks: thisWeek });
    if (completed.length) groups.push({ key: 'completed', label: '已完成', tasks: completed });

    return groups;
  }, [filteredTasks]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return filteredTasks.find((t) => t.id === selectedTaskId) ?? null;
  }, [selectedTaskId, filteredTasks]);

  const handleMarkAllRead = () => {
    const todayStart = new Date().toISOString().split('T')[0];
    filteredTasks
      .filter((t) => !t.completed && t.due_date <= todayStart)
      .forEach((t) => completeTask(t.id));
  };

  const handleOpenFollowModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setFollowMethod('wechat');
    setFollowNote('');
    setNextDate(addDays(3));
  };

  const handleSaveFollow = () => {
    if (!selectedTask) return;
    updateTask(selectedTask.id, {
      follow_up_method: followMethod,
      follow_up_note: followNote,
      next_follow_up: nextDate,
    });
    completeTask(selectedTask.id);
    if (nextDate && nextDate.trim()) {
      addTask({
        customer_id: selectedTask.customer_id,
        priority: selectedTask.priority,
        due_date: nextDate,
        suggested_script: selectedTask.suggested_script,
      });
    }
    setSelectedTaskId(null);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'today', label: '今日待办' },
    { key: 'overdue', label: '超期' },
    { key: 'completed', label: '已完成' },
  ];

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rose-gold-500" />
            跟进任务中心
          </h1>
          <p className="text-ink-soft mt-1 text-sm">系统化跟进每一位客户，不错过任何成交机会</p>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 bg-peach-soft rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    activeTab === tab.key
                      ? 'bg-white text-ink shadow-card'
                      : 'text-ink-soft hover:text-ink'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-soft">优先级：</span>
              {(['high', 'medium', 'low'] as PriorityType[]).map((p) => (
                <button
                  key={p}
                  onClick={() =>
                    setSelectedPriority(selectedPriority === p ? null : p)
                  }
                  className={cn(
                    'tag-pill',
                    selectedPriority === p ? 'tag-pill-active' : 'tag-pill-default'
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      PRIORITY_COLORS[p]
                    )}
                  />
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>

            <div className="relative ml-auto">
              <button
                onClick={() => setShowConsultantDropdown(!showConsultantDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-gold-100 bg-white text-sm text-ink hover:border-rose-gold-300 transition-all"
              >
                <User className="w-4 h-4 text-rose-gold-500" />
                {selectedConsultant
                  ? consultants.find((c) => c.id === selectedConsultant)?.name
                  : '全部咨询师'}
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-ink-soft transition-transform',
                    showConsultantDropdown && 'rotate-180'
                  )}
                />
              </button>
              {showConsultantDropdown && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl shadow-card-hover border border-rose-gold-50 py-2 z-10">
                  <button
                    onClick={() => {
                      setSelectedConsultant('');
                      setShowConsultantDropdown(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-peach-soft transition-colors flex items-center justify-between',
                      !selectedConsultant && 'text-rose-gold-600 font-medium'
                    )}
                  >
                    全部咨询师
                    {!selectedConsultant && <Check className="w-4 h-4" />}
                  </button>
                  {consultants.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedConsultant(c.id);
                        setShowConsultantDropdown(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-peach-soft transition-colors flex items-center justify-between',
                        selectedConsultant === c.id &&
                          'text-rose-gold-600 font-medium'
                      )}
                    >
                      {c.name}
                      {selectedConsultant === c.id && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleMarkAllRead}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              标记全部已读
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {groupedTasks.length === 0 && (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-ink-soft">当前筛选条件下暂无任务</p>
            </div>
          )}

          {groupedTasks.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-serif text-base font-semibold text-ink flex items-center gap-2">
                  {group.key === 'overdue' && (
                    <AlertCircle className="w-5 h-5 text-coral" />
                  )}
                  {group.key === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-mint" />
                  )}
                  {(group.key === 'today' ||
                    group.key === 'tomorrow' ||
                    group.key === 'thisWeek') && (
                    <Calendar className="w-5 h-5 text-rose-gold-500" />
                  )}
                  {group.label}
                </h2>
                <span className="px-2 py-0.5 bg-peach-soft text-ink-soft text-xs rounded-full">
                  {group.tasks.length} 项
                </span>
                <div className="flex-1 h-px bg-rose-gold-100" />
              </div>

              <div className="space-y-3">
                {group.tasks.map((task) => {
                  const customer = task.customer;
                  const tierConfig = customer
                    ? TIER_CONFIG[customer.tier]
                    : null;
                  const isExpanded = expandedScript === task.id;

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                      className="card card-hover relative overflow-hidden flex"
                    >
                      <div
                        className={cn(
                          'w-1.5 flex-shrink-0',
                          PRIORITY_COLORS[task.priority as PriorityType]
                        )}
                      />

                      <div className="flex-1 p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-rose-gold-soft flex items-center justify-center flex-shrink-0">
                                <span className="font-serif font-medium text-rose-gold-700">
                                  {customer?.name?.[0] ?? '?'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    'font-semibold text-ink',
                                    task.completed && 'line-through opacity-60'
                                  )}
                                >
                                  {customer?.name ?? '未知客户'}
                                </span>
                                {tierConfig && (
                                  <span
                                    className="tag-pill text-xs"
                                    style={{
                                      backgroundColor: tierConfig.bgColor,
                                      color: tierConfig.color,
                                    }}
                                  >
                                    {tierConfig.label}
                                  </span>
                                )}
                                {customer?.channel && (
                                  <span className="tag-pill tag-pill-default text-xs">
                                    {customer.channel}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pl-[52px]">
                              <p
                                className={cn(
                                  'text-sm text-ink mb-2 line-clamp-2',
                                  task.completed && 'line-through opacity-60'
                                )}
                              >
                                {task.follow_up_note || task.suggested_script}
                              </p>

                              <motion.div
                                className="relative mb-3"
                                onMouseEnter={() =>
                                  setExpandedScript(task.id)
                                }
                                onMouseLeave={() =>
                                  setExpandedScript(null)
                                }
                              >
                                <div
                                  className={cn(
                                    'relative bg-gray-50 rounded-xl p-3 text-xs text-gray-500 transition-all duration-300 overflow-hidden',
                                    !isExpanded && 'max-h-12'
                                  )}
                                >
                                  <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-50" />
                                  <span className="text-rose-gold-600 font-medium mr-1">
                                    💡 建议话术：
                                  </span>
                                  {task.suggested_script}
                                </div>
                                {!isExpanded && (
                                  <div className="text-center -mt-1">
                                    <span className="text-xs text-ink-soft">
                                      hover 展开 ↓
                                    </span>
                                  </div>
                                )}
                              </motion.div>

                              <div className="flex flex-wrap items-center gap-2">
                                {task.follow_up_method ? (
                                  <span className="tag-pill tag-pill-default text-xs">
                                    {(() => {
                                      const Icon =
                                        METHOD_ICONS[
                                          task.follow_up_method as FollowMethod
                                        ];
                                      return (
                                        <>
                                          <Icon className="w-3.5 h-3.5" />
                                          {
                                            METHOD_LABELS[
                                              task.follow_up_method as FollowMethod
                                            ]
                                          }
                                        </>
                                      );
                                    })()}
                                  </span>
                                ) : (
                                  <>
                                    <span className="tag-pill tag-pill-default text-xs">
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      微信
                                    </span>
                                    <span className="tag-pill tag-pill-default text-xs">
                                      <Phone className="w-3.5 h-3.5" />
                                      电话
                                    </span>
                                    <span className="tag-pill tag-pill-default text-xs">
                                      <Store className="w-3.5 h-3.5" />
                                      到店
                                    </span>
                                  </>
                                )}
                                <span className="tag-pill tag-pill-default text-xs">
                                  <Clock className="w-3.5 h-3.5" />
                                  {task.due_date}
                                </span>
                                {task.overdueDays && (
                                  <span className="tag-pill bg-coral-soft text-coral text-xs font-medium">
                                    逾期 {task.overdueDays} 天
                                  </span>
                                )}
                                {task.completed && task.completed_at && (
                                  <span className="tag-pill bg-mint-soft text-mint text-xs font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    完成于 {task.completed_at}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {!task.completed && (
                              <>
                                <button
                                  onClick={() => handleOpenFollowModal(task.id)}
                                  className="btn-primary whitespace-nowrap text-sm"
                                >
                                  立即跟进
                                </button>
                                <button
                                  onClick={() => completeTask(task.id)}
                                  className="btn-secondary whitespace-nowrap text-sm"
                                >
                                  标记完成
                                </button>
                              </>
                            )}
                            {task.completed && (
                              <span className="px-4 py-2 text-center text-mint font-medium text-sm">
                                ✓ 已完成
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedTask && selectedTask.customer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTaskId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-card-hover w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-rose-gold-gradient p-5 text-white">
                <h3 className="font-serif text-lg font-semibold">跟进详情</h3>
                <p className="text-white/80 text-sm mt-1">
                  记录与 {selectedTask.customer.name} 的本次跟进
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 p-4 bg-peach-soft rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-rose-gold-soft flex items-center justify-center">
                    <span className="font-serif font-bold text-rose-gold-700 text-lg">
                      {selectedTask.customer.name[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-ink">
                      {selectedTask.customer.name}
                    </div>
                    <div className="text-sm text-ink-soft">
                      {selectedTask.customer.projects.slice(0, 3).join('、') ||
                        '暂无项目记录'}
                    </div>
                    <div className="text-xs text-ink-soft mt-0.5">
                      {selectedTask.customer.phone}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    跟进方式
                  </label>
                  <div className="flex gap-3">
                    {(['wechat', 'phone', 'visit'] as FollowMethod[]).map(
                      (m) => {
                        const Icon = METHOD_ICONS[m];
                        return (
                          <button
                            key={m}
                            onClick={() => setFollowMethod(m)}
                            className={cn(
                              'flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all duration-200',
                              followMethod === m
                                ? 'border-rose-gold-400 bg-peach-soft text-rose-gold-600'
                                : 'border-rose-gold-50 bg-white text-ink-soft hover:border-rose-gold-200'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">
                              {METHOD_LABELS[m]}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    跟进记录
                  </label>
                  <textarea
                    value={followNote}
                    onChange={(e) => setFollowNote(e.target.value)}
                    placeholder="请记录本次跟进的沟通内容、客户反馈、下一步计划等..."
                    rows={4}
                    className="input-base resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    下次跟进日期
                  </label>
                  <div className="flex gap-3 items-start">
                    <input
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="input-base flex-1"
                    />
                    <div className="flex gap-1.5 flex-col">
                      <div className="flex gap-1.5">
                        {[
                          { d: 1, label: '1天后' },
                          { d: 3, label: '3天后' },
                          { d: 7, label: '7天后' },
                        ].map((opt) => (
                          <button
                            key={opt.d}
                            onClick={() => setNextDate(addDays(opt.d))}
                            className={cn(
                              'px-3 py-2 text-xs rounded-lg font-medium transition-all',
                              nextDate === addDays(opt.d)
                                ? 'bg-rose-gold-gradient text-white'
                                : 'bg-peach-soft text-ink-soft hover:bg-peach-deep'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveFollow}
                  className="btn-primary flex-1"
                >
                  保存跟进记录
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
