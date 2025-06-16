"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { forgotPassword } from "../actions"; // Importa a função de ação para redefinir a senha
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// Import dos componentes do formulário do shadcn
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ForgotPasswordFormValues {
  email: string;
}

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setLoading(true);
    // Cria um FormData a partir dos valores do formulário
    const formData = new FormData();
    formData.append("email", values.email);

    const response = await forgotPassword(formData);

    if (response.status === "success") {
      toast.success("Email enviado", {
        description: (
          <span className="text-gray-500">
            Verifique sua caixa de entrada para redefinir sua senha
          </span>
        ),
      });
    } else {
      // Exibe o erro no campo "email"
      form.setError("email", { message: response.status });
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Digite seu email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Enviando..." : "Restaurar Senha"}
        </Button>
      </form>
    </Form>
  );
}
