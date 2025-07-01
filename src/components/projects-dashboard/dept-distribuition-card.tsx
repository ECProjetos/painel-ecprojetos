import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function DeptDistributionChart({
  data,
}: {
  data: { name: string; hours: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart width={500} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="hours" />
        </BarChart>
      </CardContent>
    </Card>
  );
}
