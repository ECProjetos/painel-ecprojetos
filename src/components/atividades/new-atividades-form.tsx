'use client';

import {  useActionState, useEffect, useState } from "react"
import { Processo, processosSchema } from "@/types/activity-hierarchy/processo";
import { getProcessos } from "@/app/actions/activity-hierarchy/processos";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { getSubProcessos } from "@/app/actions/activity-hierarchy/subprocesso";
import { SubProcesso, subProcessosSchema } from "@/types/activity-hierarchy/sub-processo";
import { getAllDepartments } from "@/app/actions/get-departamentos";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createAtividade } from "@/app/actions/atividades";

interface DepartamentsType {
  name: string,
  id:string
}

export default function NewAtividadeForm(){
  const[processos, setProcessos] = useState<Processo[]>([]);
  const[subprocessos, setSubProcessos] = useState<SubProcesso[]>([]);
  const[departamentos, setDepartamentos] = useState<DepartamentsType[]>([]);
  const [formState, formAction] = useActionState(createAtividade, { success: false, message: "" })


  useEffect(() => {
    async function fetchMacroprocessos() {
      const result = await getProcessos();
      const parsedResult = processosSchema.safeParse(result);
      if (parsedResult.success) {
        setProcessos(Array.isArray(parsedResult.data) ? parsedResult.data : [parsedResult.data]);
      } else {
        setProcessos([]);
      }
    }
    fetchMacroprocessos();
  }, []);

  useEffect(() => {
    async function fetchMacroprocessos() {
      const result = await getSubProcessos();
      const parsedResult = subProcessosSchema.safeParse(result);
      console.log("SEM PARSE", result)
      console.log("COM PARSE", parsedResult)
      if (parsedResult.success) {
        setSubProcessos(Array.isArray(parsedResult.data) ? parsedResult.data : [parsedResult.data]);
      } else {
        setSubProcessos([]);
      }
    }
    fetchMacroprocessos();
  }, []);

  useEffect(() => {
    async function fetchDepartamentos() {
      const result = await getAllDepartments();
      setDepartamentos(result);
    }
    fetchDepartamentos();
  }, []);


      return(
       <Card className="flex flex-col items-center justify-center gap-4 w-full max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <form action={formAction}>
        <h1 className="mb-5 text-2xl font-bold">Nova atividade</h1>

        <div className="w-full flex flex-col gap-4">
          <Label htmlFor="nome" className="text-xl">Nome</Label>
          <Input id="nome" name="nome" required />

          <Label htmlFor="processo" className="text-xl">Processo</Label>
            <select name="processo" id="processo" className="w-full border p-2 rounded">
            <option value="">Selecione um processo</option>
            {processos.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
            </select>

          <Label htmlFor="subprocesso" className="text-xl">Subprocesso</Label>
          <select name="subprocesso" id="subprocesso" className="w-full border p-2 rounded">
            <option value="">Selecione um subprocesso</option>
            {subprocessos.map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>

          <Label className="text-xl mt-4">Departamentos</Label>
          <div className="flex flex-col gap-3">
            {departamentos.map(dep => (
              <label key={dep.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="departamentos"
                  value={dep.id}
                  className="w-4 h-4 text-primary"
                />
                <span>{dep.name}</span>
              </label>
            ))}
          </div>

          <Button type="submit" className="mt-6">Criar Atividade</Button>

          {formState.message && (
            <p className={`mt-2 text-sm ${formState.success ? 'text-green-600' : 'text-red-600'}`}>
              {formState.message}
            </p>
          )}
        </div>
      </form>
    </Card>
  )
}