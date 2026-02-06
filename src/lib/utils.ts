import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMinutesToHHMM(totalMinutes: number) {
  if (typeof totalMinutes !== "number" || Number.isNaN(totalMinutes)) return "-"

  const sign = totalMinutes < 0 ? "-" : ""
  const abs = Math.abs(Math.trunc(totalMinutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h}h ${String(m).padStart(2, "0")}m`
}
