// components/MarcarPonto.tsx
"use client";

import { useTransition } from "react";
import { Pause, Play } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import clsx from "clsx";
import { marcarPonto } from "@/app/actions/time-sheet/clock-controller";

interface MarcarPontoProps {
  userId: string;
}

export function MarcarPonto({ userId }: MarcarPontoProps) {
  const [isPending, startTransition] = useTransition();

  // define apenas período e se é entrada ou saída
  const registros = [
    { period: 1, isEntry: true },
    { period: 2, isEntry: true },
    { period: 3, isEntry: true },
    { period: 1, isEntry: false },
    { period: 2, isEntry: false },
    { period: 3, isEntry: false },
  ] as const;

  return (
    <div className="flex flex-col space-y-4 p-4 bg-white shadow rounded border border-zinc-200">
      <h2 className="text-lg font-semibold">Marcar Ponto</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {registros.map(({ period, isEntry }) => {
          const Icon = isEntry ? Play : Pause;
          const label = `${isEntry ? "Entrada" : "Saída"} ${period}° Período`;
          const fieldName = isEntry ? "entry_time" : "exit_time";

          const borderCls = isEntry ? "border-green-600" : "border-red-600";
          const textCls = isEntry ? "text-green-600" : "text-red-600";
          const bgCls = isEntry ? "bg-green-600" : "bg-red-600";
          const hovCls = isEntry ? "hover:bg-green-700" : "hover:bg-red-700";

          return (
            <form
              key={`${isEntry ? "in" : "out"}-${period}`}
              action={async (formData: FormData) => {
                const entry_time = formData.get("entry_time") as string | null;
                const exit_time = formData.get("exit_time") as string | null;
                await marcarPonto({
                  userId,
                  period,
                  entry_time: entry_time ?? undefined,
                  exit_time: exit_time ?? undefined,
                });
              }}
              method="post"
              className={clsx(
                "flex flex-col items-center justify-center p-4 rounded-lg border border-solid",
                borderCls
              )}
              onSubmit={() => startTransition(() => {})}
            >
              {/* hidden inputs pra action receber userId e period */}
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="period" value={period} />

              <Icon className={clsx(textCls, "w-8 h-8 mb-2")} />
              <span className="font-regular">{label}</span>

              <Input
                type="time"
                name={fieldName}
                className="mt-2 w-full text-left"
                required
              />

              <Button
                type="submit"
                disabled={isPending}
                className={clsx(
                  "mt-2 w-full text-white transition-colors",
                  bgCls,
                  hovCls
                )}
              >
                {isPending ? "Registrando…" : "Registrar"}
              </Button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
