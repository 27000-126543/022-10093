import { useState } from 'react';
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

export default function CustomerEntry() {
  const navigate = useNavigate();
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const consultants = useCustomerStore((state) => state.consultants);

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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8">
        <h2 className="section-title">录入新客户</h2>
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
    </div>
  );
}
