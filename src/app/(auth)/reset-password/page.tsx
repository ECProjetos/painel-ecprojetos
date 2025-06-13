"use client";

import ResetPasswordForm from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Fundo de vídeo */}
      <div className="absolute left-0 top-0 w-full h-full -z-10">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80 dark:to-black/70" />
        </div>
      </div>

      <section className="w-[400px] p-8 bg-white/80 backdrop-blur-md rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 dark:text-gray-100">
          Restaurar senha
        </h1>
        <ResetPasswordForm />
      </section>
    </div>
  );
}
