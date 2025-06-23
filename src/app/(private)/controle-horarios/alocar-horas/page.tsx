"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserStore } from "@/stores/userStore";

import {
  getAllocationSummary,
  getUserProjects,
  getProjectActivities,
  createTimeAllocation,
} from "@/app/actions/time-sheet/allocation-controller";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import {
  newTimeAllocationSchema,
  NewTimeAllocation,
} from "@/types/time-sheet/time-allocation";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AlocarHorasPage() {
  const user = useUserStore((state) => state.user);
  const today = new Date().toISOString().slice(0, 10);

  // resumo diário
  const [summary, setSummary] = useState({
    total_allocated: 0,
    daily_target: 8,
  });
  // listas de opções
  const [projects, setProjects] = useState<
    { id: number; name: string; department_id: number }[]
  >([]);
  const [activities, setActivities] = useState<{ id: number; name: string }[]>(
    []
  );

  const form = useForm<NewTimeAllocation>({
    resolver: zodResolver(newTimeAllocationSchema),
    defaultValues: {
      project_id: "",
      activity_id: "",
      allocation_date: today,
      hours: 0,
      comment: "",
    },
  });

  // busca resumo e projetos quando data ou usuário mudar
  useEffect(() => {
    if (!user) return;
    getAllocationSummary(user.id, form.getValues("allocation_date")).then(
      setSummary
    );
    getUserProjects(user.id).then(setProjects);
  }, [user, form.watch("allocation_date")]);

  // busca atividades ao escolher projeto
  useEffect(() => {
    const pid = Number(form.getValues("project_id"));
    if (!pid) return;
    const deptId = projects.find((p) => p.id === pid)?.department_id;
    if (!deptId) return;
    getProjectActivities(deptId).then(setActivities);
  }, [form.watch("project_id"), projects]);

  // submissão
  async function onSubmit(data: NewTimeAllocation) {
    if (!user) return;
    await createTimeAllocation(user.id, data);
    form.reset({ ...data, hours: 0, comment: "" });
    const sum = await getAllocationSummary(user.id, data.allocation_date);
    setSummary(sum);
  }

  const pct = Math.floor(
    (summary.total_allocated / summary.daily_target) * 100
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* → resumo diário */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Horas Alocadas</span>
          <span className="text-sm text-gray-600">
            {summary.total_allocated}h de {summary.daily_target}h
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded">
          <div
            className="h-3 bg-blue-600 rounded"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-right text-blue-600 font-semibold mt-1">
          {pct}% Alocado
        </p>
      </div>

      {/* → form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-white rounded-lg shadow p-6 space-y-4"
        >
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="activity_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Atividade</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allocation_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comentário / Justificativa</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">+ Alocar Horas</Button>
        </form>
      </Form>
    </div>
  );
}
