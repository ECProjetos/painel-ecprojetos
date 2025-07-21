// app/components/PontoForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  TimeEntryFormValues,
  timeEntryFormSchema,
} from "@/types/time-sheet/time-entrys-alocation";
import { Project } from "@/types/projects";
import { AtividadeView } from "@/types/activity-hierarchy/atividades";
import { fetchProjects } from "@/app/actions/fetchProjects";
import { fetchAtividades } from "@/app/actions/fetchAtividades";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

interface PontoFormProps {
  /** Se informado, popula o form para edição */
  initialData?: TimeEntryFormValues;
  /** Função a ser chamada no submit (criar ou atualizar) */
  onSubmit: (data: TimeEntryFormValues) => Promise<void>;
}

export default function PontoForm({
  initialData,
  onSubmit,
}: PontoFormProps) {
  // 1. Data de hoje yyyy-MM-dd
  const today = new Date().toISOString().split("T")[0];

  // 2. Configura RHF com defaults ou initialData
  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues:
      initialData ?? {
        entry_date: today,
        period: 1,
        entry_time: "",
        exit_time: "",
        allocations: [
          { project_id: 0, activity_id: 0, hours: 0, comment: "" },
        ],
      },
  });

  // Se initialData mudar, reseta o form
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "allocations",
  });

  // 3. Busca projetos e atividades
  const [projects, setProjects] = useState<Project[]>([]);
  const [atividades, setAtividades] = useState<AtividadeView[]>([]);

  useEffect(() => {
    fetchProjects().then(setProjects);
    fetchAtividades().then((atvs) =>
      setAtividades(
        atvs.map((a) => ({
          ...a,
          // adaptações do seu mapping
          macroprocesso_id: 0,
          processo_id: 0,
          macroprocesso_nome: a.department_name,
          processo_nome: "",
          sub_processo_id: undefined,
          sub_processo_nome: undefined,
        }))
      )
    );
  }, []);

  // 4. Submit handler
  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data (fixa) */}
        <FormField
          control={form.control}
          name="entry_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  disabled
                  {...field}
                  className="cursor-not-allowed bg-gray-100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Período */}
        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Período</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Horários de Entrada/Saída */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entry_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Entrada</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exit_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Saída</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Alocações */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Alocações</h3>
          {fields.map((fieldItem, idx) => (
            <AllocationItem
              key={fieldItem.id}
              index={idx}
              remove={() => remove(idx)}
              form={form}
              projects={projects}
              atividades={atividades}
            />
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              append({ project_id: 0, activity_id: 0, hours: 0, comment: "" })
            }
          >
            Adicionar Alocação
          </Button>
        </div>

        <Button type="submit" className="w-full mt-6">
          {initialData ? "Atualizar Ponto" : "Registrar Ponto"}
        </Button>
      </form>
    </Form>
  );
}

/** Componente interno para cada linha de alocação */
function AllocationItem({
  index,
  remove,
  form,
  projects,
  atividades,
}: {
  index: number;
  remove: () => void;
  form: ReturnType<typeof useForm<TimeEntryFormValues>>;
  projects: Project[];
  atividades: AtividadeView[];
}) {
  const [openProj, setOpenProj] = useState(false);
  const [openAtv, setOpenAtv] = useState(false);

  return (
    <div className="p-4 border rounded space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Projeto */}
        <FormField
          control={form.control}
          name={`allocations.${index}.project_id`}
          render={({ field }) => {
            const sel = projects.find((p) => p.id === field.value);
            return (
              <FormItem>
                <FormLabel>Projeto</FormLabel>
                <FormControl>
                  <Popover open={openProj} onOpenChange={setOpenProj}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span className="block truncate">
                          {sel?.name ?? "Selecione"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar projeto..." />
                        <CommandEmpty>Nenhum projeto.</CommandEmpty>
                        <CommandGroup>
                          {projects.map((proj) => (
                            <CommandItem
                              key={proj.id}
                              value={proj.id.toString()}
                              onSelect={(val) => {
                                field.onChange(Number(val));
                                setOpenProj(false);
                              }}
                            >
                              {proj.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Atividade */}
        <FormField
          control={form.control}
          name={`allocations.${index}.activity_id`}
          render={({ field }) => {
            const sel = atividades.find((a) => a.id === field.value);
            return (
              <FormItem>
                <FormLabel>Atividade</FormLabel>
                <FormControl>
                  <Popover open={openAtv} onOpenChange={setOpenAtv}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span className="block truncate">
                          {sel?.name ?? "Selecione"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar atividade..." />
                        <CommandEmpty>Nenhuma atividade.</CommandEmpty>
                        <CommandGroup>
                          {atividades.map((ativ) => (
                            <CommandItem
                              key={ativ.id}
                              value={ativ.id.toString()}
                              onSelect={(val) => {
                                field.onChange(Number(val));
                                setOpenAtv(false);
                              }}
                            >
                              {ativ.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Horas */}
        <FormField
          control={form.control}
          name={`allocations.${index}.hours`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horas</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  value={field.value?.toString() ?? ""}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    field.onChange(isNaN(num) ? 0 : num);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Comentário */}
      <FormField
        control={form.control}
        name={`allocations.${index}.comment`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Comentário</FormLabel>
            <FormControl>
              <Textarea placeholder="Opcional" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="destructive"
          onClick={remove}
        >
          Remover
        </Button>
      </div>
    </div>
  );
}
