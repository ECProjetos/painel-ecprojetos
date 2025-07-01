'use server';
import { createClient } from '@/utils/supabase/server';

export async function fetchDashboardData(startDate: string, endDate: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('vw_dashboard_allocations')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
    if (error) throw error;
    // Agregações
    const totalHours = data.reduce((sum, row) => sum + row.hours, 0);
    const activeProjects = new Set(data.map(r => r.project_id)).size;
    const deptTotals = data.reduce((acc, r) => { acc[r.department_name] = (acc[r.department_name] || 0) + r.hours; return acc; }, {} as Record<string, number>);
    const topDepartment = Object.entries(deptTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const activityTotals = data.reduce((acc, r) => { acc[r.activity_name] = (acc[r.activity_name] || 0) + r.hours; return acc; }, {} as Record<string, number>);
    const topActivity = Object.entries(activityTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const hoursByProject = Object.entries(
        data.reduce((acc, r) => { acc[r.project_name] = (acc[r.project_name] || 0) + r.hours; return acc; }, {} as Record<string, number>)
    ).map(([name, hours]) => ({ name, hours }));
    const hoursByUser = Object.entries(
        data.reduce((acc, r) => { acc[r.user_name] = (acc[r.user_name] || 0) + r.hours; return acc; }, {} as Record<string, number>)
    ).map(([name, hours]) => ({ name, hours }));
    const hoursByDepartment = Object.entries(deptTotals).map(([name, hours]) => ({ name, hours }));
    return { totalHours, activeProjects, topDepartment, topActivity, hoursByProject, hoursByUser, hoursByDepartment };
}