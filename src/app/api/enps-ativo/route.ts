// src/app/api/enps-ativo/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { fetchEnpsAtivo } from '@/app/actions/satisfacao/criar-enps'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const ano = searchParams.get('ano')
  const periodo = searchParams.get('periodo')

  if (!ano || !periodo) {
    return NextResponse.json({ error: 'Ano e período são obrigatórios' }, { status: 400 })
  }

  try {
    const data = await fetchEnpsAtivo(ano, periodo)
    return NextResponse.json({ data })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
