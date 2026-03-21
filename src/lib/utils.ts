import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateProject(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), 'dd-MM-yyyy');
  } catch (e) {
    return dateStr;
  }
}
