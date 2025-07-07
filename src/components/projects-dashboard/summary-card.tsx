import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Layers, Users } from "lucide-react";

interface SummaryProps {
  totalHours: number;
  activeProjects: number;
  topDepartment: string;
  topActivity: string;
}

export function SummaryCards({
  totalHours,
  activeProjects,
  topDepartment,
  topActivity,
}: SummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Horas Totais</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-2xl font-bold">{totalHours.toFixed(1)}</span>
          <Clock />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Projetos Ativos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-2xl font-bold">{activeProjects}</span>
          <Layers />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Equipe Mais Alocada</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xl">{topDepartment}</span>
          <Users />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Atividade Mais Demandada</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xl">{topActivity}</span>
          <Clock />
        </CardContent>
      </Card>
    </div>
  );
}
