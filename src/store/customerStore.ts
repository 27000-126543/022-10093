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
      const customers = state.customers.map((c) => {
        if (c.id !== id) return c;

        const updated = { ...c, ...data };

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

      saveToStorage<PersistedData>(STORAGE_KEY, {
        customers,
        tasks,
        records: state.records,
        consultants: state.consultants,
      });

      return { tasks, customers };
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
}));
