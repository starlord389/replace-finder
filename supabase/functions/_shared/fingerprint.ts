// One-way requester fingerprint. Never stores raw IPs.
// Uses SHA-256 over a server-side salt + normalized client IP.

export function extractClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const first = (fwd.split(',')[0] || '').trim()
  return (first || req.headers.get('x-real-ip') || 'unknown').toLowerCase()
}

export async function requesterFingerprint(req: Request): Promise<string> {
  const salt = Deno.env.get('REQUESTER_FINGERPRINT_SALT') || ''
  const ip = extractClientIp(req)
  const data = new TextEncoder().encode(`${salt}::${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
