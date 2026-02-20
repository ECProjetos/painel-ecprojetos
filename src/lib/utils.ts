import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata "YYYY-MM-DD" para "DD/MM/YYYY" sem sofrer com timezone.
 */

export function formatISODateBR(isoDate: string) {
  if (!isoDate) return ""
  const [y, m, d] = isoDate.split("-")
  if (!y || !m || !d) return isoDate
  return `${d}/${m}/${y}`
}