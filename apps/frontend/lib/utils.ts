import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toSlug(input: string): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')     // non-alphanumeric -> hyphen
    .replace(/^-+|-+$/g, '');        // trim leading/trailing hyphens
  if (!slug) throw new Error('Room name needs at least one letter or number');
  return slug;
}
