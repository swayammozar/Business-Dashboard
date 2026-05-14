import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TaskCategory, TaskPriority, TaskStatus } from "@/lib/app-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  DOING: "Doing",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const categoryLabels: Record<TaskCategory, string> = {
  SOCIAL_MEDIA: "Social Media",
  CONTENT_REELS: "Content/Reels",
  WEBSITE: "Website",
  ADS: "Ads",
  LEGAL_GST: "Legal/GST",
  ORDERS: "Orders",
  IDEAS: "Ideas",
  CALLS: "Calls",
  OTHER: "Other",
};

export const statusOptions = Object.entries(statusLabels);
export const priorityOptions = Object.entries(priorityLabels);
export const categoryOptions = Object.entries(categoryLabels);

export function formatDate(date?: Date | string | null) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function taskPriorityRank(priority: TaskPriority) {
  return priority === "HIGH" ? 0 : priority === "MEDIUM" ? 1 : 2;
}

export function isDueTodayOrOverdue(date?: Date | null) {
  if (!date) return false;
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return date <= todayEnd;
}
