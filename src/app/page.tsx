'use client';

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-100 via-white to-blue-200 text-gray-800">
      <div className="max-w-xl text-center space-y-6">
        {/* Título elegante */}
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-blue-900">
          Bem-vindo ao Sistema de Gestão
        </h1>

        {/* Subtítulo explicativo */}
        <p className="text-lg text-gray-600">
          Acesse sua conta ou vá direto para o Controle de Horários.
        </p>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            )}
          >
            Login
          </Link>
          <Link
            href="/controle-horarios/inicio"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto text-blue-700 border-blue-600 hover:bg-blue-50"
            )}
          >
            Controle de Horários
          </Link>
        </div>
      </div>
    </div>
  );
}
