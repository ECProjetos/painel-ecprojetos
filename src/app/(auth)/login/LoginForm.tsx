"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Login, loginWithToken } from "../actions";
import { toast } from "sonner";

// Import dos componentes do formulário do shadcn
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Caso haja token na URL, tenta fazer login via token
  const tokenMutation = useMutation({
    mutationFn: async (code: string) => loginWithToken(code),
    onSuccess: (data) => {
      if (!data.error) {
        location.reload();
      }
    },
  });

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      tokenMutation.mutate(code);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mutação para login tradicional
  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      // Cria um FormData a partir dos valores do formulário
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);
      return Login(formData);
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error("Erro ao fazer login", {
          description: <span className="text-gray-500">{data.error}</span>,
        });
      } else if (data.success) {
        toast.success("Login Realizado com sucesso", {
          description: <span className="text-gray-500">{data.success}</span>,
        });
        router.push("/controle-horarios/inicio");
      }
    },
  });

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  return (
    <div className="flex flex-col w-full h-full max-w-xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-start p-0">
          <Image src="/logo.png" alt="Logo" width={150} height={45} />
        </div>
      </div>
      <div className="flex flex-col w-full h-full items-center justify-center gap-6 px-4 md:px-24">
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-2xl font-semibold text-slate-800">
            Acesse sua conta
          </h1>
          <p className="text-sm text-center text-slate-400">
            Insira seus dados abaixo para continuar.
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col w-full gap-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Digite seu e-mail"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Digite sua senha"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
