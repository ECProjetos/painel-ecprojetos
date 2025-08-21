import { Card } from "@/components/ui/card"
import clsx from "clsx"

export function MinhasHorasPorProjeto({
  dados,
  titulo = "Minhas Horas por Projeto",
  cor = "blue",
}: {
  dados: Array<{
    user_id: string
    agrupamento_id: number
    tipo_agrupamento: string
    total_horas: string | number
    nome_agrupamento: string
  }>
  titulo?: string
  cor?: "blue" | "green" | "purple"
}) {
  const totalHoras = dados.reduce(
    (acc, curr) => acc + parseFloat(curr.total_horas as string),
    0,
  )

  const corClasse = {
    blue: "bg-blue-600 text-blue-600",
    green: "bg-green-600 text-green-600",
    purple: "bg-purple-600 text-purple-600",
  }

  return (
    <Card className="p-5 shadow">
      <h3 className="font-semibold mb-4">{titulo}</h3>
      {dados.map((item) => {
        const horas = parseFloat(item.total_horas as string)
        const percentual = totalHoras > 0 ? (horas / totalHoras) * 100 : 0
        const width = `${percentual.toFixed(1)}%`

        return (
          <div key={item.agrupamento_id} className="mb-4">
            <div className="flex justify-between text-sm font-medium">
              <span>{item.nome_agrupamento}</span>
                <span>{Math.floor(horas)}h {Math.round((horas % 1) * 60)}m</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded mt-2 mb-1">
              <div
                className={clsx("h-2 rounded", corClasse[cor].split(" ")[0])}
                style={{ width }}
              />
            </div>
            <p className={clsx("text-xs", corClasse[cor].split(" ")[1])}>
              {percentual.toFixed(1)}% do meu tempo
            </p>
          </div>
        )
      })}
    </Card>
  )
}
