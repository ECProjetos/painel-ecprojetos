"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  timeEntryFormSchema,
  TimeEntryFormValues,
} from "@/types/time-sheet/time-entrys-alocation";
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

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

import { useEffect, useState } from "react";
import { AtividadeView } from "@/types/activity-hierarchy/atividades";
import { Project } from "@/types/projects";
import { fetchProjects } from "@/app/actions/fetchProjects";
import { fetchAtividades } from "@/app/actions/fetchAtividades";
import { sendTimeEntry } from "@/app/actions/time-sheet/send-time-entry";
import { toast } from "sonner";

export default function PontoForm() {
  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      entry_date: "",
      period: 1,
      entry_time: "",
      exit_time: "",
      allocations: [{ project_id: 0, activity_id: 0, hours: 0, comment: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "allocations",
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [atividades, setAtividades] = useState<AtividadeView[]>([]);

  useEffect(() => {
    async function loadData() {
      const [projs, atvs] = await Promise.all([
        fetchProjects(),
        fetchAtividades(),
      ]);
      setProjects(projs);
      setAtividades(
        atvs.map((a) => ({
          status: a.status,
          id: a.id,
          name: a.name,
          macroprocesso_id: 0,
          processo_id: 0,
          macroprocesso_nome: a.department_name,
          processo_nome: "",
          description: a.description,
          sub_processo_id: undefined,
          sub_processo_nome: undefined,
        }))
      );
    }
    loadData();
  }, []);

  const onSubmit = async (data: TimeEntryFormValues) => {
    const result = await sendTimeEntry(data);
    if (result.success) {
      form.reset();
      toast.success("Ponto registrado com sucesso!");
    } else {
      toast.error("Erro ao registrar ponto: " + result.error, {
        description: "Verifique os dados e tente novamente.",
      });
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Data e período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="entry_date"
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
                      placeholder="1, 2 ou 3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Horário de entrada e saída */}
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
            {fields.map((fieldItem, index) => (
              <AllocationItem
                key={fieldItem.id}
                index={index}
                remove={() => remove(index)}
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
            Registrar Ponto
          </Button>
        </form>
      </Form>
    </div>
  );
}

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
        {/* -- Projeto */}
        <FormField
          control={form.control}
          name={`allocations.${index}.project_id`}
          render={({ field }) => {
            const selected = projects.find((p) => p.id === field.value);
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
                        {/* span com truncate */}
                        <span className="block truncate">
                          {selected?.name ?? "Selecione"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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

        {/* -- Atividade */}
        <FormField
          control={form.control}
          name={`allocations.${index}.activity_id`}
          render={({ field }) => {
            const selected = atividades.find((a) => a.id === field.value);
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
                        {/* truncate aqui também */}
                        <span className="block truncate">
                          {selected?.name ?? "Selecione"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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

        {/* -- Horas */}
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
                  // converte string pra número no onChange
                  value={field.value?.toString() ?? ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    field.onChange(isNaN(val) ? 0 : val);
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
              <Textarea {...field} placeholder="Comentário opcional" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end">
        <Button type="button" variant="destructive" onClick={remove}>
          Remover
        </Button>
      </div>
    </div>
  );
}
