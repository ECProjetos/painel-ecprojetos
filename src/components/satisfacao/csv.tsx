/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { Button } from "../ui/button"

function jsonToCsv(data: any) {
  if (!data || !data.length) return ""

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(","), // Cabeçalho
    ...data.map((row: { [x: string]: any }) =>
      headers
        .map((header) => {
          let cell = row[header]
          if (cell === null || cell === undefined) return ""
          // Escapar aspas
          if (typeof cell === "string") cell = `"${cell.replace(/"/g, '""')}"`
          return cell
        })
        .join(","),
    ),
  ]
  return csvRows.join("\n")
}

interface DownloadEnpsButtonProps {
  ano: string
  periodo: string
}

export default function DownloadEnpsButton({
  ano,
  periodo,
}: DownloadEnpsButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/enps-ativo?ano=${ano}&periodo=${encodeURIComponent(periodo)}`,
      )

      const { data } = await res.json()

      const csv = jsonToCsv(data)
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `enps/${ano}-${periodo}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert("Erro ao baixar!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading}>
      {loading ? "Baixando..." : "Baixar ENPS CSV"}
    </Button>
  )
}
