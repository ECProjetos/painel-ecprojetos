"use client"

import LoginForm from "@/app/(auth)/login/LoginForm"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[62%] md:block">
        <Image
          src="/images/login-background.png"
          alt="Plano de fundo do login"
          fill
          priority
          className="object-contain object-left-bottom opacity-70"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white" />
      </div>

      <div className="relative flex min-h-screen w-full items-center justify-end px-4 py-6 md:px-6">
        <div className="flex min-h-[calc(100vh-48px)] w-full items-center justify-center rounded-3xl border bg-white p-6 shadow-custom md:w-[42%] md:min-w-[622px] md:p-12">
          <div className="flex w-full flex-col items-center justify-center">
            <LoginForm />

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Esqueceu sua senha?{" "}
                <Link
                  href="/forgot-password"
                  className="font-medium text-blue-700 hover:underline"
                >
                  Clique aqui
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}