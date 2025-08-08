import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Make a string safe for use as a filename and Cloudinary fl_attachment value
export function sanitizeFileName(input: string): string {
  const base = (input || 'image').toLowerCase();
  const ascii = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  const cleaned = ascii
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[_.-]+|[_.-]+$/g, '');
  return cleaned || 'image';
}
