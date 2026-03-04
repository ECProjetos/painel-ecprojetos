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

export function formatMinutesToHHMM(minutesValue: number) {
  if (minutesValue === null || minutesValue === undefined) return "0h 00m"

  const totalMinutes = Math.round(Number(minutesValue)) // aqui elimina 55.200000000000045
  const isNegative = totalMinutes < 0

  const abs = Math.abs(totalMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60

  const sign = isNegative ? "-" : ""
  return `${sign}${hours}h ${String(minutes).padStart(2, "0")}m`
}