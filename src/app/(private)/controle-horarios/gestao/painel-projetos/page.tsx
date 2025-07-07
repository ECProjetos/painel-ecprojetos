// src/app/dashboard/DashboardClient.tsx
"use client";
import { useState, useEffect } from "react";
import { fetchDashboardData } from "@/app/actions/time-sheet/project-dash";
import { SummaryCards } from "@/components/projects-dashboard/summary-card";
import { ProjectHoursChart } from "@/components/projects-dashboard/project-horus-chart";
import { UserHoursChart } from "@/components/projects-dashboard/user-hours-chart";
import { DeptDistributionChart } from "@/components/projects-dashboard/dept-distribuition-card";

export default function PainelProjetosPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetchDashboardData("2025-06-01", "2025-06-30").then(setData);
  }, []);
  if (!data) return <div>Carregando...</div>;
  return (
    <div className="space-y-8">
      <SummaryCards
        totalHours={data.totalHours}
        activeProjects={data.activeProjects}
        topDepartment={data.topDepartment}
        topActivity={data.topActivity}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectHoursChart data={data.hoursByProject} />
        <UserHoursChart data={data.hoursByUser} />
      </div>
      <DeptDistributionChart data={data.hoursByDepartment} />
    </div>
  );
}
