'use client";';

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen gap-4 ">
      <Link
        className={cn(buttonVariants({ variant: "default", size: "lg" }))}
        href="/login"
      >
        Login
      </Link>
      <Link
        className={cn(buttonVariants({ variant: "default", size: "lg" }))}
        href="/controle-horarios/inicio"
      >
        Controle de Horários
      </Link>
    </div>
  );
}
