import { create } from 'zustand';
import type { Customer, FollowUpTask, VisitRecord, Consultant } from '@/types';
import {
  calculateDealProbability,
  assignTier,
  daysSince,
  generateScriptSuggestion,
} from '@/utils/tierAlgorithm';
import { mockCustomers, mockTasks, mockRecords, mockConsultants } from '@/data/mockData';

const STORAGE_KEY = 'meiyi-customer-store-v1';

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface PersistedData {
  customers: Customer[];
  tasks: FollowUpTask[];
  records: VisitRecord[];
  consultants: Consultant[];
}

interface DealDimensionItem {
  key: string;
  name: string;
  dealCount: number;
  totalAmount: number;
  avgUnitPrice: number;
  avgCycleDays: number;
  customers: Customer[];
}

interface DealAnalytics {
  byProject: DealDimensionItem[];
  byChannel: DealDimensionItem[];
  byConsultant: DealDimensionItem[];
  summary: {
    totalDeals: number;
    totalAmount: number;
    avgUnitPrice: number;
    avgCycleDays: number;
  };
}

interface FeedbackTagStats {
  tags: Array<{ tag: string; count: number }>;
  undeal_reasons: Array<{ reason: string; count: number }>;
}

interface CustomerStore {
  customers: Customer[];
  tasks: FollowUpTask[];
  records: VisitRecord[];
  consultants: Consultant[];
  currentCustomerId: string | null;

  addCustomer: (data: Partial<Customer>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  setCurrentCustomer: (id: string | null) => void;

  addTask: (task: Partial<FollowUpTask>) => void;
  updateTask: (id: string, data: Partial<FollowUpTask>) => void;
  completeTask: (id: string) => void;

  addRecord: (record: Partial<VisitRecord>) => void;

  initializeMockData: () => void;
  resetStore: () => void;

  getOverdueCustomers: () => Customer[];
  getCustomersByTier: (tier: string) => Customer[];
  getCustomersByConsultant: (consultantId: string) => Customer[];
  getDealsByDateRange: (startDate: string, endDate: string) => Customer[];
  getDealsByConsultantInRange: (consultantId: string, startDate: string, endDate: string) => Customer[];
  getDealAnalytics: (rangeStart: string, rangeEnd: string) => DealAnalytics;
  getFeedbackTagStats: () => FeedbackTagStats;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  tasks: [],
  records: [],
  consultants: [],
  currentCustomerId: null,

  addCustomer: (data) => {
    const id = generateId();
    const now = formatDate(new Date());

    const dealData = calculateDealProbability({
      budget_min: data.budget_min ?? 0,
      budget_max: data.budget_max ?? 0,
      decision_cycle: data.decision_cycle ?? 'medium',
      projects: data.projects ?? [],
      skin_tags: data.skin_tags ?? [],
      contour_tags: data.contour_tags ?? [],
      channel: data.channel ?? '自然到店',
    });

    const lastFollowDays = 0;
    const tier = assignTier(dealData.total, lastFollowDays);

    const customer: Customer = {
      id,
      name: data.name ?? '新客户',
      phone: data.phone ?? '',
      age: data.age ?? 30,
      gender: data.gender ?? 'female',
      channel: data.channel ?? '自然到店',
      budget_min: data.budget_min ?? 0,
      budget_max: data.budget_max ?? 0,
      decision_cycle: data.decision_cycle ?? 'medium',
      projects: data.projects ?? [],
      skin_tags: data.skin_tags ?? [],
      contour_tags: data.contour_tags ?? [],
      tier,
      deal_probability: dealData.total,
      deal_probability_breakdown: dealData.breakdown,
      consultant_id: data.consultant_id ?? '',
      created_at: now,
      last_follow_up: null,
      status: 'active',
      deal_amount: data.deal_amount,
      deal_projects: data.deal_projects,
    };

    const dueDate = new Date();
    if (tier === 'high') {
      dueDate.setDate(dueDate.getDate() + 1);
    } else if (tier === 'nurturing') {
      dueDate.setDate(dueDate.getDate() + 3);
    } else if (tier === 'watching') {
      dueDate.setDate(dueDate.getDate() + 7);
    } else {
      dueDate.setDate(dueDate.getDate() + 30);
    }

    const priorities: Record<string, 'high' | 'medium' | 'low'> = {
      high: 'high',
      nurturing: 'medium',
      watching: 'low',
      dormant: 'low',
    };

    const initialTask: FollowUpTask = {
      id: generateId(),
      customer_id: id,
      priority: priorities[tier],
      due_date: formatDate(dueDate),
      suggested_script: generateScriptSuggestion(customer),
      completed: false,
    };

    set((state) => {
      const newState = {
        customers: [...state.customers, customer],
        tasks: [...state.tasks, initialTask],
      };
      saveToStorage<PersistedData>(STORAGE_KEY, {
        customers: newState.customers,
        tasks: newState.tasks,
        records: state.records,
        consultants: state.consultants,
      });
      return newState;
    });

    return customer;
  },

  updateCustomer: (id, data) => {
    set((state) => {
      const now = formatDate(new Date());
      const customers = state.customers.map((c) => {
        if (c.id !== id) return c;

        const updatedData: Partial<Customer> = { ...data };

        if (data.status === 'deal' && c.status !== 'deal') {
          updatedData.deal_at = now;
        }
        if (data.status && data.status !== 'deal' && c.status === 'deal') {
          updatedData.deal_at = undefined;
        }

        const updated = { ...c, ...updatedData };

        const dealData = calculateDealProbability({
          budget_min: updated.budget_min,
          budget_max: updated.budget_max,
          decision_cycle: updated.decision_cycle,
          projects: updated.projects,
          skin_tags: updated.skin_tags,
          contour_tags: updated.contour_tags,
          channel: updated.channel,
        });

        const lastFollowDays = updated.last_follow_up
          ? daysSince(updated.last_follow_up)
          : daysSince(updated.created_at);

        updated.deal_probability = dealData.total;
        updated.deal_probability_breakdown = dealData.breakdown;
        updated.tier = assignTier(dealData.total, lastFollowDays);

        return updated;
      });

      saveToStorage<PersistedData>(STORAGE_KEY, {
        customers,
        tasks: state.tasks,
        records: state.records,
        consultants: state.consultants,
      });

      return { customers };
    });
  },

  setCurrentCustomer: (id) => {
    set({ currentCustomerId: id });
  },

  addTask: (task) => {
    const newTask: FollowUpTask = {
      id: generateId(),
      customer_id: task.customer_id ?? '',
      priority: task.priority ?? 'medium',
      due_date: task.due_date ?? formatDate(new Date()),
      suggested_script: task.suggested_script ?? '',
      completed: false,
      ...task,
    };

    set((state) => {
      const tasks = [...state.tasks, newTask];
      saveToStorage<PersistedData>(STORAGE_KEY, {
        customers: state.customers,
        tasks,
        records: state.records,
        consultants: state.consultants,
      });
      return { tasks };
    });
  },

  updateTask: (id, data) => {
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id ? { ...t, ...data } : t
      );
      saveToStorage<PersistedData>(STORAGE_KEY, {
        customers: state.customers,
        tasks,
        records: state.records,
        consultants: state.consultants,
      });
      return { tasks };
    });
  },

  completeTask: (id) => {
    const now = formatDate(new Date());

    set((state) => {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return state;

      const tasks = state.tasks.map((t) =>
        t.id === id ? { ...t, completed: true, completed_at: now } : t
      );

      const customers = state.customers.map((c) =>
        c.id === task.customer_id ? { ...c, last_follow_up: now } : c
      );

      const priorityText: Record<string, string> = {
        high: '高',
        medium: '中',
        low: '低',
      };
      const methodText = task.follow_up_method || '未指定方式';
      const noteText = task.follow_up_note || '无备注';
      const autoNote = `跟进完成 · ${priorityText[task.priority] || task.priority}优先级 · ${methodText} · ${noteText}`;

      const newRecord: VisitRecord = {
        id: generateId(),
        record_type: 'follow_up_done',
        customer_id: task.customer_id,
        satisfaction: 5,
        follow_up_method: task.follow_up_method,
        follow_up_note: task.follow_up_note,
        next_follow_up: task.next_follow_up,
        priority: task.priority,
        feedback_tag: task.feedback_tag,
        note: autoNote,
        created_at: now,
      };

      const records = [...state.records, newRecord];

      saveToStorage<PersistedData>(STORAGE_KEY, {
        customers,
        tasks,
        records,
        consultants: state.consultants,
      });

      return { tasks, customers, records };
    });
  },

  addRecord: (record) => {
    const newRecord: VisitRecord = {
      id: generateId(),
      customer_id: record.customer_id ?? '',
      record_type: record.record_type ?? 'follow_up',
      satisfaction: record.satisfaction ?? 5,
      undeal_reason: record.undeal_reason,
      note: record.note,
      created_at: formatDate(new Date()),
      follow_up_method: record.follow_up_method,
      follow_up_note: record.follow_up_note,
      next_follow_up: record.next_follow_up,
      priority: record.priority,
    };

    set((state) => {
      const records = [...state.records, newRecord];
      saveToStorage<PersistedData>(STORAGE_KEY, {
        customers: state.customers,
        tasks: state.tasks,
        records,
        consultants: state.consultants,
      });
      return { records };
    });
  },

  initializeMockData: () => {
    const existing = loadFromStorage<PersistedData>(STORAGE_KEY);
    if (existing && existing.customers && existing.customers.length > 0) {
      set({
        customers: existing.customers,
        tasks: existing.tasks ?? [],
        records: existing.records ?? [],
        consultants: existing.consultants ?? [],
      });
    } else {
      set({
        customers: mockCustomers,
        tasks: mockTasks,
        records: mockRecords,
        consultants: mockConsultants,
      });
      saveToStorage<PersistedData>(STORAGE_KEY, {
        customers: mockCustomers,
        tasks: mockTasks,
        records: mockRecords,
        consultants: mockConsultants,
      });
    }
  },

  resetStore: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      customers: mockCustomers,
      tasks: mockTasks,
      records: mockRecords,
      consultants: mockConsultants,
    });
    saveToStorage<PersistedData>(STORAGE_KEY, {
      customers: mockCustomers,
      tasks: mockTasks,
      records: mockRecords,
      consultants: mockConsultants,
    });
  },

  getOverdueCustomers: () => {
    const state = get();
    const today = formatDate(new Date());

    return state.customers.filter((c) => {
      if (c.status !== 'active') return false;

      const customerTasks = state.tasks.filter(
        (t) => t.customer_id === c.id && !t.completed
      );

      if (customerTasks.length === 0) {
        const lastDays = c.last_follow_up
          ? daysSince(c.last_follow_up)
          : daysSince(c.created_at);
        const threshold =
          c.tier === 'high' ? 1 : c.tier === 'nurturing' ? 3 : c.tier === 'watching' ? 7 : 30;
        return lastDays > threshold;
      }

      return customerTasks.some((t) => t.due_date < today);
    });
  },

  getCustomersByTier: (tier) => {
    const state = get();
    return state.customers.filter((c) => c.tier === tier);
  },

  getCustomersByConsultant: (consultantId) => {
    const state = get();
    return state.customers.filter((c) => c.consultant_id === consultantId);
  },

  getDealsByDateRange: (startDate, endDate) => {
    const state = get();
    return state.customers.filter((c) => {
      if (c.status !== 'deal') return false;
      const dateStr = c.deal_at || c.created_at;
      return dateStr >= startDate && dateStr <= endDate;
    });
  },

  getDealsByConsultantInRange: (consultantId, startDate, endDate) => {
    const state = get();
    return state.customers.filter((c) => {
      if (c.status !== 'deal') return false;
      if (c.consultant_id !== consultantId) return false;
      const dateStr = c.deal_at || c.created_at;
      return dateStr >= startDate && dateStr <= endDate;
    });
  },

  getDealAnalytics: (rangeStart, rangeEnd) => {
    const state = get();
    const dealCustomers = state.customers.filter((c) => {
      if (c.status !== 'deal') return false;
      const d = c.deal_at || c.created_at;
      return d >= rangeStart && d <= rangeEnd;
    });

    function daysBetweenStr(start: string, end: string): number {
      const s = new Date(start);
      const e = new Date(end);
      return Math.max(0, Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
    }

    function aggregateBy(
      items: Customer[],
      getKeyAndName: (c: Customer) => Array<{ key: string; name: string }>
    ): DealDimensionItem[] {
      const map: Record<string, { key: string; name: string; dealCount: number; totalAmount: number; totalCycle: number; customers: Customer[] }> = {};
      items.forEach((c) => {
        const entries = getKeyAndName(c);
        entries.forEach(({ key, name }) => {
          if (!map[key]) {
            map[key] = {
              key,
              name,
              dealCount: 0,
              totalAmount: 0,
              totalCycle: 0,
              customers: [],
            };
          }
          const amount = c.deal_amount ?? 0;
          const cycle = daysBetweenStr(c.created_at, c.deal_at || c.created_at);
          map[key].dealCount += 1;
          map[key].totalAmount += amount;
          map[key].totalCycle += cycle;
          map[key].customers.push(c);
        });
      });
      return Object.values(map).map((item) => ({
        key: item.key,
        name: item.name,
        dealCount: item.dealCount,
        totalAmount: item.totalAmount,
        avgUnitPrice: item.dealCount > 0 ? Number((item.totalAmount / item.dealCount).toFixed(2)) : 0,
        avgCycleDays: item.dealCount > 0 ? Number((item.totalCycle / item.dealCount).toFixed(1)) : 0,
        customers: item.customers,
      }));
    }

    const byProject = aggregateBy(dealCustomers, (c) => {
      const projects = c.deal_projects?.length ? c.deal_projects : c.projects?.length ? c.projects : ['未指定项目'];
      return projects.map((p) => ({ key: p, name: p }));
    });

    const byChannel = aggregateBy(dealCustomers, (c) => {
      const ch = c.channel || '未指定渠道';
      return [{ key: ch, name: ch }];
    });

    const consultantMap: Record<string, string> = {};
    state.consultants.forEach((con) => {
      consultantMap[con.id] = con.name;
    });
    const byConsultant = aggregateBy(dealCustomers, (c) => {
      const cid = c.consultant_id || 'unknown';
      const cname = consultantMap[cid] || '未指定咨询师';
      return [{ key: cid, name: cname }];
    });

    const totalDeals = dealCustomers.length;
    const totalAmount = dealCustomers.reduce((s, c) => s + (c.deal_amount ?? 0), 0);
    const totalCycles = dealCustomers.reduce(
      (s, c) => s + daysBetweenStr(c.created_at, c.deal_at || c.created_at),
      0
    );

    return {
      byProject,
      byChannel,
      byConsultant,
      summary: {
        totalDeals,
        totalAmount,
        avgUnitPrice: totalDeals > 0 ? Number((totalAmount / totalDeals).toFixed(2)) : 0,
        avgCycleDays: totalDeals > 0 ? Number((totalCycles / totalDeals).toFixed(1)) : 0,
      },
    };
  },

  getFeedbackTagStats: () => {
    const state = get();
    const followUpRecords = state.records.filter(
      (r) => r.record_type === 'follow_up_done'
    );

    const tagCounts: Record<string, number> = {};
    followUpRecords.forEach((r) => {
      if (r.feedback_tag) {
        tagCounts[r.feedback_tag] = (tagCounts[r.feedback_tag] ?? 0) + 1;
      }
    });
    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    const reasonCounts: Record<string, number> = {};
    state.records.forEach((r) => {
      if (r.undeal_reason) {
        reasonCounts[r.undeal_reason] = (reasonCounts[r.undeal_reason] ?? 0) + 1;
      }
    });
    const undeal_reasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return { tags, undeal_reasons };
  },
}));
