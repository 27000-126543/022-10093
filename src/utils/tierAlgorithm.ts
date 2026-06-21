import type { Customer, TierType } from '@/types';

export function budgetScore(min: number, max: number): number {
  let score = 0;

  const avgBudget = (min + max) / 2;
  if (avgBudget >= 100000) score = 30;
  else if (avgBudget >= 50000) score = 25;
  else if (avgBudget >= 30000) score = 20;
  else if (avgBudget >= 10000) score = 15;
  else if (avgBudget >= 5000) score = 10;
  else if (avgBudget >= 1000) score = 5;
  else score = 0;

  if (min > 0 && max > min) {
    score += 3;
  }

  return Math.min(score, 30);
}

export function urgencyScore(cycle: string): number {
  const scores: Record<string, number> = {
    urgent: 25,
    short: 18,
    medium: 10,
    long: 3,
  };
  return scores[cycle] ?? 0;
}

export function projectScore(projects: string[]): number {
  return Math.min(projects.length * 5, 20);
}

export function tagScore(skin: string[], contour: string[]): number {
  const totalTags = skin.length + contour.length;
  return Math.min(totalTags * 2, 15);
}

export function channelScore(channel: string): number {
  const highQualityChannels = ['朋友介绍', '小红书'];
  const mediumQualityChannels = ['抖音', '美团', '大众点评', '微博'];
  const lowQualityChannels = ['地推'];
  const neutralChannels = ['自然到店'];

  if (highQualityChannels.includes(channel)) return 10;
  if (mediumQualityChannels.includes(channel)) return 7;
  if (neutralChannels.includes(channel)) return 5;
  if (lowQualityChannels.includes(channel)) return 2;
  return 5;
}

export function calculateDealProbability(customer: {
  budget_min: number;
  budget_max: number;
  decision_cycle: string;
  projects: string[];
  skin_tags: string[];
  contour_tags: string[];
  channel: string;
}): {
  total: number;
  breakdown: {
    budget: number;
    urgency: number;
    projects: number;
    tags: number;
    channel: number;
  };
} {
  const budget = budgetScore(customer.budget_min, customer.budget_max);
  const urgency = urgencyScore(customer.decision_cycle);
  const projects = projectScore(customer.projects || []);
  const tags = tagScore(customer.skin_tags || [], customer.contour_tags || []);
  const channel = channelScore(customer.channel);

  const total = Math.min(budget + urgency + projects + tags + channel, 100);

  return {
    total,
    breakdown: { budget, urgency, projects, tags, channel },
  };
}

export function assignTier(
  prob: number,
  lastFollowDays: number
): TierType {
  if (prob >= 70) return 'high';
  if (prob >= 45) return 'nurturing';
  if (prob >= 20) return 'watching';
  if (lastFollowDays > 30) return 'dormant';
  return 'watching';
}

export function daysSince(dateStr: string): number {
  if (!dateStr) return 999;
  const today = new Date();
  const date = new Date(dateStr);
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function generateScriptSuggestion(customer: Customer): string {
  const { tier, name, budget_min, budget_max, projects, skin_tags, contour_tags, channel } = customer;

  const greetings = ['您好', '亲爱的', '尊敬的'];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  let opening = '';
  if (tier === 'high') {
    opening = `${greeting}${name}，很高兴上次与您的沟通！为了给您安排最合适的方案，`;
  } else if (tier === 'nurturing') {
    opening = `${greeting}${name}，上次到店后不知道您考虑得怎么样了？`;
  } else if (tier === 'watching') {
    opening = `${greeting}${name}，最近好吗？记得您之前对我们的项目比较感兴趣，`;
  } else {
    opening = `${greeting}${name}，好久不见！最近有没有关注医美方面的新资讯呢？`;
  }

  let budgetHint = '';
  const avgBudget = (budget_min + budget_max) / 2;
  if (avgBudget >= 50000) {
    budgetHint = '针对您的预算范围，我们有几位资深专家和高端方案特别推荐给您';
  } else if (avgBudget >= 10000) {
    budgetHint = '我们正好有性价比很高的精选方案，非常适合您的预算';
  } else if (avgBudget > 0) {
    budgetHint = '我们近期有非常优惠的活动，一定能让您满意';
  }

  let concernHint = '';
  const allTags = [...skin_tags, ...contour_tags];
  if (allTags.length > 0) {
    const mainConcern = allTags[0];
    concernHint = `尤其是您关注的${mainConcern}问题，我们最新引进的技术效果非常好`;
  }

  let projectHint = '';
  if (projects.length > 0) {
    const mainProject = projects[0];
    projectHint = `关于${mainProject}，我们有几个真实案例想分享给您参考`;
  }

  let channelHint = '';
  if (channel === '朋友介绍') {
    channelHint = '感谢您朋友的推荐，我们一定会给您最贴心的服务体验';
  } else if (channel === '小红书') {
    channelHint = '看到您从小红书了解到我们，我们确实有很多达人推荐的热门项目';
  }

  let closing = '';
  if (tier === 'high') {
    closing = '您看明天或后天什么时候方便来店里详细了解一下？我帮您预留专家号。';
  } else if (tier === 'nurturing') {
    closing = '您看这周什么时候有空来店里再体验一下？有任何问题随时问我哦。';
  } else if (tier === 'watching') {
    closing = '有时间可以来店里坐坐，喝杯茶聊聊，不着急做决定。';
  } else {
    closing = '如果您有兴趣，随时欢迎来店里免费咨询体验哦。';
  }

  const parts = [opening];
  if (budgetHint) parts.push(budgetHint + '，');
  if (concernHint) parts.push(concernHint + '，');
  if (projectHint) parts.push(projectHint + '，');
  if (channelHint) parts.push(channelHint + '。');
  parts.push(closing);

  return parts.join('');
}
