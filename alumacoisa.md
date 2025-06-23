A seguir uma sugestão completa de como encaixar a funcionalidade de **Alocação de Horas** no seu projeto Next.js/App-Router usando Supabase, o mesmo estilo de “server-actions” que vocês já usam em `clock-controller.ts`, e os componentes Radix/UI que vocês já têm.

---

## 1. Definir o tipo e schema de validação

Crie um arquivo para o Zod-schema do formulário:

```bash
mkdir -p src/types/time-sheet
```

```ts
// src/types/time-sheet/new-time-allocation.ts
import { z } from "zod";

export const newTimeAllocationSchema = z.object({
  project_id:      z.string().nonempty("Selecione um projeto"),
  activity_id:     z.string().nonempty("Selecione uma atividade"),
  allocation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  hours:           z
                     .number({ invalid_type_error: "Horas deve ser número" })
                     .min(0.25, "Insira pelo menos 0.25h"),
  comment:         z.string().optional(),
});

export type NewTimeAllocation = z.infer<typeof newTimeAllocationSchema>;
```

---

## 2. Criar o controller de server-actions

```ts
// src/app/actions/time-sheet/allocation-controller.ts
"use server";

import { revalidatePath }         from "next/cache";
import { createClient }           from "@/utils/supabase/server";
import { NewTimeAllocation }      from "@/types/time-sheet/new-time-allocation";

type Summary = { total_allocated: number; daily_target: number };

// 1) resumo diário
export async function getAllocationSummary(
  userId: string,
  allocationDate: string
): Promise<Summary> {
  const supabase = await createClient();

  // total alocado no dia
  const { data: sumData, error: sumErr } = await supabase
    .from("time_allocations")
    .select("hours", { count: "exact" })
    .eq("user_id", userId)
    .eq("allocation_date", allocationDate);

  if (sumErr) throw new Error(sumErr.message);
  const total_allocated = sumData?.reduce((acc, r) => acc + Number(r.hours), 0) ?? 0;

  // meta diária do usuário
  const { data: users, error: usrErr } = await supabase
    .from("users")
    .select("working_hours_per_day")
    .eq("id", userId)
    .single();

  if (usrErr || !users) throw new Error(usrErr?.message ?? "Usuário não encontrado");
  const daily_target = users.working_hours_per_day;

  return { total_allocated, daily_target };
}

// 2) projetos do usuário (considerando user_departments)
export async function getUserProjects(userId: string) {
  const supabase = await createClient();

  // busca departamentos
  const { data: deps, error: depErr } = await supabase
    .from("user_departments")
    .select("department_id")
    .eq("user_id", userId);

  if (depErr) throw new Error(depErr.message);
  const deptIds = deps?.map((d) => d.department_id) ?? [];

  // busca projetos ativos nesses deps
  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select("id, name, department_id")
    .in("department_id", deptIds)
    .eq("status", "ativo");

  if (projErr) throw new Error(projErr.message);
  return projects ?? [];
}

// 3) atividades de um projeto (filtrado pelo mesmo department_id)
export async function getProjectActivities(departmentId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("id, name")
    .eq("department_id", departmentId)
    .eq("departament_id", "8") // 8 é a id de todos os departamentos
    .eq("status", "ativo");

  if (error) throw new Error(error.message);
  return data ?? [];
}

// 4) inserir nova alocação
export async function createTimeAllocation(
  userId: string,
  allocation: NewTimeAllocation
) {
  const supabase = await createClient();

  const payload = {
    user_id:         userId,
    project_id:      Number(allocation.project_id),
    activity_id:     Number(allocation.activity_id),
    allocation_date: allocation.allocation_date,
    hours:           allocation.hours,
    comment:         allocation.comment,
  };

  const { error } = await supabase
    .from("time_allocations")
    .insert([payload]);

  if (error) throw new Error(error.message);

  // revalida a rota pra atualizar o resumo
  revalidatePath("/controle-horarios/alocar-horas");
}
```

---

## 3. Página de Alocar Horas

Substitua o placeholder em
**`src/app/(private)/controle-horarios/alocar-horas/page.tsx`**
por:

```tsx
"use client";

import { useState, useEffect }        from "react";
import { useForm }                     from "react-hook-form";
import { zodResolver }                 from "@hookform/resolvers/zod";
import { useUserStore }                from "@/stores/userStore";

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

import { newTimeAllocationSchema, NewTimeAllocation } 
  from "@/types/time-sheet/new-time-allocation";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } 
  from "@/components/ui/select";

import { Input }     from "@/components/ui/input";
import { Textarea }  from "@/components/ui/textarea";
import { Button }    from "@/components/ui/button";

export default function AlocarHorasPage() {
  const user = useUserStore((state) => state.user);
  const today = new Date().toISOString().slice(0, 10);

  // resumo diário
  const [summary, setSummary] = useState({ total_allocated: 0, daily_target: 8 });
  // listas de opções
  const [projects, setProjects]   = useState<{ id: number; name: string; department_id: number }[]>([]);
  const [activities, setActivities] = useState<{ id: number; name: string }[]>([]);

  const form = useForm<NewTimeAllocation>({
    resolver: zodResolver(newTimeAllocationSchema),
    defaultValues: {
      project_id:      "",
      activity_id:     "",
      allocation_date: today,
      hours:           0,
      comment:         "",
    },
  });

  // busca resumo e projetos quando data ou usuário mudar
  useEffect(() => {
    if (!user) return;
    getAllocationSummary(user.id, form.getValues("allocation_date")).then(setSummary);
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

  const pct = Math.floor((summary.total_allocated / summary.daily_target) * 100);

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-4">

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
                  <Input type="number" step="0.25" min="0" {...field} />
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
```

---

### O que rolou aqui

1. **Tipos e validação**

   * Criamos um Zod-schema em `src/types/time-sheet/new-time-allocation.ts`.

2. **Server-actions**

   * Em `allocation-controller.ts` temos:

     * `getAllocationSummary` → soma de horas + meta do usuário.
     * `getUserProjects` → filtra projetos pelos departamentos do usuário.
     * `getProjectActivities` → filtra atividades pelo `department_id`.
     * `createTimeAllocation` → insere no Supabase e revalida a rota para atualizar o resumo automaticamente.

3. **Página React/Client**

   * Transformamos `page.tsx` em um **client component** (`"use client";`).
   * Usamos **React-Hook-Form** + **Zod** para validação inline e feedback de erros.
   * Chamamos nossas server-actions (importadas) nos `useEffect`s e no `onSubmit`.
   * Reaproveitamos os componentes Radix/UI (`Select`, `Input`, `Textarea`, `Button`, `Form*`) para manter o padrão de UI do projeto.
   * Implementamos a barra de progresso com Tailwind para ficar igual ao mock.

Com isso você terá a **tela de Alocação de Horas** funcionando 100% integrada à sua modelagem de banco e ao fluxo de Supabase que já existe no seu sistema. Qualquer ajuste de rota ou permissão basta adaptar os parâmetros de `revalidatePath` ou as policies do Supabase.
