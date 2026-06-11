import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'

export async function serverFetch<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get('access_token')?.value
  if (!token) return null
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}
