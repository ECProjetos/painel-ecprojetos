import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function UserHoursChart({
  data,
}: {
  data: { name: string; hours: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas por Colaborador</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart layout="vertical" width={500} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Tooltip />
          <Bar dataKey="hours" />
        </BarChart>
      </CardContent>
    </Card>
  );
}
