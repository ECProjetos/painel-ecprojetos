export function formatISODateToBR(input: string | null | undefined): string {
  if (!input) return ""
  const dateStr = String(input).split("T")[0] // get date part
  const [y, m, d] = dateStr.split("-")
  if (!y || !m || !d) return dateStr
  return `${d}/${m}/${y}`
}
