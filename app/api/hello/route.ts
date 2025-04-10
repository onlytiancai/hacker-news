// app/api/hello/route.ts

import { NextResponse } from 'next/server'

export async function GET() {
  const { searchParams } = new URL(request.url)
  const today = searchParams.get('day')
  return NextResponse.json({ message: `${today} ok!` })
}
