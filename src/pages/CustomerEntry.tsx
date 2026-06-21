import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '@/store/customerStore';
import {
  CHANNELS,
  PROJECTS,
  DECISION_CYCLES,
  SKIN_TAGS,
  CONTOUR_TAGS,
} from '@/constants/dictionaries';
import TagPill from '@/components/TagPill';
import { QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScanCustomer {
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  allergy_history?: string;
}

const SCAN_PRESET_CUSTOMERS: ScanCustomer[] = [
  {
    name: '张雨婷',
    phone: '138****6523',
    age: 28,
    gender: 'female',
    allergy_history: '',
  },
  {
    name: '李思涵',
    phone: '139****8817',
    age: 35,
    gender: 'female',
    allergy_history: '',
  },
  {
    name: '王子豪',
    phone: '137****4209',
    age: 32,
    gender: 'male',
    allergy_history: '',
  },
];

export default function CustomerEntry() {
  const navigate = useNavigate();
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const consultants = useCustomerStore((state) => state.consultants);
  const channelSelectRef = useRef<HTMLSelectElement>(null);

  const [showScanModal, setShowScanModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    age: 30,
    gender: 'female' as 'male' | 'female',
    channel: '自然到店',
    budget_min: 10000,
    budget_max: 30000,
    decision_cycle: 'medium' as 'urgent' | 'short' | 'medium' | 'long',
    projects: [] as string[],
    skin_tags: [] as string[],
    contour_tags: [] as string[],
    consultant_id: consultants[0]?.id || '',
  });

  const toggleArrayValue = (field: 'projects' | 'skin_tags' | 'contour_tags', value: string) => {
    setForm((prev) => {
      const arr = prev[field];
      const exists = arr.includes(value);
      return {
        ...prev,
        [field]: exists ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = addCustomer(form);
    navigate(`/customers/${customer.id}/profile`);
  };

  const handleSelectScanCustomer = (customer: ScanCustomer) => {
    setForm((prev) => ({
      ...prev,
      name: customer.name,
      phone: customer.phone,
      age: customer.age,
      gender: customer.gender,
    }));
    setShowScanModal(false);
    setTimeout(() => {
      channelSelectRef.current?.focus();
    }, 100);
  };

  const getInitial = (name: string) => name.charAt(0);

  const getGenderText = (gender: 'male' | 'female') => (gender === 'female' ? '女' : '男');

  const getAvatarColor = (gender: 'male' | 'female') =>
    gender === 'female' ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8">
        <h2 className="section-title">录入新客户</h2>

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowScanModal(true)}
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-lg"
          >
            <QrCode size={24} />
            扫码快速建档
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">姓名 *</label>
              <input
                type="text"
                className="input-base"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="请输入客户姓名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">手机号 *</label>
              <input
                type="tel"
                className="input-base"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="请输入手机号"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">年龄</label>
              <input
                type="number"
                className="input-base"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                min={18}
                max={80}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">性别</label>
              <select
                className="input-base"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
              >
                <option value="female">女</option>
                <option value="male">男</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">来源渠道</label>
              <select
                ref={channelSelectRef}
                className="input-base"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">预算区间（元）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input-base"
                  value={form.budget_min}
                  onChange={(e) => setForm({ ...form, budget_min: parseInt(e.target.value) || 0 })}
                  min={0}
                />
                <span className="text-ink-soft">-</span>
                <input
                  type="number"
                  className="input-base"
                  value={form.budget_max}
                  onChange={(e) => setForm({ ...form, budget_max: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">决策周期</label>
              <select
                className="input-base"
                value={form.decision_cycle}
                onChange={(e) => setForm({ ...form, decision_cycle: e.target.value as any })}
              >
                {DECISION_CYCLES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">意向咨询项目</label>
            <div className="flex flex-wrap gap-2">
              {PROJECTS.map((p) => (
                <TagPill
                  key={p}
                  label={p}
                  active={form.projects.includes(p)}
                  onClick={() => toggleArrayValue('projects', p)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">皮肤问题标签</label>
            <div className="flex flex-wrap gap-2">
              {SKIN_TAGS.map((t) => (
                <TagPill
                  key={t}
                  label={t}
                  active={form.skin_tags.includes(t)}
                  onClick={() => toggleArrayValue('skin_tags', t)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">轮廓需求标签</label>
            <div className="flex flex-wrap gap-2">
              {CONTOUR_TAGS.map((t) => (
                <TagPill
                  key={t}
                  label={t}
                  active={form.contour_tags.includes(t)}
                  onClick={() => toggleArrayValue('contour_tags', t)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">分配咨询师</label>
            <select
              className="input-base"
              value={form.consultant_id}
              onChange={(e) => setForm({ ...form, consultant_id: e.target.value })}
            >
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-rose-gold-50">
            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              保存并分析
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowScanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-rose-gold-50">
                <h3 className="text-xl font-semibold text-ink">模拟扫码建档</h3>
                <p className="text-ink-soft mt-1">扫码已识别到客户基础信息，请确认并继续完善</p>
              </div>

              <div className="p-6 space-y-4">
                {SCAN_PRESET_CUSTOMERS.map((customer, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectScanCustomer(customer)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-rose-gold-100 hover:border-rose-gold-300 hover:bg-rose-gold-50 cursor-pointer transition-all"
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold ${getAvatarColor(customer.gender)}`}
                    >
                      {getInitial(customer.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-medium text-ink">{customer.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-rose-gold-100 text-rose-gold-700">
                          {getGenderText(customer.gender)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-ink-soft">
                        <span>{customer.age}岁</span>
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                    <div className="text-rose-gold-500 text-sm">选择 →</div>
                  </motion.div>
                ))}
              </div>

              <div className="p-6 border-t border-rose-gold-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  className="btn-secondary"
                >
                  手动输入
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
