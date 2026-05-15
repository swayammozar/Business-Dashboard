export type TaskStatus = "TODO" | "DOING" | "DONE" | "BLOCKED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskCategory =
  | "SOCIAL_MEDIA"
  | "CONTENT_REELS"
  | "WEBSITE"
  | "ADS"
  | "LEGAL_GST"
  | "ORDERS"
  | "IDEAS"
  | "CALLS"
  | "OTHER";

export type Business = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  business_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  due_date: string | null;
  is_today: boolean;
  skipped_today: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type BrainDump = {
  id: string;
  user_id: string;
  business_id: string | null;
  text: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
};
