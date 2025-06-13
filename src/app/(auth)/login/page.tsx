"use client";

import LoginForm from "@/app/(auth)/login/LoginForm";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen relative overflow-hidden">
      <div className="absolute left-0 top-0 w-full h-full -z-10">
        <div className="relative w-full h-full">
          <Image
            src="/images/login-background.avif"
            alt="Plano de fundo do login"
            width={1920} // largura em px
            height={1080} // altura em px
            priority // opcional: para pré-carregar a imagem
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80" />
        </div>
      </div>

      <div className="w-dvw h-screen relative">
        <div className="w-full h-full flex items-center justify-end">
          <div className="w-full md:w-2/5 min-w-none md:min-w-[622px] h-dvh p-2 md:p-4 transition">
            <div className="flex flex-col w-full items-center justify-center h-full transition bg-white border shadow-custom p-4 rounded-3xl md:p-12">
              <div className="w-full h-full relative flex flex-col items-center justify-center">
                <LoginForm />
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Esqueceu sua senha?{" "}
                    <Link href="/forgot-password">Clique aqui</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
