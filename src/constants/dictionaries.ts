import type { TierType } from '../types';

export const CHANNELS: string[] = [
  '抖音',
  '小红书',
  '朋友介绍',
  '地推',
  '自然到店',
  '美团',
  '大众点评',
  '微博',
];

export const PROJECTS: string[] = [
  '玻尿酸填充',
  '瘦脸针',
  '热玛吉',
  '光子嫩肤',
  '双眼皮',
  '隆鼻',
  '下颌线提升',
  '祛斑',
  '祛痘',
  '水光针',
  '线雕',
  '脂肪填充',
];

export interface DecisionCycleOption {
  value: string;
  label: string;
  days: number;
}

export const DECISION_CYCLES: DecisionCycleOption[] = [
  { value: 'urgent', label: '1周内', days: 7 },
  { value: 'short', label: '1个月内', days: 30 },
  { value: 'medium', label: '3个月内', days: 90 },
  { value: 'long', label: '半年以上', days: 180 },
];

export const SKIN_TAGS: string[] = [
  '色斑',
  '痘痘',
  '敏感',
  '松弛',
  '暗沉',
  '毛孔粗大',
  '红血丝',
  '细纹',
  '痘印',
  '肤色不均',
];

export const CONTOUR_TAGS: string[] = [
  '瘦脸',
  '隆鼻',
  '双眼皮',
  '下巴',
  '苹果肌',
  '太阳穴',
  '法令纹',
  '下颌线',
  '额头',
  '唇形',
];

export const UNDEAL_REASONS: string[] = [
  '价格敏感',
  '效果顾虑',
  '家人反对',
  '对比别家',
  '暂无预算',
  '怕疼/怕风险',
  '距离远',
  '等待活动',
];

export interface TierConfigItem {
  label: string;
  color: string;
  bgColor: string;
  followDays: number;
}

export type TierConfig = Record<TierType, TierConfigItem>;

export const TIER_CONFIG: TierConfig = {
  high: {
    label: '高意向',
    color: '#FF6B6B',
    bgColor: '#FFE8E8',
    followDays: 1,
  },
  nurturing: {
    label: '培育中',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    followDays: 3,
  },
  watching: {
    label: '观望',
    color: '#EAB308',
    bgColor: '#FEF9C3',
    followDays: 7,
  },
  dormant: {
    label: '沉睡',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
    followDays: 30,
  },
};

export type ScriptTemplates = Record<TierType, string>;

export const SCRIPT_TEMPLATES: ScriptTemplates = {
  high: '您好{name}，您关注的{project}项目目前有限时优惠活动，本月内到店可享8折特惠，名额仅剩最后5个！另外我们特邀{expert}专家亲自坐诊，机会非常难得，建议您尽快预约到店，我帮您锁定优惠名额哦~',
  nurturing: '您好{name}，上次和您聊到{project}项目，我特意整理了几位和您情况类似的客户案例，效果都非常满意。这周我们有免费面诊活动，您可以过来和专家深入沟通一下方案，看看是否符合您的预期，没有任何压力的~',
  watching: '您好{name}，分享一篇关于{project}的科普文章给您，里面详细介绍了手术过程、恢复期和注意事项，希望能帮助您更好地了解。如果您有任何疑问，随时可以问我，我会耐心为您解答~',
  dormant: '您好{name}，好久没联系了，最近还好吗？我们店刚推出了新的优惠活动，想特意通知您一下。如果您还有变美的计划，欢迎随时回来找我，我给您安排最适合的方案和最优惠的价格~',
};
