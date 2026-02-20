import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

<<<<<<< HEAD
/**
 * Formata "YYYY-MM-DD" para "DD/MM/YYYY" sem sofrer com timezone.
 */

export function formatISODateBR(isoDate: string) {
  if (!isoDate) return ""
  const [y, m, d] = isoDate.split("-")
  if (!y || !m || !d) return isoDate
  return `${d}/${m}/${y}`
}
=======
export function formatMinutesToHHMM(totalMinutes: number) {
  if (typeof totalMinutes !== "number" || Number.isNaN(totalMinutes)) return "-"

  const sign = totalMinutes < 0 ? "-" : ""
  const abs = Math.abs(Math.trunc(totalMinutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h}h ${String(m).padStart(2, "0")}m`
}
>>>>>>> c56355624a57bdb0043e872f3ed7fec6718bd266
