import { NextResponse } from 'next/server'

const memoryStore = new Map<string, number[]>()

export class MemoryRatelimit {
  private limitCount: number
  private windowMs: number

  constructor(limit: number, windowStr: string) {
    this.limitCount = limit
    const match = windowStr.match(/^(\d+)\s*(h|m|s|d)$/)
    let ms = 60 * 1000
    if (match) {
      const val = parseInt(match[1])
      const unit = match[2]
      if (unit === 's') ms = val * 1000
      else if (unit === 'm') ms = val * 60 * 1000
      else if (unit === 'h') ms = val * 60 * 60 * 1000
      else if (unit === 'd') ms = val * 24 * 60 * 60 * 1000
    }
    this.windowMs = ms
  }

  async limit(key: string) {
    const now = Date.now()
    const timestamps = memoryStore.get(key) || []
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs)

    if (validTimestamps.length >= this.limitCount) {
      const oldest = validTimestamps[0]
      const reset = oldest + this.windowMs
      return { success: false, reset, remaining: 0 }
    }

    validTimestamps.push(now)
    memoryStore.set(key, validTimestamps)
    return { success: true, reset: now + this.windowMs, remaining: this.limitCount - validTimestamps.length }
  }
}

export async function rateLimit(
  key: string,
  limiter: MemoryRatelimit | null
): Promise<{ success: boolean; response?: NextResponse }> {
  if (!limiter) return { success: true }

  const { success, reset } = await limiter.limit(key)

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    const response = NextResponse.json(
      { error: 'Too Many Requests', retryAfterSeconds: Math.max(retryAfter, 0) },
      { status: 429 }
    )
    response.headers.set('Retry-After', String(Math.max(retryAfter, 0)))
    return { success: false, response }
  }

  return { success: true }
}

export const workspaceCreateLimiter = new MemoryRatelimit(5, '1 h')
export const contactCreateLimiter = new MemoryRatelimit(100, '1 m')
export const webhookLimiter = new MemoryRatelimit(50, '1 m')
