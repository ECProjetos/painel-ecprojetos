import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface DataPoint {
  name: string
  hours: number
}

type ProjectHoursChartProps = {
  data: DataPoint[]
}

export function ProjectHoursChart({ data }: ProjectHoursChartProps) {
  const sortedData = [...data].sort((a, b) => b.hours - a.hours)

  const rowHeight = 42
  const chartHeight = Math.max(sortedData.length * rowHeight, 320)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top projetos por horas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Projetos com maior volume de esforço acumulado
        </p>
      </CardHeader>

      <CardContent>
        <div className="h-[420px] overflow-y-auto pr-2">
          <div style={{ height: chartHeight, minWidth: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 8, right: 20, left: 20, bottom: 8 }}
                barCategoryGap={10}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}h`, "Horas"]}
                  cursor={{ opacity: 0.15 }}
                />
                <Bar
                  dataKey="hours"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}