export type TierType = 'high' | 'nurturing' | 'watching' | 'dormant';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  channel: string;
  budget_min: number;
  budget_max: number;
  decision_cycle: 'urgent' | 'short' | 'medium' | 'long';
  projects: string[];
  skin_tags: string[];
  contour_tags: string[];
  tier: TierType;
  deal_probability: number;
  consultant_id: string;
  created_at: string;
  last_follow_up: string | null;
  status: 'active' | 'deal' | 'lost';
  deal_amount?: number;
  deal_projects?: string[];
  deal_at?: string;
  undeal_reason?: string;
  deal_probability_breakdown?: {
    budget: number;
    urgency: number;
    projects: number;
    tags: number;
    channel: number;
  };
}

export interface FollowUpTask {
  id: string;
  customer_id: string;
  priority: 'high' | 'medium' | 'low';
  due_date: string;
  suggested_script: string;
  completed: boolean;
  completed_at?: string;
  follow_up_method?: 'wechat' | 'phone' | 'visit';
  follow_up_note?: string;
  next_follow_up?: string;
}

export interface VisitRecord {
  id: string;
  customer_id: string;
  record_type: 'consultation' | 'follow_up' | 'post_op' | 'follow_up_done';
  satisfaction: number;
  undeal_reason?: string;
  note?: string;
  created_at: string;
  follow_up_method?: 'wechat' | 'phone' | 'visit' | string;
  follow_up_note?: string;
  next_follow_up?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface Consultant {
  id: string;
  name: string;
  avatar: string;
  high_value_count: number;
  follow_up_rate: number;
  conversion_rate: number;
  total_deals: number;
  total_revenue: number;
}
