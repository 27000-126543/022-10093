import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  CalendarHeart,
  Users,
  ChevronRight,
  Bell,
  UserCircle2,
  Sparkles,
} from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: '分层看板', path: '/dashboard' },
  { icon: UserPlus, label: '客户录入', path: '/customers/entry' },
  { icon: ClipboardList, label: '跟进任务', path: '/tasks' },
  { icon: CalendarHeart, label: '回访记录', path: '/records' },
  { icon: Users, label: '客户管理', path: '/dashboard#customers' },
];

const breadcrumbMap: Record<string, string> = {
  '/dashboard': '分层看板',
  '/customers/entry': '客户录入',
  '/tasks': '跟进任务',
  '/records': '回访记录',
  '/tags': '客户画像',
};

export default function Layout() {
  const location = useLocation();
  const initializeMockData = useCustomerStore((state) => state.initializeMockData);
  const tasks = useCustomerStore((state) => state.tasks);

  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  const todayTasks = tasks.filter((t) => {
    const today = new Date().toISOString().split('T')[0];
    return t.due_date <= today && !t.completed;
  }).length;

  const formatDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    return date.toLocaleDateString('zh-CN', options);
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/customers/') && path.endsWith('/profile')) {
      return ['客户管理', '客户详情'];
    }
    const label = breadcrumbMap[path];
    if (label) return [label];
    return ['首页'];
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="w-[240px] flex-shrink-0 bg-white border-r border-rose-gold-100 flex flex-col">
        <div className="px-5 py-6 border-b border-rose-gold-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-gold-gradient flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-serif font-bold text-ink text-base">美颐</div>
              <div className="text-[10px] text-ink-soft tracking-wide">求美者分层工作台</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'nav-item',
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-rose-gold-50">
          <div className="card p-3 bg-gradient-to-br from-peach-soft to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-gold-gradient flex items-center justify-center">
                <UserCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-ink text-sm">李娜</div>
                <div className="text-[11px] text-ink-soft">资深咨询师</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-sm border-b border-rose-gold-50 px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm">
              {breadcrumb.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-ink-soft" />}
                  <span className={index === breadcrumb.length - 1 ? 'text-ink font-medium' : 'text-ink-soft'}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button className="relative w-9 h-9 rounded-full bg-peach-soft flex items-center justify-center hover:bg-peach transition-colors">
                <Bell className="w-5 h-5 text-ink-soft" />
                {todayTasks > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-coral text-white text-[10px] flex items-center justify-center">
                    {todayTasks}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-r from-rose-gold-50 via-peach-soft to-peach flex items-center justify-between">
            <div>
              <div className="text-sm text-ink-soft mb-1">{formatDate()}</div>
              <div className="font-serif text-xl font-semibold text-ink">
                您好，李娜 👋
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ink-soft mb-1">今日待办</div>
              <div className="text-3xl font-bold text-rose-gold-600">
                {todayTasks}
                <span className="text-base font-medium text-ink-soft ml-1">项</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
